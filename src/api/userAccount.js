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
 * @returns {Promise<{user: string}>} User ID
 */
export async function login(email, password) {
  return apiClient.post('/UserAccount/login', {
    email,
    password
  });
}

/**
 * Update user profile display name
 * @param {string} user - User ID
 * @param {string} newDisplayName - New display name
 * @returns {Promise<{}>} Empty response
 */
export async function updateProfile(user, newDisplayName) {
  return apiClient.post('/UserAccount/updateProfile', {
    user,
    newDisplayName
  });
}

/**
 * Delete user account
 * @param {string} user - User ID
 * @returns {Promise<{}>} Empty response
 */
export async function deleteAccount(user) {
  return apiClient.post('/UserAccount/deleteAccount', {
    user
  });
}

/**
 * Get user profile information
 * @param {string} user - User ID
 * @returns {Promise<Array<{displayName: string, email: string}>>} User profile
 */
export async function getUserProfile(user) {
  return apiClient.post('/UserAccount/_getUserProfile', {
    user
  });
}

/**
 * Find user by email
 * @param {string} email - Email address
 * @returns {Promise<Array<{user: string}>>} User ID
 */
export async function findUserByEmail(email) {
  return apiClient.post('/UserAccount/_findUserByEmail', {
    email
  });
}
