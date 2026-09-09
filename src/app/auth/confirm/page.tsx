'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Wrench } from 'lucide-react'

// ============== CONFIRMACIÓN DE ENLACES DE CORREO ==============
// Destino de TODOS los enlaces de Supabase (reset, confirmación, magic link).
// Soporta los 4 formatos según plantilla y flujo:
//   1. ?token_hash=...&type=recovery|signup|magiclink  (plantilla por defecto)
//   2. ?code=...                                        (flujo PKCE: exchangeCodeForSession)
//   3. #access_token=...&type=recovery                  (flujo implicit, en el hash)
//   4. ?error=...                                       (token expirado/inválido)
// Si ya hay sesión y no hay datos, simplemente entra a la app.

const VALID_TYPES = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'] as const
type OtpType = (typeof VALID_TYPES)[number]

function isRecovery(type: OtpType | null, hash: string): boolean {
  if (type === 'recovery') return true
  return /[#&?]type=recovery/.test(hash)
}

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
    const errorParam = params.get('error') || params.get('error_code')
    const supabase = createClient()

    const type: OtpType = (VALID_TYPES as readonly string[]).includes(typeParam)
      ? (typeParam as OtpType)
      : 'email'

    async function run() {
      // 4) Enlace expirado / rechazado por Supabase
      if (errorParam) {
        setError(
          'Este enlace ya expiró o fue usado antes. Solicita uno nuevo con "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión, y ábrelo pronto (expira en 1 hora).'
        )
        return
      }

      // 1) Flujo OTP con token_hash
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        if (error) {
          setError(
            type === 'recovery'
              ? 'El enlace para restablecer la contraseña no es válido o ya expiró. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".'
              : 'El enlace de confirmación no es válido o ya fue usado. Solicita uno nuevo.'
          )
          return
        }
        router.replace(type === 'recovery' ? '/reset-password' : next)
        return
      }

      // 2) Flujo PKCE: intercambiar code por sesión
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          // Verificador PKCE ausente: se abrió en otro navegador/dispositivo
          setError(
            'No pudimos completar la verificación en este navegador (el enlace se pidió en otro). Solicita el enlace de nuevo aquí mismo: ingresa a "¿Olvidaste tu contraseña?" desde este navegador y abre el correo desde aquí.'
          )
          return
        }
        // En esta app, los enlaces con code provienen del flujo de recuperación
        router.replace('/reset-password')
        return
      }

      // 3) Flujo implicit: tokens en el hash de la URL
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      if (hash.includes('access_token=')) {
        const h = new URLSearchParams(hash.replace(/^#/, ''))
        const accessToken = h.get('access_token')
        const refreshToken = h.get('refresh_token')
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          if (!error) {
            router.replace(isRecovery(type, hash) ? '/reset-password' : next)
            return
          }
        }
      }

      // Sin datos pero con sesión vigente: entrar a la app
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.replace(next)
        return
      }

      setError(
        'El enlace no trajo los datos de verificación (puede haber expirado o haberse abierto parcialmente). Copia el enlace completo del correo, o solicita uno nuevo desde "¿Olvidaste tu contraseña?".'
      )
    }

    run()
  }, [params, router])

  return <ConfirmBody error={error} />
}

function ConfirmBody({ error }: { error: string | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
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
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <a href="/login">Ir a iniciar sesión</a>
                </Button>
              </div>
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
