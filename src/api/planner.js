import apiClient from './client.js';

/**
 * Planner API Service
 * Handles task planning and scheduling
 */

/**
 * Plan a full day by assigning tasks to available time slots
 * @param {string} session - Session token
 * @param {Array<{id: string, duration: number}>} tasks - Array of tasks with IDs and durations
 * @param {Array<{start: string|Date, end: string|Date}>} busySlots - Array of busy time slots
 * @param {string|Date} planningDate - Optional date to plan for (defaults to today in server timezone)
 * @returns {Promise<{firstTask: string}>} First task ID
 */
export async function planDay(session, tasks, busySlots, planningDate = null) {
  const formattedBusySlots = busySlots.map(slot => ({
    start: slot.start instanceof Date ? slot.start.toISOString() : slot.start,
    end: slot.end instanceof Date ? slot.end.toISOString() : slot.end
  }));

  console.log('Sending request to /Planner/planDay with:', {
    session,
    tasksCount: tasks.length,
    busySlotsCount: formattedBusySlots.length
  });
  
  // Log the exact payload being sent
  const payload = {
    session,  // Backend middleware converts session to user automatically
    tasks,
    busySlots: formattedBusySlots
  };
  
  // Add planningDate if provided (for timezone correction)
  if (planningDate) {
    payload.planningDate = planningDate instanceof Date ? planningDate.toISOString() : planningDate;
  }
  console.log('Full payload being sent:', JSON.stringify(payload, null, 2));
  console.log('Tasks sample:', JSON.stringify(tasks.slice(0, 2), null, 2));
  console.log('BusySlots sample:', JSON.stringify(formattedBusySlots.slice(0, 2), null, 2));

  try {
    // Increase timeout to 20 seconds for planning (can take time to schedule)
    const response = await apiClient.post('/Planner/planDay', payload, 20000);

    console.log('Received response from /Planner/planDay:', response);
    return response;
  } catch (error) {
    console.error('Error in planDay API call:', error);
    console.error('Request payload was:', JSON.stringify(payload, null, 2));
    throw error;
  }
}

/**
 * Replan from current time forward
 * @param {string} session - Session token
 * @param {Array<{id: string, duration: number}>} tasks - Array of tasks with IDs and durations
 * @param {Array<{start: string|Date, end: string|Date}>} busySlots - Array of busy time slots
 * @param {string|Date} planningDate - Optional date to plan for (defaults to today in server timezone)
 * @returns {Promise<{firstTask: string}>} First task ID
 */
export async function replan(session, tasks, busySlots, planningDate = null) {
  const formattedBusySlots = busySlots.map(slot => ({
    start: slot.start instanceof Date ? slot.start.toISOString() : slot.start,
    end: slot.end instanceof Date ? slot.end.toISOString() : slot.end
  }));

  const payload = {
    session,
    tasks,
    busySlots: formattedBusySlots
  };
  
  // Add planningDate if provided (for timezone correction)
  if (planningDate) {
    payload.planningDate = planningDate instanceof Date ? planningDate.toISOString() : planningDate;
  }

  return apiClient.post('/Planner/replan', payload);
}

/**
 * Clear all scheduled tasks for the current day
 * @param {string} session - Session token
 * @returns {Promise<{}>} Empty response
 */
export async function clearDay(session) {
  return apiClient.post('/Planner/clearDay', {
    session
  });
}

/**
 * Delete all scheduled tasks for the authenticated user
 * @param {string} session - Session token
 * @returns {Promise<{}>} Empty response
 */
export async function deleteAllForUser(session) {
  return apiClient.post('/Planner/deleteAllForUser', {
    session
  });
}

/**
 * Get the next task after a completed task
 * @param {string} session - Session token
 * @param {string} completedTask - Completed task ID
 * @returns {Promise<{nextTask: string}>} Next task ID
 */
export async function getNextTask(session, completedTask) {
  return apiClient.post('/Planner/getNextTask', {
    session,
    completedTask
  });
}

/**
 * Get all scheduled tasks for the authenticated user from Planner concept
 * This follows the same pattern as Schedule/_getSlots (following _getXxx pattern)
 * Backend queries Planner.scheduledTasks collection directly
 * 
 * @param {string} session - Session token
 * @returns {Promise<{tasks: Array<{_id: string, owner: string, task: string, plannedStart: string, plannedEnd: string}>}>} Response with tasks array
 */
export async function getScheduledTasks(session) {
  // Query Planner concept for scheduled tasks (following _getXxx pattern like Schedule/_getSlots)
  return apiClient.post('/Planner/_getScheduledTasks', { session }, 15000); // 15 second timeout
}