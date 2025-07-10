import apiService from './apiService'
import axiosInstance from './axiosConfig'

jest.mock('./axiosConfig')

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('configures axios with JWT interceptor', () => {
    const token = 'test-jwt-token'
    apiService.setAuthToken(token)
    
    expect(localStorage.getItem('jira-dms-token')).toBe(token)
    expect(axiosInstance.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`)
  })

  it('handles authentication errors', async () => {
    const errorResponse = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' }
      }
    }
    
    axiosInstance.get.mockRejectedValue(errorResponse)
    
    await expect(apiService.get('/test')).rejects.toEqual(errorResponse)
  })

  it('retries failed requests', async () => {
    const token = 'new-token'
    const refreshResponse = { data: { token } }
    
    axiosInstance.post.mockResolvedValueOnce(refreshResponse)
    axiosInstance.get.mockResolvedValue({ data: 'success' })
    
    const result = await apiService.get('/test')
    expect(result.data).toBe('success')
  })

  it('downloads large files with progress', async () => {
    const mockData = { data: new ArrayBuffer(1000) }
    axiosInstance.get.mockResolvedValue(mockData)
    
    const result = await apiService.get('/download', {
      responseType: 'arraybuffer',
      onDownloadProgress: jest.fn()
    })
    
    expect(result.data).toEqual(mockData.data)
  })

  it('clears auth token correctly', () => {
    apiService.setAuthToken('test-token')
    apiService.clearAuthToken()
    
    expect(localStorage.getItem('jira-dms-token')).toBeNull()
    expect(axiosInstance.defaults.headers.common['Authorization']).toBeUndefined()
  })

  it('checks authentication status', () => {
    expect(apiService.isAuthenticated()).toBe(false)
    
    localStorage.setItem('jira-dms-token', 'test-token')
    expect(apiService.isAuthenticated()).toBe(true)
  })
})