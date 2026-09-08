// Sonda: ¿qué valor exacto recibe `model` en $allOperations?
const { db } = await import('../src/lib/db')

const probe = (db as any).$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: any) {
        console.log(`PROBE model=${JSON.stringify(model)} op=${operation}`)
        return query(args)
      },
    },
  },
})

await probe.customer.count()
await probe.workOrder.count()
await probe.whatsAppTemplate.count()
await (db as any).$disconnect()
