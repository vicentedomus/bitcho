import { useEffect, useState } from 'react';
import { C, FONT, FRAME_BG, hexA } from './theme';
import { useDashboardData } from './data/useDashboardData';
import { StatusBar } from './components/StatusBar';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { Footer } from './components/Footer';
import { Scanlines } from './components/Scanlines';
import { PortfolioCard } from './components/resumen/PortfolioCard';
import { CompareChart } from './components/resumen/CompareChart';
import { CompareLegend } from './components/resumen/CompareLegend';
import { StatePanel } from './components/strategy/StatePanel';
import { ConfigPanel } from './components/strategy/ConfigPanel';
import { BehaviorChart } from './components/strategy/BehaviorChart';
import { DecisionLog } from './components/strategy/DecisionLog';
import type { Filter, Metric, Range, Tab } from './data/types';

const KEYFRAMES = `
@keyframes blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
@keyframes livepulse { 0%,100% { opacity: 1; box-shadow: 0 0 6px rgba(51,255,119,.9); } 50% { opacity: .35; box-shadow: 0 0 2px rgba(51,255,119,.4); } }
@keyframes flick { 0%,95%,100% { opacity: 1; } 97% { opacity: .82; } }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #000; }
::-webkit-scrollbar { width: 0; height: 0; }
`;

const clockNow = () =>
  new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

export default function App() {
  const { data } = useDashboardData();
  const [tab, setTab] = useState<Tab>('resumen');
  const [metric, setMetric] = useState<Metric>('value');
  const [range, setRange] = useState<Range>('ALL');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [clock, setClock] = useState(clockNow());

  useEffect(() => {
    const t = setInterval(() => setClock(clockNow()), 20_000);
    return () => clearInterval(t);
  }, []);

  const selectTab = (t: Tab) => {
    setTab(t);
    setFilter('ALL');
  };

  return (
    <div style={{ minHeight: '100vh', background: FRAME_BG, display: 'flex', justifyContent: 'center' }}>
      <style>{KEYFRAMES}</style>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 430,
          minHeight: '100vh',
          background: 'linear-gradient(180deg,#020603,#000)',
          borderLeft: `1px solid ${hexA(C.green, 0.1)}`,
          borderRight: `1px solid ${hexA(C.green, 0.1)}`,
          overflow: 'hidden',
          animation: 'flick 8s infinite',
          color: C.textBase,
          fontFamily: FONT,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <Scanlines />
        <StatusBar clock={clock} />

        {!data ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.m3, fontSize: 12 }}>Cargando…</div>
        ) : (
          <>
            <Header data={data} />
            <Tabs strategies={data.strategies} tab={tab} onSelect={selectTab} />

            {tab === 'resumen' ? (
              <div style={{ padding: '16px 14px 40px' }}>
                <div style={{ fontSize: 11, letterSpacing: '.14em', color: C.m4, marginBottom: 12 }}>
                  // ESTADO DE PORTAFOLIOS · <span style={{ color: C.greenLight }}>{data.strategies.length} ACTIVOS</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.strategies.map((s) => (
                    <PortfolioCard key={s.id} s={s} onClick={() => selectTab(s.id)} />
                  ))}
                </div>
                <CompareChart strategies={data.strategies} metric={metric} onMetric={setMetric} />
                <CompareLegend strategies={data.strategies} />
                <div style={{ fontSize: 9, color: C.m6, letterSpacing: '.08em', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
                  MISMO MERCADO · MISMO CEREBRO · CONFIGS DISTINTAS
                  <br />
                  SERIE DE PRECIOS REAL BITSO BTC_MXN
                </div>
              </div>
            ) : (
              (() => {
                const s = data.strategies.find((x) => x.id === tab);
                if (!s) return null;
                return (
                  <div style={{ padding: '16px 14px 44px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', color: s.color, border: `1px solid ${hexA(s.color, 0.4)}`, padding: '2px 7px', borderRadius: 2 }}>{s.code}</span>
                      <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '.04em', color: C.textLight, textShadow: `0 0 8px ${hexA(s.color, 0.5)}` }}>{s.name}</span>
                      <span style={{ fontSize: 9, letterSpacing: '.1em', color: C.m4 }}>{s.tag}</span>
                    </div>
                    <StatePanel s={s}>
                      <ConfigPanel s={s} />
                    </StatePanel>
                    <BehaviorChart s={s} prices={data.prices} times={data.times} range={range} onRange={setRange} />
                    <DecisionLog s={s} filter={filter} onFilter={setFilter} />
                  </div>
                );
              })()
            )}

            <Footer status={data.status} />
          </>
        )}
      </div>
    </div>
  );
}
