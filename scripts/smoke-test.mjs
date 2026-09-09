#!/usr/bin/env bun
// ============================================================================
// TallerFlow - Flujo de prueba (smoke test) contra el despliegue
// ============================================================================
// Uso:
//   bun scripts/smoke-test.mjs [--base URL] [--keep]
//
//   --base URL   URL base (default: https://tallerflow-gilt.vercel.app)
//   --keep       no ejecutar la limpieza automatica al final
//
// Recorre 8 flujos de negocio y verifica las respuestas de la API.
// Los datos de prueba se crean con un sufijo unico [TEST-<runId>] y se
// eliminan automaticamente al final (salvo --keep).
// ============================================================================

const DEFAULT_BASE = 'https://tallerflow-gilt.vercel.app'

const args = process.argv.slice(2)
let BASE = DEFAULT_BASE
let KEEP = false
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base') BASE = args[++i]
  else if (args[i] === '--keep') KEEP = true
}
BASE = BASE.replace(/\/+$/, '')

const runId = Date.now().toString(36)
const tag = `[TEST-${runId}]`
const phoneSuffix = String(Date.now()).slice(-8)

const state = {
  customerId: null,
  deviceId: null,
  workOrderId: null,
  workOrderCode: null,
  quoteId: null,
  approvalToken: null,
  invoiceId: null,
  partId: null,
  partSku: `TEST-${runId}`,
  taskId: null,
  reminderId: null,
  techId: null,
  taxRate: 0,
  guideId: null,
}

const results = []

function check(flow, label, ok, detail = '') {
  results.push({ flow, label, ok, detail })
  const mark = ok ? '[OK]' : '[FAIL]'
  console.log(`  ${mark} ${flow} > ${label}${detail ? ` (${detail})` : ''}`)
  return ok
}

function fail(flow, label, detail = '') {
  return check(flow, label, false, detail)
}

let sessionCookie = null // cookie de sesion Supabase (se llena en login)

async function request(method, path, body, timeoutMs = 30000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const opts = { method, signal: controller.signal, headers: { 'Content-Type': 'application/json' } }
  if (body !== undefined) opts.body = JSON.stringify(body)
  if (sessionCookie) opts.headers.Cookie = sessionCookie
  let res
  try {
    res = await fetch(`${BASE}${path}`, opts)
  } catch (e) {
    clearTimeout(timer)
    return { status: 0, data: null, error: e.message }
  }
  clearTimeout(timer)
  // Capturar la cookie de sesion del login para reusarla
  if (!sessionCookie) {
    const setCookie = res.headers.get('set-cookie') || res.headers.get('Set-Cookie')
    if (setCookie) sessionCookie = setCookie.split(';')[0]
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    /* body vacio o no JSON */
  }
  return { status: res.status, data }
}

// Login inicial: el smoke test necesita sesion (auth real desde F1).
// Credenciales via SMOKE_EMAIL/SMOKE_PASSWORD (default: taller de QA).
async function login() {
  const email = process.env.SMOKE_EMAIL || 'tallerflow5@gmail.com'
  const password = process.env.SMOKE_PASSWORD || 'PilotoTaller5!'
  console.log(`\n== LOGIN (${email}) ==`)
  const res = await request('POST', '/api/auth/login', { email, password })
  if (res.status !== 200) {
    console.log(`  [FAIL] login > sesion iniciada (HTTP ${res.status} - ${JSON.stringify(res.data)})`)
    return false
  }
  console.log('  [OK] login > sesion iniciada')
  return true
}

const approx = (a, b, eps = 0.01) => Math.abs(Number(a) - Number(b)) < eps

