// Derivaciones puras: estrategias, series, geometría SVG, mapeo de config real.

import {
  STRATEGY_COLORS,
} from '../theme';
import type {
  ConfigRow,
  Decision,
  PortfolioMeta,
  PortfolioState,
  Snapshot,
  Strategy,
  StrategyParams,
  Trade,
} from '../data/types';
import { buildLog } from './select';
import { INITIAL_BALANCE_MXN } from '../config';

export const codeFor = (idx: number): string => 'P' + (idx + 1);
export const colorFor = (idx: number): string =>
  STRATEGY_COLORS[idx % STRATEGY_COLORS.length];

// puntos "x,y ..." para un <polyline> normalizado a w×h con padding vertical.
export function poly(
  arr: number[],
  w: number,
  h: number,
  min: number,
  max: number,
  pad = 4,
): string {
  const rng = max - min || 1;
  return arr
    .map((v, i) => {
      const x = arr.length < 2 ? 0 : (i / (arr.length - 1)) * w;
      const y = h - pad - ((v - min) / rng) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

// path de área bajo una polyline (para el gradiente de equity).
export function areaFrom(pts: string, w: number, h: number): string {
  if (!pts) return '';
  return `M0,${h} L${pts.split(' ').join(' L')} L${w},${h} Z`;
}

// Downsample por stride a ~n puntos (rango TODO, D6). Conserva el último punto.
export function downsample<T>(arr: T[], n: number): T[] {
  if (arr.length <= n || n <= 0) return arr.slice();
  const step = (arr.length - 1) / (n - 1);
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.round(i * step)]);
  return out;
}

// Alinea la serie de una estrategia a una longitud objetivo tomando la cola común.
export function tail<T>(arr: T[], len: number): T[] {
  return arr.slice(Math.max(0, arr.length - len));
}

const num = (v: number | null | undefined, d = 0): number =>
  v == null || Number.isNaN(v) ? d : Number(v);

// Config REAL visible: solo params que aplican (stop_loss/target_gain null → ocultos).
export function mapParamsToConfig(p: StrategyParams): ConfigRow[] {
  const rows: ConfigRow[] = [
    { label: 'UMBRAL CONF', value: num(p.confidence_threshold).toFixed(2) },
    { label: 'MÁX / OPERACIÓN', value: num(p.max_trade_pct) + '%' },
    { label: 'COOLDOWN', value: num(p.cooldown_hours) + 'H' },
    { label: 'PISO BTC', value: num(p.btc_floor_pct) > 0 ? num(p.btc_floor_pct) + '%' : '—' },
  ];
  if (p.stop_loss_pct != null) rows.push({ label: 'STOP-LOSS', value: num(p.stop_loss_pct) + '%' });
  if (p.target_gain_pct != null) rows.push({ label: 'OBJETIVO', value: '+' + num(p.target_gain_pct) + '%' });
  return rows;
}

// Construye las estrategias derivadas a partir de las 5 fuentes.
export function buildStrategies(
  meta: PortfolioMeta[],
  states: PortfolioState[],
  decisions: Decision[],
  trades: Trade[],
  lastPrice: number,
): Strategy[] {
  const initial = INITIAL_BALANCE_MXN;
  return [...meta]
    .sort((a, b) => a.portfolio_id - b.portfolio_id)
    .map((m, idx) => {
      const st = states.find((s) => s.portfolio_id === m.portfolio_id);
      const mxn = num(st?.mxn_balance);
      const btc = num(st?.btc_balance);
      const avgBuy = num(st?.avg_cost_basis);
      const tradeCount = num(st?.total_trades);
      const btcVal = btc * lastPrice;
      const equity = mxn + btcVal;
      const pnlAbs = equity - initial;
      const pnlPct = initial > 0 ? (pnlAbs / initial) * 100 : 0;
      const exposure = equity > 0 ? (btcVal / equity) * 100 : 0;

      const asc = decisions
        .filter((d) => d.portfolio_id === m.portfolio_id)
        .sort((a, b) => a.decided_at.localeCompare(b.decided_at));
      const equitySeries = asc.map((d) => num(d.portfolio_value_at_decision, equity));
      const pnlSeries = equitySeries.map((v) => ((v - initial) / initial) * 100);
      const times = asc.map((d) => d.decided_at);

      const log = buildLog(
        decisions.filter((d) => d.portfolio_id === m.portfolio_id),
        trades,
      );

      return {
        id: m.portfolio_id,
        code: codeFor(idx),
        name: m.display_name,
        tag: m.name,
        color: colorFor(idx),
        params: m.params,
        mxn,
        btc,
        avgBuy,
        tradeCount,
        btcVal,
        equity,
        pnlAbs,
        pnlPct,
        exposure,
        equitySeries,
        pnlSeries,
        times,
        log,
      };
    });
}

// Serie de precios a partir de snapshots (asc por captured_at).
export function pricesAsc(snapshots: Snapshot[]): { prices: number[]; times: string[] } {
  const asc = [...snapshots].sort((a, b) => a.captured_at.localeCompare(b.captured_at));
  return { prices: asc.map((s) => s.price), times: asc.map((s) => s.captured_at) };
}
