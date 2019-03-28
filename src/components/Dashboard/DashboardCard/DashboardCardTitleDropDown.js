import React from 'react';
import PropTypes from 'prop-types';

import { getFormElement } from '../../Form';
import { DROPDOWN } from '../../Form/constants';

const TOP_CONSUMERS_DROPDOWN = ['Projects', 'Nodes', 'SL Classes', 'Workloads', 'VMs', 'Pods'];

// TODO: Make the dropdown generic
class DashboardCardTitleDropDown extends React.PureComponent {
    //   if (React.Children.count(children) === 0) {
    //     return null;
    //   }
    constructor(props) {
        super(props);
    }

    onDropdownChange = (key, newValue) => this.setState({ [key]: newValue });

    render() {
        const filterDropdown = {
            id: 'type-dropdown',
            type: DROPDOWN,
            choices: TOP_CONSUMERS_DROPDOWN,
            //onChange: newValue => this.onDropdownChange('filter', newValue),
            value: TOP_CONSUMERS_DROPDOWN[0],
        };
        return (
            <div>
                {getFormElement(filterDropdown)}
            </div>
        )
    };
};

DashboardCardTitleDropDown.defaultProps = {
    children: null,
};

DashboardCardTitleDropDown.propTypes = {
    children: PropTypes.node,
};

export default DashboardCardTitleDropDown;
