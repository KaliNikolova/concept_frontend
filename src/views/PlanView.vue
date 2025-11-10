<template>
  <div class="plan-view">
    <div class="plan-container">
      <NavMenu />

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Main Content: Schedule on left, Buttons on right -->
      <div class="plan-content-layout">
        <!-- Timeline View (Left) -->
        <div class="timeline-wrapper">
          <div v-if="loading" class="loading-message">
            Loading schedule...
          </div>
                                            <div v-else class="timeline-container">
                <div class="timeline-header">
                  <h2 class="timeline-title">{{ formatDateHeader() }}</h2>
                  <button @click="openAddSlotModal" class="light-purple-btn add-slot-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Block Time
                  </button>
                </div>

                <!-- Timeline -->
                <div class="timeline-scroll-container">
                <div class="timeline" ref="timelineRef">
              <div 
                v-for="hour in hours" 
                :key="hour" 
                class="timeline-hour"
              >
                <div class="hour-label">{{ formatHour(hour) }}</div>
                <div class="hour-line"></div>
              </div>

              <!-- Sleeping Time Blocks (between end day and start day) -->
              <div 
                v-for="slot in sleepingTimeBlocks" 
                :key="slot._id" 
                class="timeline-slot busy-slot sleeping-block"
                :style="getSlotStyle(slot)"
              >
                <div class="slot-content">
                  <!-- No description or time for sleeping blocks -->
                </div>
              </div>

              <!-- Busy Slots -->
              <div 
                v-for="slot in todayBusySlots" 
                :key="slot._id" 
                class="timeline-slot busy-slot"
                :class="{ 'hide-time': shouldHideBusySlotTime(slot) }"
                :style="getSlotStyle(slot)"
                @click="openEditSlotModal(slot)"
              >
                <div class="slot-content">
                  <div class="slot-description">{{ slot.description || 'Busy' }}</div>
                  <div class="slot-time">{{ formatSlotTime(slot.startTime) }} - {{ formatSlotTime(slot.endTime) }}</div>
                </div>
              </div>

              <!-- Scheduled Tasks -->
              <div 
                v-for="scheduledTask in scheduledTasks" 
                :key="scheduledTask._id" 
                class="timeline-slot task-slot"
                :class="{ 'task-completed': isTaskCompleted(scheduledTask) }"
                :style="getTaskSlotStyle(scheduledTask)"
                @click="handleTaskClick(scheduledTask)"
              >
                <div class="slot-content">
                  <div class="slot-description">{{ getScheduledTaskTitle(scheduledTask) }}</div>
                  <div class="slot-time">{{ formatSlotTime(scheduledTask.plannedStart) }} - {{ formatSlotTime(scheduledTask.plannedEnd) }}</div>
                </div>
              </div>
              
              <!-- Current Time Indicator -->
              <div class="current-time-indicator" :style="getCurrentTimeStyle()">
                <div class="time-line"></div>
                <div class="time-label">{{ formatCurrentTime() }}</div>
              </div>
              </div>
            </div>
          </div>
        </div>

                            <!-- Action Buttons (Right) -->
          <div class="action-buttons-section">
            <!-- Focus Button (aligned with date + block time) -->
            <div class="plan-day-header">
              <button @click="openFocusModal" class="purple-btn focus-btn">
                Focus
              </button>
            </div>

            <!-- Working Day Settings (aligned with schedule) -->
            <div class="working-day-wrapper">
              <div class="working-day-settings">
                <h3 class="settings-title">Working Day</h3>
                                  <div class="working-day-inputs">
                    <div class="working-day-input-group">
                      <label for="start-time">Start Time</label>
                      <v-menu v-model="workingDayStartMenuOpen" :close-on-content-click="false" offset-y min-width="auto" content-class="time-picker-menu">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            id="start-time"
                            :model-value="formatTimeForDisplay(workingDayStart)"
                            v-bind="props"
                            class="form-input working-day-time-input"
                            placeholder="Select time"
                            readonly
                          >
                            <template v-slot:append-inner>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                            </template>
                          </v-text-field>
                        </template>
                        <v-time-picker
                          v-if="workingDayStartMenuOpen"
                          v-model="workingDayStart"
                          ampm-in-title
                          @click:minute="updateWorkingDayStartTimeFromPicker"
                          @keydown.enter="handleWorkingDayStartTimePickerEnter"
                        ></v-time-picker>
                      </v-menu>
                    </div>
                    <div class="working-day-input-group">
                      <label for="end-time">End Time</label>
                      <v-menu v-model="workingDayEndMenuOpen" :close-on-content-click="false" offset-y min-width="auto" content-class="time-picker-menu">
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            id="end-time"
                            :model-value="formatTimeForDisplay(workingDayEnd)"
                            v-bind="props"
                            class="form-input working-day-time-input"
                            placeholder="Select time"
                            readonly
                          >
                            <template v-slot:append-inner>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                            </template>
                          </v-text-field>
                        </template>
                        <v-time-picker
                          v-if="workingDayEndMenuOpen"
                          v-model="workingDayEnd"
                          ampm-in-title
                          @click:minute="updateWorkingDayEndTimeFromPicker"
                          @keydown.enter="handleWorkingDayEndTimePickerEnter"
                        ></v-time-picker>
                      </v-menu>
                    </div>
                  </div>
              </div>
            </div>

            <!-- Plan Day / Replan Button -->
            <div class="plan-day-container">
              <button @click="handlePlanOrReplan" class="purple-btn plan-btn" :disabled="planning || replanning">
                {{ planning ? 'Planning...' : replanning ? 'Replanning...' : hasPlanned ? 'Replan' : 'Plan Day' }}
              </button>
            </div>

            <!-- Clear Day at bottom (aligned with schedule end) -->
            <div class="clear-day-container">
              <button @click="handleClearDay" class="clear-btn clear-day-btn" :disabled="clearingDay">
                {{ clearingDay ? 'Clearing...' : 'Clear Day' }}
              </button>
            </div>
          </div>
      </div>

      <!-- Add/Edit Slot Modal -->
      <div v-if="slotModalMode" class="modal-overlay" @click="closeSlotModal">
        <div class="modal-content" @click.stop>
          <h2 class="modal-title">{{ slotModalMode === 'add' ? 'Block Time' : 'Edit Blocked Time' }}</h2>
          
          <form @submit.prevent="handleSlotSubmit" class="slot-form">
            <div class="form-group">
              <label :for="`slot-description-${slotModalMode}`">Description</label>
              <input
                :id="`slot-description-${slotModalMode}`"
                v-model="slotForm.description"
                type="text"
                class="form-input"
                placeholder="e.g., Meeting, Break, Lunch..."
                required
              />
            </div>

            <div class="form-group date-time-group">
              <div class="date-time-item">
                <label :for="`slot-start-date-${slotModalMode}`">Start Date</label>
                <v-menu v-model="startDateMenuOpen" :close-on-content-click="false">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                  :id="`slot-start-date-${slotModalMode}`"
                      :model-value="formatDateForDisplay(slotForm.startDate)"
                      v-bind="props"
                      :required="true"
                  class="form-input"
                      placeholder="Select start date"
                      readonly
                    ></v-text-field>
                  </template>
                  <div class="date-picker-container">
                    <v-date-picker
                      v-model="slotForm.startDate"
                      show-adjacent-months
                      prev-icon="mdi-chevron-left"
                      next-icon="mdi-chevron-right"
                      @click:month="openStartMonthYearPicker"
                      @click:year="openStartMonthYearPicker"
                      @update:model-value="startDateMenuOpen = false"
                    ></v-date-picker>
                    <!-- Custom Month/Year Picker -->
                    <div v-if="showStartMonthYearPicker" class="custom-month-year-picker">
                      <div class="month-year-picker-header">
                        <button @click="showStartMonthYearPicker = false" class="close-btn">×</button>
              </div>
                      <div class="month-year-columns">
                        <div class="month-column">
                          <div class="scroll-container" ref="startMonthScrollRef">
                            <div
                              v-for="(month, index) in months"
                              :key="index"
                              :class="['month-year-item', { active: isStartCurrentMonth(index) }]"
                              @click="selectStartMonth(index)"
                            >
                              {{ month }}
                      </div>
                    </div>
                  </div>
                        <div class="year-column">
                          <div class="scroll-container" ref="startYearScrollRef">
                            <div
                              v-for="year in years"
                              :key="year"
                              :class="['month-year-item', { active: isStartCurrentYear(year) }]"
                              @click="selectStartYear(year)"
                            >
                              {{ year }}
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
                  </div>
                </v-menu>
              </div>
              <div class="date-time-item">
                <label :for="`slot-start-time-${slotModalMode}`">Start Time</label>
                <v-menu v-model="startTimeMenuOpen" :close-on-content-click="false" offset-y min-width="auto" content-class="time-picker-menu">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      :id="`slot-start-time-${slotModalMode}`"
                      :model-value="formatTimeForDisplay(slotForm.startTime)"
                      v-bind="props"
                      :required="true"
                      class="form-input"
                      placeholder="Select start time"
                      readonly
                    ></v-text-field>
                  </template>
                  <v-time-picker
                    v-if="startTimeMenuOpen"
                    v-model="slotForm.startTime"
                    ampm-in-title
                    @click:minute="updateStartTimeFromPicker"
                  ></v-time-picker>
                </v-menu>
              </div>
            </div>

            <div class="form-group date-time-group">
              <div class="date-time-item">
                <label :for="`slot-end-date-${slotModalMode}`">End Date</label>
                <v-menu v-model="endDateMenuOpen" :close-on-content-click="false">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                  :id="`slot-end-date-${slotModalMode}`"
                      :model-value="formatDateForDisplay(slotForm.endDate)"
                      v-bind="props"
                      :required="true"
                  class="form-input"
                      placeholder="Select end date"
                      readonly
                    ></v-text-field>
                  </template>
                  <div class="date-picker-container">
                    <v-date-picker
                      v-model="slotForm.endDate"
                      show-adjacent-months
                      prev-icon="mdi-chevron-left"
                      next-icon="mdi-chevron-right"
                      @click:month="openEndMonthYearPicker"
                      @click:year="openEndMonthYearPicker"
                      @update:model-value="endDateMenuOpen = false"
                    ></v-date-picker>
                    <!-- Custom Month/Year Picker -->
                    <div v-if="showEndMonthYearPicker" class="custom-month-year-picker">
                      <div class="month-year-picker-header">
                        <button @click="showEndMonthYearPicker = false" class="close-btn">×</button>
              </div>
                      <div class="month-year-columns">
                        <div class="month-column">
                          <div class="scroll-container" ref="endMonthScrollRef">
                            <div
                              v-for="(month, index) in months"
                              :key="index"
                              :class="['month-year-item', { active: isEndCurrentMonth(index) }]"
                              @click="selectEndMonth(index)"
                            >
                              {{ month }}
                      </div>
                    </div>
                  </div>
                        <div class="year-column">
                          <div class="scroll-container" ref="endYearScrollRef">
                            <div
                              v-for="year in years"
                              :key="year"
                              :class="['month-year-item', { active: isEndCurrentYear(year) }]"
                              @click="selectEndYear(year)"
                            >
                              {{ year }}
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
                  </div>
                </v-menu>
              </div>
              <div class="date-time-item">
                <label :for="`slot-end-time-${slotModalMode}`">End Time</label>
                <v-menu v-model="endTimeMenuOpen" :close-on-content-click="false" offset-y min-width="auto" content-class="time-picker-menu">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      :id="`slot-end-time-${slotModalMode}`"
                      :model-value="formatTimeForDisplay(slotForm.endTime)"
                      v-bind="props"
                      :required="true"
                      class="form-input"
                      placeholder="Select end time"
                      readonly
                    ></v-text-field>
                  </template>
                  <v-time-picker
                    v-if="endTimeMenuOpen"
                    v-model="slotForm.endTime"
                    ampm-in-title
                    @click:minute="updateEndTimeFromPicker"
                  ></v-time-picker>
                </v-menu>
              </div>
            </div>

            <div v-if="slotError" class="error-message">
              {{ slotError }}
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeSlotModal" class="cancel-btn">
                Cancel
              </button>
              <button type="submit" class="purple-btn save-btn" :disabled="savingSlot">
                {{ savingSlot ? 'Saving...' : (slotModalMode === 'add' ? 'Block Time' : 'Save') }}
              </button>
              <button v-if="slotModalMode === 'edit' && currentSlot?.origin === 'MANUAL'" type="button" @click="handleDeleteSlot" class="delete-btn" :disabled="savingSlot">
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Focus Task Modal -->
      <div v-if="showFocusModal" class="modal-overlay" @click="closeFocusModal">
        <div class="modal-content focus-modal-content" @click.stop>
          <h2 class="modal-title">Current Focus</h2>
          
          <!-- Loading State -->
          <div v-if="loadingFocus" class="loading-message">
            Loading current task...
          </div>
          
          <!-- Focus Task Content -->
          <div v-else-if="focusTask && !taskCompleted" class="focus-task-content">
            <h3 class="focus-task-title">{{ focusTask.title || focusTask.description || 'Untitled Task' }}</h3>
            
            <div class="focus-task-meta">
              <span v-if="focusTask.dueDate" class="focus-meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {{ formatTaskDueDate(focusTask.dueDate) }}
              </span>
              <span v-if="focusTask.estimatedDuration" class="focus-meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {{ formatTaskDuration(focusTask.estimatedDuration) }}
              </span>
            </div>
            
            <p v-if="focusTask.description && focusTask.title" class="focus-task-description">{{ focusTask.description }}</p>
            
            <div v-if="focusError" class="error-message">
              {{ focusError }}
            </div>
            
            <div class="modal-actions">
              <button type="button" @click="closeFocusModal" class="cancel-btn">
                Close
              </button>
              <button type="button" @click="handleMarkFocusComplete" class="purple-btn" :disabled="completingTask">
                {{ completingTask ? 'Completing...' : 'Mark Complete' }}
              </button>
            </div>
          </div>
          
          <!-- Task Completed State -->
          <div v-else-if="taskCompleted" class="focus-completion-content">
            <div class="completion-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="completion-icon">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <h3 class="completion-title">Nice job!</h3>
              <p class="completion-text">Task completed successfully.</p>
            </div>
            
            <div v-if="focusError" class="error-message">
              {{ focusError }}
            </div>
            
            <div class="modal-actions">
              <button type="button" @click="closeFocusModal" class="cancel-btn">
                Close
              </button>
              <button v-if="hasNextTask" type="button" @click="loadNextTask" class="purple-btn">
                Next Task
              </button>
            </div>
          </div>
          
          <!-- No Focus Task State -->
          <div v-else class="focus-empty-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <h3 class="empty-title">No Focus Task Set</h3>
            <p class="empty-description">Plan your day to automatically set your first task as the current focus.</p>
            
            <div class="modal-actions">
              <button type="button" @click="closeFocusModal" class="cancel-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as scheduleApi from '@/api/schedule.js'
