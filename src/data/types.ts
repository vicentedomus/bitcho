// Tipos raw (espejan las 5 vistas públicas) + derivados (los consume la UI).

export type StrategyParams = {
  confidence_threshold: number;
  max_trade_pct: number;
  cooldown_hours: number;
  btc_floor_pct: number;
  stop_loss_pct: number | null;
  target_gain_pct: number | null;
};

export type PortfolioMeta = {
  portfolio_id: number;
  name: string;
  display_name: string;
  is_active: boolean;
  params: StrategyParams;
  prompt_overrides: string | null;
  created_at: string;
};

export type PortfolioState = {
  portfolio_id: number;
  mxn_balance: number;
  btc_balance: number;
  total_trades: number;
  initial_investment: number;
  avg_cost_basis: number;
  updated_at: string;
};

export type Action = 'BUY' | 'SELL' | 'HOLD';

export type Decision = {
  id: number;
  portfolio_id: number;
  decided_at: string;
  action: Action;
  confidence: number | null;
  reasoning: string | null;
  price_at_decision: number | null;
  portfolio_value_at_decision: number | null;
  btc_exposure_pct: number | null;
  resulted_in_trade: boolean;
  trade_id: number | null;
};

export type Trade = {
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

export type Snapshot = {
  captured_at: string;
  price: number;
  change_24h: number | null;
  volume: number | null;
};

// ---- derivados ----

export type DecisionEntry = {
  action: Action;
  time: string;
  price: number;
  confidence: number;
  reason: string;
  amountBtc?: number;
  amountMxn?: number;
  isHold: boolean;
};

export type Strategy = {
  id: number;
  code: string; // P1|P2|P3
  name: string; // display_name real
  tag: string; // name real (control|hodl_biased|low_frequency)
  color: string;
  params: StrategyParams;
  mxn: number;
  btc: number;
  avgBuy: number;
  tradeCount: number;
  btcVal: number;
  equity: number;
  pnlAbs: number;
  pnlPct: number;
  exposure: number;
  equitySeries: number[];
  pnlSeries: number[];
  times: string[];
  log: DecisionEntry[];
};

export type ConfigRow = { label: string; value: string };

export type Status = 'LIVE' | 'DEMO';

export type Tab = 'resumen' | number;
export type Metric = 'value' | 'pnl';
export type Range = '24H' | '48H' | 'ALL';
export type Filter = 'ALL' | Action;

export type DashboardData = {
  strategies: Strategy[];
  prices: number[];
  times: string[];
  current: number;
  change: number;
  vol: number;
  syncAt: string | null;
  status: Status;
};
