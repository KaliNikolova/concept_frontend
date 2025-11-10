<template>
  <div class="task-view">
    <div class="task-container">
      <NavMenu />

      <!-- Add Task Button -->
      <div class="action-buttons-section">
        <button @click="openAddModal" class="light-purple-btn add-task-btn">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                 <line x1="12" y1="5" x2="12" y2="19"></line>
                 <line x1="5" y1="12" x2="19" y2="12"></line>
               </svg>
               New Task
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="tasksStore.error" class="error-message">
        {{ tasksStore.error }}
      </div>

      <!-- Loading State -->
      <div v-if="tasksStore.loading" class="loading-message">
        Loading tasks...
      </div>

      <!-- Tasks List -->
      <div v-else-if="tasksStore.tasks.length === 0" class="empty-state">
        <p>No tasks yet. Add one above to get started!</p>
      </div>

      <div v-else>
        <!-- TODO Tasks Section -->
        <div v-if="tasksStore.todoTasks.length > 0" class="tasks-section todo-section">
          <div class="tasks-section-header todo-header">
            <h2 class="tasks-section-title">To Do</h2>
          </div>
          <ul class="tasks-list">
            <li 
              v-for="(task, index) in tasksStore.todoTasks" 
              :key="task._id" 
              class="task-item"
              :class="{ 'dragging': draggedTaskId === task._id, 'drag-over': dragOverIndex === index }"
              :style="{ '--priority-color': getPriorityColor(index, tasksStore.todoTasks.length) }"
              draggable="true"
              @dragstart="handleDragStart(task, index, $event)"
              @dragenter.prevent="handleDragEnter(index, $event)"
              @dragover.prevent="handleDragOver(index, $event)"
              @dragleave="handleDragLeave($event)"
              @drop="handleDrop(index, $event)"
              @dragend="handleDragEnd"
              @click="handleTaskClick(task, $event)"
            >
              <div class="task-drag-handle" @mousedown.stop>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="12" r="1"></circle>
                  <circle cx="9" cy="5" r="1"></circle>
                  <circle cx="9" cy="19" r="1"></circle>
                  <circle cx="15" cy="12" r="1"></circle>
                  <circle cx="15" cy="5" r="1"></circle>
                  <circle cx="15" cy="19" r="1"></circle>
                </svg>
              </div>
              <div class="task-content">
                <div class="task-main-row">
                  <span class="task-title">{{ task.title || task.description || 'Untitled Task' }}</span>
                  <div class="task-right-info">
                    <div class="task-meta">
                      <span v-if="task.dueDate" class="task-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {{ formatTaskDueDate(task.dueDate) }}
          </span>
                      <span v-if="task.estimatedDuration" class="task-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {{ formatTaskDuration(task.estimatedDuration) }}
                      </span>
                    </div>
                    <span class="task-status" :class="getStatusClass(task.status || 'TODO')">
                      {{ formatStatus(task.status || 'TODO') }}
                    </span>
                  </div>
                </div>
                <span v-if="task.description && task.title" class="task-description">{{ task.description }}</span>
              </div>
        </li>
      </ul>
        </div>

        <!-- Archived Tasks Section -->
        <div v-if="tasksStore.completedTasks.length > 0" class="tasks-section">
          <div class="tasks-section-header" @click="toggleArchived">
            <h2 class="tasks-section-title">Archived</h2>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
              :class="['toggle-icon', { 'expanded': showArchived }]"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <ul v-show="showArchived" class="tasks-list">
            <li 
              v-for="task in tasksStore.completedTasks" 
              :key="task._id" 
              class="task-item"
              @click="handleTaskClick(task, $event)"
            >
              <div class="task-content">
                <div class="task-main-row">
                  <span class="task-title">{{ task.title || task.description || 'Untitled Task' }}</span>
                  <div class="task-right-info">
                    <div class="task-meta">
                      <span v-if="task.dueDate" class="task-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {{ formatTaskDueDate(task.dueDate) }}
                      </span>
                      <span v-if="task.estimatedDuration" class="task-meta-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {{ formatTaskDuration(task.estimatedDuration) }}
                      </span>
                    </div>
                    <span class="task-status" :class="getStatusClass(task.status || 'TODO')">
                      {{ formatStatus(task.status || 'TODO') }}
                    </span>
                  </div>
                </div>
                <span v-if="task.description && task.title" class="task-description">{{ task.description }}</span>
              </div>
            </li>
          </ul>
          <div v-show="showArchived" class="clear-archived-section">
            <button @click="handleClearArchived" class="clear-btn clear-archived-btn" :disabled="clearingArchived">
              {{ clearingArchived ? 'Clearing...' : 'Clear Archive' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Task Modal (used for view, add, and edit) -->
      <div v-if="taskModalMode" class="modal-overlay" @click="closeTaskModal">
        <div class="modal-content" @click.stop>
          <h2 v-if="taskModalMode !== 'view'" class="modal-title">{{ taskModalMode === 'add' ? 'Add New Task' : 'Edit Task' }}</h2>
          
          <!-- View Mode (read-only) -->
          <div v-if="taskModalMode === 'view'" class="task-view-mode">
            <div class="view-task-content">
              <h2 class="view-task-title">{{ currentTask?.title || currentTask?.description || 'Untitled Task' }}</h2>
              
              <div class="view-task-meta">
                <span v-if="currentTask?.dueDate" class="view-task-meta-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {{ formatTaskDueDate(currentTask.dueDate) }}
                </span>
                <span v-if="currentTask?.estimatedDuration" class="view-task-meta-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {{ formatTaskDuration(currentTask.estimatedDuration) }}
                </span>
                <span class="view-task-status" :class="getStatusClass(currentTask?.status || 'TODO')">
                  {{ formatStatus(currentTask?.status || 'TODO') }}
                </span>
              </div>
              
              <p v-if="currentTask?.description && currentTask?.title" class="view-task-description">{{ currentTask.description }}</p>
            </div>
            
            <div v-if="taskError" class="error-message">
              {{ taskError }}
            </div>
            
            <div class="modal-actions">
              <button type="button" @click="closeTaskModal" class="cancel-btn">
                Close
              </button>
              <button v-if="currentTask?.status !== 'DONE'" type="button" @click="switchToEditMode" class="purple-btn">
                Edit
              </button>
            </div>
          </div>
          
                      <!-- Add/Edit Mode (form) -->
            <form v-else @submit.prevent="handleTaskSubmit" @keydown.enter="handleFormEnter" class="edit-task-form">
            <div class="form-group form-group-title-status">
              <label :for="`task-title-${taskModalMode}`">Title</label>
              <div class="title-status-row">
                <input
                  :id="`task-title-${taskModalMode}`"
                  v-model="taskForm.title"
                  type="text"
                  class="form-input"
                  placeholder="Enter task title..."
                  required
                />
                <button
                  type="button"
                  :id="`task-status-${taskModalMode}`"
                  :class="['status-badge', taskForm.status === 'DONE' ? 'done' : 'todo', { active: true }]"
                  @click="taskForm.status = taskForm.status === 'TODO' ? 'DONE' : 'TODO'"
                >
                  {{ taskForm.status === 'DONE' ? 'DONE' : 'TODO' }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label :for="`task-description-${taskModalMode}`">Description</label>
              <textarea
                :id="`task-description-${taskModalMode}`"
                v-model="taskForm.description"
                class="form-input"
                placeholder="Enter task description (optional)..."
                rows="3"
              ></textarea>
            </div>

            <div class="form-group date-time-group">
              <div class="date-time-item">
                <label :for="`task-due-date-${taskModalMode}`">Due Date</label>
                <v-menu v-model="dateMenuOpen" :close-on-content-click="false">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                  :id="`task-due-date-${taskModalMode}`"
                      :model-value="formatDateForDisplay(taskForm.dueDate)"
                      v-bind="props"
                      :required="true"
                  class="form-input"
                      placeholder="Select date"
                      readonly
                    >
                      <template v-slot:append-inner>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </template>
                    </v-text-field>
                  </template>
                  <div class="date-picker-container">
                    <v-date-picker
                      v-model="taskForm.dueDate"
                      show-adjacent-months
                      prev-icon="mdi-chevron-left"
                      next-icon="mdi-chevron-right"
                      @click:month="openMonthYearPicker"
                      @click:year="openMonthYearPicker"
                      @update:model-value="dateMenuOpen = false"
                      @keydown.enter="handleDatePickerEnter"
                    ></v-date-picker>
                    <!-- Custom Month/Year Picker -->
                    <div v-if="showMonthYearPicker" class="custom-month-year-picker">
                      <div class="month-year-picker-header">
                        <button @click="showMonthYearPicker = false" class="close-btn">×</button>
              </div>
                      <div class="month-year-columns">
                        <div class="month-column">
                          <div class="scroll-container" ref="monthScrollRef">
                            <div
                              v-for="(month, index) in months"
                              :key="index"
                              :class="['month-year-item', { active: isCurrentMonth(index) }]"
                              @click="selectMonth(index)"
                            >
                              {{ month }}
                      </div>
                    </div>
                  </div>
                        <div class="year-column">
                          <div class="scroll-container" ref="yearScrollRef">
                            <div
                              v-for="year in years"
                              :key="year"
                              :class="['month-year-item', { active: isCurrentYear(year) }]"
                              @click="selectYear(year)"
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
                <label :for="`task-due-time-${taskModalMode}`">Due Time</label>
                <v-menu v-model="timeMenuOpen" :close-on-content-click="false" offset-y min-width="auto" content-class="time-picker-menu">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      :id="`task-due-time-${taskModalMode}`"
                      :model-value="formatTimeForDisplay(taskForm.dueTime)"
                      v-bind="props"
                      :required="true"
                      class="form-input"
                      placeholder="Select time"
                      readonly
                    >
                      <template v-slot:append-inner>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </template>
                    </v-text-field>
                  </template>
                  <v-time-picker
                    v-if="timeMenuOpen"
                    v-model="taskForm.dueTime"
                    ampm-in-title
                    @click:minute="updateTimeFromPicker"
                    @keydown.enter="handleTimePickerEnter"
                  ></v-time-picker>
                </v-menu>
              </div>
              <div class="date-time-item date-time-item-duration">
                <label :for="`task-duration-${taskModalMode}`">Estimated Duration</label>
                <v-menu v-model="durationMenuOpen" :close-on-content-click="false" offset-y min-width="auto" content-class="time-picker-menu">
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      :id="`task-duration-${taskModalMode}`"
                      :model-value="formatDurationForDisplay(taskForm.estimatedDuration) || '1h'"
                      v-bind="props"
                      :required="true"
                      class="form-input"
                      placeholder="Select duration"
                      readonly
                    >
                      <template v-slot:append-inner>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </template>
                    </v-text-field>
                  </template>
                  <v-time-picker
                    v-if="durationMenuOpen"
                    v-model="durationTimeValue"
                    format="24hr"
                    @click:minute="updateDurationFromPicker"
                    @keydown.enter="handleDurationPickerEnter"
                  ></v-time-picker>
                </v-menu>
              </div>
            </div>

            <div v-if="taskError" class="error-message">
              {{ taskError }}
            </div>

            <div class="modal-actions">
              <button v-if="taskModalMode === 'edit'" type="button" @click="handleDeleteTask" class="delete-btn" :disabled="savingTask">
                Delete
              </button>
              <div class="modal-actions-right">
                <button type="button" @click="closeTaskModal" class="cancel-btn">
                  Cancel
                </button>
                <button type="submit" class="purple-btn save-btn" :disabled="savingTask">
                  {{ savingTask ? (taskModalMode === 'add' ? 'Adding...' : 'Saving...') : (taskModalMode === 'add' ? 'Add Task' : 'Save') }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as plannerApi from '@/api/planner.js'
import * as userAccount from '@/api/userAccount.js'
import { useAppStore } from '@/stores/app.js'
import { useTasksStore } from '@/stores/tasks.js'
import NavMenu from '@/components/NavMenu.vue'

const appStore = useAppStore()
const tasksStore = useTasksStore()

const showArchived = ref(false)
const clearingArchived = ref(false)

// Drag and drop state
const draggedTaskId = ref(null)
const draggedTaskIndex = ref(null)
const dragOverIndex = ref(null)
const isReordering = ref(false)

// Unified task modal state (null = closed, 'add' = adding, 'edit' = editing)
const taskModalMode = ref(null)
const currentTask = ref(null) // The task being edited (null for add)
const taskForm = ref({
  title: '',
  description: '',
  dueDate: null,
  dueTime: null,
  estimatedDuration: 60,
  status: 'TODO'
})
const savingTask = ref(false)
const taskError = ref('')
  const timeMenuOpen = ref(false)
  const dateMenuOpen = ref(false)
  const durationMenuOpen = ref(false)
  
  // Duration time value in HH:MM format for the time picker
  // Initialize from taskForm.estimatedDuration (default 60 minutes = 01:00)
  const getInitialDurationTime = () => {
    const minutes = taskForm.value.estimatedDuration || 60
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  }
  const durationTimeValue = ref(getInitialDurationTime())
const showMonthYearPicker = ref(false)
const monthYearPickerDate = ref(null)
const monthScrollRef = ref(null)
const yearScrollRef = ref(null)
const months = ref(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])
const years = ref(Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i))

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

// Helper functions for task time
const getTaskTimeHours = () => {
  return getTimeHours(taskForm.value.dueTime)
}

const getTaskTimeMinutes = () => {
  return getTimeMinutes(taskForm.value.dueTime)
}

// Update time from input fields
const updateTimeFromInput = (event, type) => {
  const inputValue = event.target.value
  if (inputValue === '' || inputValue === null || inputValue === undefined) return
  
  const hours = type === 'hours' ? Math.max(0, Math.min(23, parseInt(inputValue, 10) || 0)) : (taskForm.value.dueTime instanceof Date ? taskForm.value.dueTime.getHours() : (typeof taskForm.value.dueTime === 'string' ? parseInt(taskForm.value.dueTime.split(':')[0], 10) : 0))
  const minutes = type === 'minutes' ? Math.max(0, Math.min(59, parseInt(inputValue, 10) || 0)) : (taskForm.value.dueTime instanceof Date ? taskForm.value.dueTime.getMinutes() : (typeof taskForm.value.dueTime === 'string' ? parseInt(taskForm.value.dueTime.split(':')[1], 10) : 0))
  
  const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  taskForm.value.dueTime = timeString
}

// Track previous minute value to detect when minutes change
const prevTimeMinutes = ref(null)

// Watch for minute changes and close menu when minutes are selected
watch(() => taskForm.value.dueTime, (newTime) => {
  if (!newTime || !timeMenuOpen.value) return
  
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
  if (prevTimeMinutes.value !== null && currentMinutes !== null && 
      prevTimeMinutes.value !== currentMinutes) {
    timeMenuOpen.value = false
  }
  
  prevTimeMinutes.value = currentMinutes
})

// Capture initial minute value when menu opens
watch(timeMenuOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      // Capture initial minute value
      const currentTime = taskForm.value.dueTime
      if (currentTime) {
        if (currentTime instanceof Date) {
          prevTimeMinutes.value = currentTime.getMinutes()
        } else if (typeof currentTime === 'string') {
          const parts = currentTime.split(':')
          if (parts.length >= 2) {
            prevTimeMinutes.value = parseInt(parts[1] || '0', 10)
          }
        }
      } else {
        prevTimeMinutes.value = null
      }
    })
  }
})

  // Update time from picker and close menu (kept for backward compatibility)   
  const updateTimeFromPicker = () => {
    timeMenuOpen.value = false
  }

  // Handle Enter key for time picker - close menu and prevent form submission
  const handleTimePickerEnter = (event) => {
    event.preventDefault()
    event.stopPropagation()
    timeMenuOpen.value = false
  }

  // Handle Enter key for duration picker - close menu and prevent form submission
  const handleDurationPickerEnter = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (durationTimeValue.value) {
      const hours = durationTimeValue.value instanceof Date 
        ? durationTimeValue.value.getHours()
        : parseInt(durationTimeValue.value.split(':')[0], 10) || 0
      const minutes = durationTimeValue.value instanceof Date
        ? durationTimeValue.value.getMinutes()
        : parseInt(durationTimeValue.value.split(':')[1] || '0', 10) || 0
      taskForm.value.estimatedDuration = hours * 60 + minutes
    }
    durationMenuOpen.value = false
  }

  // Handle Enter key for date picker - close menu and prevent form submission
  const handleDatePickerEnter = (event) => {
    event.preventDefault()
    event.stopPropagation()
    dateMenuOpen.value = false
  }

  // Handle Enter key on form - prevent submission if any picker is open
  const handleFormEnter = (event) => {
    // If any picker menu is open, prevent form submission
    if (dateMenuOpen.value || timeMenuOpen.value || durationMenuOpen.value) {
      event.preventDefault()
      event.stopPropagation()
    }
    // Otherwise, let the form submit normally (via @submit.prevent="handleTaskSubmit")
  }

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

  // Format duration (in minutes) for display as "xh ym"
  const formatDurationForDisplay = (minutes) => {
    try {
      if (minutes === null || minutes === undefined) return '1h'
      const mins = Number(minutes) || 60
      const hours = Math.floor(mins / 60)
      const remainingMins = mins % 60
      
      const parts = []
      if (hours > 0) {
        parts.push(`${hours}h`)
      }
      if (remainingMins > 0) {
        parts.push(`${remainingMins}m`)
      }
      
      if (parts.length === 0) {
        return '0m'
      }
      
      return parts.join(' ')
    } catch (e) {
      console.error('Error formatting duration:', e)
      return '1h'
    }
  }

  // Track previous minute value to detect when minutes change for duration picker
  const prevDurationMinutes = ref(null)
  const isUpdatingDurationFromPicker = ref(false)

  // Update duration from time picker (converts HH:MM to minutes)
  const updateDurationFromPicker = () => {
    if (!durationTimeValue.value) return
    
    let hours, minutes
    if (durationTimeValue.value instanceof Date) {
      hours = durationTimeValue.value.getHours()
      minutes = durationTimeValue.value.getMinutes()
    } else if (typeof durationTimeValue.value === 'string') {
      const timeParts = durationTimeValue.value.split(':')
      hours = parseInt(timeParts[0], 10) || 0
      minutes = parseInt(timeParts[1] || '0', 10) || 0
    } else {
      return
    }
    
    taskForm.value.estimatedDuration = hours * 60 + minutes
    durationMenuOpen.value = false
  }

  // Watch durationTimeValue and update estimatedDuration, close menu when minutes change
  watch(durationTimeValue, (newValue) => {
    if (!newValue || !durationMenuOpen.value) return
    
    let hours, minutes
    if (newValue instanceof Date) {
      hours = newValue.getHours()
      minutes = newValue.getMinutes()
    } else if (typeof newValue === 'string') {
      const timeParts = newValue.split(':')
      hours = parseInt(timeParts[0], 10) || 0
      minutes = parseInt(timeParts[1] || '0', 10) || 0
    } else {
      return
    }
    
    const newDuration = hours * 60 + minutes
    // Only update if it's different to avoid unnecessary updates
    if (taskForm.value.estimatedDuration !== newDuration) {
      isUpdatingDurationFromPicker.value = true
      taskForm.value.estimatedDuration = newDuration
      nextTick(() => {
        isUpdatingDurationFromPicker.value = false
      })
    }
    
    // Close menu if minutes changed (not just hour)
    if (prevDurationMinutes.value !== null && prevDurationMinutes.value !== minutes) {
      durationMenuOpen.value = false
    }
    
    prevDurationMinutes.value = minutes
  })

  // Capture initial minute value when duration menu opens
  watch(durationMenuOpen, (isOpen) => {
    if (isOpen) {
      nextTick(() => {
        const currentValue = durationTimeValue.value
        if (currentValue) {
          if (currentValue instanceof Date) {
            prevDurationMinutes.value = currentValue.getMinutes()
          } else if (typeof currentValue === 'string') {
            const parts = currentValue.split(':')
            if (parts.length >= 2) {
              prevDurationMinutes.value = parseInt(parts[1] || '0', 10)
            }
          }
        } else {
          prevDurationMinutes.value = null
        }
      })
    }
  })

  // Initialize and sync durationTimeValue with estimatedDuration
  watch(() => taskForm.value.estimatedDuration, (newDuration) => {
    if (newDuration !== null && newDuration !== undefined && !isUpdatingDurationFromPicker.value) {
      const hours = Math.floor(newDuration / 60)
      const minutes = newDuration % 60
      const newTimeValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      // Only update if it's different to avoid unnecessary updates
      if (durationTimeValue.value !== newTimeValue) {
        durationTimeValue.value = newTimeValue
      }
    }
  }, { immediate: true })

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

