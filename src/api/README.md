# API Services

This directory contains API service modules for interacting with the backend API.

## Structure

- `client.js` - Base API client utility
- `userAccount.js` - User authentication and profile management
- `tasks.js` - Task management
- `schedule.js` - Schedule and busy slot management
- `planner.js` - Task planning and scheduling
- `focus.js` - Current focus task management
- `index.js` - Central export point

## Usage

### Import Services

```javascript
// Import individual services
import { userAccount, tasks, schedule, planner, focus } from '@/api';

// Or import specific functions
import { register, login } from '@/api/userAccount';
import { createTask, getTasks } from '@/api/tasks';
```

### Example: User Authentication

```javascript
import * as userAccount from '@/api/userAccount';

// Register a new user
try {
  const response = await userAccount.register(
    'user@example.com',
    'password123',
    'John Doe'
  );
  console.log('User ID:', response.user);
} catch (error) {
  console.error('Registration failed:', error.message);
}

// Login
try {
  const response = await userAccount.login('user@example.com', 'password123');
  console.log('Logged in as user:', response.user);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Example: Task Management

```javascript
import * as tasks from '@/api/tasks';

// Create a task
const taskResponse = await tasks.createTask(
  userId,
  'Complete project documentation',
  new Date('2024-12-31'),
  120 // 2 hours in minutes
);

// Get all tasks
const allTasks = await tasks.getTasks(userId);
console.log('Tasks:', allTasks);

// Mark task as complete
await tasks.markTaskComplete(taskId);
```

### Example: Schedule Management

```javascript
import * as schedule from '@/api/schedule';

// Block time
await schedule.blockTime(
  userId,
  new Date('2024-01-15T09:00:00'),
  new Date('2024-01-15T10:30:00'),
  'Team Meeting'
);

// Get all busy slots
const slots = await schedule.getSlots(userId);
```

### Example: Planner

```javascript
import * as planner from '@/api/planner';

// Plan a day
const planResponse = await planner.planDay(
  userId,
  [
    { id: taskId1, duration: 60 },
    { id: taskId2, duration: 90 }
  ],
  [
    { start: new Date('2024-01-15T14:00:00'), end: new Date('2024-01-15T15:00:00') }
  ]
);

console.log('First task:', planResponse.firstTask);
```

### Example: Focus

```javascript
import * as focus from '@/api/focus';

// Set current focus task
await focus.setCurrentTask(userId, taskId);

// Get current focus task
const currentTask = await focus.getCurrentTask(userId);
console.log('Current task:', currentTask.task);

// Clear focus
await focus.clearCurrentTask(userId);
```

## Configuration

The API base URL is configured in `src/config.js` and can be overridden using the `VITE_API_BASE_URL` environment variable. Default is `http://localhost:8000/api`.

## Error Handling

All API functions throw errors when requests fail. Always wrap API calls in try-catch blocks:

```javascript
try {
  const result = await userAccount.login(email, password);
  // Handle success
} catch (error) {
  // Handle error
  console.error('API Error:', error.message);
}
```
