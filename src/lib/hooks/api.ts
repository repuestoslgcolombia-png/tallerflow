'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// ============== CLIENTES ==============
export function useCustomers(search = '') {
  return useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`)
      if (!res.ok) throw new Error('Error al cargar clientes')
      return res.json()
    },
  })
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}`)
      if (!res.ok) throw new Error('Error al cargar cliente')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useCustomerMutations() {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear cliente')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Cliente creado exitosamente')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer'] })
      toast.success('Cliente actualizado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Cliente eliminado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return { create, update, remove }
}

// ============== EQUIPOS ==============
export function useDevices(params: { customerId?: string; search?: string } = {}) {
  const query = new URLSearchParams()
  if (params.customerId) query.set('customerId', params.customerId)
  if (params.search) query.set('search', params.search)
  return useQuery({
    queryKey: ['devices', params],
    queryFn: async () => {
      const res = await fetch(`/api/devices?${query.toString()}`)
      if (!res.ok) throw new Error('Error al cargar equipos')
      return res.json()
    },
  })
}

export function useDeviceMutations() {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear equipo')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Equipo registrado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/devices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Equipo actualizado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/devices/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Equipo eliminado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return { create, update, remove }
}

// ============== ÓRDENES DE TRABAJO ==============
export function useWorkOrders(params: { status?: string; search?: string; customerId?: string; technicianId?: string } = {}) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.search) query.set('search', params.search)
  if (params.customerId) query.set('customerId', params.customerId)
  if (params.technicianId) query.set('technicianId', params.technicianId)
  return useQuery({
    queryKey: ['work-orders', params],
    queryFn: async () => {
      const res = await fetch(`/api/work-orders?${query.toString()}`)
      if (!res.ok) throw new Error('Error al cargar órdenes')
      return res.json()
    },
  })
}

export function useWorkOrder(id: string | null) {
  return useQuery({
    queryKey: ['work-order', id],
    queryFn: async () => {
      const res = await fetch(`/api/work-orders/${id}`)
      if (!res.ok) throw new Error('Error al cargar orden')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useWorkOrderMutations() {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear orden')
      }
      return res.json()
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`Orden ${data.code} creada`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/work-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      qc.invalidateQueries({ queryKey: ['work-order'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Orden actualizada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const patch = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/work-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      qc.invalidateQueries({ queryKey: ['work-order'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Estado actualizado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/work-orders/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Orden eliminada')
    },
onError: (e: Error) => toast.error(e.message),
  })
  return { create, update, patch, remove }
}

// ============== CAPTACIÓN RÁPIDA ==============
export function useQuickRegisterMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/quick-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al registrar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['devices'] })
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      qc.invalidateQueries({ queryKey: ['work-order'] })
      qc.invalidateQueries({ queryKey: ['daily-agenda'] })
      toast.success('Registro completado exitosamente')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ============== COTIZACIONES ==============
export function useQuotes(params: { workOrderId?: string; status?: string } = {}) {
  const query = new URLSearchParams()
  if (params.workOrderId) query.set('workOrderId', params.workOrderId)
  if (params.status) query.set('status', params.status)
  return useQuery({
    queryKey: ['quotes', params],
    queryFn: async () => {
      const res = await fetch(`/api/quotes?${query.toString()}`)
      if (!res.ok) throw new Error('Error al cargar cotizaciones')
      return res.json()
    },
  })
}

export function useQuoteMutations() {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear cotización')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      qc.invalidateQueries({ queryKey: ['work-order'] })
      toast.success('Cotización creada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      qc.invalidateQueries({ queryKey: ['work-order'] })
      toast.success('Cotización actualizada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
      toast.success('Cotización eliminada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return { create, update, remove }
}

// ============== REPUESTOS / INVENTARIO ==============
export function useParts(
  params: { search?: string; category?: string; brand?: string; applianceType?: string; lowStock?: boolean } = {}
) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.category && params.category !== 'all') query.set('category', params.category)
  if (params.brand) query.set('brand', params.brand)
  if (params.applianceType) query.set('applianceType', params.applianceType)
  if (params.lowStock) query.set('lowStock', 'true')
  return useQuery({
    queryKey: ['parts', params],
    queryFn: async () => {
      const res = await fetch(`/api/parts?${query.toString()}`)
      if (!res.ok) throw new Error('Error al cargar repuestos')
      return res.json()
    },
  })
}

export function usePart(id: string | null) {
  return useQuery({
    queryKey: ['part', id],
    queryFn: async () => {
      const res = await fetch(`/api/parts/${id}`)
      if (!res.ok) throw new Error('Error al cargar repuesto')
      return res.json()
    },
    enabled: !!id,
  })
}

export function usePartMutations() {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear repuesto')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts'] })
      toast.success('Repuesto creado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/parts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts'] })
      qc.invalidateQueries({ queryKey: ['part'] })
      toast.success('Repuesto actualizado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return { create, update }
}

// ============== USUARIOS ==============
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Error al cargar usuarios')
      return res.json()
    },
  })
}