// Month/Year picker functions
const openMonthYearPicker = (e) => {
  if (e) e.stopPropagation()
  showMonthYearPicker.value = true
  if (taskForm.value.dueDate) {
    if (typeof taskForm.value.dueDate === 'string') {
      monthYearPickerDate.value = new Date(taskForm.value.dueDate + 'T00:00:00')
    } else {
      monthYearPickerDate.value = new Date(taskForm.value.dueDate)
      }
    } else {
    monthYearPickerDate.value = new Date()
  }
  
  nextTick(() => {
    scrollToCurrentMonth()
    scrollToCurrentYear()
  })
}

const isCurrentMonth = (index) => {
  if (!monthYearPickerDate.value) return false
  return monthYearPickerDate.value.getMonth() === index
}

const isCurrentYear = (year) => {
  if (!monthYearPickerDate.value) return false
  return monthYearPickerDate.value.getFullYear() === year
}

const selectMonth = (monthIndex) => {
  if (!monthYearPickerDate.value) {
    monthYearPickerDate.value = new Date()
  }
  monthYearPickerDate.value.setMonth(monthIndex)
  updateDateFromPicker()
  showMonthYearPicker.value = false
}

const selectYear = (year) => {
  if (!monthYearPickerDate.value) {
    monthYearPickerDate.value = new Date()
  }
  monthYearPickerDate.value.setFullYear(year)
  updateDateFromPicker()
}

