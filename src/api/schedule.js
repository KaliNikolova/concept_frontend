import apiClient from './client.js';

/**
 * Schedule API Service
 * Handles schedule and busy slot management
 */

/**
 * Create a new manual busy slot
 * @param {string} user - User ID
 * @param {string|Date} startTime - Slot start time (DateTime)
 * @param {string|Date} endTime - Slot end time (DateTime)
 * @param {string} description - Slot description
 * @returns {Promise<{slot: string}>} Slot ID
 */
export async function blockTime(user, startTime, endTime, description) {
  return apiClient.post('/Schedule/blockTime', {
    user,
    startTime: startTime instanceof Date ? startTime.toISOString() : startTime,
    endTime: endTime instanceof Date ? endTime.toISOString() : endTime,
    description
  });
}

/**
 * Update a manual busy slot
 * @param {string} slotId - Slot ID
 * @param {string|Date} newStartTime - New start time (DateTime)
 * @param {string|Date} newEndTime - New end time (DateTime)
 * @param {string} newDescription - New description
 * @returns {Promise<{}>} Empty response
 */
export async function updateSlot(slotId, newStartTime, newEndTime, newDescription) {
  return apiClient.post('/Schedule/updateSlot', {
    slotId,
    newStartTime: newStartTime instanceof Date ? newStartTime.toISOString() : newStartTime,
    newEndTime: newEndTime instanceof Date ? newEndTime.toISOString() : newEndTime,
    newDescription
  });
}

/**
 * Delete a manual busy slot
 * @param {string} slotId - Slot ID
 * @returns {Promise<{}>} Empty response
 */
export async function deleteSlot(slotId) {
  return apiClient.post('/Schedule/deleteSlot', {
    slotId
  });
}

/**
 * Sync calendar with external events
 * @param {string} user - User ID
 * @param {Array<{startTime: string|Date, endTime: string|Date, description: string}>} externalEvents - External calendar events
 * @returns {Promise<{}>} Empty response
 */
export async function syncCalendar(user, externalEvents) {
  const formattedEvents = externalEvents.map(event => ({
    startTime: event.startTime instanceof Date ? event.startTime.toISOString() : event.startTime,
    endTime: event.endTime instanceof Date ? event.endTime.toISOString() : event.endTime,
    description: event.description
  }));

  return apiClient.post('/Schedule/syncCalendar', {
    user,
    externalEvents: formattedEvents
  });
}

/**
 * Delete all busy slots for a user
 * @param {string} user - User ID
 * @returns {Promise<{}>} Empty response
 */
export async function deleteAllForUser(user) {
  return apiClient.post('/Schedule/deleteAllForUser', {
    user
  });
}

/**
 * Get all busy slots for a user
 * @param {string} user - User ID
 * @returns {Promise<Array<{_id: string, owner: string, startTime: string, endTime: string, description: string, origin: string}>>} Slot list
 */
export async function getSlots(user) {
  return apiClient.post('/Schedule/_getSlots', {
    user
  });
}
