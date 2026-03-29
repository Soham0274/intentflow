# IntentFlow AI - Recommended Mobile Tech Stack

## Overview

For a mobile-first productivity application with AI features, here's the optimal tech stack that balances developer experience, performance, and feature capabilities.

---

## Frontend (Mobile App)

### Primary Framework: **React Native with Expo**

**Why Expo + React Native?**
- ✅ **Cross-platform**: Single codebase for iOS and Android
- ✅ **Fast development**: Hot reload, managed workflow
- ✅ **Native modules**: Access to device features (camera, notifications, voice)
- ✅ **TypeScript support**: Full type safety
- ✅ **Easy deployment**: EAS Build for app store submissions
- ✅ **Code reuse**: Share logic with Next.js backend (both use React/TypeScript)

**Key Libraries:**
```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "expo-router": "^3.0.0",           // File-based navigation
    "react-native": "0.73.0",
    "react-native-paper": "^5.12.0",   // Material Design UI components
    "zustand": "^4.5.0",                // State management
    "axios": "^1.6.0",                  // API client
    "@tanstack/react-query": "^5.17.0", // Server state management
    "expo-speech": "^11.7.0",           // Voice recording
    "expo-notifications": "^0.27.0",    // Push notifications
    "react-native-fast-image": "^8.6.3" // Optimized images
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0"
  }
}
```

**Installation:**
```bash
npx create-expo-app intentflow-mobile --template tabs
cd intentflow-mobile
npx expo install expo-router react-native-paper zustand axios
```

---

## Backend (API)

### Framework: **Next.js 14+ (App Router)**

**Why Next.js?**
- ✅ **API routes**: Built-in API endpoints in `/app/api`
- ✅ **TypeScript native**: Full type safety
- ✅ **Edge runtime**: Fast responses globally
- ✅ **Easy deployment**: One-click Vercel deployment
- ✅ **Serverless functions**: Auto-scaling without infrastructure management
- ✅ **Same language**: TypeScript on frontend and backend

**Project Structure:**
```
backend/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── tasks/
│   │   ├── nlp/
│   │   └── webhooks/
│   └── layout.tsx
├── lib/
│   ├── supabase.ts
│   ├── openai.ts
│   └── auth.ts
└── middleware.ts
```

**Installation:**
```bash
npx create-next-app@latest intentflow-backend --typescript --app --tailwind
cd intentflow-backend
npm install @supabase/supabase-js openai zod
```

---

## Database

### Primary: **Supabase (PostgreSQL)**

**Why Supabase?**
- ✅ **PostgreSQL**: Industry-standard relational database
- ✅ **Built-in auth**: Google OAuth, JWT tokens handled
- ✅ **Realtime**: WebSocket subscriptions for live updates
- ✅ **Row Level Security**: Database-level authorization
- ✅ **pgvector**: Vector embeddings for semantic search
- ✅ **Free tier**: Generous limits for development
- ✅ **Managed**: No server maintenance

**Key Features Used:**
- Authentication (OAuth, JWT)
- Realtime subscriptions
- PostgreSQL database
- Storage (for file uploads)
- Edge Functions (optional for webhooks)

**Setup:**
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Create migration
supabase migration new initial_schema

# Apply migrations
supabase db push
```

---

## AI & NLP Services

### Primary: **OpenAI API (GPT-4 & Embeddings)**

**Services Used:**
1. **GPT-4**: Intent extraction from natural language
2. **text-embedding-ada-002**: Generate embeddings for semantic search
3. **Whisper API**: (Optional) Voice transcription

**Installation:**
```bash
npm install openai
```

**Cost Optimization:**
- Use GPT-3.5-turbo for development ($0.002/1K tokens vs $0.03/1K for GPT-4)
- Cache repeated requests with Redis/Upstash
- Set token limits on requests
- Use prompt compression techniques

**Alternative**: **Anthropic Claude API** (similar pricing, different strengths)

---

## Workflow Automation

### Tool: **n8n**

**Why n8n?**
- ✅ **Visual workflow builder**: No-code automation
- ✅ **Self-hosted or cloud**: Control over data
- ✅ **200+ integrations**: Gmail, Calendar, Slack, etc.
- ✅ **Webhook support**: Trigger from your app
- ✅ **Schedule triggers**: Cron jobs for reminders

**Deployment Options:**
1. **n8n Cloud**: $20/month, managed (recommended for MVP)
2. **Self-hosted**: Docker on Railway/Render (free tier available)

**Setup (Docker):**
```bash
docker run -d --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

