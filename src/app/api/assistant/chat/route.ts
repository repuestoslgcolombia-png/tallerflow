import { NextRequest } from 'next/server'
import { chatStreamResponse, type ChatMessage } from '@/lib/assistant/agent'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 20 mensajes por IP por minuto (protege costos del LLM)
    const rl = await checkRateLimit(`assistant:${getClientIp(req)}`, 20, 60)
    if (!rl.allowed) {
      return Response.json(
        { error: 'Has enviado demasiados mensajes. Espera un momento.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const messages = body?.messages
    if (!Array.isArray(messages)) {
      return Response.json({ error: 'Formato inválido: se espera un arreglo de mensajes.' }, { status: 400 })
    }
    const clean: ChatMessage[] = messages
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-30)
    return await chatStreamResponse(clean)
  } catch (e) {
    console.error('[api/assistant/chat]', e)
    return Response.json({ error: 'No pude iniciar la conversación con el asistente.' }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ ok: true, name: 'Hermes - Asistente de TallerFlow', status: 'ready' })
}
