import apiClient from './client.js';

/**
 * Tasks API Service
 * Handles task creation, updates, and management
 */

/**
 * Create an empty task list for a new user
 * @param {string} user - User ID
 * @returns {Promise<{}>} Empty response
 */
export async function createUserTasks(user) {
  return apiClient.post('/Tasks/createUserTasks', {
    user
  });
}

/**
 * Create a new task
 * @param {string} owner - User ID (owner)
 * @param {string} title - Task title
 * @param {string} description - Task description
 * @param {string|Date} dueDate - Task due date (DateTime)
 * @param {number} estimatedDuration - Estimated duration in minutes
 * @returns {Promise<{task: string}>} Task ID
 */
export async function createTask(owner, title, description, dueDate, estimatedDuration) {
  return apiClient.post('/Tasks/createTask', {
    owner,
    title,
    description,
    dueDate: dueDate instanceof Date ? dueDate.toISOString() : dueDate,
    estimatedDuration
  });
}

/**
 * Update an existing task
 * @param {string} task - Task ID
 * @param {string} newTitle - New title
 * @param {string} newDescription - New description
 * @param {string|Date} newDueDate - New due date (DateTime)
 * @param {number} newEstimatedDuration - New estimated duration in minutes
 * @returns {Promise<{}>} Empty response
 */
export async function updateTask(task, newTitle, newDescription, newDueDate, newEstimatedDuration) {
  return apiClient.post('/Tasks/updateTask', {
    task,
    newTitle,
    newDescription,
    newDueDate: newDueDate instanceof Date ? newDueDate.toISOString() : newDueDate,
    newEstimatedDuration
  });
}

/**
 * Reorder tasks
 * @param {string} user - User ID
 * @param {string[]} newOrder - Array of task IDs in new order
 * @returns {Promise<{}>} Empty response
 */
export async function reorderTasks(user, newOrder) {
  return apiClient.post('/Tasks/reorderTasks', {
    user,
    newOrder
  });
}

/**
 * Mark a task as complete
 * @param {string} task - Task ID
 * @returns {Promise<{}>} Empty response
 */
export async function markTaskComplete(task) {
  return apiClient.post('/Tasks/markTaskComplete', {
    task
  });
}

/**
 * Delete a task
 * @param {string} task - Task ID
 * @returns {Promise<{}>} Empty response
 */
export async function deleteTask(task) {
  return apiClient.post('/Tasks/deleteTask', {
    task
  });
}

/**
 * Delete all tasks for a user
 * @param {string} user - User ID
 * @returns {Promise<{}>} Empty response
 */
export async function deleteAllForUser(user) {
  return apiClient.post('/Tasks/deleteAllForUser', {
    user
  });
}

/**
 * Get all tasks for a user
 * @param {string} user - User ID
 * @returns {Promise<Array<{_id: string, owner: string, description: string, dueDate: string, estimatedDuration: number, status: string}>>} Task list
 */
export async function getTasks(user) {
  return apiClient.post('/Tasks/_getTasks', {
    user
  });
}

/**
 * Get remaining (TODO) tasks for a user
 * @param {string} user - User ID
 * @returns {Promise<Array<{_id: string, owner: string, description: string, dueDate: string, estimatedDuration: number, status: string}>>} Task list
 */
export async function getRemainingTasks(user) {
  return apiClient.post('/Tasks/_getRemainingTasks', {
    user
  });
}
