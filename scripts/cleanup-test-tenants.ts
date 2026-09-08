// Limpieza de tenants de prueba huérfanos (creados por verify-isolation fallidas)
const { db } = await import('../src/lib/db')

const orphans = await db.tenant.findMany({
  where: { id: { not: 'tenant_pilot_1' } },
  include: { _count: { select: { customers: true, devices: true, workOrders: true, users: true, settings: true } } },
})
console.log('Tenants no-pilot encontrados:', orphans.length)

for (const t of orphans) {
  console.log(`- ${t.id} (${t.name}): clientes=${t._count.customers}`)
  // La FK en cascada limpia dependientes; borramos clientes sueltos primero si cascada no aplica
  await db.customer.deleteMany({ where: { tenantId: t.id } })
  await db.user.deleteMany({ where: { tenantId: t.id } })
  await db.tenant.delete({ where: { id: t.id } })
  console.log(`  eliminado: ${t.id}`)
}

const remaining = await db.tenant.count()
console.log('Tenants restantes:', remaining)
await db.$disconnect()