const updateDateFromPicker = () => {
  if (monthYearPickerDate.value) {
    // Format as YYYY-MM-DD for Vuetify date picker
    const year = monthYearPickerDate.value.getFullYear()
    const month = String(monthYearPickerDate.value.getMonth() + 1).padStart(2, '0')
    const day = String(monthYearPickerDate.value.getDate()).padStart(2, '0')
    taskForm.value.dueDate = `${year}-${month}-${day}`
  }
}

const scrollToCurrentMonth = () => {
  if (monthScrollRef.value && monthYearPickerDate.value) {
    const monthIndex = monthYearPickerDate.value.getMonth()
    const itemHeight = 48 // Approximate height of each month item
    const scrollPosition = monthIndex * itemHeight - (monthScrollRef.value.clientHeight / 2) + (itemHeight / 2)
    monthScrollRef.value.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' })
  }
}

const scrollToCurrentYear = () => {
  if (yearScrollRef.value && monthYearPickerDate.value) {
    const currentYear = monthYearPickerDate.value.getFullYear()
    const yearIndex = years.value.indexOf(currentYear)
    if (yearIndex !== -1) {
      const itemHeight = 48 // Approximate height of each year item
      const scrollPosition = yearIndex * itemHeight - (yearScrollRef.value.clientHeight / 2) + (itemHeight / 2)
      yearScrollRef.value.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' })
    }
  }
}

