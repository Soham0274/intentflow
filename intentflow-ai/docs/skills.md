# IntentFlow AI - Development Skills & Best Practices

This document contains essential patterns, best practices, and solutions for building IntentFlow AI with React Native, Next.js, Supabase, and AI integrations.

---

## Table of Contents

1. [React Native + Expo Patterns](#react-native--expo-patterns)
2. [Next.js API Routes Best Practices](#nextjs-api-routes-best-practices)
3. [Supabase Database Patterns](#supabase-database-patterns)
4. [OpenAI Integration Patterns](#openai-integration-patterns)
5. [Authentication Flow](#authentication-flow)
6. [State Management with Zustand](#state-management-with-zustand)
7. [Error Handling Strategies](#error-handling-strategies)
8. [Performance Optimization](#performance-optimization)
9. [Testing Patterns](#testing-patterns)
10. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## React Native + Expo Patterns

### File-Based Routing with Expo Router

Expo Router uses the file system for navigation. Understand these patterns:

```
app/
├── (tabs)/              # Tab navigator group
│   ├── _layout.tsx      # Tab navigator configuration
│   ├── index.tsx        # First tab (Dashboard)
│   └── tasks.tsx        # Second tab (Tasks)
├── (auth)/              # Auth stack group
│   ├── _layout.tsx      # Auth layout
│   └── login.tsx        # Login screen
├── task/
│   └── [id].tsx         # Dynamic route for task/:id
├── _layout.tsx          # Root layout
└── +not-found.tsx       # 404 screen
```

**Layout Pattern:**
```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

### Safe Area Handling

**ALWAYS use SafeAreaView for proper notch/status bar handling:**

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Your content */}
    </SafeAreaView>
  );
}
```

### FlatList Performance

**NEVER use `.map()` for lists > 20 items. Always use FlatList:**

```typescript
import { FlatList } from 'react-native';

// ❌ BAD - Renders all items upfront
{tasks.map(task => <TaskCard key={task.id} task={task} />)}

// ✅ GOOD - Virtualizes list, only renders visible items
<FlatList
  data={tasks}
  renderItem={({ item }) => <TaskCard task={item} />}
  keyExtractor={(item) => item.id}
  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  windowSize={10}
  // Add these for better UX
  refreshing={refreshing}
  onRefresh={handleRefresh}
  ListEmptyComponent={<EmptyState />}
  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
/>
```

### Keyboard Handling

**Always handle keyboard for input screens:**

```typescript
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

export default function InputScreen() {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <TextInput placeholder="Enter task..." />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

### Voice Recording with expo-speech

```typescript
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

export function useVoiceRecording() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcription, setTranscription] = useState('');
  
  async function startRecording() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }
  
  async function stopRecording() {
    if (!recording) return;
    
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    
    // Send to backend for transcription (Whisper API or similar)
    const formData = new FormData();
    formData.append('audio', {
      uri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);
    
    const response = await api.post('/nlp/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    setTranscription(response.data.text);
    setRecording(null);
  }
  
  return { recording, transcription, startRecording, stopRecording };
}
```

### Push Notifications Setup

```typescript
// services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return null;
  }
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // Send token to backend
  await api.post('/notifications/register', { token });
  
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  
  return token;
}
```

---

## Next.js API Routes Best Practices

### Standard Route Pattern

```typescript
// app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use service key for server-side
);

const TaskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  priority: z.enum(['high', 'medium', 'low']),
});

// GET /api/tasks
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validated = TaskCreateSchema.parse(body);
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...validated, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('POST /api/tasks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
```

### Authentication Helper

```typescript
// lib/auth.ts
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.substring(7);
  
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!)
    );
    
    return payload.sub || null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
```

### Rate Limiting Pattern

```typescript
// lib/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';

const rateLimit = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  request: NextRequest,
  limit: number = 100,
  window: number = 60000 // 1 minute
): NextResponse | null {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  
  const current = rateLimit.get(ip);
  
  if (!current || now > current.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + window });
    return null;
  }
  
  if (current.count >= limit) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  
  current.count++;
  return null;
}

// Usage in route
export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;
  
  // Continue with normal logic
}
```

### CORS Configuration for Mobile

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Allow mobile app origins
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:8081', // Expo dev
    'exp://192.168.1.0:8081', // Expo on physical device
    'https://your-production-domain.com',
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## Supabase Database Patterns

### Row Level Security (RLS) Policies

**ALWAYS enable RLS on all tables. Never expose data without policies.**

```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

### Realtime Subscriptions

```typescript
// Hook for realtime task updates
import { useEffect, useState } from 'react';
import { supabase } from '@/services/api';

export function useRealtimeTasks(userId: string) {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    // Initial fetch
    loadTasks();
    
    // Subscribe to changes
    const subscription = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) => (t.id === payload.new.id ? payload.new : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);
  
  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    setTasks(data || []);
  }
  
  return tasks;
}
```

