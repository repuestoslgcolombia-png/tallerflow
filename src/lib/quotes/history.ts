import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export const QUOTE_EVENT_TITLES: Record<string, string> = {
  created: 'Cotización creada',
  sent: 'Cotización enviada',
  viewed: 'Vista por el cliente',
  approved: 'Cotización aprobada',
  rejected: 'Cotización rechazada',
  expired: 'Cotización vencida',
  resent: 'Cotización reenviada',
  edited: 'Cotización editada',
}

type EventInput = {
  quoteId: string
  eventType: string
  fromStatus?: string | null
  toStatus?: string | null
  title?: string
  description?: string | null
  createdBy?: string | null
}

export async function logQuoteEvent(
  tx: Prisma.TransactionClient | typeof db,
  input: EventInput
) {
  return tx.quoteEvent.create({
    data: {
      quoteId: input.quoteId,
      eventType: input.eventType,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      title: input.title || QUOTE_EVENT_TITLES[input.eventType] || input.eventType,
      description: input.description ?? null,
      createdBy: input.createdBy ?? null,
    },
  })
}

// Vencimiento lazy: marca como expired las cotizaciones enviadas cuya
// validez ya pasó. Se llama en los GET de cotizaciones (sin cron).
export async function expireOverdueQuotes(): Promise<number> {
  const now = new Date()
  const overdue = await db.quote.findMany({
    where: { status: 'sent', validUntil: { lt: now } },
    select: { id: true, code: true },
  })
  if (overdue.length === 0) return 0

  await db.$transaction(async (tx) => {
    await tx.quote.updateMany({
      where: { id: { in: overdue.map((q) => q.id) }, status: 'sent' },
      data: { status: 'expired' },
    })
    await tx.quoteEvent.createMany({
      data: overdue.map((q) => ({
        quoteId: q.id,
        eventType: 'expired',
        fromStatus: 'sent',
        toStatus: 'expired',
        title: QUOTE_EVENT_TITLES.expired,
        description: `La cotización ${q.code} venció sin respuesta del cliente`,
      })),
    })
  })

  return overdue.length
}
