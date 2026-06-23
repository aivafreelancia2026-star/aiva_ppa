import type { AIToolDefinition } from '@/types'

export const AIVA_TOOLS: AIToolDefinition[] = [
  // ── TASK TOOLS ──────────────────────────────────────────────
  {
    name: 'createTask',
    description: 'Create a new task. Use when the user wants to add, create, or schedule a task.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Optional task description or notes' },
        due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
        due_time: { type: 'string', description: 'Due time in HH:MM format (24h)' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Task priority level' },
        category: { type: 'string', description: 'Task category (e.g., work, personal, health)' },
        reminder_at: { type: 'string', description: 'ISO 8601 datetime for reminder' },
      },
      required: ['title'],
    },
  },
  {
    name: 'updateTask',
    description: 'Update an existing task by ID. Use when user wants to modify, change, or edit a task.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID to update' },
        title: { type: 'string', description: 'New task title' },
        description: { type: 'string', description: 'New description' },
        due_date: { type: 'string', description: 'New due date YYYY-MM-DD' },
        due_time: { type: 'string', description: 'New due time HH:MM' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
        category: { type: 'string', description: 'New category' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteTask',
    description: 'Delete a task by ID. Use when user wants to remove or delete a task.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID to delete' },
        title_search: { type: 'string', description: 'Search by title if ID not known' },
      },
      required: [],
    },
  },
  {
    name: 'getTasks',
    description: 'Retrieve tasks. Use when user asks to see, list, or check tasks.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled', 'all'] },
        due_date: { type: 'string', description: 'Filter by date YYYY-MM-DD, or "today", "tomorrow", "week"' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        category: { type: 'string', description: 'Filter by category' },
        search: { type: 'string', description: 'Search tasks by title or description' },
        limit: { type: 'string', description: 'Max number of tasks to return' },
      },
      required: [],
    },
  },
  {
    name: 'completeTask',
    description: 'Mark a task as completed. Use when user says they finished, done, or completed a task.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task ID' },
        title_search: { type: 'string', description: 'Search by title if ID not known' },
      },
      required: [],
    },
  },
  // ── SHOPPING TOOLS ──────────────────────────────────────────
  {
    name: 'addShoppingItem',
    description: 'Add an item to the shopping list. Use when user wants to add something to buy.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Item name' },
        quantity: { type: 'string', description: 'Quantity as a number' },
        unit: { type: 'string', description: 'Unit (kg, liter, pieces, etc.)' },
        category: { type: 'string', description: 'Item category (groceries, produce, dairy, etc.)' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['name'],
    },
  },
  {
    name: 'updateShoppingItem',
    description: 'Update a shopping item (quantity, category, notes).',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Item ID' },
        name_search: { type: 'string', description: 'Search by name if ID not known' },
        name: { type: 'string', description: 'New item name' },
        quantity: { type: 'string', description: 'New quantity' },
        unit: { type: 'string', description: 'New unit' },
        category: { type: 'string', description: 'New category' },
        is_purchased: { type: 'string', description: 'true or false' },
      },
      required: [],
    },
  },
  {
    name: 'removeShoppingItem',
    description: 'Remove an item from shopping list.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Item ID' },
        name_search: { type: 'string', description: 'Item name to search and remove' },
      },
      required: [],
    },
  },
  {
    name: 'getShoppingList',
    description: 'Get the shopping list. Use when user asks to see what to buy.',
    parameters: {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: ['all', 'pending', 'purchased'], description: 'Filter items' },
        category: { type: 'string', description: 'Filter by category' },
      },
      required: [],
    },
  },
  // ── COUNTER TOOLS ────────────────────────────────────────────
  {
    name: 'createCounter',
    description: 'Create a new counter or tracker (water intake, steps, reading, etc.).',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Counter name' },
        description: { type: 'string', description: 'What this counter tracks' },
        target: { type: 'string', description: 'Daily or total target value' },
        unit: { type: 'string', description: 'Unit (glasses, km, pages, etc.)' },
        icon: { type: 'string', description: 'Emoji icon for the counter' },
        reset_daily: { type: 'string', description: 'true if counter resets every day' },
      },
      required: ['name'],
    },
  },
  {
    name: 'incrementCounter',
    description: 'Increase a counter value. Use when user says increase, add, +1, had, drank, did, etc.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Counter ID' },
        name_search: { type: 'string', description: 'Counter name to search' },
        amount: { type: 'string', description: 'Amount to increment by (default 1)' },
        note: { type: 'string', description: 'Optional note for this entry' },
      },
      required: [],
    },
  },
  {
    name: 'resetCounter',
    description: 'Reset a counter to zero. Use when user says reset, clear, or start over.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Counter ID' },
        name_search: { type: 'string', description: 'Counter name to search' },
      },
      required: [],
    },
  },
  {
    name: 'getCounters',
    description: 'Get all counters or a specific counter value.',
    parameters: {
      type: 'object',
      properties: {
        name_search: { type: 'string', description: 'Filter by counter name' },
      },
      required: [],
    },
  },
  // ── REMINDER TOOLS ───────────────────────────────────────────
  {
    name: 'createReminder',
    description: 'Create a reminder. Use when user says remind me, set a reminder, alert me.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Reminder title / what to be reminded about' },
        description: { type: 'string', description: 'Additional details' },
        remind_at: { type: 'string', description: 'ISO 8601 datetime for the reminder' },
        frequency: {
          type: 'string',
          enum: ['once', 'daily', 'weekly', 'monthly', 'hourly', 'custom'],
          description: 'How often to remind',
        },
        frequency_config: { type: 'string', description: 'JSON with days_of_week array or interval_hours for recurring' },
      },
      required: ['title', 'remind_at'],
    },
  },
  {
    name: 'updateReminder',
    description: 'Update an existing reminder.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Reminder ID' },
        title_search: { type: 'string', description: 'Search by title' },
        title: { type: 'string', description: 'New title' },
        remind_at: { type: 'string', description: 'New datetime' },
        frequency: { type: 'string', enum: ['once', 'daily', 'weekly', 'monthly', 'hourly', 'custom'] },
        is_active: { type: 'string', description: 'true or false' },
      },
      required: [],
    },
  },
  {
    name: 'deleteReminder',
    description: 'Delete a reminder.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Reminder ID' },
        title_search: { type: 'string', description: 'Search by title' },
      },
      required: [],
    },
  },
  {
    name: 'getReminders',
    description: 'Get reminders. Use when user asks about upcoming reminders or schedules.',
    parameters: {
      type: 'object',
      properties: {
        filter: { type: 'string', enum: ['all', 'active', 'upcoming', 'today'] },
      },
      required: [],
    },
  },
]

export function toOpenAITools(tools: AIToolDefinition[]) {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }))
}

export function toGeminiTools(tools: AIToolDefinition[]) {
  return [{
    functionDeclarations: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    })),
  }]
}

export function toAnthropicTools(tools: AIToolDefinition[]) {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters,
  }))
}
