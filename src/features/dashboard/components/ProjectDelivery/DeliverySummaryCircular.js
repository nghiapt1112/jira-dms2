import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Box, Typography, Paper, useTheme } from '@mui/material'

const DeliverySummaryCircular = React.memo(({ 
  data, 
  title = 'Delivery Summary',
  diameter = 120,
  ...props 
}) => {
  const theme = useTheme()

  const deliveryStats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        onTime: 0,
        delayed: 0,
        critical: 0,
        total: 0,
        onTimeRate: 0,
        delayedRate: 0,
        criticalRate: 0
      }
    }

    const stats = data.reduce((acc, project) => {
      const deliveryScore = project.delivery || 0
      
      if (deliveryScore >= 80) {
        acc.onTime += 1
      } else if (deliveryScore >= 60) {
        acc.delayed += 1
      } else {
        acc.critical += 1
      }
      
      return acc
    }, { onTime: 0, delayed: 0, critical: 0 })

    const total = data.length
    
    return {
      ...stats,
      total,
      onTimeRate: total > 0 ? (stats.onTime / total) * 100 : 0,
      delayedRate: total > 0 ? (stats.delayed / total) * 100 : 0,
      criticalRate: total > 0 ? (stats.critical / total) * 100 : 0
    }
  }, [data])

  const getMainCategory = useMemo(() => {
    const { onTimeRate, delayedRate, criticalRate } = deliveryStats
    
    if (onTimeRate >= delayedRate && onTimeRate >= criticalRate) {
      return { label: 'On Time', rate: onTimeRate, color: theme.palette.success.main }
    } else if (delayedRate >= criticalRate) {
      return { label: 'Delayed', rate: delayedRate, color: theme.palette.warning.main }
    } else {
      return { label: 'Critical', rate: criticalRate, color: theme.palette.error.main }
    }
  }, [deliveryStats, theme])

  const strokeWidth = 8
  const radius = (diameter - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = diameter / 2

  const createArcPath = (startAngle, endAngle, radius) => {
    const startAngleRad = (startAngle - 90) * (Math.PI / 180)
    const endAngleRad = (endAngle - 90) * (Math.PI / 180)
    
    const startX = center + radius * Math.cos(startAngleRad)
    const startY = center + radius * Math.sin(startAngleRad)
    const endX = center + radius * Math.cos(endAngleRad)
    const endY = center + radius * Math.sin(endAngleRad)
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`
  }

  if (!data || data.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: diameter + 40
        }}>
          <Typography color="text.secondary">No delivery data available</Typography>
        </Box>
      </Paper>
    )
  }

  const { onTimeRate, delayedRate, criticalRate } = deliveryStats
  
  // Calculate angles for each segment
  let currentAngle = 0
  const onTimeAngle = (onTimeRate / 100) * 360
  const delayedAngle = (delayedRate / 100) * 360
  const criticalAngle = (criticalRate / 100) * 360

  return (
    <Paper elevation={1} sx={{ p: 2, width: '100%' }} {...props}>
      <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
        {title}
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: 2
      }}>
        {/* Circular Chart */}
        <Box sx={{ position: 'relative' }}>
          <svg width={diameter} height={diameter}>
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={theme.palette.grey[200]}
              strokeWidth={strokeWidth}
            />
            
            {/* On Time segment */}
            {onTimeRate > 0 && (
              <path
                d={createArcPath(currentAngle, currentAngle + onTimeAngle, radius)}
                fill="none"
                stroke={theme.palette.success.main}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            )}
            
            {/* Delayed segment */}
            {delayedRate > 0 && (
              <path
                d={createArcPath(
                  currentAngle + onTimeAngle, 
                  currentAngle + onTimeAngle + delayedAngle, 
                  radius
                )}
                fill="none"
                stroke={theme.palette.warning.main}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            )}
            
            {/* Critical segment */}
            {criticalRate > 0 && (
              <path
                d={createArcPath(
                  currentAngle + onTimeAngle + delayedAngle,
                  currentAngle + onTimeAngle + delayedAngle + criticalAngle,
                  radius
                )}
                fill="none"
                stroke={theme.palette.error.main}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            )}
          </svg>
          
          {/* Center content */}
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold',
                color: getMainCategory.color,
                fontSize: '1.5rem'
              }}
            >
              {getMainCategory.rate.toFixed(0)}%
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '0.7rem'
              }}
            >
              {getMainCategory.label}
            </Typography>
          </Box>
        </Box>

        {/* Legend */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1, 
          width: '100%',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: theme.palette.success.main,
                borderRadius: '50%' 
              }} 
            />
            <Typography variant="caption">
              On Time: {deliveryStats.onTime} ({onTimeRate.toFixed(0)}%)
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: theme.palette.warning.main,
                borderRadius: '50%' 
              }} 
            />
            <Typography variant="caption">
              Delayed: {deliveryStats.delayed} ({delayedRate.toFixed(0)}%)
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                backgroundColor: theme.palette.error.main,
                borderRadius: '50%' 
              }} 
            />
            <Typography variant="caption">
              Critical: {deliveryStats.critical} ({criticalRate.toFixed(0)}%)
            </Typography>
          </Box>
        </Box>

        {/* Summary stats */}
        <Box sx={{ 
          textAlign: 'center',
          p: 1,
          backgroundColor: theme.palette.background.default,
          borderRadius: 1,
          width: '100%'
        }}>
          <Typography variant="caption" color="text.secondary">
            Total Projects: {deliveryStats.total}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
})

DeliverySummaryCircular.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    delivery: PropTypes.number,
    name: PropTypes.string,
    projectKey: PropTypes.string
  })),
  title: PropTypes.string,
  diameter: PropTypes.number
}

DeliverySummaryCircular.displayName = 'DeliverySummaryCircular'

export default DeliverySummaryCircular