// Watch for user changes
watch(() => appStore.sessionToken, (newUserId) => {
  if (newUserId && appStore.appState === 'tasks') {
    // Only fetch if we don't have tasks or if we're on the tasks page
    if (!tasksStore.tasks.length || (!tasksStore.loading && !tasksStore.fetching)) {
      tasksStore.fetchTasks(newUserId)
    }
  }
})

// Watch for app state changes to fetch when navigating to tasks page
watch(() => appStore.appState, (newState) => {
  if (newState === 'tasks' && appStore.sessionToken) {
    // Only fetch if we don't have tasks or tasks are stale
    if (!tasksStore.tasks.length || (!tasksStore.loading && !tasksStore.fetching)) {
      tasksStore.fetchTasks(appStore.sessionToken)
    }
  }
})

// Fetch tasks when component mounts or user changes
onMounted(() => {
  if (appStore.sessionToken && appStore.appState === 'tasks') {
    // Only fetch if we don't have tasks
    if (!tasksStore.tasks.length) {
      tasksStore.fetchTasks(appStore.sessionToken)
    }
  }
})

// Open task modal for viewing, adding, or editing
const openTaskModal = (mode, task = null) => {
  taskModalMode.value = mode
  currentTask.value = task
  
  if (mode === 'view' && task) {
    // View mode - just set the task, no form needed
    taskError.value = ''
  } else if (mode === 'edit' && task) {
    // Editing existing task - populate form with task data
    if (task.dueDate) {
      const dueDateTime = new Date(task.dueDate)
      // Separate date and time
      const dateOnly = new Date(dueDateTime)
      dateOnly.setHours(0, 0, 0, 0)
      // Format time as HH:MM string for Vuetify time picker
      const hours = String(dueDateTime.getHours()).padStart(2, '0')
      const minutes = String(dueDateTime.getMinutes()).padStart(2, '0')
      const timeString = `${hours}:${minutes}`
      taskForm.value = {
        title: task.title || '',
        description: task.description || '',
        dueDate: dateOnly,
        dueTime: timeString,
        estimatedDuration: task.estimatedDuration || 60,
        status: task.status || 'TODO'
      }
    } else {
      taskForm.value = {
        title: task.title || '',
        description: task.description || '',
        dueDate: null,
        dueTime: null,
        estimatedDuration: task.estimatedDuration || 60,
        status: task.status || 'TODO'
      }
    }
  } else {
    // Adding new task - prefill with defaults (status: TODO, empty other fields)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    taskForm.value = {
      title: '',
      description: '',
      dueDate: tomorrow,
      dueTime: '09:00', // Vuetify time picker uses string format
      estimatedDuration: 60,
      status: 'TODO' // Prefilled as requested
    }
  }
  taskError.value = ''
}

const openAddModal = () => {
  openTaskModal('add')
}

const closeTaskModal = () => {
  taskModalMode.value = null
  currentTask.value = null
  taskForm.value = {
    title: '',
    description: '',
    dueDate: null,
    dueTime: null,
    estimatedDuration: 60,
    status: 'TODO'
  }
  taskError.value = ''
}

