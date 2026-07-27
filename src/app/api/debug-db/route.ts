import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.DATABASE_URL || 'NOT SET'
  const masked = url.substring(0, 50) + '...'
  return NextResponse.json({
    DATABASE_URL_prefix: masked,
    DATABASE_URL_length: url.length,
    node_env: process.env.NODE_ENV,
    includes_neon: url.includes('neon.tech'),
    includes_supabase: url.includes('supabase'),
    vercel_env: process.env.VERCEL_ENV,
  })
}
