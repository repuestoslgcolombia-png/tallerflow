import { db } from '@/lib/db'

// Guías de reparación para la base de conocimiento del taller
const GUIDES = [
  {
    title: 'Lavadora no desagua (bomba de drenaje obstruida)',
    summary:
      'Procedimiento estándar para lavadoras automáticas que no expulsan el agua durante el ciclo de lavado o centrifugado.',
    applianceType: 'washing_machine',
    brand: 'Universal',
    model: 'Universal',
    symptoms: ['no desagua', 'se detiene con agua', 'saca poco agua', 'se llena y no expulsa'],
    steps: `1. Verificar que la lavadora esté apagada y desconectada de la corriente.
2. Desconectar la manguera de drenaje y retirar objetos (monedas, botones) que bloqueen la salida.
3. Ubicar la bomba de drenaje (parte inferior trasera), retirar la tapa y limpiar el impulsor.
4. Inspeccionar la manguera interior entre tina y bomba; destapar con alambre si es necesario.
5. Probar la bomba directamente con 110V/220V para confirmar que gira; si no, medir continuidad con multímetro.
6. Si la bomba no funciona, reemplazarla (usar bomba universal compatible con la marca).
7. Reensamblar, conectar agua y ejecutar ciclo corto para verificar el drenaje.`,
    difficulty: 'facil',
    estimatedHours: 1.5,
    partsUsed: [{ name: 'Bomba de agua/drenaje universal', qty: 1 }],
    status: 'active',
    usageCount: 12,
  },
  {
    title: 'Cambio de rodamientos en lavadora (ruido en centrifugado)',
    summary:
      'Reparación de rodamientos del tambor de lavadora cuando se escucha ruido fuerte o golpeteo al centrifugar.',
    applianceType: 'washing_machine',
    brand: 'Universal',
    model: 'Universal',
    symptoms: ['hace ruido', 'ruido al centrifugar', 'golpetea', 'tambor suelto'],
    steps: `1. Desconectar la lavadora y retirar la tapa superior y el panel trasero.
2. Retirar la correa del motor y desconectar cables y mangueras que bloqueen el tambor.
3. Extraer el tambor completo (tina) del gabinete.
4. Desarmar el eje trasero y retirar los rodamientos con extractor adecuado.
5. Limpiar el alojamiento y aplicar grasa silicona; instalar rodamientos nuevos sellados (6204-2RS + 6205-2RS).
6. Reemplazar también el retén (sello) del eje si presenta fugas o desgaste.
7. Reensamblar en orden inverso, asegurando el ajuste del tambor y la correa.
8. Realizar ciclo de prueba sin carga verificando que el ruido desaparezca.`,
    difficulty: 'compleja',
    estimatedHours: 4,
    partsUsed: [
      { name: 'Rodamiento de tambor (par)', qty: 1 },
      { name: 'Grasa silicona 100g', qty: 1 },
    ],
    status: 'active',
    usageCount: 8,
  },
  {
    title: 'Nevera no enfría (termostato defectuoso)',
    summary:
      'Diagnóstico y reemplazo de termostato en neveras que no enfrían o enfrián de forma irregular.',
    applianceType: 'refrigerator',
    brand: 'Universal',
    model: 'Universal',
    symptoms: ['no enfría', 'enfría poco', 'se apaga el motor', 'prende y apaga seguido'],
    steps: `1. Desconectar la nevera y retirar la perilla y la caja del termostato en el interior.
2. Verificar que el compresor arranque con el termostato en posición máxima (bypass).
3. Si arranca, sospechar de termostato; medir continuidad a temperatura ambiente con multímetro.
4. Retirar el bulbo capilar de su alojamiento en el evaporador.
5. Instalar termostato universal nuevo en el rango -25°C a 10°C.
6. Colocar el bulbo en el mismo punto original y fijar la caja.
7. Conectar la nevera y dejar estabilizar 24h; verificar ciclos de encendido/apagado y temperatura.`,
    difficulty: 'media',
    estimatedHours: 1.5,
    partsUsed: [{ name: 'Termostato de nevera universal', qty: 1 }],
    status: 'active',
    usageCount: 15,
  },
  {
    title: 'Relé PTC de compresor quemado (nevera no arranca)',
    summary:
      'Reemplazo del relé de arranque del compresor cuando la nevera no enciende o el compresor solo zumba.',
    applianceType: 'refrigerator',
    brand: 'Universal',
    model: 'Universal',
    symptoms: ['no enciende', 'no arranca', 'zumba el compresor', 'prende y apaga'],
    steps: `1. Desconectar la nevera y retirar la tapa de la caja eléctrica trasera inferior.
2. Localizar el relé PTC montado sobre el compresor junto al protector térmico.
3. Retirar el relé con cuidado (presionar hacia afuera) y revisar visualmente que no esté quemado.
4. Medir continuidad entre terminales: debe presentar baja resistencia en frío y abrir al calentarse.
5. Si está abierto o dañado, instalar relé PTC universal compatible con la potencia del compresor (1/4 a 1/3 HP).
6. Verificar también el protector térmico y los cables de conexión.
7. Reensamblar y conectar; confirmar arranque del compresor tras 5 minutos.`,
    difficulty: 'facil',
    estimatedHours: 1,
    partsUsed: [{ name: 'Relé PTC arraque compresor', qty: 1 }],
    status: 'active',
    usageCount: 10,
  },
  {
    title: 'AC split no enfría (capacitor de arranque fallando)',
    summary:
      'Verificación y reemplazo de capacitor en unidades de aire acondicionado split que no encienden el compresor.',
    applianceType: 'air_conditioner',
    brand: 'Universal',
    model: 'Universal',
    symptoms: ['no enfría', 'no enciende el compresor', 'zumba', 'ventilador gira y compresor no'],
    steps: `1. Apagar el AC por el breaker y desconectar la unidad interior.
2. Abrir la unidad exterior y localizar el capacitor en la caja de bornes.
3. Descargar el capacitor con un resistor antes de manipularlo.
4. Medir capacitancia con multímetro en modo capacitancia (µF); comparar con el valor nominal impreso.
5. Si la lectura difiere más del 10% o el capacitor está hinchado, reemplazarlo.
6. Instalar capacitor del mismo valor de capacitancia y voltaje (ej. 35µF 450V).
7. Cerrar, conectar y encender; verificar arranque del compresor y enfriamiento.`,
    difficulty: 'media',
    estimatedHours: 1,
    partsUsed: [
      { name: 'Capacitor AC 35µF 450V', qty: 1 },
      { name: 'Capacitor AC 50µF 450V', qty: 1 },
    ],
    status: 'active',
    usageCount: 7,
  },
  {
    title: 'TV LED pantalla oscura (tiras de retroiluminación dañadas)',
    summary:
      'Reparación de TV LED con pantalla oscura o imagen apenas visible debido a tiras de retroiluminación quemadas.',
    applianceType: 'tv',
    brand: 'Universal',
    model: 'Universal',
    symptoms: ['pantalla oscura', 'no se ve imagen', 'se ve solo con linterna', 'imagen apenas visible'],
    steps: `1. Desconectar el TV y retirar el soporte y la tapa trasera.
2. Ubicar las tarjetas de potencia y T-CON; confirmar voltaje de salida hacia las tiras LED.
3. Si el voltaje cae a cero tras intentar encender, hay un LED quemado en circuito.
4. Retirar el panel LCD con cuidado (esqueleto) para acceder a las tiras de retroiluminación.
5. Identificar las tiras con LEDs dañados (visualmente o con tester de LEDs).
6. Reemplazar el kit completo de tiras del tamaño del panel (ej. 55", 43") en lugar de LEDs sueltos.
7. Reensamblar el panel, conectar y probar que la retroiluminación encienda uniforme.`,
    difficulty: 'compleja',
    estimatedHours: 3,
    partsUsed: [{ name: 'Display LED TV 55" (tiras)', qty: 1 }],
    status: 'active',
    usageCount: 5,
  },
  {
    title: 'Secadora a gas no enciende la llama (kit encendedor)',
    summary:
      'Revisión y reemplazo del sistema de encendido en secadoras a gas cuando el quemador no enciende.',
    applianceType: 'gas_dryer',
    brand: 'Universal',
    model: 'Universal',
    symptoms: ['no calienta', 'no enciende la llama', 'se apaga el piloto', 'no seca'],
    steps: `1. Cerrar la válvula de gas y desconectar la secadora de la corriente.
2. Retirar el panel inferior frontal para acceder al quemador y al encendedor.
3. Verificar que llegue gas al quemador abriendo la válvula momentáneamente (con precaución).
4. Inspeccionar el encendedor (glow bar) por grietas o puntos negros.
5. Medir el voltaje en los terminales del encendedor al activar el ciclo de secado.
6. Verificar el sensor de llama (flame sensor) por óxido o mala posición.
7. Reemplazar el kit de encendido si se confirma falla; limpiar quemador y reensamblar.
8. Probar un ciclo de secado de 10 minutos verificando encendido y llama estable.`,
    difficulty: 'media',
    estimatedHours: 2,
    partsUsed: [
      { name: 'Kit encendedor/piloto universal', qty: 1 },
      { name: 'Sensor de llama secadora', qty: 1 },
    ],
    status: 'draft',
    usageCount: 0,
  },
]

