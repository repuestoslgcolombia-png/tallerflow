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
export function useParts(params: { search?: string; lowStock?: boolean } = {}) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
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
