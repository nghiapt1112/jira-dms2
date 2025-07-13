import React from 'react'
import PropTypes from 'prop-types'
import SprintMetricsCharts from './SprintMetricsCharts'

const SprintMetricsChartsDashboard = React.memo((props) => {
  return <SprintMetricsCharts {...props} />
})

SprintMetricsChartsDashboard.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    fields: PropTypes.object,
    displayFields: PropTypes.object
  })),
  isLoading: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string
  }),
  title: PropTypes.string,
  defaultSelectedProject: PropTypes.string,
  showProjectFilter: PropTypes.bool,
  chartHeight: PropTypes.number
}

SprintMetricsChartsDashboard.displayName = 'SprintMetricsChartsDashboard'

export default SprintMetricsChartsDashboard