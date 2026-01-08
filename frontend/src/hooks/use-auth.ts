"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function useAuth(redirectTo?: string) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial session first (this will check if tokens are valid)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && redirectTo) {
        router.push(redirectTo)
        return
      }
      
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && redirectTo) {
        router.push(redirectTo)
        return
      }
      
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [router, redirectTo])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return { user, isLoading, handleLogout }
}
