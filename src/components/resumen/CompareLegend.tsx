import { C, hexA } from '../../theme';
import { fmtMxn, fmtPct } from '../../lib/format';
import type { Strategy } from '../../data/types';

export function CompareLegend({ strategies }: { strategies: Strategy[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 11, paddingTop: 10, borderTop: `1px solid ${hexA(C.green, 0.1)}` }}>
      {strategies.map((s) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span style={{ width: 14, height: 2, background: s.color, boxShadow: `0 0 4px ${s.color}`, flex: 'none' }} />
          <span style={{ color: '#cfe', fontWeight: 600, flex: 'none', width: 92 }}>{s.code}·{s.name.slice(0, 8)}</span>
          <span style={{ color: C.m1, flex: 1 }}>{fmtMxn(s.equity)}</span>
          <span style={{ color: s.pnlPct >= 0 ? C.green : C.red, fontWeight: 600 }}>{fmtPct(s.pnlPct)}</span>
        </div>
      ))}
    </div>
  );
}