import * as plannerApi from '@/api/planner.js'
import * as tasksApi from '@/api/tasks.js'
import * as focusApi from '@/api/focus.js'
import * as userAccountApi from '@/api/userAccount.js'
import { useAppStore } from '@/stores/app.js'
import { useTasksStore } from '@/stores/tasks.js'
import { usePlannerStore } from '@/stores/planner.js'
import { useScheduleStore } from '@/stores/schedule.js'
import NavMenu from '@/components/NavMenu.vue'

const appStore = useAppStore()
const tasksStore = useTasksStore()
const plannerStore = usePlannerStore()
const scheduleStore = useScheduleStore()

const loading = ref(false)
const error = ref('')
const busySlots = ref([])

// Filter busy slots to only show today's blocks on the timeline
// Truncate multi-day blocks to show only today's portion
const todayBusySlots = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)
  const tomorrowStart = new Date(today)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  
  return busySlots.value
    .filter(slot => {
      // Include slots that START today OR overlap with today
      const slotStart = new Date(slot.startTime || slot.start)
      const slotEnd = new Date(slot.endTime || slot.end)
      
      // Include if slot starts today or if it started before and extends into today
      const startDate = new Date(slotStart)
      startDate.setHours(0, 0, 0, 0)
      const startsToday = startDate.getTime() === today.getTime()
      const startedBefore = slotStart < today
      const endsAfterTodayStarts = slotEnd > today
      
      return startsToday || (startedBefore && endsAfterTodayStarts)
    })
    .map(slot => {
      // Truncate multi-day blocks to show only today's portion
      const slotStart = new Date(slot.startTime || slot.start)
      const slotEnd = new Date(slot.endTime || slot.end)
      
      // If block extends beyond today, truncate to end of day
      const displayStart = slotStart < today ? today.toISOString() : slot.startTime || slot.start
      const displayEnd = slotEnd > todayEnd ? todayEnd.toISOString() : slot.endTime || slot.end
      
      return {
        ...slot,
        startTime: displayStart,
        endTime: displayEnd
      }
    })
})

// Make scheduledTasks reactive to planner store
const scheduledTasks = computed(() => {
  return plannerStore.todayScheduledTasks.map(scheduledTask => ({
    _id: scheduledTask.task, // Use task ID as _id for display
    owner: appStore.sessionToken,
    task: scheduledTask.task, // The task ID
    plannedStart: scheduledTask.plannedStart,
    plannedEnd: scheduledTask.plannedEnd
  }))
})
const planning = ref(false)
const replanning = ref(false)
const clearingDay = ref(false)
const hasPlanned = computed(() => scheduledTasks.value.length > 0) // Track if we've planned the day (determines if button shows "Plan Day" or "Replan")

// Slot modal state
const slotModalMode = ref(null) // null, 'add', or 'edit'
const currentSlot = ref(null)
const slotForm = ref({
  description: '',
  startDate: null,
  startTime: null,
  endDate: null,
  endTime: null
})
const savingSlot = ref(false)
const slotError = ref('')
const startTimeMenuOpen = ref(false)
const endTimeMenuOpen = ref(false)
const startDateMenuOpen = ref(false)
const endDateMenuOpen = ref(false)
const showStartMonthYearPicker = ref(false)
const showEndMonthYearPicker = ref(false)
const startMonthYearPickerDate = ref(null)
const endMonthYearPickerDate = ref(null)
const startMonthScrollRef = ref(null)
const startYearScrollRef = ref(null)
const endMonthScrollRef = ref(null)
const endYearScrollRef = ref(null)
const months = ref(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
const years = ref(Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i))

// Focus modal state
const showFocusModal = ref(false)
const focusTask = ref(null)
const loadingFocus = ref(false)
const completingTask = ref(false)
const taskCompleted = ref(false)
const focusError = ref('')
const hasNextTask = ref(false)

// Hours for timeline (12 AM to 11 PM - all 24 hours)
const hours = ref(Array.from({ length: 24 }, (_, i) => i))

// Reference to timeline element for scrolling
const timelineRef = ref(null)

// Current time for "now" indicator (updates every minute)
const currentTime = ref(new Date())

  // Working day settings (start and end time)
  const workingDayStart = ref('09:00') // Default 9 AM
  const workingDayEnd = ref('19:00') // Default 7 PM (backend defaults to 19:00)
  const workingDayStartMenuOpen = ref(false)
  const workingDayEndMenuOpen = ref(false)

// Load working day settings from backend
const loadWorkingDaySettings = async () => {
  if (!appStore.sessionToken) return
  
  try {
    console.log('Loading working hours from backend...')
    const response = await userAccountApi.getWorkingHours(appStore.sessionToken)
    console.log('Raw response from getWorkingHours:', response)
    
    if (response && response.workingHours) {
      workingDayStart.value = response.workingHours.start || '09:00'
      workingDayEnd.value = response.workingHours.end || '19:00'
      console.log('✓ Loaded working hours from backend:', response.workingHours)
    } else {
      console.warn('No workingHours in response, using defaults')
      workingDayStart.value = '09:00'
      workingDayEnd.value = '19:00'
    }
  } catch (e) {
    console.error('Failed to load working hours from backend:', e)
    // Fallback to defaults
    workingDayStart.value = '09:00'
    workingDayEnd.value = '19:00'
  }
}

// Track previous minute values for working day times
  const prevWorkingDayStartMinutes = ref(null)
  const prevWorkingDayEndMinutes = ref(null)

  // Watch for minute changes and close menu when minutes are selected
  watch(() => workingDayStart.value, (newTime) => {
    if (!newTime || !workingDayStartMenuOpen.value) return

    let currentMinutes = null
    if (newTime instanceof Date) {
      currentMinutes = newTime.getMinutes()
    } else if (typeof newTime === 'string') {
      const parts = newTime.split(':')
      if (parts.length >= 2) {
        currentMinutes = parseInt(parts[1] || '0', 10)
      }
    }

    // Close menu if minutes changed (not just hour)
    if (prevWorkingDayStartMinutes.value !== null && currentMinutes !== null &&
        prevWorkingDayStartMinutes.value !== currentMinutes) {
      workingDayStartMenuOpen.value = false
      saveWorkingDaySettings()
    }

    prevWorkingDayStartMinutes.value = currentMinutes
  })

  watch(() => workingDayEnd.value, (newTime) => {
    if (!newTime || !workingDayEndMenuOpen.value) return

    let currentMinutes = null
    if (newTime instanceof Date) {
      currentMinutes = newTime.getMinutes()
    } else if (typeof newTime === 'string') {
      const parts = newTime.split(':')
      if (parts.length >= 2) {
        currentMinutes = parseInt(parts[1] || '0', 10)
      }
    }

    // Close menu if minutes changed (not just hour)
    if (prevWorkingDayEndMinutes.value !== null && currentMinutes !== null &&
        prevWorkingDayEndMinutes.value !== currentMinutes) {
      workingDayEndMenuOpen.value = false
      saveWorkingDaySettings()
    }

    prevWorkingDayEndMinutes.value = currentMinutes
  })

  // Capture initial minute values when menus open
  watch(workingDayStartMenuOpen, (isOpen) => {
    if (isOpen) {
      nextTick(() => {
        const currentTime = workingDayStart.value
        if (currentTime) {
          if (currentTime instanceof Date) {
            prevWorkingDayStartMinutes.value = currentTime.getMinutes()
          } else if (typeof currentTime === 'string') {
            const parts = currentTime.split(':')
            if (parts.length >= 2) {
              prevWorkingDayStartMinutes.value = parseInt(parts[1] || '0', 10)
            }
          }
        }
      })
    }
  })

  watch(workingDayEndMenuOpen, (isOpen) => {
    if (isOpen) {
      nextTick(() => {
        const currentTime = workingDayEnd.value
        if (currentTime) {
          if (currentTime instanceof Date) {
            prevWorkingDayEndMinutes.value = currentTime.getMinutes()
          } else if (typeof currentTime === 'string') {
            const parts = currentTime.split(':')
            if (parts.length >= 2) {
              prevWorkingDayEndMinutes.value = parseInt(parts[1] || '0', 10)
            }
          }
        }
      })
    }
  })

  // Update time from picker and close menu (same pattern as TaskView)
  const updateWorkingDayStartTimeFromPicker = () => {
    workingDayStartMenuOpen.value = false
  }

  const updateWorkingDayEndTimeFromPicker = () => {
    workingDayEndMenuOpen.value = false
  }

  // Handle Enter key for time pickers - close menu and prevent form submission (same pattern as TaskView)
  const handleWorkingDayStartTimePickerEnter = (event) => {
    event.preventDefault()
    event.stopPropagation()
    workingDayStartMenuOpen.value = false
    saveWorkingDaySettings()
  }

  const handleWorkingDayEndTimePickerEnter = (event) => {
    event.preventDefault()
    event.stopPropagation()
    workingDayEndMenuOpen.value = false
    saveWorkingDaySettings()
  }

  const saveWorkingDaySettings = async () => {
    if (!appStore.sessionToken) return
    
    // Convert Date objects to HH:MM string format for storage
    let startValue = workingDayStart.value
    if (startValue instanceof Date) {
      const hours = startValue.getHours().toString().padStart(2, '0')
      const minutes = startValue.getMinutes().toString().padStart(2, '0')
      startValue = `${hours}:${minutes}`
    }
    
    let endValue = workingDayEnd.value
    if (endValue instanceof Date) {
      const hours = endValue.getHours().toString().padStart(2, '0')
      const minutes = endValue.getMinutes().toString().padStart(2, '0')
      endValue = `${hours}:${minutes}`
    }
    
    console.log('Saving working hours to backend:', { start: startValue, end: endValue })
    
    try {
      const response = await userAccountApi.setWorkingHours(appStore.sessionToken, startValue, endValue)
      console.log('✓ Saved working hours to backend. Response:', response)
    } catch (e) {
      console.error('Failed to save working hours to backend:', e)
    }
  }

