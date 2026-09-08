-- 0001-multi-tenant-backfill.sql
-- Base del multi-tenancy: crea Tenant/TenantUser, añade tenantId a las tablas raíz
-- y asigna TODOS los datos existentes al tenant piloto #1 (el taller actual del usuario).
-- NO toca constraints: `prisma db push` las añade después del backfill (sin pérdida de datos).

-- ================= Tenant + TenantUser =================
CREATE TABLE IF NOT EXISTS "Tenant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "plan" TEXT NOT NULL DEFAULT 'early_access',
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "Tenant"("slug");

CREATE TABLE IF NOT EXISTS "TenantUser" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'owner',
  "status" TEXT NOT NULL DEFAULT 'active',
  "email" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TenantUser_userId_tenantId_key" ON "TenantUser"("userId","tenantId");
CREATE INDEX IF NOT EXISTS "TenantUser_tenantId_idx" ON "TenantUser"("tenantId");
CREATE INDEX IF NOT EXISTS "TenantUser_userId_idx" ON "TenantUser"("userId");

-- Tenant piloto #1: el taller actual con todos sus datos
-- (updatedAt explícito: la tabla ya no tiene DEFAULT tras el primer push)
INSERT INTO "Tenant" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('tenant_pilot_1', 'Taller Principal', 'taller-principal', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- ================= Columna tenantId (nullable primero) =================
ALTER TABLE "Customer"          ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Device"            ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "WorkOrder"         ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Quote"             ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Part"              ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "RepairGuide"       ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Invoice"           ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "MonthlyAccounting" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Reminder"         ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "DailyTask"         ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "WhatsAppTemplate"  ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "WhatsAppConnection" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "AutomationRule"    ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "WorkshopSetting"   ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "User"              ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- ================= Backfill: todo lo existente pertenece al tenant piloto =================
UPDATE "Customer"          SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "Device"            SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "WorkOrder"         SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "Quote"             SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "Part"              SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "RepairGuide"       SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "Invoice"           SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "MonthlyAccounting" SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "Reminder"          SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "DailyTask"         SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "WhatsAppTemplate"  SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "WhatsAppConnection" SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "AutomationRule"    SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "WorkshopSetting"   SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;
UPDATE "User"              SET "tenantId" = 'tenant_pilot_1' WHERE "tenantId" IS NULL;

-- ================= NOT NULL tras el backfill =================
ALTER TABLE "Customer"          ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Device"            ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "WorkOrder"         ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Quote"             ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Part"              ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "RepairGuide"       ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Invoice"           ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "MonthlyAccounting" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Reminder"          ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "DailyTask"         ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "WhatsAppTemplate"  ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "WhatsAppConnection" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "AutomationRule"    ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "WorkshopSetting"   ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "User"              ALTER COLUMN "tenantId" SET NOT NULL;

-- La membresía owner se crea cuando el usuario confirme su cuenta Supabase
-- (el onboarding hace upsert de TenantUser con el uuid de auth).
