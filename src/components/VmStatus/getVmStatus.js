import { get, includes } from 'lodash';

import {
  VM_STATUS_POD_ERROR,
  VM_STATUS_ERROR,
  VM_STATUS_MIGRATING,
  VM_STATUS_OFF,
  VM_STATUS_RUNNING,
  VM_STATUS_STARTING,
  VM_STATUS_VMI_WAITING,
  VM_STATUS_UNKNOWN,
  VM_STATUS_OTHER,
  VM_STATUS_DISKS_FAILED,
  VM_STATUS_PREPARING_DISKS,
  DATA_VOLUME_STATUS_PENDING,
  DATA_VOLUME_STATUS_PVC_BOUND,
  DATA_VOLUME_STATUS_CLONE_SCHEDULED,
  DATA_VOLUME_STATUS_UPLOAD_SCHEDULED,
  DATA_VOLUME_STATUS_IMPORT_SCHEDULED,
  DATA_VOLUME_STATUS_CLONE_IN_PROGRESS,
  DATA_VOLUME_STATUS_UPLOAD_IN_PROGRESS,
  DATA_VOLUME_STATUS_IMPORT_IN_PROGRESS,
  DATA_VOLUME_STATUS_FAILED,
} from '../../constants';
import { getName, getNamespace, getVolumes, getLabels } from '../../utils';

const NOT_HANDLED = null;

const failingContainerStatus = ['ImagePullBackOff', 'ErrImagePull', 'CrashLoopBackOff'];

const isMigrationStatus = (migration, status) => {
  const phase = get(migration, 'status.phase');
  return phase && phase.toLowerCase() === status.toLowerCase();
};

const getConditionOfType = (pod, type) => get(pod, 'status.conditions', []).find(condition => condition.type === type);

const getNotRedyConditionMessage = pod => {
  const notReadyCondition = get(pod, 'status.conditions', []).find(condition => condition.status !== 'True');
  if (notReadyCondition) {
    // at least one pod condition not met. This can be just tentative, let the user analyze progress via Pod events
    return notReadyCondition.message || `Step: ${notReadyCondition.type}`;
  }
  return undefined;
};

const getFailingContainerStatus = pod =>
  get(pod, 'status.containerStatuses', []).find(
    container => !container.ready && includes(failingContainerStatus, get(container, 'state.waiting.reason'))
  );

const getContainerStatusReason = containerStatus => {
  const status = Object.getOwnPropertyNames(containerStatus.state).find(pn => !!containerStatus.state[pn].reason);
  return status ? containerStatus.state[status].message : undefined;
};

const isSchedulable = pod => {
  const podScheduledCond = getConditionOfType(pod, 'PodScheduled');
  return !(podScheduledCond && podScheduledCond.status !== 'True' && podScheduledCond.reason === 'Unschedulable');
};

export const isRunning = vm => {
  if (!get(vm, 'spec.running', false)) {
    return { status: VM_STATUS_OFF };
  }
  // spec.running === true
  return NOT_HANDLED;
};

const isReady = vm => {
  if (get(vm, 'status.ready', false)) {
    // we are all set
    return { status: VM_STATUS_RUNNING };
  }
  return NOT_HANDLED;
};

const isCreated = (vm, launcherPod = null) => {
  if (get(vm, 'status.created', false)) {
    // created but not yet ready
    let message;
    if (launcherPod) {
      // pod created, so check for it's potential error
      if (!isSchedulable(launcherPod)) {
        return { status: VM_STATUS_POD_ERROR, message: 'Pod scheduling failed.' };
      }

      const failingContainer = getFailingContainerStatus(launcherPod);
      if (failingContainer) {
        return { status: VM_STATUS_POD_ERROR, message: getContainerStatusReason(failingContainer) };
      }

      message = getNotRedyConditionMessage(launcherPod);
    }
    return { status: VM_STATUS_STARTING, message };
  }
  return NOT_HANDLED;
};

const isVmError = vm => {
  // is an issue with the VM definition?
  const condition = get(vm, 'status.conditions[0]');
  if (condition) {
    // Do we need to analyze additional conditions in the array? Probably not.
    if (condition.type === 'Failure') {
      return { status: VM_STATUS_ERROR, message: condition.message };
    }
  }
  return NOT_HANDLED;
};

export const isBeingMigrated = migration => {
  if (migration) {
    if (!isMigrationStatus(migration, 'succeeded') && !isMigrationStatus(migration, 'failed')) {
      return { status: VM_STATUS_MIGRATING, message: get(migration, 'status.phase') };
    }
  }
  return NOT_HANDLED;
};

const isWaitingForVmi = vm => {
  // assumption: spec.running === true
  if (!get(vm, 'status.created', false)) {
    return { status: VM_STATUS_VMI_WAITING };
  }
  return NOT_HANDLED;
};

