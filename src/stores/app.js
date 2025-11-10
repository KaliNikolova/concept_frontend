import { defineStore } from 'pinia'
import { useTasksStore } from './tasks.js'
import { usePlannerStore } from './planner.js'
import { useScheduleStore } from './schedule.js'

/**
 * Simplified App Store
 * 
 * Only stores essential UI state and session token.
 * User data (email, displayName) is fetched from backend when needed via UserAccount/_getUserProfile
 */
export const useAppStore = defineStore('app', {
  state: () => ({
    sessionToken: null, // Just the session token
    appState: 'tasks' // 'tasks', 'focus', or 'plan'
  }),

  getters: {
    isAuthenticated: (state) => !!state.sessionToken
  },

  actions: {
    /**
     * Set session token after login
     * @param {string} session - Session token from backend
     */
    setSessionToken(session) {
      this.sessionToken = session
      // Persist only session token to localStorage
      if (session) {
        localStorage.setItem('sessionToken', session)
      } else {
        localStorage.removeItem('sessionToken')
      }
    },

    /**
     * Set current app view state
     */
    setAppState(state) {
      this.appState = state
    },

    /**
     * Logout: clear session and reset state
     */
    logout() {
      // Clear all stores to prevent data leakage between users
      const tasksStore = useTasksStore()
      const plannerStore = usePlannerStore()
      const scheduleStore = useScheduleStore()
      
      tasksStore.clearTasks()
      plannerStore.clearScheduledTasks()
      scheduleStore.busySlots = []
      
      // Clear session and state
      this.sessionToken = null
      this.appState = 'tasks'
      localStorage.removeItem('sessionToken')
    },

    /**
     * Load session token from localStorage on app start
     */
    loadUserSession() {
      const saved = localStorage.getItem('sessionToken')
      if (saved) {
        this.sessionToken = saved
      }
    }
  }
})

