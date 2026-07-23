---
description: "Task list — Bitcho PWA Dashboard"
---

# Tasks: Bitcho PWA Dashboard

**Input**: Design documents from `specs/001-pwa-dashboard/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: INCLUIDOS — la Constitución (Art. I, TDD NON-NEGOTIABLE) los exige. Las funciones puras de `lib/` y las derivaciones de datos se escriben test-first (RED→GREEN→REFACTOR).

**Organization**: por user story. MVP = US1 (RESUMEN). Cada story es un incremento entregable e independientemente testeable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable (archivo distinto, sin dependencias pendientes).
- Rutas exactas incluidas. Single-project SPA (`src/`, `tests/`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar el proyecto Vite + React + TS y la configuración base.

- [x] T001 Inicializar `package.json` con React 18 + Vite 6 + TypeScript + `@supabase/supabase-js` v2 (deps) y `@vitejs/plugin-react`, `vitest`, `jsdom`, `@testing-library/react`, `@playwright/test` (devDeps); scripts `dev/build/preview/test:unit/typecheck/test:mobile` en `package.json`.
- [x] T002 [P] Crear `tsconfig.json` (target ESNext, jsx react-jsx, strict) en la raíz.
- [x] T003 [P] Crear `vite.config.ts` (plugin react, build `dist`, define NODE_ENV production, config de vitest: jsdom + setup) en la raíz.
- [x] T004 [P] Crear `playwright.iphone.config.ts` (device iPhone, baseURL preview) en la raíz.
- [x] T005 Reemplazar `index.html` vanilla por el entry de Vite (mount `#root`, meta viewport móvil, link JetBrains Mono) en la raíz.
- [x] T006 Migrar `config.js` → `src/config.ts` (export `SUPABASE_URL`, `ANON_KEY`, `SUPABASE_PROJECT`, `INITIAL_BALANCE_MXN`, límites de query); borrar `app.js`, `style.css`, `config.js` vanilla.
- [x] T007 [P] Añadir a `.gitignore` los artefactos de build (`dist/`, `node_modules/`, `version.json`, `test-results/`, `playwright-report/`).

**Checkpoint**: `npm install` + `npm run dev` levanta un shell vacío en móvil.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tokens, cliente de datos, tipos, formatters y el marco global (header/tabs/footer + LIVE/DEMO). Bloquea todas las stories.

**⚠️ CRITICAL**: ninguna story empieza hasta cerrar esta fase.

- [x] T008 [P] Crear `src/theme.ts` con los design tokens del handoff (colores, sombras/glow, gradientes, fuente, radios) desde spec §Design Tokens.
- [x] T009 [P] Crear `src/data/types.ts` con los tipos raw de las 5 vistas + `StrategyParams` + tipos derivados (`Strategy`, `DecisionEntry`, `ConfigRow`, `UIState`) desde data-model.md.
- [x] T010 [P] Escribir tests de `src/lib/format.test.ts` (fmtMxn, fmtMxn2, fmtPct signo, fmtBtc 8 dec, tShort) — RED.
- [x] T011 [P] Implementar `src/lib/format.ts` hasta pasar T010 — GREEN.
- [x] T012 Crear `src/data/supabase.ts` (`createClient(SUPABASE_URL, ANON_KEY)`, schema public, solo lectura).
- [x] T013 [P] Crear `src/data/demo.ts` importando `data/snapshots.json` como serie de precios embebida para DEMO cold-start.
- [x] T014 Implementar `src/data/useDashboardData.ts`: carga inicial de las 5 vistas (contracts/data-views.md), estado `LIVE/DEMO`, suscripción realtime a tablas base con degradación con gracia (FR-005a), y fallback a demo. 
- [x] T015 [P] Crear marco global en `src/components/`: `StatusBar.tsx`, `Header.tsx` (wordmark + cursor blink + pill LIVE/DEMO + precio + SYNC/VOL), `Tabs.tsx` (RESUMEN·P1·P2·P3), `Footer.tsx`, `Scanlines.tsx`.
- [x] T016 Crear `src/App.tsx` (estado raíz `UIState`, consume `useDashboardData`, layout columna 430px + viñeta, ruteo por `tab`) y `src/main.tsx` (monta `<App/>`).

**Checkpoint**: la app carga datos reales, muestra header con precio + LIVE/DEMO y las 4 tabs navegan (contenido vacío aún).

---

## Phase 3: User Story 1 — RESUMEN de las 3 estrategias (Priority: P1) 🎯 MVP

