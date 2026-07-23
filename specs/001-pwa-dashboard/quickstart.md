# Quickstart — Bitcho PWA Dashboard

Guía de arranque y verificación end-to-end (Constitución Art. II). No incluye implementación; los pasos concretos viven en `tasks.md`.

## Prerequisitos

- Node 22+, npm. (Ya disponibles en el entorno.)
- Acceso de lectura a las 5 vistas de Supabase con la anon key pública (ya validado).

## Setup

```bash
npm install
npm run dev        # Vite dev server (móvil: abrir en ancho ~390px)
```

## Build & preview (como Vercel)

```bash
npm run build      # vite build → dist/ (+ version.json con el commit)
npm run preview    # sirve dist/ localmente
```

## Tests

```bash
npm run test:unit          # Vitest: formatters, derivaciones, mapeo params, filtros/rango
npm run typecheck          # tsc --noEmit
npm run test:mobile        # Playwright config iPhone: smoke E2E
```

## Escenarios de verificación (prueban el feature end-to-end)

1. **LIVE con datos reales (US1/US2)**: `npm run preview` con red → header muestra precio BTC real + badge **LIVE**; RESUMEN lista **Control (actual) / HODL-biased / Low-frequency** con total, %P&L coloreado y sparkline; la comparativa dibuja 3 líneas y el toggle MXN↔%P&L recomputa.
2. **Detalle + config real (US3)**: abrir cada tab P1/P2/P3 → stats de estado correctos; el panel de config muestra los **params reales** (umbral, máx/op, cooldown, piso BTC, y stop-loss/objetivo solo donde aplican); la gráfica equity-vs-precio responde a 24H/48H/TODO.
3. **Log de decisiones (US4)**: en una estrategia, el log lista de más reciente a más antigua incluyendo **HOLD** (atenuado); chips filtran y los conteos suman el total; las entradas de trade muestran monto.
4. **DEMO / offline (FR-005)**: en Playwright, cortar red (`context.setOffline(true)`) tras primera carga → la app sigue navegable mostrando último dato cacheado con badge **DEMO**; cold-start sin red → serie embebida, sin pantalla en blanco.
5. **PWA (FR-016)**: `manifest.json` válido, SW registra, app instalable y abre a pantalla completa; `version.json` cambia entre deploys.

## Deploy (Vercel)

- `vercel.json`: `buildCommand` = build Vite + emisión de `version.json`; `outputDirectory: dist`; headers CSP (`connect-src` al host de Supabase https+wss), `no-cache` para `index.html`/`sw.js`/`version.json`.
- Push a la rama → preview de Vercel; verificar escenarios 1–5 en el preview antes de merge (Art. II).

## Definition of Done (gate)

- [x] `test:unit` (25 tests) + `typecheck` + `test:mobile` (4 E2E, Chromium iPhone) en verde.
- [x] Build de producción OK (`dist/` con app + PWA + `version.json`).
- [x] Escenarios verificados vía E2E: RESUMEN con las 3 estrategias reales (1), detalle + config real + log (2/3), offline→DEMO sin pantalla en blanco (4). Screenshots en `test-results/`.
- [ ] Verificación LIVE end-to-end en preview de Vercel (el navegador headless del CI no alcanza Supabase por el proxy → corre en DEMO; en Vercel se confirma LIVE + realtime).
- [ ] Review por severidad sin críticos abiertos (Art. III) — en el PR.
