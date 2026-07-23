import { C, hexA } from '../theme';
import type { Strategy, Tab } from '../data/types';

export function Tabs({
  strategies,
  tab,
  onSelect,
}: {
  strategies: Strategy[];
  tab: Tab;
  onSelect: (t: Tab) => void;
}) {
  const items: { id: Tab; label: string; dot: string }[] = [
    { id: 'resumen', label: 'RESUMEN', dot: C.green },
    ...strategies.map((s) => ({ id: s.id as Tab, label: s.code, dot: s.color })),
  ];

  return (
    <div style={{ display: 'flex', gap: 6, padding: '11px 12px', borderBottom: `1px solid ${hexA(C.green, 0.1)}`, overflowX: 'auto' }}>
      {items.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={String(t.id)}
            onClick={() => onSelect(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flex: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.08em',
              padding: '7px 12px',
              borderRadius: 2,
              border: `1px solid ${active ? t.dot : hexA(C.green, 0.14)}`,
              background: active ? hexA(C.green, 0.06) : 'transparent',
              color: active ? C.textLight : C.m3,
              textShadow: active ? `0 0 6px ${t.dot}` : 'none',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.dot, boxShadow: `0 0 5px ${t.dot}` }} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
