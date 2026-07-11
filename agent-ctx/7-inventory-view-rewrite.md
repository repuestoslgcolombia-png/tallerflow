# Task ID: 7 — Inventory view rewrite

## Scope
Rewrote `/home/z/my-project/src/modules/inventory/inventory-view.tsx` to support the new appliance-parts Part schema (brand, model, voltage, powerWatts, gasType, dimensions, warranty, compatibleBrands, applianceType) and added a category filter, rich table, detail dialog and improved create/edit form.

## Key changes
1. **Hook extension** (`src/lib/hooks/api.ts`): extended `useParts` to accept `category`, `brand`, `applianceType` query params (the API route already supported them).
2. **Inventory view rewrite** (`src/modules/inventory/inventory-view.tsx`):
   - Header with 4 stat cards: Total repuestos, Stock bajo, Valor inventario, Valor venta potencial.
   - Horizontal scrollable category pills (10 pills: Todos + 9 PART_CATEGORIES) with icon + label + count, plus a "Stock bajo" Switch and a debounced search input.
   - Rich table with 10 columns (Repuesto, Categoría, Especificaciones, Stock, Costo, Venta, Margen, Ubicación, Garantía, Acciones) — clickable rows open detail dialog.
   - Detail dialog (uses `usePart(id)` to load movements): category badge + SKU, description, technical specs grid (2 cols), compatible brands (parsed from JSON string), stock info + status badge, pricing grid (cost, price, margin, total inv value), recent movements (last 5) with type badges, sign and OT code.
   - Create/Edit form: 4 sections (Información básica, Compatibilidad, Especificaciones técnicas, Inventario y precios) with the gas type field shown only for refrigeration-related categories. Compatible-brands input is comma-separated, converted to JSON string on submit. Edit dialog uses `key={part.id}` pattern.
   - Adjust Stock dialog with ± buttons, auto-suggested movement type from sign, reason textarea, live preview of new stock (color-coded).
   - Deactivate confirmation via AlertDialog.
   - Empty state with CTA when no parts; loading skeleton rows.

## Conventions followed
- `'use client'` + named export `InventoryView`.
- Plain `useState` for forms (no react-hook-form).
- `key={id}` pattern on Edit and Adjust dialogs to avoid `setState in useEffect` lint.
- CategoryIcon is a proper component (not a function returning a component type) to satisfy `react-hooks/static-components`.
- All colors come from PART_CATEGORIES (sky, emerald, cyan, orange, teal, violet, amber, slate, rose) — no indigo/blue.
- Mobile responsive: stat grid 2 cols → 4, table wrapped in `overflow-x-auto`, dialogs `sm:max-w-2xl` with internal `ScrollArea`.
- Helpers: `parseCompatibleBrands`, `getStockColor`, `getStockBadge`, `safeNumber`.

## Verification
- `bun run lint` passes cleanly (0 errors, 0 warnings) after fixing `react-hooks/static-components` (inlined CategoryIcon component) and removing an unused eslint-disable.
- Dev server log shows `/api/parts?` returning 200 and `Compiled in` messages with no errors related to the inventory module.
