import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    userSession: null,
    appState: 'tasks', // 'tasks', 'focus', or 'plan'
    currentFocusTask: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.userSession,
    userId: (state) => state.userSession?.user || null
  },

  actions: {
    setUserSession(userData) {
      this.userSession = userData
      // Persist to localStorage
      if (userData) {
        localStorage.setItem('userSession', JSON.stringify(userData))
      } else {
        localStorage.removeItem('userSession')
      }
    },

    setAppState(state) {
      this.appState = state
    },

    setCurrentFocusTask(task) {
      this.currentFocusTask = task
    },

    logout() {
      this.userSession = null
      this.appState = 'tasks'
      this.currentFocusTask = null
      localStorage.removeItem('userSession')
    },

    // Load user session from localStorage on app start
    loadUserSession() {
      const saved = localStorage.getItem('userSession')
      if (saved) {
        try {
          this.userSession = JSON.parse(saved)
        } catch (e) {
          console.error('Failed to load user session:', e)
          localStorage.removeItem('userSession')
        }
      }
    }
  }
})

