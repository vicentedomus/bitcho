# Contract — Vistas UI (mapeo al handoff)

Marco global (siempre visible): StatusBar · Header (wordmark + cursor blink + pill LIVE/DEMO + precio + SYNC/VOL) · Tabs (RESUMEN·P1·P2·P3) · Footer. Columna `max-width:430px`, fondo negro con viñeta verde, scanlines opcionales. Tokens en `theme.ts` (ver spec Design Tokens).

## Tab: RESUMEN

- **Título**: `// ESTADO DE PORTAFOLIOS · N ACTIVOS`.
- **3 cards** (`PortfolioCard`): badge code (P1/P2/P3), `display_name` real, subrow `name · EXP xx% · N OPS`, total + %P&L (color por signo), **sparkline** SVG del `pnlSeries`, chevron. Tap → `tab = portfolio_id`.
- **Panel COMPARATIVA** (`CompareChart` + `CompareLegend`): toggle `MXN / % P&L`; SVG 340×150 con grid + baseline (10000 o 0) + 3 polylines (colores P1/P2/P3); ejes min/fecha-media/max; leyenda por estrategia (muestra color, `code·name`, valor, %P&L).
- **Nota**: `MISMO MERCADO · MISMO CEREBRO · CONFIGS DISTINTAS` / `SERIE REAL BITSO BTC_MXN`.

**Acceptance (US1/US2)**: 3 estrategias con nombre real, total, %P&L coloreado, sparkline; header con precio + LIVE. Toggle MXN↔%P&L recomputa series+ejes+leyenda.

## Tab: P1 / P2 / P3 (misma plantilla `strategy/`)

- **Header de vista**: badge code (color) + `display_name` + `name` (tag).
- **`StatePanel` — ESTADO ACTUAL**: total 26px + %P&L; grid 2col de 6 stats: MXN DISPONIBLE, BTC EN MANO (8 dec), VALOR BTC, P&L (color), AVG COMPRA (o N/A), OPS EJECUTADAS. Barra de **EXPOSICIÓN BTC** (`exposure / MAX` — MAX = `100 - btc_floor_pct` o `max_trade`-derivado; documentado en derive).
- **`ConfigPanel` — CONFIG REAL** (reemplaza el panel "PESOS" ficticio del handoff): filas de `params` que aplican — UMBRAL CONFIANZA, MÁX/OPERACIÓN, COOLDOWN, PISO BTC, STOP-LOSS (si ≠null), OBJETIVO GANANCIA (si ≠null). Barras donde tenga sentido (% ), valor a la derecha en color de la estrategia.
- **`BehaviorChart` — COMPORTAMIENTO**: toggle 24H/48H/TODO; SVG 340×140: línea de precio BTC punteada + área de equity con gradiente del color + línea equity con glow. Leyenda `EQUITY ━ / PRECIO BTC ┄` + fechas extremo.
- **`DecisionLog` — LOG DE DECISIONES**: header `N / HORA`; chips `TODAS/BUY/SELL/HOLD` con conteo; lista desc de entradas: acción coloreada (BUY verde / SELL rojo / HOLD atenuado gris) + hora + precio; razonamiento; barra CONF + valor; monto si operó (`+0.001₿` / `+$500`).

**Acceptance (US3/US4)**: stats reales; config muestra params reales (oculta null); gráfica equity-vs-precio con rango; log desc con HOLD atenuado, filtros con conteos correctos, monto en trades.

## Estados transversales

- **LIVE/DEMO**: pill + footer note reflejan `status`. DEMO nunca deja la app en blanco.
- **Vacío/carga**: skeleton "Cargando…" breve; si una estrategia no tiene serie aún, gráfica vacía sin crash.
- **Móvil**: nada desborda horizontal salvo tabs/chips (scroll-x diseñado).
