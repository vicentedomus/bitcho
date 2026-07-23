import { C, hexA } from '../../theme';
import { fmtMxn, tShort } from '../../lib/format';
import { poly, downsample } from '../../lib/derive';
import { INITIAL_BALANCE_MXN } from '../../config';
import type { Metric, Strategy } from '../../data/types';

const W = 340;
const H = 150;

export function CompareChart({
  strategies,
  metric,
  onMetric,
}: {
  strategies: Strategy[];
  metric: Metric;
  onMetric: (m: Metric) => void;
}) {
  const isVal = metric === 'value';
  const series = strategies.map((s) => downsample(isVal ? s.equitySeries : s.pnlSeries, 160));
  const base = isVal ? INITIAL_BALANCE_MXN : 0;
  const all = series.flat();
  const min = Math.min(...all, base);
  const max = Math.max(...all, base);
  const longest = strategies.reduce((a, b) => (b.times.length > a.times.length ? b : a), strategies[0]);
  const times = longest ? downsample(longest.times, 160) : [];

  return (
    <div style={{ marginTop: 20, background: 'linear-gradient(180deg,rgba(8,18,10,.85),rgba(3,9,5,.9))', border: `1px solid ${hexA(C.green, 0.16)}`, borderRadius: 3, padding: '13px 12px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, letterSpacing: '.13em', color: C.greenLight }}>// COMPARATIVA</span>
        <div style={{ display: 'flex', border: `1px solid ${hexA(C.green, 0.18)}`, borderRadius: 2, overflow: 'hidden' }}>
          {(['value', 'pnl'] as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => onMetric(m)}
              style={{ cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, fontWeight: 600, letterSpacing: '.06em', padding: '4px 10px', border: 'none', background: metric === m ? hexA(C.green, 0.14) : 'transparent', color: metric === m ? C.textLight : C.m3 }}
            >
              {m === 'value' ? 'MXN' : '% P&L'}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: H, display: 'block' }}>
        {[37.5, 75, 112.5].map((y) => (
          <line key={y} x1={0} y1={y} x2={W} y2={y} stroke={hexA(C.green, 0.08)} strokeWidth={1} />
        ))}
        <polyline points={poly(series[0]?.map(() => base) ?? [], W, H, min, max, 6)} fill="none" stroke="rgba(120,150,130,.25)" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        {series.map((s, i) => (
          <polyline key={i} points={poly(s, W, H, min, max, 6)} fill="none" stroke={strategies[i].color} strokeWidth={1.7} vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 3px ${hexA(strategies[i].color, 0.5)})` }} />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.m5, letterSpacing: '.06em', marginTop: 4 }}>
        <span>{isVal ? fmtMxn(min) : min.toFixed(1) + '%'}</span>
        <span>{times.length ? tShort(times[Math.floor(times.length / 2)]).split(',')[0] : ''}</span>
        <span>{isVal ? fmtMxn(max) : '+' + max.toFixed(1) + '%'}</span>
      </div>
    </div>
  );
}
