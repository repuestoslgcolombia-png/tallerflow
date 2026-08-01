# TallerFlow - Flujo de prueba manual (UI)

Complementa el script automatico `bun scripts/smoke-test.mjs`, que ya verifica la API.
Este checklist valida la interfaz en el navegador. Registra el resultado de cada paso.

## Antes de empezar

- Abrir la app: **https://tallerflow-gilt.vercel.app**
- Abrir DevTools (F12) -> pestana **Console** y dejar visible durante todo el recorrido.
- La app no tiene login: cualquier persona con la URL puede entrar.

## Referencia

- Script de API: `bun scripts/smoke-test.mjs` (8 flujos, limpieza automatica)
- Opciones: `--base URL` (otro entorno), `--keep` (no limpiar)

## 1. Flujo Diario (vista principal)

- [ ] Se muestra el saludo con la fecha del dia.
- [ ] Se cargan las tarjetas de estadisticas (ordenes, recordatorios, stock bajo).
- [ ] Las tareas del dia aparecen en el checklist.
- [ ] Marcar/desmarcar una tarea actualiza el estado sin recargar.
- [ ] Los recordatorios vencidos aparecen en la seccion de alertas.
- [ ] Sin errores en Console.

## 2. Registro Rapido

- [ ] Abrir "Registro Rapido" desde la barra lateral.
- [ ] Completar el formulario (nombre, telefono, direccion, tipo de equipo, problema) y guardar.
- [ ] Aparece el mensaje de exito y la OT generada (codigo OT-YYYY-NNN).
- [ ] El cliente y equipo quedan creados (verificar en Clientes y Equipos).
- [ ] Sin errores en Console.

## 3. Clientes

- [ ] Lista carga los clientes existentes.
- [ ] Buscar por nombre o telefono filtra correctamente.
- [ ] Crear un cliente nuevo se guarda y lista.
- [ ] Abrir el detalle de un cliente muestra sus datos, equipos, ordenes, facturas y recordatorios.
- [ ] Editar campos y guardar persiste los cambios.
- [ ] Sin errores en Console.

## 4. Equipos

- [ ] Lista carga los equipos con su cliente asociado.
- [ ] Crear un equipo para un cliente se guarda.
- [ ] Ver detalle de un equipo muestra el historial de ordenes.
- [ ] Sin errores en Console.

## 5. Ordenes de Trabajo

- [ ] Lista carga las ordenes con estado, prioridad y cliente.
- [ ] Filtrar por estado (recibida, diagnosticando, cotizada, aprobada, en proceso, lista, entregada, cancelada).
- [ ] Buscar por codigo, cliente o equipo.
- [ ] Crear una orden nueva se guarda con su codigo correlativo.
- [ ] Abrir el detalle muestra timeline, cotizaciones, diagnostico, factura y repuestos usados.
- [ ] Cambiar el estado de una orden agrega un evento al timeline.
- [ ] Sin errores en Console.

## 6. Cotizaciones

- [ ] Lista carga las cotizaciones con su orden y cliente.
- [ ] Crear una cotizacion con items (mano de obra / repuestos) calcula subtotal, impuesto y total.
- [ ] Enviar una cotizacion cambia su estado a "enviada".
- [ ] El enlace de aprobacion del cliente funciona (abrir la URL de aprobacion y aprobar/rechazar).
- [ ] Sin errores en Console.

## 7. Facturas

- [ ] Lista carga las facturas con su estado de pago.
- [ ] Generar una factura desde una orden aprobada calcula los totales.
- [ ] Registrar un pago actualiza el saldo y el estado (pendiente -> parcial/pagada).
- [ ] Sin errores en Console.

## 8. Inventario

- [ ] Lista carga los repuestos con stock, precio y ubicacion.
- [ ] Buscar por SKU, nombre o marca.
- [ ] Crear un repuesto nuevo se guarda.
- [ ] Ajustar stock (entrada/salida) actualiza el numero y registra el movimiento.
- [ ] Los repuestos con stock bajo aparecen en el Flujo Diario.
- [ ] Sin errores en Console.

## 9. Recordatorios

- [ ] Lista carga los recordatorios con cliente, fecha y estado.
- [ ] Crear un recordatorio (seguimiento, garantia, mantenimiento, personalizado).
- [ ] Completar / posponer / cancelar un recordatorio funciona.
- [ ] Los recordatorios vencidos y de hoy aparecen en el Flujo Diario.
- [ ] Sin errores en Console.

## 10. WhatsApp

- [ ] La seccion muestra el estado de conexion (disconnected / connected).
- [ ] Lista de plantillas carga las 12 plantillas del sistema.
- [ ] Editar / crear una plantilla se guarda.
- [ ] Vista previa reemplaza las variables {cliente}, {equipo}, {codigo}, etc.
- [ ] Nota: sin QR emparejado no se envian mensajes reales; solo se registran en la base de datos.
- [ ] Sin errores en Console.

## 11. Configuracion

- [ ] Se muestra el nombre del taller, telefono, email, direccion, impuesto y moneda.
- [ ] Editar y guardar los datos del taller persiste los cambios.
- [ ] El cambio de impuesto se refleja en nuevas cotizaciones/facturas.
- [ ] Sin errores en Console.

## Cierre

- [ ] **Recargar la pagina**: las vistas siguen cargando los datos.
- [ ] **Responsive**: la app se ve bien en escritorio y en movil (barra lateral colapsa).
- [ ] Sin errores rojos en Console durante todo el recorrido.

## Si algo falla

1. Anotar la vista y el paso exacto que fallo.
2. Copiar el error de Console.
3. Correr `bun scripts/smoke-test.mjs` para descartar un problema de API vs UI.
