import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 })
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 })
}

export function notFound(message = 'Recurso no encontrado') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function serverError(message: string, error?: unknown) {
  console.error('[API Error]', message, error)
  return NextResponse.json({ error: message }, { status: 500 })
}

export function parseId(params: Record<string, string | string[]> | undefined): string | null {
  if (!params) return null
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  return id || null
}
