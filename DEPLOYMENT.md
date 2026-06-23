# AIVA AI – Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AIVA AI Stack                         │
├────────────────┬─────────────────┬──────────────────────────┤
│   Frontend     │    Backend       │    Services               │
│   Next.js 14   │   API Routes     │   Supabase (Postgres)     │
│   TypeScript   │   Edge Runtime   │   Supabase Auth           │
│   Tailwind CSS │   Streaming SSE  │   Supabase RLS            │
│   Framer Motion│   AI Agent Loop  │   OpenAI / Gemini / Claude│
│                │                  │   Firebase FCM (Push)     │
└────────────────┴─────────────────┴──────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      Mobile (React Native)                    │
│   Expo SDK 51 · React Navigation · Supabase JS · FCM         │
└──────────────────────────────────────────────────────────────┘
```

---

## 1. Prerequisites

- Node.js 20+
- npm / pnpm / yarn
- A [Supabase](https://supabase.com) project (free tier works)
- At least one AI API key (OpenAI, Google AI, or Anthropic)
- [Vercel](https://vercel.com) account for web deployment
- [Expo](https://expo.dev) account for mobile (optional)

---

## 2. Supabase Setup

### 2.1 Create Project
1. Go to https://supabase.com → New Project
2. Choose region closest to your users
3. Copy **Project URL** and **anon key** from Settings → API

### 2.2 Run Schema
1. Go to SQL Editor in Supabase dashboard
2. Paste the entire contents of `src/lib/supabase/schema.sql`
3. Click **Run**

### 2.3 Enable Google OAuth (optional)
1. Supabase Dashboard → Authentication → Providers → Google
2. Enable Google, paste your Google OAuth client ID + secret
3. Add `https://your-project.supabase.co/auth/v1/callback` to Google Console

### 2.4 Row Level Security
The schema already enables RLS. Verify in Table Editor → each table shows **RLS enabled**.

---

## 3. Web App (Next.js) – Local Development

```bash
cd "PPA_ AIVA AI – Agentic Productivity Assistant"

# Install dependencies
npm install

# Create env file
cp .env.example .env.local
# Fill in your keys in .env.local

# Run dev server
npm run dev
# → http://localhost:3000
```

### Required `.env.local` values

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# At least one of these:
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 4. Web App – Production Deployment (Vercel)

### 4.1 Push to GitHub
```bash
git init
git add .
git commit -m "feat: AIVA AI PPA initial commit"
git remote add origin https://github.com/your-org/aiva-ppa.git
git push -u origin main
```

### 4.2 Deploy to Vercel
```bash
npx vercel --prod
# OR connect via Vercel dashboard → Import Git Repository
```

### 4.3 Set Environment Variables in Vercel
Go to Vercel Dashboard → Project → Settings → Environment Variables. Add all variables from `.env.example`.

### 4.4 Vercel Configuration
The app uses Next.js API routes with streaming (SSE). Vercel handles this natively with Edge or Node.js runtime. If you hit the 10s limit on hobby plan, upgrade to Pro or use the `maxDuration = 60` already set in the chat route.

---

## 5. Custom Domain

In Vercel Dashboard → Project → Domains:
```
aiva-ppa.aivafreelancia.com   →  your Vercel deployment
```

Update Supabase Auth → URL Configuration → Site URL:
```
https://aiva-ppa.aivafreelancia.com
```

Add redirect URLs:
```
https://aiva-ppa.aivafreelancia.com/auth/callback
http://localhost:3000/auth/callback
```

---

## 6. Firebase Push Notifications Setup

### 6.1 Create Firebase Project
1. https://console.firebase.google.com → Add Project
2. Add a Web App → copy config
3. Cloud Messaging → Generate VAPID key

### 6.2 Service Account
Firebase Console → Settings → Service Accounts → Generate new private key. Save as JSON.

### 6.3 Add to Environment Variables
```env
FIREBASE_PROJECT_ID=aiva-ppa
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@aiva-ppa.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=aiva-ppa.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=aiva-ppa
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNxxx...
```

---

## 7. Mobile App (Expo / React Native)

### 7.1 Install Dependencies
```bash
cd mobile
npm install

# Install Expo CLI globally if not installed
npm install -g eas-cli
```

### 7.2 Create `mobile/.env`
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=https://aiva-ppa.aivafreelancia.com
```

### 7.3 Run on Android Emulator
```bash
npx expo start
# Press 'a' for Android emulator
# Press 'i' for iOS simulator
# Scan QR with Expo Go app for physical device
```

### 7.4 Build APK (Android)

```bash
# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Google Play Store
eas build --platform android --profile production
```

### 7.5 `eas.json` Configuration
```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

---

## 8. AI Model API Keys

### OpenAI
1. https://platform.openai.com/api-keys → Create key
2. Models used: `gpt-4o`, `gpt-4o-mini`
3. Cost estimate: ~$0.15-$0.60 / 1M tokens

### Google AI (Gemini)
1. https://aistudio.google.com/app/apikey
2. Models: `gemini-1.5-pro`, `gemini-1.5-flash`
3. Free tier: 60 req/min, 1500 req/day

### Anthropic (Claude)
1. https://console.anthropic.com → API Keys
2. Models: `claude-3-5-sonnet-20241022`, `claude-3-haiku-20240307`
3. Cost: ~$3-$15 / 1M tokens

---

## 9. Database Backup

Enable automatic backups in Supabase Dashboard → Settings → Database → Backups.

For manual export:
```bash
pg_dump "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" \
  --no-owner --no-acl > aiva_backup.sql
```

---

## 10. Monitoring & Observability

### Error Tracking (Sentry)
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Add to `next.config.ts`:
```ts
import { withSentryConfig } from '@sentry/nextjs'
export default withSentryConfig(nextConfig, { silent: true })
```

### Analytics (Vercel Analytics)
Already integrated via Vercel — enable in Project → Analytics tab.

### Logs
```bash
# View Vercel function logs in real-time
vercel logs --follow
```

---

## 11. Security Checklist

- [x] Supabase RLS enabled on all tables
- [x] Service role key only on server-side (API routes)
- [x] Auth middleware protects `/dashboard` routes
- [x] Input sanitization via Zod (add validation layer)
- [ ] Rate limiting on `/api/ai/chat` (add Upstash Redis)
- [ ] CORS headers configured
- [ ] API keys never exposed to client

### Rate Limiting (Optional — Upstash Redis)
```bash
npm install @upstash/ratelimit @upstash/redis
```

Add to `/api/ai/chat/route.ts`:
```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 req/min
})

const { success } = await ratelimit.limit(user.id)
if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
```

---

## 12. Scaling Considerations

| Users     | Recommendation                                      |
|-----------|-----------------------------------------------------|
| 0–1K      | Vercel Hobby + Supabase Free tier                   |
| 1K–10K    | Vercel Pro + Supabase Pro ($25/mo)                  |
| 10K–100K  | Vercel Team + Supabase Pro + Redis caching          |
| 100K+     | Custom infrastructure, pgBouncer, CDN for assets    |

---

## 13. Environment Summary

| Variable | Where | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | ✅ |
| `OPENAI_API_KEY` | Server only | One of three |
| `GOOGLE_AI_API_KEY` | Server only | One of three |
| `ANTHROPIC_API_KEY` | Server only | One of three |
| Firebase keys | Client + Server | For push notifs |
