import { defineStore } from 'pinia'
import * as plannerApi from '@/api/planner.js'
import { useTasksStore } from '@/stores/tasks.js'
import { useScheduleStore } from '@/stores/schedule.js'

export const usePlannerStore = defineStore('planner', {
  state: () => ({
    scheduledTasks: [], // Array of { taskId, plannedStart, plannedEnd }
    loading: false,
    error: null
  }),

  getters: {
    // Get scheduled tasks for today only (sorted by start time)
    todayScheduledTasks: (state) => {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      
      // Filter to only tasks scheduled for today
      return [...state.scheduledTasks]
        .filter(scheduled => {
          const taskStart = new Date(scheduled.plannedStart)
          return taskStart >= startOfToday && taskStart <= endOfToday
        })
        .sort((a, b) => {
          return new Date(a.plannedStart) - new Date(b.plannedStart)
        })
    },

    // Get task ID by scheduled task ID
    getTaskIdByScheduledId: (state) => (scheduledId) => {
      const scheduled = state.scheduledTasks.find(s => s._id === scheduledId)
      return scheduled?.task || null
    }
  },

  actions: {
    /**
     * Plan a day and update scheduled tasks
     * The backend handles scheduling - we fetch the scheduled tasks from backend after planning
     * 
     * @param {string} userId - User ID
     * @param {Array} tasks - Tasks to schedule (should come from tasks store)
     * @param {Array} busySlots - Busy slots to avoid (should come from schedule store)
     * 
     * Cross-concept data flow (via Pinia stores):
     * 1. Tasks come from Tasks concept (via tasks store)
     * 2. Busy slots come from Schedule concept (via schedule store)
     * 3. Backend planDay API is called (backend creates ScheduledTasks in Planner concept)
     * 4. Pinia calculates scheduled tasks locally using calculateSchedule (handled by Pinia, not backend)
     */
    async planDay(userId, tasks, busySlots) {
      if (!userId) {
        throw new Error('No user ID available')
      }

      this.loading = true
      this.error = null

      try {
        // Call backend Planner/planDay API
        // Backend handles all scheduling logic and creates ScheduledTasks in Planner concept
        console.log('Calling backend Planner/planDay API with:', { userId, tasks, busySlots })
        const response = await plannerApi.planDay(userId, tasks, busySlots)
        console.log('Backend Planner/planDay response:', response)
        
        // Check if response is empty or has errors
        if (!response || Object.keys(response).length === 0) {
          console.warn('⚠️ Backend returned empty response. This might mean:')
          console.warn('   - No tasks could be scheduled (all tasks too long or no available time)')
          console.warn('   - Backend encountered an error but didn\'t return it')
          console.warn('   - Response format changed')
        } else if (response.error) {
          console.error('Backend returned an error:', response.error)
        } else if (response.firstTask) {
          console.log('✓ Backend scheduled tasks successfully. First task:', response.firstTask)
        }

        // Fetch scheduled tasks directly from Planner concept
        // Uses _getScheduledTasks endpoint (following _getXxx pattern like Schedule/_getSlots)
        await this.fetchScheduledTasks(userId)
        console.log('✓ Fetched scheduled tasks from Planner concept:', this.scheduledTasks.length, 'tasks')

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
    async clearDay(userId) {
      if (!userId) {
        throw new Error('No user ID available')
      }

      this.loading = true
      this.error = null

      try {
        // Clear scheduled tasks on backend
        await plannerApi.clearDay(userId)
        
        // Clear scheduled tasks in frontend store
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
     * Replan: Clear all scheduled tasks, then plan the day fresh
     * The backend handles scheduling - we fetch the scheduled tasks from backend after planning
     * 
     * @param {string} userId - User ID
     * @param {Array} tasks - Tasks to schedule (should come from tasks store)
     * @param {Array} busySlots - Busy slots to avoid (should come from schedule store)
     * 
     * Cross-concept data flow (via Pinia stores):
     * 1. Tasks come from Tasks concept (via tasks store)
     * 2. Busy slots come from Schedule concept (via schedule store)
     * 3. Backend planDay API is called (backend creates ScheduledTasks in Planner concept)
     * 4. Pinia calculates scheduled tasks locally using calculateSchedule (handled by Pinia, not backend)
     */
    async replan(userId, tasks, busySlots) {
      if (!userId) {
        throw new Error('No user ID available')
      }

      this.loading = true
      this.error = null

      try {
        // First, clear all scheduled tasks
        console.log('Replan: Clearing all scheduled tasks first')
        await this.clearDay(userId)

        // Then plan the day fresh (same as Plan Day)
        console.log('Replan: Now planning day fresh')
        const response = await plannerApi.planDay(userId, tasks, busySlots)
        console.log('Backend Planner/planDay response:', response)

        // Fetch scheduled tasks directly from Planner concept
        // Uses _getScheduledTasks endpoint (following _getXxx pattern like Schedule/_getSlots)
        await this.fetchScheduledTasks(userId)
        console.log('✓ Fetched scheduled tasks from Planner concept:', this.scheduledTasks.length, 'tasks')

        return response
      } catch (err) {
        this.error = err.message || 'Failed to replan day'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch scheduled tasks from backend after planning
     * This directly queries the Planner concept (no sync - syncs don't exist in backend yet)
     * Connects Planner concept to frontend state after planDay/replan
     * @param {string} userId - User ID
     * @returns {boolean} true if successfully fetched, false if endpoint doesn't exist
     */
    async fetchScheduledTasksFromBackend(userId) {
      try {
        console.log('Attempting to fetch scheduled tasks for user:', userId)
        // Directly query Planner concept for scheduled tasks (following Schedule/_getSlots pattern)
        const scheduledTasks = await plannerApi.getScheduledTasks(userId)
        console.log('Raw scheduled tasks response from backend:', scheduledTasks)

        if (scheduledTasks && scheduledTasks.length > 0) {
          // Map to our format
          this.scheduledTasks = scheduledTasks.map(st => ({
            _id: st._id || st.task,
            task: st.task,
            plannedStart: st.plannedStart,
            plannedEnd: st.plannedEnd
          }))
          console.log('✓ Successfully mapped', this.scheduledTasks.length, 'scheduled tasks')
          return true
        } else {
          // Empty array means endpoint exists but no scheduled tasks
          this.scheduledTasks = []
          console.log('⚠ Backend returned empty array - no scheduled tasks found')
          return true
        }
      } catch (err) {
        // Check if it's a 404 or not found error
        if (err.message && (err.message.includes('404') || err.message.includes('Not Found'))) {                                                                
          console.error('❌ _getScheduledTasks endpoint not found in backend (404)')      
          console.error('Full error:', err)
          return false
        }
        // Other errors - log but don't throw
        console.error('❌ Failed to fetch scheduled tasks from backend:', err.message)
        console.error('Full error:', err)
        return false
      }
    },

    /**
     * Calculate schedule locally based on tasks and busy slots
     * This simulates what the backend planner would do
     * Also considers existing scheduled tasks as busy slots
     */
    calculateSchedule(tasks, busySlots, startTime = null) {
      if (!tasks || tasks.length === 0) {
        this.scheduledTasks = []
        return
      }

      // Convert busy slots to time ranges first
      const busyRanges = busySlots.map(slot => {
        // Handle both {start, end} and {startTime, endTime} formats
        const start = slot.start || slot.startTime
        const end = slot.end || slot.endTime
        return {
          start: new Date(start),
          end: new Date(end)
        }
      }).filter(slot => {
        // Only include slots that are valid
        return !isNaN(slot.start.getTime()) && !isNaN(slot.end.getTime()) && slot.end > slot.start
      }).sort((a, b) => a.start - b.start)
      
      // Determine planning day: use busy slot date if available, otherwise use provided startTime or today
      let today
      
      // First, determine the planning day from busy slots
      if (busyRanges.length > 0) {
        // Use the date of the earliest busy slot as our planning day
        const earliestBusySlot = busyRanges[0]
        today = new Date(earliestBusySlot.start)
        today.setHours(0, 0, 0, 0)
      } else {
        // No busy slots, use provided startTime or today
        today = startTime ? new Date(startTime) : new Date()
        today.setHours(0, 0, 0, 0)
      }
      
      // Now detect working day boundaries from busy slots
      // Working day blocked slots are: before start (midnight to start) and after end (end to midnight)
      let workingDayStartTime = null
      let workingDayEndTime = null
      
      console.log('Looking for working day boundaries in', busyRanges.length, 'busy ranges')
      
      // Find the planning day boundaries (midnight of the planning day)
      const planningDayStart = new Date(today)
      planningDayStart.setHours(0, 0, 0, 0)
      const planningDayEnd = new Date(planningDayStart)
      planningDayEnd.setDate(planningDayEnd.getDate() + 1)
      
      for (const range of busyRanges) {
        const rangeStart = new Date(range.start)
        const rangeEnd = new Date(range.end)
        
        // Check if this range starts at midnight of the planning day (within 1 minute) - this is the "before working day" slot
        const startAtMidnight = Math.abs(rangeStart.getTime() - planningDayStart.getTime()) < 60000
        
        // Check if this is the "after working day" slot
        // The slot goes from working day end to end of day (midnight)
        // It might start on the planning day and end on the next day in UTC due to timezone
        // Key characteristics:
        // 1. It doesn't start at midnight (not the "before working day" slot)
        // 2. It ends at or very close to the end of the planning day (23:59:59.999 local = might be next day UTC)
        // 3. It could start on planning day OR next day (due to timezone offset)
        const endsAtEndOfDay = rangeEnd >= planningDayEnd || Math.abs(rangeEnd.getTime() - planningDayEnd.getTime()) < 60000
        // Check if it starts after planning day start (could be on planning day or next day due to timezone)
        const startsAfterPlanningDayStart = rangeStart > planningDayStart
        // Or starts on next day but within reasonable time window (timezone offset, max 12 hours)
        const startsOnNextDayButClose = rangeStart >= planningDayEnd && rangeStart < new Date(planningDayEnd.getTime() + 12 * 60 * 60 * 1000)
        const isAfterWorkingDaySlot = !startAtMidnight && endsAtEndOfDay && (startsAfterPlanningDayStart || startsOnNextDayButClose)
        
        if (startAtMidnight) {
          // This is a working day blocked slot before start - the end time is the working day start time
          workingDayStartTime = new Date(range.end)
          console.log('✅ Detected working day start time from blocked slot:', workingDayStartTime.toISOString())
        }
        if (isAfterWorkingDaySlot && !workingDayEndTime) {
          // This is a working day blocked slot after end - the start time is the working day end time
          workingDayEndTime = new Date(range.start)
          console.log('✅ Detected working day end time from blocked slot:', workingDayEndTime.toISOString(), '(range:', rangeStart.toISOString(), 'to', rangeEnd.toISOString(), ')')
        } else if (!startAtMidnight && !workingDayEndTime) {
          // Debug: log slots that might be the after working day slot
          const endsCloseToEndOfDay = rangeEnd >= planningDayEnd || Math.abs(rangeEnd.getTime() - planningDayEnd.getTime()) < 60000
          if (endsCloseToEndOfDay) {
            console.log('🔍 Potential after working day slot (not detected):', {
              rangeStart: rangeStart.toISOString(),
              rangeEnd: rangeEnd.toISOString(),
              planningDayStart: planningDayStart.toISOString(),
              planningDayEnd: planningDayEnd.toISOString(),
              startsAfterPlanningDayStart: rangeStart > planningDayStart,
              startsOnNextDayButClose: rangeStart >= planningDayEnd && rangeStart < new Date(planningDayEnd.getTime() + 12 * 60 * 60 * 1000),
              endsCloseToEndOfDay,
              timeDiff: Math.abs(rangeEnd.getTime() - planningDayEnd.getTime())
            })
          }
        }
      }
      if (!workingDayStartTime) {
        console.log('⚠️ No working day start time detected, will default to 9 AM')
      }
      if (!workingDayEndTime) {
        console.log('⚠️ No working day end time detected, will default to 5 PM')
      }
      
      // Set the start time for today based on working day start or defaults
      if (!startTime) {
        // Use working day start time if detected, otherwise default to 9 AM
        if (workingDayStartTime) {
          today.setHours(workingDayStartTime.getHours(), workingDayStartTime.getMinutes(), 0, 0)
        } else {
          today.setHours(9, 0, 0, 0) // Default to 9 AM
        }
      } else {
        // If startTime provided, use its hour but planning day's date
        const startTimeDate = new Date(startTime)
        today.setHours(startTimeDate.getHours(), startTimeDate.getMinutes(), 0, 0)
      }
      console.log(`Using planning day ${today.toISOString()}`)
      
      // Use ALL busy slots passed to calculateSchedule - PlanView already filters them correctly
      // This ensures we avoid overlaps with any busy slots that might be displayed
      
      // Don't filter - use all busy slots passed (PlanView handles filtering)
      const filteredBusyRanges = busyRanges

      console.log(`Planning day: ${planningDayStart.toISOString()}, Using ${filteredBusyRanges.length} busy slots (all passed slots)`)
      console.log('All busy slots being used:', filteredBusyRanges.map(r => ({
        start: r.start.toISOString(),
        end: r.end.toISOString()
      })))

      // Also include existing scheduled tasks as busy slots (to avoid double-scheduling)
      const existingScheduledRanges = this.scheduledTasks.map(scheduled => ({
        start: new Date(scheduled.plannedStart),
        end: new Date(scheduled.plannedEnd)
      })).filter(slot => {
        // Only include slots on the same day or future
        const todayStart = new Date(today)
        todayStart.setHours(0, 0, 0, 0)
        return slot.start >= todayStart
      }).sort((a, b) => a.start - b.start)

      // Merge busy slots and existing scheduled tasks, removing duplicates
      const allBusyRanges = this.mergeTimeRanges([...filteredBusyRanges, ...existingScheduledRanges])
      
      // Ensure busy ranges are sorted by start time
      allBusyRanges.sort((a, b) => a.start.getTime() - b.start.getTime())
      
      console.log('Total busy ranges (including existing scheduled):', allBusyRanges.length)
      console.log('Busy ranges:', allBusyRanges.map(r => ({ 
        start: r.start.toISOString(), 
        end: r.end.toISOString(),
        duration: Math.round((r.end.getTime() - r.start.getTime()) / 60000) + ' min'
      })))

      const scheduled = []
      let currentTime = new Date(today)

      // Iterate through tasks and schedule them
      for (const task of tasks) {
        // Skip if this task is already scheduled
        const alreadyScheduled = this.scheduledTasks.find(s => s.task === task.id)
        if (alreadyScheduled) {
          console.log(`Task ${task.id} already scheduled, skipping`)
          continue
        }

        const duration = task.duration || 60 // minutes
        const durationMs = duration * 60 * 1000

        // Find next available slot (respecting working day boundaries)
        let scheduledStart = this.findNextAvailableSlot(currentTime, durationMs, allBusyRanges, workingDayEndTime)
        
        if (scheduledStart) {
          let scheduledEnd = new Date(scheduledStart.getTime() + durationMs)
          
          // Verify the scheduled slot doesn't overlap with any busy range
          const overlappingRanges = allBusyRanges.filter(busy => {
            return (scheduledStart < busy.end && scheduledEnd > busy.start)
          })
          
          if (overlappingRanges.length > 0) {
            console.error(`ERROR: Scheduled task ${task.id} overlaps with busy range!`, {
              scheduled: { start: scheduledStart.toISOString(), end: scheduledEnd.toISOString() },
              overlapping: overlappingRanges.map(b => ({ 
                start: b.start.toISOString(), 
                end: b.end.toISOString(),
                duration: Math.round((b.end.getTime() - b.start.getTime()) / 60000) + ' min'
              }))
            })
            // Try to find next available slot after the overlapping range
            const maxOverlapEnd = overlappingRanges.reduce((max, range) => 
              range.end.getTime() > max ? range.end.getTime() : max, 
              overlappingRanges[0].end.getTime()
            )
            currentTime = new Date(maxOverlapEnd)
            // Round to nearest 15 minutes
            const minutes = currentTime.getMinutes()
            const remainder = minutes % 15
            if (remainder !== 0) {
              currentTime.setMinutes(minutes + (15 - remainder))
              currentTime.setSeconds(0)
              currentTime.setMilliseconds(0)
            }
            // Try again with updated currentTime (respecting working day boundaries)
            scheduledStart = this.findNextAvailableSlot(currentTime, durationMs, allBusyRanges, workingDayEndTime)
            if (!scheduledStart) {
              console.warn(`No available slot found for task ${task.id} after overlap correction`)
              continue
            }
            // Re-calculate end time for new slot
            scheduledEnd = new Date(scheduledStart.getTime() + durationMs)
            // Re-verify after finding new slot
            const stillOverlapping = allBusyRanges.some(busy => 
              scheduledStart < busy.end && scheduledEnd > busy.start
            )
            if (stillOverlapping) {
              console.error(`ERROR: Still overlapping after correction for task ${task.id}, skipping`)
              continue
            }
          }
          
          const finalScheduledEnd = scheduledEnd
          
          // Final verification: check against ALL busy ranges one more time before adding
          const finalOverlaps = allBusyRanges.filter(busy => {
            return (scheduledStart < busy.end && finalScheduledEnd > busy.start)
          })
          
          if (finalOverlaps.length > 0) {
            console.error(`FINAL CHECK: Task ${task.id} STILL overlaps after all corrections!`, {
              task: { start: scheduledStart.toISOString(), end: finalScheduledEnd.toISOString() },
              overlapping: finalOverlaps.map(b => ({
                start: b.start.toISOString(),
                end: b.end.toISOString(),
                duration: Math.round((b.end.getTime() - b.start.getTime()) / 60000) + ' min'
              }))
            })
            console.warn(`Skipping task ${task.id} due to final overlap check failure`)
            continue
          }
          
          scheduled.push({
            _id: task.id,
            task: task.id,
            plannedStart: scheduledStart.toISOString(),
            plannedEnd: finalScheduledEnd.toISOString()
          })
          
          // Add this scheduled task to busy ranges for subsequent tasks
          // Merge it into the existing busy ranges to keep them sorted and merged
          allBusyRanges.push({
            start: scheduledStart,
            end: finalScheduledEnd
          })
          // Re-merge and re-sort to ensure no duplicates and proper ordering
          const mergedRanges = this.mergeTimeRanges(allBusyRanges)
          mergedRanges.sort((a, b) => a.start.getTime() - b.start.getTime())
          allBusyRanges.length = 0
          allBusyRanges.push(...mergedRanges)
          
          console.log(`✓ Scheduled task ${task.id} at ${scheduledStart.toISOString()} - ${finalScheduledEnd.toISOString()} (verified no overlaps)`)
          
          // Move current time to end of this task
          currentTime = finalScheduledEnd
        } else {
          // No available slot found, skip this task
          console.warn(`No available slot found for task ${task.id}`)
        }
      }

      // Merge with existing scheduled tasks (keep existing ones, add new ones)
      const existingTaskIds = new Set(this.scheduledTasks.map(s => s.task))
      const newTasks = scheduled.filter(s => !existingTaskIds.has(s.task))
      this.scheduledTasks = [...this.scheduledTasks, ...newTasks]
      
      console.log('Calculated schedule for', scheduled.length, 'new tasks (total:', this.scheduledTasks.length, ')')
    },

    /**
     * Merge overlapping time ranges
     */
    mergeTimeRanges(ranges) {
      if (ranges.length === 0) return []
      
      // Ensure all ranges have Date objects
      const normalizedRanges = ranges.map(range => ({
        start: range.start instanceof Date ? range.start : new Date(range.start),
        end: range.end instanceof Date ? range.end : new Date(range.end)
      }))
      
      const sorted = [...normalizedRanges].sort((a, b) => a.start.getTime() - b.start.getTime())
      const merged = [{ ...sorted[0] }] // Copy to avoid mutating original
      
      for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i]
        const last = merged[merged.length - 1]
        
        // If current overlaps with last, merge them
        if (current.start.getTime() <= last.end.getTime()) {
          last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()))
        } else {
          merged.push({ ...current }) // Copy to avoid mutating original
        }
      }
      
      return merged
    },

    /**
     * Find next available time slot for a given duration
     * Properly avoids all busy ranges
     */
    findNextAvailableSlot(startTime, durationMs, busyRanges, workingDayEndTime = null) {
      let currentTime = new Date(startTime)
      
      // Use working day end time if provided, otherwise use end of day (midnight)
      let endOfSchedulingTime
      if (workingDayEndTime) {
        endOfSchedulingTime = new Date(workingDayEndTime)
        // Ensure we're on the same day as startTime
        const startDate = new Date(startTime)
        startDate.setHours(0, 0, 0, 0)
        endOfSchedulingTime.setFullYear(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      } else {
        endOfSchedulingTime = new Date(startTime)
        endOfSchedulingTime.setHours(23, 59, 59, 999)
      }

      console.log(`findNextAvailableSlot: Looking for slot starting at ${currentTime.toISOString()}, duration ${durationMs/1000/60} min, endOfSchedulingTime ${endOfSchedulingTime.toISOString()}, ${busyRanges.length} busy ranges`)

      // Keep trying until we find a slot or reach end of scheduling time
      let iterations = 0
      const maxIterations = 100 // Safety limit
      while (currentTime < endOfSchedulingTime && iterations < maxIterations) {
        iterations++
        const slotEnd = new Date(currentTime.getTime() + durationMs)
        
        // Check if this slot would extend past the working day end time
        if (workingDayEndTime && slotEnd > endOfSchedulingTime) {
          // This slot would extend past working day end, can't schedule here
          console.log(`findNextAvailableSlot: Slot would extend past working day end (${slotEnd.toISOString()} > ${endOfSchedulingTime.toISOString()})`)
          break
        }
        
        // Check if this slot overlaps with any busy range
        // Two ranges overlap if: start1 < end2 AND start2 < end1
        // Ensure busy ranges have Date objects
        const overlappingRanges = busyRanges.filter(busy => {
          const busyStart = busy.start instanceof Date ? busy.start : new Date(busy.start)
          const busyEnd = busy.end instanceof Date ? busy.end : new Date(busy.end)
          const overlaps = currentTime < busyEnd && slotEnd > busyStart
          if (overlaps) {
            console.log(`findNextAvailableSlot: Overlap detected at ${currentTime.toISOString()}-${slotEnd.toISOString()} with busy ${busyStart.toISOString()}-${busyEnd.toISOString()}`)
          }
          return overlaps
        })

        if (overlappingRanges.length === 0 && slotEnd <= endOfSchedulingTime) {
          // Found an available slot - no overlaps and fits within scheduling time
          console.log(`findNextAvailableSlot: Found available slot at ${currentTime.toISOString()}-${slotEnd.toISOString()}`)
          return currentTime
        }
        
        // If there's an overlap, find the latest end time of all overlapping ranges
        // and move past that
        if (overlappingRanges.length > 0) {
          // Find the maximum end time of all overlapping ranges
          const maxEndTime = overlappingRanges.reduce((max, range) => {
            const rangeEnd = range.end instanceof Date ? range.end : new Date(range.end)
            return rangeEnd.getTime() > max ? rangeEnd.getTime() : max
          }, (overlappingRanges[0].end instanceof Date ? overlappingRanges[0].end : new Date(overlappingRanges[0].end)).getTime())
          
          // Move to after the latest overlapping range
          currentTime = new Date(maxEndTime)
          
          // Round to nearest 15 minutes for cleaner scheduling
          const minutes = currentTime.getMinutes()
          const remainder = minutes % 15
          if (remainder !== 0) {
            currentTime.setMinutes(minutes + (15 - remainder))
            currentTime.setSeconds(0)
            currentTime.setMilliseconds(0)
          }
          console.log(`findNextAvailableSlot: Moved past overlap to ${currentTime.toISOString()}`)
        } else {
          // Find next busy slot that starts after current time
          const futureBusyRanges = busyRanges.filter(busy => {
            const busyStart = busy.start instanceof Date ? busy.start : new Date(busy.start)
            return busyStart > currentTime
          })
          
          if (futureBusyRanges.length > 0) {
            // Move to start of next busy slot (or stay where we are)
            const nextBusyStart = futureBusyRanges[0].start instanceof Date ? futureBusyRanges[0].start : new Date(futureBusyRanges[0].start)
            currentTime = new Date(nextBusyStart)
            console.log(`findNextAvailableSlot: Moving to next busy slot start at ${currentTime.toISOString()}`)
          } else {
            // No more busy slots, increment by 15 minutes
            currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000)
            console.log(`findNextAvailableSlot: No future busy slots, incrementing to ${currentTime.toISOString()}`)
          }
        }
      }
      
      // No available slot found
      return null
    },

    /**
     * Build scheduled tasks list by traversing the chain using getNextTask
     * Starting from firstTask, we traverse the scheduled chain to get all scheduled task IDs
     * Then we query Tasks to get plannedStart/plannedEnd for each task
     * 
     * @param {string} userId - User ID
     * @param {string} firstTaskId - First task ID from planDay response
     */
    async buildScheduledTasksFromChain(userId, firstTaskId) {
      if (!userId || !firstTaskId) {
        return
      }

      try {
        // Traverse the chain starting from firstTask
        const scheduledTaskIds = []
        let currentTaskId = firstTaskId
        const visited = new Set() // Prevent infinite loops
        const maxIterations = 100 // Safety limit

        while (currentTaskId && !visited.has(currentTaskId) && scheduledTaskIds.length < maxIterations) {
          visited.add(currentTaskId)
          scheduledTaskIds.push(currentTaskId)

          try {
            // Get next task in the chain
            const nextTaskResponse = await plannerApi.getNextTask(userId, currentTaskId)
            if (nextTaskResponse && nextTaskResponse.nextTask) {
              currentTaskId = nextTaskResponse.nextTask
            } else {
              // No more tasks in chain
              break
            }
          } catch (err) {
            // No next task found, we've reached the end of the chain
            break
          }
        }

        console.log('✓ Traversed scheduled tasks chain:', scheduledTaskIds.length, 'tasks')

        // Now query Tasks to get plannedStart/plannedEnd for each scheduled task
        // NOTE: Since there are no syncs, Tasks won't have plannedStart/plannedEnd
        // The scheduled times are stored in Planner concept's ScheduledTasks, but we can't query them
        // We can only get the task IDs from the chain traversal
        const tasksStore = useTasksStore()
        await tasksStore.fetchTasks(userId)

        // Check if Tasks have plannedStart/plannedEnd (they won't if there are no syncs)
        const scheduled = scheduledTaskIds
          .map(taskId => {
            const task = tasksStore.tasks.find(t => t._id === taskId)
            if (!task) return null
            
            // If task has plannedStart/plannedEnd (from sync), use them
            if (task.plannedStart && task.plannedEnd) {
              return {
                _id: task._id,
                task: task._id,
                plannedStart: task.plannedStart,
                plannedEnd: task.plannedEnd
              }
            }
            
            // Otherwise, we know the task is scheduled but don't have the times
            // We can't display it without times, so return null
            return null
          })
          .filter(Boolean)

        this.scheduledTasks = scheduled
        if (scheduled.length === 0 && scheduledTaskIds.length > 0) {
          console.warn('⚠️ Found', scheduledTaskIds.length, 'scheduled tasks in chain, but no tasks have plannedStart/plannedEnd')
          console.warn('   This is expected if there are no syncs between Planner and Tasks concepts')
          console.warn('   Scheduled times are stored in Planner concept but cannot be queried per API spec')
        } else {
          console.log('✓ Built scheduled tasks from Tasks concept:', this.scheduledTasks.length, 'tasks')
        }
      } catch (err) {
        console.error('Failed to build scheduled tasks from chain:', err)
        this.scheduledTasks = []
      }
    },

    /**
     * Fetch scheduled tasks directly from Planner concept via API
     * This follows the same pattern as Schedule/_getSlots
     * Backend may have this endpoint even if not in API spec yet
     * 
     * @param {string} userId - User ID
     */
    async fetchScheduledTasks(userId) {
      if (!userId) {
        this.error = 'No user ID available'
        this.loading = false
        return
      }

      this.loading = true
      this.error = null

      try {
        // Directly query Planner concept for scheduled tasks (following Planner/_getScheduledTasks pattern)
        console.log('Fetching scheduled tasks from Planner concept via _getScheduledTasks...')
        const response = await plannerApi.getScheduledTasks(userId)
        
        // Handle response format: { tasks: ScheduledTask[] }
        // Backend returns { tasks: [...] } where each ScheduledTask has:
        // { _id, owner, task, plannedStart, plannedEnd }
        const scheduledArray = response?.tasks || []
        console.log('Received scheduled tasks from Planner concept:', scheduledArray.length)

        // Map to scheduled task format
        this.scheduledTasks = scheduledArray.map(st => ({
          _id: st._id,
          task: st.task,
          plannedStart: st.plannedStart,
          plannedEnd: st.plannedEnd
        }))
        
        console.log('✓ Set scheduled tasks from Planner concept:', this.scheduledTasks.length)
      } catch (err) {
        const errorMsg = err.message || 'Failed to load scheduled tasks'
        this.error = errorMsg
        this.scheduledTasks = []
        
        // Log error but don't throw - endpoint might not exist yet
        console.error('Failed to fetch scheduled tasks:', errorMsg)
      } finally {
        this.loading = false
      }
    },

    /**
     * Refresh scheduled tasks - wrapper that calls fetchScheduledTasks
     * This is kept for backward compatibility
     * 
     * @param {string} userId - User ID
     */
    async refreshScheduledTasks(userId) {
      await this.fetchScheduledTasks(userId)
    },

    /**
     * Update tasks in the tasks store with planned times
     * This manually syncs the planner concept with the tasks concept
     */
    syncTasksWithScheduled(tasksStore) {
      // Create a map of task ID to scheduled task
      const scheduledMap = new Map(
        this.scheduledTasks.map(s => [s.task, s])
      )
      
      // Update tasks in the store with plannedStart/plannedEnd
      tasksStore.tasks = tasksStore.tasks.map(task => {
        const scheduled = scheduledMap.get(task._id)
        if (scheduled) {
          return {
            ...task,
            plannedStart: scheduled.plannedStart,
            plannedEnd: scheduled.plannedEnd
          }
        }
        // Remove plannedStart/plannedEnd if task is no longer scheduled
        const { plannedStart, plannedEnd, ...rest } = task
        return rest
      })
    },

    /**
     * Clear scheduled tasks
     */
    clearScheduledTasks() {
      this.scheduledTasks = []
      this.error = null
    }
  }
})

