# Prototype Plan

Based on the user journey, here are the minimum features needed for the one-week prototype:

## Core Features Required

### 1. Task Management
- **Add tasks** - User can quickly add tasks with descriptions
- **Task list view** - Display all tasks the user has added
- **Mark task as complete** - Ability to mark tasks as done

### 2. Plan My Day Functionality
- **"Plan my Day" button** - Central button to trigger day planning
- **Integration with Planner API** - Calls `/api/Planner/planDay` with user's tasks and schedule
- **Processing feedback** - Show that the app is processing (loading state)

### 3. Focus Screen
- **Single task display** - Show one clear directive at a time
- **Task description** - Display what needs to be worked on
- **Auto-update on completion** - When a task is marked done, automatically show the next task

### 4. Basic User Flow
- User authentication (login/register) - to identify the user
- Session management - maintain logged-in state

## Minimum Implementation

### Components Needed:
1. **Login/Register Screen** - Basic authentication
2. **Task List View** - Where tasks are added and displayed
3. **Plan My Day Button** - Triggers planning
4. **Focus Screen** - Shows the current task
5. **Task Completion Action** - Button/method to mark task as done

### API Integration Required:
- `userAccount.login()` / `userAccount.register()` - Authentication
- `tasks.createTask()` - Add tasks
- `tasks.getTasks()` - Display task list
- `planner.planDay()` - Generate day plan
- `focus.setCurrentTask()` - Set focus task after planning
- `focus.getCurrentTask()` - Display current focus task
- `tasks.markTaskComplete()` - Mark task as done
- `planner.getNextTask()` - Get next task after completion
- `focus.setCurrentTask()` - Update focus to next task

### User Flow:
1. User logs in/registers
2. User adds tasks ("Finish 6.1040 pset", "Prep for club meeting")
3. User clicks "Plan my Day" button
4. App calls Planner API with tasks
5. App sets first task as focus
6. Focus screen displays "Work on 6.1040 pset"
7. User marks task as complete
8. App gets next task from Planner
9. Focus screen updates to show "Prep for club meeting"

## Nice-to-Have (Can be rough/simplified):
- Schedule/busy slot management (can use empty array for prototype)
- Task due dates and durations (can use defaults)
- Task reordering
- Task editing
- Pretty styling (can be minimal/basic)

## Priority Order:
1. **Authentication** - Must have to identify user
2. **Add Tasks** - Core functionality
3. **Plan My Day** - Core differentiator
4. **Focus Screen** - Core differentiator
5. **Mark Complete + Auto-update** - Completes the journey
