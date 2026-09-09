// Limpieza de tenants de prueba (distintos del pilot) con sus seeds
const { db } = await import('../src/lib/db')

const orphans = await db.tenant.findMany({
  where: { id: { not: 'tenant_pilot_1' } },
})
console.log('Tenants no-pilot encontrados:', orphans.length)

for (const t of orphans) {
  console.log(`- ${t.id} (${t.name})`)
  await db.tenantUser.deleteMany({ where: { tenantId: t.id } })
  await db.workshopSetting.deleteMany({ where: { tenantId: t.id } })
  await db.whatsAppTemplate.deleteMany({ where: { tenantId: t.id } })
  await db.whatsAppConnection.deleteMany({ where: { tenantId: t.id } })
  await db.automationRule.deleteMany({ where: { tenantId: t.id } })
  await db.customer.deleteMany({ where: { tenantId: t.id } })
  await db.user.deleteMany({ where: { tenantId: t.id } })
  await db.tenant.delete({ where: { id: t.id } })
  console.log(`  eliminado: ${t.id}`)
}

const remaining = await db.tenant.count()
console.log('Tenants restantes:', remaining)
await db.$disconnect()