// ============================================================================
// FLUJO 1 - Salud: todos los endpoints GET
// ============================================================================
async function flowHealth() {
  console.log('\n== FLUJO 1: Salud (endpoints GET) ==')
  const getEndpoints = [
    '/api/customers',
    '/api/devices',
    '/api/work-orders',
    '/api/quotes',
    '/api/invoices',
    '/api/parts',
    '/api/reminders',
    '/api/daily-tasks',
    '/api/users',
    '/api/settings',
    '/api/notifications',
    '/api/whatsapp/templates',
    '/api/whatsapp/connection',
    '/api/dashboard',
    '/api/daily-agenda',
  ]
  let okCount = 0
  for (const ep of getEndpoints) {
    const r = await request('GET', ep)
    const valid = r.status === 200 && r.data !== null && r.data !== undefined
    if (valid) okCount++
    check('GET', ep, r.status === 200, `HTTP ${r.status}${r.status !== 200 ? ` - ${r.error || ''}` : ''}`)
    if (r.status !== 200) continue
    if (ep === '/api/settings') {
      state.taxRate = Number(r.data.taxRate) || 0
      check('GET', 'settings devuelve taxRate', typeof r.data.taxRate === 'number', `taxRate=${state.taxRate}`)
    }
    if (ep === '/api/whatsapp/templates') {
      check('GET', 'whatsapp/templates es un array no vacio', Array.isArray(r.data) && r.data.length > 0, `${r.data.length} plantillas`)
    }
  }
  check('FLUJO 1', `todos los GET responden 200 (${okCount}/${getEndpoints.length})`, okCount === getEndpoints.length)
}

// ============================================================================
// FLUJO 2 - Registro rapido (cliente + equipo + orden)
// ============================================================================
async function flowQuickRegister() {
  console.log('\n== FLUJO 2: Registro rapido ==')
  const body = {
    firstName: 'Prueba',
    lastName: `Smoke${runId}`,
    phone: `+57 3${phoneSuffix}`,
    address: `Cra 1 #1-1, Bogota ${tag}`,
    deviceType: 'washing_machine',
    deviceBrand: 'TEST',
    deviceModel: tag,
    reportedIssue: `Verificacion de flujo de prueba ${tag}`,
    serviceType: 'revision',
    priority: 'normal',
  }
  const r = await request('POST', '/api/quick-register', body)
  if (r.status !== 201 || !r.data?.workOrder) {
    return fail('FLUJO 2', 'registro rapido devuelve 201', `HTTP ${r.status} - ${r.error || JSON.stringify(r.data)}`)
  }
  state.customerId = r.data.customer?.id || null
  state.deviceId = r.data.device?.id || null
  state.workOrderId = r.data.workOrder?.id || null
  state.workOrderCode = r.data.workOrder?.code || null

  check('FLUJO 2', 'cliente creado', !!state.customerId)
  check('FLUJO 2', 'equipo creado', !!state.deviceId)
  check('FLUJO 2', 'orden creada', !!state.workOrderId)
  check('FLUJO 2', 'codigo OT con patron OT-YYYY-NNN', /^OT-\d{4}-\d{3,}$/.test(state.workOrderCode), state.workOrderCode)

  const search = await request('GET', `/api/work-orders?search=${encodeURIComponent(`Smoke${runId}`)}`)
  const found = Array.isArray(search.data) && search.data.some((wo) => wo.id === state.workOrderId)
  check('FLUJO 2', 'la orden aparece en el buscador', found, `HTTP ${search.status}`)
}

