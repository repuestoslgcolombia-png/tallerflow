import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError } from '@/lib/api'
import QRCode from 'qrcode'
import { randomBytes, randomInt } from 'crypto'

// GET /api/whatsapp/connection - obtener estado de conexión
export async function GET() {
  try {
    let conn = await db.whatsAppConnection.findUnique({ where: { id: 'default' } })
    if (!conn) {
      conn = await db.whatsAppConnection.create({ data: { id: 'default' } })
    }

    let qr: string | null = null

    // Si está en estado pairing y el QR no ha expirado, regenerar la imagen QR
    if (conn.status === 'pairing' && conn.qrToken && conn.qrExpiresAt) {
      if (new Date() > conn.qrExpiresAt) {
        // QR expirado, limpiar
        await db.whatsAppConnection.update({
          where: { id: 'default' },
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
    return serverError('Error al obtener conexión', e)
  }
}

// POST /api/whatsapp/connection - generar QR de emparejamiento o conectar
// Body: { action: 'pair' | 'connect' | 'disconnect', phone?, displayName?, businessName? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    let conn = await db.whatsAppConnection.findUnique({ where: { id: 'default' } })
    if (!conn) {
      conn = await db.whatsAppConnection.create({ data: { id: 'default' } })
    }

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

      const updated = await db.whatsAppConnection.update({
        where: { id: 'default' },
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

      const updated = await db.whatsAppConnection.update({
        where: { id: 'default' },
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
      await db.whatsAppConnection.update({
        where: { id: 'default' },
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
      const updated = await db.whatsAppConnection.update({
        where: { id: 'default' },
        data: {
          displayName: body.displayName !== undefined ? body.displayName : undefined,
          businessName: body.businessName !== undefined ? body.businessName : undefined,
        },
      })
      return ok(updated)
    }

    return badRequest(`Acción no soportada: ${action}`)
  } catch (e) {
    return serverError('Error en conexión WhatsApp', e)
  }
}
