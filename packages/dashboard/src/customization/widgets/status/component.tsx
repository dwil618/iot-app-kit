import React from 'react';
import { useSelector } from 'react-redux';
import pickBy from 'lodash/pickBy';
import { Status } from '@iot-app-kit/react-components';
import { computeQueryConfigKey } from '../utils/computeQueryConfigKey';
import type { DashboardState } from '~/store/state';
import type { StatusWidget } from '../types';
import { Box } from '@cloudscape-design/components';
import { useQueries } from '~/components/dashboard/queryContext';
import { isDefined } from '~/util/isDefined';
import { aggregateToString } from '~/customization/propertiesSections/aggregationSettings/helpers';
import { getAggregation } from '../utils/widgetAggregationUtils';

import './component.css';
import WidgetTile from '~/components/widgets/tile';

const StatusWidgetComponent: React.FC<StatusWidget> = (widget) => {
  const viewport = useSelector((state: DashboardState) => state.dashboardConfiguration.viewport);
  const dashboardSignificantDigits = useSelector((state: DashboardState) => state.significantDigits);

  const {
    styleSettings,
    queryConfig,
    primaryFont,
    secondaryFont,
    showValue,
    showUnit,
    showIcon,
    showName,
    thresholds,
    significantDigits: widgetSignificantDigits,
  } = widget.properties;

  const { iotSiteWiseQuery } = useQueries();
  const query = iotSiteWiseQuery && queryConfig.query ? iotSiteWiseQuery?.timeSeriesData(queryConfig.query) : undefined;

  const shouldShowEmptyState = query == null || !iotSiteWiseQuery;
  const key = computeQueryConfigKey(viewport, queryConfig);
  const aggregation = getAggregation(queryConfig);

  if (shouldShowEmptyState) {
    return (
      <WidgetTile widget={widget} removeable>
        <StatusWidgetEmptyStateComponent />
      </WidgetTile>
    );
  }

  const settings = pickBy(
    {
      showName,
      showIcon,
      showValue,
      showUnit,
      fontSize: primaryFont.fontSize,
      color: primaryFont.fontColor,
      secondaryFontSize: secondaryFont.fontSize,
    },
    isDefined
  );

  const significantDigits = widgetSignificantDigits ?? dashboardSignificantDigits;

  return (
    <WidgetTile widget={widget} removeable>
      <Status
        key={key}
        query={query}
        viewport={viewport}
        styles={styleSettings}
        settings={settings}
        thresholds={thresholds}
        aggregationType={aggregateToString(aggregation)}
        significantDigits={significantDigits}
      />
    </WidgetTile>
  );
};

const StatusWidgetEmptyStateComponent: React.FC = () => {
  return (
    <div className='status-widget-empty-state'>
      <Box variant='strong' color='text-status-inactive' margin='s'>
        Status
      </Box>

      <div className='status-widget-empty-state-message-container'>
        <Box variant='strong' color='text-status-inactive' margin={{ horizontal: 's' }}>
          No properties or alarms
        </Box>

        <Box variant='p' color='text-status-inactive' margin={{ bottom: 's', horizontal: 's' }}>
          Add a property or alarm to populate status
        </Box>
      </div>
    </div>
  );
};

export default StatusWidgetComponent;
