import { defineStore } from 'pinia'
import * as plannerApi from '@/api/planner.js'

/**
 * Simplified Planner Store
 * 
 * All scheduling logic is handled by the backend.
 * This store only fetches and displays scheduled tasks from the backend.
 */
export const usePlannerStore = defineStore('planner', {
  state: () => ({
    scheduledTasks: [], // Array of scheduled tasks from backend
    loading: false,
    error: null
  }),

  getters: {
    // Get all scheduled tasks (sorted by start time)
    // Show all tasks without date filtering since we want to see the plan
    todayScheduledTasks: (state) => {
      console.log('Computing todayScheduledTasks, total tasks:', state.scheduledTasks.length)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTime = today.getTime()
      
      const result = [...state.scheduledTasks]
        .filter(task => {
          // Only include tasks scheduled for today
          const taskDate = new Date(task.plannedStart)
          taskDate.setHours(0, 0, 0, 0)
          return taskDate.getTime() === todayTime
        })
        .sort((a, b) => {
          return new Date(a.plannedStart) - new Date(b.plannedStart)
        })
      console.log('Returning', result.length, 'tasks for today (filtered from', state.scheduledTasks.length, 'total)')
      return result
    }
  },

  actions: {
    /**
     * Plan a day by calling backend API
     * Backend handles all scheduling logic and automatically sets first task as current focus
     * 
     * @param {string} session - Session token
     * @param {Array} tasks - Tasks to schedule [{id, duration}]
     * @param {Array} busySlots - Busy slots [{start, end}]
     * @param {Date|string} planningDate - Optional date to plan for (for timezone correction)
     */
    async planDay(session, tasks, busySlots, planningDate = null) {
      if (!session) {
        throw new Error('No session token available')
      }

      this.loading = true
      this.error = null

      try {
        console.log('Planning day with', tasks.length, 'tasks and', busySlots.length, 'busy slots')
        const response = await plannerApi.planDay(session, tasks, busySlots, planningDate)
        
        if (response?.firstTask) {
          console.log('✓ Backend planned day successfully. First task:', response.firstTask)
          console.log('  Note: Backend automatically set this as current focus via synchronization')
        }

        // Fetch scheduled tasks from backend
        await this.fetchScheduledTasks(session)

        return response
      } catch (err) {
        this.error = err.message || 'Failed to plan day'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Clear all scheduled tasks for the day
     */
    async clearDay(session) {
      if (!session) {
        throw new Error('No session token available')
      }

      this.loading = true
      this.error = null

      try {
        await plannerApi.clearDay(session)
        this.scheduledTasks = []
        console.log('Cleared all scheduled tasks')
      } catch (err) {
        this.error = err.message || 'Failed to clear day'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Replan: Clear and re-plan from current time forward
     * Backend handles scheduling and automatically sets first task as current focus
     * 
     * @param {string} session - Session token
     * @param {Array} tasks - Tasks to schedule [{id, duration}]
     * @param {Array} busySlots - Busy slots [{start, end}]
     * @param {Date|string} planningDate - Optional date to plan for (for timezone correction)
     */
    async replan(session, tasks, busySlots, planningDate = null) {
      if (!session) {
        throw new Error('No session token available')
      }

      this.loading = true
      this.error = null

      try {
        console.log('Replanning day with', tasks.length, 'tasks')
        const response = await plannerApi.replan(session, tasks, busySlots, planningDate)
        
        if (response?.firstTask) {
          console.log('✓ Backend replanned day successfully. First task:', response.firstTask)
          console.log('  Note: Backend automatically set this as current focus via synchronization')
        }

        // Fetch updated scheduled tasks
        await this.fetchScheduledTasks(session)

        return response
      } catch (err) {
        this.error = err.message || 'Failed to replan day'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch scheduled tasks directly from backend
     * 
     * @param {string} session - Session token
     */
    async fetchScheduledTasks(session) {
      if (!session) {
        this.error = 'No session token available'
        return
      }

      this.loading = true
      this.error = null

      try {
        console.log('Fetching scheduled tasks from backend')
        const response = await plannerApi.getScheduledTasks(session)
        console.log('Raw response from getScheduledTasks:', response)
        
        // Backend returns: { "tasks": [...] } - direct object with tasks array
        let scheduledArray = []
        if (response?.tasks && Array.isArray(response.tasks)) {
          // New format: { tasks: [...] }
          console.log('Using format: response.tasks')
          scheduledArray = response.tasks
        } else if (Array.isArray(response) && response.length > 0 && response[0].tasks) {
          // Old format: [{ tasks: [...] }]
          console.log('Using old format: response[0].tasks')
          scheduledArray = response[0].tasks
        } else if (Array.isArray(response)) {
          // Fallback: direct array
          console.log('Using fallback: direct array')
          scheduledArray = response
        }

        console.log('Extracted scheduled tasks array:', scheduledArray)
        
        this.scheduledTasks = scheduledArray.map(st => ({
          _id: st._id,
          task: st.task,
          plannedStart: st.plannedStart,
          plannedEnd: st.plannedEnd
        }))
        
        console.log('✓ Fetched', this.scheduledTasks.length, 'scheduled tasks')
      } catch (err) {
        this.error = err.message || 'Failed to load scheduled tasks'
        this.scheduledTasks = []
        console.error('Failed to fetch scheduled tasks:', err.message)
      } finally {
        this.loading = false
      }
    },

    /**
     * Clear scheduled tasks from local state
     */
    clearScheduledTasks() {
      this.scheduledTasks = []
      this.error = null
    }
  }
})
