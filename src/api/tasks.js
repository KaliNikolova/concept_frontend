import apiClient from './client.js';

/**
 * Tasks API Service
 * Handles task creation, updates, and management
 */

/**
 * Create an empty task list for a new user
 * @param {string} session - Session token
 * @returns {Promise<{}>} Empty response
 */
export async function createUserTasks(session) {
  return apiClient.post('/Tasks/createUserTasks', {
    session
  });
}

/**
 * Create a new task
 * @param {string} session - Session token
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @param {string|Date} dueDate - Task due date (DateTime)
 * @param {number} estimatedDuration - Estimated duration in minutes
 * @returns {Promise<{task: string}>} Task ID
 */
export async function createTask(session, title, description, dueDate, estimatedDuration) {
  return apiClient.post('/Tasks/createTask', {
    session,
    title,
    description,
    dueDate: dueDate instanceof Date ? dueDate.toISOString() : dueDate,
    estimatedDuration
  });
}

/**
 * Update an existing task
 * @param {string} session - Session token
 * @param {string} task - Task ID
 * @param {string} newTitle - New title
 * @param {string} newDescription - New description
 * @param {string|Date} newDueDate - New due date (DateTime)
 * @param {number} newEstimatedDuration - New estimated duration in minutes
 * @returns {Promise<{}>} Empty response
 */
export async function updateTask(session, task, newTitle, newDescription, newDueDate, newEstimatedDuration) {
  return apiClient.post('/Tasks/updateTask', {
    session,
    task,
    newTitle,
    newDescription,
    newDueDate: newDueDate instanceof Date ? newDueDate.toISOString() : newDueDate,
    newEstimatedDuration
  });
}

/**
 * Reorder tasks
 * @param {string} session - Session token
 * @param {string[]} newOrder - Array of task IDs in new order
 * @returns {Promise<{}>} Empty response
 */
export async function reorderTasks(session, newOrder) {
  return apiClient.post('/Tasks/reorderTasks', {
    session,
    newOrder
  }, 15000); // 15 second timeout
}

/**
 * Mark a task as complete
 * @param {string} session - Session token
 * @param {string} task - Task ID
 * @returns {Promise<{}>} Empty response
 */
export async function markTaskComplete(session, task) {
  return apiClient.post('/Tasks/markTaskComplete', {
    session,
    task
  });
}

/**
 * Delete a task
 * @param {string} session - Session token
 * @param {string} task - Task ID
 * @returns {Promise<{}>} Empty response
 */
export async function deleteTask(session, task) {
  return apiClient.post('/Tasks/deleteTask', {
    session,
    task
  });
}

/**
 * Delete all tasks for the authenticated user
 * @param {string} session - Session token
 * @returns {Promise<{}>} Empty response
 */
export async function deleteAllForUser(session) {
  return apiClient.post('/Tasks/deleteAllForUser', {
    session
  });
}

/**
 * Get all tasks for the authenticated user
 * @param {string} session - Session token
 * @returns {Promise<Array<{_id: string, owner: string, title: string, description: string, dueDate: string, estimatedDuration: number, status: string}>>} Task list
 */
export async function getTasks(session) {
  // Increase timeout to 15 seconds for tasks query
  return apiClient.post('/Tasks/_getTasks', {
    session
  }, 15000);
}

/**
 * Get remaining (TODO) tasks for the authenticated user
 * @param {string} session - Session token
 * @returns {Promise<Array<{_id: string, owner: string, title: string, description: string, dueDate: string, estimatedDuration: number, status: string}>>} Task list
 */
export async function getRemainingTasks(session) {
  return apiClient.post('/Tasks/_getRemainingTasks', {
    session
  }, 15000);
}
