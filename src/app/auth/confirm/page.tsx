'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Wrench } from 'lucide-react'

// ============== CONFIRMACIÓN DE ENLACES DE CORREO ==============
// Destino de las plantillas por defecto de Supabase:
//   /auth/confirm?token_hash=...&type=signup|recovery|magiclink&next=/...
// Verifica el token y redirige. El flujo recovery lleva a /reset-password.

const VALID_TYPES = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'] as const
type OtpType = (typeof VALID_TYPES)[number]

function ConfirmInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const tokenHash = params.get('token_hash')
    const typeParam = params.get('type') || 'email'
    const next = params.get('next') || '/'
    const code = params.get('code')

    const type: OtpType = (VALID_TYPES as readonly string[]).includes(typeParam)
      ? (typeParam as OtpType)
      : 'email'

    const supabase = createClient()

    async function run() {
      // Flujo OTP (plantillas por defecto de Supabase)
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        if (error) {
          setError(
            type === 'recovery'
              ? 'El enlace para restablecer la contraseña no es válido o ya expiró. Solicita uno nuevo desde la pantalla de inicio de sesión.'
              : 'El enlace de confirmación no es válido o ya fue usado. Solicita uno nuevo.'
          )
          return
        }
        if (type === 'recovery') {
          router.replace('/reset-password')
        } else {
          router.replace(next)
        }
        return
      }

      // Flujo PKCE (enlaces con ?code=)
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setError('El enlace no es válido o ya expiró. Vuelve a iniciar sesión.')
          return
        }
        router.replace(next)
        return
      }

      setError('El enlace no incluye los datos de verificación. Usa el enlace completo del correo.')
    }

    run()
  }, [params, router])

  return <ConfirmBody error={error} />
}

function ConfirmBody({ error }: { error: string | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="size-6" />
          </div>
          <CardTitle className="text-xl">TallerFlow</CardTitle>
          <CardDescription>
            {error ? 'Enlace no válido' : 'Verificando tu enlace...'}
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

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmInner />
    </Suspense>
  )
}
