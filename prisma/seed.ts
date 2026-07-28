import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const users = [
    { name: 'Liana Perez', email: 'liana@tallerflow.co', role: 'receptionist' },
    { name: 'Michael Morales', email: 'michael.m@tallerflow.co', role: 'technician' },
    { name: 'Michael', email: 'michael@tallerflow.co', role: 'admin' },
  ]

  for (const u of users) {
    await db.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: u,
    })
  }

  console.log('✅ 3 usuarios creados exitosamente')
}

main().catch(console.error).finally(() => db.$disconnect())