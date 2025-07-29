import React, { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  Alert
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material'

import { transformBugStatusDataForChart, validateBugStatusChartData } from '../../utils/bugStatusChartUtils'
import { useDeveloperQualityFilters } from '../../hooks/useDeveloperQualityFilters'
import { useDeveloperQualityCache } from '../../hooks/useDeveloperQualityCache'

const BugStatusDebugPanel = React.memo(({ 
  data, 
  filters, 
  title = 'Bug Status Chart Debug Panel'
}) => {
  // 1. Hooks first
  const { filters: globalFilters } = useDeveloperQualityFilters()
  const { cacheData } = useDeveloperQualityCache()
  const [isVisible, setIsVisible] = useState(true)
  const [showTransformed, setShowTransformed] = useState(true)
  
  // 2. Memoized values
  const timeframe = useMemo(() => {
    return globalFilters?.timeframe || filters?.timeframe || 'month'
  }, [globalFilters?.timeframe, filters?.timeframe])
  
  // Transform data for debugging
  const debugInfo = useMemo(() => {
    const transformedData = data ? transformBugStatusDataForChart(data, filters, timeframe) : null
    const isValid = transformedData ? validateBugStatusChartData(transformedData) : false
    
    return {
      timestamp: new Date().toISOString(),
      timeframe,
      filters,
      hasRawData: !!data,
      rawDataStructure: data ? Object.keys(data) : null,
      rawData: data,
      transformedData,
      isValidChartData: isValid,
      chartMetrics: transformedData ? {
        labelsCount: transformedData.labels?.length || 0,
        datasetsCount: transformedData.datasets?.length || 0,
        totalDataPoints: transformedData.datasets?.reduce((sum, dataset) => 
          sum + (dataset.data?.length || 0), 0) || 0,
        hasValues: transformedData.datasets?.some(dataset => 
          dataset.data?.some(value => value > 0)) || false
      } : null
    }
  }, [data, filters, timeframe])
  
  // Format JSON for display
  const formatJSON = (obj, maxDepth = 3) => {
    if (!obj) return 'null'
    
    try {
      return JSON.stringify(obj, (key, value) => {
        // Convert Maps to Objects for better JSON display
        if (value instanceof Map) {
          const obj = {}
          for (let [k, v] of value) {
            obj[k] = v
          }
          return obj
        }
        // Limit depth for large objects
        if (typeof value === 'object' && value !== null && key.length > 0) {
          const depth = key.split('.').length
          if (depth > maxDepth) {
            return '[Object]'
          }
        }
        return value
      }, 2)
    } catch (error) {
      return `Error formatting JSON: ${error.message}`
    }
  }
  
  if (!isVisible) {
    return (
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => setIsVisible(true)}
        >
          Show Debug Panel
        </Button>
      </Box>
    )
  }
  
  return (
    <Paper elevation={2} sx={{ mb: 2, border: '2px solid #ff9800' }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon color="warning" />
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showTransformed}
                  onChange={(e) => setShowTransformed(e.target.checked)}
                  size="small"
                />
              }
              label="Show Transformed"
              sx={{ mr: 1 }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityOffIcon />}
              onClick={() => setIsVisible(false)}
            >
              Hide
            </Button>
          </Box>
        </Box>
        
        {/* Status Overview */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`Has Data: ${debugInfo.hasRawData ? 'Yes' : 'No'}`}
            color={debugInfo.hasRawData ? 'success' : 'error'}
            size="small"
          />
          <Chip 
            label={`Valid Chart: ${debugInfo.isValidChartData ? 'Yes' : 'No'}`}
            color={debugInfo.isValidChartData ? 'success' : 'error'}
            size="small"
          />
          <Chip 
            label={`Timeframe: ${debugInfo.timeframe}`}
            color="info"
            size="small"
          />
          <Chip 
            label={`Projects: ${filters?.projects?.length || 0}`}
            color="primary"
            size="small"
          />
          {/* Enhanced data structure info */}
          {debugInfo.rawData && (
            <>
              <Chip 
                label={`Data Type: ${debugInfo.rawData.type || 'unknown'}`}
                color="secondary"
                size="small"
              />
              <Chip 
                label={`Has Data.data: ${!!debugInfo.rawData.data ? 'Yes' : 'No'}`}
                color={!!debugInfo.rawData.data ? 'success' : 'error'}
                size="small"
              />
              {debugInfo.rawData.data && (
                <>
                  <Chip 
                    label={`Aggregated Size: ${debugInfo.rawData.data.aggregated ? debugInfo.rawData.data.aggregated.size || 0 : 0}`}
                    color={debugInfo.rawData.data.aggregated && debugInfo.rawData.data.aggregated.size > 0 ? 'success' : 'warning'}
                    size="small"
                  />
                  <Chip 
                    label={`ByProject Size: ${debugInfo.rawData.data.byProject ? debugInfo.rawData.data.byProject.size || 0 : 0}`}
                    color={debugInfo.rawData.data.byProject && debugInfo.rawData.data.byProject.size > 0 ? 'success' : 'warning'}
                    size="small"
                  />
                </>
              )}
            </>
          )}
          {debugInfo.chartMetrics && (
            <>
              <Chip 
                label={`Labels: ${debugInfo.chartMetrics.labelsCount}`}
                color="secondary"
                size="small"
              />
              <Chip 
                label={`Has Values: ${debugInfo.chartMetrics.hasValues ? 'Yes' : 'No'}`}
                color={debugInfo.chartMetrics.hasValues ? 'success' : 'warning'}
                size="small"
              />
            </>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Critical Issues Alert */}
        {(() => {
          const rawIssues = cacheData?.rawIssues || []
          const bugIssues = rawIssues.filter(issue => issue.fields?.issuetype?.name === 'Bug')
          const bugStatusAnalysis = cacheData?.metrics?.bugStatusAnalysis
          const selectedProjects = filters?.projects || []
          const projectsWithoutBugData = ["Yubisui", "Sekisuiheim"]
          const isSelectingProjectsWithoutData = selectedProjects.some(project => 
            projectsWithoutBugData.includes(project)
          )
          
          const criticalIssues = []
          if (rawIssues.length === 0) criticalIssues.push("No raw JIRA data found")
          if (bugIssues.length === 0) criticalIssues.push("No Bug issues found in dataset")
          if (!bugStatusAnalysis) criticalIssues.push("Bug status analysis missing from cache")
          if (bugStatusAnalysis && bugStatusAnalysis.totalBugs === 0) criticalIssues.push("Bug status analysis shows 0 bugs processed")
          if (!debugInfo.rawData) criticalIssues.push("No data passed to chart component")
          
          if (criticalIssues.length > 0) {
            // If selecting projects without data, show a more informative message
            if (isSelectingProjectsWithoutData && debugInfo.rawData) {
              return (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    📊 Expected Behavior - No Bug Data for Selected Projects
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    You've selected <strong>{selectedProjects.filter(p => projectsWithoutBugData.includes(p)).join(", ")}</strong> which have no Bug-type issues in the dataset.
                  </Typography>
                  <Typography variant="body2">
                    ✅ This is normal if these projects don't use Bug-type issues in JIRA.
                    <br />
                    💡 Try selecting: Yuime, Oops, PROMAX, Borderless City Project, etc.
                  </Typography>
                </Alert>
              )
            }
            
            // Otherwise show the critical issues as before
            return (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Critical Issues Detected:</Typography>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {criticalIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </Alert>
            )
          }
          return null
        })()}
        
        {/* Current Filters */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Current Filters & State</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Last Updated: {new Date(debugInfo.timestamp).toLocaleTimeString()}
              </Typography>
              <pre style={{ 
                fontSize: '12px', 
                backgroundColor: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {formatJSON({
                  timeframe: debugInfo.timeframe,
                  filters: debugInfo.filters,
                  hasRawData: debugInfo.hasRawData,
                  rawDataStructure: debugInfo.rawDataStructure
                })}
              </pre>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Project Mapping Diagnostics */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Project Mapping Diagnostics</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Project Filter Analysis
              </Typography>
              <pre style={{ 
                fontSize: '12px', 
                backgroundColor: '#fff3cd', 
                padding: '8px', 
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px',
                border: '1px solid #ffeaa7'
              }}>
                {(() => {
                  const projectFilter = debugInfo.filters?.projects || []
                  const byProjectData = debugInfo.rawData?.data?.byProject
                  const projectKeys = byProjectData ? Array.from(byProjectData.keys()) : []
                  
                  return formatJSON({
                    projectFilter,
                    projectFilterCount: projectFilter.length,
                    availableProjectKeys: projectKeys,
                    availableProjectCount: projectKeys.length,
                                         projectMapping: projectFilter.map(displayName => {
                       // We need to import memberConfiguration to get the proper mapping
                       // For now, show what the mapping would look like
                       const mappedKey = displayName // This will be properly mapped in the utils
                       return {
                         displayName,
                         mappedKey,
                         hasDataForMappedKey: projectKeys.includes(mappedKey),
                         hasDataForDisplayName: projectKeys.includes(displayName),
                         note: "Mapping handled in bugStatusChartUtils.js"
                       }
                     }),
                    rawProjectDataSample: byProjectData ? Object.fromEntries(
                      Array.from(byProjectData.entries()).slice(0, 3)
                    ) : null
                  })
                })()}
              </pre>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Raw Project Investigation */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ color: 'error.main' }}>
              🔍 Raw Project Investigation (Yubisui Hunt)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Deep dive into actual project keys in bug status data
              </Typography>
              <pre style={{ 
                fontSize: '11px', 
                backgroundColor: '#fff3e0', 
                padding: '8px', 
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '600px',
                border: '1px solid #ff9800'
              }}>
                {(() => {
                  // Get the actual bug status data
                  const chartDataProjects = debugInfo.rawData?.data?.data?.data?.byProject || 
                                           debugInfo.rawData?.data?.data?.byProject || 
                                           debugInfo.rawData?.data?.byProject || {}
                  
                  // Convert Map to Object if needed
                  const projectData = chartDataProjects instanceof Map ? 
                    Object.fromEntries(chartDataProjects) : chartDataProjects
                  
                  // Get all project keys
                  const allProjectKeys = Object.keys(projectData).sort()
                  
                  // Search for Yubisui-related patterns
                  const yubisui_patterns = allProjectKeys.filter(key => 
                    key.toLowerCase().includes('yub') || 
                    key.toLowerCase().includes('yubisui') ||
                    key.toLowerCase().includes('yub')
                  )
                  
                  // Search for Sekisuiheim-related patterns  
                  const sekisuiheim_patterns = allProjectKeys.filter(key =>
                    key.toLowerCase().includes('sek') ||
                    key.toLowerCase().includes('sekisui') ||
                    key.toLowerCase().includes('heim')
                  )
                  
                  // Get sample data for each project
                  const projectSamples = allProjectKeys.slice(0, 10).map(projectKey => {
                    const projectTimePeriods = projectData[projectKey]
                    const firstPeriod = projectTimePeriods ? Object.keys(projectTimePeriods)[0] : null
                    const sampleData = firstPeriod ? projectTimePeriods[firstPeriod] : null
                    
                    return {
                      projectKey,
                      hasData: !!projectTimePeriods,
                      periodsCount: projectTimePeriods ? Object.keys(projectTimePeriods).length : 0,
                      samplePeriod: firstPeriod,
                      sampleData
                    }
                  })
                  
                  return formatJSON({
                    investigation: "Searching for Yubisui bug data",
                    totalProjectsInBugData: allProjectKeys.length,
                    allProjectKeys,
                    yubisui_search: {
                      expectedKey: "YUB",
                      foundPatterns: yubisui_patterns,
                      hasYUB: allProjectKeys.includes('YUB'),
                      hasYub: allProjectKeys.includes('Yub'),
                      hasYubisui: allProjectKeys.includes('Yubisui'),
                      hasYUBISUI: allProjectKeys.includes('YUBISUI')
                    },
                    sekisuiheim_search: {
                      expectedKey: "SEK", 
                      foundPatterns: sekisuiheim_patterns,
                      hasSEK: allProjectKeys.includes('SEK'),
                      hasSekisui: allProjectKeys.includes('Sekisui'),
                      hasSekisuiheim: allProjectKeys.includes('Sekisuiheim')
                    },
                    projectSamples: projectSamples,
                    suspiciousProjects: allProjectKeys.filter(key => 
                      !["YUIM", "OOPS", "PMAX", "WON", "TS", "TOUC", "TIT", "SG", "RAG", "BCP", "DAICO", "HG", "MIT", "ECHO", "CF", "DAAI", "ENT", "IS", "KB", "NKR2", "SIP"].includes(key)
                    )
                  })
                })()}
              </pre>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Project Availability Checker */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ color: 'primary.main' }}>
              📋 Project Availability Report
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Configured Projects vs. Available Bug Data
              </Typography>
              <pre style={{ 
                fontSize: '12px', 
                backgroundColor: '#e3f2fd', 
                padding: '8px', 
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '500px',
                border: '1px solid #2196f3'
              }}>
                {(() => {
                  // Get available projects from the actual chart data
                  const chartDataProjects = debugInfo.rawData?.data?.data?.data?.byProject || 
                                           debugInfo.rawData?.data?.data?.byProject || 
                                           debugInfo.rawData?.data?.byProject || new Map()
                  const availableProjectKeys = chartDataProjects instanceof Map ? 
                    Array.from(chartDataProjects.keys()) : 
                    (chartDataProjects ? Object.keys(chartDataProjects) : [])
                  
                  // Import memberConfiguration projects (we'll need to get this from context or a different way)
                  // For now, show the key projects we know about
                  const knownProjects = [
                    { name: "Yuime", key: "YUIM" },
                    { name: "Yubisui", key: "YUB" },
                    { name: "Sekisuiheim", key: "SEK" },
                    { name: "Oops", key: "OOPS" },
                    { name: "PROMAX", key: "PMAX" },
                    { name: "WonderTable", key: "WON" },
                    { name: "Tokyu-Stay", key: "TS" },
                    { name: "TOUCH", key: "TOUC" },
                    { name: "Titans", key: "TIT" },
                    { name: "SCOP-GO", key: "SG" },
                    { name: "RAG", key: "RAG" },
                    { name: "Borderless City Project", key: "BCP" },
                    { name: "Daicolo", key: "DAICO" },
                    { name: "Hiruta GoDump", key: "HG" },
                    { name: "Mitaden", key: "MIT" },
                    { name: "echo", key: "ECHO" }
                  ]
                  
                  const projectReport = knownProjects.map(project => ({
                    displayName: project.name,
                    projectKey: project.key,
                    hasData: availableProjectKeys.includes(project.key),
                    isCurrentlySelected: filters?.projects?.includes(project.name) || false
                  }))
                  
                  const summary = {
                    totalConfiguredProjects: knownProjects.length,
                    projectsWithData: projectReport.filter(p => p.hasData).length,
                    projectsWithoutData: projectReport.filter(p => !p.hasData).length,
                    currentSelection: filters?.projects || [],
                    availableProjectKeys: availableProjectKeys.sort(),
                    projectReport: projectReport.sort((a, b) => a.displayName.localeCompare(b.displayName))
                  }
                  
                  return formatJSON(summary)
                })()}
              </pre>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Data Pipeline Diagnostics */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" sx={{ color: 'error.main' }}>
              🔍 Data Pipeline Diagnostics (Bug Issues)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Checking Raw JIRA Data & Cache for Bug Issues
              </Typography>
              <pre style={{ 
                fontSize: '12px', 
                backgroundColor: '#ffebee', 
                padding: '8px', 
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '400px',
                border: '1px solid #ffcdd2'
              }}>
                {(() => {
                  // Check raw JIRA data from cache
                  const rawIssues = cacheData?.rawIssues || []
                  const bugIssues = rawIssues.filter(issue => 
                    issue.fields?.issuetype?.name === 'Bug'
                  )
                  
                  // Check bug status analysis in cache
                  const bugStatusAnalysis = cacheData?.metrics?.bugStatusAnalysis
                  
                  // Check for Yuime/YUIM project specific bugs
                  const yuimeBugs = bugIssues.filter(issue => 
                    issue.fields?.project?.key === 'YUIM' || issue.fields?.project?.name === 'Yuime'
                  )
                  
                  // Sample bug data
                  const sampleBug = bugIssues.length > 0 ? {
                    key: bugIssues[0].key,
                    projectKey: bugIssues[0].fields?.project?.key,
                    projectName: bugIssues[0].fields?.project?.name,
                    status: bugIssues[0].fields?.status?.name,
                    issueType: bugIssues[0].fields?.issuetype?.name,
                    created: bugIssues[0].fields?.created,
                    updated: bugIssues[0].fields?.updated,
                    resolved: bugIssues[0].fields?.resolutiondate
                  } : null
                  
                  return formatJSON({
                    rawDataCheck: {
                      totalIssues: rawIssues.length,
                      totalBugIssues: bugIssues.length,
                      bugPercentage: rawIssues.length > 0 ? (bugIssues.length / rawIssues.length * 100).toFixed(1) + '%' : '0%',
                      yuimeBugCount: yuimeBugs.length,
                      sampleBugIssue: sampleBug,
                      uniqueProjects: [...new Set(bugIssues.map(b => b.fields?.project?.key))],
                      uniqueStatuses: [...new Set(bugIssues.map(b => b.fields?.status?.name))]
                    },
                    cacheDataCheck: {
                      hasCacheData: !!cacheData,
                      hasMetrics: !!cacheData?.metrics,
                      hasBugStatusAnalysis: !!bugStatusAnalysis,
                      bugStatusAnalysisSummary: bugStatusAnalysis ? {
                        totalBugs: bugStatusAnalysis.totalBugs,
                        statusBreakdown: bugStatusAnalysis.statusBreakdown,
                        projectCount: bugStatusAnalysis.byProject?.size || 0,
                        aggregatedPeriods: bugStatusAnalysis.aggregated?.size || 0,
                        weeklyPeriods: bugStatusAnalysis.byWeek?.size || 0,
                        monthlyPeriods: bugStatusAnalysis.byMonth?.size || 0,
                        quarterlyPeriods: bugStatusAnalysis.byQuarter?.size || 0,
                        availableProjects: bugStatusAnalysis.byProject ? Array.from(bugStatusAnalysis.byProject.keys()) : []
                      } : 'Not found'
                    },
                    filterServiceCheck: {
                      inputData: data,
                      expectedBugStatusInCache: !!cacheData?.metrics?.bugStatusAnalysis,
                      cacheMetricsKeys: cacheData?.metrics ? Object.keys(cacheData.metrics) : null
                    }
                  })
                })()}
              </pre>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Raw Data */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">Raw Input Data</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre style={{ 
              fontSize: '11px', 
              backgroundColor: '#f5f5f5', 
              padding: '8px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              {formatJSON(debugInfo.rawData, 2)}
            </pre>
          </AccordionDetails>
        </Accordion>

        {/* Transformed Chart Data */}
        {showTransformed && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Transformed Chart Data</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {debugInfo.chartMetrics && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chart Metrics: {debugInfo.chartMetrics.labelsCount} labels, {debugInfo.chartMetrics.datasetsCount} datasets, {debugInfo.chartMetrics.totalDataPoints} total data points
                  </Typography>
                </Box>
              )}
              <pre style={{ 
                fontSize: '11px', 
                backgroundColor: '#f5f5f5', 
                padding: '8px', 
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {formatJSON(debugInfo.transformedData, 3)}
              </pre>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    </Paper>
  )
})

BugStatusDebugPanel.propTypes = {
  data: PropTypes.object,
  filters: PropTypes.object,
  title: PropTypes.string
}

export default BugStatusDebugPanel 