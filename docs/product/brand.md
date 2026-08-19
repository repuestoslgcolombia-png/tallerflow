# Guía de Marca — TallerFlow

## 1. Identidad

- **Nombre:** TallerFlow
- **Eslogan:** Gestión de talleres de electrodomésticos
- **Qué somos:** Plataforma web que centraliza las operaciones de un taller de reparación de electrodomésticos del hogar (lavadoras, neveras, congeladores, secadoras, aires acondicionados y TVs).
- **Audiencia:** Dueños de taller, técnicos, recepcionistas y clientes finales en LATAM (mercado es-CO).

## 2. Propuesta de valor

> "Del papel y WhatsApp al control total: órdenes claras, clientes informados y un negocio que escala."

## 3. Tono de voz

- **Cercano y profesional:** hablamos como un socio técnico, no como una corporación fría.
- **En español (es-CO):** todo texto de UI, mensajes y errores en español de Colombia.
- **Claro y directo:** frases cortas, acción visible, cero jerga innecesaria.
- **Confiable:** los estados del taller (recibido, diagnóstico, cotizado, en reparación) siempre comunican certeza.

## 4. Paleta de color

Derivada del logo oficial (JPEG original): fondo negro + figura azul-cian + trazos blancos.

| Rol | Token | HEX | OKLCH | Uso |
|-----|-------|-----|-------|-----|
| Primario | `--primary` | `#0E86CD` | `oklch(0.62 0.16 230)` | Botones, enlaces, elementos activos, marca |
| Primario brillante | — | `#28AFEF` | `oklch(0.72 0.13 225)` | Gradientes, hover, acentos claros |
| Primario profundo | — | `#1D80C1` | `oklch(0.6 0.14 235)` | Gradientes, fondo de marca en dark |
| CTA | — | `#F97316` | `oklch(0.69 0.19 44)` | Acciones destacadas (cobrar, confirmar, aprobar) |
| Fondo claro | `--background` | `#F8FAFC` | `oklch(0.985 0.002 247)` | Fondo de app en modo claro |
| Texto claro | `--foreground` | `#0F172A` | `oklch(0.205 0.032 265)` | Texto principal en modo claro |
| Fondo oscuro | `--background` (dark) | `#0B1220` | `oklch(0.165 0.02 250)` | Fondo de app en modo oscuro |
| Texto oscuro | `--foreground` (dark) | `#F1F5F9` | `oklch(0.97 0.005 250)` | Texto principal en modo oscuro |
| Negro marca | — | `#0A0A0B` | `oklch(0.16 0 0)` | Tile del logo, superficies premium |

### Reglas de uso

- **Nunca** usar verde como color primario (entra en conflicto con el azul del logo). El verde queda reservado para estados de éxito puntuales.
- El azul es la marca; el naranja solo como CTA puntual (no abusar).
- Contrastes: texto sobre azul marca debe ser blanco; texto sobre fondo claro mínimo `#475569` (slate-600).
- Los colores semánticos del dominio (`PART_CATEGORIES`: lavadoras, neveras, aires, etc.) **no cambian** — son códigos de categoría, no de marca.

## 5. Tipografía

- **Primaria (UI):** Geist (ya cargada vía `next/font` en `layout.tsx`).
- **Alternativa (marketing):** Plus Jakarta Sans (Sans + Sans, moderna y profesional para SaaS) — recomendada por skill ui-ux-pro-max. Uso futuro en landing/presentaciones.
- Fuente mono: Geist Mono (códigos, números de orden).

## 6. Logo

- **Mark:** símbolo estilizado — rayo/flow azul (`#1D80C1` → `#28AFEF`) sobre tile negro redondeado (`#0A0A0B`).
- **Favicon/iconos:** usar siempre el `logo-mark.svg` y sus derivados PNG en `public/`.
- **Uso correcto:**
  - Sobre fondo claro → tile negro completo del SVG.
  - Sobre fondo oscuro → mismo tile (se integra bien).
- **Uso incorrecto:**
  - No estirar, rotar ni poner sobre colores que compitan (verde, rojo).
  - No agregar sombras gruesas ni efectos de neón fuera del diseño.
  - No reemplazar por íconos genéricos (ej. `Wrench`) en superficies de marca.

### Assets

| Archivo | Tamaños | Uso |
|---------|---------|-----|
| `public/logo-mark.svg` | vector | Mark principal (UI, sidebar) |
| `public/favicon.ico` | multi | Pestañas del navegador |
| `public/icon-192.png` | 192×192 | PWA |
| `public/icon-512.png` | 512×512 | PWA |
| `public/icon-maskable-512.png` | 512×512 | PWA (safe zone) |
| `public/apple-touch-icon.png` | 180×180 | iOS home screen |
| `public/og-image.png` | 1200×630 | Compartición en redes |

## 7. PWA / Chrome

- `theme_color`: `#0E86CD` (barra del navegador en azul marca).
- `background_color`: `#F8FAFC` (claro) — evita flash blanco/blanco.
- `display`: standalone.

## 8. Checklist de consistencia

- [ ] Los botones primarios usan `bg-primary` (azul) — nunca un verde.
- [ ] Sidebar/Header muestran el `logo-mark` (no un ícono genérico).
- [ ] Footer dice "TallerFlow" con acento azul.
- [ ] `manifest.ts` theme_color en azul marca.
- [ ] Metadata y OG usan el eslogan y la descripción oficial.
- [ ] Textos en español (es-CO), tono cercano y profesional.