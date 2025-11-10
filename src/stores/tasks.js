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
    async fetchTasks(session) {
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
        console.log('Fetching tasks from backend...')
        const response = await tasksApi.getTasks(session)
        console.log('Raw response from getTasks:', response)
        
        // Backend returns: { "tasks": [...] } - object with tasks array
        let tasksArray = []
        if (response?.tasks && Array.isArray(response.tasks)) {
          // Current format: { tasks: [...] }
          console.log('Using format: response.tasks')
          tasksArray = response.tasks
        } else if (Array.isArray(response) && response.length > 0 && response[0].tasks) {
          // Alternative format: [{ tasks: [...] }]
          console.log('Using array format: response[0].tasks')
          tasksArray = response[0].tasks
        } else if (Array.isArray(response)) {
          // Fallback: direct array
          console.log('Using fallback: direct array')
          tasksArray = response
        }
        
        console.log('Extracted tasks array:', tasksArray)
        
        // Always update when we get data from the server
        // Ensure all tasks have a status property
        this.tasks = tasksArray.map(task => ({
          ...task,
          status: task.status || 'TODO'
        }))
        
        console.log('✓ Loaded', this.tasks.length, 'tasks')
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

          async createTask(session, title, description, dueDate, estimatedDuration) {
            if (!session) {
              throw new Error('No session token available')
            }

            try {
              const response = await tasksApi.createTask(session, title, description, dueDate, estimatedDuration)
              
              // If we got a task ID back, add it to the list optimistically
              const taskId = response?.task || response?._id || response?.id
              if (taskId) {
                const newTask = {
                  _id: taskId,
                  owner: session,
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
              this.fetchTasks(session).catch(err => {
                console.error('Failed to refresh tasks after creation:', err)
                // Don't throw - task was created successfully, optimistic update is already shown
              })
            } catch (err) {
              const errorMsg = err.message || 'Failed to create task'
              this.error = errorMsg
              console.error('Failed to create task:', err)
              throw err
            }
          },

    async markTaskComplete(session, taskId) {
      if (!taskId) {
        throw new Error('No task ID provided')
      }

      try {
        await tasksApi.markTaskComplete(session, taskId)
        // Refresh tasks after marking complete
        if (session) {
          await this.fetchTasks(session)
        }
      } catch (err) {
        this.error = err.message || 'Failed to mark task complete'
        throw err
      }
    },

          async updateTask(session, taskId, newTitle, newDescription, newDueDate, newEstimatedDuration) {
            if (!taskId) {
              throw new Error('No task ID provided')
            }

            try {
              await tasksApi.updateTask(session, taskId, newTitle, newDescription, newDueDate, newEstimatedDuration)
              // Refresh tasks after update
              if (session) {
                await this.fetchTasks(session)
              }
            } catch (err) {
              this.error = err.message || 'Failed to update task'
              throw err
            }
          },

    async deleteTask(session, taskId) {
      if (!taskId) {
        throw new Error('No task ID provided')
      }

      try {
        await tasksApi.deleteTask(session, taskId)
        // Refresh tasks after deletion
        if (session) {
          await this.fetchTasks(session)
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

    async reorderTasks(session, newOrder) {
      if (!session) {
        throw new Error('No session token available')
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
        await tasksApi.reorderTasks(session, newOrder)
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