// Unified submit handler for both add and edit
const handleTaskSubmit = async () => {
  if (!appStore.sessionToken) {
    return
  }

  savingTask.value = true
  taskError.value = ''

  try {
    // Validate due date and time
    if (!taskForm.value.dueDate || !taskForm.value.dueTime) {
      taskError.value = 'Please select both a due date and time'
      savingTask.value = false
      return
    }
    
    // Combine date and time into a single DateTime
    const dateOnly = taskForm.value.dueDate instanceof Date 
      ? taskForm.value.dueDate 
      : new Date(taskForm.value.dueDate)
    
    // Handle Vuetify time picker - can be string (HH:MM) or Date
    let hours = 0
    let minutes = 0
    if (taskForm.value.dueTime instanceof Date) {
      hours = taskForm.value.dueTime.getHours()
      minutes = taskForm.value.dueTime.getMinutes()
    } else if (typeof taskForm.value.dueTime === 'string') {
      // Handle string format like "09:00" or "09:00:00"
      const timeParts = taskForm.value.dueTime.split(':')
      hours = parseInt(timeParts[0], 10)
      minutes = parseInt(timeParts[1], 10)
    } else {
      // Try to parse as Date
      const timeOnly = new Date(taskForm.value.dueTime)
      if (!isNaN(timeOnly.getTime())) {
        hours = timeOnly.getHours()
        minutes = timeOnly.getMinutes()
      }
    }
    
    // Validate date
    if (isNaN(dateOnly.getTime())) {
      taskError.value = 'Please enter valid date and time'
      savingTask.value = false
      return
    }
    
    // Combine date and time
    const dueDateTime = new Date(dateOnly)
    dueDateTime.setHours(hours, minutes, 0, 0)

    if (taskModalMode.value === 'add') {
      // Adding new task
      await tasksStore.createTask(
        appStore.sessionToken,
        taskForm.value.title.trim(),
        taskForm.value.description.trim(),
        dueDateTime.toISOString(),
        taskForm.value.estimatedDuration
      )
      closeTaskModal()
    } else if (taskModalMode.value === 'edit' && currentTask.value) {
      // Editing existing task
      const task = currentTask.value
      const currentStatus = task.status || 'TODO'
      const newStatus = taskForm.value.status
      
      // Update task details (title, description, dueDate, estimatedDuration)
      await tasksStore.updateTask(
        appStore.sessionToken,
        task._id,
        taskForm.value.title.trim(),
        taskForm.value.description.trim(),
        dueDateTime.toISOString(),
        taskForm.value.estimatedDuration
      )

      // Handle status change separately
      if (currentStatus !== newStatus) {
        if (newStatus === 'DONE') {
          // Use markTaskComplete for DONE status
          await tasksStore.markTaskComplete(appStore.sessionToken, task._id)
        }
        // If changing back to TODO, the backend doesn't support this via updateTask
        // So we'll just refresh tasks to get the current status from backend
        // (Status changes from DONE to TODO are not supported by backend)
      }

      closeTaskModal()
    }
  } catch (err) {
    taskError.value = err.message || (taskModalMode.value === 'add' ? 'Failed to create task' : 'Failed to update task')
  } finally {
    savingTask.value = false
  }
}

// Helper function to convert status to CSS class
const getStatusClass = (status) => {
  if (!status) return 'todo'
  const statusLower = status.toLowerCase()
  // Convert IN_PROGRESS to in-progress for CSS class
  if (statusLower === 'in_progress') {
    return 'in-progress'
  }
  return statusLower
}