// Get working day blocked slots (before start time and after end time)
const getWorkingDayBlockedSlots = (planningDate) => {
  const blockedSlots = []
  
  if (!workingDayStart.value || !workingDayEnd.value) {
    console.log('No working day settings found, skipping blocked slots')
    return blockedSlots
  }
  
  console.log('Generating working day blocked slots with:', {
    start: workingDayStart.value,
    end: workingDayEnd.value,
    planningDate: planningDate.toISOString()
  })
  
  // Parse start and end times (these are in LOCAL time, e.g. "09:00" means 9 AM in user's timezone)
  const [startHour, startMinute] = workingDayStart.value.split(':').map(Number)
  const [endHour, endMinute] = workingDayEnd.value.split(':').map(Number)
  
  // Create dates in LOCAL time, then convert to UTC for API
  // This ensures "9:00 AM" means 9 AM in user's timezone, not 9 AM UTC
  const dayStart = new Date(planningDate)
  dayStart.setHours(0, 0, 0, 0)
  
  const workingStart = new Date(planningDate)
  workingStart.setHours(startHour, startMinute, 0, 0)
  
  const workingEnd = new Date(planningDate)
  workingEnd.setHours(endHour, endMinute, 0, 0)
  
  const dayEnd = new Date(planningDate)
  dayEnd.setHours(23, 59, 59, 999)
  
  // Block time before working day starts (midnight to start time)
  if (workingStart > dayStart) {
    blockedSlots.push({
      start: dayStart.toISOString(),
      end: workingStart.toISOString()
    })
    console.log('Added blocked slot before working day:', dayStart.toISOString(), 'to', workingStart.toISOString())
  }
  
  // Block time after working day ends (end time to midnight)
  if (workingEnd < dayEnd) {
    blockedSlots.push({
      start: workingEnd.toISOString(),
      end: dayEnd.toISOString()
    })
    console.log('Added blocked slot after working day:', workingEnd.toISOString(), 'to', dayEnd.toISOString())
  }
  
  return blockedSlots
}

// Get sleeping time blocks (between end day and start day) for display
// These are displayed as blocked time blocks but without name or time labels
const sleepingTimeBlocks = computed(() => {
  const blocks = []
  
  if (!workingDayStart.value || !workingDayEnd.value) {
    return blocks
  }
  
  // Parse start and end times
  const [startHour, startMinute] = workingDayStart.value.split(':').map(Number)
  const [endHour, endMinute] = workingDayEnd.value.split(':').map(Number)
  
  // Get today's date (midnight)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Create sleeping time blocks
  // 1. From midnight to start of working day
  const sleepStart = new Date(today)
  sleepStart.setHours(0, 0, 0, 0)
  
  const workStart = new Date(today)
  workStart.setHours(startHour, startMinute, 0)
  
  // 2. From end of working day to midnight (next day)
  const workEnd = new Date(today)
  workEnd.setHours(endHour, endMinute, 0)
  
  const sleepEnd = new Date(today)
  sleepEnd.setHours(23, 59, 59, 999)
  
  // Add sleeping block before working day (midnight to start)
  if (workStart > sleepStart) {
    blocks.push({
      _id: 'sleeping-before',
      startTime: sleepStart.toISOString(),
      endTime: workStart.toISOString(),
      isSleeping: true
    })
  }
  
  // Add sleeping block after working day (end to midnight)
  if (workEnd < sleepEnd) {
    blocks.push({
      _id: 'sleeping-after',
      startTime: workEnd.toISOString(),
      endTime: sleepEnd.toISOString(),
      isSleeping: true
    })
  }
  
  return blocks
})


// Load busy slots from Schedule database (Schedule concept)
// Fetch busy slots from Schedule concept via schedule store
const loadBusySlots = async () => {
  if (!appStore.sessionToken) return
  
  try {
    // Fetch busy slots from Schedule concept via schedule store
    await scheduleStore.fetchSlots(appStore.sessionToken)
    busySlots.value = scheduleStore.busySlots
    
    // Debug: Log slot dates
    console.log('Loaded busy slots with dates:')
    busySlots.value.forEach(slot => {
      const slotDate = new Date(slot.startTime || slot.start)
      console.log(`  - ${slot.description}: ${slotDate.toLocaleString()} (${slotDate.toDateString()})`)
    })
  } catch (err) {
    error.value = err.message || 'Failed to load busy slots'
    busySlots.value = []
  }
}

// Clean up old blocked times (from previous days)
const cleanupOldBlocks = async () => {
  if (!appStore.sessionToken) return
  
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const oldSlots = busySlots.value.filter(slot => {
      const slotDate = new Date(slot.startTime || slot.start)
      slotDate.setHours(0, 0, 0, 0)
      return slotDate.getTime() < today.getTime() // Before today
    })
    
    if (oldSlots.length > 0) {
      console.log(`🧹 Cleaning up ${oldSlots.length} old blocked time(s) from previous days...`)
      
      for (const slot of oldSlots) {
        try {
          await scheduleApi.deleteSlot(appStore.sessionToken, slot._id)
          console.log(`  ✓ Deleted: ${slot.description} from ${new Date(slot.startTime).toDateString()}`)
        } catch (err) {
          console.warn(`  ✗ Failed to delete slot ${slot._id}:`, err.message)
        }
      }
      
      // Refresh busy slots after cleanup
      await loadBusySlots()
      console.log('✓ Cleanup complete')
    } else {
      console.log('No old blocked times to clean up')
    }
  } catch (err) {
    console.error('Failed to cleanup old blocks:', err)
  }
}

const loadScheduledTasks = async () => {
  if (!appStore.sessionToken) return
  
  try {
    // Scheduled tasks are now computed from planner store, so they're always up-to-date
    // Just sync tasks with scheduled times
    console.log('All scheduled tasks in store:', plannerStore.scheduledTasks)
    console.log('Filtered scheduled tasks (todayScheduledTasks):', plannerStore.todayScheduledTasks)
    console.log('All busy slots:', busySlots.value.length, '| Today\'s busy slots:', todayBusySlots.value.length)
    console.log('Loaded scheduled tasks (computed):', scheduledTasks.value)
  } catch (err) {
    console.error('Failed to load scheduled tasks:', err)
  }
}

