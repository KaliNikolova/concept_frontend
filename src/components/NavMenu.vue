<template>
  <div class="header-section">
    <nav class="main-nav">
      <button 
        @click="handleNavigateToTasks" 
        class="nav-item"
        :class="{ active: appStore.appState === 'tasks' }"
      >
        My Tasks
      </button>
      <button 
        @click="handleNavigateToPlan" 
        class="nav-item"
        :class="{ active: appStore.appState === 'plan' }"
      >
        Day Plan
      </button>
      <button 
        @click="handleNavigateToFocus" 
        class="nav-item"
        :class="{ active: appStore.appState === 'focus' }"
      >
        Focus
      </button>
    </nav>
    <div 
      class="user-menu-wrapper"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <button 
        class="user-menu-btn"
        :title="displayName || appStore.userSession?.email || 'User'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span class="user-name">{{ displayName || appStore.userSession?.email || 'User' }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="dropdown-arrow">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      <div v-if="showUserMenu" class="user-menu-dropdown">
        <div class="user-menu-info">
          <div class="user-menu-name">{{ displayName || 'User' }}</div>
          <div class="user-menu-email">{{ appStore.userSession?.email || '' }}</div>
        </div>
        <div class="user-menu-divider"></div>
        <button @click="handleLogout" class="user-menu-item logout-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as userAccount from '@/api/userAccount.js'
import * as plannerApi from '@/api/planner.js'
import { useAppStore } from '@/stores/app.js'
import { useTasksStore } from '@/stores/tasks.js'

const appStore = useAppStore()
const tasksStore = useTasksStore()

const displayName = ref('')
const showUserMenu = ref(false)
let hideTimeout = null

const handleNavigateToTasks = () => {
  appStore.setAppState('tasks')
}

const handleNavigateToPlan = () => {
  appStore.setAppState('plan')
}

const handleNavigateToFocus = async () => {
  if (!appStore.userId) {
    return
  }

  // Get current todo tasks - use existing if available, refresh if needed
  let todoTasks = tasksStore.todoTasks
  
  // Only refresh if we don't have tasks or if tasks are stale
  if (todoTasks.length === 0 || !tasksStore.tasks.length) {
    try {
      await tasksStore.fetchTasks(appStore.userId)
      todoTasks = tasksStore.todoTasks
    } catch (err) {
      console.error('Error fetching tasks:', err)
      // Continue with existing tasks
    }
  }

  // Check if we have tasks
  if (todoTasks.length === 0) {
    // No tasks - refresh to make sure, then show error
    try {
      await tasksStore.fetchTasks(appStore.userId)
      todoTasks = tasksStore.todoTasks
    } catch (err) {
      console.error('Error fetching tasks:', err)
    }
    
    if (todoTasks.length === 0) {
      // Still no tasks - navigate to tasks page with error (but don't show loading state)
      tasksStore.error = 'No tasks available to focus on'
      appStore.setAppState('tasks')
      return
    }
  }

  // Plan the day to get the current first task
  try {
    const formattedTasks = todoTasks.map(task => ({
      id: task._id,
      duration: task.estimatedDuration || 60
    }))

    const busySlots = []

    const response = await plannerApi.planDay(
      appStore.userId,
      formattedTasks,
      busySlots
    )

    // Determine which task to focus on
    let focusTask = null
    if (response?.firstTask) {
      focusTask = tasksStore.tasks.find(task => task._id === response.firstTask)
    }
    
    // Fallback to first todo task if planning didn't return a task
    if (!focusTask && todoTasks.length > 0) {
      focusTask = todoTasks[0]
    }

    if (focusTask) {
      // Set focus task and navigate in one go - no intermediate state
      // Use nextTick to ensure state updates happen atomically
      appStore.setCurrentFocusTask(focusTask)
      appStore.setAppState('focus')
    } else {
      // This shouldn't happen, but handle it gracefully
      tasksStore.error = 'No tasks available to focus on'
      appStore.setAppState('tasks')
    }
  } catch (err) {
    console.error('Error planning day:', err)
    // Fallback: use the first todo task if available
    if (todoTasks.length > 0) {
      appStore.setCurrentFocusTask(todoTasks[0])
      appStore.setAppState('focus')
    } else {
      // Last resort - navigate to tasks with error
      appStore.setAppState('tasks')
      tasksStore.error = err.message || 'Failed to plan day'
    }
  }
}

const handleMouseEnter = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  showUserMenu.value = true
}

const handleMouseLeave = () => {
  // Small delay to allow moving mouse to dropdown
  hideTimeout = setTimeout(() => {
    showUserMenu.value = false
  }, 100)
}

const handleLogout = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  showUserMenu.value = false
  appStore.logout()
}

// Load user display name
const loadUserDisplayName = async () => {
  if (!appStore.userId) return
  
  try {
    const profile = await userAccount.getUserProfile(appStore.userId)
    if (profile && profile.length > 0 && profile[0].displayName) {
      displayName.value = profile[0].displayName
    }
  } catch (err) {
    console.error('Failed to load user profile:', err)
  }
}

// Watch for user changes
watch(() => appStore.userId, (newUserId) => {
  if (newUserId) {
    loadUserDisplayName()
  } else {
    displayName.value = ''
  }
})

onMounted(() => {
  if (appStore.userId) {
    loadUserDisplayName()
  }
})

onUnmounted(() => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
  }
})
</script>

<style scoped>
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
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  overflow: hidden;
  pointer-events: auto;
  /* Small gap to prevent immediate closing when moving to dropdown */
  margin-top: 2px;
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
</style>

