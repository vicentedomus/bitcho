import { C, hexA } from '../theme';
import type { Status } from '../data/types';

export function Footer({ status }: { status: Status }) {
  const note =
    status === 'LIVE'
      ? 'CONECTADO EN VIVO · datos desde Supabase'
      : 'MODO DEMO · último dato cacheado / serie embebida';
  return (
    <div style={{ padding: 16, borderTop: `1px solid ${hexA(C.green, 0.1)}`, textAlign: 'center', fontSize: 9, letterSpacing: '.1em', color: C.m6, lineHeight: 1.7 }}>
      BITCHO · FUENTE DE VERDAD: SUPABASE <span style={{ color: C.m4 }}>bitcho</span> SCHEMA
      <br />
      {note}
    </div>
  );
}
