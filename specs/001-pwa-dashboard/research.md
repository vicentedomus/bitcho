# Phase 0 — Research: Bitcho PWA Dashboard

Todas las incógnitas de Technical Context resueltas. No quedan `NEEDS CLARIFICATION`.

## D1. Arquitectura frontend — SPA React completa

- **Decision**: SPA React 18 + Vite + TypeScript montada en un `index.html` único. Sin router (4 vistas por estado `tab`).
- **Rationale**: El handoff pide "100% React"; bitcho no tiene app vanilla grande que preservar. La SPA es la opción *más simple* (Art. IV) — el patrón "islas" de questkeep/domus-hub existe para migrar apps legacy, que aquí no hay. Un router es innecesario para 4 vistas sin deep-linking requerido.
- **Alternatives**: React por islas (rechazado: complejidad sin beneficio, no hay legacy). Next.js (rechazado: SSR/routing innecesarios para un dashboard estático leído por anon key).

## D2. Gráficas — SVG a mano, sin librería

- **Decision**: Polylines/paths SVG generados por funciones puras (`poly`, `areaFrom`, sparkline), igual que el prototipo del handoff.
- **Rationale**: El diseño ya especifica SVG con `viewBox`/`preserveAspectRatio`, glow por `drop-shadow`, grid manual. Una lib (Recharts/D3) pesaría más, rompería el look pixel-exacto y violaría YAGNI. Las funciones de geometría son puras → testeables TDD.
- **Alternatives**: Recharts/visx/D3 (rechazados: peso + pérdida de control visual). Canvas (rechazado: el handoff es SVG; peor para el estilo CRT declarativo).

## D3. Serie de equity histórica — `decisions.portfolio_value_at_decision`

- **Decision**: La serie de equity horaria por estrategia se lee de `bitcho_decisions.portfolio_value_at_decision`; exposición de `btc_exposure_pct`; ambas alineadas por `decided_at`. La serie de precio común, de `bitcho_snapshots.price` por `captured_at`.
- **Rationale**: Verificado en Supabase: ambos campos poblados al 100% (2871/2871 filas). No hay que simular ni recomputar equity — el motor ya lo persiste cada hora. Esto es lo que hace innecesario el `simulate()` del prototipo.
- **Alternatives**: Recomputar equity desde trades + precios en el cliente (rechazado: frágil, redundante, el dato ya existe). Simulador embebido (rechazado salvo como DEMO offline).

## D4. Refresco — carga inicial + realtime, degradación con gracia

- **Decision**: Un hook carga las 5 vistas al montar; luego una suscripción `supabase.channel` a cambios de las tablas base (`bitcho.portfolio`, `bitcho.trades`, `bitcho.decisions`, `bitcho.snapshots`) refresca en push. Si realtime no conecta, se queda con el estado cargado (badge sigue LIVE si la carga fue real). Reloj UI cada 20s (cosmético).
- **Rationale**: Datos horarios → realtime da la sensación "viva" del badge LIVE sin polling agresivo; es el patrón ya presente en el `app.js` actual (Art. IV: reutilizar lo conocido). Degradar en vez de romper cumple FR-005a.
- **Alternatives**: Poll cada N min (rechazado por el usuario: datos viejos + requests inútiles). Solo-al-abrir (rechazado: menos live).

## D5. Offline / PWA — service worker network-first + version.json

- **Decision**: SW propio (patrón questkeep/domus-hub): `network-first` para navegación y datos, cae al último response cacheado; precache del app shell. `version.json` (emitido por el build con el commit) para detectar y activar versión nueva sin dejar al usuario en caché viejo. Cold-start sin red → la app arranca del shell cacheado y usa la serie DEMO embebida (badge DEMO).
- **Rationale**: Cumple FR-005/016/017 con el mismo enfoque probado en los repos hermanos. Nombres de asset sin content-hash (contractuales para el SW), invalidación por `version.json` + cache-version.
- **Alternatives**: `vite-plugin-pwa`/Workbox (rechazado: la casa usa SW a mano, más simple y sin dependencia; YAGNI). Cache-first (rechazado: mostraría datos viejos con red disponible).

## D6. Rango "TODO" — downsample a ancho de pantalla

- **Decision**: 24H/48H = últimos 24/48 puntos horarios directos. "TODO" = serie completa **downsampleada** por stride a ~N puntos (N ≈ ancho útil del SVG, p. ej. 120–180), o ventana de ~30 días, lo que dibuje < 3s.
- **Rationale**: ~1150 puntos crudos en un SVG de 340px es innecesario (más puntos que píxeles) y arriesga SC-004. Downsample por stride es una función pura trivial (Art. IV) y visualmente equivalente a esta resolución.
- **Alternatives**: LTTB (rechazado por ahora: over-engineering para un line chart pequeño; se puede adoptar si el stride se ve tosco). Dibujar todo (rechazado: perf).

## D7. Config y seguridad — anon key pública en cliente

- **Decision**: `src/config.ts` con `SUPABASE_URL` + `ANON_KEY` (los mismos públicos de `config.js`). Sin `.env` ni secretos de build.
- **Rationale**: La anon key está diseñada para ser pública y respeta RLS (solo lectura de las 5 vistas). No hay service_role en el cliente. CSP en `vercel.json` restringe `connect-src` al host de Supabase.
- **Alternatives**: Variables de entorno de Vercel (innecesario: la key es pública; añade fricción sin beneficio de seguridad real).

## D8. Deploy — Vercel estático, build Vite

- **Decision**: `vercel.json` con `buildCommand: vite build` (+ emisión de `version.json`), `outputDirectory: dist`. Headers: CSP (`connect-src` Supabase https+wss), `no-cache` para `index.html`/`sw.js`/`version.json`, `immutable` para `icons/`.
- **Rationale**: Espeja domus-hub. Estático puro → CDN rápido, cumple SC-004.
- **Alternatives**: Otros hosts (fuera de alcance; el usuario pidió Vercel).

## Riesgos y mitigaciones

- **RLS realtime**: realtime en las tablas base del schema `bitcho` requiere que la publicación/anon lo permita. Mitigación: la carga inicial (REST) ya está validada; si realtime no está habilitado para anon, la app degrada a estado cargado (FR-005a) — no bloquea. Tarea de verificación en implement.
- **Historia desalineada entre estrategias** (P1 arranca antes que P2/P3): la comparativa alinea por timestamp común; las series se recortan a su rango disponible. Función de alineación cubierta por tests.
