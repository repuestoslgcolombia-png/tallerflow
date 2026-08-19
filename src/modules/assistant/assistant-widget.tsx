'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  Check,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Eraser,
  Mic,
  Square,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useAppStore, type View } from '@/store/app-store'

type PendingCard = {
  pendingId: string
  action: string
  entity: string
  resumen: string
}

type ResultCard = {
  message: string
  data: Record<string, unknown>
  entity: string
}

type ChatMsg = {
  id: string
  role: 'user' | 'assistant'
  content: string
  pendingCards?: PendingCard[]
  resultCards?: ResultCard[]
  error?: boolean
}

type StreamItem =
  | { type: 'text'; delta: string }
  | { type: 'pending'; pendingId: string; action: string; entity: string; resumen: string }
  | { type: 'done' }
  | { type: 'error'; error: string }

type LinkTarget = {
  view: View
  params: {
    workOrderId?: string
    customerId?: string
    quoteId?: string
    invoiceId?: string
    reminderId?: string
  }
  label: string
}

const CHIPS = [
  { label: 'Registro rápido', prompt: 'Recibe a un cliente nuevo con un equipo que necesita reparación.' },
  { label: 'Buscar cliente', prompt: 'Busca al cliente por nombre o teléfono.' },
  { label: 'Crear recordatorio', prompt: 'Crea un recordatorio de seguimiento para la última orden.' },
  { label: 'Resumen del día', prompt: '¿Cómo está el taller hoy?' },
  { label: 'Repuestos con stock bajo', prompt: '¿Qué repuestos tienen stock bajo?' },
]

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `m_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function buildLink(data: Record<string, unknown>): LinkTarget | null {
  if (data.workOrderId)
    return { view: 'work-order-detail', params: { workOrderId: String(data.workOrderId) }, label: 'Abrir orden' }
  if (data.customerId)
    return { view: 'customer-detail', params: { customerId: String(data.customerId) }, label: 'Abrir cliente' }
  if (data.quoteId) return { view: 'quotes', params: { quoteId: String(data.quoteId) }, label: 'Ver cotización' }
  if (data.invoiceId) return { view: 'invoices', params: { invoiceId: String(data.invoiceId) }, label: 'Ver factura' }
  if (data.reminderId) return { view: 'reminders', params: { reminderId: String(data.reminderId) }, label: 'Ver recordatorio' }
  if (data.taskId) return { view: 'daily-agenda', params: {}, label: 'Abrir agenda' }
  return null
}

export function AssistantWidget() {
  const navigate = useAppStore((s) => s.navigate)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming, open])

  const updateMsg = useCallback((id: string, updater: (m: ChatMsg) => ChatMsg) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)))
  }, [])

  const handleStreamItem = useCallback(
    (item: StreamItem, assistantId: string) => {
      if (item.type === 'text') {
        updateMsg(assistantId, (m) => ({ ...m, content: m.content + item.delta }))
      } else if (item.type === 'pending') {
        updateMsg(assistantId, (m) => ({
          ...m,
          pendingCards: [
            ...(m.pendingCards || []),
            {
              pendingId: item.pendingId,
              action: item.action,
              entity: item.entity,
              resumen: item.resumen,
            },
          ],
        }))
      } else if (item.type === 'error') {
        updateMsg(assistantId, (m) => ({ ...m, error: true }))
      }
    },
    [updateMsg]
  )

  const runStream = useCallback(
    async (history: { role: 'user' | 'assistant'; content: string }[], assistantId: string) => {
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        })
        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => null)
          throw new Error(err?.error || 'No se pudo conectar con el asistente.')
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            if (!line.trim()) continue
            try {
              handleStreamItem(JSON.parse(line) as StreamItem, assistantId)
            } catch {
              /* línea inválida: ignorar */
            }
          }
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          updateMsg(assistantId, (m) => ({
            ...m,
            error: true,
            content: m.content || 'Lo siento, hubo un problema de conexión con el asistente. Inténtalo de nuevo.',
          }))
        }
      } finally {
        setStreaming(false)
        abortRef.current = null
      }
    },
    [handleStreamItem, updateMsg]
  )

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || streaming) return
      const userMsg: ChatMsg = { id: uid(), role: 'user', content: trimmed }
      const assistantId = uid()
      const assistantMsg: ChatMsg = {
        id: assistantId,
        role: 'assistant',
        content: '',
        pendingCards: [],
        resultCards: [],
      }
      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setInput('')
      setStreaming(true)

      const history = [...messages, userMsg]
        .filter((m) => m.content || m.role === 'user')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      void runStream(history, assistantId)
    },
    [messages, streaming, runStream]
  )

  const confirmPending = useCallback(
    async (msgId: string, card: PendingCard) => {
      setBusy((b) => ({ ...b, [card.pendingId]: true }))
      try {
        const res = await fetch('/api/assistant/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pendingId: card.pendingId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'No se pudo confirmar la acción.')
        if (data.ok === false) throw new Error(data.error || 'La acción no pudo ejecutarse.')

        updateMsg(msgId, (m) => ({
          ...m,
          pendingCards: (m.pendingCards || []).filter((p) => p.pendingId !== card.pendingId),
          resultCards: [
            ...(m.resultCards || []),
            { message: data.message, data: data.data || {}, entity: card.entity },
          ],
        }))
        toast.success('Acción ejecutada')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'No se pudo ejecutar la acción.')
        updateMsg(msgId, (m) => ({
          ...m,
          pendingCards: (m.pendingCards || []).filter((p) => p.pendingId !== card.pendingId),
        }))
      } finally {
        setBusy((b) => ({ ...b, [card.pendingId]: false }))
      }
    },
    [updateMsg]
  )

  const cancelPending = useCallback(
    (msgId: string, pendingId: string) => {
      updateMsg(msgId, (m) => ({
        ...m,
        pendingCards: (m.pendingCards || []).filter((p) => p.pendingId !== pendingId),
      }))
      toast.info('Acción cancelada. No se guardó nada.')
    },
    [updateMsg]
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clearConversation = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setStreaming(false)
  }, [])

  const handleVoice = useCallback(() => {
    const SR =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null
    if (!SR) {
      toast.info('Tu navegador no soporta dictado por voz.')
      return
    }
    const rec = new SR()
    rec.lang = 'es-CO'
    rec.interimResults = true
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as ArrayLike<any>)
        .map((r: any) => r[0]?.transcript || '')
        .join(' ')
      setInput(transcript)
    }
    rec.onerror = () => toast.error('No se pudo capturar la voz.')
    rec.start()
  }, [])

  const renderLink = (link: LinkTarget) => (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5"
      onClick={() => {
        navigate(link.view, link.params)
        setOpen(false)
      }}
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {link.label}
    </Button>
  )

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-[60] flex h-[min(70vh,34rem)] w-[min(92vw,26rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b bg-gradient-to-r from-violet-600 to-sky-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Hermes</p>
                <p className="text-[11px] leading-tight text-white/85">Asistente del taller</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearConversation}
                title="Limpiar conversación"
                className="rounded-md p-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
              >
                <Eraser className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Cerrar"
                className="rounded-md p-1.5 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-3 p-4">
              {messages.length === 0 && (
                <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4">
                  <p className="text-sm font-medium">Hola, soy Hermes 👋</p>
                  <p className="text-xs text-muted-foreground">
                    Te ayudo a gestionar el taller: registros, órdenes, recordatorios, cotizaciones,
                    facturas y el estado del día. Las acciones de escritura siempre las confirmas tú.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {CHIPS.map((c) => (
                      <button
                        key={c.label}
                        onClick={() => setInput(c.prompt)}
                        className="rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) =>
                m.role === 'user' ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex flex-col gap-2">
                    <div className="flex max-w-[95%] flex-col gap-1 rounded-2xl rounded-tl-sm border bg-card px-3.5 py-2.5">
                      {m.content ? (
                        <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : streaming && !m.pendingCards?.length ? (
                        <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Pensando...</span>
                        </div>
                      ) : null}
                      {m.error && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Ocurrió un error al procesar tu solicitud.
                        </div>
                      )}
                    </div>

                    {(m.pendingCards || []).map((card) => (
                      <Card key={card.pendingId} className="border-amber-300 bg-amber-50/70 p-3 dark:border-amber-700 dark:bg-amber-950/30">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                            Confirmar acción
                          </span>
                          <Badge variant="outline" className="ml-auto text-[10px]">
                            {card.entity}
                          </Badge>
                        </div>
                        <p className="mb-2.5 text-[13px] leading-snug text-foreground">{card.resumen}</p>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="gap-1.5"
                            disabled={busy[card.pendingId]}
                            onClick={() => confirmPending(m.id, card)}
                          >
                            {busy[card.pendingId] ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5"
                            disabled={busy[card.pendingId]}
                            onClick={() => cancelPending(m.id, card.pendingId)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancelar
                          </Button>
                        </div>
                      </Card>
                    ))}

                    {(m.resultCards || []).map((rc, i) => {
                      const link = buildLink(rc.data)
                      return (
                        <Card
                          key={`${rc.entity}-${i}`}
                          className="border-emerald-300 bg-emerald-50/70 p-3 dark:border-emerald-700 dark:bg-emerald-950/30"
                        >
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                              {rc.entity} creado
                            </span>
                          </div>
                          <div className="mb-2.5 text-[13px] leading-snug">
                            <ReactMarkdown>{rc.message}</ReactMarkdown>
                          </div>
                          {link && renderLink(link)}
                        </Card>
                      )
                    })}
                  </div>
                )
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                title="Dictado por voz"
                onClick={handleVoice}
                className="h-9 w-9 shrink-0"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send(input)
                  }
                }}
                placeholder="Escribe un mensaje... (Enter para enviar)"
                className="max-h-28 min-h-[40px] resize-none text-sm"
                rows={1}
              />
              {streaming ? (
                <Button
                  size="icon"
                  title="Detener"
                  onClick={stop}
                  className="h-9 w-9 shrink-0 bg-rose-600 hover:bg-rose-700"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  title="Enviar"
                  onClick={() => void send(input)}
                  disabled={!input.trim()}
                  className="h-9 w-9 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
              Las escrituras se ejecutan solo después de que confirmas.
            </p>
          </div>
        </div>
      )}

      <Button
        size="icon"
        onClick={() => setOpen((o) => !o)}
        title="Asistente Hermes"
        className="fixed bottom-4 right-4 z-[60] h-12 w-12 rounded-full shadow-lg"
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </Button>
    </>
  )
}
