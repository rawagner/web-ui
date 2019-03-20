import { TopConsumers } from '../TopConsumers';
import { PodModel, VirtualMachineModel, NodeModel } from '../../../../models';

export const consumersData = {
  metrics: [
    {
      title: 'Workloads',
      metrics: {
        cpu: {
          title: 'CPU',
          description: 'CPU time',
          consumers: [
            {
              kind: PodModel.kind,
              name: 'Pod1',
              usage: '80',
              label: 'label1',
            },
            {
              kind: PodModel.kind,
              name: 'Pod2',
              usage: '40',
              label: 'label2',
            },
            {
              kind: PodModel.kind,
              name: 'Pod3',
              usage: '70',
              label: 'label3',
            },
            {
              kind: VirtualMachineModel.kind,
              name: 'VM1',
              usage: '20',
              label: 'label4',
            },
            {
              kind: VirtualMachineModel.kind,
              name: 'VM3',
              usage: '100',
              label: 'label5',
            },
          ],
        },
        memory: {
          title: 'Memory',
          description: 'Memory consumption',
          consumers: [
            {
              kind: PodModel.kind,
              name: 'Pod1',
              usage: '80',
              label: 'label1',
            },
            {
              kind: PodModel.kind,
              name: 'Pod2',
              usage: '40',
              label: 'label2',
            },
            {
              kind: PodModel.kind,
              name: 'Pod3',
              usage: '70',
              label: 'label3',
            },
            {
              kind: VirtualMachineModel.kind,
              name: 'VM1',
              usage: '20',
              label: 'label4',
            },
            {
              kind: VirtualMachineModel.kind,
              name: 'VM3',
              usage: '100',
              label: 'label5',
            },
          ],
        },
      },
    },
    {
      title: 'Infrastructure',
      metrics: {
        cpu: {
          title: 'CPU',
          description: 'CPU time',
          consumers: [
            {
              kind: NodeModel.kind,
              name: 'Node1',
              usage: '80',
              label: 'label1',
            },
            {
              kind: NodeModel.kind,
              name: 'Node2',
              usage: '40',
              label: 'label2',
            },
            {
              kind: NodeModel.kind,
              name: 'Node3',
              usage: '70',
              label: 'label3',
            },
            {
              kind: NodeModel.kind,
              name: 'Node4',
              usage: '20',
              label: 'label4',
            },
            {
              kind: NodeModel.kind,
              name: 'Node5',
              usage: '100',
              label: 'label5',
            },
          ],
        },
        memory: {
          title: 'Memory',
          description: 'Memory consumption',
          consumers: [
            {
              kind: NodeModel.kind,
              name: 'Node1',
              usage: '80',
              label: 'label1',
            },
            {
              kind: NodeModel.kind,
              name: 'Node2',
              usage: '40',
              label: 'label2',
            },
            {
              kind: NodeModel.kind,
              name: 'Node3',
              usage: '70',
              label: 'label3',
            },
            {
              kind: NodeModel.kind,
              name: 'Node4',
              usage: '20',
              label: 'label4',
            },
            {
              kind: NodeModel.kind,
              name: 'Node5',
              usage: '100',
              label: 'label5',
            },
          ],
        },
      },
    },
  ],
};

export const loadingConsumersData = {
  metrics: [
    {
      title: 'Workloads',
      metrics: {
        cpu: {
          title: 'CPU',
          description: 'CPU time',
          isLoading: true,
        },
        memory: {
          title: 'Memory',
          description: 'Memory consumption',
          isLoading: true,
        },
      },
    },
    {
      title: 'Infrastructure',
      metrics: {
        cpu: {
          title: 'CPU',
          description: 'CPU time',
          isLoading: true,
        },
        memory: {
          title: 'Memory',
          description: 'Memory consumption',
          isLoading: true,
        },
      },
    },
  ],
};

export default [
  {
    component: TopConsumers,
    props: { ...consumersData },
  },
  {
    component: TopConsumers,
    name: 'Loading top consumers',
    props: { ...loadingConsumersData },
  },
];