// ============================================================================
// FLUJO 3 - Orden -> Cotizacion -> Aprobacion
// ============================================================================
async function flowQuote() {
  console.log('\n== FLUJO 3: Orden -> Cotizacion -> Aprobacion ==')

  const users = await request('GET', '/api/users')
  if (Array.isArray(users.data) && users.data.length > 0) {
    const tech = users.data.find((u) => u.role === 'technician') || users.data[0]
    state.techId = tech.id
    check('FLUJO 3', 'hay usuarios para asignar', !!state.techId, tech.name)
  } else {
    fail('FLUJO 3', 'no hay usuarios disponibles')
  }

  // Flujo de revisión (serviceType=revision): received → approved → delivered
  // El diagnóstico y la asignación no aplican en este flujo simplificado.
  const st = await request('PATCH', `/api/work-orders/${state.workOrderId}`, {
    action: 'change_status',
    status: 'approved',
    note: `Aprobación de prueba ${tag}`,
    createdBy: 'SmokeTest',
  })
  check('FLUJO 3', 'orden pasa a "approved" (flujo revisión)', st.status === 200 && st.data?.status === 'approved', `HTTP ${st.status}`)

  // La asignación de técnico sigue disponible en cualquier estado
  if (state.techId) {
    const at = await request('PATCH', `/api/work-orders/${state.workOrderId}`, {
      action: 'assign_technician',
      technicianId: state.techId,
      createdBy: 'SmokeTest',
    })
    check('FLUJO 3', 'tecnico asignado', at.status === 200 && at.data?.technicianId === state.techId, `HTTP ${at.status}`)
  }

  const items = [
    { itemType: 'labor', description: `Mano de obra TEST ${tag}`, quantity: 1, unitPrice: 50000 },
    { itemType: 'part', description: `Repuesto TEST ${tag}`, quantity: 2, unitPrice: 10000 },
  ]
  const expectedSubtotal = 70000
  const expectedTax = expectedSubtotal * (state.taxRate / 100)
  const expectedTotal = expectedSubtotal + expectedTax

  const q = await request('POST', '/api/quotes', { workOrderId: state.workOrderId, notes: tag, items })
  if (q.status === 201 && q.data?.id) {
    state.quoteId = q.data.id
    state.approvalToken = q.data.approvalToken
    check('FLUJO 3', 'cotizacion creada', true, `HTTP ${q.status} - ${q.data.code}`)
    check('FLUJO 3', 'subtotal calculado', approx(q.data.subtotal, expectedSubtotal), `$${q.data.subtotal}`)
    check('FLUJO 3', 'impuesto calculado', approx(q.data.tax, expectedTax), `$${q.data.tax}`)
    check('FLUJO 3', 'total calculado', approx(q.data.total, expectedTotal), `$${q.data.total}`)
  } else {
    return fail('FLUJO 3', 'cotizacion creada', `HTTP ${q.status} - ${q.error || JSON.stringify(q.data)}`)
  }

  const rnd = await request('POST', '/api/whatsapp/render', {
    templateCode: 'quote_sent',
    customerId: state.customerId,
    workOrderId: state.workOrderId,
  })
  if (rnd.status === 200 && typeof rnd.data?.rendered === 'string') {
    const rendered = rnd.data.rendered
    check('FLUJO 3', 'plantilla renderizada', true, 'quote_sent')
    check('FLUJO 3', 'variables {cliente}/{codigo} reemplazadas', rendered.includes('Smoke') || rendered.includes('Prueba'), '')
    check('FLUJO 3', 'no quedan placeholders sin reemplazar', !/{\w+}/.test(rendered), rendered.slice(0, 60))
  } else {
    fail('FLUJO 3', 'plantilla renderizada', `HTTP ${rnd.status} - ${rnd.error || ''}`)
  }

  const app = await request('POST', `/api/quotes/${state.quoteId}/approve`, {
    token: state.approvalToken,
    decision: 'approve',
    name: 'Cliente Prueba',
  })
  const approvedQuote = app.data?.quote?.status === 'approved'
  const approvedOrder = app.data?.workOrder?.status === 'approved'
  check('FLUJO 3', 'cotizacion aprobada', app.status === 200 && approvedQuote, `HTTP ${app.status} - quote=${app.data?.quote?.status}`)
  check('FLUJO 3', 'respuesta incluye orden aprobada', app.status === 200 && approvedOrder, `workOrder=${app.data?.workOrder?.status}`)

  const wo = await request('GET', `/api/work-orders/${state.workOrderId}`)
  check('FLUJO 3', 'orden pasa a "approved"', wo.status === 200 && wo.data?.status === 'approved', `HTTP ${wo.status}`)
  check('FLUJO 3', 'totalAmount sincronizado', wo.status === 200 && approx(wo.data?.totalAmount, expectedTotal), `$${wo.data?.totalAmount}`)
}

