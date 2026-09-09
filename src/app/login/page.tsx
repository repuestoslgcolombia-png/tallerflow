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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'registro' | 'recovery'>('login')

  const supabase = createClient()

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
