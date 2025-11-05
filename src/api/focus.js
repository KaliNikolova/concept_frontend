import apiClient from './client.js';

/**
 * Focus API Service
 * Handles current focus task management
 */

/**
 * Set a task as the current focus
 * @param {string} user - User ID
 * @param {string} task - Task ID
 * @returns {Promise<{}>} Empty response
 */
export async function setCurrentTask(user, task) {
  return apiClient.post('/Focus/setCurrentTask', {
    user,
    task
  });
}

/**
 * Clear the current focus task
 * @param {string} user - User ID
 * @returns {Promise<{}>} Empty response
 */
export async function clearCurrentTask(user) {
  return apiClient.post('/Focus/clearCurrentTask', {
    user
  });
}

/**
 * Get the current focus task
 * @param {string} user - User ID
 * @returns {Promise<{task: string}>} Current task ID
 */
export async function getCurrentTask(user) {
  return apiClient.post('/Focus/getCurrentTask', {
    user
  });
}