// ============================================================================
// FLUJO 4 - Facturacion
// ============================================================================
async function flowInvoice() {
  console.log('\n== FLUJO 4: Facturacion ==')
  const expectedSubtotal = 70000
  const expectedTax = expectedSubtotal * (state.taxRate / 100)
  const expectedTotal = expectedSubtotal + expectedTax

  const inv = await request('POST', '/api/invoices', {
    workOrderId: state.workOrderId,
    customerId: state.customerId,
    items: [
      { description: `Mano de obra TEST ${tag}`, quantity: 1, unitPrice: 50000, itemType: 'labor' },
      { description: `Repuesto TEST ${tag}`, quantity: 2, unitPrice: 10000, itemType: 'part' },
    ],
  })
  if (inv.status === 201 && inv.data?.id) {
    state.invoiceId = inv.data.id
    check('FLUJO 4', 'factura creada', true, `HTTP ${inv.status} - ${inv.data.code}`)
    check('FLUJO 4', 'total = subtotal + impuesto', approx(inv.data.total, expectedTotal), `$${inv.data.total}`)
  } else {
    return fail('FLUJO 4', 'factura creada', `HTTP ${inv.status} - ${inv.error || JSON.stringify(inv.data)}`)
  }

  const pay = await request('PUT', `/api/invoices/${state.invoiceId}`, {
    action: 'mark_paid',
    paymentMethod: 'cash',
  })
  check('FLUJO 4', 'factura marcada como pagada', pay.status === 200 && pay.data?.status === 'paid', `HTTP ${pay.status}`)
  check('FLUJO 4', 'monto pagado = total', pay.status === 200 && approx(pay.data?.paid, expectedTotal), `$${pay.data?.paid}`)
}

// ============================================================================
// FLUJO 5 - Inventario
// ============================================================================
async function flowInventory() {
  console.log('\n== FLUJO 5: Inventario ==')
  const part = await request('POST', '/api/parts', {
    sku: state.partSku,
    name: `Repuesto Prueba ${tag}`,
    category: 'other',
    applianceType: 'washing_machine',
    unitCost: 5000,
    unitPrice: 8000,
    minStock: 2,
    unit: 'unidad',
  })
  if (part.status === 201 && part.data?.id) {
    state.partId = part.data.id
    check('FLUJO 5', 'repuesto creado', true, `HTTP ${part.status} - sku=${state.partSku}`)
    check('FLUJO 5', 'stock inicial 0', part.data.stock === 0, `stock=${part.data.stock}`)
  } else {
    return fail('FLUJO 5', 'repuesto creado', `HTTP ${part.status} - ${part.error || JSON.stringify(part.data)}`)
  }

  const in1 = await request('PUT', `/api/parts/${state.partId}`, {
    action: 'adjust_stock',
    quantity: 5,
    movementType: 'in',
    reason: tag,
    createdBy: 'SmokeTest',
  })
  check('FLUJO 5', 'entrada de stock +5', in1.status === 200 && in1.data?.stock === 5, `HTTP ${in1.status} - stock=${in1.data?.stock}`)

  const out1 = await request('PUT', `/api/parts/${state.partId}`, {
    action: 'adjust_stock',
    quantity: -2,
    movementType: 'out',
    reason: tag,
    createdBy: 'SmokeTest',
  })
  check('FLUJO 5', 'salida de stock -2', out1.status === 200 && out1.data?.stock === 3, `HTTP ${out1.status} - stock=${out1.data?.stock}`)

  const detail = await request('GET', `/api/parts/${state.partId}`)
  check('FLUJO 5', 'stock final 3', detail.status === 200 && detail.data?.stock === 3, `HTTP ${detail.status}`)
  check('FLUJO 5', 'movimientos registrados', detail.status === 200 && Array.isArray(detail.data?.movements) && detail.data.movements.length >= 2, `${detail.data?.movements?.length} movimientos`)

  const list = await request('GET', `/api/parts?search=${encodeURIComponent(state.partSku)}`)
  const found = Array.isArray(list.data) && list.data.some((p) => p.id === state.partId)
  check('FLUJO 5', 'el repuesto aparece en el buscador', found, `HTTP ${list.status}`)
}