### Vector Search with pgvector

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE task_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE UNIQUE,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast similarity search
CREATE INDEX ON task_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Function to find similar tasks
CREATE OR REPLACE FUNCTION find_similar_tasks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  task_id UUID,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    task_id,
    1 - (embedding <=> query_embedding) as similarity
  FROM task_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

**Using vector search in API:**

```typescript
// app/api/tasks/similar/route.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const { query } = await request.json();
  
  // Generate embedding for query
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  });
  
  const embedding = embeddingResponse.data[0].embedding;
  
  // Find similar tasks
  const { data } = await supabase.rpc('find_similar_tasks', {
    query_embedding: embedding,
    match_threshold: 0.8,
    match_count: 5,
  });
  
  return NextResponse.json({ success: true, data });
}
```

### Database Migrations Pattern

```bash
# Initialize Supabase locally
supabase init

# Create migration
supabase migration new add_task_embeddings

# Edit migration file
# supabase/migrations/XXXXXX_add_task_embeddings.sql

# Apply migration
supabase db push
```

---

## OpenAI Integration Patterns

### Streaming Responses (for Chat Features)

```typescript
// app/api/nlp/stream/route.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const { input } = await request.json();
  
  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: input }],
    stream: true,
  });
  
  const encoder = new TextEncoder();
  const customStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });
  
  return new Response(customStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

### Caching OpenAI Responses

```typescript
// lib/openai-cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function cachedCompletion(
  input: string,
  systemPrompt: string
): Promise<string> {
  const cacheKey = `nlp:${hashString(input + systemPrompt)}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return cached as string;
  
  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ],
  });
  
  const result = completion.choices[0].message.content;
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, result);
  
  return result;
}
```

### Cost Optimization with Token Counting

```typescript
import { encode } from 'gpt-tokenizer';

export function estimateCost(input: string, model: string = 'gpt-4') {
  const tokens = encode(input).length;
  
  const pricing = {
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
    'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 },
  };
  
  const price = pricing[model as keyof typeof pricing];
  const estimatedOutputTokens = tokens * 1.5; // Rough estimate
  
  const cost = (tokens * price.input) + (estimatedOutputTokens * price.output);
  
  return { tokens, estimatedCost: cost };
}

// Use in route to prevent expensive requests
export async function POST(request: NextRequest) {
  const { input } = await request.json();
  
  const { tokens, estimatedCost } = estimateCost(input);
  
  if (tokens > 4000) {
    return NextResponse.json(
      { error: 'Input too long. Max 4000 tokens.' },
      { status: 400 }
    );
  }
  
  // Proceed with OpenAI call
}
```

---

## Authentication Flow

### Login Flow (Mobile)

```typescript
// app/(auth)/login.tsx
import { supabase } from '@/services/api';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  
  async function signInWithGoogle() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'intentflow://auth/callback',
        },
      });
      
      if (error) throw error;
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }
  
  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace('/(tabs)');
      }
    });
  }, []);
  
  return (
    <View>
      <TouchableOpacity onPress={signInWithGoogle} disabled={loading}>
        <Text>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Protected Route Pattern

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '@/stores/auth';

export default function RootLayout() {
  const segments = useSegments();
  const session = useAuthStore((state) => state.session);
  
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!session && !inAuthGroup) {
      // Redirect to login
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to app
      router.replace('/(tabs)');
    }
  }, [session, segments]);
  
  return <Slot />;
}
```

---

## State Management with Zustand

### Auth Store

```typescript
// stores/auth.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';

interface AuthStore {
  session: Session | null;
  setSession: (session: Session | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      logout: async () => {
        await supabase.auth.signOut();
        set({ session: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### Tasks Store

```typescript
// stores/tasks.ts
import { create } from 'zustand';
import api from '@/services/api';

interface Task {
  id: string;
  title: string;
  // ... other fields
}

interface TasksStore {
  tasks: Task[];
  loading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  loading: false,
  
  fetchTasks: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/tasks');
      set({ tasks: response.data.data });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  addTask: async (task) => {
    const response = await api.post('/tasks', task);
    set((state) => ({ tasks: [response.data.data, ...state.tasks] }));
  },
  
  updateTask: async (id, updates) => {
    await api.put(`/tasks/${id}`, updates);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },
  
  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },
}));
```

---

## Error Handling Strategies

### Global Error Boundary (React Native)

```typescript
// components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import * as Sentry from 'sentry-expo';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.Native.captureException(error, { contexts: { react: errorInfo } });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 20, marginBottom: 20 }}>Something went wrong</Text>
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false })}
          />
        </View>
      );
    }
    
    return this.props.children;
  }
}
```

### API Error Handler

```typescript
// services/error-handler.ts
import { AxiosError } from 'axios';
import { Alert } from 'react-native';

export function handleApiError(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.error || 'Network error';
    
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      Alert.alert('Session Expired', 'Please log in again');
      // Clear session and redirect
    } else if (error.response?.status === 429) {
      Alert.alert('Too Many Requests', 'Please slow down and try again');
    } else {
      Alert.alert('Error', message);
    }
  } else {
    Alert.alert('Error', 'An unexpected error occurred');
  }
}

// Usage
try {
  await api.post('/tasks', taskData);
} catch (error) {
  handleApiError(error);
}
```

---

## Performance Optimization

### Image Optimization

```bash
npm install react-native-fast-image
```

```typescript
import FastImage from 'react-native-fast-image';

// Instead of <Image>
<FastImage
  style={{ width: 200, height: 200 }}
  source={{
    uri: 'https://example.com/image.jpg',
    priority: FastImage.priority.normal,
  }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

### Memoization Patterns

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive component
export const TaskCard = memo(({ task, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{task.title}</Text>
    </TouchableOpacity>
  );
});

// Use in parent
export default function TaskList() {
  const handlePress = useCallback((taskId: string) => {
    router.push(`/task/${taskId}`);
  }, []);
  
  const sortedTasks = useMemo(() => {
    return tasks.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [tasks]);
  
  return (
    <FlatList
      data={sortedTasks}
      renderItem={({ item }) => (
        <TaskCard task={item} onPress={() => handlePress(item.id)} />
      )}
    />
  );
}
```

### React Query for API Caching

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tasks');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (task: NewTask) => {
      const response = await api.post('/tasks', task);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

---

## Testing Patterns

### Unit Test Example

```typescript
// __tests__/confidence.test.ts
import { calculateConfidence } from '@/utils/confidence';

describe('calculateConfidence', () => {
  it('should return base score of 50 with no data', () => {
    const result = calculateConfidence({
      title: 'Test',
      due_date: null,
      due_time: null,
      people: [],
    });
    expect(result).toBe(50);
  });
  
  it('should add 25 points for due_date', () => {
    const result = calculateConfidence({
      title: 'Test',
      due_date: '2026-03-20',
      due_time: null,
      people: [],
    });
    expect(result).toBe(75);
  });
});
```

### API Route Test

```typescript
// __tests__/api/tasks.test.ts
import { POST } from '@/app/api/tasks/route';
import { NextRequest } from 'next/server';

jest.mock('@supabase/supabase-js');

describe('POST /api/tasks', () => {
  it('should create task successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test-token' },
      body: JSON.stringify({
        title: 'Test Task',
        priority: 'medium',
      }),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Forgetting to Handle Loading States

```typescript
// ❌ BAD
export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    fetchTasks();
  }, []);
  
  return <FlatList data={tasks} ... />;
}

// ✅ GOOD
export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadTasks();
  }, []);
  
  async function loadTasks() {
    setLoading(true);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) return <ActivityIndicator />;
  
  return <FlatList data={tasks} ... />;
}
```

### Pitfall 2: Not Validating API Inputs

```typescript
// ❌ BAD - No validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  await supabase.from('tasks').insert(body);
}

// ✅ GOOD - Zod validation
const TaskSchema = z.object({
  title: z.string().min(1).max(200),
  priority: z.enum(['high', 'medium', 'low']),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = TaskSchema.parse(body); // Throws on invalid
  await supabase.from('tasks').insert(validated);
}
```

### Pitfall 3: Exposing Database Without RLS

```sql
-- ❌ BAD - No RLS policies
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  user_id UUID,
  title TEXT
);

-- ✅ GOOD - RLS enabled with policies
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  user_id UUID,
  title TEXT
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);
```

### Pitfall 4: Hardcoding API URLs

```typescript
// ❌ BAD
const response = await fetch('http://localhost:3001/api/tasks');

// ✅ GOOD
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const response = await fetch(`${API_URL}/api/tasks`);
```

---

## Quick Reference Checklist

**Before Deploying:**

- [ ] All environment variables set in production
- [ ] RLS policies enabled on all Supabase tables
- [ ] API routes have Zod validation
- [ ] Error tracking (Sentry) configured
- [ ] Loading states on all async operations
- [ ] Proper TypeScript types (no `any`)
- [ ] Push notifications tested on physical device
- [ ] OAuth redirect URLs configured for production
- [ ] Database migrations applied
- [ ] API rate limiting enabled

**Performance Checklist:**

- [ ] Using FlatList for all lists > 20 items
- [ ] Images optimized with FastImage
- [ ] Expensive computations memoized
- [ ] API responses cached where appropriate
- [ ] Database indexes on frequently queried fields
- [ ] Proper key extraction in FlatList

**Security Checklist:**

- [ ] No API keys in client code
- [ ] JWT tokens validated on every API call
- [ ] Supabase service key only used server-side
- [ ] CORS configured correctly
- [ ] User input sanitized before database queries
- [ ] File uploads validated by type and size

---

This skills document should be your reference for building IntentFlow AI correctly. Follow these patterns and you'll avoid the most common pitfalls!
