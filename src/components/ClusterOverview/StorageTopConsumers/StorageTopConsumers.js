import React from 'react';
import { LineChart, Row, Col } from 'patternfly-react';
import PropTypes from 'prop-types';

import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardTitleDropDown,
} from '../../Dashboard/DashboardCard';
import { ClusterOverviewContextGenericConsumer } from '../ClusterOverviewContext';

const StorageTopConsumersBody = (stats) => (
  <div>
    <Row>
      <Col lg={7} md={7} sm={7} xs={7}>
        <LineChart
          id="line-chart"
          data={{
            x: 'x',
            columns: [
              ['x', 30, 50, 100, 230, 300, 310],
              ['data1', 30, 20, 50, 40, 60, 50],
              ['data2', 200, 130, 90, 240, 130, 220],
              ['data3', 300, 200, 160, 400, 250, 250]
            ],
            unload: true,
            names: {
              data1: 'Project 1',
              data2: 'Project 2',
              data3: 'Project 3',
            },
            type: 'line',
          }}
          axis={{
            y: {
              label: {
                text: 'Used Capacity',
                position: 'outer-top',
              }
            }
          }}
          unloadBeforeLoad
          size={{ width: 700, height: 250 }}
        />
      </Col>
    </Row>
  </div>
);

StorageTopConsumersBody.propTypes = {
  stats: PropTypes.object.isRequired,
};

export const StorageTopConsumers = ({ stats, loaded }) => (
  <DashboardCard>
    <DashboardCardHeader>
      <Col lg={8} md={8} sm={8} xs={8}>
        <DashboardCardTitle>Top Consumers</DashboardCardTitle>
      </Col>
      <Col lg={4} md={4} sm={4} xs={4}>
        <DashboardCardTitleDropDown></DashboardCardTitleDropDown>
      </Col>
    </DashboardCardHeader>
    <DashboardCardBody isLoading={!loaded}>
      <StorageTopConsumersBody stats={stats} />
    </DashboardCardBody>
  </DashboardCard>
);

StorageTopConsumers.defaultProps = {
  loaded: false,
};

StorageTopConsumers.propTypes = {
  stats: PropTypes.object.isRequired,
  loaded: PropTypes.bool,
};

const StorageTopConsumersConnected = () => (
  <ClusterOverviewContextGenericConsumer Component={StorageTopConsumers} dataPath="StorageTopConsumersStats" />
);

export default StorageTopConsumersConnected;
