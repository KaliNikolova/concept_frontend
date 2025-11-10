<template>
  <div class="auth-view">
    <div class="auth-container">
      <h1 class="auth-title">{{ isRegisterMode ? 'Create Account' : 'Welcome Back' }}</h1>
      
      <div class="mode-toggle">
        <button 
          :class="['mode-btn', { active: !isRegisterMode }]"
          @click="isRegisterMode = false"
        >
          Login
        </button>
        <button 
          :class="['mode-btn', { active: isRegisterMode }]"
          @click="isRegisterMode = true"
        >
          Register
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="isRegisterMode" class="form-group">
          <label for="displayName">Display Name</label>
          <input
            id="displayName"
            v-model="displayName"
            type="text"
            placeholder="Enter your display name"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Enter your password"
            required
          />
        </div>

        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="purple-btn submit-btn"
          :disabled="loading"
        >
          {{ loading ? 'Processing...' : (isRegisterMode ? 'Register' : 'Login') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import * as userAccount from '@/api/userAccount.js'
import { useAppStore } from '@/stores/app.js'

const appStore = useAppStore()

const isRegisterMode = ref(false)
const email = ref('')
const password = ref('')
const displayName = ref('')
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

const handleSubmit = async () => {
  error.value = ''
  successMessage.value = ''
  loading.value = true

  try {
    let response
    
    if (isRegisterMode.value) {
      // Register new user
      if (!displayName.value.trim()) {
        error.value = 'Display name is required'
        loading.value = false
        return
      }
      response = await userAccount.register(
        email.value,
        password.value,
        displayName.value
      )
      
      // Show success message and switch to login mode
      successMessage.value = 'Registration successful! Please login.'
      isRegisterMode.value = false
      
      // Clear password and display name, keep email for convenience
      password.value = ''
      displayName.value = ''
      
      // Don't set user session - stay on auth view
    } else {
      // Login existing user
      response = await userAccount.login(
        email.value,
        password.value
      )

      // Set session token in store (user data fetched from backend when needed)
      appStore.setSessionToken(response.session)
      console.log('✓ Logged in successfully')

      // Reset form
      email.value = ''
      password.value = ''
      displayName.value = ''
    }
  } catch (err) {
    // Parse error message for better user feedback on login
    if (!isRegisterMode.value) {
      const errorMsg = err.message || ''
      const lowerError = errorMsg.toLowerCase()
      
      if (lowerError.includes('user not found') || 
          lowerError.includes('user does not exist') ||
          lowerError.includes('no user found') ||
          lowerError.includes('email not found')) {
        error.value = 'User not found. Please check your email or register.'
      } else if (lowerError.includes('password') && 
                 (lowerError.includes('incorrect') || 
                  lowerError.includes('wrong') || 
                  lowerError.includes('invalid'))) {
        error.value = 'Incorrect password. Please try again.'
      } else if (lowerError.includes('authentication') || 
                 lowerError.includes('login failed')) {
        error.value = 'Login failed. Please check your email and password.'
      } else {
        error.value = errorMsg || 'An error occurred. Please try again.'
      }
    } else {
      error.value = err.message || 'An error occurred. Please try again.'
    }
    successMessage.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-container {
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.auth-title {
  text-align: center;
  margin: 0 0 30px 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.mode-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background: #f5f5f5;
  padding: 4px;
  border-radius: 8px;
}

.mode-btn {
  flex: 1;
  padding: 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  transition: all 0.2s ease;
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.5);
}

.mode-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.auth-form {
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

.form-group input {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input::placeholder {
  color: #999;
}

.success-message {
  padding: 12px;
  background: #e8f5e9;
  border: 1px solid #4caf50;
  border-radius: 8px;
  color: #2e7d32;
  font-size: 14px;
  text-align: center;
}

.error-message {
  padding: 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
  font-size: 14px;
  text-align: center;
}

/* .submit-btn now uses shared .purple-btn class from style.css */
</style>