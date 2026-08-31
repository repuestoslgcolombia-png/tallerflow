import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface RepairAction {
  code: string
  serviceType: string
  currentStatus: string
  targetStatus: string
  reason: string
}

const repairs: RepairAction[] = [
  { code: 'OT-2026-029', serviceType: 'revision', currentStatus: 'quoted', targetStatus: 'approved', reason: 'Orden revision en estado quoted inválido → approved' },
  { code: 'OT-2026-019', serviceType: 'revision', currentStatus: 'diagnosing', targetStatus: 'received', reason: 'Orden revision en estado diagnosing inválido → received' },
  { code: 'OT-2026-027', serviceType: 'instalacion', currentStatus: 'quoted', targetStatus: 'received', reason: 'Orden instalacion en estado quoted inválido → received' },
  { code: 'OT-2024-002', serviceType: 'revision', currentStatus: 'in_progress', targetStatus: 'approved', reason: 'Legacy seed: revision in in_progress → approved' },
  { code: 'OT-2024-003', serviceType: 'revision', currentStatus: 'quoted', targetStatus: 'approved', reason: 'Legacy seed: revision in quoted → approved' },
  { code: 'OT-2024-004', serviceType: 'revision', currentStatus: 'diagnosing', targetStatus: 'received', reason: 'Legacy seed: revision in diagnosing → received' },
]

async function main() {
  console.log('=== Reparación de órdenes con estados inconsistentes ===\n')

  for (const repair of repairs) {
    const order = await prisma.workOrder.findUnique({ where: { code: repair.code } })
    if (!order) {
      console.log(`⚠️  ${repair.code}: No encontrada, saltando`)
      continue
    }

    if (order.status === repair.targetStatus) {
      console.log(`✓  ${repair.code}: Ya en estado correcto (${repair.targetStatus})`)
      continue
    }

    if (order.status !== repair.currentStatus) {
      console.log(`⚠️  ${repair.code}: Estado actual (${order.status}) no coincide con esperado (${repair.currentStatus}), saltando para revisión manual`)
      continue
    }

    console.log(`🔧  ${repair.code}: ${order.status} → ${repair.targetStatus} (${repair.reason})`)

    await prisma.$transaction(async (tx) => {
      await tx.workOrder.update({
        where: { id: order.id },
        data: { status: repair.targetStatus as any },
      })

      await tx.workOrderEvent.create({
        data: {
          workOrderId: order.id,
          eventType: 'status_change',
          fromStatus: order.status,
          toStatus: repair.targetStatus,
          title: 'Corrección automática',
          description: `Estado corregido automáticamente: ${repair.reason}`,
          createdBy: 'Sistema (reparación)',
        },
      })
    })

    console.log(`✅  ${repair.code}: Corregido a ${repair.targetStatus}`)
  }

  console.log('\n=== Reparación completada ===')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })