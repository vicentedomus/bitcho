# Phase 1 — Data Model: Bitcho PWA Dashboard

Solo lectura. Los tipos "raw" espejan las 5 vistas públicas; los "derived" son lo que consume la UI. Nada se escribe.

## Raw (filas de las vistas, schema `public`)

### `bitcho_portfolios_meta` (3 filas)
```ts
type PortfolioMeta = {
  portfolio_id: number;          // 1|2|3
  name: string;                  // 'control' | 'hodl_biased' | 'low_frequency'
  display_name: string;          // 'Control (actual)' | 'HODL-biased' | 'Low-frequency'
  is_active: boolean;
  params: StrategyParams;        // jsonb (ver abajo)
  prompt_overrides: string | null;
  created_at: string;            // ISO
};
type StrategyParams = {
  confidence_threshold: number;  // 0..1
  max_trade_pct: number;         // % del portafolio por operación
  cooldown_hours: number;
  btc_floor_pct: number;         // piso de BTC (0 = sin piso)
  stop_loss_pct: number | null;  // negativo (ej -1.5) o null (no aplica)
  target_gain_pct: number | null;// ej 2 o null
};
```

### `bitcho_portfolio` (3 filas, estado actual)
```ts
type PortfolioState = {
  portfolio_id: number;
  mxn_balance: number;
  btc_balance: number;
  total_trades: number;
  initial_investment: number;    // 10000
  avg_cost_basis: number;        // 0 si sin BTC
  updated_at: string;
};
```

### `bitcho_decisions` (~2900 filas, log horario)
```ts
type Decision = {
  id: number;
  portfolio_id: number;
  decided_at: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number | null;             // 0..1
  reasoning: string | null;
  price_at_decision: number | null;
  portfolio_value_at_decision: number | null; // ← serie de EQUITY horaria (100% poblada)
  btc_exposure_pct: number | null;             // serie de exposición
  mxn_balance: number | null;
  btc_balance: number | null;
  cooldown_active: boolean | null;
  resulted_in_trade: boolean;
  trade_id: number | null;
};
```

### `bitcho_trades` (65 filas, operaciones)
```ts
type Trade = {
  id: number;
  portfolio_id: number;
  executed_at: string;
  action: 'BUY' | 'SELL';
  price: number;
  mxn_amount: number;
  btc_amount: number;
  fee_mxn: number;
  confidence: number;
  reasoning: string | null;
  portfolio_value_after: number | null;
};
```

### `bitcho_snapshots` (~1400 filas, serie de precio común)
```ts
type Snapshot = {
  id: number;
  captured_at: string;
  price: number;
  bid: number | null; ask: number | null; volume: number | null;
  change_24h: number | null; vwap: number | null;
  high_24h: number | null; low_24h: number | null;
};
```

## Derived (lo que consume la UI)

```ts
// Identidad visual por estrategia (color del handoff, por índice, NO por nombre inventado)
const STRATEGY_COLORS = ['#22d3ee', '#33ff77', '#ffb000']; // P1, P2, P3 (por portfolio_id 1,2,3)

type Strategy = {
  id: number;                    // portfolio_id
  code: string;                  // 'P1'|'P2'|'P3' (derivado del orden)
  name: string;                  // display_name real
  tag: string;                   // 'control'|'hodl_biased'|'low_frequency' (name real)
  color: string;                 // STRATEGY_COLORS[idx]
  params: StrategyParams;
  // estado
  mxn: number; btc: number; avgBuy: number; tradeCount: number;
  lastPrice: number;             // último snapshot
  btcVal: number;                // btc*lastPrice
  equity: number;                // mxn+btcVal
  pnlAbs: number; pnlPct: number;// vs initial_investment
  exposure: number;              // % (btcVal/equity) o del último decision
  // series (alineadas por decided_at, recortadas por rango)
  equitySeries: number[];        // portfolio_value_at_decision
  pnlSeries: number[];           // (equity-10000)/10000*100
  times: string[];               // decided_at
  // log
  log: DecisionEntry[];          // ordenado desc
};

type DecisionEntry = {
  action: 'BUY'|'SELL'|'HOLD';
  time: string; price: number;
  confidence: number; reason: string;
  amountBtc?: number; amountMxn?: number; // si resulted_in_trade (join a trade)
  isHold: boolean;
};

// Config visible por estrategia: solo los params que aplican (stop_loss/target_gain null → se ocultan)
type ConfigRow = { label: string; value: string };
```

## Reglas de derivación (funciones puras, testeadas TDD)

- **equity/P&L**: `equity = mxn + btc*lastPrice`; `pnlPct = (equity - initial)/initial*100`. Serie histórica = `portfolio_value_at_decision`.
- **exposición**: `exposure% = btcVal/equity*100`; para el estado actual y como serie desde `btc_exposure_pct`.
- **avgBuy**: `avg_cost_basis`; si `btc == 0` o `avg==0` → mostrar `N/A`.
- **code/color**: por posición ordenada de `portfolio_id` (1→P1/cyan, 2→P2/verde, 3→P3/ámbar). **No** se renombran las estrategias.
- **config visible**: mapear `params` → filas legibles; ocultar `stop_loss_pct`/`target_gain_pct` cuando son `null`; `btc_floor_pct==0` se puede mostrar como "—".
- **monto en log**: si `resulted_in_trade`, unir `trade_id`→`bitcho_trades` para `btc_amount` (BUY) o `mxn_amount` (SELL).
- **rango**: 24H/48H = últimos 24/48 puntos; TODO = downsample por stride a ~N (D6).
- **filtros de log**: contar por acción; `ALL/BUY/SELL/HOLD`.

## Estado de UI (raíz)

```ts
type UIState = {
  tab: 'resumen' | 1 | 2 | 3;              // portfolio_id o resumen
  metric: 'value' | 'pnl';                  // toggle comparativa
  range: '24H' | '48H' | 'ALL';
  filter: 'ALL' | 'BUY' | 'SELL' | 'HOLD';
  status: 'LIVE' | 'DEMO';
  clock: string;
};
```
