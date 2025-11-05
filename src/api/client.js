import { API_BASE_URL } from '../config.js';

/**
 * API Client utility for making requests to the backend
 */
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  /**
   * Make a POST request to an API endpoint
   * @param {string} endpoint - API endpoint path (e.g., '/UserAccount/register')
   * @param {object} data - Request body data
   * @returns {Promise<object>} Response data
   * @throws {Error} If the request fails
   */
  async post(endpoint, data) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, throw a more descriptive error
        throw new Error(`Invalid response from server (status: ${response.status})`);
      }

      if (!response.ok || responseData.error) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }

      return responseData;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Could not connect to the API server');
      }
      throw error;
    }
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
