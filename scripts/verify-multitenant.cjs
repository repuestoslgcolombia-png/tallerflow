// Verificación post-migración multi-tenant (temporal, borrar tras la verificación)
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  const counts = {
    tenants: await db.tenant.count(),
    tenantUsers: await db.tenantUser.count(),
    customers: await db.customer.count(),
    workOrders: await db.workOrder.count(),
    devices: await db.device.count(),
    parts: await db.part.count(),
    invoices: await db.invoice.count(),
    quotes: await db.quote.count(),
    settings: await db.workshopSetting.count(),
  }
  console.log('CONTEOS:', JSON.stringify(counts))

  const orphanCustomers = await db.customer.count({ where: { tenant: { is: null } } }).catch(() => 'n/a (sin FK suelta)' )
  const orphanWO = await db.workOrder.count({ where: { tenant: { is: null } } }).catch(() => 'n/a')
  console.log('huerfanos tenantId null -> customers:', orphanCustomers, 'workOrders:', orphanWO)

  const s = await db.workshopSetting.findFirst({ include: { tenant: true } })
  console.log('settings ->', s ? `${s.name} | tenantId=${s.tenantId} | tenant=${s.tenant.name}` : 'NINGUNO')

  const t = await db.tenant.findFirst({ include: { customers: true } })
  if (t) {
    console.log(`tenant piloto "${t.name}" (${t.slug}) con ${t.customers.length} clientes`)
  }

  const samples = await db.workOrder.findMany({ take: 2, select: { code: true, tenantId: true } })
  console.log('muestras WorkOrder:', JSON.stringify(samples))
}

main()
  .catch((e) => { console.error('FALLO:', e.message); process.exit(1) })
  .finally(() => db.$disconnect())
