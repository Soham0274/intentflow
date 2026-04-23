// hooks/useAuth.ts
'use client'
import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const router = useRouter()
  const { user, isLoading, setUser, setLoading, clearAuth } = useAuthStore()
  const supabase = createSupabaseBrowser()

  useEffect(() => {
    const getUser = async () => {
      setLoading(true)
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
          avatar_url: authUser.user_metadata?.avatar_url,
        })
      } else {
        setUser(null)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url,
        })
      } else {
        clearAuth()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, setUser, setLoading, clearAuth])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/tasks')
    },
    [supabase, router]
  )

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) throw error
      router.push('/tasks')
    },
    [supabase, router]
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    clearAuth()
    router.push('/login')
  }, [supabase, clearAuth, router])

  return { user, isLoading, signIn, signUp, signOut }
}