// ============================================================================
// FLUJO 6 - Tareas diarias
// ============================================================================
async function flowDailyTasks() {
  console.log('\n== FLUJO 6: Tareas diarias ==')
  const task = await request('POST', '/api/daily-tasks', {
    title: `Tarea prueba ${tag}`,
    description: `Descripcion del flujo de prueba ${tag}`,
    priority: 'high',
    assigneeId: state.techId,
  })
  if (task.status === 201 && task.data?.id) {
    state.taskId = task.data.id
    check('FLUJO 6', 'tarea creada', true, `HTTP ${task.status}`)
    check('FLUJO 6', 'tarea inicia pendiente', task.data.isCompleted === false, `isCompleted=${task.data.isCompleted}`)
  } else {
    return fail('FLUJO 6', 'tarea creada', `HTTP ${task.status} - ${task.error || JSON.stringify(task.data)}`)
  }

  const done = await request('PUT', `/api/daily-tasks/${state.taskId}`, {
    isCompleted: true,
    completedBy: 'SmokeTest',
  })
  check('FLUJO 6', 'tarea marcada como completada', done.status === 200 && done.data?.isCompleted === true, `HTTP ${done.status}`)
  check('FLUJO 6', 'completedAt registrado', done.status === 200 && !!done.data?.completedAt, '')

  const list = await request('GET', '/api/daily-tasks?completed=true')
  const found = Array.isArray(list.data) && list.data.some((t) => t.id === state.taskId)
  check('FLUJO 6', 'aparece en el listado de completadas', found, `HTTP ${list.status}`)

  const del = await request('DELETE', `/api/daily-tasks/${state.taskId}`)
  check('FLUJO 6', 'tarea eliminada', del.status === 200 && del.data?.deleted === true, `HTTP ${del.status}`)
}

// ============================================================================
// FLUJO 7 - Recordatorios
// ============================================================================
async function flowReminders() {
  console.log('\n== FLUJO 7: Recordatorios ==')
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const rem = await request('POST', '/api/reminders', {
    customerId: state.customerId,
    title: `Recordatorio prueba ${tag}`,
    message: tag,
    dueDate: tomorrow.toISOString(),
    type: 'custom',
    channel: 'whatsapp',
    priority: 'high',
  })
  if (rem.status === 201 && rem.data?.id) {
    state.reminderId = rem.data.id
    check('FLUJO 7', 'recordatorio creado', true, `HTTP ${rem.status}`)
    check('FLUJO 7', 'recordatorio inicia pendiente', rem.data.status === 'pending', `status=${rem.data.status}`)
  } else {
    return fail('FLUJO 7', 'recordatorio creado', `HTTP ${rem.status} - ${rem.error || JSON.stringify(rem.data)}`)
  }

  const snooze = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  const sn = await request('PUT', `/api/reminders/${state.reminderId}`, {
    action: 'snooze',
    snoozeUntil: snooze.toISOString(),
  })
  check('FLUJO 7', 'recordatorio pospuesto (snoozed)', sn.status === 200 && sn.data?.status === 'snoozed', `HTTP ${sn.status}`)

  const list = await request('GET', `/api/reminders?customerId=${state.customerId}`)
  const found = Array.isArray(list.data) && list.data.some((r) => r.id === state.reminderId)
  check('FLUJO 7', 'aparece en el listado del cliente', found, `HTTP ${list.status}`)

  const del = await request('DELETE', `/api/reminders/${state.reminderId}`)
  check('FLUJO 7', 'recordatorio eliminado', del.status === 200 && del.data?.deleted === true, `HTTP ${del.status}`)
}

