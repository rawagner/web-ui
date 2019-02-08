import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import {
  VM_STATUS_VMI_WAITING,
  VM_STATUS_STARTING,
  VM_STATUS_RUNNING,
  VM_STATUS_OFF,
  VM_STATUS_POD_ERROR,
  VM_STATUS_ERROR,
  VM_STATUS_MIGRATING,
  VM_STATUS_DISKS_FAILED,
  VM_STATUS_PREPARING_DISKS,
  DATA_VOLUME_STATUS_PENDING,
  DATA_VOLUME_STATUS_UPLOAD_IN_PROGRESS,
  DATA_VOLUME_STATUS_CLONE_IN_PROGRESS,
  DATA_VOLUME_STATUS_IMPORT_IN_PROGRESS,
} from '../../constants';

import { getSubPagePath } from '../../utils';
import { PodModel, VirtualMachineModel } from '../../models';
import { getVmStatusDetail } from './getVmStatus';
import { getNamespace, getName } from '../../utils/selectors';
import { getVolumes } from '../../k8s/vmBuilder';

const StateValue = ({ iconClass, children, linkTo, message }) => (
  <Fragment>
    <span className={`kubevirt-vm-status__icon ${iconClass}`} aria-hidden="true" />
    {linkTo ? (
      <Link className="kubevirt-vm-status__link" to={linkTo} title={message}>
        {children}
      </Link>
    ) : (
      children
    )}
  </Fragment>
);
StateValue.propTypes = {
  children: PropTypes.any,
  iconClass: PropTypes.string.isRequired,
  linkTo: PropTypes.string,
  message: PropTypes.string,
};
StateValue.defaultProps = {
  children: null,
  linkTo: undefined,
  message: undefined,
};

const StateRunning = ({ ...props }) => (
  <StateValue iconClass="pficon pficon-on-running" {...props}>
    Running
  </StateValue>
);
const StateOff = () => <StateValue iconClass="pficon pficon-off">Off</StateValue>;
const StateUnknown = () => <StateValue iconClass="pficon pficon-unknown">Unknown</StateValue>;
const StateMigrating = () => <StateValue iconClass="pficon pficon-migration">Migrating</StateValue>;
const StateVmiWaiting = ({ ...props }) => (
  <StateValue iconClass="pficon pficon-pending" {...props}>
    Pending
  </StateValue>
);
const StateStarting = ({ ...props }) => (
  <StateValue iconClass="pficon pficon-pending" {...props}>
    Starting
  </StateValue>
);
const StateDisks = ({ vm, statusDetail, verbose }) => {
  const linkTo = statusDetail.pod
    ? getSubPagePath(statusDetail.pod, PodModel, 'events')
    : getSubPagePath(vm, VirtualMachineModel, 'events');
  switch (statusDetail.status) {
    case VM_STATUS_PREPARING_DISKS:
      switch (statusDetail.diskStatus) {
        case DATA_VOLUME_STATUS_PENDING:
          return (
            <StatePreparingDisks
              action="Preparing"
              linkTo={linkTo}
              diskName={statusDetail.diskName}
              verbose={verbose}
            />
          );
        case DATA_VOLUME_STATUS_UPLOAD_IN_PROGRESS:
          return (
            <StatePreparingDisks
              action="Uploading"
              linkTo={linkTo}
              diskName={statusDetail.diskName}
              verbose={verbose}
            />
          );
        case DATA_VOLUME_STATUS_CLONE_IN_PROGRESS:
          return (
            <StatePreparingDisks action="Cloning" linkTo={linkTo} diskName={statusDetail.diskName} verbose={verbose} />
          );
        case DATA_VOLUME_STATUS_IMPORT_IN_PROGRESS:
          return (
            <StatePreparingDisks
              action="Importing"
              linkTo={linkTo}
              diskName={statusDetail.diskName}
              verbose={verbose}
            />
          );
        default:
          return <StateUnknown />;
      }
    case VM_STATUS_DISKS_FAILED:
      return <StateError linkTo={linkTo}>{verbose ? `${statusDetail.diskName} disk failed` : 'Disk Error'}</StateError>;
    default:
      return <StateUnknown />;
  }
};
const StatePreparingDisks = ({ diskName, verbose, action, ...props }) => (
  <StateValue iconClass="pficon pficon-import" {...props}>
    {verbose ? `${action} disk ${diskName}` : `Preparing Disks`}
  </StateValue>
);
const StateError = ({ children, ...props }) => (
  <StateValue iconClass="pficon pficon-error-circle-o" {...props}>
    {children}
  </StateValue>
);

