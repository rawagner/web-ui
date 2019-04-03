import React from 'react';
import PropTypes from 'prop-types';

import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardTitleHelp,
} from '../../Dashboard/DashboardCard';
import { ClusterOverviewContext } from '../ClusterOverviewContext';
import { mapNodesToProps, mapPodsToProps, mapPvcsToProps, mapVmsToProps } from './utils';
import { InventoryRow } from '../../Dashboard/Inventory/InventoryRow';
import { PureCard } from '../PureCard';

const InventoryBody = ({ nodes, pods, vms, vmis, pvcs, migrations }) => (
  <React.Fragment>
    <InventoryRow title="Nodes" {...mapNodesToProps(nodes)} />
    <InventoryRow title="PVCs" {...mapPvcsToProps(pvcs)} />
    <InventoryRow title="Pods" {...mapPodsToProps(pods)} />
    <InventoryRow title="VMs" {...mapVmsToProps(vms, pods, migrations)} />
  </React.Fragment>
);

InventoryBody.defaultProps = {
  nodes: undefined,
  pods: undefined,
  vms: undefined,
  vmis: undefined,
  pvcs: undefined,
  migrations: undefined,
};

InventoryBody.propTypes = {
  nodes: PropTypes.array,
  pods: PropTypes.array,
  vms: PropTypes.array,
  vmis: PropTypes.array,
  pvcs: PropTypes.array,
  migrations: PropTypes.array,
};

export class Inventory extends PureCard {
  constructor(props) {
    super(props, Object.keys(Inventory.defaultProps));
  }
  
  render() {
    return (
      <DashboardCard>
        <DashboardCardHeader>
          <DashboardCardTitle>Cluster inventory</DashboardCardTitle>
          <DashboardCardTitleHelp>help for inventory</DashboardCardTitleHelp>
        </DashboardCardHeader>
        <DashboardCardBody>
          <InventoryBody {...this.props} />
        </DashboardCardBody>
      </DashboardCard>
    );
  }
};

Inventory.defaultProps = {
  ...InventoryBody.defaultProps,
};

Inventory.propTypes = {
  ...InventoryBody.propTypes,
};

export const InventoryConnected = () => (
  <ClusterOverviewContext.Consumer>{props => <Inventory {...props} />}</ClusterOverviewContext.Consumer>
);