// ============================================================================
// FLUJO 9 - Base de conocimiento (guías de reparación)
// ============================================================================
async function flowGuides() {
  console.log('\n== FLUJO 9: Base de conocimiento (guías) ==')

  const list = await request('GET', '/api/guides')
  check('FLUJO 9', 'listado de guías', list.status === 200 && Array.isArray(list.data), `HTTP ${list.status}`)
  if (!Array.isArray(list.data) || list.data.length === 0) {
    return fail('FLUJO 9', 'hay guías sembradas', 'no hay guías activas en el listado')
  }

  const first = list.data[0]
  const partsValid = Array.isArray(first.partsUsed) || (typeof first.partsUsed === 'string' && first.partsUsed.length > 0)
  check('FLUJO 9', 'guía trae pasos y repuestos', typeof first.steps === 'string' && partsValid, `partsUsed=${Array.isArray(first.partsUsed) ? 'array' : typeof first.partsUsed}`)

  const sugg = await request('GET', `/api/guides/suggestions?applianceType=${encodeURIComponent(first.applianceType || 'washing_machine')}&symptom=${encodeURIComponent('no')}`)
  check('FLUJO 9', 'sugerencias por aparato+síntoma', sugg.status === 200 && Array.isArray(sugg.data), `HTTP ${sugg.status}`)

  const created = await request('POST', '/api/guides', {
    title: `Guía de prueba ${tag}`,
    summary: 'Guía temporal creada por el flujo de prueba.',
    applianceType: 'washing_machine',
    brand: 'TestBrand',
    model: 'TestModel',
    symptoms: ['síntoma de prueba'],
    steps: '1. Paso de prueba\n2. Paso de prueba',
    difficulty: 'media',
    estimatedHours: 1,
    partsUsed: [{ name: 'Repuesto de prueba', qty: 1 }],
    status: 'draft',
    usageCount: 0,
  })
  if ((created.status === 200 || created.status === 201) && created.data?.id) {
    state.guideId = created.data.id
    check('FLUJO 9', 'guía creada (borrador)', true, `HTTP ${created.status}`)
  } else {
    return fail('FLUJO 9', 'guía creada (borrador)', `HTTP ${created.status} - ${created.error || JSON.stringify(created.data)}`)
  }

  const pub = await request('PUT', `/api/guides/${state.guideId}`, { action: 'publish' })
  check('FLUJO 9', 'guía publicada', pub.status === 200 && pub.data?.status === 'active', `HTTP ${pub.status} status=${pub.data?.status}`)

  const usage = await request('PUT', `/api/guides/${state.guideId}`, { action: 'increment_usage' })
  check('FLUJO 9', 'contador de uso incrementa', usage.status === 200 && Number(usage.data?.usageCount) >= 1, `usageCount=${usage.data?.usageCount}`)
}

