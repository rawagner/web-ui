import React from 'react';
import { render } from 'enzyme';

import { ClusterTopConsumers } from '../ClusterTopConsumers';
import { default as ClusterConsumersFixtures } from '../fixtures/ClusterTopConsumers.fixture';

const testClusterTopConsumersOverview = () => <ClusterTopConsumers {...ClusterConsumersFixtures.props} />;

describe('<ClusterTopConsumers />', () => {
  it('renders correctly', () => {
    const component = render(testClusterTopConsumersOverview());
    expect(component).toMatchSnapshot();
  });
});
