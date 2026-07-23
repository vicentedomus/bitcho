import { C, hexA } from '../theme';
import { fmtMxn, hhmm } from '../lib/format';
import type { DashboardData } from '../data/types';

export function Header({ data }: { data: DashboardData }) {
  const live = data.status === 'LIVE';
  const statusColor = live ? C.green : C.amber;
  const statusBorder = live ? hexA(C.green, 0.4) : hexA(C.amber, 0.4);
  const up = data.change >= 0;

  return (
    <div style={{ padding: '6px 16px 12px', borderBottom: `1px solid ${hexA(C.green, 0.14)}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '.04em', color: C.green, textShadow: `0 0 10px ${hexA(C.green, 0.55)}` }}>
            BITCHO
          </span>
          <span style={{ fontSize: 14, color: C.green, animation: 'blink 1.1s step-end infinite' }}>_</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 9px', border: `1px solid ${statusBorder}`, borderRadius: 2 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, animation: 'livepulse 1.6s infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.12em', color: statusColor }}>{data.status}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 600, color: C.textLight, textShadow: `0 0 8px ${hexA(C.green, 0.3)}` }}>
            {fmtMxn(data.current)}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: up ? C.green : C.red }}>
            {(up ? '▲ ' : '▼ ') + fmtMxn(Math.abs(data.change))}
          </span>
        </div>
        <div style={{ textAlign: 'right', fontSize: 9, letterSpacing: '.1em', color: C.m5, lineHeight: 1.5 }}>
          <div>SYNC {data.syncAt ? hhmm(data.syncAt) : '--:--'}</div>
          <div>VOL 24H · {data.vol.toFixed(2)}₿</div>
        </div>
      </div>
    </div>
  );
}
