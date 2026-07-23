import { C, hexA } from '../../theme';
import { mapParamsToConfig } from '../../lib/derive';
import type { Strategy } from '../../data/types';

// Config REAL de la estrategia (reemplaza el panel de "pesos" ficticio del handoff).
export function ConfigPanel({ s }: { s: Strategy }) {
  const rows = mapParamsToConfig(s.params);
  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${hexA(C.green, 0.1)}` }}>
      <div style={{ fontSize: 9, letterSpacing: '.1em', color: C.m4, marginBottom: 8 }}>CONFIG REAL · {s.tag}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10 }}>
            <span style={{ flex: 1, color: C.m1, letterSpacing: '.05em' }}>{r.label}</span>
            <span style={{ color: s.color, fontWeight: 600, textAlign: 'right' }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