async function main() {
  console.log('🌱 Seeding base de conocimiento (guías de reparación)...')

  // Autor por defecto: primer usuario activo (sin autenticación en la app)
  const author = await db.user.findFirst({ where: { active: true }, orderBy: { name: 'asc' } })
  if (!author) {
    console.error('❌ No hay usuarios activos para asignar como autor. Ejecuta primero el seed de usuarios.')
    process.exit(1)
  }

  // Eliminar guías existentes para un reseed limpio
  await db.repairGuide.deleteMany()

  let count = 0
  for (const g of GUIDES) {
    await db.repairGuide.create({
      data: {
        title: g.title,
        summary: g.summary,
        applianceType: g.applianceType,
        brand: g.brand,
        model: g.model,
        symptoms: JSON.stringify(g.symptoms),
        steps: g.steps,
        difficulty: g.difficulty,
        estimatedHours: g.estimatedHours,
        partsUsed: JSON.stringify(g.partsUsed),
        status: g.status,
        usageCount: g.usageCount,
        authorId: author.id,
      },
    })
    count++
  }

  console.log(`✅ ${count} guías cargadas`)
  const byStatus = await db.repairGuide.groupBy({
    by: ['status'],
    _count: { _all: true },
  })
  byStatus.forEach((s) => {
    console.log(`   - ${s.status}: ${s._count._all} guías`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
