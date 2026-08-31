'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/30">
          <AlertTriangle className="size-8 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground">
            Ha ocurrido un error inesperado. El equipo ha sido notificado.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left w-full max-w-xs">
              <summary className="text-xs text-muted-foreground cursor-pointer">Detalles técnicos</summary>
              <pre className="mt-2 text-[11px] p-2 rounded bg-muted overflow-auto max-h-40">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row w-full max-w-md">
          <Button onClick={reset} className="gap-2 flex-1">
            <RefreshCw className="size-4" />
            Reintentar
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="gap-2 flex-1">
            <Home className="size-4" />
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  )
}