import { C, hexA } from '../../theme';
import { fmtMxn, fmtPct } from '../../lib/format';
import { poly } from '../../lib/derive';
import type { Strategy } from '../../data/types';

export function PortfolioCard({ s, onClick }: { s: Strategy; onClick: () => void }) {
  const up = s.pnlPct >= 0;
  const spark = poly(s.pnlSeries, 92, 40, Math.min(...s.pnlSeries, 0), Math.max(...s.pnlSeries, 0), 4);
  return (
    <button
      onClick={onClick}
      aria-label={s.name}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        background: 'linear-gradient(180deg,rgba(8,18,10,.9),rgba(3,9,5,.9))',
        border: `1px solid ${hexA(s.color, 0.35)}`,
        borderLeft: `3px solid ${s.color}`,
        borderRadius: 3,
        padding: '12px 13px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: 'inherit',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.06em', color: s.color, border: `1px solid ${hexA(s.color, 0.35)}`, padding: '1px 5px', borderRadius: 2 }}>
            {s.code}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.04em', color: C.textLight }}>{s.name}</span>
        </div>
        <div style={{ fontSize: 9, letterSpacing: '.1em', color: C.m4, marginTop: 4 }}>
          {s.tag} · EXP {s.exposure.toFixed(0)}% · {s.tradeCount} OPS
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 7 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: C.textLight }}>{fmtMxn(s.equity)}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: up ? C.green : C.red }}>{fmtPct(s.pnlPct)}</span>
        </div>
      </div>
      <svg viewBox="0 0 92 40" preserveAspectRatio="none" style={{ width: 92, height: 40, flex: 'none' }}>
        <polyline points={spark} fill="none" stroke={s.color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 3px ${s.color})` }} />
      </svg>
      <span style={{ fontSize: 16, color: s.color, flex: 'none' }}>›</span>
    </button>
  );
}
