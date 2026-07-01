'use client'

import { useState, useMemo, useEffect, type ReactNode } from 'react'
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  IdCard,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Package,
  ClipboardList,
} from 'lucide-react'
import { useCustomers, useCustomerMutations } from '@/lib/hooks/api'
import { useAppStore } from '@/store/app-store'
import { fullName, getInitials, timeAgo } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

// ============== Shared Customer Form Dialog ==============

export interface CustomerFormValues {
  firstName: string
  lastName: string
  documentId: string
  phone: string
  email: string
  address: string
  notes: string
}

const EMPTY_FORM: CustomerFormValues = {
  firstName: '',
  lastName: '',
  documentId: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
}

function CustomerForm({
  customer,
  onDone,
}: {
  customer?: any | null
  onDone: () => void
}) {
  const { create, update } = useCustomerMutations()
  const isEdit = !!customer
  const [form, setForm] = useState<CustomerFormValues>(
    customer
      ? {
          firstName: customer.firstName || '',
          lastName: customer.lastName || '',
          documentId: customer.documentId || '',
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address || '',
          notes: customer.notes || '',
        }
      : EMPTY_FORM
  )

  const valid = form.firstName.trim() !== '' && form.lastName.trim() !== ''
  const pending = create.isPending || update.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || pending) return
    const data = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      documentId: form.documentId.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    }
    if (isEdit && customer) {
      update.mutate(
        { id: customer.id, data },
        { onSuccess: () => onDone() }
      )
    } else {
      create.mutate(data, { onSuccess: () => onDone() })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">
                Nombre <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="Juan"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">
                Apellido <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="Pérez"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="documentId">Documento</Label>
              <Input
                id="documentId"
                value={form.documentId}
                onChange={(e) => setForm((f) => ({ ...f, documentId: e.target.value }))}
                placeholder="Cédula / RUT"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+57 300 1234567"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="juan@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Calle 123 #45-67"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Observaciones del cliente..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!valid || pending}>
              {pending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
  )
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: any | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{customer ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
          <DialogDescription>
            {customer
              ? 'Actualiza los datos del cliente.'
              : 'Registra un nuevo cliente en el taller.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CustomerForm
            key={customer?.id ?? 'new'}
            customer={customer}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============== Helper components ==============

const TONES: Record<string, string> = {
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
}

function StatCard({
  icon,
  label,
  value,
  tone = 'slate',
}: {
  icon: ReactNode
  label: string
  value: number | string
  tone?: keyof typeof TONES
}) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex items-center gap-3 px-4">
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-lg border',
            TONES[tone]
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-2xl font-semibold leading-none tabular-nums">
            {value}
          </div>
          <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

// ============== Main view ==============

export function CustomersView() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { navigate } = useAppStore()
  const { data: customers = [], isLoading } = useCustomers(search)
  const { remove } = useCustomerMutations()

  const stats = useMemo(() => {
    const total = customers.length
    const withDevices = customers.filter(
      (c: any) => (c._count?.devices ?? 0) > 0
    ).length
    const withOrders = customers.filter(
      (c: any) => (c._count?.workOrders ?? 0) > 0
    ).length
    return { total, withDevices, withOrders }
  }, [customers])

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (c: any) => {
    setEditing(c)
    setDialogOpen(true)
  }

  const handleDelete = () => {
    if (!deleteId) return
    remove.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona la información de tus clientes y sus equipos.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="gap-2">
          <UserPlus className="size-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Users className="size-4" />}
          label="Total clientes"
          value={stats.total}
          tone="slate"
        />
        <StatCard
          icon={<Package className="size-4" />}
          label="Con equipos"
          value={stats.withDevices}
          tone="emerald"
        />
        <StatCard
          icon={<ClipboardList className="size-4" />}
          label="Con órdenes"
          value={stats.withOrders}
          tone="amber"
        />
      </div>

      {/* Table */}
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Listado de clientes</CardTitle>
          <CardDescription className="text-xs">
            {customers.length} cliente{customers.length === 1 ? '' : 's'} en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <EmptyState
              icon={<Users className="size-8" />}
              title={search ? 'Sin resultados' : 'Aún no hay clientes'}
              description={
                search
                  ? 'Prueba con otro término de búsqueda.'
                  : 'Crea tu primer cliente para empezar.'
              }
              action={
                !search ? (
                  <Button onClick={openCreate} className="gap-2">
                    <UserPlus className="size-4" />
                    Nuevo Cliente
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Cliente</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-center">Equipos</TableHead>
                  <TableHead className="text-center">Órdenes</TableHead>
                  <TableHead>Registrado</TableHead>
                  <TableHead className="w-10 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c: any) => {
                  const name = fullName(c.firstName, c.lastName)
                  return (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => navigate('customer-detail', { customerId: c.id })}
                    >
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-emerald-100 text-xs font-semibold text-emerald-700">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{name}</div>
                            {c.email && (
                              <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <Mail className="size-3" />
                                <span className="truncate">{c.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.documentId ? (
                          <span className="inline-flex items-center gap-1.5">
                            <IdCard className="size-3.5 opacity-60" />
                            {c.documentId}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.phone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="size-3.5 opacity-60" />
                            {c.phone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="tabular-nums"
                        >
                          {c._count?.devices ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="tabular-nums"
                        >
                          {c._count?.workOrders ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {timeAgo(c.createdAt)}
                      </TableCell>
                      <TableCell
                        className="pr-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                navigate('customer-detail', { customerId: c.id })
                              }
                            >
                              <Eye className="size-4" /> Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(c)}>
                              <Pencil className="size-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteId(c.id)}
                            >
                              <Trash2 className="size-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editing}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Solo se pueden eliminar clientes
              que no tengan órdenes de trabajo asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-rose-600 text-white hover:bg-rose-700"
              disabled={remove.isPending}
            >
              {remove.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