**Goal**: Ver de un vistazo precio + estado de las 3 estrategias reales (card por estrategia con total, %P&L, exposición, ops, sparkline).

**Independent Test**: cargar con datos reales → 3 cards con nombre real, total, %P&L coloreado y sparkline; header con precio + LIVE; tap navega al detalle.

- [x] T017 [P] [US1] Tests `src/lib/derive.test.ts` para las derivaciones de estrategia: `equity`, `pnlAbs/pnlPct`, `exposure`, `avgBuy→N/A`, `code/color por portfolio_id`, `sparkline/poly` — RED.
- [x] T018 [US1] Implementar en `src/lib/derive.ts` esas derivaciones + helper `poly`/sparkline hasta pasar T017 — GREEN.
- [x] T019 [P] [US1] Test `src/components/resumen/PortfolioCard.test.tsx` (nombre real, %P&L color por signo, exposición, ops, sparkline SVG, onClick) — RED.
- [x] T020 [US1] Implementar `src/components/resumen/PortfolioCard.tsx` hasta pasar T019 — GREEN.
- [x] T021 [US1] Ensamblar la vista RESUMEN en `src/App.tsx` (título `// ESTADO DE PORTAFOLIOS · N ACTIVOS` + columna de 3 `PortfolioCard`, tap → `tab=portfolio_id`).

**Checkpoint**: MVP entregable — RESUMEN con cards reales + header LIVE, navegación a tabs.

---

## Phase 4: User Story 2 — Comparativa en el tiempo (Priority: P2)

**Goal**: Gráfica comparativa de las 3 series + toggle MXN/%P&L + leyenda.

**Independent Test**: con series reales, 3 líneas de color + baseline; toggle recomputa series, ejes y leyenda.

- [x] T022 [P] [US2] Tests en `src/lib/derive.test.ts` para `alignSeries` (por decided_at, recorte a rango común) y `downsample` (stride a ~N) — RED.
- [x] T023 [US2] Implementar `alignSeries` + `downsample` en `src/lib/derive.ts` hasta pasar T022 — GREEN.
- [x] T024 [P] [US2] Test `src/components/resumen/CompareChart.test.tsx` (3 polylines, baseline, ejes min/mid/max, cambia con metric) — RED.
- [x] T025 [US2] Implementar `src/components/resumen/CompareChart.tsx` + `CompareLegend.tsx` hasta pasar T024 — GREEN.
- [x] T026 [US2] Integrar panel COMPARATIVA + toggle `metric` (MXN/%P&L) en la vista RESUMEN de `src/App.tsx`.

**Checkpoint**: RESUMEN completo (cards + comparativa).

---

## Phase 5: User Story 3 — Detalle y config real de una estrategia (Priority: P2)

**Goal**: Vista por estrategia: estado actual, config real (params), gráfica equity-vs-precio con rango.

**Independent Test**: cada tab P1/P2/P3 muestra stats reales, params reales (oculta null), gráfica responde a 24H/48H/TODO.

- [x] T027 [P] [US3] Test `src/lib/derive.test.ts` para `mapParamsToConfig` (umbral, máx/op, cooldown, piso BTC; oculta stop_loss/target_gain null) y `sliceByRange` (24/48/ALL) + `areaFrom` — RED.
- [x] T028 [US3] Implementar `mapParamsToConfig`, `sliceByRange`, `areaFrom` en `src/lib/derive.ts`/`src/lib/select.ts` hasta pasar T027 — GREEN.
- [x] T029 [P] [US3] Test `src/components/strategy/StatePanel.test.tsx` (6 stats + barra exposición, avgBuy N/A) — RED.
- [x] T030 [US3] Implementar `src/components/strategy/StatePanel.tsx` hasta pasar T029 — GREEN.
- [x] T031 [P] [US3] Test `src/components/strategy/ConfigPanel.test.tsx` (solo params aplicables, valores en color de estrategia) — RED.
- [x] T032 [US3] Implementar `src/components/strategy/ConfigPanel.tsx` hasta pasar T031 — GREEN.
- [x] T033 [P] [US3] Test `src/components/strategy/BehaviorChart.test.tsx` (línea precio punteada + área+línea equity, cambia con rango) — RED.
- [x] T034 [US3] Implementar `src/components/strategy/BehaviorChart.tsx` hasta pasar T033 — GREEN.
- [x] T035 [US3] Ensamblar la vista de estrategia en `src/App.tsx` (header de vista + StatePanel + ConfigPanel + BehaviorChart + toggle de rango).

