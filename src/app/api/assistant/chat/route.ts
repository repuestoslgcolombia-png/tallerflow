import { NextRequest } from 'next/server'
import { chatStreamResponse, type ChatMessage } from '@/lib/assistant/agent'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
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
