import { describe, it, expect } from 'vitest';
import { buildLog, filterLog, counts, sliceByRange } from './select';
import type { Decision, Trade } from '../data/types';

const dec = (o: Partial<Decision>): Decision => ({
  id: 0,
  portfolio_id: 1,
  decided_at: '2026-07-01T00:00:00Z',
  action: 'HOLD',
  confidence: 0.3,
  reasoning: 'sin señal',
  price_at_decision: 1000000,
  portfolio_value_at_decision: 10000,
  btc_exposure_pct: 0,
  resulted_in_trade: false,
  trade_id: null,
  ...o,
});

describe('buildLog', () => {
  const trades: Trade[] = [
    { id: 7, portfolio_id: 1, executed_at: '', action: 'BUY', price: 1000000, mxn_amount: 500, btc_amount: 0.000497, fee_mxn: 2.5, confidence: 0.7, reasoning: null, portfolio_value_after: null },
  ];
  const decisions: Decision[] = [
    dec({ id: 1, decided_at: '2026-07-01T00:00:00Z', action: 'HOLD' }),
    dec({ id: 2, decided_at: '2026-07-01T02:00:00Z', action: 'BUY', resulted_in_trade: true, trade_id: 7 }),
    dec({ id: 3, decided_at: '2026-07-01T01:00:00Z', action: 'HOLD' }),
  ];

  it('ordena de más reciente a más antigua', () => {
    const log = buildLog(decisions, trades);
    expect(log.map((e) => e.time)).toEqual([
      '2026-07-01T02:00:00Z',
      '2026-07-01T01:00:00Z',
      '2026-07-01T00:00:00Z',
    ]);
  });

  it('une el monto del trade en BUY', () => {
    const log = buildLog(decisions, trades);
    const buy = log.find((e) => e.action === 'BUY')!;
    expect(buy.amountBtc).toBeCloseTo(0.000497, 6);
    expect(buy.isHold).toBe(false);
  });

  it('marca HOLD', () => {
    const log = buildLog(decisions, trades);
    expect(log.filter((e) => e.isHold).length).toBe(2);
  });
});

describe('filterLog / counts', () => {
  const log = buildLog(
    [
      dec({ id: 1, action: 'HOLD' }),
      dec({ id: 2, action: 'BUY' }),
      dec({ id: 3, action: 'SELL' }),
      dec({ id: 4, action: 'HOLD' }),
    ],
    [],
  );
  it('conteos por acción', () => {
    const c = counts(log);
    expect(c).toEqual({ ALL: 4, BUY: 1, SELL: 1, HOLD: 2 });
  });
  it('filtra por acción', () => {
    expect(filterLog(log, 'HOLD').length).toBe(2);
    expect(filterLog(log, 'ALL').length).toBe(4);
  });
});

describe('sliceByRange', () => {
  const eq = Array.from({ length: 100 }, (_, i) => i);
  const pr = Array.from({ length: 100 }, (_, i) => 1000 + i);
  const tm = Array.from({ length: 100 }, (_, i) => String(i));
  it('24H toma los últimos 24', () => {
    const r = sliceByRange(eq, pr, tm, '24H');
    expect(r.equity.length).toBe(24);
    expect(r.equity[23]).toBe(99);
  });
  it('ALL downsamplea al target', () => {
    const r = sliceByRange(eq, pr, tm, 'ALL', 20);
    expect(r.equity.length).toBe(20);
    expect(r.equity[19]).toBe(99);
  });
});