// Helper function to get priority color based on position (red at top = urgent, green at bottom = less urgent)
const getPriorityColor = (index, totalTasks) => {
  if (totalTasks <= 1) {
    // If only one task, use red (highest priority)
    return 'hsl(0, 60%, 75%)'
  }
  
  // Calculate ratio from 0 (top/red) to 1 (bottom/green)
  const ratio = index / (totalTasks - 1)
  
  // Interpolate between red and green using HSL
  // Red: hsl(0, 60%, 75%)
  // Green: hsl(120, 60%, 75%)
  // Interpolate hue from 0 to 120
  const hue = 120 * ratio // 0 to 120
  const saturation = 60 // Set saturation to 60%
  const lightness = 75 // Set lightness to 75%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// Helper function to format status for display (remove underscores)
const formatStatus = (status) => {
  if (!status) return 'TODO'
  // Replace underscores with spaces
  return status.replace(/_/g, ' ')
}

// Helper function to format task due date for list display
const formatTaskDueDate = (dueDate) => {
  if (!dueDate) return ''
  const date = new Date(dueDate)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffTime = taskDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // Format time
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  const timeStr = `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`
  
  if (diffDays === 0) {
    return `Today ${timeStr}`
  } else if (diffDays === 1) {
    return `Tomorrow ${timeStr}`
  } else if (diffDays === -1) {
    return `Yesterday ${timeStr}`
  } else if (diffDays > 0 && diffDays <= 7) {
    return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${timeStr}`
      } else {
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    return `${month} ${day} ${timeStr}`
  }
}

// Helper function to format task duration for list display
const formatTaskDuration = (minutes) => {
  if (!minutes) return ''
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}m`
}

const toggleArchived = () => {
  showArchived.value = !showArchived.value
}

const handleDeleteTask = async () => {
  if (!currentTask.value || !appStore.sessionToken) {
    return
  }

  if (!confirm('Are you sure you want to delete this task?')) {
    return
  }

  savingTask.value = true
  taskError.value = ''

  try {
    await tasksStore.deleteTask(appStore.sessionToken, currentTask.value._id)
    closeTaskModal()
  } catch (err) {
    taskError.value = err.message || 'Failed to delete task'
  } finally {
    savingTask.value = false
  }
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleLogout = () => {
  showUserMenu.value = false
  appStore.logout()
}

// Drag and drop handlers
const handleDragStart = (task, index, event) => {
  draggedTaskId.value = task._id
  draggedTaskIndex.value = index
  dragOverIndex.value = null
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', task._id)
  // Add visual feedback
  event.target.style.opacity = '0.5'
}

const handleDragEnter = (index, event) => {
  if (draggedTaskIndex.value !== null && draggedTaskIndex.value !== index) {
    dragOverIndex.value = index
  }
}

const handleDragOver = (index, event) => {
  if (draggedTaskIndex.value !== null && draggedTaskIndex.value !== index) {
    event.preventDefault()
    dragOverIndex.value = index
  }
}

const handleDragLeave = (event) => {
  // Only clear drag-over if we're leaving the list item itself
  if (!event.currentTarget.contains(event.relatedTarget)) {
    const index = Array.from(event.currentTarget.parentElement.children).indexOf(event.currentTarget)
    if (dragOverIndex.value === index) {
      dragOverIndex.value = null
    }
  }
}

const handleDrop = async (index, event) => {
  event.preventDefault()
  
  if (draggedTaskIndex.value === null || draggedTaskIndex.value === index) {
    return
  }

  // Save scroll position before reordering (window scroll)
  const savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
  
  // Get reference to the dragged task element to maintain relative position
  const draggedElement = event.currentTarget
  const taskListElement = draggedElement.parentElement
  const draggedElementRect = draggedElement.getBoundingClientRect()
  const listRect = taskListElement ? taskListElement.getBoundingClientRect() : null
  const relativeY = listRect ? draggedElementRect.top - listRect.top + savedScrollY : savedScrollY

  // Get all tasks (both TODO and DONE)
  const allTasks = tasksStore.tasks
  const todoTasks = tasksStore.todoTasks
  const completedTasks = tasksStore.completedTasks

  // Reorder only the TODO tasks
  const newTodoOrder = [...todoTasks]
  const [draggedTask] = newTodoOrder.splice(draggedTaskIndex.value, 1)
  newTodoOrder.splice(index, 0, draggedTask)

  // Create new order: reordered TODO tasks first, then completed tasks in their original order
  const newOrder = [...newTodoOrder, ...completedTasks]

  // Create new order array with task IDs
  const newOrderIds = newOrder.map(task => task._id)

  // Function to restore scroll position
  const restoreScroll = () => {
    window.scrollTo({
      top: savedScrollY,
      left: 0,
      behavior: 'auto' // Use 'auto' instead of 'smooth' to prevent animation
    })
    document.documentElement.scrollTop = savedScrollY
    if (document.body) {
      document.body.scrollTop = savedScrollY
    }
  }

  // Temporarily disable scroll restoration behavior
  const originalScrollRestoration = 'scrollRestoration' in window.history ? window.history.scrollRestoration : null
  if (originalScrollRestoration) {
    window.history.scrollRestoration = 'manual'
  }

  try {
    isReordering.value = true
    
    // Restore scroll immediately before update
    restoreScroll()
    
    // Use a synchronous update to minimize re-render window
    await tasksStore.reorderTasks(appStore.sessionToken, newOrderIds)
    
    // Immediately restore scroll after update
    restoreScroll()
    
    // Use nextTick and multiple requestAnimationFrames to ensure scroll is restored
    await nextTick()
    restoreScroll()
    
    // Multiple restoration attempts to catch any late scroll changes
    setTimeout(() => restoreScroll(), 0)
    requestAnimationFrame(() => {
      restoreScroll()
      setTimeout(() => restoreScroll(), 0)
      requestAnimationFrame(() => {
        restoreScroll()
        setTimeout(() => restoreScroll(), 10)
      })
    })
  } catch (err) {
    console.error('Failed to reorder tasks:', err)
    // Tasks are already reverted in the store, just refresh to ensure consistency
    await tasksStore.fetchTasks(appStore.sessionToken)
    // Restore scroll position after refresh
    await nextTick()
    restoreScroll()
    setTimeout(() => restoreScroll(), 0)
    requestAnimationFrame(() => {
      restoreScroll()
      setTimeout(() => restoreScroll(), 10)
    })
  } finally {
    isReordering.value = false
    
    // Restore original scroll restoration behavior
    if (originalScrollRestoration) {
      window.history.scrollRestoration = originalScrollRestoration
    }
  }

  // Reset drag state
  draggedTaskId.value = null
  draggedTaskIndex.value = null
  dragOverIndex.value = null
}

const handleDragEnd = (event) => {
  // Reset visual feedback
  event.target.style.opacity = '1'
  
  // Reset drag state
  draggedTaskId.value = null
  draggedTaskIndex.value = null
  dragOverIndex.value = null
}

const handleTaskClick = (task, event) => {
  // Only open modal if not dragging
  if (draggedTaskId.value === null) {
    openTaskModal('view', task)
  }
}

const switchToEditMode = () => {
  if (currentTask.value) {
    openTaskModal('edit', currentTask.value)
  }
}

const handleClearArchived = async () => {
  if (!appStore.sessionToken) {
    return
  }

  const completedTasks = tasksStore.completedTasks
  if (completedTasks.length === 0) {
    return
  }

  if (!confirm(`Are you sure you want to delete all ${completedTasks.length} archived task${completedTasks.length === 1 ? '' : 's'}? This action cannot be undone.`)) {
    return
  }

  clearingArchived.value = true
  tasksStore.error = null

  try {
    // Delete all completed tasks
    const deletePromises = completedTasks.map(task => 
      tasksStore.deleteTask(appStore.sessionToken, task._id)
    )
    await Promise.all(deletePromises)
    
    // Refresh tasks to update the list
    await tasksStore.fetchTasks(appStore.sessionToken)
  } catch (err) {
    console.error('Error clearing archived tasks:', err)
    tasksStore.error = err.message || 'Failed to clear archived tasks'
  } finally {
    clearingArchived.value = false
  }
}
</script>

<style scoped>
.task-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.task-container {
  max-width: 920px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 40px;
}


.add-task-form {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
}

.task-input {
  flex: 1;
  padding: 14px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.task-input:focus {
  outline: none;
  border-color: #667eea;
}

.task-input::placeholder {
  color: #999;
}

.add-btn {
  padding: 14px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  white-space: nowrap;
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

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

.tasks-section {
  margin-bottom: 32px;
}

.tasks-section:last-child {
  margin-bottom: 0;
}

.tasks-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  padding: 6px 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
  border-radius: 0;
  transition: background-color 0.2s ease;
  position: relative;
  z-index: 1;
}

.tasks-section-header.todo-header {
  border-bottom: none;
}

.tasks-section-header.todo-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10px;
  right: 220px; /* End before the button area (button is ~180px wide including padding + margin) */
  height: 1px;
  background: #e0e0e0;
  z-index: 1;
}

.tasks-section-header:hover {
  background: rgba(0, 0, 0, 0.05);
}

.tasks-section-header.todo-header:hover {
  background: transparent;
}

.tasks-section-title {
  margin: 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.todo-header {
  margin-bottom: 20px;
}

.todo-section {
  margin-bottom: 60px;
}

.clear-archived-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
}

.clear-archived-btn {
  /* Keep it aligned to the right */
}

/* .clear-archived-btn now uses shared .clear-btn class from style.css */

.toggle-icon {
  flex-shrink: 0;
  transition: transform 0.2s ease;
  color: #666;
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

.tasks-section-header:hover .toggle-icon {
  transform: rotate(180deg);
}

.tasks-section-header:hover .toggle-icon.expanded {
  transform: rotate(0deg);
}

.tasks-list-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #f0f0f0;
  border-radius: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #666;
}

.header-order {
  width: 60px;
  flex-shrink: 0;
}

.header-content {
  flex: 1;
}

.header-status {
  width: 100px;
  flex-shrink: 0;
  text-align: right;
}

.tasks-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 12px 16px 8px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid var(--priority-color, #667eea);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: grab;
  user-select: none;
  gap: 12px;
}

.task-drag-handle {
  width: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  cursor: grab;
  pointer-events: none;
}

.task-drag-handle svg {
  width: 20px;
  height: 20px;
}

.task-item:hover .task-drag-handle {
  color: #667eea;
}

.task-item:active {
  cursor: grabbing;
}

.task-item:hover:not(.dragging) {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: #f0f0f0;
}

.task-item.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.task-item.drag-over {
  border-top: 3px solid #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.task-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.task-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.task-title {
  flex: 1;
  color: #333;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.task-description {
  color: #999;
  font-size: 14px;
  font-weight: 400;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  max-height: 2.8em; /* 2 lines * 1.4em line-height */
  margin-top: 2px;
}

.task-right-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.task-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 12px;
  font-weight: 400;
}

.task-meta-item svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  color: #999;
}

/* Shared status badge styles - used by task list and form */
.task-status,
.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-status {
  width: 80px;
  flex-shrink: 0;
  align-self: flex-start;
}

.status-badge {
  min-width: 80px;
  margin-right: 12px;
}

.status-badge:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.status-badge:active {
  transform: translateY(0);
}

.task-status.todo,
.status-badge.todo {
  background: #e3f2fd;
  color: #1976d2;
}

.task-status.done,
.status-badge.done {
  background: #e8f5e9;
  color: #2e7d32;
}

.task-status.in-progress,
.status-badge.in-progress {
  background: #fff3e0;
  color: #f57c00;
}

.status-badge.active {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.status-options {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-buttons-section {
  margin-bottom: -36px; /* Reduced from 24px to bring tasks section higher / reduce gap */
  margin-top: 40px;
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  align-items: center;
  position: relative;
  z-index: 10;
}

.plan-day-btn {
  flex: 0 0 auto;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  color: #667eea;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plan-day-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%);
  border-color: rgba(102, 126, 234, 0.3);
  color: #5568d3;
}

.plan-day-btn:active:not(:disabled) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
}

.plan-day-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.plan-view-btn {
  flex: 0 0 auto;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  color: #667eea;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plan-view-btn:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%);
  border-color: rgba(102, 126, 234, 0.3);
  color: #5568d3;
}

.plan-view-btn:active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
}

.add-task-btn {
  flex: 0 0 auto;
  position: relative;
  z-index: 11;
}

/* .add-task-btn now uses shared .light-purple-btn class from style.css */

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

/* Task View Mode Styles */
.task-view-mode {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.view-task-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.view-task-title {
  margin: 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.3;
  word-wrap: break-word;
}

.view-task-description {
  margin: 0;
  color: #666;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.view-task-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.view-task-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #999;
  font-size: 15px;
  font-weight: 400;
}

.view-task-meta-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #999;
}

.view-task-status {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Use shared color styles for view task status */
.view-task-status.todo {
  background: #e3f2fd;
  color: #1976d2;
}

.view-task-status.done {
  background: #e8f5e9;
  color: #2e7d32;
}

.view-task-status.in-progress {
  background: #fff3e0;
  color: #f57c00;
}

.edit-task-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.edit-task-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

  .edit-task-form .form-group label {
    font-weight: 500;
    color: #333;
    font-size: 14px;
  }

  .edit-task-form .title-status-row {
    position: relative;
    display: flex;
    align-items: center;
  }

  .edit-task-form .title-status-row .form-input {
    width: 100%;
    padding-right: 120px;
  }

  .edit-task-form .title-status-row .status-badge {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
  }

.edit-task-form .form-group.date-time-group {
  flex-direction: row;
  align-items: flex-end;
  gap: 16px;
}

.date-time-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 27%;
}

.date-time-item-duration {
  margin-left: auto;
}

.edit-task-form .form-input {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.edit-task-form .form-input:focus {
  outline: none;
  border-color: #667eea;
}

/* Make v-text-field inputs same height as regular inputs */
.edit-task-form :deep(.v-text-field) {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
  border-radius: 8px !important;
  overflow: hidden !important;
}

.edit-task-form :deep(.v-input) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  border-radius: 8px !important;
}

.edit-task-form :deep(.v-field) {
  min-height: auto !important;
  padding: 0 !important;
  margin-bottom: 0 !important;
  border-radius: 8px !important;
  transition: background-color 0.2s ease !important;
}

.edit-task-form :deep(.v-field__overlay) {
  display: none !important;
}

.edit-task-form :deep(.v-field__input) {
  min-height: auto !important;
  padding: 12px 0 !important;
}

.edit-task-form :deep(.v-field__prepend-inner),
.edit-task-form :deep(.v-field__append-inner) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.edit-task-form :deep(.v-field__append-inner) svg {
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-task-form :deep(.v-text-field):hover .v-field__append-inner svg {
  color: #333;
}

.edit-task-form :deep(.v-field__wrapper) {
  padding: 0 !important;
  margin-bottom: 0 !important;
}

.edit-task-form :deep(.v-text-field):hover {
  background-color: #f5f5f5 !important;
  cursor: pointer !important;
}

.edit-task-form :deep(.v-text-field):hover .v-input,
.edit-task-form :deep(.v-text-field):hover .v-field,
.edit-task-form :deep(.v-text-field):hover .v-field__wrapper,
.edit-task-form :deep(.v-text-field):hover .v-field__input,
.edit-task-form :deep(.v-text-field):hover .v-field__prepend-inner,
.edit-task-form :deep(.v-text-field):hover .v-field__append-inner {
  background-color: #f5f5f5 !important;
  cursor: pointer !important;
}

.edit-task-form :deep(.v-input__details) {
  display: none !important;
  padding: 0 !important;
  margin: 0 !important;
  min-height: 0 !important;
  height: 0 !important;
}

.edit-task-form :deep(.v-messages) {
  display: none !important;
  min-height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  height: 0 !important;
}

.edit-task-form :deep(.v-field__outline) {
  display: none !important;
}

.edit-task-form :deep(.v-field__outline__start),
.edit-task-form :deep(.v-field__outline__notch),
.edit-task-form :deep(.v-field__outline__end) {
  display: none !important;
}

.edit-task-form .form-input[type="number"] {
  -moz-appearance: textfield;
}

.edit-task-form .form-input[type="number"]::-webkit-inner-spin-button,
.edit-task-form .form-input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.edit-task-form .form-input[type="select"],
.edit-task-form select.form-input {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
  padding-right: 36px;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.edit-task-form select.form-input:hover {
  background-color: #f5f5f5;
}

.edit-task-form select.form-input:focus {
  outline: none;
  border-color: #667eea;
  background-color: white;
}

/* Input with icon wrapper */
.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-with-icon .form-input {
  width: 100%;
  padding-right: 40px;
}

/* Time picker icon button - positioned to overlay the native picker indicator */
.time-picker-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  border-radius: 4px;
  transition: all 0.2s ease;
  pointer-events: auto; /* Need pointer events to handle clicks */
  z-index: 2;
  margin: 0;
}

.time-picker-icon:hover {
  background: #f0f0f0;
  color: #667eea;
}

.time-picker-icon:active {
  transform: translateY(-50%) scale(0.95);
}

.time-picker-icon svg {
  display: block;
  width: 18px;
  height: 18px;
}

/* Time input styling */
.time-input {
  cursor: pointer;
  width: 100%;
}

/* Time picker dropdowns */
.time-picker-dropdowns {
  display: flex;
  gap: 8px;
  align-items: center;
}

.time-select {
  flex: 0 0 80px;
  min-width: 80px;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  background: white;
  transition: border-color 0.2s ease;
}

.time-select:focus {
  outline: none;
  border-color: #667eea;
}

/* AM/PM button and dropdown */
.ampm-input-wrapper {
  flex: 0 0 80px;
  min-width: 80px;
  position: relative;
}

.ampm-button {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  background: white;
  transition: all 0.2s ease;
  text-align: center;
  font-weight: 500;
  color: #333;
}

.ampm-button:hover {
  border-color: #ccc;
  background: #f9f9f9;
}

.ampm-button:focus {
  outline: none;
  border-color: #667eea;
}

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
  overflow: hidden;
}

.ampm-dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 16px;
  color: #666;
  text-align: center;
  font-weight: 500;
}

