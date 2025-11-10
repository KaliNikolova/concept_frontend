<template>
  <div class="focus-view">
    <div class="focus-container">
      <NavMenu />

      <div v-if="loading" class="loading-message">
        Loading current task...
      </div>
      
      <div v-else-if="currentTask" class="focus-task-card">
        <h2 class="focus-task-title">{{ currentTask?.title || currentTask?.description || 'Untitled Task' }}</h2>
        
        <div class="focus-task-details">
          <div v-if="currentTask?.dueDate" class="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span class="detail-label">Due:</span>
            <span class="detail-value">{{ formatDueDate(currentTask.dueDate) }}</span>
          </div>
          
          <div v-if="currentTask?.estimatedDuration" class="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span class="detail-label">Duration:</span>
            <span class="detail-value">{{ formatDuration(currentTask.estimatedDuration) }}</span>
          </div>
        </div>
        
        <p v-if="currentTask?.description && currentTask?.title" class="focus-task-description">{{ currentTask.description }}</p>
        
        <div class="mark-complete-container">
          <button @click="handleMarkComplete" class="purple-btn mark-complete-btn" :disabled="completing">
            {{ completing ? 'Completing...' : 'Mark Complete' }}
          </button>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <h3 class="empty-title">No Task in Focus</h3>
        <p class="empty-description">You don't have a current focus task set yet.</p>
        <p class="empty-hint">Try planning your day to automatically set your first task as the current focus.</p>
        <button @click="appStore.setAppState('plan')" class="purple-btn">
          Go to Day Plan
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { useTasksStore } from '@/stores/tasks.js'
import * as focusApi from '@/api/focus.js'
import NavMenu from '@/components/NavMenu.vue'

const appStore = useAppStore()
const tasksStore = useTasksStore()

const completing = ref(false)
const currentTask = ref(null)
const loading = ref(false)

// Fetch current focus task from backend
const fetchCurrentTask = async () => {
  if (!appStore.sessionToken) return
  
  loading.value = true
  try {
    // Ensure tasks are loaded first
    if (tasksStore.tasks.length === 0) {
      await tasksStore.fetchTasks(appStore.sessionToken)
    }
    
    const response = await focusApi.getCurrentTask(appStore.sessionToken)
    
    // Backend returns: { "task": "ID" } - direct object
    const taskId = response?.task
    
    if (taskId) {
      // Get full task details from tasks store
      const task = tasksStore.tasks.find(t => t._id === taskId)
      currentTask.value = task || null
      console.log('✓ Current focus task:', task?.title || taskId)
    } else {
      currentTask.value = null
      console.log('No current focus task set by backend')
    }
  } catch (err) {
    // Don't log error if it's just a timeout (backend query endpoint has issues)
    if (err.message !== 'Request timed out') {
      console.error('Failed to fetch current task:', err)
    }
    // Timeout or other error - no current focus task
    currentTask.value = null
  } finally {
    loading.value = false
  }
}

// Fetch on mount
onMounted(() => {
  fetchCurrentTask()
})

// Refresh when navigating to focus view
watch(() => appStore.appState, (newState) => {
  if (newState === 'focus') {
    fetchCurrentTask()
  }
})

const handleMarkComplete = async () => {
  if (!currentTask.value?._id || !appStore.sessionToken) {
    return
  }

  completing.value = true

  try {
    // Backend automatically gets next task and sets it as current focus via synchronization
    await tasksStore.markTaskComplete(appStore.sessionToken, currentTask.value._id)
    console.log('✓ Task marked complete')
    console.log('  Note: Backend automatically set next task as current focus via synchronization')
    
    // Refresh current task (backend may have set a new one)
    await fetchCurrentTask()
    
    // Stay in focus view to show next task (if any)
  } catch (err) {
    console.error('Failed to mark task complete:', err)
  } finally {
    completing.value = false
  }
}


// Helper function to format due date
const formatDueDate = (dueDate) => {
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
  
  // Format date
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()
  const year = date.getFullYear()
  
  if (diffDays === 0) {
    return `Today at ${timeStr}`
  } else if (diffDays === 1) {
    return `Tomorrow at ${timeStr}`
  } else if (diffDays === -1) {
    return `Yesterday at ${timeStr}`
  } else if (diffDays > 0 && diffDays <= 7) {
    return `${date.toLocaleDateString('en-US', { weekday: 'short' })} at ${timeStr}`
  } else {
    return `${month} ${day}, ${year} at ${timeStr}`
  }
}

// Helper function to format duration
const formatDuration = (minutes) => {
  if (!minutes) return ''
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${mins} min`
}
</script>

<style scoped>
.focus-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.focus-container {
  max-width: 920px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.loading-message {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px;
}

.empty-state {
  text-align: center;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  color: #ccc;
  margin-bottom: 8px;
}

.empty-title {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.empty-description {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.empty-hint {
  margin: 0;
  color: #999;
  font-size: 14px;
  max-width: 400px;
}

.empty-state .purple-btn {
  margin-top: 16px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.focus-title {
  margin: 0;
  color: #333;
  font-size: 32px;
  font-weight: 600;
  flex: 1;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  color: #667eea;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.5px;
}

.back-btn:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%);
  border-color: rgba(102, 126, 234, 0.3);
  color: #5568d3;
}

.back-btn:active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
}

.back-btn svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.focus-task-card {
  background: white;
  border-radius: 8px;
  padding: 32px 40px;
  text-align: left;
}

.focus-task-title {
  font-size: 32px;
  color: #333;
  font-weight: 600;
  margin: 0 0 24px 0;
  line-height: 1.3;
  word-wrap: break-word;
  text-align: left;
}

.focus-task-description {
  font-size: 16px;
  color: #666;
  font-weight: 400;
  margin: 0 0 24px 0;
  line-height: 1.5;
  word-wrap: break-word;
  text-align: left;
}

.focus-task-details {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0 16px 0;
  padding: 12px 0;
  position: relative;
}

.focus-task-details::before,
.focus-task-details::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: #e0e0e0;
}

.focus-task-details::before {
  top: 0;
}

.focus-task-details::after {
  bottom: 0;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
  justify-content: flex-start;
}

.detail-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #999;
}

.detail-label {
  font-weight: 600;
  color: #555;
  margin-right: 4px;
}

.detail-value {
  color: #666;
}

.mark-complete-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
