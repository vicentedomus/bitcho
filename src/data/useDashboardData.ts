import { useEffect, useState } from 'react';
import { sb } from './supabase';
import { demoData } from './demo';
import { buildStrategies, pricesAsc } from '../lib/derive';
import { DECISION_LIMIT, SNAPSHOT_LIMIT, SUPABASE_SCHEMA } from '../config';
import type {
  DashboardData,
  Decision,
  PortfolioMeta,
  PortfolioState,
  Snapshot,
  Trade,
} from './types';

async function fetchAll(): Promise<DashboardData> {
  const [meta, states, snaps, decisions, trades] = await Promise.all([
    sb.from('bitcho_portfolios_meta').select('*').order('portfolio_id', { ascending: true }),
    sb.from('bitcho_portfolio').select('*').order('portfolio_id', { ascending: true }),
    sb.from('bitcho_snapshots').select('captured_at,price,change_24h,volume').order('captured_at', { ascending: false }).limit(SNAPSHOT_LIMIT),
    sb.from('bitcho_decisions').select('id,portfolio_id,decided_at,action,confidence,reasoning,price_at_decision,portfolio_value_at_decision,btc_exposure_pct,resulted_in_trade,trade_id').order('decided_at', { ascending: false }).limit(DECISION_LIMIT),
    sb.from('bitcho_trades').select('*').order('executed_at', { ascending: false }),
  ]);

  const err = meta.error || states.error || snaps.error || decisions.error || trades.error;
  if (err) throw err;

  const { prices, times } = pricesAsc((snaps.data ?? []) as Snapshot[]);
  const current = prices[prices.length - 1] ?? 0;
  const last = (snaps.data ?? [])[0] as Snapshot | undefined;
  const strategies = buildStrategies(
    (meta.data ?? []) as PortfolioMeta[],
    (states.data ?? []) as PortfolioState[],
    (decisions.data ?? []) as Decision[],
    (trades.data ?? []) as Trade[],
    current,
  );

  return {
    strategies,
    prices,
    times,
    current,
    change: Number(last?.change_24h ?? 0),
    vol: Number(last?.volume ?? 0),
    syncAt: last?.captured_at ?? null,
    status: 'LIVE',
  };
}

// Falla rápido a DEMO si la red no responde a tiempo (FR-005): nunca "Cargando…"
// indefinido. Ventana generosa para conexión móvil pero acotada (SC-004).
const LOAD_TIMEOUT_MS = 4000;
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export function useDashboardData(): { data: DashboardData | null } {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      withTimeout(fetchAll(), LOAD_TIMEOUT_MS)
        .then((d) => alive && setData(d))
        .catch(() => alive && setData((prev) => prev ?? demoData()));
    load();

    // Realtime sobre las tablas base; degrada con gracia si no conecta (FR-005a).
    const ch = sb.channel('bitcho-dashboard');
    for (const table of ['portfolio', 'decisions', 'trades', 'snapshots']) {
      ch.on('postgres_changes', { event: '*', schema: SUPABASE_SCHEMA, table }, load);
    }
    ch.subscribe();

    return () => {
      alive = false;
      sb.removeChannel(ch);
    };
  }, []);

  return { data };
}
