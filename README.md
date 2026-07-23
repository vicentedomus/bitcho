# bitcho

Paper trading de Bitcoin con Claude AI como cerebro de decisiones. Portafolio simulado BTC/MXN vía Bitso API.

## Arquitectura

- **Fuente de verdad:** Supabase, schema `bitcho` (proyecto `BD DnD Halo`).
- **Motor:** workflow n8n que corre cada hora — lee snapshot + portfolio + trades desde Supabase, arma contexto, consulta a Claude Haiku, valida la decisión y escribe de vuelta a Supabase (snapshot siempre, trade+portfolio solo si no es HOLD).
- **Frontend:** PWA **React + Vite + TypeScript** (SPA móvil, estética terminal-CRT) que lee de Supabase vía `supabase-js` (anon key + RLS) sobre las 5 vistas públicas `bitcho_*`. Carga inicial + realtime; fallback LIVE→DEMO. Desplegado en Vercel.

## Frontend (PWA)

Dashboard móvil de **solo lectura** de las **3 estrategias** que corren en simultáneo (Control · HODL-biased · Low-frequency) con sus nombres y parámetros reales. Vistas: RESUMEN (comparativa de las 3) y detalle por estrategia (estado, config real, comportamiento equity-vs-precio, log de decisiones BUY/SELL/HOLD).

```bash
npm install
npm run dev          # desarrollo (Vite)
npm run build        # build de producción → dist/ (+ version.json)
npm run test:unit    # Vitest (formatters, derivaciones, selección)
npm run typecheck    # tsc --noEmit
npm run test:mobile  # Playwright (emulación iPhone sobre Chromium)
```

- **Datos:** lee las vistas `bitcho_portfolios_meta`, `bitcho_portfolio`, `bitcho_decisions`, `bitcho_trades`, `bitcho_snapshots`. La serie de equity histórica sale de `decisions.portfolio_value_at_decision`.
- **PWA:** `public/manifest.json` + `public/sw.js` (network-first, offline last-cached) + `version.json` para el aviso de versión nueva.
- **Deploy:** Vercel (`vercel.json`: build Vite, CSP con `connect-src` al Supabase de bitcho).
- **Estructura:** `src/lib/` (funciones puras, testeadas TDD), `src/data/` (cliente Supabase + hook realtime + fallback DEMO), `src/components/` (por vista). Diseño en `specs/001-pwa-dashboard/` (flujo spec-kit).

## Tablas

- `bitcho.portfolios_meta` — config por estrategia (params, nombre, activo).
- `bitcho.portfolio` — estado (MXN/BTC) por estrategia (`portfolio_id`).
- `bitcho.trades` — historial de operaciones BUY/SELL (con `portfolio_id`).
- `bitcho.decisions` — decisión horaria BUY/SELL/**HOLD** por estrategia (con razonamiento, confianza, equity y exposición al momento).
- `bitcho.snapshots` — precio/volumen capturado cada hora (append forever).
- RPC `bitcho.record_trade(...)` — transacción atómica: inserta trade + actualiza portfolio.

## Migración desde GitHub JSON (2026-04-15)

Antes, la persistencia vivía en `data/portfolio.json`, `data/trades.json` y `data/snapshots.json` commiteados al repo cada hora. Esos archivos quedan como **snapshot histórico** del estado pre-migración y ya no se actualizan. El workflow de n8n ahora escribe a Supabase.
