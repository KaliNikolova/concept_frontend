import apiClient from './client.js';

/**
 * Schedule API Service
 * Handles schedule and busy slot management
 */

/**
 * Create a new manual busy slot
 * @param {string} session - Session token
 * @param {string|Date} startTime - Slot start time (DateTime)
 * @param {string|Date} endTime - Slot end time (DateTime)
 * @param {string} description - Slot description
 * @returns {Promise<{slot: string}>} Slot ID
 */
export async function blockTime(session, startTime, endTime, description) {
  return apiClient.post('/Schedule/blockTime', {
    session,
    startTime: startTime instanceof Date ? startTime.toISOString() : startTime,
    endTime: endTime instanceof Date ? endTime.toISOString() : endTime,
    description
  }, 15000); // 15 second timeout
}

/**
 * Update a manual busy slot
 * @param {string} session - Session token
 * @param {string} slotId - Slot ID
 * @param {string|Date} newStartTime - New start time (DateTime)
 * @param {string|Date} newEndTime - New end time (DateTime)
 * @param {string} newDescription - New description
 * @returns {Promise<{}>} Empty response
 */
export async function updateSlot(session, slotId, newStartTime, newEndTime, newDescription) {
  return apiClient.post('/Schedule/updateSlot', {
    session,
    slot: slotId,  // Backend expects 'slot' not 'slotId'
    startTime: newStartTime instanceof Date ? newStartTime.toISOString() : newStartTime,
    endTime: newEndTime instanceof Date ? newEndTime.toISOString() : newEndTime,
    description: newDescription  // Backend expects 'description' not 'newDescription'
  });
}

/**
 * Delete a manual busy slot
 * @param {string} session - Session token
 * @param {string} slotId - Slot ID
 * @returns {Promise<{}>} Empty response
 */
export async function deleteSlot(session, slotId) {
  return apiClient.post('/Schedule/deleteSlot', {
    session,
    slotId
  });
}

/**
 * Sync calendar with external events
 * @param {string} session - Session token
 * @param {Array<{startTime: string|Date, endTime: string|Date, description: string}>} externalEvents - External calendar events
 * @returns {Promise<{}>} Empty response
 */
export async function syncCalendar(session, externalEvents) {
  const formattedEvents = externalEvents.map(event => ({
    startTime: event.startTime instanceof Date ? event.startTime.toISOString() : event.startTime,
    endTime: event.endTime instanceof Date ? event.endTime.toISOString() : event.endTime,
    description: event.description
  }));

  return apiClient.post('/Schedule/syncCalendar', {
    session,
    externalEvents: formattedEvents
  });
}

/**
 * Delete all busy slots for the authenticated user
 * @param {string} session - Session token
 * @returns {Promise<{}>} Empty response
 */
export async function deleteAllForUser(session) {
  return apiClient.post('/Schedule/deleteAllForUser', {
    session
  });
}

/**
 * Get all busy slots for the authenticated user
 * @param {string} session - Session token
 * @returns {Promise<Array<{_id: string, owner: string, startTime: string, endTime: string, description: string, origin: string}>>} Slot list
 */
export async function getSlots(session) {
  return apiClient.post('/Schedule/_getSlots', {
    session
  }, 15000); // 15 second timeout
}