.ampm-dropdown-item:hover {
  background: #f5f5f5;
}

.ampm-dropdown-item.active {
  background: #f0f4ff;
  color: #667eea;
  font-weight: 600;
}

/* Editable time input with dropdown */
.time-input-wrapper {
  flex: 1;
  position: relative;
}

.time-input-editable {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.time-input-editable:focus {
  outline: none;
  border-color: #667eea;
}

.time-dropdown-menu {
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

.time-dropdown-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 14px;
  color: #666;
}

.time-dropdown-item:hover {
  background: #f5f5f5;
}

.time-dropdown-item.active {
  background: #f0f4ff;
  color: #667eea;
  font-weight: 600;
}

  .modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 10px;
    justify-content: flex-end;
    align-items: center;
  }

  .modal-actions .delete-btn {
    margin-right: auto;
  }

  .modal-actions-right {
    display: flex;
    gap: 12px;
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

/* Style time picker to match date picker */
.edit-task-form :deep(.v-time-picker) {
  width: auto !important;
  min-width: 224px !important;
  max-width: 256px !important;
  transform: scale(0.8);
  transform-origin: top center;
}

.edit-task-form :deep(.v-time-picker__header) {
  padding: 8px 12px !important;
  font-size: 14px !important;
}

.edit-task-form :deep(.v-time-picker__title) {
  font-size: 18px !important;
  font-weight: 500 !important;
}

.edit-task-form :deep(.v-time-picker__body) {
  padding: 8px !important;
}

.edit-task-form :deep(.v-time-picker__clock) {
  width: 160px !important;
  height: 160px !important;
  margin: 0 auto !important;
}

.edit-task-form :deep(.v-time-picker__clock .v-time-picker__clock__item) {
  font-size: 10px !important;
  width: 22px !important;
  height: 22px !important;
}

.edit-task-form :deep(.v-time-picker__clock .v-time-picker__clock__item--active) {
  font-size: 13px !important;
  font-weight: 600 !important;
}

/* Match date picker container styling */
.edit-task-form :deep(.v-menu__content) {
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* Ensure date picker navigation is visible and functional */
.edit-task-form :deep(.v-date-picker-header) {
  display: flex !important;
  visibility: visible !important;
  padding: 8px 12px !important;
  align-items: center !important;
  justify-content: space-between !important;
}

.edit-task-form :deep(.v-date-picker-header *),
.edit-task-form :deep(.v-date-picker-header button),
.edit-task-form :deep(.v-date-picker-header .v-btn),
.edit-task-form :deep(.v-date-picker-header .v-icon) {
  display: flex !important;
  visibility: visible !important;
  pointer-events: auto !important;
  opacity: 1 !important;
}

.edit-task-form :deep(.v-date-picker-header__append),
.edit-task-form :deep(.v-date-picker-header__prepend) {
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

.edit-task-form :deep(.v-date-picker-header__append button),
.edit-task-form :deep(.v-date-picker-header__prepend button),
.edit-task-form :deep(.v-date-picker-header__append .v-btn),
.edit-task-form :deep(.v-date-picker-header__prepend .v-btn) {
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

.edit-task-form :deep(.v-date-picker-header__append),
.edit-task-form :deep(.v-date-picker-header__prepend) {
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)) !important;
}

.edit-task-form :deep(.v-date-picker-header__append .v-icon),
.edit-task-form :deep(.v-date-picker-header__prepend .v-icon),
.edit-task-form :deep(.v-date-picker-header__append i),
.edit-task-form :deep(.v-date-picker-header__prepend i),
.edit-task-form :deep(.v-date-picker-header__append button),
.edit-task-form :deep(.v-date-picker-header__prepend button),
.edit-task-form :deep(.v-date-picker-header__append .v-btn),
.edit-task-form :deep(.v-date-picker-header__prepend .v-btn),
.edit-task-form :deep(.v-date-picker-header__append),
.edit-task-form :deep(.v-date-picker-header__prepend) {
  display: inline-flex !important;
  visibility: visible !important;
  pointer-events: auto !important;
  cursor: pointer !important;
  opacity: 1 !important;
  font-size: 24px !important;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)) !important;
  background: transparent !important;
}

