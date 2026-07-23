import { describe, it, expect } from 'vitest';
import {
  codeFor,
  colorFor,
  poly,
  areaFrom,
  downsample,
  tail,
  mapParamsToConfig,
  buildStrategies,
} from './derive';
import { STRATEGY_COLORS } from '../theme';
import type { Decision, PortfolioMeta, PortfolioState, StrategyParams } from '../data/types';

const params = (o: Partial<StrategyParams> = {}): StrategyParams => ({
  confidence_threshold: 0.5,
  max_trade_pct: 25,
  cooldown_hours: 4,
  btc_floor_pct: 0,
  stop_loss_pct: null,
  target_gain_pct: null,
  ...o,
});

describe('code/color por posición', () => {
  it('P1/P2/P3 con los colores del handoff', () => {
    expect(codeFor(0)).toBe('P1');
    expect(codeFor(2)).toBe('P3');
    expect(colorFor(0)).toBe(STRATEGY_COLORS[0]);
    expect(colorFor(2)).toBe(STRATEGY_COLORS[2]);
  });
});

describe('geometría SVG', () => {
  it('poly normaliza al alto invirtiendo el eje Y', () => {
    const pts = poly([0, 10], 100, 40, 0, 10, 0);
    expect(pts).toBe('0.0,40.0 100.0,0.0'); // min abajo, max arriba
  });
  it('areaFrom cierra el path al piso', () => {
    const a = areaFrom('0.0,40.0 100.0,0.0', 100, 40);
    expect(a.startsWith('M0,40')).toBe(true);
    expect(a.endsWith('L100,40 Z')).toBe(true);
  });
});

describe('downsample / tail', () => {
  it('downsample reduce a n conservando extremos', () => {
    const ds = downsample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
    expect(ds.length).toBe(3);
    expect(ds[0]).toBe(0);
    expect(ds[2]).toBe(9);
  });
  it('downsample no toca si ya es corto', () => {
    expect(downsample([1, 2], 5)).toEqual([1, 2]);
  });
  it('tail toma la cola', () => {
    expect(tail([1, 2, 3, 4], 2)).toEqual([3, 4]);
  });
});

describe('mapParamsToConfig (config real)', () => {
  it('oculta stop_loss/target_gain cuando son null', () => {
    const rows = mapParamsToConfig(params());
    const labels = rows.map((r) => r.label);
    expect(labels).toContain('UMBRAL CONF');
    expect(labels).not.toContain('STOP-LOSS');
    expect(labels).not.toContain('OBJETIVO');
  });
  it('muestra stop_loss/target_gain cuando aplican', () => {
    const rows = mapParamsToConfig(params({ stop_loss_pct: -1.5, target_gain_pct: 2, btc_floor_pct: 70 }));
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));
    expect(byLabel['STOP-LOSS']).toBe('-1.5%');
    expect(byLabel['OBJETIVO']).toBe('+2%');
    expect(byLabel['PISO BTC']).toBe('70%');
  });
});

describe('buildStrategies', () => {
  const meta: PortfolioMeta[] = [
    { portfolio_id: 2, name: 'hodl_biased', display_name: 'HODL-biased', is_active: true, params: params(), prompt_overrides: null, created_at: '' },
    { portfolio_id: 1, name: 'control', display_name: 'Control (actual)', is_active: true, params: params(), prompt_overrides: null, created_at: '' },
  ];
  const states: PortfolioState[] = [
    { portfolio_id: 1, mxn_balance: 6000, btc_balance: 0, total_trades: 58, initial_investment: 10000, avg_cost_basis: 0, updated_at: '' },
    { portfolio_id: 2, mxn_balance: 4000, btc_balance: 0.005, total_trades: 3, initial_investment: 10000, avg_cost_basis: 1300000, updated_at: '' },
  ];
  const decisions: Decision[] = [
    { id: 1, portfolio_id: 1, decided_at: '2026-07-01T00:00:00Z', action: 'HOLD', confidence: 0.3, reasoning: 'r', price_at_decision: 1000000, portfolio_value_at_decision: 10000, btc_exposure_pct: 0, resulted_in_trade: false, trade_id: null },
    { id: 2, portfolio_id: 1, decided_at: '2026-07-01T01:00:00Z', action: 'HOLD', confidence: 0.3, reasoning: 'r', price_at_decision: 1000000, portfolio_value_at_decision: 10050, btc_exposure_pct: 0, resulted_in_trade: false, trade_id: null },
  ];

  it('ordena por portfolio_id y asigna code/color/nombre real', () => {
    const s = buildStrategies(meta, states, decisions, [], 1200000);
    expect(s.map((x) => x.id)).toEqual([1, 2]);
    expect(s[0].code).toBe('P1');
    expect(s[0].name).toBe('Control (actual)');
    expect(s[0].tag).toBe('control');
  });

  it('deriva equity/pnl/exposición del estado + último precio', () => {
    const s = buildStrategies(meta, states, decisions, [], 1200000);
    const p2 = s.find((x) => x.id === 2)!;
    // equity = 4000 + 0.005*1200000 = 10000
    expect(p2.equity).toBeCloseTo(10000, 5);
    expect(p2.pnlPct).toBeCloseTo(0, 5);
    expect(p2.exposure).toBeCloseTo(60, 5); // 6000/10000
  });

  it('serie de equity desde portfolio_value_at_decision', () => {
    const s = buildStrategies(meta, states, decisions, [], 1200000);
    const p1 = s.find((x) => x.id === 1)!;
    expect(p1.equitySeries).toEqual([10000, 10050]);
  });
});
