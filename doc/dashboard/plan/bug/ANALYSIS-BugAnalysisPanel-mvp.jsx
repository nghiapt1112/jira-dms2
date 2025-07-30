/**
 * Bug Analysis Panel - MVP Component
 * Displays raw JSON data for bug analysis
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/card'
import { Button } from '../../../../shared/components/ui/button'
import { ChevronDown, ChevronRight, Copy, Download } from 'lucide-react'

const BugAnalysisPanel = ({ data, projects, timeframe = 'month' }) => {
  const [expandedProjects, setExpandedProjects] = useState(new Set())
  const [showRawJson, setShowRawJson] = useState(true)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)
  
  // Filter data based on selected projects
  const filteredData = React.useMemo(() => {
    if (!data) return {}
    
    if (projects.length === 0) {
      return data
    }
    
    return Object.fromEntries(
      Object.entries(data).filter(([projectKey]) => 
        projects.includes(projectKey)
      )
    )
  }, [data, projects])
  
  // Toggle project expansion
  const toggleProject = (projectKey) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectKey)) {
      newExpanded.delete(projectKey)
    } else {
      newExpanded.add(projectKey)
    }
    setExpandedProjects(newExpanded)
  }
  
  // Copy JSON to clipboard
  const copyToClipboard = () => {
    const jsonString = JSON.stringify(filteredData, null, 2)
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopiedToClipboard(true)
      setTimeout(() => setCopiedToClipboard(false), 2000)
    })
  }
  
  // Download JSON file
  const downloadJson = () => {
    const jsonString = JSON.stringify(filteredData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bug-analysis-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // Calculate summary stats
  const summary = React.useMemo(() => {
    if (!filteredData) return null
    
    let totalBugs = 0
    let totalResolved = 0
    let totalInProgress = 0
    
    Object.values(filteredData).forEach(projectData => {
      const periodData = projectData[timeframe] || {}
      Object.values(periodData).forEach(period => {
        totalBugs += period.created || 0
        totalResolved += period.resolved || 0
        totalInProgress += period.inProgress || 0
      })
    })
    
    return {
      projects: Object.keys(filteredData).length,
      totalBugs,
      totalResolved,
      totalInProgress,
      resolutionRate: totalBugs > 0 ? Math.round((totalResolved / totalBugs) * 100) : 0
    }
  }, [filteredData, timeframe])
  
  if (!data) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Bug Analysis by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No bug analysis data available</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Bug Analysis by Project</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawJson(!showRawJson)}
            >
              {showRawJson ? 'Hide' : 'Show'} Raw JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              disabled={copiedToClipboard}
            >
              <Copy className="h-4 w-4 mr-1" />
              {copiedToClipboard ? 'Copied!' : 'Copy JSON'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadJson}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        {summary && (
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Summary ({timeframe})</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Projects</p>
                <p className="font-medium">{summary.projects}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Bugs</p>
                <p className="font-medium">{summary.totalBugs}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Resolved</p>
                <p className="font-medium">{summary.totalResolved}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Resolution Rate</p>
                <p className="font-medium">{summary.resolutionRate}%</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Raw JSON Display */}
        {showRawJson && (
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[600px] text-xs">
              {JSON.stringify(filteredData, null, 2)}
            </pre>
          </div>
        )}
        
        {/* Structured View (Future Enhancement) */}
        {!showRawJson && (
          <div className="space-y-2">
            {Object.entries(filteredData).map(([projectKey, projectData]) => (
              <div key={projectKey} className="border rounded-lg p-3">
                <button
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => toggleProject(projectKey)}
                >
                  <div className="flex items-center gap-2">
                    {expandedProjects.has(projectKey) ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                    <span className="font-medium">{projectKey}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Object.keys(projectData[timeframe] || {}).length} {timeframe}s
                  </span>
                </button>
                
                {expandedProjects.has(projectKey) && (
                  <div className="mt-2 ml-6">
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-[300px]">
                      {JSON.stringify(projectData[timeframe], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BugAnalysisPanel

// CSS for the component (add to your styles)
/*
.bug-analysis-panel pre {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.bug-analysis-panel .json-key {
  color: #0969da;
}

.bug-analysis-panel .json-string {
  color: #032f62;
}

.bug-analysis-panel .json-number {
  color: #005cc5;
}
*/