export const VmStatuses = props => {
  const { vm, launcherPod, cdiPods, migration, dataVolumes } = props;

  if (dataVolumes) {
    const vmDataVolumes = dataVolumes.filter(
      dv =>
        !!getVolumes(vm)
          .filter(volume => volume.dataVolume)
          .find(volume => volume.dataVolume.name === getName(dv) && getNamespace(vm) === getNamespace(dv))
    );

    const statuses = vmDataVolumes.map(vmDv => getVmStatusDetail(vm, launcherPod, cdiPods, migration, [vmDv]));
    const diskStatuses = statuses.filter(
      status => status.status === VM_STATUS_PREPARING_DISKS || status.status === VM_STATUS_DISKS_FAILED
    );

    if (diskStatuses.length > 0) {
      return diskStatuses.map(diskStatus => (
        <div key={diskStatus.diskName}>{showVmStatus(vm, launcherPod, diskStatus, true)}</div>
      ));
    }
  }

  return <VmStatus {...props} />;
};

VmStatuses.defaultProps = {
  launcherPod: undefined,
  cdiPods: undefined,
  migration: undefined,
  dataVolumes: undefined,
};

VmStatuses.propTypes = {
  vm: PropTypes.object.isRequired,
  launcherPod: PropTypes.object,
  cdiPods: PropTypes.array,
  migration: PropTypes.object,
  dataVolumes: PropTypes.array,
};

const showVmStatus = (vm, launcherPod, statusDetail, verbose) => {
  switch (statusDetail.status) {
    case VM_STATUS_OFF:
      return <StateOff />;
    case VM_STATUS_RUNNING:
      return <StateRunning linkTo={getSubPagePath(launcherPod, PodModel)} />;
    case VM_STATUS_VMI_WAITING:
      return <StateVmiWaiting linkTo={getSubPagePath(vm, VirtualMachineModel, 'events')} />;
    case VM_STATUS_STARTING:
      return <StateStarting linkTo={getSubPagePath(launcherPod, PodModel, 'events')} message={statusDetail.message} />;
    case VM_STATUS_PREPARING_DISKS:
    case VM_STATUS_DISKS_FAILED:
      return <StateDisks vm={vm} statusDetail={statusDetail} verbose={verbose} />;
    case VM_STATUS_MIGRATING:
      return <StateMigrating />; // TODO: add linkTo once migration monitoring page is available
    case VM_STATUS_POD_ERROR:
      return (
        <StateError linkTo={getSubPagePath(launcherPod, PodModel, 'events')} message={statusDetail.message}>
          Pod Error
        </StateError>
      );
    case VM_STATUS_ERROR:
      return (
        <StateError linkTo={getSubPagePath(vm, VirtualMachineModel, 'events')} message={statusDetail.message}>
          VM Error
        </StateError>
      );
    default:
      return <StateUnknown />; // Let's hope this state is tentative and will fit former conditions soon
  }
};

export const VmStatus = ({ vm, launcherPod, cdiPods, migration, dataVolumes }) => {
  const statusDetail = getVmStatusDetail(vm, launcherPod, cdiPods, migration, dataVolumes);
  return showVmStatus(vm, launcherPod, statusDetail);
};

VmStatus.defaultProps = {
  launcherPod: undefined,
  cdiPods: undefined,
  migration: undefined,
  dataVolumes: undefined,
};

VmStatus.propTypes = {
  vm: PropTypes.object.isRequired,
  launcherPod: PropTypes.object,
  cdiPods: PropTypes.array,
  migration: PropTypes.object,
  dataVolumes: PropTypes.array,
};
