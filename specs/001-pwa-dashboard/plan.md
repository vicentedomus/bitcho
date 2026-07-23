# Implementation Plan: Bitcho PWA Dashboard

**Branch**: `claude/bitcho-frontend-pwa-fzkupc` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-pwa-dashboard/spec.md`

## Summary

Dashboard móvil de **solo lectura** que recrea la estética terminal-CRT del handoff sobre **datos reales** de las 3 estrategias de paper-trading (Control / HODL-biased / Low-frequency), leídas de 5 vistas públicas de Supabase con anon key. SPA React + Vite + TypeScript, PWA (manifest + service worker network-first + version.json), desplegada en Vercel. Carga inicial + realtime; fallback offline a último dato cacheado y, en cold-start sin red, a una serie embebida (badge DEMO). Reemplaza el frontend vanilla actual. No toca backend ni n8n.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18

**Primary Dependencies**: Vite 6 (`@vitejs/plugin-react`), `@supabase/supabase-js` v2. Cero librería de charts (SVG a mano, como el handoff). Cero router (4 vistas por estado, sin URLs).

**Storage**: Ninguno propio. Lectura de Supabase (proyecto `dwmzchtqjcblupmmklcl`, schema `bitcho`) vía 5 vistas públicas en `public`: `bitcho_portfolios_meta`, `bitcho_portfolio`, `bitcho_decisions`, `bitcho_trades`, `bitcho_snapshots`. Anon key pública + RLS de solo lectura (validado HTTP 200).

**Testing**: Vitest + jsdom + `@testing-library/react` (unit: formatters, derivaciones, mapeo de params, reducers de vista). Playwright con config iPhone (E2E smoke de las 4 vistas + LIVE/DEMO). TDD obligatorio (Constitución Art. I).

**Target Platform**: Navegadores móviles modernos (iOS Safari / Android Chrome). Instalable como PWA. Sin experiencia desktop dedicada.

**Project Type**: Single project — SPA frontend estática (build Vite → estáticos servidos por Vercel).

**Performance Goals**: Primera pantalla con datos reales < 3s en conexión móvil típica (SC-004). SVG fluidos; rango "TODO" acotado/downsampleado para no dibujar ~1150 puntos crudos (FR-010).

**Constraints**: 100% móvil, columna `max-width: 430px`. Offline-capable (SW network-first + fallback DEMO). Solo lectura. Sin secretos en cliente (solo anon key pública, ya en el repo).

**Scale/Scope**: 3 estrategias, 4 vistas, 1 usuario primario (observador). Datos: 5 vistas, ~2900 decisiones / ~1400 snapshots hoy, creciendo 3/hora.

## Constitution Check

*GATE: Debe pasar antes de Phase 0. Re-check tras Phase 1.*

| Artículo | Aplicación en este plan | Estado |
|---|---|---|
| **I. TDD (NON-NEGOTIABLE)** | Cada formatter (`fmtMxn/fmtPct/fmtBtc`), cada derivación (equity/exposición/P&L, downsample, mapeo de `params`→config visible, filtros de log) y cada reducer de vista se escribe test-first (Vitest). RED→GREEN→REFACTOR. | ✅ Diseñado para testeo unitario puro (funciones sin efectos). |
| **II. Verificación antes de completar** | El build corre en Vercel y se verifica la app en navegador (Playwright iPhone: LIVE con datos reales + DEMO forzando fallo de red) antes de cerrar. | ✅ Plan incluye smoke E2E + preview de Vercel. |
| **III. Code review por severidad** | Review antes de merge del PR #3; críticos bloquean. | ✅ Gate en el PR. |
| **IV. Simplicidad (YAGNI)** | Sin router, sin lib de charts, sin state manager, sin design-system externo. React + hooks + SVG + supabase-js. La capa de datos es lectura directa de vistas ya existentes. | ✅ Sin violaciones (ver Complexity Tracking: vacío). |

**Divergencia consciente vs. questkeep/domus-hub**: aquellos usan React *por islas* (strangler-fig sobre apps vanilla grandes). Bitcho no tiene app legacy que preservar y el handoff pide "100% React" → **SPA completa** es la opción *más simple* aquí (Art. IV), no una complejidad extra. Se conservan las demás convenciones de la casa (Vite, TS, PWA network-first + version.json, Vitest + Playwright iPhone, nombres de asset sin hash).

## Project Structure

### Documentation (this feature)

```text
specs/001-pwa-dashboard/
├── plan.md              # Este archivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 (contratos de lectura + contrato UI por vista)
│   ├── data-views.md
│   └── ui-views.md
└── tasks.md             # Phase 2 (/speckit-tasks — NO lo crea este comando)
```

### Source Code (repository root)

```text
index.html                 # Entry de Vite (reemplaza el index.html vanilla)
src/
├── main.tsx               # Monta <App/>
├── App.tsx                # Estado raíz (tab/metric/range/filter/status/clock) + layout CRT
├── config.ts              # SUPABASE_URL + ANON_KEY (migrado de config.js) + constantes
├── theme.ts               # Design tokens del handoff (colores, sombras, fuente)
├── data/
│   ├── supabase.ts        # createClient(anon) — schema public (vistas)
│   ├── types.ts           # Tipos de las 5 vistas + tipos derivados (Strategy, DecisionEntry…)
│   ├── useDashboardData.ts# Carga inicial de las 5 vistas + suscripción realtime
│   └── demo.ts            # Serie embebida (de data/snapshots.json) para cold-start DEMO
├── lib/
│   ├── format.ts          # fmtMxn/fmtMxn2/fmtPct/fmtBtc/tShort
│   ├── derive.ts          # equity/exposición/P&L, downsample, sparkline/poly/area, mapeo params→config
│   └── select.ts          # slices por rango, filtros de log, conteos
├── components/
│   ├── StatusBar.tsx  Header.tsx  Tabs.tsx  Footer.tsx  Scanlines.tsx
│   ├── resumen/  PortfolioCard.tsx  CompareChart.tsx  CompareLegend.tsx
│   └── strategy/ StatePanel.tsx  ConfigPanel.tsx  BehaviorChart.tsx  DecisionLog.tsx
└── (tests co-ubicados: *.test.ts / *.test.tsx)

public/
├── manifest.json          # PWA
├── sw.js                  # Service worker network-first + fallback + version.json check
├── icons/                 # icon-192 / icon-512 (marca CRT)
└── (version.json lo emite el build)

tests/e2e/                 # Playwright iPhone: smoke de las 4 vistas + LIVE/DEMO
data/snapshots.json        # se conserva: fuente de la serie DEMO embebida (import en build)

vite.config.ts  tsconfig.json  vercel.json  package.json  playwright.iphone.config.ts
```

Se **eliminan** (reemplazados por la SPA): `app.js`, `style.css`, el `index.html` vanilla, `config.js` (migra a `src/config.ts`). Se **conservan** como referencia de backend (no los sirve el frontend): `n8n-code-nodes.js`, `trading-prompt.md`, `trading-rules.json`, `README.md`, `data/*.json`.

**Structure Decision**: Single-project SPA. Todo bajo `src/` con componentes por vista, capa `data/` (Supabase + realtime + demo) y `lib/` de funciones puras (el corazón testeable TDD). PWA en `public/`. E2E en `tests/e2e/`.

## Complexity Tracking

> Sin violaciones a la Constitución. No hay complejidad que justificar (sin router, sin libs de estado/charts, sin backend nuevo).

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
