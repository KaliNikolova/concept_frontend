import { defineStore } from 'pinia'
import * as tasksApi from '@/api/tasks.js'

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    loading: false,
    error: null,
    fetching: false // Track if a fetch is in progress
  }),

  getters: {
    todoTasks: (state) => state.tasks.filter(task => task.status === 'TODO'),
    completedTasks: (state) => state.tasks.filter(task => task.status === 'DONE'),
    inProgressTasks: (state) => state.tasks.filter(task => task.status === 'IN_PROGRESS')
  },

  actions: {
    async fetchTasks(userId) {
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
        const taskList = await tasksApi.getTasks(userId)
        
        // Handle different possible response formats
        let tasksArray = []
        if (Array.isArray(taskList)) {
          tasksArray = taskList
        } else if (taskList && Array.isArray(taskList.tasks)) {
          tasksArray = taskList.tasks
        } else if (taskList && Array.isArray(taskList.data)) {
          tasksArray = taskList.data
        } else if (taskList && typeof taskList === 'object') {
          // If it's an object but not an array, try to extract tasks
          console.warn('Unexpected response format from getTasks:', taskList)
          tasksArray = []
        }
        
        // Always update when we get data from the server
        // Ensure all tasks have a status property
        this.tasks = tasksArray.map(task => ({
          ...task,
          status: task.status || 'TODO'
        }))
      } catch (err) {
        const errorMsg = err.message || 'Failed to load tasks'
        
        // If the error is about missing task list, treat it as empty list (no error)
        // This will be fixed in the backend when concepts are synced
        if (errorMsg.includes('No task list found')) {
          this.tasks = []
          this.error = null // Don't show error for missing task list
        } else {
          this.error = errorMsg
          this.tasks = []
        }
      } finally {
        this.loading = false
        this.fetching = false
      }
    },

          async createTask(userId, title, description, dueDate, estimatedDuration) {
            if (!userId) {
              throw new Error('No user ID available')
            }

            try {
              const response = await tasksApi.createTask(userId, title, description, dueDate, estimatedDuration)
              
              // If we got a task ID back, add it to the list optimistically
              const taskId = response?.task || response?._id || response?.id
              if (taskId) {
                const newTask = {
                  _id: taskId,
                  owner: userId,
                  title: title,
                  description: description,
                  dueDate: dueDate,
                  estimatedDuration: estimatedDuration,
                  status: 'TODO'
                }
                // Add to front of list so it appears immediately
                this.tasks = [newTask, ...this.tasks]
              } else {
                console.warn('createTask response did not contain task ID:', response)
              }
              
              // Refresh tasks after creation (in background, don't block on it)
              // This will update the list with the full task data from the server
              this.fetchTasks(userId).catch(err => {
                console.error('Failed to refresh tasks after creation:', err)
                // Don't throw - task was created successfully, optimistic update is already shown
              })
            } catch (err) {
              const errorMsg = err.message || 'Failed to create task'
              
              // If the error is about missing task list, create it automatically and retry
              if (errorMsg.includes('No task list found')) {
                try {
                  // Create the task list first
                  await tasksApi.createUserTasks(userId)
                  // Retry creating the task
                  const response = await tasksApi.createTask(userId, title, description, dueDate, estimatedDuration)
                  
                  // If we got a task ID back, add it to the list optimistically
                  const taskId = response?.task || response?._id || response?.id
                  if (taskId) {
                    const newTask = {
                      _id: taskId,
                      owner: userId,
                      title: title,
                      description: description,
                      dueDate: dueDate,
                      estimatedDuration: estimatedDuration,
                      status: 'TODO'
                    }
                    // Add to front of list so it appears immediately
                    this.tasks = [newTask, ...this.tasks]
                  } else {
                    console.warn('createTask response did not contain task ID:', response)
                  }
                  
                  // Refresh tasks after creation (in background)
                  this.fetchTasks(userId).catch(refreshErr => {
                    console.error('Failed to refresh tasks after creation:', refreshErr)
                  })
                } catch (retryErr) {
                  this.error = retryErr.message || 'Failed to create task list or task'
                  throw retryErr
                }
              } else {
                this.error = errorMsg
                throw err
              }
            }
          },

    async markTaskComplete(taskId, userId) {
      if (!taskId) {
        throw new Error('No task ID provided')
      }

      try {
        await tasksApi.markTaskComplete(taskId)
        // Refresh tasks after marking complete
        if (userId) {
          await this.fetchTasks(userId)
        }
      } catch (err) {
        this.error = err.message || 'Failed to mark task complete'
        throw err
      }
    },

          async updateTask(taskId, newTitle, newDescription, newDueDate, newEstimatedDuration, userId) {
            if (!taskId) {
              throw new Error('No task ID provided')
            }

            try {
              await tasksApi.updateTask(taskId, newTitle, newDescription, newDueDate, newEstimatedDuration)
              // Refresh tasks after update
              if (userId) {
                await this.fetchTasks(userId)
              }
            } catch (err) {
              this.error = err.message || 'Failed to update task'
              throw err
            }
          },

    async deleteTask(taskId, userId) {
      if (!taskId) {
        throw new Error('No task ID provided')
      }

      try {
        await tasksApi.deleteTask(taskId)
        // Refresh tasks after deletion
        if (userId) {
          await this.fetchTasks(userId)
        }
      } catch (err) {
        this.error = err.message || 'Failed to delete task'
        throw err
      }
    },

    clearTasks() {
      this.tasks = []
      this.error = null
    },

    async reorderTasks(userId, newOrder) {
      if (!userId) {
        throw new Error('No user ID available')
      }

      // Store old tasks for potential revert
      const oldTasks = [...this.tasks]
      
      // Optimistically update the local task order first
      const taskMap = new Map(this.tasks.map(task => [task._id, task]))
      const newTasks = newOrder.map(taskId => taskMap.get(taskId)).filter(Boolean)
      
      // Only update if we have all tasks
      if (newTasks.length === this.tasks.length) {
        this.tasks = newTasks
      } else {
        // If we don't have all tasks, don't update - something went wrong
        console.warn('Task count mismatch during reorder, skipping optimistic update')
      }

      try {
        await tasksApi.reorderTasks(userId, newOrder)
        // Order is already updated optimistically, no need to refresh
      } catch (err) {
        // Revert on error
        this.tasks = oldTasks
        this.error = err.message || 'Failed to reorder tasks'
        throw err
      }
    }
  }
})

