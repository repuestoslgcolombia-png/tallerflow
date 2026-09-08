import { db } from '@/lib/db'
import { dbFor } from '@/lib/tenant/db-for'

// ============== AUTOMATIZACIONES WHATSAPP ==============
// Motor de disparo síncrono: se invoca desde los handlers cuando ocurre un evento.
// Nunca lanza excepciones hacia el handler llamador; los errores quedan en AutomationLog.
// Multi-tenant: si TriggerContext trae tenantId, todo queda dentro del taller (dbFor).

export interface TriggerContext {
  workOrderId?: string
  customerId?: string
  invoiceId?: string
  quoteId?: string
  // Si la UI ya creó los recordatorios al entregar, omitir reglas create_reminder
  skipAutoReminders?: boolean
  // Taller dentro del cual correr las automatizaciones (recomendado en handlers autenticados)
  tenantId?: string
}

const DEFAULT_RULES: Array<{
  trigger: string
  action: 'send_whatsapp' | 'create_reminder'
  templateCode?: string
  daysOffset?: number
  reminderType?: string
}> = [
  { trigger: 'order_received', action: 'send_whatsapp', templateCode: 'order_received' },
  { trigger: 'quote_sent', action: 'send_whatsapp', templateCode: 'quote_sent' },
  { trigger: 'quote_approved', action: 'send_whatsapp', templateCode: 'quote_approved' },
  { trigger: 'order_ready', action: 'send_whatsapp', templateCode: 'order_ready' },
  { trigger: 'order_delivered', action: 'send_whatsapp', templateCode: 'order_delivered' },
  { trigger: 'payment_received', action: 'send_whatsapp', templateCode: 'payment_confirmation' },
  {
    trigger: 'invoice_created',
    action: 'create_reminder',
    reminderType: 'warranty_check',
    daysOffset: 90,
    templateCode: 'warranty_check',
  },
  {
    trigger: 'order_delivered',
    action: 'create_reminder',
    reminderType: 'maintenance',
    daysOffset: 180,
    templateCode: 'maintenance_reminder',
  },
]

export const TRIGGER_LABELS: Record<string, string> = {
  order_received: 'Orden recibida',
  quote_sent: 'Cotización enviada',
  quote_approved: 'Cotización aprobada',
  order_ready: 'Orden lista',
  order_delivered: 'Orden entregada',
  payment_received: 'Pago recibido',
  invoice_created: 'Factura creada',
}

export const ACTION_LABELS: Record<string, string> = {
  send_whatsapp: 'Enviar WhatsApp',
  create_reminder: 'Crear recordatorio',
}

// Cliente según tenant del contexto (o global si no viene)
function clientFor(ctx: TriggerContext) {
  return ctx.tenantId ? dbFor(ctx.tenantId) : db
}

// Crea las reglas por defecto que falten (seed idempotente; no sobrescribe cambios del usuario)
// Multi-tenant: con tenantId crea las reglas del taller
export async function ensureDefaultRules(tenantId?: string) {
  const tdb = tenantId ? dbFor(tenantId) : db
  for (const rule of DEFAULT_RULES) {
    // unique compuesto tenantId_trigger_action: dedupe manual
    const existing = await tdb.automationRule.findFirst({
      where: { trigger: rule.trigger, action: rule.action },
    })
    if (existing) continue
    await tdb.automationRule.create({
      // tenantId lo inyecta dbFor() en runtime
      data: {
        trigger: rule.trigger,
        action: rule.action,
        enabled: true,
        templateCode: rule.templateCode || null,
        daysOffset: rule.daysOffset ?? null,
        reminderType: rule.reminderType || null,
      } as any,
    })
  }
}

interface AutomationContext {
  customerName: string
  phone: string
  customerId: string
  workOrderId: string | null
  code: string
  equipo: string
  total: string
  fecha: string
}

