# bitcho

Paper trading de Bitcoin con Claude AI como cerebro de decisiones. Portafolio simulado BTC/MXN vía Bitso API.

## Arquitectura

- **Fuente de verdad:** Supabase, schema `bitcho` (proyecto `BD DnD Halo`).
- **Motor:** workflow n8n que corre cada hora — lee snapshot + portfolio + trades desde Supabase, arma contexto, consulta a Claude Haiku, valida la decisión y escribe de vuelta a Supabase (snapshot siempre, trade+portfolio solo si no es HOLD).
- **Frontend:** HTML/CSS/JS estático que lee de Supabase vía `supabase-js` (anon key + RLS). Realtime para refrescar al entrar un nuevo trade.

## Tablas

- `bitcho.portfolio` — singleton con balance MXN/BTC actual.
- `bitcho.trades` — historial de operaciones BUY/SELL.
- `bitcho.snapshots` — precio/volumen capturado cada hora (append forever).
- RPC `bitcho.record_trade(...)` — transacción atómica: inserta trade + actualiza portfolio.

## Migración desde GitHub JSON (2026-04-15)

Antes, la persistencia vivía en `data/portfolio.json`, `data/trades.json` y `data/snapshots.json` commiteados al repo cada hora. Esos archivos quedan como **snapshot histórico** del estado pre-migración y ya no se actualizan. El workflow de n8n ahora escribe a Supabase.
