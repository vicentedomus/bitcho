import { C, hexA } from '../../theme';
import { fmtBtc, fmtMxn, tShort } from '../../lib/format';
import { counts, filterLog } from '../../lib/select';
import type { Filter, Strategy } from '../../data/types';

const ACCENT: Record<string, string> = { BUY: C.green, SELL: C.red, HOLD: C.m3 };

export function DecisionLog({
  s,
  filter,
  onFilter,
}: {
  s: Strategy;
  filter: Filter;
  onFilter: (f: Filter) => void;
}) {
  const c = counts(s.log);
  const view = filterLog(s.log, filter);
  const chips: { id: Filter; label: string }[] = [
    { id: 'ALL', label: 'TODAS' },
    { id: 'BUY', label: 'BUY' },
    { id: 'SELL', label: 'SELL' },
    { id: 'HOLD', label: 'HOLD' },
  ];

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, letterSpacing: '.13em', color: C.greenLight }}>// LOG DE DECISIONES</span>
        <span style={{ fontSize: 9, color: C.m4 }}>{c[filter]} / HORA</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 11, overflowX: 'auto' }}>
        {chips.map((f) => {
          const active = filter === f.id;
          const fc = f.id === 'BUY' ? C.green : f.id === 'SELL' ? C.red : f.id === 'HOLD' ? C.m1 : s.color;
          return (
            <button key={f.id} onClick={() => onFilter(f.id)} style={{ cursor: 'pointer', flex: 'none', fontFamily: 'inherit', fontSize: 9.5, fontWeight: 600, letterSpacing: '.06em', padding: '5px 10px', borderRadius: 2, border: `1px solid ${active ? fc : hexA(C.green, 0.14)}`, background: active ? hexA(fc, 0.1) : 'transparent', color: active ? C.textLight : C.m3 }}>
              {f.label} <span style={{ opacity: 0.6 }}>{c[f.id]}</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {view.map((e, i) => {
          const accent = ACCENT[e.action];
          const amount = e.amountBtc != null ? '+' + fmtBtc(e.amountBtc) + '₿' : e.amountMxn != null ? '+' + fmtMxn(e.amountMxn) : '';
          return (
            <div key={i} style={{ background: e.isHold ? 'rgba(8,14,9,.55)' : 'linear-gradient(180deg,rgba(10,20,12,.9),rgba(4,10,6,.9))', border: `1px solid ${e.isHold ? hexA(C.green, 0.08) : hexA(accent, 0.22)}`, borderLeft: `3px solid ${accent}`, borderRadius: 3, padding: '9px 11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: accent, width: 38 }}>{e.action}</span>
                  <span style={{ fontSize: 10, color: C.m3 }}>{tShort(e.time)}</span>
                </div>
                <span style={{ fontSize: 10, color: C.m1 }}>{fmtMxn(e.price)}</span>
              </div>
              {e.reason && (
                <div style={{ fontSize: 10.5, lineHeight: 1.5, color: e.isHold ? C.m2 : C.textBase, marginTop: 6 }}>{e.reason}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 8.5, letterSpacing: '.08em', color: C.m4, flex: 'none' }}>CONF</span>
                <div style={{ flex: 1, height: 4, background: hexA(C.green, 0.08), borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${(e.confidence * 100).toFixed(0)}%`, background: accent, boxShadow: `0 0 5px ${accent}` }} />
                </div>
                <span style={{ fontSize: 9, color: accent, fontWeight: 600, flex: 'none' }}>{e.confidence.toFixed(2)}</span>
                {amount && (
                  <span style={{ fontSize: 9, color: C.m1, flex: 'none', borderLeft: `1px solid ${hexA(C.green, 0.14)}`, paddingLeft: 8 }}>{amount}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
