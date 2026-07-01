# Visión del Producto — TallerFlow

## Problema

Los talleres de reparación de electrodomésticos operan con procesos manuales y desordenados: órdenes en papel o WhatsApp, sin trazabilidad de diagnósticos, retrasos por falta de repuestos y nula visibilidad del estado para el cliente.

Esto genera:
- Pérdida de tiempo y dinero por errores operativos.
- Mala experiencia del cliente (no sabe cuándo estará listo su equipo).
- Dificultad para escalar sin contratar más personal.

## Solución

**TallerFlow** es una plataforma web que centraliza todas las operaciones del taller en un solo lugar:

1. **Recepción inteligente** de equipos con historial del cliente.
2. **Órdenes de trabajo** con estados claros y trazabilidad completa (timeline).
3. **Cotizaciones digitales** con aprobación del cliente por link público.
4. **Control de inventario** de repuestos con alertas de stock mínimo.
5. **Facturación** con registro de pagos parciales y totales.
6. **Recordatorios post-servicio** para seguimiento y fidelización.
7. **Mensajería por WhatsApp** para notificar clientes directamente.
8. **Panel de métricas** para tomar decisiones basadas en datos.
9. **Modo oscuro/claro** con persistencia y respeto por preferencias del sistema.

## Propuesta de valor

| Para quién | El valor |
|-----------|---------|
| Dueño del taller | Visibilidad total, menos pérdidas, base para escalar |
| Técnico | Órdenes claras, historial del equipo, sin papel |
| Recepcionista | Registro rápido, comunicación automática con clientes |
| Cliente | Sabe en todo momento el estado de su equipo |

## Diferenciadores clave

- **Flujo centrado en el taller**: no es un ERP genérico, sino una herramienta diseñada para el proceso real de reparación.
- **Portal del cliente**: aprobación de presupuesto y consulta de estado desde el celular.
- **WhatsApp integrado**: envío directo de cotizaciones, recordatorios y notificaciones de estado.
- **Diseño modular**: empieza pequeño, crece a multi-sucursal o SaaS.
- **Responsive y accesible**: optimizado para uso en móvil, tablet y escritorio.

## Visión a largo plazo

> Ser la plataforma de gestión de referencia para talleres de reparación de LATAM, transformando operaciones informales en negocios escalables y rentables.

El modelo puede evolucionar de software interno a **SaaS multiusuario**, ofreciendo planes básico, profesional y enterprise para talleres de distintos tamaños.

## Estado actual (v1.2)

### Funcionalidades implementadas
- ✅ Dashboard operativo con KPIs y gráficos
- ✅ Gestión completa de clientes (CRUD + historial)
- ✅ Gestión de equipos por cliente
- ✅ Órdenes de trabajo con 8 estados y timeline de eventos
- ✅ Diagnóstico técnico
- ✅ Cotizaciones con items dinámicos y aprobación por link público
- ✅ Facturación con registro de pagos
- ✅ Inventario de repuestos con movimientos y alertas de stock
- ✅ Recordatorios post-servicio (5 tipos, 4 canales)
- ✅ Mensajería WhatsApp integrada con plantillas
- ✅ Modo oscuro/claro/sistema con persistencia
- ✅ Diseño responsive (móvil, tablet, desktop)
- ✅ Configuración del taller (datos, impuestos, contadores)

### Próximas funcionalidades
- 🔲 Autenticación con NextAuth y roles
- 🔲 Multi-sucursal
- 🔲 Exportación de reportes PDF/CSV
- 🔲 Auditoría de cambios
- 🔲 PWA / app móvil
- 🔲 Integración con WhatsApp Business API oficial
