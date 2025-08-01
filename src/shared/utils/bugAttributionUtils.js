/**
 * Bug Attribution Utilities
 * Handles proper bug attribution to developers who caused bugs vs assignees
 * Supports custom JIRA fields for accurate quality metrics
 */

/**
 * Custom field mappings for bug causation attribution
 * These fields indicate who actually caused the bug, not just who it's assigned to
 */
export const BUG_CAUSED_BY_FIELDS = {
  BUG_CAUSED_BY: 'customfield_10636',
  BUG_CAUSED_BY_NEW: 'customfield_10002'
}

/**
 * Determine if an issue is a bug
 * @param {Object} issue - JIRA issue object
 * @returns {boolean} - True if issue is a bug
 */
export const isBugIssue = (issue) => {
  if (!issue) return false
  
  return issue.issueType === 'Bug' || 
         issue.fields?.issuetype?.name?.toLowerCase() === 'bug'
}

/**
 * Get the developer who caused a bug (not necessarily the assignee)
 * @param {Object} issue - JIRA issue object
 * @returns {string|null} - Developer name who caused the bug, or null if not a bug
 */
export const getBugCausedBy = (issue) => {
  if (!isBugIssue(issue)) {
    return null // Not a bug
  }
  
  // Check custom fields first (who actually caused the bug)
  const causedByField = issue.fields?.[BUG_CAUSED_BY_FIELDS.BUG_CAUSED_BY]
  const causedByNewField = issue.fields?.[BUG_CAUSED_BY_FIELDS.BUG_CAUSED_BY_NEW]
  
  // Return first available custom field, fallback to assignee
  return causedByField || causedByNewField || issue.assignee
}

/**
 * Determine if a developer is responsible for an issue
 * For bugs: checks custom causation fields
 * For other issues: uses assignee field
 * @param {Object} issue - JIRA issue object
 * @param {string} developerName - Name of developer to check
 * @returns {boolean} - True if developer is responsible for this issue
 */
export const isDeveloperResponsibleForIssue = (issue, developerName) => {
  if (!issue || !developerName) return false
  
  if (isBugIssue(issue)) {
    // For bugs, check who actually caused it
    const causedBy = getBugCausedBy(issue)
    return causedBy === developerName
  }
  
  // For non-bugs, use assignee as before
  return issue.assignee === developerName
}

/**
 * Filter issues to get only those a developer is responsible for
 * Handles both bug causation and regular issue assignment
 * @param {Array} issues - Array of JIRA issues
 * @param {string} developerName - Name of developer
 * @returns {Array} - Filtered issues the developer is responsible for
 */
export const filterIssuesByDeveloperResponsibility = (issues, developerName) => {
  if (!Array.isArray(issues) || !developerName) {
    return []
  }
  
  return issues.filter(issue => isDeveloperResponsibleForIssue(issue, developerName))
}

/**
 * Get bug attribution statistics for debugging and monitoring
 * @param {Array} bugs - Array of bug issues
 * @returns {Object} - Attribution statistics
 */
export const getBugAttributionStats = (bugs) => {
  if (!Array.isArray(bugs)) {
    return {
      total: 0,
      attributedByCustomField: 0,
      attributedByAssignee: 0,
      customFieldUsageRate: 0
    }
  }
  
  const bugIssues = bugs.filter(isBugIssue)
  let attributedByCustomField = 0
  let attributedByAssignee = 0
  
  bugIssues.forEach(bug => {
    const hasCustomField = bug.fields?.[BUG_CAUSED_BY_FIELDS.BUG_CAUSED_BY] || 
                          bug.fields?.[BUG_CAUSED_BY_FIELDS.BUG_CAUSED_BY_NEW]
    
    if (hasCustomField) {
      attributedByCustomField++
    } else {
      attributedByAssignee++
    }
  })
  
  return {
    total: bugIssues.length,
    attributedByCustomField,
    attributedByAssignee,
    customFieldUsageRate: bugIssues.length > 0 ? 
      (attributedByCustomField / bugIssues.length) * 100 : 0
  }
}

/**
 * Get detailed bug attribution information for a set of bugs
 * Useful for debugging and understanding attribution sources
 * @param {Array} bugs - Array of bug issues  
 * @returns {Array} - Array of attribution details
 */
export const getBugAttributionDetails = (bugs) => {
  if (!Array.isArray(bugs)) return []
  
  return bugs
    .filter(isBugIssue)
    .map(bug => {
      const causedByField = bug.fields?.[BUG_CAUSED_BY_FIELDS.BUG_CAUSED_BY]
      const causedByNewField = bug.fields?.[BUG_CAUSED_BY_FIELDS.BUG_CAUSED_BY_NEW]
      const attributedTo = getBugCausedBy(bug)
      
      return {
        key: bug.key,
        assignee: bug.assignee,
        causedByField,
        causedByNewField,
        attributedTo,
        attributionSource: causedByField ? 'customfield_10636' :
                          causedByNewField ? 'customfield_10002' : 
                          'assignee'
      }
    })
}

/**
 * Validate bug attribution data quality
 * @param {Array} bugs - Array of bug issues
 * @returns {Object} - Data quality report
 */
export const validateBugAttributionData = (bugs) => {
  if (!Array.isArray(bugs)) {
    return { valid: false, errors: ['Invalid bugs array'] }
  }
  
  const bugIssues = bugs.filter(isBugIssue)
  const errors = []
  const warnings = []
  
  let bugsWithoutAttribution = 0
  let bugsWithMultipleFields = 0
  
  bugIssues.forEach(bug => {
    const causedByField = bug.fields?.[BUG_CAUSED_BY_FIELDS.BUG_CAUSED_BY]
    const causedByNewField = bug.fields?.[BUG_CAUSED_BY_FIELDS.BUG_CAUSED_BY_NEW]
    
    // Check for bugs without any attribution
    if (!causedByField && !causedByNewField && !bug.assignee) {
      bugsWithoutAttribution++
      errors.push(`Bug ${bug.key} has no attribution (no custom fields or assignee)`)
    }
    
    // Check for multiple custom fields (potential data consistency issue)
    if (causedByField && causedByNewField && causedByField !== causedByNewField) {
      bugsWithMultipleFields++
      warnings.push(`Bug ${bug.key} has conflicting custom fields: ${causedByField} vs ${causedByNewField}`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalBugs: bugIssues.length,
      bugsWithoutAttribution,
      bugsWithMultipleFields,
      dataQualityScore: bugIssues.length > 0 ? 
        ((bugIssues.length - bugsWithoutAttribution) / bugIssues.length) * 100 : 100
    }
  }
}