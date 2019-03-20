import React from 'react';
import { ProgressBar, OverlayTrigger, Tooltip, Col, Row } from 'patternfly-react';
import PropTypes from 'prop-types';

import { getFormElement } from '../../Form';
import { DROPDOWN } from '../../Form/constants';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardTitleHelp,
} from '../../Dashboard/DashboardCard';
import { ClusterOverviewContextGenericConsumer } from '../ClusterOverviewContext';
import { InlineLoading } from '../../Loading';

const ConsumersBar = ({ now, description, label }) => (
  <Row className="kubevirt-consumers__bar">
    <Col lg={4} md={4} sm={4} xs={4}>
      <OverlayTrigger
        overlay={<Tooltip id={`tooltip-for-${description}`}>{description}</Tooltip>}
        placement="top"
        trigger={['hover', 'focus']}
        rootClose={false}
      >
        <div className="kubevirt-consumers__bar-description">{description}</div>
      </OverlayTrigger>
    </Col>
    <Col lg={5} md={5} sm={5} xs={5} className="kubevirt-consumers__bar-column-progress">
      <div className="progress kubevirt-consumers__bar-progress">
        <ProgressBar min={0} max={100} now={now} key={1} isChild />
        <ProgressBar min={0} max={100} now={100 - now} key={2} bsClass="progress-bar progress-bar-remaining" isChild />
      </div>
    </Col>
    <Col lg={3} md={3} sm={3} xs={3} className="kubevirt-consumers__bar-label">
      <OverlayTrigger
        overlay={<Tooltip id={`tooltip-for-${label}`}>{label}</Tooltip>}
        placement="top"
        trigger={['hover', 'focus']}
        rootClose={false}
      >
        <span>{label}</span>
      </OverlayTrigger>
    </Col>
  </Row>
);

ConsumersBar.propTypes = {
  now: PropTypes.number.isRequired,
  description: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

const getConsumers = metric => {
  const max = Math.max(...metric.consumers.map(c => c.usage));
  return metric.consumers
    .map(c => ({
      now: Math.round((100 * c.usage) / max),
      description: c.name,
      label: c.label,
    }))
    .sort((a, b) => b.now - a.now);
};

class TopConsumersBody extends React.PureComponent {
  constructor(props) {
    super(props);
    const typeMetrics = props.metrics[0].metrics;
    this.state = {
      type: props.metrics[0].title,
      sortBy: typeMetrics[Object.keys(typeMetrics)[0]].title,
    };
  }

  onDropdownChange = (key, newValue) => this.setState({ [key]: newValue });

  render() {
    const { metrics, LoadingComponent } = this.props;
    const currentMetricType = metrics.find(m => m.title === this.state.type);
    const currentMetricKey = Object.keys(currentMetricType.metrics).find(
      key => currentMetricType.metrics[key].title === this.state.sortBy
    );
    const currentMetric = currentMetricType.metrics[currentMetricKey];
    const sortByDropdown = {
      id: 'sort-by-dropdown',
      type: DROPDOWN,
      choices: Object.keys(currentMetricType.metrics).map(key => currentMetricType.metrics[key].title),
      onChange: newValue => this.onDropdownChange('sortBy', newValue),
      value: this.state.sortBy,
    };
    const typeDropdown = {
      id: 'type-dropdown',
      type: DROPDOWN,
      choices: metrics.map(m => m.title),
      onChange: newValue => this.onDropdownChange('type', newValue),
      value: this.state.type,
    };
    return (
      <div>
        <div className="kubevirt-consumers__filters">
          {getFormElement(typeDropdown)}
          {getFormElement(sortByDropdown)}
        </div>
        <div className="kubevirt-consumers__results">
          <Row className="kubevirt-consumers__description">
            <Col lg={4} md={4} sm={4} xs={4} className="kubevirt-consumers__metric-type">
              {this.state.type}
            </Col>
            <Col lg={8} md={8} sm={8} xs={8} className="kubevirt-consumers__metric-description">
              {currentMetric.description}
            </Col>
          </Row>
          {currentMetric && currentMetric.isLoading ? (
            <LoadingComponent />
          ) : (
            getConsumers(currentMetric).map((c, index) => (
              <ConsumersBar key={index} {...c} className="kubevirt-consumers__bar" />
            ))
          )}
        </div>
      </div>
    );
  }
}

TopConsumersBody.propTypes = {
  metrics: PropTypes.array.isRequired,
  LoadingComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
};

export const TopConsumers = ({ metrics, LoadingComponent }) => (
  <DashboardCard>
    <DashboardCardHeader>
      <DashboardCardTitle>Top Consumers</DashboardCardTitle>
      <DashboardCardTitleHelp>help for top consumers</DashboardCardTitleHelp>
    </DashboardCardHeader>
    <DashboardCardBody>
      <TopConsumersBody metrics={metrics} LoadingComponent={LoadingComponent} />
    </DashboardCardBody>
  </DashboardCard>
);

TopConsumers.defaultProps = {
  LoadingComponent: InlineLoading,
};

TopConsumers.propTypes = {
  metrics: PropTypes.array.isRequired,
  LoadingComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};

const TopConsumersConnected = () => (
  <ClusterOverviewContextGenericConsumer Component={TopConsumers} dataPath="consumersData" />
);

export default TopConsumersConnected;
