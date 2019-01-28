import { has } from 'lodash';

import { VirtualMachineModel } from '../models';
import {
  getVolumes,
  getNamespace,
  getName,
  getInterfaces,
  getPvcAccessModes,
  getPvcStorageSize,
  getDataVolumeAccessModes,
  getDataVolumeStorageSize,
  getPvcStorageClassName,
  getDataVolumeStorageClassName,
} from '../utils/selectors';
import { getStartStopPatch, generateDiskName } from '../utils';
import { addDataVolumeTemplate, addTemplateLabel } from './vmBuilder';
import { TEMPLATE_VM_NAME_LABEL } from '../constants';

export const clone = async (
  k8sCreate,
  k8sPatch,
  vm,
  newName,
  newNamespace,
  newDescription,
  startVm,
  persistentVolumeClaims,
  dataVolumes
) => {
  const stopVmPatch = getStartStopPatch(vm, false);
  await k8sPatch(VirtualMachineModel, vm, stopVmPatch);

  cleanVm(vm);
  cleanNetworks(vm);

  addPvcClones(vm, newName, persistentVolumeClaims);
  addDataVolumeClones(vm, newName, dataVolumes);

  updateVm(vm, newName, newNamespace, newDescription, startVm);

  return k8sCreate(VirtualMachineModel, vm);
};

export const updateDisks = (vm, clonedDisks) => {
  clonedDisks.forEach(disk => {
    const volume = getVolumes(vm).find(v => v.name === disk.volumeName);

    if (volume) {
      if (volume.persistentVolumeClaim) {
        delete volume.persistentVolumeClaim;
      }

      volume.dataVolume = {
        name: getName(disk.result),
      };
    }
  });
};

const cleanNetworks = vm => {
  getInterfaces(vm).forEach(intface => delete intface.macAddress);
};

const cleanVm = vm => {
  delete vm.metadata.selfLink;
  delete vm.metadata.resourceVersion;
  delete vm.metadata.uid;
  delete vm.metadata.creationTimestamp;
  delete vm.metadata.generation;

  // delete all datavolumetemplates
  if (has(vm.spec, 'dataVolumeTemplates')) {
    delete vm.spec.dataVolumeTemplates;
  }

  delete vm.status;
};

const updateVm = (vm, name, namespace, description, startVm) => {
  vm.metadata.name = name;
  vm.metadata.namespace = namespace;
  vm.metadata.annotations = {
    ...(vm.metadata.annotations || {}),
    description,
  };

  addTemplateLabel(vm, TEMPLATE_VM_NAME_LABEL, name); // for pairing service-vm (like for RDP)

  vm.spec = {
    ...(vm.spec || {}),
    running: startVm,
  };
};

const addDataVolumeClones = (vm, newName, dataVolumes) => {
  const volumes = getVolumes(vm);
  volumes.filter(volume => volume.dataVolume).forEach(volume => {
    const dvName = volume.dataVolume.name;
    const dataVolume = dataVolumes.find(dv => getName(dv) === dvName && getNamespace(dv) === getNamespace(vm));

    if (dataVolume) {
      const template = addTemplateClone(
        vm,
        dvName,
        getNamespace(dataVolume),
        getDataVolumeAccessModes(dataVolume),
        getDataVolumeStorageSize(dataVolume),
        getDataVolumeStorageClassName(dataVolume),
        newName
      );
      volume.dataVolume = {
        name: getName(template),
      };
    }
  });
};

const addPvcClones = (vm, newName, persistentVolumeClaims) => {
  const volumes = getVolumes(vm);
  volumes.filter(volume => volume.persistentVolumeClaim).forEach(volume => {
    const pvcName = volume.persistentVolumeClaim.claimName;
    const pvc = persistentVolumeClaims.find(p => getName(p) === pvcName && getNamespace(p) === getNamespace(vm));
    const template = addTemplateClone(
      vm,
      pvcName,
      getNamespace(pvc),
      getPvcAccessModes(pvc),
      getPvcStorageSize(pvc),
      getPvcStorageClassName(pvc),
      newName
    );
    delete volume.persistentVolumeClaim;
    volume.dataVolume = {
      name: getName(template),
    };
  });
};

export const addTemplateClone = (vm, pvcName, pvcNamespace, accessModes, size, storageClassName, vmName) => {
  const template = getPvcCloneTemplate(pvcName, pvcNamespace, accessModes, size, storageClassName, vmName);
  return addDataVolumeTemplate(vm, template);
};

const getPvcCloneTemplate = (pvcName, pvcNamespace, accessModes, size, storageClassName, vmName) => ({
  metadata: {
    name: generateDiskName(vmName, pvcName, true),
  },
  spec: {
    source: {
      pvc: {
        name: pvcName,
        namespace: pvcNamespace,
      },
    },
    pvc: {
      accessModes,
      resources: {
        requests: {
          storage: size,
        },
      },
      storageClassName,
    },
  },
});