// Format helpers
const formatDateHeader = () => {
  const today = new Date()
  return today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

const formatHour = (hour) => {
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:00 ${ampm}`
}

const formatSlotTime = (dateTime) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`
}

// Get current time indicator position on timeline
const getCurrentTimeStyle = () => {
  const now = currentTime.value
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const totalMinutes = hours * 60 + minutes
  const topPosition = (totalMinutes / 60) * 40 // 40px per hour
  
  return {
    top: `${topPosition}px`,
    position: 'absolute',
    left: '0',
    right: '0',
    zIndex: '15'
  }
}

// Format current time for display
const formatCurrentTime = () => {
  const now = currentTime.value
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`
}

// Format time for display in 12-hour format with AM/PM
const formatTimeForDisplay = (timeValue) => {
  if (!timeValue) return ''
  
  let hours, minutes
  
  if (timeValue instanceof Date) {
    hours = timeValue.getHours()
    minutes = timeValue.getMinutes()
  } else if (typeof timeValue === 'string') {
    // Handle time string format like "14:30" or "14:30:00"
    const timeParts = timeValue.split(':')
    hours = parseInt(timeParts[0], 10)
    minutes = parseInt(timeParts[1] || '0', 10)
  } else {
    return ''
  }
  
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`
}

// Format task due date for focus modal
const formatTaskDueDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

// Format task duration for focus modal
const formatTaskDuration = (minutes) => {
  if (!minutes) return ''
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours} hr`
  }
  return `${hours} hr ${mins} min`
}

// Format date for display in text field
// Helper functions to extract hours and minutes from time value
const getTimeHours = (timeValue) => {
  if (!timeValue) return ''
  if (timeValue instanceof Date) {
    return timeValue.getHours()
  } else if (typeof timeValue === 'string') {
    const timeParts = timeValue.split(':')
    return parseInt(timeParts[0], 10) || ''
  }
  return ''
}

const getTimeMinutes = (timeValue) => {
  if (!timeValue) return ''
  if (timeValue instanceof Date) {
    return timeValue.getMinutes()
  } else if (typeof timeValue === 'string') {
    const timeParts = timeValue.split(':')
    return parseInt(timeParts[1], 10) || ''
  }
  return ''
}

// Helper functions for start time
const getStartTimeHours = () => {
  return getTimeHours(slotForm.value.startTime)
}

const getStartTimeMinutes = () => {
  return getTimeMinutes(slotForm.value.startTime)
}

// Helper functions for end time
const getEndTimeHours = () => {
  return getTimeHours(slotForm.value.endTime)
}

const getEndTimeMinutes = () => {
  return getTimeMinutes(slotForm.value.endTime)
}

// Update time from input fields
const updateTimeFromInput = (timeValue, inputValue, type) => {
  if (inputValue === '' || inputValue === null || inputValue === undefined) return timeValue
  
  const hours = type === 'hours' ? Math.max(0, Math.min(23, parseInt(inputValue, 10) || 0)) : (timeValue instanceof Date ? timeValue.getHours() : (typeof timeValue === 'string' ? parseInt(timeValue.split(':')[0], 10) : 0))
  const minutes = type === 'minutes' ? Math.max(0, Math.min(59, parseInt(inputValue, 10) || 0)) : (timeValue instanceof Date ? timeValue.getMinutes() : (typeof timeValue === 'string' ? parseInt(timeValue.split(':')[1], 10) : 0))
  
  const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  return timeString
}

const updateStartTimeFromInput = (event, type) => {
  const inputValue = event.target.value
  slotForm.value.startTime = updateTimeFromInput(slotForm.value.startTime, inputValue, type)
}

const updateEndTimeFromInput = (event, type) => {
  const inputValue = event.target.value
  slotForm.value.endTime = updateTimeFromInput(slotForm.value.endTime, inputValue, type)
}

// Track previous minute values to detect when minutes change
const prevStartTimeMinutes = ref(null)
const prevEndTimeMinutes = ref(null)

// Watch for minute changes and close menu when minutes are selected
watch(() => slotForm.value.startTime, (newTime) => {
  if (!newTime || !startTimeMenuOpen.value) return
  
  let currentMinutes = null
  if (newTime instanceof Date) {
    currentMinutes = newTime.getMinutes()
  } else if (typeof newTime === 'string') {
    const parts = newTime.split(':')
    if (parts.length >= 2) {
      currentMinutes = parseInt(parts[1] || '0', 10)
    }
  }
  
  // Close menu if minutes changed (not just hour or AM/PM)
  if (prevStartTimeMinutes.value !== null && currentMinutes !== null && 
      prevStartTimeMinutes.value !== currentMinutes) {
    startTimeMenuOpen.value = false
  }
  
  prevStartTimeMinutes.value = currentMinutes
})

watch(() => slotForm.value.endTime, (newTime) => {
  if (!newTime || !endTimeMenuOpen.value) return
  
  let currentMinutes = null
  if (newTime instanceof Date) {
    currentMinutes = newTime.getMinutes()
  } else if (typeof newTime === 'string') {
    const parts = newTime.split(':')
    if (parts.length >= 2) {
      currentMinutes = parseInt(parts[1] || '0', 10)
    }
  }
  
  // Close menu if minutes changed (not just hour or AM/PM)
  if (prevEndTimeMinutes.value !== null && currentMinutes !== null && 
      prevEndTimeMinutes.value !== currentMinutes) {
    endTimeMenuOpen.value = false
  }
  
  prevEndTimeMinutes.value = currentMinutes
})

// Capture initial minute values when menu opens
watch(startTimeMenuOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      // Capture initial minute value
      const currentTime = slotForm.value.startTime
      if (currentTime) {
        if (currentTime instanceof Date) {
          prevStartTimeMinutes.value = currentTime.getMinutes()
        } else if (typeof currentTime === 'string') {
          const parts = currentTime.split(':')
          if (parts.length >= 2) {
            prevStartTimeMinutes.value = parseInt(parts[1] || '0', 10)
          }
        }
      } else {
        prevStartTimeMinutes.value = null
      }
    })
  }
})

watch(endTimeMenuOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      // Capture initial minute value
      const currentTime = slotForm.value.endTime
      if (currentTime) {
        if (currentTime instanceof Date) {
          prevEndTimeMinutes.value = currentTime.getMinutes()
        } else if (typeof currentTime === 'string') {
          const parts = currentTime.split(':')
          if (parts.length >= 2) {
            prevEndTimeMinutes.value = parseInt(parts[1] || '0', 10)
          }
        }
      } else {
        prevEndTimeMinutes.value = null
      }
    })
  }
})

// Update time from picker and close menu (kept for backward compatibility)
const updateStartTimeFromPicker = () => {
  startTimeMenuOpen.value = false
}

const updateEndTimeFromPicker = () => {
  endTimeMenuOpen.value = false
}

const formatDateForDisplay = (date) => {
  if (!date) return ''
  if (typeof date === 'string') {
    // Handle ISO date string (YYYY-MM-DD)
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
  if (date instanceof Date) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
  return ''
}

// Month/Year picker functions for start date
const openStartMonthYearPicker = (e) => {
  if (e) e.stopPropagation()
  showStartMonthYearPicker.value = true
  if (slotForm.value.startDate) {
    if (typeof slotForm.value.startDate === 'string') {
      startMonthYearPickerDate.value = new Date(slotForm.value.startDate + 'T00:00:00')
    } else {
      startMonthYearPickerDate.value = new Date(slotForm.value.startDate)
    }
  } else {
    startMonthYearPickerDate.value = new Date()
  }
  
  nextTick(() => {
    scrollToStartCurrentMonth()
    scrollToStartCurrentYear()
  })
}

const isStartCurrentMonth = (index) => {
  if (!startMonthYearPickerDate.value) return false
  return startMonthYearPickerDate.value.getMonth() === index
}

const isStartCurrentYear = (year) => {
  if (!startMonthYearPickerDate.value) return false
  return startMonthYearPickerDate.value.getFullYear() === year
}

const selectStartMonth = (monthIndex) => {
  if (!startMonthYearPickerDate.value) {
    startMonthYearPickerDate.value = new Date()
  }
  startMonthYearPickerDate.value.setMonth(monthIndex)
  updateStartDateFromPicker()
  showStartMonthYearPicker.value = false
}

const selectStartYear = (year) => {
  if (!startMonthYearPickerDate.value) {
    startMonthYearPickerDate.value = new Date()
  }
  startMonthYearPickerDate.value.setFullYear(year)
  updateStartDateFromPicker()
}

const updateStartDateFromPicker = () => {
  if (startMonthYearPickerDate.value) {
    // Format as YYYY-MM-DD for Vuetify date picker
    const year = startMonthYearPickerDate.value.getFullYear()
    const month = String(startMonthYearPickerDate.value.getMonth() + 1).padStart(2, '0')
    const day = String(startMonthYearPickerDate.value.getDate()).padStart(2, '0')
    slotForm.value.startDate = `${year}-${month}-${day}`
  }
}

const scrollToStartCurrentMonth = () => {
  if (startMonthScrollRef.value && startMonthYearPickerDate.value) {
    const monthIndex = startMonthYearPickerDate.value.getMonth()
    const itemHeight = 48
    const scrollPosition = monthIndex * itemHeight - (startMonthScrollRef.value.clientHeight / 2) + (itemHeight / 2)
    startMonthScrollRef.value.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' })
  }
}

const scrollToStartCurrentYear = () => {
  if (startYearScrollRef.value && startMonthYearPickerDate.value) {
    const currentYear = startMonthYearPickerDate.value.getFullYear()
    const yearIndex = years.value.indexOf(currentYear)
    if (yearIndex !== -1) {
      const itemHeight = 48
      const scrollPosition = yearIndex * itemHeight - (startYearScrollRef.value.clientHeight / 2) + (itemHeight / 2)
      startYearScrollRef.value.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' })
    }
  }
}

// Month/Year picker functions for end date
const openEndMonthYearPicker = (e) => {
  if (e) e.stopPropagation()
  showEndMonthYearPicker.value = true
  if (slotForm.value.endDate) {
    if (typeof slotForm.value.endDate === 'string') {
      endMonthYearPickerDate.value = new Date(slotForm.value.endDate + 'T00:00:00')
    } else {
      endMonthYearPickerDate.value = new Date(slotForm.value.endDate)
    }
  } else {
    endMonthYearPickerDate.value = new Date()
  }
  
  nextTick(() => {
    scrollToEndCurrentMonth()
    scrollToEndCurrentYear()
  })
}

const isEndCurrentMonth = (index) => {
  if (!endMonthYearPickerDate.value) return false
  return endMonthYearPickerDate.value.getMonth() === index
}

const isEndCurrentYear = (year) => {
  if (!endMonthYearPickerDate.value) return false
  return endMonthYearPickerDate.value.getFullYear() === year
}

const selectEndMonth = (monthIndex) => {
  if (!endMonthYearPickerDate.value) {
    endMonthYearPickerDate.value = new Date()
  }
  endMonthYearPickerDate.value.setMonth(monthIndex)
  updateEndDateFromPicker()
  showEndMonthYearPicker.value = false
}

const selectEndYear = (year) => {
  if (!endMonthYearPickerDate.value) {
    endMonthYearPickerDate.value = new Date()
  }
  endMonthYearPickerDate.value.setFullYear(year)
  updateEndDateFromPicker()
}

const updateEndDateFromPicker = () => {
  if (endMonthYearPickerDate.value) {
    // Format as YYYY-MM-DD for Vuetify date picker
    const year = endMonthYearPickerDate.value.getFullYear()
    const month = String(endMonthYearPickerDate.value.getMonth() + 1).padStart(2, '0')
    const day = String(endMonthYearPickerDate.value.getDate()).padStart(2, '0')
    slotForm.value.endDate = `${year}-${month}-${day}`
  }
}

const scrollToEndCurrentMonth = () => {
  if (endMonthScrollRef.value && endMonthYearPickerDate.value) {
    const monthIndex = endMonthYearPickerDate.value.getMonth()
    const itemHeight = 48
    const scrollPosition = monthIndex * itemHeight - (endMonthScrollRef.value.clientHeight / 2) + (itemHeight / 2)
    endMonthScrollRef.value.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' })
  }
}

const scrollToEndCurrentYear = () => {
  if (endYearScrollRef.value && endMonthYearPickerDate.value) {
    const currentYear = endMonthYearPickerDate.value.getFullYear()
    const yearIndex = years.value.indexOf(currentYear)
    if (yearIndex !== -1) {
      const itemHeight = 48
      const scrollPosition = yearIndex * itemHeight - (endYearScrollRef.value.clientHeight / 2) + (itemHeight / 2)
      endYearScrollRef.value.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' })
    }
  }
}

// Helper function to check if two time ranges overlap
const timeRangesOverlap = (start1, end1, start2, end2) => {
  // Two ranges overlap if: start1 < end2 AND start2 < end1
  // This means one starts before the other ends, and vice versa
  return start1 < end2 && start2 < end1
}

// Helper function to get all overlapping items for a given item
const getOverlappingItems = (item, allItems, getStartTime, getEndTime) => {
  const itemStart = new Date(getStartTime(item))
  const itemEnd = new Date(getEndTime(item))
  
  return allItems.filter(otherItem => {
    // Don't compare with self
    if (otherItem === item) return false
    
    const otherStart = new Date(getStartTime(otherItem))
    const otherEnd = new Date(getEndTime(otherItem))
    
    // Check if they overlap
    return timeRangesOverlap(
      itemStart.getTime(),
      itemEnd.getTime(),
      otherStart.getTime(),
      otherEnd.getTime()
    )
  })
}

// Calculate slot position and height for timeline with overlap handling
const getSlotStyle = (slot) => {
  const start = new Date(slot.startTime)
  const end = new Date(slot.endTime)
  
  const startHour = start.getHours() + start.getMinutes() / 60
  const endHour = end.getHours() + end.getMinutes() / 60
  
  // Timeline covers all 24 hours (0-23)
  const top = (startHour / 24) * 100
  const height = ((endHour - startHour) / 24) * 100
  
  // Filter scheduled tasks and busy slots to only those that overlap with the slot's day
  // Use overlap detection (not just start time) to catch slots that span multiple days
  const slotDate = new Date(slot.startTime || slot.start)
  slotDate.setHours(0, 0, 0, 0)
  const slotDateEnd = new Date(slotDate)
  slotDateEnd.setDate(slotDateEnd.getDate() + 1)
  
  const scheduledTasksOnSlotDay = scheduledTasks.value.filter(task => {
    const taskStart = new Date(task.plannedStart)
    const taskEnd = new Date(task.plannedEnd)
    // Check if task overlaps with slot's day (not just if it starts on that day)
    return taskStart < slotDateEnd && taskEnd > slotDate
  })
  
  // Filter busy slots to only those that overlap with the slot's day
  const busySlotsOnSlotDay = busySlots.value.filter(s => {
    const sStart = new Date(s.startTime || s.start)
    const sEnd = new Date(s.endTime || s.end)
    // Check if slot overlaps with slot's day (not just if it starts on that day)
    return sStart < slotDateEnd && sEnd > slotDate
  })
  
  // Get all items (busy slots + scheduled tasks) for overlap detection
  // Sleeping blocks are excluded - they're purely visual
  // Only include items on the same day as the slot
  const allItems = [
    ...busySlotsOnSlotDay.map(s => ({ type: 'slot', data: s })),
    ...scheduledTasksOnSlotDay.map(t => ({ type: 'task', data: t }))
  ]
  
  const getStartTime = (item) => {
    if (item.type === 'slot') {
      return item.data.startTime || item.data.start
    }
    return item.data.plannedStart
  }
  const getEndTime = (item) => {
    if (item.type === 'slot') {
      return item.data.endTime || item.data.end
    }
    return item.data.plannedEnd
  }
  const getItemId = (item) => item.data._id || item.data.task

  const currentItem = { type: 'slot', data: slot }
  const currentStart = new Date(getStartTime(currentItem)).getTime()
  const currentEnd = new Date(getEndTime(currentItem)).getTime()

  // Find all items that overlap with current item to form a group
  // Only include items that actually overlap in TIME (not just on the same day)
  const overlappingGroup = [currentItem]

  for (const otherItem of allItems) {
    if (getItemId(otherItem) === getItemId(currentItem)) continue
    
    const otherStart = new Date(getStartTime(otherItem)).getTime()
    const otherEnd = new Date(getEndTime(otherItem)).getTime()
    
    // Check if this item overlaps with the current slot in TIME
    const overlapsWithSlot = timeRangesOverlap(otherStart, otherEnd, currentStart, currentEnd)
    
    // Also check if this item overlaps with ANY item already in the group
    const overlapsWithGroup = overlappingGroup.some(groupItem => {
      const groupStart = new Date(getStartTime(groupItem)).getTime()
      const groupEnd = new Date(getEndTime(groupItem)).getTime()
      return timeRangesOverlap(otherStart, otherEnd, groupStart, groupEnd)
    })
    
    // Only add to group if it overlaps with the slot or with something already in the group
    if (overlapsWithSlot || overlapsWithGroup) {
      overlappingGroup.push(otherItem)
    }
  }
  
  // Sort group by start time, then by ID for stable sorting
  overlappingGroup.sort((a, b) => {
    const aStart = new Date(getStartTime(a))
    const bStart = new Date(getStartTime(b))
    const timeDiff = aStart.getTime() - bStart.getTime()
    if (timeDiff !== 0) return timeDiff
    // If same start time, sort by ID for consistency
    return getItemId(a).localeCompare(getItemId(b))
  })
  
  // Find index of current item in group
  const index = overlappingGroup.findIndex(item => getItemId(item) === getItemId(currentItem))
  const groupSize = overlappingGroup.length
  
  // If only one item in group, use full width
  if (groupSize === 1) {
    return {
      top: `${top}%`,
      height: `${height}%`,
      position: 'absolute',
      left: '20px',
      right: '20px'
    }
  }
  
  // Positioning: divide total width by groupSize, place each at i * (total_width / n)
  const baseLeft = 20 // pixels from timeline (reduced from 40px to match right margin)
  const rightMargin = 20 // pixels
  const gap = 4 // pixels between items
  
  // Total available width = 100% - 40px (baseLeft + rightMargin)
  // With gaps: total_width = available_width - (n-1)*gap
  // Each item width = total_width / n = (available_width - (n-1)*gap) / n
  // Position of item i = baseLeft + i * (available_width / n)
  
  const totalGaps = (groupSize - 1) * gap
  const availableWidth = `calc(100% - ${baseLeft + rightMargin}px)`
  const itemWidth = `calc((${availableWidth} - ${totalGaps}px) / ${groupSize})`
  
  // Position: baseLeft + index * (availableWidth / groupSize)
  const leftPos = index === 0
    ? `${baseLeft}px`
    : `calc(${baseLeft}px + ${index} * ${availableWidth} / ${groupSize})`
  
  return {
    top: `${top}%`,
    height: `${height}%`,
    position: 'absolute',
    left: leftPos,
    width: itemWidth,
    boxSizing: 'border-box'
  }
}

// Calculate task slot position with overlap handling
const getTaskSlotStyle = (task) => {
  const start = new Date(task.plannedStart)
  const end = new Date(task.plannedEnd)
  
  const startHour = start.getHours() + start.getMinutes() / 60
  const endHour = end.getHours() + end.getMinutes() / 60
  
  // Timeline covers all 24 hours (0-23)
  const top = (startHour / 24) * 100
  const height = ((endHour - startHour) / 24) * 100
  
  // Filter busy slots to only those that overlap with the task's day
  // Use overlap detection (not just start time) to catch slots that span multiple days
  const taskDate = new Date(task.plannedStart)
  taskDate.setHours(0, 0, 0, 0)
  const taskDateEnd = new Date(taskDate)
  taskDateEnd.setDate(taskDateEnd.getDate() + 1)

  const busySlotsOnTaskDay = busySlots.value.filter(slot => {
    const slotStart = new Date(slot.startTime || slot.start)
    const slotEnd = new Date(slot.endTime || slot.end)
    // Check if slot overlaps with task's day (not just if it starts on that day)
    return slotStart < taskDateEnd && slotEnd > taskDate
  })
  
  // Get all items (busy slots + scheduled tasks) for overlap detection
  // Sleeping blocks are excluded - they're purely visual, tasks can overlap with them
  // Include busy slots that overlap with the task's day (already filtered above)
  // Also filter scheduled tasks to only those that could potentially overlap with this task
  const allItems = [
    ...busySlotsOnTaskDay.map(s => ({ type: 'slot', data: s })),
    // Only include scheduled tasks that are on the same day as this task
    ...scheduledTasks.value.filter(t => {
      const tDate = new Date(t.plannedStart)
      tDate.setHours(0, 0, 0, 0)
      return tDate.getTime() === taskDate.getTime()
    }).map(t => ({ type: 'task', data: t }))
  ]
  
  const getStartTime = (item) => {
    if (item.type === 'slot') {
      return item.data.startTime || item.data.start
    }
    return item.data.plannedStart
  }
  const getEndTime = (item) => {
    if (item.type === 'slot') {
      return item.data.endTime || item.data.end
    }
    return item.data.plannedEnd
  }
  const getItemId = (item) => item.data._id || item.data.task

  const currentItem = { type: 'task', data: task }
  const currentStart = new Date(getStartTime(currentItem)).getTime()
  const currentEnd = new Date(getEndTime(currentItem)).getTime()

  // Find all items that overlap with current item to form a group
  // Only include items that actually overlap in TIME (not just on the same day)
  const overlappingGroup = [currentItem]

  for (const otherItem of allItems) {
    if (getItemId(otherItem) === getItemId(currentItem)) continue
    
    const otherStart = new Date(getStartTime(otherItem)).getTime()
    const otherEnd = new Date(getEndTime(otherItem)).getTime()
    
    // Check if this item overlaps with the current task in TIME
    const overlapsWithTask = timeRangesOverlap(otherStart, otherEnd, currentStart, currentEnd)
    
    // Also check if this item overlaps with ANY item already in the group
    const overlapsWithGroup = overlappingGroup.some(groupItem => {
      const groupStart = new Date(getStartTime(groupItem)).getTime()
      const groupEnd = new Date(getEndTime(groupItem)).getTime()
      return timeRangesOverlap(otherStart, otherEnd, groupStart, groupEnd)
    })
    
    // Only add to group if it overlaps with the task or with something already in the group
    if (overlapsWithTask || overlapsWithGroup) {
      overlappingGroup.push(otherItem)
    }
  }
  
  // Sort group by start time, then by ID for stable sorting
  overlappingGroup.sort((a, b) => {
    const aStart = new Date(getStartTime(a))
    const bStart = new Date(getStartTime(b))
    const timeDiff = aStart.getTime() - bStart.getTime()
    if (timeDiff !== 0) return timeDiff
    // If same start time, sort by ID for consistency
    return getItemId(a).localeCompare(getItemId(b))
  })
  
  // Find index of current item in group
  const index = overlappingGroup.findIndex(item => getItemId(item) === getItemId(currentItem))
  const groupSize = overlappingGroup.length
  
  // If only one item in group, use full width
  if (groupSize === 1) {
    return {
      top: `${top}%`,
      height: `${height}%`,
      position: 'absolute',
      left: '20px',
      right: '20px'
    }
  }
  
  // Positioning: divide total width by groupSize, place each at i * (total_width / n)
  const baseLeft = 20 // pixels from timeline (reduced from 40px to match right margin)
  const rightMargin = 20 // pixels
  const gap = 4 // pixels between items
  
  // Total available width = 100% - 40px (baseLeft + rightMargin)
  // With gaps: total_width = available_width - (n-1)*gap
  // Each item width = total_width / n = (available_width - (n-1)*gap) / n
  // Position of item i = baseLeft + i * (available_width / n)
  
  const totalGaps = (groupSize - 1) * gap
  const availableWidth = `calc(100% - ${baseLeft + rightMargin}px)`
  const itemWidth = `calc((${availableWidth} - ${totalGaps}px) / ${groupSize})`
  
  // Position: baseLeft + index * (availableWidth / groupSize)
  const leftPos = index === 0
    ? `${baseLeft}px`
    : `calc(${baseLeft}px + ${index} * ${availableWidth} / ${groupSize})`
  
  return {
    top: `${top}%`,
    height: `${height}%`,
    position: 'absolute',
    left: leftPos,
    width: itemWidth,
    boxSizing: 'border-box'
  }
}

// Slot modal handlers
const openAddSlotModal = () => {
  slotModalMode.value = 'add'
  currentSlot.value = null
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  slotForm.value = {
    description: '',
    startDate: tomorrow,
    startTime: '09:00', // Vuetify time picker uses string format
    endDate: tomorrow,
    endTime: '10:00'
  }
  slotError.value = ''
}

const openEditSlotModal = (slot) => {
  // Only allow editing MANUAL slots
  if (slot.origin !== 'MANUAL') {
    return
  }
  
  slotModalMode.value = 'edit'
  currentSlot.value = slot
  
  const start = new Date(slot.startTime)
  const end = new Date(slot.endTime)
  
  // Separate date and time
  const startDateOnly = new Date(start)
  startDateOnly.setHours(0, 0, 0, 0)
  // Format time as HH:MM string for Vuetify time picker
  const startHours = String(start.getHours()).padStart(2, '0')
  const startMinutes = String(start.getMinutes()).padStart(2, '0')
  const startTimeString = `${startHours}:${startMinutes}`
  
  const endDateOnly = new Date(end)
  endDateOnly.setHours(0, 0, 0, 0)
  const endHours = String(end.getHours()).padStart(2, '0')
  const endMinutes = String(end.getMinutes()).padStart(2, '0')
  const endTimeString = `${endHours}:${endMinutes}`
  
  slotForm.value = {
    description: slot.description || '',
    startDate: startDateOnly,
    startTime: startTimeString,
    endDate: endDateOnly,
    endTime: endTimeString
  }
  slotError.value = ''
}

const closeSlotModal = () => {
  slotModalMode.value = null
  currentSlot.value = null
  slotForm.value = {
    description: '',
    startDate: null,
    startTime: null,
    endDate: null,
    endTime: null
  }
  slotError.value = ''
}

const handleSlotSubmit = async () => {
  if (!appStore.sessionToken) return
  
  savingSlot.value = true
  slotError.value = ''
  
  try {
    // Validate dates and times
    if (!slotForm.value.startDate || !slotForm.value.startTime || !slotForm.value.endDate || !slotForm.value.endTime) {
      slotError.value = 'Please select both start and end dates and times'
      savingSlot.value = false
      return
    }
    
    // Helper function to extract hours and minutes from Vuetify time picker
    const getTimeFromPicker = (timeValue) => {
      if (timeValue instanceof Date) {
        return { hours: timeValue.getHours(), minutes: timeValue.getMinutes() }
      } else if (typeof timeValue === 'string') {
        // Handle string format like "09:00" or "09:00:00"
        const timeParts = timeValue.split(':')
        return { hours: parseInt(timeParts[0], 10), minutes: parseInt(timeParts[1], 10) }
      } else {
        // Try to parse as Date
        const timeOnly = new Date(timeValue)
        if (!isNaN(timeOnly.getTime())) {
          return { hours: timeOnly.getHours(), minutes: timeOnly.getMinutes() }
        }
      }
      return { hours: 0, minutes: 0 }
    }
    
    // Combine date and time for start
    const startDateOnly = slotForm.value.startDate instanceof Date 
      ? slotForm.value.startDate 
      : new Date(slotForm.value.startDate)
    const startTime = getTimeFromPicker(slotForm.value.startTime)
    
    // Combine date and time for end
    const endDateOnly = slotForm.value.endDate instanceof Date 
      ? slotForm.value.endDate 
      : new Date(slotForm.value.endDate)
    const endTime = getTimeFromPicker(slotForm.value.endTime)
    
    if (isNaN(startDateOnly.getTime()) || isNaN(endDateOnly.getTime())) {
      slotError.value = 'Please enter valid dates and times'
      savingSlot.value = false
      return
    }
    
    // Combine date and time
    const startDateTime = new Date(startDateOnly)
    startDateTime.setHours(startTime.hours, startTime.minutes, 0, 0)
    
    const endDateTime = new Date(endDateOnly)
    endDateTime.setHours(endTime.hours, endTime.minutes, 0, 0)
    
    if (endDateTime <= startDateTime) {
      slotError.value = 'End time must be after start time'
      savingSlot.value = false
      return
    }
    
    if (slotModalMode.value === 'add') {
      // Save blocked slot to Schedule database (Schedule concept)
      // This creates a BusySlot with origin=MANUAL in the Schedule concept
      const response = await scheduleApi.blockTime(
        appStore.sessionToken,
        startDateTime.toISOString(),
        endDateTime.toISOString(),
        slotForm.value.description.trim()
      )
      
      // Refresh busy slots from backend to get the complete slot data
      await loadBusySlots()
      closeSlotModal()
    } else if (slotModalMode.value === 'edit' && currentSlot.value) {
      // Update blocked slot in Schedule database (Schedule concept)
      await scheduleApi.updateSlot(
        appStore.sessionToken,  // Add missing session parameter
        currentSlot.value._id,
        startDateTime.toISOString(),
        endDateTime.toISOString(),
        slotForm.value.description.trim()
      )
      
      // Refresh busy slots from backend to get the updated slot data
      await loadBusySlots()
      closeSlotModal()
    }
  } catch (err) {
    slotError.value = err.message || (slotModalMode.value === 'add' ? 'Failed to block time' : 'Failed to update slot')
  } finally {
    savingSlot.value = false
  }
}

const handleDeleteSlot = async () => {
  if (!currentSlot.value || !appStore.sessionToken) {
    return
  }
  
  if (!confirm('Are you sure you want to delete this blocked time?')) {
    return
  }
  
  savingSlot.value = true
  slotError.value = ''
  
  try {
    await scheduleApi.deleteSlot(appStore.sessionToken, currentSlot.value._id)
    
    // Refresh busy slots from backend
    await loadBusySlots()
    closeSlotModal()
  } catch (err) {
    slotError.value = err.message || 'Failed to delete slot'
  } finally {
    savingSlot.value = false
  }
}

// Combined handler for Plan Day / Replan button
const handlePlanOrReplan = async () => {
  if (hasPlanned.value) {
    await handleReplan()
  } else {
    await handlePlanDay()
  }
}

// Plan day handlers
const handlePlanDay = async () => {
  if (!appStore.sessionToken) {
    return
  }
  
  planning.value = true
  error.value = ''
  
  try {
    // Use Pinia stores to get data from concepts
    // Fetch tasks from Tasks concept via tasks store
    if (!tasksStore.tasks.length) {
      await tasksStore.fetchTasks(appStore.sessionToken)
    }
    
    // Fetch busy slots from Schedule concept via schedule store
    await loadBusySlots()
    
    const todoTasks = tasksStore.todoTasks
    
    if (todoTasks.length === 0) {
      error.value = 'No tasks to plan. Please add some tasks first.'
      planning.value = false
      return
    }
    
    const formattedTasks = todoTasks.map(task => ({
      id: task._id,
      duration: task.estimatedDuration || 60 // Duration in minutes (backend expects minutes)
    })).filter(task => {
      // Validate task has valid ID and positive duration
      if (!task.id) {
        console.warn('Task missing ID, filtering out:', task)
        return false
      }
      if (!task.duration || task.duration <= 0) {
        console.warn('Task has invalid duration, filtering out:', task)
        return false
      }
      return true
    })
    
    if (formattedTasks.length === 0) {
      error.value = 'No valid tasks to plan. Please ensure tasks have valid data.'
      planning.value = false
      return
    }
    
    // Format busy slots from schedule store
    let formattedBusySlots = busySlots.value.map(slot => ({
      start: slot.startTime || slot.start,
      end: slot.endTime || slot.end
    })).filter(slot => {
      // Only include valid slots
      const start = new Date(slot.start)
      const end = new Date(slot.end)
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start
    })
    
    // Use today's date for planning (start of day in local timezone)
    let planningDate = new Date()
    planningDate.setHours(0, 0, 0, 0)
    
    // Add working day blocked slots for today only
    // (Backend now plans only for today, not tomorrow)
    const workingDayBlockedSlots = getWorkingDayBlockedSlots(planningDate)
    formattedBusySlots = [...formattedBusySlots, ...workingDayBlockedSlots]
    console.log('Working day settings:', {
      start: workingDayStart.value,
      end: workingDayEnd.value
    })
    console.log('Including', workingDayBlockedSlots.length, 'working day blocked slots for today:', workingDayBlockedSlots)
    
    console.log('Planning day with:', {
      userId: appStore.sessionToken,
      tasks: formattedTasks,
      busySlots: formattedBusySlots,
      planningDate: planningDate.toISOString()
    })
    console.log('Tasks detail:', JSON.stringify(formattedTasks, null, 2))
    console.log('BusySlots detail (from Schedule + working day blocks):', JSON.stringify(formattedBusySlots, null, 2))
    console.log('🔍 Sleep block check:', formattedBusySlots.find(s => s.end === '2025-11-10T08:00:00.000Z'))
    
    // Use planner store to plan day (it will refresh scheduled tasks)
    const response = await plannerStore.planDay(
      appStore.sessionToken,
      formattedTasks,
      formattedBusySlots,
      planningDate  // Pass planning date for timezone correction
    )
    
    console.log('Plan day response:', response)
    
    // Backend has scheduled the tasks - refresh busy slots and scheduled tasks to display
    await loadBusySlots()
    await loadScheduledTasks()
  } catch (err) {
    console.error('Plan day error:', err)
    error.value = err.message || 'Failed to plan day'
  } finally {
    planning.value = false
  }
}

const handleClearDay = async () => {
  if (!appStore.sessionToken) {
    return
  }
  
  if (!confirm('Are you sure you want to clear all scheduled tasks for today?')) {
    return
  }
  
  clearingDay.value = true
  error.value = ''
  
  try {
    // Clear all scheduled tasks via planner store
    await plannerStore.clearDay(appStore.sessionToken)
    
    // Refresh busy slots
    await loadBusySlots()
    
    // Load scheduled tasks (should be empty now)
    await loadScheduledTasks()
    
    // Reset hasPlanned so button shows "Plan Day" again
    hasPlanned.value = false
  } catch (err) {
    error.value = err.message || 'Failed to clear day'
  } finally {
    clearingDay.value = false
  }
}

// Focus modal handlers
const openFocusModal = async () => {
  showFocusModal.value = true
  taskCompleted.value = false
  focusError.value = ''
  await fetchCurrentFocusTask()
}

const closeFocusModal = () => {
  showFocusModal.value = false
  focusTask.value = null
  taskCompleted.value = false
  focusError.value = ''
  hasNextTask.value = false
}

const fetchCurrentFocusTask = async () => {
  console.log('Fetching current focus task...')
  if (!appStore.sessionToken) {
    console.warn('No session token available')
    return
  }
  
  loadingFocus.value = true
  focusError.value = ''
  
  try {
    // Check if there are any scheduled tasks first
    if (scheduledTasks.value.length === 0) {
      console.log('No scheduled tasks - skipping focus task fetch')
      focusTask.value = null
      loadingFocus.value = false
      return
    }
    
    // Ensure tasks are loaded first
    if (tasksStore.tasks.length === 0) {
      console.log('Tasks not loaded, fetching...')
      await tasksStore.fetchTasks(appStore.sessionToken)
    } else {
      console.log(`Tasks already loaded (${tasksStore.tasks.length} tasks)`)
    }
    
    console.log('Calling focusApi.getCurrentTask...')
    const response = await focusApi.getCurrentTask(appStore.sessionToken)
    console.log('Raw response from getCurrentTask:', response)
    
    // Backend returns: { "task": "ID" } - direct object
    const taskId = response?.task
    
    if (taskId) {
      // Get full task details from tasks store
      const task = tasksStore.tasks.find(t => t._id === taskId)
      focusTask.value = task || null
      console.log('✓ Current focus task:', task?.title || taskId)
    } else {
      focusTask.value = null
      console.log('No current focus task set by backend')
    }
  } catch (err) {
    console.error('Failed to fetch current task:', err)
    focusError.value = err.message || 'Failed to load focus task'
    focusTask.value = null
  } finally {
    loadingFocus.value = false
  }
}

const handleMarkFocusComplete = async () => {
  if (!focusTask.value || !appStore.sessionToken) return
  
  completingTask.value = true
  focusError.value = ''
  
  try {
    // Mark task complete on backend
    await tasksApi.markTaskComplete(appStore.sessionToken, focusTask.value._id)
    
    // Backend automatically sets next scheduled task as focus via sync
    // Refresh tasks to update status
    await tasksStore.fetchTasks(appStore.sessionToken)
    
    // Show completion state
    taskCompleted.value = true
    
    // Check if there's a next task
    await fetchCurrentFocusTask()
    hasNextTask.value = !!focusTask.value
    
    // Refresh scheduled tasks (completed task should be removed from schedule)
    await loadScheduledTasks()
    
  } catch (err) {
    focusError.value = err.message || 'Failed to mark task complete'
  } finally {
    completingTask.value = false
  }
}

const loadNextTask = async () => {
  taskCompleted.value = false
  focusError.value = ''
  await fetchCurrentFocusTask()
}

const handleReplan = async () => {
  if (!appStore.sessionToken) {
    return
  }
  
  replanning.value = true
  error.value = ''
  
  try {
    // Fetch tasks if not loaded
    if (!tasksStore.tasks.length) {
      await tasksStore.fetchTasks(appStore.sessionToken)
    }
    
    // Fetch fresh busy slots from Schedule database
    // This ensures we have the latest blocked times from Schedule concept
    await loadBusySlots()
    
    const todoTasks = tasksStore.todoTasks
    
    if (todoTasks.length === 0) {
      error.value = 'No tasks to replan. Please add some tasks first.'
      replanning.value = false
      return
    }
    
    const formattedTasks = todoTasks.map(task => ({
      id: task._id,
      duration: task.estimatedDuration || 60 // Duration in minutes (backend expects minutes)
    }))
    
    // Format busy slots from Schedule database
    let formattedBusySlots = busySlots.value.map(slot => ({
      start: slot.startTime || slot.start,
      end: slot.endTime || slot.end
    })).filter(slot => {
      // Only include valid slots
      const start = new Date(slot.start)
      const end = new Date(slot.end)
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start
    })
    
    // Use today's date for planning (start of day in local timezone)
    let planningDate = new Date()
    planningDate.setHours(0, 0, 0, 0)

      // Add working day blocked slots for today only
      // (Backend now plans only for today, not tomorrow)
      const workingDayBlockedSlots = getWorkingDayBlockedSlots(planningDate)
      formattedBusySlots = [...formattedBusySlots, ...workingDayBlockedSlots]
      console.log('Working day settings:', {
        start: workingDayStart.value,
        end: workingDayEnd.value
      })
      console.log('Including', workingDayBlockedSlots.length, 'working day blocked slots for today:', workingDayBlockedSlots)

      // Replan: Clear all scheduled tasks, then plan day fresh (same as Plan Day)
    // Use planner store to replan (it will clear day then plan)
    const response = await plannerStore.replan(
      appStore.sessionToken,
      formattedTasks,
      formattedBusySlots,
      planningDate  // Pass planning date for timezone correction
    )
    
    // Refresh busy slots to show updated schedule
    await loadBusySlots()
    
    // Load scheduled tasks to display on timeline
    await loadScheduledTasks()
    
    // Keep hasPlanned as true (button will still show "Replan")
    hasPlanned.value = true
  } catch (err) {
    error.value = err.message || 'Failed to replan day'
  } finally {
    replanning.value = false
  }
}

const getScheduledTaskTitle = (scheduledTask) => {
  // scheduledTask.task is the task ID, look it up in tasks store
  const task = tasksStore.tasks.find(t => t._id === scheduledTask.task)
  return task?.title || task?.description || 'Task'
}

// Check if a scheduled task is completed
const isTaskCompleted = (scheduledTask) => {
  // scheduledTask.task is the task ID, look it up in tasks store
  const task = tasksStore.tasks.find(t => t._id === scheduledTask.task)
  return task?.status === 'DONE'
}

// Check if busy slot time should be hidden (overlapping AND limited space)
const shouldHideBusySlotTime = (slot) => {
  // Check if slot is overlapping with other items
  const start = new Date(slot.startTime)
  const end = new Date(slot.endTime)
  const startHour = start.getHours() + start.getMinutes() / 60
  const endHour = end.getHours() + end.getMinutes() / 60
  const durationHours = endHour - startHour
  
  // Calculate height percentage (24 hours = 100%)
  const heightPercent = (durationHours / 24) * 100
  
  // Get all items for overlap detection
  const allItems = [
    ...sleepingTimeBlocks.value.map(s => ({ type: 'slot', data: s })),
    ...busySlots.value.map(s => ({ type: 'slot', data: s })),
    ...scheduledTasks.value.map(t => ({ type: 'task', data: t }))
  ]
  
  const getStartTime = (item) => item.type === 'slot' ? item.data.startTime : item.data.plannedStart
  const getEndTime = (item) => item.type === 'slot' ? item.data.endTime : item.data.plannedEnd
  const getItemId = (item) => item.data._id
  
  const currentItem = { type: 'slot', data: slot }
  const currentStart = new Date(getStartTime(currentItem)).getTime()
  const currentEnd = new Date(getEndTime(currentItem)).getTime()
  
  // Check if there are overlapping items
  let hasOverlap = false
  for (const otherItem of allItems) {
    if (getItemId(otherItem) === getItemId(currentItem)) continue
    
    const otherStart = new Date(getStartTime(otherItem)).getTime()
    const otherEnd = new Date(getEndTime(otherItem)).getTime()
    
    if (timeRangesOverlap(currentStart, currentEnd, otherStart, otherEnd)) {
      hasOverlap = true
      break
    }
  }
  
  // Hide time if: overlapping AND limited space (height < 4% = ~1 hour)
  return hasOverlap && heightPercent < 4
}

const handleTaskClick = (scheduledTask) => {
  // Find the actual task object
  const task = tasksStore.tasks.find(t => t._id === scheduledTask.task)
  if (task) {
    // Open task view modal (similar to TaskView)
    // For now, just log it
    console.log('Scheduled task clicked:', task)
  }
}

const handleNavigateToTasks = () => {
  appStore.setAppState('tasks')
}

const handleNavigateToPlan = () => {
  appStore.setAppState('plan')
}

const handleNavigateToFocus = async () => {
  if (!appStore.sessionToken) {
    return
  }

  // If there's already a focus task, just navigate to focus
  if (appStore.currentFocusTask) {
    appStore.setAppState('focus')
    return
  }

  // Otherwise, plan the day first
  planning.value = true
  error.value = ''

  try {
    const todoTasks = tasksStore.todoTasks
    const formattedTasks = todoTasks.map(task => ({
      id: task._id,
      duration: task.estimatedDuration || 60 // Duration in minutes (backend expects minutes)
    }))

    const formattedBusySlots = busySlots.value.map(slot => ({
      start: slot.startTime,
      end: slot.endTime
    }))

    // Use planner store to plan day (it will calculate schedule locally)
    const response = await plannerStore.planDay(
      appStore.sessionToken,
      formattedTasks,
      formattedBusySlots
    )

    if (response?.firstTask) {
      const firstTaskObject = tasksStore.tasks.find(task => task._id === response.firstTask)
      if (firstTaskObject) {
        appStore.setCurrentFocusTask(firstTaskObject)
        appStore.setAppState('focus')
      }
    } else {
      error.value = 'No tasks available to focus on'
    }
  } catch (err) {
    error.value = err.message || 'Failed to plan day'
  } finally {
    planning.value = false
  }
}

// Watch for user changes
watch(() => appStore.sessionToken, (newUserId) => {
  if (newUserId) {
    loadWorkingDaySettings()
    loadBusySlots()
    loadScheduledTasks()
  } else {
    busySlots.value = []
    // scheduledTasks is computed from planner store, so it will be empty when user logs out
  }
})

// Function to scroll to 9 AM
const scrollTo9AM = () => {
  if (timelineRef.value && timelineRef.value.parentElement) {
    const scrollContainer = timelineRef.value.parentElement
    if (scrollContainer && scrollContainer.classList.contains('timeline-scroll-container')) {
      const scrollToPosition = 9 * 40 // 9 AM = 360px from top
      scrollContainer.scrollTop = scrollToPosition
      return true
    }
  }
  return false
}

// Watch for when loading completes to scroll to 9 AM
watch(loading, (newLoading) => {
  if (!newLoading) {
    // Loading finished, scroll to 9 AM
    nextTick(() => {
      if (!scrollTo9AM()) {
        setTimeout(() => {
          if (!scrollTo9AM()) {
            requestAnimationFrame(() => {
              scrollTo9AM()
            })
          }
        }, 200)
      }
    })
  }
})

// Load on mount
onMounted(async () => {
  if (appStore.sessionToken) {
    await loadWorkingDaySettings() // Load from backend
    await loadBusySlots()
    await cleanupOldBlocks() // Auto-delete old blocked times from previous days
    loadScheduledTasks()
  }
  
  // Update current time every minute for "now" indicator
  // Sync updates to happen exactly at the start of each minute (:00 seconds)
  const updateCurrentTime = () => {
    currentTime.value = new Date()
  }
  
  // Calculate milliseconds until next minute boundary
  const now = new Date()
  const secondsUntilNextMinute = 60 - now.getSeconds()
  const msUntilNextMinute = secondsUntilNextMinute * 1000 - now.getMilliseconds()
  
  let timeInterval
  
  // Wait until the next minute, then update every 60 seconds
  const initialTimeout = setTimeout(() => {
    updateCurrentTime() // Update at the minute boundary
    timeInterval = setInterval(updateCurrentTime, 60000) // Then every minute
  }, msUntilNextMinute)
  
  // Clean up interval when component unmounts
  onUnmounted(() => {
    clearTimeout(initialTimeout)
    if (timeInterval) clearInterval(timeInterval)
  })
  
  // Also try to scroll immediately in case timeline is already rendered
  nextTick(() => {
    if (!scrollTo9AM()) {
      setTimeout(() => {
        if (!scrollTo9AM()) {
          requestAnimationFrame(() => {
            scrollTo9AM()
          })
        }
      }, 150)
    }
  })
})
</script>

<style scoped>
.plan-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.plan-container {
  max-width: 920px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.main-nav {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nav-item {
  padding: 10px 20px;
  background: transparent;
  color: #666;
  border: none;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  color: #333;
  background: rgba(0, 0, 0, 0.05);
}

.nav-item.active {
  color: #667eea;
  border-bottom-color: #667eea;
  font-weight: 600;
}

.user-menu-wrapper {
  position: relative;
}

.user-menu-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  color: #666;
  border: none;
  border-bottom: 1px solid #e0e0e0;
  border-radius: 0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-menu-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.user-menu-btn svg:first-of-type {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.user-menu-btn .dropdown-arrow {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  transition: transform 0.2s ease;
}

.user-menu-btn:hover .dropdown-arrow,
.user-menu-wrapper:hover .dropdown-arrow {
  transform: rotate(180deg);
}

.user-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  overflow: hidden;
}

.user-menu-info {
  padding: 12px 16px;
}

.user-menu-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.user-menu-email {
  font-size: 12px;
  color: #666;
}

.user-menu-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 8px 0;
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.user-menu-item:hover {
  background: #f5f5f5;
}

.user-menu-item.logout-item {
  color: #d32f2f;
}

.user-menu-item.logout-item:hover {
  background: #ffebee;
  color: #c62828;
}

.user-menu-item svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.plan-content-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
}

.timeline-wrapper,
.action-buttons-section {
  padding-top: 0;
}

.timeline-wrapper {
  margin-left: 100px; /* Add more space to move timeline further right */
  flex: 1.2; /* Allow schedule to take more space */
  min-width: 0;
  max-width: 70%; /* Allow schedule to be wider */
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 600px; /* Limit overall height */
}

.action-buttons-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
  min-width: 160px;
  margin-left: 50px; /* Remove left margin since we're using space-between */
  margin-right: 50px;
  margin-top: -12px;
  align-items: flex-start;
  position: relative;
  height: 543px; /* Match actual schedule height: header (19px + ~20px + 12px) + scroll container (480px) = ~531px */
  justify-content: space-between;
}

.plan-day-header {
  margin-top: 31px; /* Match timeline-header margin-top to align with date + block time, plus 10px extra */
  margin-bottom: 12px; /* Match timeline-header margin-bottom */
  width: 100%;
}

.plan-day-container {
  align-self: stretch;
  margin-top: 16px;
  margin-bottom: 16px;
}

.working-day-wrapper {
  align-self: stretch;
  margin-top: 0; /* Align with schedule start */
  padding-top: 0;
  flex: 1; /* Take available space */
}

.clear-day-container {
  align-self: stretch;
  margin-top: auto; /* Push to bottom, aligned with schedule end */
}

.working-day-settings {
  background: rgba(102, 126, 234, 0.05);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 8px;
  margin-top: -12px;
  align-self: stretch;
}

.settings-title {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
  margin: 0 0 12px 0;
  text-align: center;
}

.working-day-inputs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.working-day-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.working-day-input-group label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

/* Minimal styling for working day time inputs */
.working-day-settings :deep(.working-day-time-input .v-field__input) {
  padding: 2px 4px !important;
  min-height: 20px !important;
  font-size: 13px !important;
  cursor: pointer !important;
}

.working-day-settings :deep(.working-day-time-input .v-field) {
  padding-bottom: 0 !important;
  padding-top: 0 !important;
}

.working-day-settings :deep(.working-day-time-input .v-field__outline) {
  display: none !important;
}

.working-day-settings :deep(.working-day-time-input .v-field__overlay) {
  display: none !important;
}

.working-day-settings :deep(.working-day-time-input .v-input__details) {
  display: none !important;
}

.working-day-settings :deep(.working-day-time-input) {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0 !important;
  margin: 0 !important;
}

.working-day-settings :deep(.working-day-time-input:hover) {
  border-color: #667eea;
  background-color: #f8f9ff;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.working-day-settings :deep(.working-day-time-input .v-field__wrapper) {
  padding: 0 !important;
  margin: 0 !important;
  cursor: pointer;
  min-height: auto !important;
}

.working-day-settings :deep(.working-day-time-input .v-input__control) {
  min-height: auto !important;
  padding: 0 !important;
  margin: 0 !important;
}

.working-day-settings :deep(.working-day-time-input .v-field__append-inner) {
  padding: 0 4px 0 4px !important;
  align-items: center;
}

.working-day-settings :deep(.working-day-time-input .v-field__append-inner svg) {
  width: 14px;
  height: 14px;
  opacity: 0.6;
}

/* Style time picker to match edit task page */
.working-day-settings :deep(.v-time-picker) {
  width: auto !important;
  min-width: 224px !important;
  max-width: 256px !important;
  transform: scale(0.8);
  transform-origin: top center;
}

.working-day-settings :deep(.v-time-picker__header) {
  padding: 8px 12px !important;
  font-size: 14px !important;
}

.working-day-settings :deep(.v-time-picker__title) {
  font-size: 18px !important;
  font-weight: 500 !important;
}

.working-day-settings :deep(.v-time-picker__body) {
  padding: 8px !important;
}

.working-day-settings :deep(.v-time-picker__clock) {
  width: 160px !important;
  height: 160px !important;
  margin: 0 auto !important;
}

.working-day-settings :deep(.v-time-picker__clock .v-time-picker__clock__item) {
  font-size: 10px !important;
  width: 22px !important;
  height: 22px !important;
}

.working-day-settings :deep(.v-time-picker__clock .v-time-picker__clock__item--active) {
  font-size: 13px !important;
  font-weight: 600 !important;
}

.working-day-settings :deep(.v-menu__content) {
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.time-input {
  padding: 8px 12px;
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  background: white;
  transition: all 0.2s ease;
}

.time-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

  .add-slot-btn {
    /* Uses light-purple-btn class from style.css */
    flex-shrink: 0;
  }

/* .add-slot-btn now uses shared .gray-btn class from style.css */

.plan-btn,
.replan-btn,
.focus-btn {
  width: 100%;
}

/* .plan-btn and .replan-btn now use shared .light-purple-btn class from style.css */

.clear-day-btn {
  width: 100%;
  margin-bottom: -28px;
}

/* .clear-day-btn now uses shared .clear-btn class from style.css */

.error-message {
  padding: 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  font-size: 14px;
  text-align: center;
  margin-bottom: 24px;
}

.loading-message {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 60px 20px;
  font-size: 18px;
}

  .timeline-container {
    margin-top: 0;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .timeline-header {
    margin-bottom: 12px;
    margin-top: 19px;
    padding-left: 0;
    margin-left: -40px; /* Match timeline-wrapper margin-left to align with schedule box */
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

.timeline-scroll-container {
  height: 480px; /* Fixed height showing 12 hours (9 AM to 9 PM) */
  overflow-y: scroll;
  overflow-x: visible;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  position: relative;
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 80px; /* Add padding to make room for hour labels */
  margin-left: -80px; /* Offset the padding to keep timeline aligned */
  /* Ensure scrollbar is always visible */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: #888 #f0f0f0; /* Firefox - darker thumb */
}

/* Webkit scrollbar styling (Chrome, Safari, Edge) */
.timeline-scroll-container::-webkit-scrollbar {
  width: 12px;
}

.timeline-scroll-container::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.timeline-scroll-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.timeline-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #666;
}

.timeline-title {
  margin: 0;
  color: #333;
  font-size: 22px;
  font-weight: 600;
}

.timeline {
  position: relative;
  min-height: 960px; /* 24 hours * 40px = 960px - full height of all hours */
  width: 100%;
  border-left: 2px solid #e0e0e0;
  padding-left: 20px;
  margin-left: 0;
}



.timeline::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.timeline::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border-radius: 4px;
}

.timeline::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}

.timeline-hour {
  position: relative;
  height: 40px; /* Smaller intervals to see more of the day at once */
  margin-bottom: 0;
}

.hour-label {
  position: absolute;
  left: -108px;
  top: -6px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
  width: 70px;
  text-align: right;
}

.hour-line {
  position: absolute;
  left: -28px;
  top: 0;
  width: 8px;
  height: 1px;
  background: #e0e0e0;
}

/* Continuous dotted horizontal line extending across the timeline */
.timeline-hour::after {
  content: '';
  position: absolute;
  left: -20px; /* Start from the timeline border (offset the padding-left) */
  top: 0;
  right: 0;
  width: calc(100% + 20px); /* Extend to cover the padding area */
  height: 1px;
  background: repeating-linear-gradient(
    to right,
    #ccc 0px,
    #ccc 3px,
    transparent 3px,
    transparent 6px
  );
  opacity: 0.6;
  z-index: 1;
}

.timeline-slot {
  border-radius: 8px;
  padding: 4px 12px 8px 12px; /* Reduced top padding to 4px for half-hour tasks */
  min-height: 20px; /* Minimum height of half an hour (40px per hour / 2) */
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 10;
  container-type: inline-size;
  container-name: slot;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 2px;
}

.timeline-slot:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.busy-slot {
  background: var(--gray-btn-bg, #e8e8e8);
  border-left: 4px solid var(--gray-btn-border, #9e9e9e);
  border-top: 1px solid rgba(158, 158, 158, 0.3);
  border-bottom: 1px solid rgba(158, 158, 158, 0.3);
  border-right: 1px solid rgba(158, 158, 158, 0.2);
  color: var(--gray-btn-color, #757575);
  opacity: var(--gray-btn-opacity, 0.7);
  cursor: default;
  z-index: 10; /* Above sleeping blocks */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.busy-slot:hover {
  transform: none;
  box-shadow: none;
}

.sleeping-block {
  cursor: default;
  pointer-events: none;
  border-left: none;
  z-index: 5 !important; /* Lower z-index so sleeping blocks appear behind other blocks */
  width: 100% !important; /* Full width to appear as background */
  left: 0 !important; /* Align to left edge */
  right: 0 !important; /* Extend to right edge */
  opacity: 0.4 !important; /* More transparent for subtle background effect */
  margin-bottom: 2px; /* Match other blocks */
}

.sleeping-block .slot-content {
  display: none;
}

.task-slot {
  background: rgba(102, 126, 234, 0.15);
  border-left: 4px solid #667eea;
  border-top: 1px solid rgba(102, 126, 234, 0.2);
  border-bottom: 1px solid rgba(102, 126, 234, 0.2);
  border-right: 1px solid rgba(102, 126, 234, 0.15);
  color: #667eea;
  z-index: 10; /* Above sleeping blocks */
}

.task-slot.task-completed {
  background: rgba(72, 187, 120, 0.15);
  border-left: 4px solid #48bb78;
  border-top: 1px solid rgba(72, 187, 120, 0.2);
  border-bottom: 1px solid rgba(72, 187, 120, 0.2);
  border-right: 1px solid rgba(72, 187, 120, 0.15);
  color: #48bb78;
}

/* Current Time Indicator */
.current-time-indicator {
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
  pointer-events: none;
}

.time-line {
  width: 100%;
  height: 2px;
  background: #757575;
  position: relative;
}

.time-label {
  position: absolute;
  left: 8px;
  top: -10px;
  background: #757575;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.slot-content {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.slot-description {
  font-size: 14px;
  font-weight: 600; /* Made bold */
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.slot-time {
  font-size: 12px;
  font-weight: 400; /* Changed from 600 to 400 (normal weight) */
  opacity: 0.8;
  flex-shrink: 0;
  white-space: nowrap;
}

/* Hide time when slot is too narrow */
@container slot (max-width: 120px) {
  .slot-time {
    display: none;
  }
}

/* Hide time for overlapping busy slots with limited space */
.timeline-slot.busy-slot.hide-time .slot-time {
  display: none !important;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 40px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-title {
  margin: 0 0 30px 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
  text-align: center;
}

.slot-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-group.date-time-group {
  flex-direction: row;
  align-items: flex-end;
  gap: 16px;
}

.date-time-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-input {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

/* Make v-text-field inputs same height as regular inputs */
.slot-form :deep(.v-text-field) {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.slot-form :deep(.v-input) {
  padding-top: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.slot-form :deep(.v-field) {
  min-height: auto !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.slot-form :deep(.v-field__input) {
  min-height: auto !important;
  padding: 12px 16px !important;
}

.slot-form :deep(.v-field__prepend-inner),
.slot-form :deep(.v-field__append-inner) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

/* Time picker styles (same as TaskView) */
.time-picker-dropdowns {
  display: flex;
  gap: 8px;
  align-items: center;
}

.time-input-wrapper {
  flex: 1;
  position: relative;
}

.time-input-editable {
  width: 100%;
}

.ampm-input-wrapper {
  flex: 0 0 80px;
  min-width: 80px;
  position: relative;
}

.ampm-button {
  width: 100%;
  text-align: center;
  font-weight: 500;
  color: #333;
  cursor: pointer;
}

.ampm-button:hover {
  border-color: #ccc;
  background: #f9f9f9;
}

.time-dropdown-menu,
.ampm-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.time-dropdown-item,
.ampm-dropdown-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 14px;
  color: #666;
}

.time-dropdown-item:hover,
.ampm-dropdown-item:hover {
  background: #f5f5f5;
}

.time-dropdown-item.active,
.ampm-dropdown-item.active {
  background: #f0f4ff;
  color: #667eea;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  justify-content: flex-end;
}

.modal-actions button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* .save-btn now uses shared .purple-btn class from style.css */

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.delete-btn {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.delete-btn:hover:not(:disabled) {
  background: #ffcdd2;
  border-color: #e57373;
  color: #b71c1c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.2);
}

.modal-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Focus Modal Specific Styles */
.focus-task-content,
.focus-completion-content,
.focus-empty-content {
  padding: 20px 0;
}

.focus-task-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
  text-align: center;
}

.focus-task-meta {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.focus-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
}

.focus-meta-item svg {
  color: #667eea;
}

.focus-task-description {
  color: #666;
  font-size: 16px;
  line-height: 1.6;
  margin: 20px 0;
  text-align: center;
  white-space: pre-wrap;
}

.completion-message {
  text-align: center;
  padding: 40px 20px;
}

.completion-icon {
  color: #48bb78;
  margin: 0 auto 20px;
  display: block;
}

.completion-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
}

.completion-text {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.focus-empty-content {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  color: #cbd5e0;
  margin: 0 auto 20px;
  display: block;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
}

.empty-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 20px 0;
}

/* Style time picker to match date picker */
.slot-form :deep(.v-time-picker) {
  width: auto !important;
  min-width: 224px !important;
  max-width: 256px !important;
  transform: scale(0.8);
  transform-origin: top center;
}

.slot-form :deep(.v-time-picker__header) {
  padding: 8px 12px !important;
  font-size: 14px !important;
}

.slot-form :deep(.v-time-picker__title) {
  font-size: 18px !important;
  font-weight: 500 !important;
}

.slot-form :deep(.v-time-picker__body) {
  padding: 8px !important;
}

.slot-form :deep(.v-time-picker__clock) {
  width: 160px !important;
  height: 160px !important;
  margin: 0 auto !important;
}

.slot-form :deep(.v-time-picker__clock .v-time-picker__clock__item) {
  font-size: 10px !important;
  width: 22px !important;
  height: 22px !important;
}

.slot-form :deep(.v-time-picker__clock .v-time-picker__clock__item--active) {
  font-size: 13px !important;
  font-weight: 600 !important;
}

/* Match date picker container styling */
.slot-form :deep(.v-menu__content) {
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* Ensure date picker has shadow - target the menu content directly */
.slot-form :deep(.v-date-picker) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* Ensure date picker navigation is visible and functional */
.slot-form :deep(.v-date-picker-header) {
  display: flex !important;
  visibility: visible !important;
  padding: 8px 12px !important;
  align-items: center !important;
  justify-content: space-between !important;
}

.slot-form :deep(.v-date-picker-header *),
.slot-form :deep(.v-date-picker-header button),
.slot-form :deep(.v-date-picker-header .v-btn),
.slot-form :deep(.v-date-picker-header .v-icon) {
  display: flex !important;
  visibility: visible !important;
  pointer-events: auto !important;
  opacity: 1 !important;
}

.slot-form :deep(.v-date-picker-header__append),
.slot-form :deep(.v-date-picker-header__prepend) {
  display: flex !important;
  visibility: visible !important;
  pointer-events: auto !important;
  cursor: pointer !important;
  opacity: 1 !important;
  min-width: 40px !important;
  min-height: 40px !important;
  align-items: center !important;
  justify-content: center !important;
}

.slot-form :deep(.v-date-picker-header__append button),
.slot-form :deep(.v-date-picker-header__prepend button),
.slot-form :deep(.v-date-picker-header__append .v-btn),
.slot-form :deep(.v-date-picker-header__prepend .v-btn) {
  display: flex !important;
  visibility: visible !important;
  pointer-events: auto !important;
  cursor: pointer !important;
  opacity: 1 !important;
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  min-height: 40px !important;
  align-items: center !important;
  justify-content: center !important;
}

.slot-form :deep(.v-date-picker-header__append),
.slot-form :deep(.v-date-picker-header__prepend) {
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)) !important;
}

.slot-form :deep(.v-date-picker-header__append .v-icon),
.slot-form :deep(.v-date-picker-header__prepend .v-icon),
.slot-form :deep(.v-date-picker-header__append i),
.slot-form :deep(.v-date-picker-header__prepend i),
.slot-form :deep(.v-date-picker-header__append button),
.slot-form :deep(.v-date-picker-header__prepend button),
.slot-form :deep(.v-date-picker-header__append .v-btn),
.slot-form :deep(.v-date-picker-header__prepend .v-btn),
.slot-form :deep(.v-date-picker-header__append),
.slot-form :deep(.v-date-picker-header__prepend) {
  display: inline-flex !important;
  visibility: visible !important;
  pointer-events: auto !important;
  cursor: pointer !important;
  opacity: 1 !important;
  font-size: 24px !important;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)) !important;
  background: transparent !important;
}

.slot-form :deep(.v-date-picker-header__title) {
  cursor: pointer !important;
  pointer-events: auto !important;
  display: flex !important;
  visibility: visible !important;
  flex: 1 !important;
  justify-content: center !important;
  align-items: center !important;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)) !important;
}

.slot-form :deep(.v-date-picker-month),
.slot-form :deep(.v-date-picker-year) {
  pointer-events: auto !important;
  display: block !important;
  visibility: visible !important;
}

/* Ensure all date picker elements are visible */
.slot-form :deep(.v-date-picker) {
  min-height: 240px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  border-radius: 8px !important;
  background: white !important;
  transform: scale(0.8);
  transform-origin: top center;
}

.slot-form .date-picker-container {
  position: relative;
}

/* Ensure date picker menu has shadow */
.slot-form .date-picker-container ~ .v-menu__content,
.slot-form .date-picker-container :deep(.v-menu__content),
.slot-form :deep(.v-menu[data-v-menu__content]) .v-menu__content {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  border-radius: 8px !important;
}

.slot-form :deep(.v-date-picker-header__content) {
  display: flex !important;
  visibility: visible !important;
}

/* Time picker wrapper with editable inputs */
.time-picker-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.time-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.time-input {
  width: 60px;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  text-align: center;
  font-weight: 500;
}

.time-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.time-separator {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* Force all elements in date picker to be visible */
.slot-form :deep(.v-date-picker-header),
.slot-form :deep(.v-date-picker-header__append),
.slot-form :deep(.v-date-picker-header__prepend),
.slot-form :deep(.v-date-picker-header__title),
.slot-form :deep(.v-date-picker-header__content) {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

.slot-form :deep(.v-date-picker-header) > * {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* Hide Vuetify's default month/year views */
.slot-form :deep(.v-date-picker-month),
.slot-form :deep(.v-date-picker-year) {
  display: none !important;
  visibility: hidden !important;
}

/* Date picker container */
.slot-form .date-picker-container {
  position: relative;
}

/* Custom Month/Year Picker */
.slot-form .custom-month-year-picker {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  border-radius: 8px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.slot-form .month-year-picker-header {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.slot-form .month-year-picker-header .close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  padding: 4px 8px;
  line-height: 1;
}

.slot-form .month-year-picker-header .close-btn:hover {
  opacity: 0.7;
}

.slot-form .month-year-columns {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.slot-form .month-column,
.slot-form .year-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.slot-form .year-column {
  border-right: none;
}

.slot-form .scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}

.slot-form .scroll-container::-webkit-scrollbar {
  width: 6px;
}

.slot-form .scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.slot-form .scroll-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.slot-form .month-year-item {
  padding: 12px 16px;
  cursor: pointer;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  transition: background-color 0.2s;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slot-form .month-year-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.slot-form .month-year-item.active {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

</style>

