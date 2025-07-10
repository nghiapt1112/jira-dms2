import axiosInstance from './axiosConfig'

class ApiService {
  async get(url, config = {}) {
    return axiosInstance.get(url, config)
  }

  async post(url, data, config = {}) {
    return axiosInstance.post(url, data, config)
  }

  async put(url, data, config = {}) {
    return axiosInstance.put(url, data, config)
  }

  async patch(url, data, config = {}) {
    return axiosInstance.patch(url, data, config)
  }

  async delete(url, config = {}) {
    return axiosInstance.delete(url, config)
  }

  setAuthToken(token) {
    if (token) {
      localStorage.setItem('jira-dms-token', token)
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      localStorage.removeItem('jira-dms-token')
      delete axiosInstance.defaults.headers.common['Authorization']
    }
  }

  clearAuthToken() {
    this.setAuthToken(null)
  }

  isAuthenticated() {
    return !!localStorage.getItem('jira-dms-token')
  }
}

export default new ApiService()