// ============== DASHBOARD ==============
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Error al cargar dashboard')
      return res.json()
    },
    refetchInterval: 60 * 1000, // refresh cada minuto
  })
}

// ============== SETTINGS ==============
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Error al cargar configuración')
      return res.json()
    },
  })
}

export function useSettingsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Configuración guardada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ============== RECORDATORIOS ==============
export function useReminders(params: {
  status?: string
  customerId?: string
  workOrderId?: string
  type?: string
  dueToday?: boolean
  overdue?: boolean
} = {}) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.customerId) query.set('customerId', params.customerId)
  if (params.workOrderId) query.set('workOrderId', params.workOrderId)
  if (params.type) query.set('type', params.type)
  if (params.dueToday) query.set('dueToday', 'true')
  if (params.overdue) query.set('overdue', 'true')
  return useQuery({
    queryKey: ['reminders', params],
    queryFn: async () => {
      const res = await fetch(`/api/reminders?${query.toString()}`)
      if (!res.ok) throw new Error('Error al cargar recordatorios')
      return res.json()
    },
  })
}

export function useReminder(id: string | null) {
  return useQuery({
    queryKey: ['reminder', id],
    queryFn: async () => {
      const res = await fetch(`/api/reminders/${id}`)
      if (!res.ok) throw new Error('Error al cargar recordatorio')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useReminderMutations() {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear recordatorio')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Recordatorio creado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] })
      qc.invalidateQueries({ queryKey: ['reminder'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Recordatorio actualizado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Recordatorio eliminado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return { create, update, remove }
}

// ============== FACTURAS ==============
export function useInvoices(params: {
  status?: string
  customerId?: string
  workOrderId?: string
  search?: string
} = {}) {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.customerId) query.set('customerId', params.customerId)
  if (params.workOrderId) query.set('workOrderId', params.workOrderId)
  if (params.search) query.set('search', params.search)
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const res = await fetch(`/api/invoices?${query.toString()}`)
      if (!res.ok) throw new Error('Error al cargar facturas')
      return res.json()
    },
  })
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${id}`)
      if (!res.ok) throw new Error('Error al cargar factura')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useInvoiceMutations() {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear factura')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      qc.invalidateQueries({ queryKey: ['work-order'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Factura creada exitosamente')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar factura')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoice'] })
      qc.invalidateQueries({ queryKey: ['work-orders'] })
      qc.invalidateQueries({ queryKey: ['work-order'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Factura actualizada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar factura')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Factura eliminada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return { create, update, remove }
}

// ============== WHATSAPP ==============
export function useWhatsAppTemplates(category?: string) {
  const query = new URLSearchParams()
  if (category) query.set('category', category)
  query.set('active', 'true')
  return useQuery({
    queryKey: ['whatsapp-templates', category],
    queryFn: async () => {
      const res = await fetch(`/api/whatsapp/templates?${query.toString()}`)
      if (!res.ok) throw new Error('Error al cargar plantillas')
      return res.json()
    },
  })
}

export function useWhatsAppTemplateMutations() {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear plantilla')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-templates'] })
      toast.success('Plantilla creada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/whatsapp/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-templates'] })
      toast.success('Plantilla actualizada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/whatsapp/templates/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-templates'] })
      toast.success('Plantilla eliminada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return { create, update, remove }
}

export function useWhatsAppMessages(params: { customerId?: string; workOrderId?: string; limit?: number } = {}) {
  const query = new URLSearchParams()
  if (params.customerId) query.set('customerId', params.customerId)
  if (params.workOrderId) query.set('workOrderId', params.workOrderId)
  if (params.limit) query.set('limit', String(params.limit))
  return useQuery({
    queryKey: ['whatsapp-messages', params],
    queryFn: async () => {
      const res = await fetch(`/api/whatsapp/messages?${query.toString()}`)
      if (!res.ok) throw new Error('Error al cargar mensajes')
      return res.json()
    },
  })
}

export function useWhatsAppMessageMutations() {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al registrar mensaje')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-messages'] })
      toast.success('Mensaje registrado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return { create }
}

export function useWhatsAppRender() {
  return useMutation({
    mutationFn: async (data: { templateCode: string; customerId?: string; workOrderId?: string; customVars?: Record<string, string> }) => {
      const res = await fetch('/api/whatsapp/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al renderizar')
      }
      return res.json()
    },
  })
}

// Helper para generar URL de WhatsApp (wa.me)
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

// Helper para enviar un mensaje por WhatsApp (abre wa.me) y registrar el envío
export async function sendWhatsAppMessage(params: {
  phone: string
  message: string
  customerId: string
  workOrderId?: string
  reminderId?: string
  templateId?: string
  customerName?: string
}) {
  const url = buildWhatsAppUrl(params.phone, params.message)
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  try {
    await fetch('/api/whatsapp/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: params.customerId,
        workOrderId: params.workOrderId || null,
        reminderId: params.reminderId || null,
        templateId: params.templateId || null,
        toPhone: params.phone,
        toName: params.customerName,
        message: params.message,
        status: 'sent',
        channel: 'whatsapp',
        sentBy: 'Usuario',
      }),
    })
  } catch {
    // best-effort
  }
  return url
}

// ============== WHATSAPP CONNECTION ==============
export function useWhatsAppConnection() {
  return useQuery({
    queryKey: ['whatsapp-connection'],
    queryFn: async () => {
      const res = await fetch('/api/whatsapp/connection')
      if (!res.ok) throw new Error('Error al obtener conexión')
      return res.json()
    },
  })
}

export function useWhatsAppConnectionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { action: 'pair' | 'connect' | 'disconnect' | 'update_profile'; phone?: string; displayName?: string; businessName?: string }) => {
      const res = await fetch('/api/whatsapp/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error en conexión')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-connection'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// Enviar factura por WhatsApp
export function useSendInvoiceWhatsApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await fetch(`/api/whatsapp/invoices/${invoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al enviar factura')
      }
      return res.json()
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['whatsapp-messages'] })
      // Abrir WhatsApp con el mensaje pre-generado
      if (typeof window !== 'undefined' && data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer')
      }
      toast.success('Factura enviada por WhatsApp')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ============== NOTIFICACIONES ==============
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Error al cargar notificaciones')
      return res.json()
    },
    refetchInterval: 60 * 1000, // refrescar cada minuto
  })
}

