'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Wrench } from 'lucide-react'

// ============== CALLBACK DE OAUTH (Google) ==============
// Destino del redirectTo de signInWithOAuth('google'):
//   /auth/callback?code=...  (PKCE) → intercambio por sesión → app
//   /auth/callback?error=... (rechazo o error de configuración)
// Separado de /auth/confirm (enlaces de email) para no ambigüedad.

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const code = params.get('code')
    const errorParam = params.get('error') || params.get('error_description')
    const oauthError = params.get('oauth_error')
    const supabase = createClient()

    async function run() {
      // Error devuelto por Google/Supabase al redirigir de vuelta
      if (errorParam || oauthError) {
        setError(
          'Google rechazó el acceso. Verifica que el proveedor Google esté activo en Supabase (Authentication → Providers) y que el URI de redirección esté registrado en Google Cloud. También puede ser que cerraste la ventana de Google.'
        )
        return
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setError(
            'No pudimos completar el ingreso en este navegador (el enlace se inició en otro dispositivo). Vuelve a la pantalla de inicio de sesión e inténtalo de nuevo desde aquí.'
          )
          return
        }
        router.replace('/')
        return
      }

      // Sin código pero con sesión vigente: entrar
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace('/')
        return
      }

      setError('El ingreso con Google no trajo los datos de sesión. Inténtalo de nuevo.')
    }

    run()
  }, [params, router])

  return <CallbackBody error={error} />
}

function CallbackBody({ error }: { error: string | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="size-6" />
          </div>
          <CardTitle className="text-xl">TallerFlow</CardTitle>
          <CardDescription>
            {error ? 'No se pudo ingresar' : 'Completando el ingreso con Google...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">{error}</p>
              <Button asChild className="w-full">
                <a href="/login">Ir a iniciar sesión</a>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Un momento...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  )
}
