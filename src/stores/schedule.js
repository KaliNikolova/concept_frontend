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
     * This directly queries the Schedule concept (no sync - syncs don't exist in backend yet)
     * @param {string} userId - User ID
     */
    async fetchSlots(userId) {
      if (!userId) {
        this.error = 'No user ID available'
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
        const slots = await scheduleApi.getSlots(userId)

        // Handle different possible response formats
        let slotsArray = []
        if (Array.isArray(slots)) {
          slotsArray = slots
        } else if (slots && Array.isArray(slots.slots)) {
          slotsArray = slots.slots
        } else if (slots && Array.isArray(slots.data)) {
          slotsArray = slots.data
        }

        this.busySlots = slotsArray
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