// ============== AGENDA DIARIA ==============
export function useDailyAgenda() {
  return useQuery({
    queryKey: ['daily-agenda'],
    queryFn: async () => {
      const res = await fetch('/api/daily-agenda')
      if (!res.ok) throw new Error('Error al cargar agenda diaria')
      return res.json()
    },
    refetchInterval: 60 * 1000,
  })
}

// ============== TAREAS DIARIAS ==============
export function useDailyTasks(params: { date?: string; completed?: string; assigneeId?: string } = {}) {
  const query = new URLSearchParams()
  if (params.date) query.set('date', params.date)
  if (params.completed) query.set('completed', params.completed)
  if (params.assigneeId) query.set('assigneeId', params.assigneeId)
  return useQuery({
    queryKey: ['daily-tasks', params],
    queryFn: async () => {
      const res = await fetch(`/api/daily-tasks?${query.toString()}`)
      if (!res.ok) throw new Error('Error al cargar tareas')
      return res.json()
    },
  })
}

export function useDailyTaskMutations() {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear tarea')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-tasks'] })
      qc.invalidateQueries({ queryKey: ['daily-agenda'] })
      toast.success('Tarea agregada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/daily-tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar tarea')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-tasks'] })
      qc.invalidateQueries({ queryKey: ['daily-agenda'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/daily-tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar tarea')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-tasks'] })
      qc.invalidateQueries({ queryKey: ['daily-agenda'] })
      toast.success('Tarea eliminada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return { create, update, remove }
}

// ============== BASE DE CONOCIMIENTO (GUÍAS) ==============
export function useRepairGuides(params: {
  search?: string
  applianceType?: string
  brand?: string
  status?: string
} = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.applianceType && params.applianceType !== 'all') query.set('applianceType', params.applianceType)
  if (params.brand) query.set('brand', params.brand)
  if (params.status && params.status !== 'all') query.set('status', params.status)
  return useQuery({
    queryKey: ['guides', params],
    queryFn: async () => {
      const res = await fetch(`/api/guides?${query.toString()}`)
      if (!res.ok) throw new Error('Error al cargar guías')
      return res.json()
    },
  })
}

export function useRepairGuide(id: string | null) {
  return useQuery({
    queryKey: ['guide', id],
    queryFn: async () => {
      const res = await fetch(`/api/guides/${id}`)
      if (!res.ok) throw new Error('Error al cargar guía')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useRepairGuideSuggestions(params: {
  applianceType?: string
  brand?: string
  model?: string
  symptom?: string
  enabled?: boolean
} = {}) {
  const query = new URLSearchParams()
  if (params.applianceType) query.set('applianceType', params.applianceType)
  if (params.brand) query.set('brand', params.brand)
  if (params.model) query.set('model', params.model)
  if (params.symptom) query.set('symptom', params.symptom)
  return useQuery({
    queryKey: ['guide-suggestions', params],
    queryFn: async () => {
      const res = await fetch(`/api/guides/suggestions?${query.toString()}`)
      if (!res.ok) throw new Error('Error al cargar sugerencias')
      return res.json()
    },
    enabled: !!params.enabled && !!params.applianceType,
  })
}

export function useRepairGuideMutations() {
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear guía')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guides'] })
      qc.invalidateQueries({ queryKey: ['guide'] })
      qc.invalidateQueries({ queryKey: ['guide-suggestions'] })
      toast.success('Guía creada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/guides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al actualizar guía')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guides'] })
      qc.invalidateQueries({ queryKey: ['guide'] })
      qc.invalidateQueries({ queryKey: ['guide-suggestions'] })
      toast.success('Guía actualizada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/guides/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al archivar guía')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guides'] })
      qc.invalidateQueries({ queryKey: ['guide'] })
      qc.invalidateQueries({ queryKey: ['guide-suggestions'] })
      toast.success('Guía archivada')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  return { create, update, remove }
}
