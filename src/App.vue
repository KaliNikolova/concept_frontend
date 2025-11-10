<template>
  <div id="app">
    <AuthView 
      v-if="!appStore.isAuthenticated" 
    />
    <TaskView 
      v-else-if="appStore.appState === 'tasks'"
    />
      <PlanView 
        v-else-if="appStore.appState === 'plan'"
      />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import AuthView from '@/views/AuthView.vue'
import TaskView from '@/views/TaskView.vue'
import PlanView from '@/views/PlanView.vue'
import { useAppStore } from '@/stores/app.js'

const appStore = useAppStore()

// Load user session from localStorage on app mount
onMounted(() => {
  appStore.loadUserSession()
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-content {
  padding: 40px;
  text-align: center;
  color: #2c3e50;
}

.app-content h1 {
  margin-bottom: 20px;
  color: #333;
}

.app-content p {
  color: #666;
  font-size: 18px;
}
</style>