---

## Push Notifications

### Service: **Expo Notifications + Firebase Cloud Messaging**

**Why This Combo?**
- ✅ **Expo**: Easy setup, cross-platform
- ✅ **FCM**: Free, reliable delivery
- ✅ **Local notifications**: On-device scheduling

**Setup:**
```bash
npx expo install expo-notifications expo-device
```

---

## Additional Services

### Authentication
- **Supabase Auth**: Built-in OAuth (Google, Apple)
- JWT token management handled automatically

### Error Tracking
- **Sentry**: Free tier for errors + performance monitoring
```bash
npx expo install sentry-expo
```

### Analytics
- **PostHog**: Open-source, self-hostable analytics
- **Mixpanel**: (Alternative) SaaS analytics

### Caching (Optional)
- **Upstash Redis**: Serverless Redis for API response caching
```bash
npm install @upstash/redis
```

### File Storage
- **Supabase Storage**: Built-in file uploads
- **Cloudinary**: (Alternative) Image optimization

---

## Development Tools

### Code Quality
```json
{
  "devDependencies": {
    "eslint": "^8.56.0",
    "prettier": "^3.1.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0"
  }
}
```

### Testing
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "@testing-library/react-native": "^12.4.0",
    "@testing-library/react-hooks": "^8.0.1",
    "detox": "^20.13.0"
  }
}
```

---

## Deployment

### Mobile App: **Expo EAS Build**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Backend: **Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Database: **Supabase Cloud**
- Already managed, no deployment needed
- Just run migrations via CLI

### n8n: **n8n Cloud or Railway**
- n8n Cloud: Managed, $20/month
- Railway: Free tier, Docker deployment

---

## Environment Variables

### Mobile App (.env)
```bash
EXPO_PUBLIC_API_URL=https://your-backend.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (.env.local)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=sk-your-key
N8N_WEBHOOK_URL=https://your-n8n.app/webhook
```

---

## Cost Breakdown (Monthly)

**Free Tier / Development:**
- Supabase: $0 (free tier - 500MB DB, 1GB storage, 2GB bandwidth)
- Vercel: $0 (hobby plan - 100GB bandwidth)
- Expo: $0 (development builds unlimited)
- OpenAI: ~$5-10 (development usage)
- **Total: ~$5-10/month**

**Production (500 active users):**
- Supabase: $25 (Pro plan - 8GB DB, 100GB storage)
- Vercel: $20 (Pro plan - 1TB bandwidth)
- Expo EAS: $0 (builds as needed, ~$10-20/month)
- n8n: $20 (Cloud plan)
- OpenAI: ~$50-100 (production usage)
- Sentry: $0 (free tier - 5K errors/month)
- **Total: ~$115-185/month**

---

## Alternative Stack (If You Want Native)

### Option 1: Flutter (Dart)
**Pros:**
- Even better performance than React Native
- Beautiful Material Design components
- Single codebase for iOS, Android, Web

**Cons:**
- Different language (Dart, not TypeScript)
- Smaller ecosystem than React Native
- Less code sharing with Next.js backend

### Option 2: Native (Swift + Kotlin)
**Pros:**
- Best possible performance
- Full access to platform APIs
- Platform-specific features

**Cons:**
- Two separate codebases to maintain
- Slower development
- Higher development cost

**Verdict: Stick with React Native + Expo for speed and code reuse.**

---

## Recommended Learning Path

1. **Week 1**: Learn React Native basics + Expo Router
2. **Week 2**: Learn Next.js API routes + Supabase
3. **Week 3**: Integrate OpenAI API for NLP
4. **Week 4**: Build HITL interface + task management
5. **Week 5+**: Add voice, calendar, n8n workflows

---

## Final Recommendation

```
Frontend:  React Native + Expo
Backend:   Next.js 14+
Database:  Supabase (PostgreSQL)
Auth:      Supabase Auth
AI/NLP:    OpenAI GPT-4 API
Workflow:  n8n Cloud
Hosting:   Vercel (backend) + EAS Build (mobile)
Monitoring: Sentry
Analytics: PostHog

Language: TypeScript everywhere
```

This stack gives you:
✅ Fast development velocity
✅ Type safety across the board
✅ Scalable architecture
✅ Low initial costs
✅ Easy deployment
✅ Cross-platform mobile support
✅ Production-ready AI integration

Start building! 🚀
