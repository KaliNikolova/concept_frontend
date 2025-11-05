<template>
  <div class="api-example">
    <h2>API Example</h2>
    
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else-if="user" class="success">
      <p>Logged in as user: {{ user }}</p>
    </div>
    
    <form @submit.prevent="handleLogin" v-if="!user">
      <div>
        <label>Email:</label>
        <input v-model="email" type="email" required />
      </div>
      <div>
        <label>Password:</label>
        <input v-model="password" type="password" required />
      </div>
      <button type="submit">Login</button>
      <button type="button" @click="handleRegister">Register</button>
    </form>
    
    <div v-if="user">
      <button @click="loadTasks">Load Tasks</button>
      <button @click="handleLogout">Logout</button>
    </div>
    
    <div v-if="tasks.length > 0">
      <h3>Tasks:</h3>
      <ul>
        <li v-for="task in tasks" :key="task._id">
          {{ task.description }} - {{ task.status }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import * as userAccount from '@/api/userAccount.js';
import * as tasks from '@/api/tasks.js';

export default {
  name: 'ApiExample',
  data() {
    return {
      email: '',
      password: '',
      displayName: 'Test User',
      user: null,
      loading: false,
      error: null,
      tasks: []
    };
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await userAccount.login(this.email, this.password);
        this.user = response.user;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    async handleRegister() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await userAccount.register(
          this.email,
          this.password,
          this.displayName
        );
        this.user = response.user;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    async handleLogout() {
      this.user = null;
      this.tasks = [];
    },
    
    async loadTasks() {
      if (!this.user) return;
      
      this.loading = true;
      this.error = null;
      
      try {
        const taskList = await tasks.getTasks(this.user);
        this.tasks = taskList || [];
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.api-example {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
}

.loading {
  color: #666;
  font-style: italic;
}

.error {
  color: #d32f2f;
  background-color: #ffebee;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.success {
  color: #2e7d32;
  background-color: #e8f5e9;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

form {
  margin: 20px 0;
}

form div {
  margin: 10px 0;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  padding: 10px 20px;
  margin: 5px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #1565c0;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  padding: 8px;
  margin: 5px 0;
  background-color: #f5f5f5;
  border-radius: 4px;
}
</style>
