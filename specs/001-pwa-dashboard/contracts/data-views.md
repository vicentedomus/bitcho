# Contract — Capa de datos (lectura Supabase)

Cliente: `@supabase/supabase-js` v2 con `SUPABASE_URL` + `ANON_KEY` públicas, schema `public` (las vistas). Solo `select`. RLS de lectura ya validado (HTTP 200 anon).

## Cargas iniciales (al montar)

| # | Vista | Query | Uso |
|---|-------|-------|-----|
| 1 | `bitcho_portfolios_meta` | `select=* order=portfolio_id.asc` | config + identidad de las 3 estrategias |
| 2 | `bitcho_portfolio` | `select=* order=portfolio_id.asc` | estado actual ×3 |
| 3 | `bitcho_snapshots` | `select=captured_at,price,change_24h,volume order=captured_at.desc limit=<=720` | serie de precio + header LIVE |
| 4 | `bitcho_decisions` | `select=* order=decided_at.desc limit=<=1200` (o por portfolio al abrir su vista) | equity/exposición histórica + log |
| 5 | `bitcho_trades` | `select=* order=executed_at.desc` | montos para entradas de log que operaron |

- **Header LIVE**: primer intento = query 3 con `limit=1`; ok → `status:LIVE` + precio/cambio reales; error → `status:DEMO` (serie embebida).
- **Límites**: acotar `limit` de decisiones/snapshots a la ventana necesaria (D6) para SC-004; "TODO" se downsamplea en cliente.
- **Alineación**: `equitySeries`/`times` por `decided_at`; la serie de precio por `captured_at`. Recorte por rango en cliente.

## Realtime (tras carga inicial)

```
supabase.channel('bitcho-dashboard')
  .on('postgres_changes', { event:'*', schema:'bitcho', table:'portfolio'  }, refetchState)
  .on('postgres_changes', { event:'*', schema:'bitcho', table:'decisions'  }, appendDecision)
  .on('postgres_changes', { event:'*', schema:'bitcho', table:'trades'     }, refetchTrades)
  .on('postgres_changes', { event:'*', schema:'bitcho', table:'snapshots'  }, appendSnapshot)
  .subscribe()
```

- Suscripción a las **tablas base** (schema `bitcho`), no a las vistas (patrón del `app.js` actual).
- **Degradación (FR-005a)**: si `subscribe` no llega a `SUBSCRIBED` (realtime no habilitado para anon), no romper — quedarse con el estado cargado; el badge sigue LIVE si la carga REST fue real. No reintentar en bucle agresivo.

## Errores / estados

- Cualquier `error` en las 5 cargas → no dejar pantalla en blanco: usar último cacheado (SW) o DEMO embebido; `status:DEMO`.
- `reasoning`/`confidence` nulos → entrada de log sin ese campo, sin romper layout.
- Contrato de "solo lectura": el cliente **nunca** hace `insert/update/delete/rpc` de escritura.
