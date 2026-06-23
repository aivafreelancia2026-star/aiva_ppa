# AIVA AI – System Architecture

## High-Level Architecture

```
                           ┌─────────────────────────────┐
                           │         User Devices         │
                           │   Browser  ·  Android App   │
                           └──────────┬──────────────────┘
                                      │ HTTPS
                           ┌──────────▼──────────────────┐
                           │       Vercel Edge            │
                           │   Next.js 14 App Router      │
                           │                              │
                           │  ┌─────────┐ ┌───────────┐  │
                           │  │  Pages  │ │ API Routes│  │
                           │  │ (React) │ │(Node.js)  │  │
                           │  └────┬────┘ └─────┬─────┘  │
                           └───────┼────────────┼────────┘
                                   │            │
              ┌────────────────────┘            └──────────────────────┐
              │                                                         │
   ┌──────────▼──────────┐                             ┌───────────────▼──────────┐
   │    Supabase          │                             │       AI Layer            │
   │                      │                             │                           │
   │  ┌────────────────┐  │                             │  ┌──────────────────┐   │
   │  │  PostgreSQL DB  │  │                             │  │  AIVA Agent Loop │   │
   │  │                │  │                             │  │  (Tool Calling)  │   │
   │  │  tasks          │  │                             │  └────────┬─────────┘   │
   │  │  shopping_items │  │                             │           │              │
   │  │  counters       │  │                             │  ┌────────▼─────────┐   │
   │  │  reminders      │  │                             │  │  Model Router    │   │
   │  │  conversations  │  │                             │  │  OpenAI          │   │
   │  │  messages       │  │                             │  │  Google Gemini   │   │
   │  └────────────────┘  │                             │  │  Anthropic Claude│   │
   │                       │                             │  └──────────────────┘   │
   │  ┌────────────────┐   │                             └──────────────────────────┘
   │  │  Auth (JWT)    │   │
   │  │  Row Level Sec │   │
   │  └────────────────┘   │
   └───────────────────────┘
              │
   ┌──────────▼──────────┐
   │  Firebase FCM       │
   │  Push Notifications │
   └─────────────────────┘
```

---

## AI Agentic Architecture

```
User Message
     │
     ▼
┌──────────────────────────────────────────────┐
│                AIVA Agent Loop               │
│                                              │
│  1. Build message history                    │
│  2. Attach tool definitions (18 tools)       │
│  3. Call AI model (streaming)                │
│     │                                        │
│     ├── Text chunk? → Stream to client       │
│     │                                        │
│     └── Tool call detected?                  │
│              │                               │
│              ▼                               │
│     ┌────────────────────┐                   │
│     │   executeTool()    │                   │
│     │                    │                   │
│     │  createTask()      │                   │
│     │  updateTask()      │                   │
│     │  getTasks()        │                   │
│     │  deleteTask()      │──→ Supabase DB   │
│     │  completeTask()    │                   │
│     │  addShoppingItem() │                   │
│     │  incrementCounter()│                   │
│     │  createReminder()  │                   │
│     │  ... 10 more tools │                   │
│     └────────────────────┘                   │
│              │                               │
│              ▼                               │
│     Tool result → append to history          │
│     Loop again (next AI call)                │
│                                              │
│  Until: no more tool calls → done            │
└──────────────────────────────────────────────┘
```

### Tool Categories

| Category | Tools | Operations |
|----------|-------|------------|
| Tasks | 5 tools | Create, Update, Delete, Complete, Get |
| Shopping | 4 tools | Add, Update, Remove, Get |
| Counters | 4 tools | Create, Increment, Reset, Get |
| Reminders | 4 tools | Create, Update, Delete, Get |

---

## Database Schema (ERD)