const findCdiPod = (volume, cdiPods = []) =>
  cdiPods.find(pod => {
    const podName = getName(pod);
    const dataVolumeName = volume.dataVolume.name;
    // upload dataVolume pod
    if (podName === `cdi-upload-${dataVolumeName}`) {
      return true;
    }
    // import dataVolume pod
    const importerPodName = `importer-${dataVolumeName}-`;
    if (podName.startsWith(importerPodName) && podName.length === importerPodName.length + 5) {
      return true;
    }
    // clone dataVolume pod
    if (getLabels(pod)['cdi.kubevirt.io/storage.clone.cloneUniqeId'] === `${dataVolumeName}-target-pod`) {
      return true;
    }
    return false;
  });

const getPodError = cdiPod => {
  if (cdiPod) {
    if (!isSchedulable(cdiPod)) {
      return 'Pod scheduling failed.';
    }

    const failingContainer = getFailingContainerStatus(cdiPod);
    if (failingContainer) {
      return getContainerStatusReason(failingContainer);
    }
  }
  return NOT_HANDLED;
};

export const isPreparingDisks = (vm, cdiPods, dataVolumes) => {
  const diskStatuses = [];
  if (dataVolumes) {
    const dataVolumeVolumes = getVolumes(vm).filter(v => v.dataVolume);
    dataVolumeVolumes.forEach(volume => {
      const dVolume = dataVolumes.find(
        dv => getName(dv) === volume.dataVolume.name && getNamespace(dv) === getNamespace(vm)
      );
      if (dVolume) {
        const pod = findCdiPod(volume, cdiPods);
        const podError = getPodError(pod);
        const diskStatus = {
          diskName: volume.name,
          pod,
        };
        if (podError) {
          diskStatuses.push({
            ...diskStatus,
            status: VM_STATUS_DISKS_FAILED,
            message: podError,
          });
        } else {
          switch (get(dVolume, 'status.phase')) {
            case DATA_VOLUME_STATUS_PENDING:
            case DATA_VOLUME_STATUS_PVC_BOUND:
              diskStatuses.push({
                ...diskStatus,
                status: VM_STATUS_PREPARING_DISKS,
                diskStatus: DATA_VOLUME_STATUS_PENDING,
              });
              break;
            case DATA_VOLUME_STATUS_CLONE_SCHEDULED:
            case DATA_VOLUME_STATUS_CLONE_IN_PROGRESS:
              diskStatuses.push({
                ...diskStatus,
                status: VM_STATUS_PREPARING_DISKS,
                diskStatus: DATA_VOLUME_STATUS_CLONE_IN_PROGRESS,
              });
              break;
            case DATA_VOLUME_STATUS_UPLOAD_SCHEDULED:
            case DATA_VOLUME_STATUS_UPLOAD_IN_PROGRESS:
              diskStatuses.push({
                ...diskStatus,
                status: VM_STATUS_PREPARING_DISKS,
                diskStatus: DATA_VOLUME_STATUS_UPLOAD_IN_PROGRESS,
              });
              break;
            case DATA_VOLUME_STATUS_IMPORT_SCHEDULED:
            case DATA_VOLUME_STATUS_IMPORT_IN_PROGRESS:
              diskStatuses.push({
                ...diskStatus,
                status: VM_STATUS_PREPARING_DISKS,
                diskStatus: DATA_VOLUME_STATUS_IMPORT_IN_PROGRESS,
              });
              break;
            case DATA_VOLUME_STATUS_FAILED:
              diskStatuses.push({
                ...diskStatus,
                status: VM_STATUS_DISKS_FAILED,
                diskStatus: DATA_VOLUME_STATUS_FAILED,
                message: `Failed preparing ${volume.name} disk`,
              });
              break;
            default:
              break;
          }
        }
      }
    });
  }
  if (diskStatuses.length === 1) {
    return diskStatuses[0];
  }
  if (diskStatuses.length > 1) {
    const failedDiskStatus = diskStatuses.find(ds => ds.status === VM_STATUS_DISKS_FAILED);
    return failedDiskStatus || { status: VM_STATUS_PREPARING_DISKS };
  }
  return NOT_HANDLED;
};

export const getVmStatusDetail = (vm, launcherPod, cdiPods, migration, dataVolumes) =>
  isBeingMigrated(migration) || // must be precceding isRunning() since vm.status.ready is true for a migrating VM
  isRunning(vm) ||
  isReady(vm) ||
  isVmError(vm) ||
  isCreated(vm, launcherPod) ||
  isPreparingDisks(vm, cdiPods, dataVolumes) ||
  isWaitingForVmi(vm) || { status: VM_STATUS_UNKNOWN };

export const getVmStatus = (vm, launcherPod, cdiPods, migration, dataVolumes) => {
  const vmStatus = getVmStatusDetail(vm, launcherPod, cdiPods, migration, dataVolumes).status;
  return vmStatus === VM_STATUS_OFF || vmStatus === VM_STATUS_RUNNING ? vmStatus : VM_STATUS_OTHER;
};

export const isVmiRunning = vmi => get(vmi, 'status.phase') === 'Running';
export const isVmStarting = (vm, vmi) => get(vm, 'spec.running') && !isVmiRunning(vmi);
