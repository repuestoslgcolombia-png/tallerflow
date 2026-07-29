'use client'

import { useState, type ReactNode } from 'react'
import {
  Search,
  Plus,
  Package,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wrench,
  WashingMachine,
  Refrigerator,
  Snowflake,
  Flame,
  Wind,
  Tv,
  Microwave,
  CookingPot,
  Thermometer,
  Check,
  ChevronsUpDown,
  User,
} from 'lucide-react'
import { useDevices, useDeviceMutations, useCustomers } from '@/lib/hooks/api'
import { useAppStore } from '@/store/app-store'
import {
  DEVICE_TYPES,
  fullName,
  getInitials,
  timeAgo,
  type DeviceTypeKey,
} from '@/lib/constants'
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'

// ============== Device icon helper ==============

const DEVICE_ICON_MAP: Record<string, any> = {
  washing_machine: WashingMachine,
  refrigerator: Refrigerator,
  freezer: Snowflake,
  gas_dryer: Flame,
  air_conditioner: Wind,
  tv: Tv,
  microwave: Microwave,
  oven: CookingPot,
  stove: CookingPot,
  water_heater: Thermometer,
  other: Wrench,
}

function DeviceIcon({ type, className }: { type: string; className?: string }) {
  const Icon = DEVICE_ICON_MAP[type] || Wrench
  return <Icon className={className} />
}

const DEVICE_TYPE_KEYS = Object.keys(DEVICE_TYPES) as DeviceTypeKey[]

// ============== Local helpers ==============

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

// ============== Customer Combobox (searchable) ==============

function CustomerCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const { data: customers = [] } = useCustomers()
  const [open, setOpen] = useState(false)
  const selected = customers.find((c: any) => c.id === value) as any | undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <Avatar className="size-5">
                <AvatarFallback className="bg-emerald-100 text-[10px] font-semibold text-emerald-700">
                  {getInitials(fullName(selected.firstName, selected.lastName))}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {fullName(selected.firstName, selected.lastName)}
              </span>
            </span>
          ) : (
            'Selecciona un cliente...'
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Buscar cliente..." />
          <CommandList>
            <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            <CommandGroup>
              {customers.map((c: any) => (
                <CommandItem
                  key={c.id}
                  value={`${c.firstName} ${c.lastName} ${c.documentId || ''} ${c.phone || ''} ${c.email || ''}`}
                  onSelect={() => {
                    onChange(c.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'size-4',
                      value === c.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">
                      {fullName(c.firstName, c.lastName)}
                    </span>
                    {c.documentId && (
                      <span className="text-xs text-muted-foreground">
                        {c.documentId}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ============== Device Form Dialog ==============

interface DeviceFormValues {
  customerId: string
  type: string
  brand: string
  model: string
  serial: string
  accessories: string
  notes: string
}

const EMPTY_DEVICE_FORM: DeviceFormValues = {
  customerId: '',
  type: '',
  brand: '',
  model: '',
  serial: '',
  accessories: '',
  notes: '',
}

export function DeviceFormDialog({
  open,
  onOpenChange,
  device,
  presetCustomerId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: any | null
  presetCustomerId?: string | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        {open && (
          <DeviceFormDialogInner
            key={device?.id || 'new'}
            device={device}
            presetCustomerId={presetCustomerId}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function DeviceFormDialogInner({
  device,
  presetCustomerId,
  onOpenChange,
}: {
  device?: any | null
  presetCustomerId?: string | null
  onOpenChange: (open: boolean) => void
}) {
  const { create, update } = useDeviceMutations()
  const isEdit = !!device
  const [form, setForm] = useState<DeviceFormValues>(
    device
      ? {
          customerId: device.customerId || '',
          type: device.type || '',
          brand: device.brand || '',
          model: device.model || '',
          serial: device.serial || '',
          accessories: device.accessories || '',
          notes: device.notes || '',
        }
      : {
          ...EMPTY_DEVICE_FORM,
          customerId: presetCustomerId || '',
        }
  )

  const valid = form.customerId.trim() !== '' && form.type.trim() !== ''
  const pending = create.isPending || update.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || pending) return
    const data = {
      customerId: form.customerId,
      type: form.type,
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      serial: form.serial.trim() || null,
      accessories: form.accessories.trim() || null,
      notes: form.notes.trim() || null,
    }
    if (isEdit && device) {
      update.mutate(
        { id: device.id, data },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      create.mutate(data, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Editar Equipo' : 'Nuevo Equipo'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Actualiza los datos del equipo.'
            : 'Registra un equipo en el taller.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>
              Cliente <span className="text-rose-500">*</span>
            </Label>
            <CustomerCombobox
              value={form.customerId}
              onChange={(id) => setForm((f) => ({ ...f, customerId: id }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">
              Tipo de equipo <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue placeholder="Selecciona un tipo..." />
              </SelectTrigger>
              <SelectContent>
                {DEVICE_TYPE_KEYS.map((key) => {
                  const conf = (DEVICE_TYPES as Record<string, any>)[key]
                  const Icon = DEVICE_ICON_MAP[key] || Wrench
                  return (
                    <SelectItem key={key} value={key}>
                      <Icon className="size-4" />
                      {conf.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={form.brand}
                onChange={(e) =>
                  setForm((f) => ({ ...f, brand: e.target.value }))
                }
                placeholder="LG, Samsung, Whirlpool..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={form.model}
                onChange={(e) =>
                  setForm((f) => ({ ...f, model: e.target.value }))
                }
                placeholder="WA13T, RT29..."
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="serial">Serial / IMEI</Label>
            <Input
              id="serial"
              value={form.serial}
              onChange={(e) =>
                setForm((f) => ({ ...f, serial: e.target.value }))
              }
              placeholder="Número de serie del equipo"
              className="font-mono"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="accessories">Accesorios entregados</Label>
            <Textarea
              id="accessories"
              value={form.accessories}
              onChange={(e) =>
                setForm((f) => ({ ...f, accessories: e.target.value }))
              }
              placeholder="Cargador, funda, cable, batería..."
              rows={2}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Observaciones del equipo..."
              rows={2}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!valid || pending}>
              {pending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar equipo'}
            </Button>
          </DialogFooter>
        </form>
    </>
  )
}

// ============== Main view ==============

export function DevicesView() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { navigate, selectedCustomerId } = useAppStore()
  const { data: devices = [], isLoading } = useDevices({
    customerId: undefined,
    search,
  })
  const { remove } = useDeviceMutations()

  const filtered = (devices as any[]).filter((d) =>
    typeFilter === 'all' ? true : d.type === typeFilter
  )

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (d: any) => {
    setEditing(d)
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
        <h1 className="text-2xl font-semibold tracking-tight">Equipos</h1>
        <p className="text-sm text-muted-foreground">
          Administra los equipos registrados en el taller.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por marca, modelo, serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v)}
          >
            <SelectTrigger className="w-full sm:w-[170px]">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {DEVICE_TYPE_KEYS.map((key) => {
                const conf = (DEVICE_TYPES as Record<string, any>)[key]
                const Icon = DEVICE_ICON_MAP[key] || Wrench
                return (
                  <SelectItem key={key} value={key}>
                    <Icon className="size-4" />
                    {conf.label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          Nuevo Equipo
        </Button>
      </div>

      {/* Table */}
      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Listado de equipos</CardTitle>
          <CardDescription className="text-xs">
            {filtered.length} equipo{filtered.length === 1 ? '' : 's'}{' '}
            {typeFilter !== 'all'
              ? `de tipo ${
                  (DEVICE_TYPES as Record<string, any>)[typeFilter]?.label || typeFilter
                }`
              : 'registrados'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Package className="size-8" />}
              title={search || typeFilter !== 'all' ? 'Sin resultados' : 'Aún no hay equipos'}
              description={
                search || typeFilter !== 'all'
                  ? 'Ajusta los filtros de búsqueda.'
                  : 'Registra tu primer equipo para empezar.'
              }
              action={
                !search && typeFilter === 'all' ? (
                  <Button onClick={openCreate} className="gap-2">
                    <Plus className="size-4" />
                    Nuevo Equipo
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Equipo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-center">Órdenes</TableHead>
                  <TableHead className="w-10 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d: any) => {
                  const conf = (DEVICE_TYPES as Record<string, any>)[d.type]
                  const customer = d.customer
                  const customerName = customer
                    ? fullName(customer.firstName, customer.lastName)
                    : '—'
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                            <DeviceIcon type={d.type} className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {[d.brand, d.model].filter(Boolean).join(' ') ||
                                conf?.label ||
                                'Equipo sin nombre'}
                            </div>
                            {d.brand && d.model && (
                              <div className="truncate text-xs text-muted-foreground">
                                {conf?.label || d.type}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1.5 font-medium">
                          <DeviceIcon type={d.type} className="size-3" />
                          {conf?.label || d.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {d.serial || '—'}
                      </TableCell>
                      <TableCell>
                        {customer ? (
                          <button
                            type="button"
                            onClick={() =>
                              navigate('customer-detail', { customerId: customer.id })
                            }
                            className="group flex items-center gap-2 text-left"
                          >
                            <Avatar className="size-6">
                              <AvatarFallback className="bg-slate-100 text-[10px] font-semibold text-slate-600">
                                {getInitials(customerName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm group-hover:underline">
                              {customerName}
                            </span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            <User className="size-3.5" /> —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="tabular-nums">
                          {d._count?.workOrders ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {customer && (
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate('customer-detail', {
                                    customerId: customer.id,
                                  })
                                }
                              >
                                <User className="size-4" /> Ver cliente
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => openEdit(d)}>
                              <Pencil className="size-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteId(d.id)}
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

      <DeviceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        device={editing}
        presetCustomerId={selectedCustomerId}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Solo se pueden eliminar equipos
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
