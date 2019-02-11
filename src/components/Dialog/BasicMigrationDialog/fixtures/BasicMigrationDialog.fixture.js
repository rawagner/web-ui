import { BasicMigrationDialog } from '../BasicMigrationDialog';
import { k8sCreate } from '../../../Wizard/CreateVmWizard/fixtures/CreateVmWizard.fixture';
import { blueVmi } from '../../../../tests/mocks/vmi/blue.mock';

export default [
  {
    component: BasicMigrationDialog,
    props: {
      onClose: () => {},
      onCancel: () => {},
      onMigrationError: () => {},
      k8sCreate,
      virtualMachineInstance: blueVmi,
    },
  },
];
