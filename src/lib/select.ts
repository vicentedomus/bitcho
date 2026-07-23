// Selección/derivación de log y recortes por rango (funciones puras).

import type { Decision, DecisionEntry, Filter, Range, Trade } from '../data/types';
import { downsample, tail } from './derive';

// Log de decisiones → entradas de UI, ordenado desc, con monto si operó.
export function buildLog(decisions: Decision[], trades: Trade[]): DecisionEntry[] {
  const byId = new Map(trades.map((t) => [t.id, t]));
  return [...decisions]
    .sort((a, b) => b.decided_at.localeCompare(a.decided_at))
    .map((d) => {
      const t = d.trade_id != null ? byId.get(d.trade_id) : undefined;
      const entry: DecisionEntry = {
        action: d.action,
        time: d.decided_at,
        price: Number(d.price_at_decision ?? 0),
        confidence: Number(d.confidence ?? 0),
        reason: d.reasoning ?? '',
        isHold: d.action === 'HOLD',
      };
      if (t) {
        if (t.action === 'BUY') entry.amountBtc = Number(t.btc_amount);
        else entry.amountMxn = Number(t.mxn_amount);
      }
      return entry;
    });
}

export function filterLog(log: DecisionEntry[], filter: Filter): DecisionEntry[] {
  return filter === 'ALL' ? log : log.filter((e) => e.action === filter);
}

export function counts(log: DecisionEntry[]): Record<Filter, number> {
  return {
    ALL: log.length,
    BUY: log.filter((e) => e.action === 'BUY').length,
    SELL: log.filter((e) => e.action === 'SELL').length,
    HOLD: log.filter((e) => e.action === 'HOLD').length,
  };
}

// Recorta series equity+precio+tiempos por rango. 24H/48H = cola; ALL = downsample.
export function sliceByRange(
  equity: number[],
  prices: number[],
  times: string[],
  range: Range,
  target = 160,
): { equity: number[]; prices: number[]; times: string[] } {
  const n = equity.length;
  if (range === '24H') return cut(equity, prices, times, tailN(n, 24));
  if (range === '48H') return cut(equity, prices, times, tailN(n, 48));
  return {
    equity: downsample(equity, target),
    prices: downsample(prices, target),
    times: downsample(times, target),
  };
}

function tailN(n: number, k: number): number {
  return Math.min(n, k);
}
function cut(equity: number[], prices: number[], times: string[], k: number) {
  return { equity: tail(equity, k), prices: tail(prices, k), times: tail(times, k) };
}