.edit-task-form :deep(.v-date-picker-header__title) {
  cursor: pointer !important;
  pointer-events: auto !important;
  display: flex !important;
  visibility: visible !important;
  flex: 1 !important;
  justify-content: center !important;
  align-items: center !important;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)) !important;
}

/* Hide Vuetify's default month/year views */
.edit-task-form :deep(.v-date-picker-month),
.edit-task-form :deep(.v-date-picker-year) {
  display: none !important;
  visibility: hidden !important;
}

/* Custom header styling */
.edit-task-form .custom-date-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  width: 100%;
}

.edit-task-form .header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.edit-task-form .header-month-btn,
.edit-task-form .header-year-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-weight: 500;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.edit-task-form .header-month-btn:hover,
.edit-task-form .header-year-btn:hover {
  opacity: 0.7;
}

.edit-task-form .header-nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 40px;
}

.edit-task-form .header-nav-btn:hover {
  opacity: 0.7;
}

/* Ensure all date picker elements are visible */
.edit-task-form :deep(.v-date-picker) {
  min-height: 240px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  border-radius: 8px !important;
  background: white !important;
  transform: scale(0.8);
  transform-origin: top center;
}

.edit-task-form .date-picker-container {
  position: relative;
}

/* Ensure date picker menu has shadow */
.edit-task-form .date-picker-container ~ .v-menu__content,
.edit-task-form .date-picker-container :deep(.v-menu__content),
.edit-task-form :deep(.v-menu[data-v-menu__content]) .v-menu__content {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  border-radius: 8px !important;
}

.edit-task-form :deep(.v-date-picker-header__content) {
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

.time-picker-wrapper .time-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.time-picker-wrapper .time-input {
  width: 60px;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  text-align: center;
  font-weight: 500;
}

.time-picker-wrapper .time-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.time-picker-wrapper .time-separator {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* Force all elements in date picker to be visible */
.edit-task-form :deep(.v-date-picker-header),
.edit-task-form :deep(.v-date-picker-header__append),
.edit-task-form :deep(.v-date-picker-header__prepend),
.edit-task-form :deep(.v-date-picker-header__title),
.edit-task-form :deep(.v-date-picker-header__content) {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

.edit-task-form :deep(.v-date-picker-header) > * {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* Date picker container */
.edit-task-form .date-picker-container {
  position: relative;
}

/* Custom Month/Year Picker */
.edit-task-form .custom-month-year-picker {
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

.edit-task-form .month-year-picker-header {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.edit-task-form .month-year-picker-header .close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  padding: 4px 8px;
  line-height: 1;
}

.edit-task-form .month-year-picker-header .close-btn:hover {
  opacity: 0.7;
}

.edit-task-form .month-year-columns {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.edit-task-form .month-column,
.edit-task-form .year-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.edit-task-form .year-column {
  border-right: none;
}

.edit-task-form .scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}

.edit-task-form .scroll-container::-webkit-scrollbar {
  width: 6px;
}

.edit-task-form .scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.edit-task-form .scroll-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.edit-task-form .month-year-item {
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

.edit-task-form .month-year-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.edit-task-form .month-year-item.active {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

</style>