// ============================================================================
// FLUJO 8 - Limpieza automatica
// ============================================================================
async function flowCleanup() {
  console.log('\n== FLUJO 8: Limpieza automatica ==')

  const clean = async (label, fn) => {
    try {
      const res = await fn()
      if (res.status === 200 || res.status === 201 || res.status === 404) {
        check('FLUJO 8', label, true, `HTTP ${res.status}`)
      } else {
        check('FLUJO 8', label, false, `HTTP ${res.status} - ${res.error || JSON.stringify(res.data)}`)
      }
    } catch (e) {
      check('FLUJO 8', label, false, e.message)
    }
  }

  // Recordatorios del cliente (incluye el creado por quick-register)
  const rems = await request('GET', `/api/reminders?customerId=${state.customerId}`)
  if (Array.isArray(rems.data)) {
    for (const r of rems.data) {
      await clean(`borrar recordatorio ${r.id.slice(-6)}`, () => request('DELETE', `/api/reminders/${r.id}`))
    }
  }

  // Factura: cancelar primero (solo se borran pendientes o anuladas) y luego eliminar
  if (state.invoiceId) {
    await clean('cancelar factura', () => request('PUT', `/api/invoices/${state.invoiceId}`, { action: 'cancel' }))
    await clean('borrar factura', () => request('DELETE', `/api/invoices/${state.invoiceId}`))
  }

  // Orden: cancelar (transición válida desde approved) y eliminar en cascada.
  // El delete en cascada borra cotizaciones (incl. aprobada), items y eventos
  if (state.workOrderId) {
    await clean('cancelar orden', () =>
      request('PATCH', `/api/work-orders/${state.workOrderId}`, { action: 'change_status', status: 'cancelled', note: `Limpieza ${tag}` }))
    await clean('borrar orden (cascada)', () => request('DELETE', `/api/work-orders/${state.workOrderId}`))
  }

  if (state.deviceId) {
    await clean('borrar equipo', () => request('DELETE', `/api/devices/${state.deviceId}`))
  }

  if (state.partId) {
    await clean('desactivar repuesto', () => request('DELETE', `/api/parts/${state.partId}`))
  }

  // Guía de prueba
  if (state.guideId) {
    await clean('eliminar guía de prueba', () => request('DELETE', `/api/guides/${state.guideId}`))
  }

  if (state.customerId) {
    await clean('borrar cliente', () => request('DELETE', `/api/customers/${state.customerId}`))
  }

  // Verificacion post-limpieza
  if (state.customerId) {
    const gone = await request('GET', `/api/customers/${state.customerId}`)
    check('FLUJO 8', 'cliente ya no existe', gone.status === 404, `HTTP ${gone.status}`)
  }
  if (state.workOrderId) {
    const gone = await request('GET', `/api/work-orders/${state.workOrderId}`)
    check('FLUJO 8', 'orden ya no existe', gone.status === 404, `HTTP ${gone.status}`)
  }
}

// ============================================================================
// MAIN
// ============================================================================
console.log('='.repeat(72))
console.log(`TallerFlow - Flujo de prueba`)
console.log(`Base : ${BASE}`)
console.log(`Run  : ${runId} (tag ${tag})`)
console.log('='.repeat(72))

try {
  const authed = await login()
  if (!authed) {
    console.log('\n[ABORT] Sin sesion no se pueden probar los flujos protegidos.')
    console.log('        Define SMOKE_EMAIL / SMOKE_PASSWORD con una cuenta del taller.')
    process.exit(1)
  }
  await flowHealth()
  await flowQuickRegister()
  if (state.workOrderId) await flowQuote()
  if (state.workOrderId && state.customerId) await flowInvoice()
  await flowInventory()
  await flowDailyTasks()
  await flowReminders()
  await flowGuides()
  if (!KEEP) await flowCleanup()
  else console.log('\n== FLUJO 8: omitido (--keep) ==')
} catch (e) {
  console.log(`\n[ERROR] Excepcion no controlada: ${e.message}`)
  if (!KEEP) await flowCleanup().catch(() => {})
}

// Resumen
const failed = results.filter((r) => !r.ok)
const total = results.length
console.log('\n' + '='.repeat(72))
console.log('RESUMEN')
console.log(`  Total   : ${total}`)
console.log(`  OK      : ${total - failed.length}`)
console.log(`  FAIL    : ${failed.length}`)
if (failed.length > 0) {
  console.log('\n  Fallos:')
  for (const f of failed) {
    console.log(`    - ${f.flow} > ${f.label}${f.detail ? ` (${f.detail})` : ''}`)
  }
}
console.log('='.repeat(72))

if (failed.length > 0) process.exit(1)
process.exit(0)
