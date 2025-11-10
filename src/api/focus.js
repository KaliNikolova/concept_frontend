import apiClient from './client.js';

/**
 * Focus API Service
 * Handles current focus task management
 */

/**
 * Set a task as the current focus
 * @param {string} session - Session token
 * @param {string} task - Task ID
 * @returns {Promise<{}>} Empty response
 */
export async function setCurrentTask(session, task) {
  return apiClient.post('/Focus/setCurrentTask', {
    session,
    task
  });
}

/**
 * Clear the current focus task
 * @param {string} session - Session token
 * @returns {Promise<{}>} Empty response
 */
export async function clearCurrentTask(session) {
  return apiClient.post('/Focus/clearCurrentTask', {
    session
  });
}

/**
 * Get the current focus task
 * @param {string} session - Session token
 * @returns {Promise<{task: string}>} Current task ID
 */
export async function getCurrentTask(session) {
  console.log('focus.js: Fetching current task from backend...');
  const response = await apiClient.post('/Focus/_getCurrentTask', {
    session
  }, 15000); // 15 second timeout
  console.log('focus.js: Received response:', response);
  return response;
}
