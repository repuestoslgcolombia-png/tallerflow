const { PrismaClient } = require('@prisma/client');
// Use the SAME db.ts approach - just read env
const p = new PrismaClient({ log: ['error', 'warn'] });
p.$connect()
  .then(() => { console.log('CONNECTED!'); return p.$disconnect(); })
  .catch(e => { console.log('ERROR:', e.message?.substring(0, 300)); });
