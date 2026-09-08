'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/store/app-store'
import { AppShell } from '@/components/tallerflow/app-shell'
import { OnboardingView } from '@/modules/onboarding/onboarding-view'

// ============== GUARD DE SESIÓN + TALLER ==============
// Decide qué ver el usuario tras el middleware:
// - sin sesión → /login (el middleware ya redirige, esto es defensa extra)
// - sesión sin taller → OnboardingView (crear o reclamar)
// - sesión + taller → AppShell normal

type SessionData = {
  user: { id: string; email: string; name: string | null } | null
  tenant: { id: string; name: string; role: string } | null
}

async function fetchSession(): Promise<SessionData> {
  const res = await fetch('/api/auth/session')
  if (!res.ok) throw new Error('No se pudo verificar la sesión')
  const body = await res.json()
  return body.data ?? body
}

export function AuthGuard() {
  const router = useRouter()
  const setTenantName = useAppStore((s) => s.setTenantName)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['auth-session'],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  useEffect(() => {
    if (!isLoading && !data?.user) {
      router.replace('/login')
    }
  }, [isLoading, data, router])

  useEffect(() => {
    if (data?.tenant?.name) setTenantName(data.tenant.name)
  }, [data?.tenant?.name, setTenantName])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando TallerFlow...</p>
        </div>
      </div>
    )
  }

  if (isError || !data?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">No se pudo verificar tu sesión.</p>
          <ButtonLikeLogin />
        </div>
      </div>
    )
  }

  // Autenticado sin taller: onboarding
  if (!data.tenant) {
    return <OnboardingView />
  }

  return <AppShell />
}

function ButtonLikeLogin() {
  return (
    <a
      href="/login"
      className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Ir a iniciar sesión
    </a>
  )
}
