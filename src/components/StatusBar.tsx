import { C } from '../theme';

export function StatusBar({ clock }: { clock: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 16px 6px',
        fontSize: 11,
        letterSpacing: '.06em',
        color: C.m4,
      }}
    >
      <span style={{ fontWeight: 600 }}>{clock}</span>
      <span style={{ letterSpacing: '.22em', color: C.m6 }}>B I T C H O · O S</span>
      <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ letterSpacing: '-.05em' }}>▂▄▆</span>
        <span>◧</span>
      </span>
    </div>
  );
}
