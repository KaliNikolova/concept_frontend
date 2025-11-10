import apiClient from './client.js';

/**
 * UserAccount API Service
 * Handles user authentication and profile management
 */

/**
 * Register a new user account
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name
 * @returns {Promise<{user: string}>} User ID
 */
export async function register(email, password, displayName) {
  return apiClient.post('/UserAccount/register', {
    email,
    password,
    displayName
  });
}

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{session: string}>} Session token
 */
export async function login(email, password) {
  return apiClient.post('/UserAccount/login', {
    email,
    password
  });
}

/**
 * Logout and invalidate the current session
 * @param {string} session - Session token
 * @returns {Promise<{}>} Empty response
 */
export async function logout(session) {
  return apiClient.post('/UserAccount/logout', {
    session
  });
}

/**
 * Update user profile display name
 * @param {string} session - Session token
 * @param {string} newDisplayName - New display name
 * @returns {Promise<{}>} Empty response
 */
export async function updateProfile(session, newDisplayName) {
  return apiClient.post('/UserAccount/updateProfile', {
    session,
    newDisplayName
  });
}

/**
 * Delete user account
 * @param {string} session - Session token
 * @returns {Promise<{}>} Empty response
 */
export async function deleteAccount(session) {
  return apiClient.post('/UserAccount/deleteAccount', {
    session
  });
}

/**
 * Get user profile information for the authenticated user
 * @param {string} session - Session token
 * @returns {Promise<{profile: {displayName: string, email: string}}>} User profile
 */
export async function getUserProfile(session) {
  return apiClient.post('/UserAccount/_getUserProfile', {
    session
  });
}

/**
 * Find user by email
 * @param {string} session - Session token
 * @param {string} email - Email address
 * @returns {Promise<string>} User ID
 */
export async function findUserByEmail(session, email) {
  return apiClient.post('/UserAccount/_findUserByEmail', {
    session,
    email
  });
}

/**
 * Set user's working day hours
 * @param {string} session - Session token
 * @param {string} startTime - Start time in HH:MM format (e.g., "09:00")
 * @param {string} endTime - End time in HH:MM format (e.g., "19:00")
 * @returns {Promise<{status: string}>} Success status
 */
export async function setWorkingHours(session, startTime, endTime) {
  console.log('userAccount.js: Setting working hours:', { startTime, endTime });
  const response = await apiClient.post('/UserAccount/setWorkingHours', {
    session,
    startTime,
    endTime
  });
  console.log('userAccount.js: setWorkingHours response:', response);
  return response;
}

/**
 * Get user's working day hours
 * @param {string} session - Session token
 * @returns {Promise<{workingHours: {start: string, end: string}}>} Working hours
 */
export async function getWorkingHours(session) {
  console.log('userAccount.js: Getting working hours...');
  const response = await apiClient.post('/UserAccount/_getWorkingHours', {
    session
  });
  console.log('userAccount.js: getWorkingHours response:', response);
  return response;
}