**Checkpoint**: vistas de estrategia con estado, config real y comportamiento.

---

## Phase 6: User Story 4 — Log de decisiones (Priority: P3)

**Goal**: Log horario BUY/SELL/HOLD con razonamiento, confianza, monto y filtros con conteos.

**Independent Test**: log desc con HOLD atenuado, chips filtran, conteos correctos, monto en trades.

- [x] T036 [P] [US4] Test `src/lib/select.test.ts` para `buildLog` (join decision→trade por trade_id para monto), `filterLog` y `counts` por acción — RED.
- [x] T037 [US4] Implementar `buildLog`, `filterLog`, `counts` en `src/lib/select.ts` hasta pasar T036 — GREEN.
- [x] T038 [P] [US4] Test `src/components/strategy/DecisionLog.test.tsx` (orden desc, HOLD atenuado, color por acción, barra CONF, chips con conteo, monto) — RED.
- [x] T039 [US4] Implementar `src/components/strategy/DecisionLog.tsx` hasta pasar T038 — GREEN.
- [x] T040 [US4] Integrar `DecisionLog` + filtro `filter` en la vista de estrategia de `src/App.tsx`.

**Checkpoint**: las 4 vistas completas con datos reales.

---

## Phase 7: Polish & Cross-Cutting (PWA, deploy, E2E, verificación)

**Purpose**: PWA, Vercel, E2E y verificación end-to-end (Art. II).

- [x] T041 [P] Crear `public/manifest.json` (name, short_name, display standalone, theme/background `#000`/verde, start_url) y `public/icons/` (icon-192/512 marca CRT).
- [x] T042 Crear `public/sw.js` (network-first navegación+datos, precache app shell, chequeo de `version.json`) y registrarlo en `src/main.tsx`.
- [x] T043 [P] Crear `vercel.json` (buildCommand vite build + emisión `version.json`, outputDirectory `dist`, headers CSP con connect-src al host de Supabase https+wss, no-cache para index/sw/version, immutable para icons).
- [x] T044 [P] E2E `tests/e2e/dashboard.spec.ts` (Playwright iPhone): escenarios 1–3 de quickstart (LIVE, detalle+config, log+filtros).
- [x] T045 [P] E2E `tests/e2e/offline.spec.ts`: escenario 4 (setOffline tras carga → DEMO, sin pantalla en blanco).
- [x] T046 Verificación end-to-end (Art. II): `npm run test:unit` + `typecheck` + `test:mobile` en verde; build + preview; anotar evidencia en quickstart DoD.
- [x] T047 [P] Actualizar `README.md` (sección Frontend: nueva SPA React + PWA + comando de deploy Vercel; el simulador ya no aplica).
- [x] T048 Verificar realtime anon en el preview (si no habilitado, confirmar degradación con gracia FR-005a); documentar hallazgo.

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2)** → stories.
- **US1 (P3, T017–T021)**: depende de Foundational. **MVP.**
- **US2 (P4)**: depende de Foundational + `derive` de US1 (reusa poly/equity).
- **US3 (P5)**: depende de Foundational; independiente de US2.
- **US4 (P6)**: depende de Foundational + vista de estrategia (US3) para alojar el log.
- **Polish (P7)**: tras las stories que se quieran entregar (PWA/deploy pueden empezar en paralelo una vez hay app montada).

### Paralelizables (ejemplos)

- Setup: T002/T003/T004/T007 en paralelo tras T001.
- Foundational: T008/T009/T010/T013/T015 en paralelo; T011 tras T010; T014/T016 tras T012.
- Cada story: los tests `[P]` (T017/T019, T024, T029/T031/T033, T036/T038) se escriben antes que su impl.
- Polish: T041/T043/T044/T045/T047 en paralelo.

## Implementation Strategy

1. **MVP**: Setup + Foundational + **US1** → dashboard con las 3 estrategias reales y header LIVE, desplegable.
2. **Incremento 2**: US2 (comparativa) → RESUMEN completo.
3. **Incremento 3**: US3 (detalle + config real).
4. **Incremento 4**: US4 (log de decisiones).
5. **Polish**: PWA + Vercel + E2E + verificación en cada incremento entregable.

**Total: 48 tareas** — US1: 5 · US2: 5 · US3: 9 · US4: 5 · Setup: 7 · Foundational: 9 · Polish: 8.
