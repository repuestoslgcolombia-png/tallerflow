'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

// ============== ONBOARDING ==============
// Pantalla para usuarios autenticados sin taller: crear uno nuevo
// o reclamar el taller piloto (migración del dueño actual).

export function OnboardingView() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'create' | 'claim'>('create')
  const [name, setName] = useState('')
  const [claimName, setClaimName] = useState('')
  const [loading, setLoading] = useState(false)

  async function submitOnboarding(tallerName: string, claimPilot: boolean) {
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tallerName.trim(), claimPilot }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo configurar el taller')
      toast.success(claimPilot ? 'Taller reclamado. Tus datos siguen intactos.' : `Taller "${data.tenant.name}" creado. ¡Bienvenido!`)
      queryClient.invalidateQueries()
      router.refresh()
      window.location.reload()
    } catch (e: any) {
      toast.error(e.message || 'Error al configurar el taller')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
            🛠️
          </div>
          <h1 className="text-2xl font-bold">Bienvenido a TallerFlow</h1>
          <p className="text-sm text-muted-foreground">
            Configura tu taller para empezar a gestionar tus reparaciones
          </p>
        </div>

        <div className="rounded-lg border bg-background p-6 space-y-4">
          <div className="flex rounded-lg bg-muted p-1" role="tablist">
            <button
              role="tab"
              aria-selected={mode === 'create'}
              onClick={() => setMode('create')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === 'create' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Crear taller
            </button>
            <button
              role="tab"
              aria-selected={mode === 'claim'}
              onClick={() => setMode('claim')}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === 'claim' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ya tengo datos aquí
            </button>
          </div>

          {mode === 'create' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taller-nombre">Nombre de tu taller</Label>
                <Input
                  id="taller-nombre"
                  placeholder="Ej. Reparaciones Hernández"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => submitOnboarding(name, false)}
                disabled={loading || !name.trim()}
              >
                {loading ? 'Creando...' : 'Crear mi taller'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Se creará con configuración inicial (moneda COP, IVA 19%) y plantillas de WhatsApp listas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                <strong>¿Ya usabas TallerFlow con tus datos?</strong> Reclama el taller existente:
                tus clientes, órdenes y repuestos se conservan tal cual. Solo aplica si eres el dueño
                de los datos actuales.
              </div>
              <div className="space-y-2">
                <Label htmlFor="claim-nombre">Nombre para tu taller actual</Label>
                <Input
                  id="claim-nombre"
                  placeholder="Ej. Servihogar"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  maxLength={60}
                />
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => submitOnboarding(claimName, true)}
                disabled={loading || !claimName.trim()}
              >
                {loading ? 'Reclamando...' : 'Reclamar mi taller'}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          TallerFlow · Gestión de talleres de electrodomésticos
        </p>
      </div>
    </div>
  )
}
