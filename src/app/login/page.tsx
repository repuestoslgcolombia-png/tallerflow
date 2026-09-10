'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Wrench } from 'lucide-react'
import { toast } from 'sonner'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'registro' | 'recovery'>('login')

  const supabase = createClient()

  async function handleGoogle() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      // El navegador redirige a Google; nada más que hacer aquí
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo iniciar el ingreso con Google')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Ingresa tu correo')
      return
    }
    if (mode === 'recovery') {
      setLoading(true)
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/confirm`,
        })
        if (error) throw error
        toast.success('Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.')
        setMode('login')
      } catch (err: any) {
        toast.error(err?.message || 'Error al enviar el enlace')
      } finally {
        setLoading(false)
      }
      return
    }
    if (!password) {
      toast.error('Ingresa tu contraseña')
      return
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Sesión iniciada')
        router.push('/')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success('Cuenta creada. Ya puedes iniciar sesión.')
        setMode('login')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="size-6" />
          </div>
          <CardTitle className="text-xl">TallerFlow</CardTitle>
          <CardDescription>
            {mode === 'login' && 'Ingresa para gestionar tu taller'}
            {mode === 'registro' && 'Crea tu cuenta de taller'}
            {mode === 'recovery' && 'Te enviaremos un enlace a tu correo'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'login' && (
            <>
              <Button
                type="button"
                variant="outline"
                className="mb-4 w-full"
                onClick={handleGoogle}
                disabled={loading}
              >
                <GoogleIcon className="size-4" />
                Continuar con Google
              </Button>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">o con tu correo</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@taller.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            {mode !== 'recovery' && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === 'login' && 'Iniciar sesión'}
              {mode === 'registro' && 'Crear cuenta'}
              {mode === 'recovery' && 'Enviar enlace'}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center">
            {mode === 'login' && (
              <>
                <button
                  type="button"
                  onClick={() => setMode('recovery')}
                  className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <button
                  type="button"
                  onClick={() => setMode('registro')}
                  className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  ¿No tienes cuenta? Regístrate
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Volver a iniciar sesión
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
