import { C, hexA, PANEL_BG } from '../../theme';
import { tShort } from '../../lib/format';
import { poly, areaFrom } from '../../lib/derive';
import { sliceByRange } from '../../lib/select';
import type { Range, Strategy } from '../../data/types';

const W = 340;
const H = 140;

export function BehaviorChart({
  s,
  prices,
  times,
  range,
  onRange,
}: {
  s: Strategy;
  prices: number[];
  times: string[];
  range: Range;
  onRange: (r: Range) => void;
}) {
  // Alinea equity de la estrategia con la serie de precio por cola común.
  const n = Math.min(s.equitySeries.length, prices.length);
  const eqAll = s.equitySeries.slice(s.equitySeries.length - n);
  const prAll = prices.slice(prices.length - n);
  const tmAll = (s.times.length >= n ? s.times : times).slice(-n);
  const cut = sliceByRange(eqAll, prAll, tmAll, range);

  const eqMin = Math.min(...cut.equity), eqMax = Math.max(...cut.equity);
  const prMin = Math.min(...cut.prices), prMax = Math.max(...cut.prices);
  const line = poly(cut.equity, W, H, eqMin, eqMax, 6);
  const uid = `apfill-${s.id}`;

  return (
    <div style={{ marginTop: 14, background: PANEL_BG, border: `1px solid ${hexA(C.green, 0.16)}`, borderRadius: 3, padding: '13px 12px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 10, letterSpacing: '.13em', color: C.greenLight }}>// COMPORTAMIENTO</span>
        <div style={{ display: 'flex', border: `1px solid ${hexA(C.green, 0.18)}`, borderRadius: 2, overflow: 'hidden' }}>
          {(['24H', '48H', 'ALL'] as Range[]).map((r) => (
            <button key={r} onClick={() => onRange(r)} style={{ cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, fontWeight: 600, padding: '4px 9px', border: 'none', background: range === r ? hexA(C.green, 0.14) : 'transparent', color: range === r ? C.textLight : C.m3 }}>
              {r === 'ALL' ? 'TODO' : r}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: H, display: 'block' }}>
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={s.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {[35, 70, 105].map((y) => (
          <line key={y} x1={0} y1={y} x2={W} y2={y} stroke={hexA(C.green, 0.07)} strokeWidth={1} />
        ))}
        <polyline points={poly(cut.prices, W, H, prMin, prMax, 6)} fill="none" stroke="rgba(120,150,130,.3)" strokeWidth={1} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
        <path d={areaFrom(line, W, H)} fill={`url(#${uid})`} />
        <polyline points={line} fill="none" stroke={s.color} strokeWidth={1.9} vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 3px ${s.color})` }} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.m5, marginTop: 4 }}>
        <span>{cut.times.length ? tShort(cut.times[0]).split(',')[0] : ''}</span>
        <span style={{ color: C.m1 }}>
          EQUITY · <span style={{ color: s.color }}>━</span>&nbsp;&nbsp;PRECIO BTC · <span style={{ color: C.m1 }}>┄</span>
        </span>
        <span>{cut.times.length ? tShort(cut.times[cut.times.length - 1]).split(',')[0] : ''}</span>
      </div>
    </div>
  );
}
