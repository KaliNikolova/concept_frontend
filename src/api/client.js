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
   * @param {number} timeoutMs - Optional timeout in milliseconds (default: 5000)
   * @returns {Promise<object>} Response data
   * @throws {Error} If the request fails
   */
  async post(endpoint, data, timeoutMs = 5000) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
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
