// Verificación de aislamiento multi-tenant a nivel de la extensión dbFor.
// Crea un tenant efímero, verifica que dbFor(tenantA) no ve sus datos,
// que dbFor(tenantB) no ve los datos del taller principal, y limpia.
const { PrismaClient } = require('@prisma/client')

// Carga db-for.ts compilado: usamos ts via bunx? No — replicamos la lógica NO:
// importamos el módulo real con ts-node no disponible. Alternativa: el archivo
// src/lib/tenant/db-for.ts es TS. Lo cargamos con el runtime de Bun o lo
// transcribimos. Para verificación usamos Bun (el proyecto usa bun).
console.log('Este script debe correr con: bun scripts/verify-isolation.ts')
console.log('Ejecutando con bun...')

async function main() {
  const { db } = await import('../src/lib/db')
  const { dbFor } = await import('../src/lib/tenant/db-for')

  // Tenant A = pilot (con datos), Tenant B = efímero
  const tenantB = await db.tenant.create({
    data: { name: 'Taller Test B', slug: 'test-b-' + Date.now(), plan: 'early_access', status: 'active' },
  })
  console.log('Tenant B creado:', tenantB.id)

  const tdbB = dbFor(tenantB.id)

  // 1) Crear un cliente en B con la extensión (debe inyectar tenantId)
  const custB = await tdbB.customer.create({
    data: { firstName: 'Cliente', lastName: 'De B', phone: '3000000001', address: 'Calle B 123' },
  })
  console.log('Cliente B creado con tenantId:', custB.tenantId === tenantB.id ? 'OK' : 'FALLO: ' + custB.tenantId)

  // 2) Tenant A (pilot) NO debe ver al cliente de B
  const tenantA = await db.tenant.findUnique({ where: { id: 'tenant_pilot_1' } })
  const tdbA = dbFor(tenantA.id)
  const countB_in_A = await tdbA.customer.count({ where: { id: custB.id } })
  console.log('Aislamiento A→B:', countB_in_A === 0 ? 'OK (A no ve datos de B)' : 'FALLO: A ve datos de B')

  // 3) B NO debe ver los clientes de A
  const countA_in_B = await tdbB.customer.count()
  console.log('Aislamiento B→A:', countA_in_B === 1 ? 'OK (B solo ve su cliente)' : 'FALLO: B ve ' + countA_in_B + ' clientes')

  // 4) Update/delete de B sobre un id de A debe fallar (protección cross-tenant)
  const custA = await tdbA.customer.findFirst()
  if (custA) {
    try {
      await tdbB.customer.update({ where: { id: custA.id }, data: { firstName: 'Hack' } })
      console.log('Protección update cross-tenant: FALLO (B modificó cliente de A)')
    } catch (e) {
      console.log('Protección update cross-tenant: OK (rechazado)')
    }
    try {
      await tdbB.customer.delete({ where: { id: custA.id } })
      console.log('Protección delete cross-tenant: FALLO (B borró cliente de A)')
    } catch (e) {
      console.log('Protección delete cross-tenant: OK (rechazado)')
    }
  }

  // 5) findUnique de B sobre id de A → null o P2025 (no fuga de datos)
  if (custA) {
    try {
      const leak = await tdbB.customer.findUnique({ where: { id: custA.id } })
      console.log('findUnique cross-tenant:', leak === null ? 'OK (null)' : 'FALLO (fuga de datos)')
    } catch (e: any) {
      console.log('findUnique cross-tenant:', e?.code === 'P2025' ? 'OK (P2025, rechazado)' : 'FALLO: ' + e?.message)
    }
  }

  // 6) findMany de B no trae ningún cliente de A
  const allB = await tdbB.customer.findMany()
  console.log('findMany B sin fugas:', allB.length === 1 && allB[0].id === custB.id ? 'OK' : 'FALLO')

  // Limpieza
  await db.customer.delete({ where: { id: custB.id } })
  await db.tenant.delete({ where: { id: tenantB.id } })
  console.log('Limpieza: OK')

  await db.$disconnect()
}

main().catch((e) => { console.error('ERROR:', e); process.exit(1) })
