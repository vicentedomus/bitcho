// Design tokens del handoff terminal-CRT (spec §Design Tokens). Fuente única de verdad
// del look. Estilos inline (como el prototipo) para cero setup de CSS.

export const C = {
  bg: '#000',
  green: '#33ff77',
  greenLight: '#7dffab',
  textLight: '#e7ffef',
  textBase: '#b9f5c4',
  cyan: '#22d3ee',
  amber: '#ffb000',
  red: '#ff5f56',
  m1: '#8fbf9c',
  m2: '#6f9c7c',
  m3: '#5c8a68',
  m4: '#4e7d5a',
  m5: '#3f6349',
  m6: '#2f5a3c',
} as const;

// Color por estrategia, por posición (portfolio_id 1→P1 cyan, 2→P2 verde, 3→P3 ámbar).
export const STRATEGY_COLORS = [C.cyan, C.green, C.amber] as const;

export const FONT =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export const FRAME_BG =
  'radial-gradient(120% 80% at 50% -10%, #071a0d 0%, #020603 55%, #000 100%)';
export const PANEL_BG =
  'linear-gradient(180deg,rgba(8,18,10,.85),rgba(3,9,5,.9))';
export const PANEL_BORDER = 'rgba(51,255,119,.16)';
export const GRID = 'rgba(51,255,119,.08)';

// rgba desde hex + alpha
export function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
