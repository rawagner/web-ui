import React from 'react';
import { shallow } from 'enzyme';

import { ConfigurationSummary } from '..';

import { default as ConfigurationSummaryFixture } from '../fixtures/ConfigurationSummary.fixture';

const testConfigurationSummary = () => <ConfigurationSummary {...ConfigurationSummaryFixture.props} />;

describe('<ConfigurationSummary />', () => {
  it('renders correctly', () => {
    const component = shallow(testConfigurationSummary());
    expect(component).toMatchSnapshot();
  });
});
