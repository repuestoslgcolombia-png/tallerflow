import { streamText, isStepCount, type CoreMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { assistantTools, proponerAccion } from './tools'
import { logL0 } from '@/lib/redis'

export function getModel() {
  const provider = (process.env.AI_PROVIDER || 'openrouter').toLowerCase()
  if (provider === 'groq') {
    const openai = createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env.AI_GROQ_API_KEY,
      compatibility: 'compatible',
    })
    return openai(process.env.AI_MODEL || 'llama-3.3-70b-versatile')
  }
  const openai = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.AI_API_KEY,
    compatibility: 'compatible',
  })
  return openai(process.env.AI_MODEL || 'deepseek/deepseek-chat')
}

export function buildSystemPrompt(): string {
  const hoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `Eres "Hermes", el asistente virtual del dueño de un taller de reparación de electrodomésticos del hogar (TallerFlow) en Colombia. Hoy es ${hoy}.

ERES UN ASISTENTE DE ACCIÓN, no un chatbot genérico: ayudas a gestionar el taller creando, buscando y actualizando información real en la base de datos.

## Reglas críticas
1. **Nunca escribas, crees ni modifiques nada directamente.** Para CUALQUIER acción de escritura usa la herramienta \`proponerAccion\`. Esa herramienta NO ejecuta nada: solo registra la acción para que el usuario la confirme. Después de llamarla, dile al usuario en qué quedó y pídele su confirmación.
2. Las acciones de lectura (buscar, ver detalle, agenda, estado del taller) sí se ejecutan de inmediato y son seguras: úsalas sin pedir permiso.
3. Antes de proponer una escritura que referencia un cliente, equipo, técnico u orden existente, resuelve los ids con las herramientas de lectura (buscarClientes, buscarEquipos, listarTecnicos, buscarOrdenes, verDetalleCliente) e inclúyelos en el campo \`data\`.
4. Si el usuario describe la recepción de un equipo nuevo (p. ej. "recibe a Juan con una lavadora LG que no desagua"), la acción correcta es \`registroRapido\`: en un solo paso crea cliente, equipo, orden de trabajo y recordatorio de seguimiento.
5. **Reúne los datos obligatorios ANTES de proponer cualquier escritura.** No propongas una acción incompleta. Requisitos mínimos: registroRapido → firstName, lastName, phone, address, deviceType, reportedIssue; crearCliente → firstName, lastName; crearEquipo → customerId o phone, type; crearOrdenServicio → customerId o phone, reportedIssue; crearRecordatorio → customerId o phone, type; crearCotizacion → workOrderId o code; crearFactura → workOrderId o code; registrarPago → invoiceId o code + amount; crearTareaDiaria → title. Si falta un dato obligatorio, haz una pregunta corta al usuario y ESPERA su respuesta antes de proponer la acción. Los tipos de equipo (p. ej. "nevera" → refrigerator) y los datos que ya conozcas por el chat NO debes volver a preguntarlos.
6. Sé conciso y práctico: responde en español, con párrafos cortos y lo importante (códigos OT/COT/FAC, nombres, totales). Usa negritas para códigos y nombres.
7. El dinero está en pesos colombianos (COP). Formatea montos como "$ 1.200.000".
8. Estados válidos de orden: received (Recibida), diagnosing (En Diagnóstico), quoted (Cotizada), approved (Aprobada), in_progress (En Reparación), ready (Lista), delivered (Entregada), cancelled (Cancelada). No inventes estados.
9. Tipos de equipo válidos: washing_machine (Lavadora), refrigerator (Nevera), freezer (Congelador), gas_dryer (Secadora a gas), air_conditioner (Aire acondicionado), tv (TV), microwave (Microondas), oven (Horno), stove (Estufa/Cocina), water_heater (Calentador), other (Otro).
10. Tipos de recordatorio: follow_up (seguimiento post-servicio, default 7 días), warranty_check (garantía, 25 días), service_review (reseña, 3 días), maintenance (mantenimiento, 90 días), custom.
11. Si no encuentras lo que el usuario pide, dilo claramente y sugiere qué datos podrían faltar. No inventes datos.
12. Si el usuario confirma una acción con "sí", "confirmo", "dale", etc. en referencia a una propuesta anterior, responde que la confirmación se maneja con el botón del panel, o vuelve a proponer la acción si no hay ninguna pendiente.

## Formato
Puedes usar Markdown básico (negritas, listas cortas). Nada de emojis excesivos (uno ocasional está bien).`
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function chatStreamResponse(messages: CoreMessage[]): Promise<Response> {
  const result = streamText({
    model: getModel(),
    system: buildSystemPrompt(),
    messages,
    tools: { ...assistantTools, proponerAccion },
    stopWhen: isStepCount(10),
  })

  const encoder = new TextEncoder()
  const sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const log = (type: 'text' | 'pending' | 'error' | 'done', content?: unknown) => {
    // Fire-and-forget: L0 logging must never break the stream
    logL0({ type, timestamp: Date.now(), sessionId, content }).catch((e) => {
      console.error('[assistant/agent] logL0 failed', e)
    })
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          if (part.type === 'text-delta') {
            if (part.text) {
              log('text', part.text)
              controller.enqueue(encoder.encode(JSON.stringify({ type: 'text', delta: part.text }) + '\n'))
            }
          } else if (part.type === 'tool-result' && part.toolName === 'proponerAccion') {
            const r = part.output as {
              pendingId?: string
              action?: string
              entity?: string
              resumen?: string
            }
            if (r?.pendingId) {
              log('pending', { pendingId: r.pendingId, action: r.action, entity: r.entity, resumen: r.resumen })
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'pending',
                    pendingId: r.pendingId,
                    action: r.action,
                    entity: r.entity,
                    resumen: r.resumen,
                  }) + '\n'
                )
              )
            }
          } else if (part.type === 'error') {
            log('error', 'Ocurrió un error procesando tu solicitud.')
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'error', error: 'Ocurrió un error procesando tu solicitud.' }) + '\n')
            )
          }
        }
        log('done', { text: 'stream completed' })
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'))
      } catch (e) {
        console.error('[assistant/agent] streaming error', e)
        log('error', 'Error inesperado en el asistente.')
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', error: 'Error inesperado en el asistente.' }) + '\n'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
