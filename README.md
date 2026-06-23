# AIVA AI – Agentic Productivity Assistant

> Built by **AIVA Freelancia** · [aivafreelancia.com](https://aivafreelancia.com)

An intelligent, multi-model AI agent that manages your daily life through natural conversation.

---

## What AIVA AI Does

Talk to AIVA like ChatGPT. It understands intent and acts:

```
"Add task 'Submit report' due Friday at 5 PM, high priority"
  → Creates task with exact details

"Add milk, 2kg rice, and eggs to my shopping list"
  → Adds 3 items to shopping

"Increase my water counter by 2 and remind me at 8 PM to drink more"
  → Increments counter + creates reminder (2 actions, 1 message)

"Show me today's pending tasks"
  → Retrieves and formats your tasks
```

---

## Features

| Module | Description |
|--------|-------------|
| **AI Chat** | Agentic chat with GPT-4o, Gemini 1.5, or Claude 3.5 |
| **Task Manager** | Full CRUD — priorities, categories, due dates, status |
| **Shopping List** | Add/remove/check items. Group by category |
| **Counters** | Water, steps, reading, habits — any custom tracker |
| **Reminders** | One-time or recurring. Push notifications |
| **Dashboard** | Stats overview + quick actions |

---

## Tech Stack

### Web (Next.js)
- **Framework**: Next.js 14 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + custom design system
- **Animation**: Framer Motion
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **AI**: OpenAI GPT-4o · Google Gemini 1.5 · Anthropic Claude 3.5
- **Push**: Firebase Cloud Messaging
- **Deploy**: Vercel

### Mobile (React Native)
- **Framework**: Expo SDK 51
- **Navigation**: React Navigation v6
- **State**: Zustand
- **Push**: Expo Notifications + Firebase

---

## Quick Start

### 1. Clone & Install
```bash
cd "PPA_ AIVA AI – Agentic Productivity Assistant"
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Fill in your Supabase + AI API keys
```

### 3. Set Up Database
1. Create a Supabase project at https://supabase.com
2. Run `src/lib/supabase/schema.sql` in Supabase SQL Editor

### 4. Run
```bash
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── (landing)          page.tsx         ← Landing page
│   │   ├── auth/
│   │   │   ├── login/         page.tsx         ← Auth page
│   │   │   └── callback/      route.ts         ← OAuth callback
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                      ← Sidebar + header
│   │   │   ├── page.tsx                        ← Dashboard
│   │   │   ├── chat/          page.tsx         ← AI Chat
│   │   │   ├── tasks/         page.tsx         ← Task Manager
│   │   │   ├── shopping/      page.tsx         ← Shopping List
│   │   │   ├── counters/      page.tsx         ← Counters
│   │   │   ├── reminders/     page.tsx         ← Reminders
│   │   │   └── settings/      page.tsx         ← Settings
│   │   └── api/
│   │       ├── ai/chat/       route.ts         ← AI agent (streaming)
│   │       ├── tasks/         route.ts         ← Tasks CRUD
│   │       ├── shopping/      route.ts         ← Shopping CRUD
│   │       ├── counters/      route.ts         ← Counters CRUD
│   │       ├── reminders/     route.ts         ← Reminders CRUD
│   │       ├── conversations/ route.ts         ← Chat history
│   │       ├── dashboard/stats/ route.ts       ← Stats API
│   │       └── notifications/ route.ts         ← FCM push
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── agent.ts                        ← Multi-model agent loop
│   │   │   └── tools.ts                        ← 18 tool definitions
│   │   ├── supabase/
│   │   │   ├── client.ts                       ← Browser client
│   │   │   ├── server.ts                       ← Server client + admin
│   │   │   └── schema.sql                      ← Full DB schema
│   │   └── utils.ts                            ← Helpers + config
│   ├── store/
│   │   └── useStore.ts                         ← Zustand global state
│   ├── types/
│   │   └── index.ts                            ← All TypeScript types
│   ├── components/
│   │   └── PwaRegister.tsx                     ← SW registration
│   └── middleware.ts                           ← Auth protection
├── public/
│   ├── manifest.json                           ← PWA manifest
│   └── sw.js                                   ← Service worker
├── mobile/                                     ← React Native app
│   ├── App.tsx
│   ├── src/
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── ChatScreen.tsx
│   │   │   ├── TasksScreen.tsx
│   │   │   ├── ShoppingScreen.tsx
│   │   │   ├── CountersScreen.tsx
│   │   │   └── RemindersScreen.tsx
│   │   └── store/
│   │       └── authStore.ts
│   ├── app.json
│   └── eas.json
├── ARCHITECTURE.md                             ← System design
├── DEPLOYMENT.md                               ← Full deploy guide
└── .env.example                               ← Environment template
```

---

## AI Tool-Calling Architecture

AIVA uses a **multi-model agentic loop** with 18 tools across 4 categories:

```
User Message → AI Model → Tool Call? → Execute → Loop → Response
```

Supports **multiple actions per message**:
```
"Add milk AND remind me at 6 PM"
→ Tool 1: addShoppingItem("milk")
→ Tool 2: createReminder("Buy milk", "6 PM")
→ Response: "Added milk to your list and set a reminder for 6 PM! 🛒🔔"
```

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide covering:
- Supabase setup and schema migration
- Vercel deployment
- Firebase push notifications
- Android APK build with EAS
- Security checklist
- Scaling recommendations

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for:
- System architecture diagram
- AI agentic loop diagram
- Database ERD
- API route map
- SSE streaming protocol
- Mobile architecture
- Phase 2 roadmap

---

## License

Proprietary — AIVA Freelancia © 2026. All rights reserved.
