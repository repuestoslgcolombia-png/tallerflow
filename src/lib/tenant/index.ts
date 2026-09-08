// Barrel multi-tenant: sesión con taller + cliente Prisma scoped
export { getTenantSession, requireTenantSession, TenantSessionError, type TenantSession } from './session'
export { dbFor, tenantIdForCustomer } from './db-for'
export { seedTenantDefaults } from './seed'
