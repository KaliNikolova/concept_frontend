import apiClient from './client.js';

/**
 * Planner API Service
 * Handles task planning and scheduling
 */

/**
 * Plan a full day by assigning tasks to available time slots
 * @param {string} user - User ID
 * @param {Array<{id: string, duration: number}>} tasks - Array of tasks with IDs and durations
 * @param {Array<{start: string|Date, end: string|Date}>} busySlots - Array of busy time slots
 * @returns {Promise<{firstTask: string}>} First task ID
 */
export async function planDay(user, tasks, busySlots) {
  const formattedBusySlots = busySlots.map(slot => ({
    start: slot.start instanceof Date ? slot.start.toISOString() : slot.start,
    end: slot.end instanceof Date ? slot.end.toISOString() : slot.end
  }));

  console.log('Sending request to /Planner/planDay with:', {
    user,
    tasksCount: tasks.length,
    busySlotsCount: formattedBusySlots.length
  });
  
  // Log the exact payload being sent
  const payload = {
    user,
    tasks,
    busySlots: formattedBusySlots
  };
  console.log('Full payload being sent:', JSON.stringify(payload, null, 2));
  console.log('Tasks sample:', JSON.stringify(tasks.slice(0, 2), null, 2));
  console.log('BusySlots sample:', JSON.stringify(formattedBusySlots.slice(0, 2), null, 2));

  const response = await apiClient.post('/Planner/planDay', payload);

  console.log('Received response from /Planner/planDay:', response);
  return response;
}

/**
 * Replan from current time forward
 * @param {string} user - User ID
 * @param {Array<{id: string, duration: number}>} tasks - Array of tasks with IDs and durations
 * @param {Array<{start: string|Date, end: string|Date}>} busySlots - Array of busy time slots
 * @returns {Promise<{firstTask: string}>} First task ID
 */
export async function replan(user, tasks, busySlots) {
  const formattedBusySlots = busySlots.map(slot => ({
    start: slot.start instanceof Date ? slot.start.toISOString() : slot.start,
    end: slot.end instanceof Date ? slot.end.toISOString() : slot.end
  }));

  return apiClient.post('/Planner/replan', {
    user,
    tasks,
    busySlots: formattedBusySlots
  });
}

/**
 * Clear all scheduled tasks for the current day
 * @param {string} user - User ID
 * @returns {Promise<{}>} Empty response
 */
export async function clearDay(user) {
  return apiClient.post('/Planner/clearDay', {
    user
  });
}

/**
 * Delete all scheduled tasks for a user
 * @param {string} user - User ID
 * @returns {Promise<{}>} Empty response
 */
export async function deleteAllForUser(user) {
  return apiClient.post('/Planner/deleteAllForUser', {
    user
  });
}

/**
 * Get the next task after a completed task
 * @param {string} user - User ID
 * @param {string} completedTask - Completed task ID
 * @returns {Promise<{nextTask: string}>} Next task ID
 */
export async function getNextTask(user, completedTask) {
  return apiClient.post('/Planner/getNextTask', {
    user,
    completedTask
  });
}

/**
 * Get all scheduled tasks for a user from Planner concept
 * This follows the same pattern as Schedule/_getSlots (following _getXxx pattern)
 * Backend queries Planner.scheduledTasks collection directly
 * 
 * @param {string} user - User ID
 * @returns {Promise<{tasks: Array<{_id: string, owner: string, task: string, plannedStart: string, plannedEnd: string}>}>} Response with tasks array
 */
export async function getScheduledTasks(user) {
  // Query Planner concept for scheduled tasks (following _getXxx pattern like Schedule/_getSlots)
  return apiClient.post('/Planner/_getScheduledTasks', { user });
}