```
users
├── id (UUID PK)
├── email
├── name
├── avatar_url
├── preferred_model
├── fcm_token
└── created_at

tasks (user_id → users.id)
├── id, user_id
├── title, description
├── due_date, due_time
├── priority (low/medium/high/urgent)
├── status (pending/in_progress/completed/cancelled)
├── category
└── reminder_at

shopping_items (user_id → users.id)
├── id, user_id
├── name, quantity, unit
├── category
├── is_purchased
└── notes

counters (user_id → users.id)
├── id, user_id
├── name, description
├── value, target, unit
├── icon, color
└── reset_daily

counter_logs (counter_id → counters.id)
├── id, counter_id, user_id
├── delta, value_after
└── note

reminders (user_id → users.id)
├── id, user_id
├── title, description
├── remind_at
├── frequency + frequency_config (JSONB)
└── is_active

conversations (user_id → users.id)
├── id, user_id
├── title, model
└── timestamps

messages (conversation_id → conversations.id)
├── id, conversation_id, user_id
├── role (user/assistant/system)
├── content
├── tool_calls (JSONB)
└── tool_results (JSONB)
```

---

## API Route Map

```
GET  /api/tasks               → list tasks
POST /api/tasks               → create task
PATCH /api/tasks/[id]         → update task
DELETE /api/tasks/[id]        → delete task

GET  /api/shopping            → list shopping items
POST /api/shopping            → add item
PATCH /api/shopping/[id]      → update item
DELETE /api/shopping/[id]     → remove item

GET  /api/counters            → list counters
POST /api/counters            → create counter
PATCH /api/counters/[id]      → update counter
DELETE /api/counters/[id]     → delete counter

GET  /api/reminders           → list reminders
POST /api/reminders           → create reminder
PATCH /api/reminders/[id]     → update reminder
DELETE /api/reminders/[id]    → delete reminder

POST /api/ai/chat             → AI chat (SSE streaming)

GET  /auth/callback           → Supabase OAuth callback
```

---

## Streaming Chat Protocol (SSE)

Client sends `POST /api/ai/chat` with:
```json
{
  "message": "Add milk to shopping",
  "messages": [...history],
  "model": "gpt-4o-mini",
  "userId": "uuid"
}
```

Server streams `text/event-stream`:
```
data: {"conversationId": "uuid"}

data: {"content": "I've "}
data: {"content": "added "}
data: {"content": "milk "}
data: {"content": "to your shopping list! 🛒"}

data: {"done": true}

data: [DONE]
```

---

## Authentication Flow

```
1. User visits /dashboard
2. Middleware checks Supabase session cookie
3. No session → redirect to /auth/login
4. User signs in (email or Google OAuth)
5. Supabase issues JWT + refresh token
6. Middleware stores session in cookie
7. Subsequent requests authenticated via cookie
8. RLS policies enforce user can only access own data
```

---

## Frontend Page Structure

```
/ (landing page)
├── /auth/login       (login + signup)
├── /auth/callback    (OAuth callback handler)
└── /dashboard        (protected)
    ├── /             (dashboard overview)
    ├── /chat         (AI chat interface)
    ├── /tasks        (task manager)
    ├── /shopping     (shopping list)
    ├── /counters     (counter trackers)
    ├── /reminders    (reminder manager)
    └── /settings     (user preferences)
```

---

## Mobile Architecture (React Native / Expo)

```
App.tsx (root)
├── Auth Gate (Supabase session)
│   ├── LoginScreen (email + Google)
│   └── AppTabs (authenticated)
│       ├── DashboardScreen (stats overview)
│       ├── ChatScreen (AI agent via API)
│       ├── TasksScreen (list + complete)
│       ├── ShoppingScreen (list + toggle)
│       ├── CountersScreen (tap to increment)
│       └── RemindersScreen (view + toggle)
│
└── Expo Notifications (push)
    └── registerForPushNotifications()
```

---

## Phase 2 Roadmap

| Feature | Description | Priority |
|---------|-------------|----------|
| Google Calendar sync | Bidirectional task/event sync | High |
| Voice assistant | Speech-to-text commands | High |
| WhatsApp bot | Chat with AIVA via WhatsApp | Medium |
| AI daily planner | Auto-generate daily plan from tasks | Medium |
| Team collaboration | Shared lists and tasks | Medium |
| Smart scheduling | AI suggests optimal task times | Low |
| Offline mode | Service worker caching | Low |
| Apple Watch app | Counter + reminder quick actions | Low |