async function loadContext(ctx: TriggerContext): Promise<AutomationContext | null> {
  const tdb = clientFor(ctx)
  let customerName = ''
  let phone = ''
  let customerId = ctx.customerId || null
  let workOrderId = ctx.workOrderId || null
  let code = ''
  let equipo = ''
  let total = ''
  let fecha = ''

  const workOrder = workOrderId
    ? await tdb.workOrder.findUnique({
        where: { id: workOrderId },
        include: { customer: true, device: true, invoice: true },
      })
    : null

  let invoice = ctx.invoiceId
    ? await tdb.invoice.findUnique({
        where: { id: ctx.invoiceId },
        include: { customer: true, workOrder: { include: { device: true } } },
      })
    : null

  // Si llegó factura sin workOrderId explícito, completar datos desde ella
  if (invoice && !workOrder) {
    customerId = invoice.customerId
    workOrderId = invoice.workOrderId
    if (invoice.workOrder) {
      code = invoice.workOrder.code
      equipo = invoice.workOrder.device
        ? `${invoice.workOrder.device.brand} ${invoice.workOrder.device.model}`.trim()
        : ''
    }
  }

  if (workOrder) {
    customerId = workOrder.customerId
    workOrderId = workOrder.id
    code = workOrder.code
    equipo = workOrder.device ? `${workOrder.device.brand} ${workOrder.device.model}`.trim() : ''
    total =
      workOrder.totalAmount > 0
        ? `$${new Intl.NumberFormat('es-CO').format(workOrder.totalAmount)}`
        : ''
    fecha = workOrder.deliveredAt
      ? new Date(workOrder.deliveredAt).toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : ''
  }

  const customer = customerId ? await tdb.customer.findUnique({ where: { id: customerId } }) : null
  if (customer) {
    customerName = `${customer.firstName} ${customer.lastName}`
    phone = customer.phone || ''
  }

  if (invoice) {
    total = invoice.total > 0 ? `$${new Intl.NumberFormat('es-CO').format(invoice.total)}` : total
    fecha = new Date(invoice.issuedAt).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (!customerId) return null

  return { customerName, phone, customerId, workOrderId, code, equipo, total, fecha }
}

function renderTemplate(body: string, vars: AutomationContext): string {
  const map: Record<string, string> = {
    cliente: vars.customerName,
    telefono: vars.phone,
    codigo: vars.code,
    equipo: vars.equipo,
    total: vars.total,
    fecha: vars.fecha,
    taller: 'TallerTech Pro',
  }
  let rendered = body
  for (const [key, value] of Object.entries(map)) {
    rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  return rendered
}

async function logAutomation(params: {
  ruleId?: string
  workOrderId?: string | null
  customerId?: string | null
  trigger: string
  phone: string
  message: string
  status: 'sent' | 'failed' | 'skipped'
  error?: string
}) {
  try {
    await db.automationLog.create({
      data: {
        ruleId: params.ruleId || null,
        workOrderId: params.workOrderId || null,
        customerId: params.customerId || null,
        trigger: params.trigger,
        phone: params.phone,
        message: params.message,
        status: params.status,
        error: params.error || null,
      },
    })
  } catch (e) {
    console.error('[Automations] No se pudo registrar en AutomationLog', e)
  }
}

// Punto de entrada: ejecuta todas las reglas activas para un trigger
export async function runTrigger(trigger: string, ctx: TriggerContext = {}) {
  try {
    const tdb = clientFor(ctx)
    const rules = await tdb.automationRule.findMany({
      where: { trigger, enabled: true },
    })
    if (rules.length === 0) return

    const context = await loadContext(ctx)
    if (!context) return

    for (const rule of rules) {
      try {
        if (rule.action === 'send_whatsapp') {
          await executeSendWhatsApp(tdb, rule, context, trigger)
        } else if (rule.action === 'create_reminder') {
          // La UI ya creó los recordatorios al entregar: no duplicar
          if (ctx.skipAutoReminders) continue
          await executeCreateReminder(tdb, rule, context, trigger)
        }
      } catch (e) {
        await logAutomation({
          ruleId: rule.id,
          workOrderId: context.workOrderId,
          customerId: context.customerId,
          trigger,
          phone: context.phone,
          message: '',
          status: 'failed',
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }
  } catch (e) {
    console.error(`[Automations] Error en runTrigger(${trigger})`, e)
  }
}

async function executeSendWhatsApp(
  tdb: any,
  rule: { id: string; templateCode: string | null; delayMinutes: number },
  context: AutomationContext,
  trigger: string
) {
  if (!rule.templateCode) {
    await logAutomation({
      ruleId: rule.id,
      workOrderId: context.workOrderId,
      customerId: context.customerId,
      trigger,
      phone: context.phone,
      message: '',
      status: 'skipped',
      error: 'Regla sin plantilla configurada',
    })
    return
  }

  // unique compuesto tenantId_code: findFirst plano (la extensión filtra tenant)
  const template = await tdb.whatsAppTemplate.findFirst({ where: { code: rule.templateCode } })
  if (!template || !template.active) {
    await logAutomation({
      ruleId: rule.id,
      workOrderId: context.workOrderId,
      customerId: context.customerId,
      trigger,
      phone: context.phone,
      message: '',
      status: 'skipped',
      error: `Plantilla ${rule.templateCode} no encontrada o inactiva`,
    })
    return
  }

  if (!context.phone) {
    await logAutomation({
      ruleId: rule.id,
      workOrderId: context.workOrderId,
      customerId: context.customerId,
      trigger,
      phone: '',
      message: '',
      status: 'skipped',
      error: 'Cliente sin teléfono registrado',
    })
    return
  }

  const message = renderTemplate(template.body, context)

  await tdb.whatsAppMessage.create({
    data: {
      customerId: context.customerId,
      workOrderId: context.workOrderId,
      templateId: template.id,
      toPhone: context.phone,
      toName: context.customerName,
      message,
      status: 'sent',
      channel: 'whatsapp',
      sentBy: 'Automatización',
    },
  })

  await logAutomation({
    ruleId: rule.id,
    workOrderId: context.workOrderId,
    customerId: context.customerId,
    trigger,
    phone: context.phone,
    message,
    status: 'sent',
  })
}

async function executeCreateReminder(
  tdb: any,
  rule: { id: string; reminderType: string | null; daysOffset: number | null; templateCode: string | null },
  context: AutomationContext,
  trigger: string
) {
  const type = rule.reminderType || 'custom'
  const days = rule.daysOffset ?? 90

  if (!context.workOrderId) {
    await logAutomation({
      ruleId: rule.id,
      workOrderId: null,
      customerId: context.customerId,
      trigger,
      phone: context.phone,
      message: '',
      status: 'skipped',
      error: 'Sin orden de trabajo asociada, no se puede programar recordatorio',
    })
    return
  }

  // Dedupe: no recrear si ya existe un recordatorio del mismo tipo para esta orden
  const existing = await tdb.reminder.findFirst({
    where: { workOrderId: context.workOrderId, type },
  })
  if (existing) return

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + days)

  const titles: Record<string, string> = {
    warranty_check: 'Verificar garantía',
    maintenance: 'Mantenimiento preventivo',
  }

  const messages: Record<string, string> = {
    warranty_check: `Verificar garantía de ${context.equipo || 'equipo'} (${context.code}). Vence ${dueDate.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}.`,
    maintenance: `Recordar mantenimiento de ${context.equipo || 'equipo'} a ${context.customerName} (${context.code}).`,
  }

  await tdb.reminder.create({
    // tenantId lo inyecta dbFor() en runtime
    data: {
      customerId: context.customerId,
      workOrderId: context.workOrderId,
      type,
      title: titles[type] || 'Recordatorio automático',
      message: messages[type] || null,
      dueDate,
      channel: 'whatsapp',
      status: 'pending',
      priority: 'normal',
      daysAfter: days,
    } as any,
  })

  await logAutomation({
    ruleId: rule.id,
    workOrderId: context.workOrderId,
    customerId: context.customerId,
    trigger,
    phone: context.phone,
    message: `Recordatorio "${titles[type] || type}" programado para ${dueDate.toLocaleDateString('es-CO')}`,
    status: 'sent',
  })
}

// ============== SWEEP DE RECORDATORIOS VENCIDOS ==============

export interface SweepResult {
  checked: number
  sent: number
  skipped: number
}

// Envía WhatsApp por cada recordatorio pendiente cuya fecha ya venció.
// Se invoca al cargar la app (GET /api/daily-agenda) como "cron" ligero.
// Multi-tenant: con tenantId el sweep queda dentro del taller
export async function sweepDueReminders(tenantId?: string): Promise<SweepResult> {
  const tdb = tenantId ? dbFor(tenantId) : db
  const result: SweepResult = { checked: 0, sent: 0, skipped: 0 }

  try {
    const now = new Date()
    const due = await tdb.reminder.findMany({
      where: {
        status: 'pending',
        channel: 'whatsapp',
        dueDate: { lte: now },
      },
      include: {
        customer: true,
        workOrder: { include: { device: true } },
      },
      take: 50,
      orderBy: { dueDate: 'asc' },
    })
    result.checked = due.length

    for (const reminder of due) {
      let ruleId: string | undefined
      try {
        // Buscar la regla activa que creó este tipo de recordatorio (define la plantilla)
        const rule = await tdb.automationRule.findFirst({
          where: {
            action: 'create_reminder',
            reminderType: reminder.type,
            enabled: true,
          },
        })
        ruleId = rule?.id

        if (!rule || !rule.templateCode || !reminder.customer?.phone) {
          result.skipped++
          continue
        }

        // unique compuesto tenantId_code: findFirst plano (la extensión filtra tenant)
        const template = await tdb.whatsAppTemplate.findFirst({
          where: { code: rule.templateCode },
        })
        if (!template || !template.active) {
          result.skipped++
          continue
        }

        const wo = reminder.workOrder
        const context: AutomationContext = {
          customerName: `${reminder.customer.firstName} ${reminder.customer.lastName}`,
          phone: reminder.customer.phone,
          customerId: reminder.customerId,
          workOrderId: reminder.workOrderId,
          code: wo?.code || '',
          equipo: wo?.device ? `${wo.device.brand} ${wo.device.model}`.trim() : '',
          total: '',
          fecha: new Date(reminder.dueDate).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
        }

        const message = renderTemplate(template.body, context)

        // Dedupe: reminderId es @unique, si ya hay mensaje enviado no duplicar
        const alreadySent = await tdb.whatsAppMessage.findUnique({
          where: { reminderId: reminder.id },
        })
        if (alreadySent) {
          result.skipped++
          continue
        }

        await tdb.whatsAppMessage.create({
          data: {
            customerId: reminder.customerId,
            workOrderId: reminder.workOrderId,
            reminderId: reminder.id,
            templateId: template.id,
            toPhone: reminder.customer.phone,
            toName: context.customerName,
            message,
            status: 'sent',
            channel: 'whatsapp',
            sentBy: 'Automatización',
          },
        })

        // El recordatorio queda 'pending' para que se gestione manualmente en la agenda;
        // el mensaje único por reminderId evita reenvíos en siguientes sweeps.

        await logAutomation({
          ruleId: rule.id,
          workOrderId: reminder.workOrderId,
          customerId: reminder.customerId,
          trigger: `reminder_${reminder.type}`,
          phone: reminder.customer.phone,
          message,
          status: 'sent',
        })

        result.sent++
      } catch (e) {
        await logAutomation({
          ruleId,
          workOrderId: reminder.workOrderId,
          customerId: reminder.customerId,
          trigger: `reminder_${reminder.type}`,
          phone: reminder.customer?.phone || '',
          message: '',
          status: 'failed',
          error: e instanceof Error ? e.message : String(e),
        })
        result.skipped++
      }
    }
  } catch (e) {
    console.error('[Automations] Error en sweepDueReminders', e)
  }

  return result
}
