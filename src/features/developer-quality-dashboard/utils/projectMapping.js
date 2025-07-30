/**
 * Project Mapping Utilities
 * Helper functions to convert between project names and keys
 */

import { memberConfiguration } from '../../../constants/memberConfiguration'

/**
 * Create a map from project names to project keys
 * @returns {Map} Map with project name as key and project key as value
 */
export const createProjectNameToKeyMap = () => {
  const projectNameToKeyMap = new Map()
  memberConfiguration.projects.forEach(project => {
    projectNameToKeyMap.set(project.name, project.key)
  })
  return projectNameToKeyMap
}

/**
 * Create a map from project keys to project names
 * @returns {Map} Map with project key as key and project name as value
 */
export const createProjectKeyToNameMap = () => {
  const projectKeyToNameMap = new Map()
  memberConfiguration.projects.forEach(project => {
    projectKeyToNameMap.set(project.key, project.name)
  })
  return projectKeyToNameMap
}

/**
 * Convert project names to project keys
 * @param {Array<string>} projectNames - Array of project names
 * @returns {Array<string>} Array of project keys
 */
export const convertProjectNamesToKeys = (projectNames = []) => {
  if (!projectNames || projectNames.length === 0) {
    return []
  }
  
  const nameToKeyMap = createProjectNameToKeyMap()
  
  return projectNames.map(projectName => {
    const projectKey = nameToKeyMap.get(projectName)
    return projectKey || projectName // fallback to original if not found
  }).filter(Boolean)
}

/**
 * Convert project keys to project names
 * @param {Array<string>} projectKeys - Array of project keys
 * @returns {Array<string>} Array of project names
 */
export const convertProjectKeysToNames = (projectKeys = []) => {
  if (!projectKeys || projectKeys.length === 0) {
    return []
  }
  
  const keyToNameMap = createProjectKeyToNameMap()
  
  return projectKeys.map(projectKey => {
    const projectName = keyToNameMap.get(projectKey)
    return projectName || projectKey // fallback to original if not found
  }).filter(Boolean)
}

/**
 * Get project key from project name
 * @param {string} projectName - Project name
 * @returns {string|null} Project key or null if not found
 */
export const getProjectKeyFromName = (projectName) => {
  const nameToKeyMap = createProjectNameToKeyMap()
  return nameToKeyMap.get(projectName) || null
}

/**
 * Get project name from project key
 * @param {string} projectKey - Project key
 * @returns {string|null} Project name or null if not found
 */
export const getProjectNameFromKey = (projectKey) => {
  const keyToNameMap = createProjectKeyToNameMap()
  return keyToNameMap.get(projectKey) || null
}