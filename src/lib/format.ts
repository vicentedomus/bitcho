// Formatters (funciones puras). Formato del handoff: MXN en en-US, BTC 8 dec, % con signo.

export const fmtMxn = (n: number): string =>
  '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

export const fmtMxn2 = (n: number): string =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtPct = (n: number): string =>
  (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%';

export const fmtBtc = (n: number): string => Number(n).toFixed(8);

export const tShort = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Solo la hora (para SYNC del header).
export const hhmm = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
