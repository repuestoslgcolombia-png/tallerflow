import { NextRequest } from 'next/server'
import { dbFor, requireTenantSession, TenantSessionError } from '@/lib/tenant'
import { ok, badRequest, serverError } from '@/lib/api'
import QRCode from 'qrcode'
import { randomBytes, randomInt } from 'crypto'

// Helper: conexión del taller (1 por tenant, id cuid — ya no existe 'default')
async function getOrCreateConnection(tdb: any) {
  let conn = await tdb.whatsAppConnection.findFirst()
  if (!conn) {
    // tenantId lo inyecta dbFor() en runtime
    conn = await tdb.whatsAppConnection.create({ data: {} as any })
  }
  return conn
}

// GET /api/whatsapp/connection - obtener estado de conexión
export async function GET() {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    let conn = await getOrCreateConnection(tdb)

    let qr: string | null = null

    // Si está en estado pairing y el QR no ha expirado, regenerar la imagen QR
    if (conn.status === 'pairing' && conn.qrToken && conn.qrExpiresAt) {
      if (new Date() > conn.qrExpiresAt) {
        // QR expirado, limpiar
        await tdb.whatsAppConnection.update({
          where: { id: conn.id },
          data: { status: 'disconnected', pairingCode: null, qrToken: null, qrExpiresAt: null },
        })
        conn = { ...conn, status: 'disconnected', pairingCode: null, qrToken: null, qrExpiresAt: null }
      } else {
        // Regenerar la imagen QR desde el token almacenado
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const qrPayload = JSON.stringify({
          type: 'tallerflow_whatsapp_pair',
          token: conn.qrToken,
          code: conn.pairingCode,
          url: `${baseUrl}/api/whatsapp/verify?token=${conn.qrToken}`,
          expires: conn.qrExpiresAt.toISOString(),
        })
        qr = await QRCode.toDataURL(qrPayload, {
          width: 280,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
        })
      }
    }

    return ok({
      id: conn.id,
      phone: conn.phone,
      displayName: conn.displayName,
      businessName: conn.businessName,
      status: conn.status,
      pairingCode: conn.pairingCode,
      qrToken: conn.qrToken,
      qr,
      qrExpiresAt: conn.qrExpiresAt,
      connectedAt: conn.connectedAt,
      lastSeenAt: conn.lastSeenAt,
    })
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error al obtener conexión', e)
  }
}

// POST /api/whatsapp/connection - generar QR de emparejamiento o conectar
// Body: { action: 'pair' | 'connect' | 'disconnect', phone?, displayName?, businessName? }
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenantSession()
    const tdb = dbFor(session.tenantId)
    const body = await req.json()
    const { action } = body

    const conn = await getOrCreateConnection(tdb)

    // ============== GENERAR QR DE EMPAREJAMIENTO ==============
    if (action === 'pair') {
      const pairingCode = String(randomInt(100000, 999999))
      const qrToken = randomBytes(16).toString('hex')
      const qrExpiresAt = new Date(Date.now() + 2 * 60 * 1000) // 2 minutos

      // El QR contiene un enlace con el token de emparejamiento
      // En producción, este enlace abriría WhatsApp con un mensaje de verificación
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const qrPayload = JSON.stringify({
        type: 'tallerflow_whatsapp_pair',
        token: qrToken,
        code: pairingCode,
        url: `${baseUrl}/api/whatsapp/verify?token=${qrToken}`,
        expires: qrExpiresAt.toISOString(),
      })

      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      await tdb.whatsAppConnection.update({
        where: { id: conn.id },
        data: {
          status: 'pairing',
          pairingCode,
          qrToken,
          qrExpiresAt,
        },
      })

      return ok({
        status: 'pairing',
        pairingCode,
        qrToken,
        qrExpiresAt,
        qr: qrDataUrl,
      })
    }

    // ============== CONFIRMAR CONEXIÓN (después de escanear) ==============
    if (action === 'connect') {
      if (!body.phone) return badRequest('Teléfono es obligatorio')
      if (!conn.pairingCode) return badRequest('No hay código de emparejamiento activo')
      if (conn.qrExpiresAt && new Date() > conn.qrExpiresAt) {
        return badRequest('El código QR ha expirado. Genera uno nuevo.')
      }

      const updated = await tdb.whatsAppConnection.update({
        where: { id: conn.id },
        data: {
          status: 'connected',
          phone: body.phone,
          displayName: body.displayName || null,
          businessName: body.businessName || null,
          connectedAt: new Date(),
          lastSeenAt: new Date(),
          pairingCode: null,
          qrToken: null,
          qrExpiresAt: null,
        },
      })

      return ok({
        status: 'connected',
        phone: updated.phone,
        displayName: updated.displayName,
        businessName: updated.businessName,
        connectedAt: updated.connectedAt,
      })
    }

    // ============== DESCONECTAR ==============
    if (action === 'disconnect') {
      await tdb.whatsAppConnection.update({
        where: { id: conn.id },
        data: {
          status: 'disconnected',
          phone: null,
          displayName: null,
          pairingCode: null,
          qrToken: null,
          qrExpiresAt: null,
          connectedAt: null,
          lastSeenAt: null,
        },
      })

      return ok({ status: 'disconnected' })
    }

    // ============== ACTUALIZAR PERFIL DE NEGOCIO ==============
    if (action === 'update_profile') {
      const updated = await tdb.whatsAppConnection.update({
        where: { id: conn.id },
        data: {
          displayName: body.displayName !== undefined ? body.displayName : undefined,
          businessName: body.businessName !== undefined ? body.businessName : undefined,
        },
      })
      return ok(updated)
    }

    return badRequest(`Acción no soportada: ${action}`)
  } catch (e) {
    if (e instanceof TenantSessionError) {
      return badRequest(e.message)
    }
    return serverError('Error en conexión WhatsApp', e)
  }
}
