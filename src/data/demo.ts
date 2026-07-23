// Fallback DEMO (cold-start sin red): serie de precios real embebida + las 3
// estrategias con sus nombres/params reales, equity plano. Nunca pantalla en blanco.

import raw from '../../data/snapshots.json';
import { INITIAL_BALANCE_MXN } from '../config';
import { STRATEGY_COLORS } from '../theme';
import type { DashboardData, PortfolioMeta, Strategy, StrategyParams } from './types';

type RawSnap = { timestamp: string; price: number; change_24?: number; volume?: number };

const p = (o: Partial<StrategyParams>): StrategyParams => ({
  confidence_threshold: 0.5,
  max_trade_pct: 25,
  cooldown_hours: 4,
  btc_floor_pct: 0,
  stop_loss_pct: null,
  target_gain_pct: null,
  ...o,
});

// Config real conocida de las 3 estrategias del backend (para el modo offline).
export const DEMO_META: PortfolioMeta[] = [
  { portfolio_id: 1, name: 'control', display_name: 'Control (actual)', is_active: true, params: p({}), prompt_overrides: null, created_at: '' },
  { portfolio_id: 2, name: 'hodl_biased', display_name: 'HODL-biased', is_active: true, params: p({ btc_floor_pct: 70, confidence_threshold: 0.8, max_trade_pct: 30 }), prompt_overrides: null, created_at: '' },
  { portfolio_id: 3, name: 'low_frequency', display_name: 'Low-frequency', is_active: true, params: p({ stop_loss_pct: -1.5, target_gain_pct: 2, cooldown_hours: 24, confidence_threshold: 0.7, max_trade_pct: 30 }), prompt_overrides: null, created_at: '' },
];

export function demoData(): DashboardData {
  const snaps = (raw as RawSnap[]).slice(-72);
  const prices = snaps.map((s) => s.price);
  const times = snaps.map((s) => s.timestamp);
  const current = prices[prices.length - 1] ?? 0;

  const strategies: Strategy[] = DEMO_META.map((m, idx) => ({
    id: m.portfolio_id,
    code: 'P' + (idx + 1),
    name: m.display_name,
    tag: m.name,
    color: STRATEGY_COLORS[idx],
    params: m.params,
    mxn: INITIAL_BALANCE_MXN,
    btc: 0,
    avgBuy: 0,
    tradeCount: 0,
    btcVal: 0,
    equity: INITIAL_BALANCE_MXN,
    pnlAbs: 0,
    pnlPct: 0,
    exposure: 0,
    equitySeries: prices.map(() => INITIAL_BALANCE_MXN),
    pnlSeries: prices.map(() => 0),
    times,
    log: [],
  }));

  return {
    strategies,
    prices,
    times,
    current,
    change: snaps.length ? Number(snaps[snaps.length - 1].change_24 ?? 0) : 0,
    vol: snaps.length ? Number(snaps[snaps.length - 1].volume ?? 0) : 0,
    syncAt: times[times.length - 1] ?? null,
    status: 'DEMO',
  };
}
