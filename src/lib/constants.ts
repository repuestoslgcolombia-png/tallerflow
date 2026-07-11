// ============== CONSTANTES DEL DOMINIO TALLERFLOW ==============

export const WORK_ORDER_STATUS = {
  received: {
    label: 'Recibida',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
    description: 'Equipo ingresado en recepción',
    step: 0,
  },
  diagnosing: {
    label: 'En Diagnóstico',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    description: 'Técnico evaluando el equipo',
    step: 1,
  },
  quoted: {
    label: 'Cotizada',
    color: 'bg-sky-100 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
    description: 'Cotización enviada al cliente',
    step: 2,
  },
  approved: {
    label: 'Aprobada',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
    description: 'Cliente aprobó la cotización',
    step: 3,
  },
  in_progress: {
    label: 'En Reparación',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    description: 'Reparación en proceso',
    step: 4,
  },
  ready: {
    label: 'Lista',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
    description: 'Equipo listo para entrega',
    step: 5,
  },
  delivered: {
    label: 'Entregada',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    description: 'Equipo entregado al cliente',
    step: 6,
  },
  cancelled: {
    label: 'Cancelada',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    description: 'Orden cancelada',
    step: -1,
  },
} as const

export type WorkOrderStatusKey = keyof typeof WORK_ORDER_STATUS

export const PRIORITY = {
  low: { label: 'Baja', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'ArrowDown' },
  normal: { label: 'Normal', color: 'bg-sky-100 text-sky-700 border-sky-200', icon: 'Minus' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: 'ArrowUp' },
  urgent: { label: 'Urgente', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: 'AlertCircle' },
} as const

export type PriorityKey = keyof typeof PRIORITY

export const DEVICE_TYPES = {
  washing_machine: { label: 'Lavadora', icon: 'WashingMachine' },
  refrigerator: { label: 'Nevera', icon: 'Refrigerator' },
  freezer: { label: 'Congelador', icon: 'Snowflake' },
  gas_dryer: { label: 'Secadora a gas', icon: 'Flame' },
  air_conditioner: { label: 'Aire acondicionado', icon: 'Wind' },
  tv: { label: 'TV', icon: 'Tv' },
  other: { label: 'Otro', icon: 'Wrench' },
} as const

export type DeviceTypeKey = keyof typeof DEVICE_TYPES

