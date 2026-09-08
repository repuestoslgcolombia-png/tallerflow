'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PublicQuoteApproval } from '@/modules/quotes/public-quote-approval'
import { PublicCustomerPortal } from '@/modules/customers/public-customer-portal'
import { ErrorBoundary } from '@/components/error-boundary'
import { AuthGuard } from '@/components/tallerflow/auth-guard'

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  )
}

function HomePageInner() {
  // Enlace público de aprobación: /?quote=<id>&token=<token>
  const searchParams = useSearchParams()
  const publicQuoteId = searchParams.get('quote')
  const publicToken = searchParams.get('token')
  if (publicQuoteId && publicToken) {
    return <PublicQuoteApproval quoteId={publicQuoteId} token={publicToken} />
  }

  // Portal público del cliente: /?portal=<token>
  const portalToken = searchParams.get('portal')
  if (portalToken) {
    return <PublicCustomerPortal token={portalToken} />
  }

  // App autenticada: el guard decide entre shell, onboarding y /login
  return (
    <ErrorBoundary>
      <AuthGuard />
    </ErrorBoundary>
  )
}
