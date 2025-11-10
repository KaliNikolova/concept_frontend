import { defineStore } from 'pinia'
import * as scheduleApi from '@/api/schedule.js'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    busySlots: [],
    loading: false,
    error: null,
    fetching: false // Track if a fetch is in progress
  }),

  getters: {
    // Get all busy slots for a specific day
    slotsForDay: (state) => (date) => {
      if (!date) return []
      const targetDate = new Date(date)
      const targetDayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
      const targetDayEnd = new Date(targetDayStart)
      targetDayEnd.setDate(targetDayEnd.getDate() + 1)

      return state.busySlots.filter(slot => {
        const slotStart = new Date(slot.startTime)
        return slotStart >= targetDayStart && slotStart < targetDayEnd
      })
    }
  },

  actions: {
    /**
     * Fetch all busy slots from Schedule concept
     * @param {string} session - Session token
     */
    async fetchSlots(session) {
      if (!session) {
        this.error = 'No session token available'
        this.loading = false
        this.fetching = false
        return
      }

      // Prevent multiple simultaneous fetches
      if (this.fetching) {
        return
      }

      this.loading = true
      this.fetching = true
      this.error = null

      try {
        // Directly query Schedule concept for busy slots (following Schedule/_getSlots pattern)
        console.log('Fetching busy slots from backend...')
        const response = await scheduleApi.getSlots(session)
        console.log('Raw response from getSlots:', response)

        // Backend returns: { "slots": [...] } - direct array of slot objects
        let slotsArray = []
        if (response?.slots && Array.isArray(response.slots)) {
          // New format: { slots: [...] } - direct array
          console.log('Using format: response.slots (direct array)')
          slotsArray = response.slots
        } else if (Array.isArray(response)) {
          // Fallback for old format
          console.log('Using fallback: direct array')
          slotsArray = response
        }

        this.busySlots = slotsArray
        console.log('✓ Loaded', this.busySlots.length, 'busy slots')
      } catch (err) {
        const errorMsg = err.message || 'Failed to load busy slots'
        this.error = errorMsg
        this.busySlots = []
      } finally {
        this.loading = false
        this.fetching = false
      }
    }
  }
})

