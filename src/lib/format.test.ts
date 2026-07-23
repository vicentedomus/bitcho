import { describe, it, expect } from 'vitest';
import { fmtMxn, fmtMxn2, fmtPct, fmtBtc } from './format';

describe('format', () => {
  it('fmtMxn: sin decimales, separador de miles', () => {
    expect(fmtMxn(1144950)).toBe('$1,144,950');
    expect(fmtMxn(0)).toBe('$0');
  });

  it('fmtMxn2: dos decimales', () => {
    expect(fmtMxn2(10072.95)).toBe('$10,072.95');
    expect(fmtMxn2(2)).toBe('$2.00');
  });

  it('fmtPct: signo explícito y 2 decimales', () => {
    expect(fmtPct(0.3)).toBe('+0.30%');
    expect(fmtPct(-1.23)).toBe('-1.23%');
    expect(fmtPct(0)).toBe('+0.00%');
  });

  it('fmtBtc: 8 decimales', () => {
    expect(fmtBtc(0.00000158)).toBe('0.00000158');
    expect(fmtBtc(0)).toBe('0.00000000');
  });
});