export const QUOTE_STATUS = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  sent: { label: 'Enviada', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  approved: { label: 'Aprobada', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rechazada', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  expired: { label: 'Vencida', color: 'bg-amber-100 text-amber-700 border-amber-200' },
} as const

export const INVOICE_STATUS = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  paid: { label: 'Pagada', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  partial: { label: 'Pago Parcial', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  cancelled: { label: 'Anulada', color: 'bg-rose-100 text-rose-700 border-rose-200' },
} as const

export const USER_ROLES = {
  admin: { label: 'Administrador', color: 'bg-violet-100 text-violet-700' },
  technician: { label: 'Técnico', color: 'bg-sky-100 text-sky-700' },
  receptionist: { label: 'Recepción', color: 'bg-emerald-100 text-emerald-700' },
} as const

export const MOVEMENT_TYPES = {
  in: { label: 'Entrada', color: 'bg-emerald-100 text-emerald-700', sign: '+' },
  out: { label: 'Salida', color: 'bg-rose-100 text-rose-700', sign: '-' },
  adjustment: { label: 'Ajuste', color: 'bg-amber-100 text-amber-700', sign: '=' },
} as const

export const REMINDER_TYPES = {
  follow_up: {
    label: 'Seguimiento post-servicio',
    description: 'Contactar al cliente días después de la entrega',
    icon: 'Phone',
    defaultDays: 7,
    defaultTemplate: 'Hola {cliente}, ¿cómo va el equipo {equipo} que reparamos? Si tiene alguna duda, estamos para ayudarte.',
  },
  warranty_check: {
    label: 'Revisión de garantía',
    description: 'Verificar el equipo antes de que venza la garantía',
    icon: 'ShieldCheck',
    defaultDays: 25,
    defaultTemplate: 'Su garantía por la reparación está por vencer. ¿Le gustaría una revisión preventiva sin costo?',
  },
  service_review: {
    label: 'Solicitud de reseña',
    description: 'Pedir al cliente su opinión del servicio',
    icon: 'Star',
    defaultDays: 3,
    defaultTemplate: '¿Cómo calificaría el servicio recibido? Su opinión nos ayuda a mejorar. ¡Gracias!',
  },
  maintenance: {
    label: 'Mantenimiento preventivo',
    description: 'Recordar mantenimiento periódico del equipo',
    icon: 'Wrench',
    defaultDays: 90,
    defaultTemplate: 'Es momento del mantenimiento preventivo de su {equipo}. Contáctenos para agendar.',
  },
  custom: {
    label: 'Personalizado',
    description: 'Recordatorio personalizado',
    icon: 'Bell',
    defaultDays: 1,
    defaultTemplate: '',
  },
} as const

export type ReminderTypeKey = keyof typeof REMINDER_TYPES

export const REMINDER_STATUS = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  sent: { label: 'Enviado', color: 'bg-sky-100 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  done: { label: 'Completado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  snoozed: { label: 'Pospuesto', color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  cancelled: { label: 'Cancelado', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
} as const

export type ReminderStatusKey = keyof typeof REMINDER_STATUS

export const REMINDER_CHANNELS = {
  whatsapp: { label: 'WhatsApp', icon: 'MessageCircle', color: 'bg-emerald-100 text-emerald-700' },
  email: { label: 'Email', icon: 'Mail', color: 'bg-sky-100 text-sky-700' },
  phone: { label: 'Llamada', icon: 'Phone', color: 'bg-violet-100 text-violet-700' },
  sms: { label: 'SMS', icon: 'Smartphone', color: 'bg-amber-100 text-amber-700' },
} as const

export const PAYMENT_METHODS = {
  cash: { label: 'Efectivo', icon: 'Banknote' },
  card: { label: 'Tarjeta', icon: 'CreditCard' },
  transfer: { label: 'Transferencia', icon: 'Landmark' },
} as const

// ============== CATEGORÍAS DE REPUESTOS ==============

export const PART_CATEGORIES = {
  washing_machine: {
    label: 'Lavadoras',
    icon: 'WashingMachine',
    color: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800',
    description: 'Repuestos para lavadoras automáticas y semiautomáticas',
  },
  refrigerator: {
    label: 'Neveras',
    icon: 'Refrigerator',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    description: 'Repuestos para neveras y frigoríficos',
  },
  freezer: {
    label: 'Congeladores',
    icon: 'Snowflake',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800',
    description: 'Repuestos para congeladores horizontales y verticales',
  },
  gas_dryer: {
    label: 'Secadoras a gas',
    icon: 'Flame',
    color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800',
    description: 'Repuestos para secadoras a gas',
  },
  air_conditioner: {
    label: 'Aires acondicionados',
    icon: 'Wind',
    color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800',
    description: 'Repuestos para aires acondicionados split y ventana',
  },
  tv: {
    label: 'TVs',
    icon: 'Tv',
    color: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800',
    description: 'Repuestos para televisores LED, LCD y Smart TV',
  },
  refrigeration: {
    label: 'Refrigeración',
    icon: 'Droplet',
    color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    description: 'Gases refrigerantes, aceites y consumibles',
  },
  tools: {
    label: 'Herramientas',
    icon: 'Wrench',
    color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-700',
    description: 'Herramientas y consumibles de taller',
  },
  other: {
    label: 'Otros',
    icon: 'Package',
    color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    description: 'Otros repuestos y accesorios',
  },
} as const

export type PartCategoryKey = keyof typeof PART_CATEGORIES

// Tipos de gas refrigerante comunes
export const GAS_TYPES = ['R134a', 'R410A', 'R22', 'R404A', 'R290', 'N/A'] as const

// Marcas comunes de electrodomésticos
export const APPLIANCE_BRANDS = [
  'LG', 'Samsung', 'Whirlpool', 'Electrolux', 'Mabe', 'Haceb', 'Midea',
  'Daewoo', 'Bosch', 'General Electric', 'Kenmore', 'Maytag', 'Frigidaire',
  'Panasonic', 'Sharp', 'Toshiba', 'Sony', 'Universal', 'Otra',
] as const

// ============== FLUJO DE ESTADOS ==============

export const STATUS_FLOW: Record<WorkOrderStatusKey, WorkOrderStatusKey[]> = {
  received: ['diagnosing', 'cancelled'],
  diagnosing: ['quoted', 'in_progress', 'cancelled'],
  quoted: ['approved', 'rejected' as WorkOrderStatusKey, 'cancelled'],
  approved: ['in_progress', 'cancelled'],
  in_progress: ['ready', 'cancelled'],
  ready: ['delivered', 'in_progress'],
  delivered: [],
  cancelled: [],
}

export function getNextStatuses(current: WorkOrderStatusKey): WorkOrderStatusKey[] {
  return STATUS_FLOW[current] || []
}

// ============== HELPERS ==============

export function formatCurrency(amount: number, symbol = '$'): string {
  return `${symbol}${new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)}`
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function timeAgo(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'hace un momento'
  if (minutes < 60) return `hace ${minutes} min`
  if (hours < 24) return `hace ${hours} h`
  if (days < 30) return `hace ${days} d`
  return formatDate(d)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}
