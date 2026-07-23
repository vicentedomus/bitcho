import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PortfolioCard } from './PortfolioCard';
import type { Strategy } from '../../data/types';

const strat = (o: Partial<Strategy> = {}): Strategy => ({
  id: 1,
  code: 'P1',
  name: 'Control (actual)',
  tag: 'control',
  color: '#22d3ee',
  params: { confidence_threshold: 0.5, max_trade_pct: 25, cooldown_hours: 4, btc_floor_pct: 0, stop_loss_pct: null, target_gain_pct: null },
  mxn: 6000,
  btc: 0,
  avgBuy: 0,
  tradeCount: 58,
  btcVal: 0,
  equity: 10030,
  pnlAbs: 30,
  pnlPct: 0.3,
  exposure: 0,
  equitySeries: [10000, 10030],
  pnlSeries: [0, 0.3],
  times: ['a', 'b'],
  log: [],
  ...o,
});

describe('PortfolioCard', () => {
  it('muestra nombre real, code, tag, ops y equity', () => {
    render(<PortfolioCard s={strat()} onClick={() => {}} />);
    expect(screen.getByText('Control (actual)')).toBeInTheDocument();
    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.getByText(/control · EXP 0% · 58 OPS/)).toBeInTheDocument();
    expect(screen.getByText('$10,030')).toBeInTheDocument();
    expect(screen.getByText('+0.30%')).toBeInTheDocument();
  });

  it('P&L en rojo cuando es negativo', () => {
    render(<PortfolioCard s={strat({ pnlPct: -1.23 })} onClick={() => {}} />);
    const pnl = screen.getByText('-1.23%');
    expect(pnl).toHaveStyle({ color: '#ff5f56' });
  });

  it('dispara onClick', () => {
    const fn = vi.fn();
    render(<PortfolioCard s={strat()} onClick={fn} />);
    fireEvent.click(screen.getByLabelText('Control (actual)'));
    expect(fn).toHaveBeenCalledOnce();
  });
});
