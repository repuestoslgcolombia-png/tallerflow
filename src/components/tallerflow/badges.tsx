'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  WORK_ORDER_STATUS,
  PRIORITY,
  QUOTE_STATUS,
  INVOICE_STATUS,
  USER_ROLES,
  type WorkOrderStatusKey,
  type PriorityKey,
} from '@/lib/constants'

export function StatusBadge({ status, className }: { status: WorkOrderStatusKey; className?: string }) {
  const conf = WORK_ORDER_STATUS[status]
  if (!conf) return null
  return (
    <Badge variant="outline" className={cn('gap-1.5 border font-medium', conf.color, className)}>
      <span className={cn('size-1.5 rounded-full', conf.dot)} />
      {conf.label}
    </Badge>
  )
}

export function PriorityBadge({ priority, className }: { priority: PriorityKey; className?: string }) {
  const conf = PRIORITY[priority]
  if (!conf) return null
  return (
    <Badge variant="outline" className={cn('border font-medium', conf.color, className)}>
      {conf.label}
    </Badge>
  )
}

export function QuoteStatusBadge({ status, className }: { status: string; className?: string }) {
  const conf = (QUOTE_STATUS as any)[status]
  if (!conf) return <Badge variant="outline" className={className}>{status}</Badge>
  return (
    <Badge variant="outline" className={cn('border font-medium', conf.color, className)}>
      {conf.label}
    </Badge>
  )
}

export function InvoiceStatusBadge({ status, className }: { status: string; className?: string }) {
  const conf = (INVOICE_STATUS as any)[status]
  if (!conf) return <Badge variant="outline" className={className}>{status}</Badge>
  return (
    <Badge variant="outline" className={cn('border font-medium', conf.color, className)}>
      {conf.label}
    </Badge>
  )
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const conf = (USER_ROLES as any)[role]
  if (!conf) return <Badge variant="outline" className={className}>{role}</Badge>
  return (
    <Badge variant="secondary" className={cn('font-medium', conf.color, className)}>
      {conf.label}
    </Badge>
  )
}
