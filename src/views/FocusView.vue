<template>
  <div class="focus-view">
    <div class="focus-container">
      <NavMenu />

      <div class="focus-task-card">
        <h2 class="focus-task-title">{{ appStore.currentFocusTask?.title || appStore.currentFocusTask?.description || 'No task selected' }}</h2>
        
        <div class="focus-task-details">
          <div v-if="appStore.currentFocusTask?.dueDate" class="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span class="detail-label">Due:</span>
            <span class="detail-value">{{ formatDueDate(appStore.currentFocusTask.dueDate) }}</span>
          </div>
          
          <div v-if="appStore.currentFocusTask?.estimatedDuration" class="detail-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span class="detail-label">Duration:</span>
            <span class="detail-value">{{ formatDuration(appStore.currentFocusTask.estimatedDuration) }}</span>
          </div>
        </div>
        
        <p v-if="appStore.currentFocusTask?.description && appStore.currentFocusTask?.title" class="focus-task-description">{{ appStore.currentFocusTask.description }}</p>
        
        <div class="mark-complete-container">
          <button @click="handleMarkComplete" class="purple-btn mark-complete-btn" :disabled="completing">
            {{ completing ? 'Completing...' : 'Mark Complete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { useTasksStore } from '@/stores/tasks.js'
import NavMenu from '@/components/NavMenu.vue'

const appStore = useAppStore()
const tasksStore = useTasksStore()

const completing = ref(false)

const handleMarkComplete = async () => {
  const task = appStore.currentFocusTask
  if (!task?._id || !appStore.userId) {
    return
  }

  completing.value = true

  try {
    await tasksStore.markTaskComplete(task._id, appStore.userId)
    
    // After marking complete, go back to tasks view
    appStore.setAppState('tasks')
    appStore.setCurrentFocusTask(null)
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
