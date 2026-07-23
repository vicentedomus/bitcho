import type { ReactNode } from 'react';
import { C, hexA, PANEL_BG } from '../../theme';
import { fmtBtc, fmtMxn, fmtMxn2, fmtPct } from '../../lib/format';
import type { Strategy } from '../../data/types';

export function StatePanel({ s, children }: { s: Strategy; children?: ReactNode }) {
  const stats: { label: string; value: string; color: string }[] = [
    { label: 'MXN DISPONIBLE', value: fmtMxn2(s.mxn), color: C.textLight },
    { label: 'BTC EN MANO', value: fmtBtc(s.btc), color: C.textLight },
    { label: 'VALOR BTC', value: fmtMxn(s.btcVal), color: C.textLight },
    { label: 'P&L', value: fmtMxn(s.pnlAbs), color: s.pnlAbs >= 0 ? C.green : C.red },
    { label: 'AVG COMPRA', value: s.avgBuy > 0 ? fmtMxn(s.avgBuy) : 'N/A', color: C.m1 },
    { label: 'OPS EJECUTADAS', value: String(s.tradeCount), color: s.color },
  ];
  return (
    <div style={{ background: PANEL_BG, border: `1px solid ${hexA(C.green, 0.16)}`, borderRadius: 3, padding: '14px 13px' }}>
      <div style={{ fontSize: 10, letterSpacing: '.14em', color: C.m4, marginBottom: 12 }}>// ESTADO ACTUAL</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: C.textLight, textShadow: `0 0 10px ${hexA(s.color, 0.5)}` }}>{fmtMxn(s.equity)}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: s.pnlPct >= 0 ? C.green : C.red }}>{fmtPct(s.pnlPct)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 10px' }}>
        {stats.map((st) => (
          <div key={st.label}>
            <div style={{ fontSize: 9, letterSpacing: '.1em', color: C.m4 }}>{st.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: st.color, marginTop: 2 }}>{st.value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, letterSpacing: '.1em', color: C.m4, marginBottom: 4 }}>
          <span>EXPOSICIÓN BTC</span>
          <span style={{ color: s.color }}>{s.exposure.toFixed(0)}%</span>
        </div>
        <div style={{ height: 6, background: hexA(C.green, 0.08), borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, s.exposure).toFixed(0)}%`, background: s.color, boxShadow: `0 0 6px ${s.color}`, borderRadius: 2 }} />
        </div>
      </div>
      {children}
    </div>
  );
}
