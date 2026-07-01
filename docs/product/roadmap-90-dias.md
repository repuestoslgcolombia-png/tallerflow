# Roadmap 90 días — TallerFlow

## Fase 1 — MVP base operativo (Días 1–30) ✅ COMPLETADO

**Objetivo:** reemplazar papel y WhatsApp desordenado por un flujo digital mínimo que permita operar una sucursal.

### Semana 1 ✅
- [x] Setup del repositorio: Next.js + TypeScript + Prisma + shadcn/ui
- [x] CRUD de clientes con búsqueda y historial
- [x] CRUD de equipos vinculados a clientes

### Semana 2 ✅
- [x] Crear órdenes de trabajo con estado inicial
- [x] Flujo de estados: `received → diagnosing → quoted → approved → in_progress → ready → delivered`
- [x] Timeline de cambios de estado por orden

### Semana 3 ✅
- [x] Registro de diagnóstico técnico
- [x] Generación de cotización con items dinámicos (repuestos + mano de obra)
- [x] Link de aprobación público para el cliente
- [x] Cambio automático de estado al aprobar

### Semana 4 ✅
- [x] Dashboard operativo (órdenes abiertas, pendientes de aprobación, listas, ingresos)
- [x] Gráfico de órdenes por día (últimos 14 días)
- [x] Carga de trabajo por técnico

**Meta de la fase:** ✅ operar completamente 1 sucursal con el sistema.

---

## Fase 2 — Eficiencia y control (Días 31–60) ✅ COMPLETADO

**Objetivo:** reducir retrasos operativos y aumentar la visibilidad de la rentabilidad.

- [x] Módulo de inventario de repuestos (entradas/salidas, stock mínimo)
- [x] Alertas de stock bajo en dashboard
- [x] Asignación de técnicos y vista de carga de trabajo
- [x] Recordatorios post-servicio (seguimiento, garantía, reseña, mantenimiento)
- [x] Módulo de facturación con registro de pagos parciales/totales
- [x] Modo oscuro/claro/sistema con persistencia
- [x] Mensajería por WhatsApp integrada con plantillas
- [x] Diseño responsive optimizado (móvil, tablet, desktop)
- [ ] Notificaciones automáticas al cliente por email
- [ ] Reportes: tiempo promedio de reparación, tasa de aprobación, órdenes por técnico
- [ ] Adjuntar fotos al ingreso del equipo

**Meta de la fase:** ✅ reducir tiempos de espera y mejorar la rentabilidad visible.

---

## Fase 3 — Escala y preparación SaaS (Días 61–90) 🔲 PENDIENTE

**Objetivo:** dejar la base lista para crecimiento multi-sucursal y/o comercialización.

- [ ] Autenticación con NextAuth (login, registro, recuperación)
- [ ] Roles y permisos (admin, recepcionista, técnico)
- [ ] Soporte multi-sucursal (estructura de datos y UI)
- [ ] Permisos avanzados por rol y sucursal
- [ ] Exportación de reportes en PDF/CSV
- [ ] Registro de auditoría de cambios
- [ ] Landing page + pricing (si se venderá como SaaS)
- [ ] Proceso de onboarding para nuevos talleres
- [ ] Integración con WhatsApp Business API oficial
- [ ] PWA / app móvil

**Meta de la fase:** versión "Pro" validada y lista para replicar en otros talleres.
