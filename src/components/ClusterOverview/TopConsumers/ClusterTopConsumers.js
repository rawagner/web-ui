import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import { TopConsumers } from './TopConsumers';
import { InlineLoading } from '../../Loading';
import { ClusterOverviewContextGenericConsumer } from '../ClusterOverviewContext';
import { PodModel, NodeModel } from '../../../models';
import { formatBytes as utilFormatBytes } from '../../../utils';

const formatCpu = (cpuTime, fixed = 0) => Number(cpuTime).toFixed(fixed);

const formatBytes = memory => {
  const bytes = utilFormatBytes(memory);
  return `${bytes.value} ${bytes.unit}`;
};

const getConsumers = (kind, results, nameLabel, formatLabel) => {
  if (!results) {
    return null;
  }
  const result = get(results, 'data.result');
  return result.map(r => ({
    kind,
    name: r.metric[nameLabel],
    usage: r.value[1],
    label: formatLabel ? formatLabel(r.value[1]) : r.value[1],
  }));
};

export const ClusterTopConsumers = ({
  workloadCpuResults,
  workloadMemoryResults,
  workloadStorageResults,
  workloadNetworkResults,
  infraCpuResults,
  infraMemoryResults,
  infraStorageResults,
  infraNetworkResults,
  LoadingComponent,
}) => {
  const metrics = [
    {
      title: 'Workloads',
      metrics: {
        cpu: {
          title: 'CPU',
          description: 'CPU time',
          consumers: getConsumers(PodModel.kind, workloadCpuResults, 'pod_name', formatCpu),
          isLoading: !workloadCpuResults,
        },
        memory: {
          title: 'Memory',
          description: 'Memory consumption',
          consumers: getConsumers(PodModel.kind, workloadMemoryResults, 'pod_name', formatBytes),
          isLoading: !workloadMemoryResults,
        },
        storage: {
          title: 'Storage',
          description: 'Storage consumption',
          consumers: getConsumers(PodModel.kind, workloadStorageResults, 'pod_name', formatBytes),
          isLoading: !workloadStorageResults,
        },
        network: {
          title: 'Network',
          description: 'Network utilization',
          consumers: getConsumers(PodModel.kind, workloadNetworkResults, 'pod_name'),
          isLoading: !workloadNetworkResults,
        },
      },
    },
    {
      title: 'Infrastructure',
      metrics: {
        cpu: {
          title: 'CPU',
          description: 'Used CPU cores',
          consumers: getConsumers(NodeModel.kind, infraCpuResults, 'node', cpu => formatCpu(cpu, 1)),
          isLoading: !infraCpuResults,
        },
        memory: {
          title: 'Memory',
          description: 'Memory consumption',
          consumers: getConsumers(NodeModel.kind, infraMemoryResults, 'node', formatBytes),
          isLoading: !infraMemoryResults,
        },
        storage: {
          title: 'Storage',
          description: 'Storage consumption',
          consumers: getConsumers(NodeModel.kind, infraStorageResults, 'node', formatBytes),
          isLoading: !infraStorageResults,
        },
        network: {
          title: 'Network',
          description: 'Network utilization',
          consumers: getConsumers(NodeModel.kind, infraNetworkResults, 'node'),
          isLoading: !infraNetworkResults,
        },
      },
    },
  ];

  return <TopConsumers metrics={metrics} LoadingComponent={LoadingComponent} />;
};

ClusterTopConsumers.defaultProps = {
  workloadCpuResults: null,
  workloadMemoryResults: null,
  workloadStorageResults: null,
  workloadNetworkResults: null,
  infraCpuResults: null,
  infraMemoryResults: null,
  infraStorageResults: null,
  infraNetworkResults: null,
  LoadingComponent: InlineLoading,
};

ClusterTopConsumers.propTypes = {
  infraCpuResults: PropTypes.object,
  infraMemoryResults: PropTypes.object,
  infraStorageResults: PropTypes.object,
  infraNetworkResults: PropTypes.object,
  workloadCpuResults: PropTypes.object,
  workloadMemoryResults: PropTypes.object,
  workloadStorageResults: PropTypes.object,
  workloadNetworkResults: PropTypes.object,
  LoadingComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};

export const ClusterTopConsumersConnected = () => (
  <ClusterOverviewContextGenericConsumer Component={ClusterTopConsumers} dataPath="consumersData" />
);
