# Feature Specification: Bitcho PWA Dashboard

**Feature Branch**: `claude/bitcho-frontend-pwa-fzkupc`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Bitcho PWA frontend — dashboard móvil read-only que recrea la estética terminal-CRT del handoff de diseño con datos REALES del backend (3 estrategias en vivo), enfoque 100% móvil, desplegado en Vercel."

## Overview

Bitcho corre un experimento de *paper trading* de Bitcoin (BTC/MXN) donde Claude AI decide cada hora BUY / SELL / HOLD para **tres estrategias distintas que corren en simultáneo** sobre el mismo mercado. Hoy el estado del experimento solo es visible consultando la base de datos directamente. Este feature entrega un **dashboard móvil de solo lectura** que hace ese experimento legible de un vistazo: cómo va cada estrategia, cómo se comparan, y por qué el modelo decidió lo que decidió hora a hora.

El dashboard es **observacional**: no ejecuta órdenes ni cambia configuración (el motor vive en n8n). Su valor es narrar el estado real del experimento con una estética terminal-CRT deliberada.

## Clarifications

### Session 2026-07-23

- Q: ¿Cómo refresca el dashboard, dado que los datos se actualizan cada hora? → A: Suscripción realtime (push al entrar decisión/operación/estado nuevo) sobre una carga inicial; degrada con gracia a estático si realtime no está disponible.
- Q: ¿Qué muestra el rango "TODO" y las gráficas, dado que el histórico llega a ~1150 puntos (3 meses)? → A: Ventana acotada por defecto — 24H/48H directos y "TODO" limitado a una ventana razonable y/o downsampleada, priorizando carga rápida en móvil.
- Q: ¿Qué se ve sin red o si falla la primera carga? → A: El último dato real cacheado (network-first); solo en cold-start sin red se cae a la serie DEMO embebida. Ambos casos marcan badge DEMO.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el estado de las 3 estrategias de un vistazo (Priority: P1)

El dueño del experimento abre el dashboard en su teléfono y, sin scroll ni taps, ve el precio BTC/MXN actual y el estado resumido de las tres estrategias: valor total, ganancia/pérdida (%), exposición y número de operaciones de cada una, con una mini-gráfica de tendencia.

**Why this priority**: Es el motivo de existir del dashboard — responder "¿cómo va el experimento?" en segundos. Es el MVP: aun sin ninguna otra vista, entrega valor por sí solo.

**Independent Test**: Cargar la app con datos reales de Supabase y verificar que las 3 estrategias aparecen con nombre real (Control / HODL-biased / Low-frequency), su total, su %P&L con color correcto (verde/rojo) y su sparkline, más el precio BTC en el header.

**Acceptance Scenarios**:

1. **Given** las 3 estrategias tienen estado en el backend, **When** el usuario abre la vista RESUMEN, **Then** ve una card por estrategia con su nombre real, valor total, %P&L (verde si ≥0, rojo si <0), exposición, ops y una sparkline de tendencia.
2. **Given** hay conexión a la fuente de datos, **When** carga el header, **Then** muestra el precio BTC/MXN más reciente y un indicador de estado **LIVE**.
3. **Given** el usuario toca una card de estrategia, **When** ocurre el tap, **Then** navega a la vista de detalle de esa estrategia.

---

### User Story 2 - Comparar el desempeño de las 3 estrategias en el tiempo (Priority: P2)

En la misma vista RESUMEN, debajo de las cards, el usuario ve una gráfica comparativa que superpone la evolución de las tres estrategias sobre la serie de precios real, con opción de ver el eje en MXN o en % P&L, y una leyenda con el valor y P&L final de cada una.

**Why this priority**: El experimento es una comparación — su interés está en *cuál estrategia gana* y por cuánto. Sin esto el dashboard informa pero no compara.

**Independent Test**: Con series reales de las 3 estrategias, verificar que la gráfica dibuja 3 líneas distinguibles por color, una baseline del capital inicial, ejes con min/fecha/max, y que el toggle MXN ↔ %P&L recomputa la gráfica y la leyenda.

**Acceptance Scenarios**:

1. **Given** existen series históricas de las 3 estrategias, **When** el usuario ve el panel COMPARATIVA, **Then** ve 3 líneas de color distinto, una baseline del capital inicial ($10,000) y una leyenda con valor y %P&L por estrategia.
2. **Given** el panel está en modo MXN, **When** el usuario cambia a "% P&L", **Then** las 3 series y los ejes se recomputan a porcentaje.

---

### User Story 3 - Ver el detalle y la configuración real de una estrategia (Priority: P2)

El usuario entra a la vista de una estrategia y ve su estado actual (MXN disponible, BTC en mano, valor BTC, P&L, precio promedio de compra, ops), su **configuración real** (los parámetros con los que el motor la corre) y una gráfica de comportamiento que superpone su equity contra el precio de BTC, con rango 24H / 48H / TODO.

**Why this priority**: Da profundidad y confianza — deja ver *por qué* una estrategia se comporta distinto (su config real), no solo su resultado.

**Independent Test**: Abrir cada estrategia y verificar que los stats de estado, los parámetros de configuración reales (los del backend, no valores inventados) y la gráfica equity-vs-precio corresponden a los datos de esa estrategia, y que el toggle de rango recorta la serie.

**Acceptance Scenarios**:

1. **Given** una estrategia con estado en el backend, **When** el usuario abre su vista, **Then** ve total, %P&L y un grid de stats (MXN disponible, BTC en mano, valor BTC, P&L, avg compra, ops).
2. **Given** la estrategia tiene configuración en el backend, **When** el usuario ve el panel de config, **Then** ve los parámetros reales con los que corre (p. ej. umbral de confianza, tope por operación, cooldown, piso de BTC, stop-loss, objetivo de ganancia), mostrando solo los que aplican.
3. **Given** existe serie de equity y precio, **When** el usuario cambia el rango a 24H/48H/TODO, **Then** la gráfica recorta la ventana y recomputa sus extremos.

---

### User Story 4 - Auditar el log de decisiones hora a hora (Priority: P3)

El usuario revisa, para una estrategia, la lista cronológica (más reciente primero) de decisiones horarias del modelo — BUY, SELL y **HOLD** — cada una con hora, precio, confianza, monto (si operó) y el razonamiento en lenguaje natural del modelo, con chips para filtrar por tipo y ver conteos.

**Why this priority**: Es el diferenciador narrativo (ver el "cerebro" decidir, incluido cuando decide *no* operar), pero el dashboard ya es útil sin él.

**Independent Test**: Abrir el log de una estrategia y verificar que las entradas reales (incluidos HOLD) se listan de más reciente a más antigua, que los HOLD se ven atenuados, que la acción tiene su color, que la barra de confianza refleja el valor, y que los chips filtran y muestran conteos correctos.

**Acceptance Scenarios**:

1. **Given** una estrategia con historial de decisiones, **When** el usuario ve el LOG, **Then** ve entradas ordenadas de más reciente a más antigua, cada una con acción (color según BUY/SELL/HOLD), hora, precio, razonamiento y barra de confianza.
2. **Given** el log tiene entradas de varios tipos, **When** el usuario toca un chip de filtro (TODAS/BUY/SELL/HOLD), **Then** la lista se filtra a ese tipo y cada chip muestra su conteo.
3. **Given** una decisión que resultó en operación, **When** se muestra su entrada, **Then** incluye el monto operado (BTC comprado o MXN recibido).

---

### Edge Cases

- **Sin red / fuente de datos caída**: el dashboard NO queda en blanco — muestra el **último dato real cacheado** con badge **DEMO**; solo en cold-start sin red (nunca hubo carga) cae a una serie de precios embebida.
- **Última operación fue hace mucho**: una estrategia puede llevar semanas solo en HOLD (mercado lateral); el estado y el log deben reflejarlo sin romperse (avg de compra y ops "congelados", decisiones HOLD recientes).
- **Estrategia sin BTC en mano**: el precio promedio de compra se muestra como "N/A" y la exposición como 0%.
- **Decisión sin razonamiento**: la entrada del log se muestra sin texto de razonamiento, sin romper el layout.
- **Pantalla muy angosta**: la columna se mantiene legible por debajo del ancho objetivo móvil; nada se desborda horizontalmente salvo las filas diseñadas para scroll-x (tabs, chips).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El dashboard MUST mostrar el estado de las **tres** estrategias reales del backend, identificadas por su **nombre real** (Control (actual), HODL-biased, Low-frequency), sin renombrarlas ni inventar categorías.
- **FR-002**: El dashboard MUST leer exclusivamente datos reales del backend (estado de cada estrategia, su configuración, sus decisiones horarias, sus operaciones y la serie de precios) y NO simular datos cuando hay conexión.
- **FR-003**: El sistema MUST ser **solo lectura**: no ejecuta órdenes ni modifica configuración ni estado del experimento.
- **FR-004**: El header MUST mostrar el precio BTC/MXN más reciente y un indicador de estado **LIVE** cuando la fuente responde, o **DEMO** cuando no.
- **FR-005**: Ante fallo de red o de la fuente de datos, el sistema MUST mantener la app navegable en modo DEMO: primero sirviendo el **último dato real cacheado** (última respuesta buena) y, solo si nunca hubo una carga previa (cold-start sin red), cayendo a una **serie de precios embebida**; en ambos casos MUST indicar el estado DEMO y nunca quedar en pantalla en blanco.
- **FR-005a**: El sistema MUST cargar un estado inicial al abrir y luego MUST reflejar de forma automática (vía suscripción realtime a decisiones/operaciones/estado) la llegada de nuevos datos sin recargar; si la suscripción realtime no está disponible, MUST degradar con gracia al estado ya cargado sin bloquear la app.
- **FR-006**: La vista RESUMEN MUST presentar una card por estrategia con nombre, valor total, %P&L con color según signo, exposición, número de operaciones y una sparkline de tendencia; y cada card MUST navegar al detalle de su estrategia al tocarla.
- **FR-007**: La vista RESUMEN MUST incluir un panel comparativo con las 3 series superpuestas, una baseline del capital inicial, un toggle MXN ↔ % P&L que recomputa series y ejes, y una leyenda con valor y %P&L por estrategia.
- **FR-008**: La vista de estrategia MUST mostrar el estado actual (valor total, %P&L, MXN disponible, BTC en mano, valor BTC, P&L, precio promedio de compra o "N/A", operaciones).
- **FR-009**: La vista de estrategia MUST mostrar la **configuración real** con la que el motor corre esa estrategia, mostrando únicamente los parámetros que apliquen a cada una.
- **FR-010**: La vista de estrategia MUST incluir una gráfica de comportamiento que superponga su equity contra el precio de BTC, con selector de rango 24H / 48H / TODO que recorta la ventana temporal. El rango "TODO" MUST acotarse a una ventana razonable y/o representarse downsampleado para no degradar el tiempo de carga en móvil (no se exige dibujar los ~1150 puntos crudos).
- **FR-011**: La vista de estrategia MUST incluir un log cronológico (más reciente primero) de las decisiones horarias, incluyendo **HOLD**, cada una con acción coloreada, hora, precio, confianza (barra + valor), razonamiento y, si aplicó, el monto operado.
- **FR-012**: El log MUST ofrecer filtros TODAS / BUY / SELL / HOLD con conteo por tipo, distinguiendo visualmente las entradas HOLD (atenuadas) de las operaciones.
- **FR-013**: La navegación entre RESUMEN y las 3 estrategias MUST ser por pestañas siempre visibles en el header.
- **FR-014**: La app MUST estar diseñada para uso **exclusivamente móvil** (columna centrada de ancho acotado), sin una experiencia de escritorio dedicada.
- **FR-015**: La app MUST recrear fielmente la estética terminal-CRT del handoff de diseño (paleta verde/negro, tipografía monoespaciada, glow, scanlines, radios mínimos) según sus design tokens.
- **FR-016**: La app MUST ser instalable como PWA (nombre, íconos, pantalla de inicio) y, tras una primera carga exitosa, MUST seguir abriéndose sin red mostrando el último dato real cacheado (ver FR-005).
- **FR-017**: La app MUST notificar/recuperar de forma transparente cuando exista una versión nueva desplegada (sin dejar al usuario atrapado en una versión cacheada indefinidamente).
- **FR-018**: La app MUST reemplazar el frontend actual del repo como superficie servida, conservando la configuración pública de conexión (URL + llave pública que respeta las reglas de acceso del backend).

### Key Entities *(include if feature involves data)*

- **Estrategia (perfil)**: una de las tres configuraciones que corren en paralelo; tiene nombre real, nombre para mostrar, estado activo y un conjunto de parámetros de operación (umbral de confianza, tope por operación, cooldown, piso de BTC, stop-loss, objetivo de ganancia). Fuente: `bitcho_portfolios_meta`.
- **Estado de portafolio**: saldo MXN, BTC en mano, operaciones acumuladas, inversión inicial y costo base promedio de una estrategia. Fuente: `bitcho_portfolio` (una fila por estrategia).
- **Decisión**: el resultado horario del modelo para una estrategia — acción (BUY/SELL/HOLD), confianza, razonamiento, precio, exposición y **valor del portafolio al momento**, y si derivó en operación. Fuente: `bitcho_decisions`. El campo de valor-al-momento (poblado al 100% en el histórico) es la **serie de equity horaria** que alimenta las gráficas comparativa y de comportamiento.
- **Operación (trade)**: una compra o venta ejecutada por una estrategia — acción, precio, monto MXN/BTC, comisión, confianza, valor posterior. Fuente: `bitcho_trades`.
- **Snapshot de precio**: captura horaria del mercado BTC/MXN (precio, cambio 24h, volumen, etc.) que forma la serie de precios común. Fuente: `bitcho_snapshots`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al abrir el dashboard, el usuario identifica el valor y el P&L de las 3 estrategias y el precio BTC actual **sin hacer scroll ni taps** (todo en la primera pantalla móvil).
- **SC-002**: El 100% de los datos mostrados (estados, config, decisiones, operaciones, precios) corresponden a los datos reales del backend cuando hay conexión; el modo DEMO solo aparece ante fallo de red.
- **SC-003**: Las tres estrategias se muestran con sus nombres y parámetros reales; **cero** valores inventados o nombres del prototipo de diseño.
- **SC-004**: Con la fuente de datos disponible, la primera pantalla con datos reales aparece en **menos de 3 segundos** en una conexión móvil típica.
- **SC-005**: Con la red caída, la app sigue siendo navegable entre las 4 vistas en modo DEMO **sin pantalla en blanco ni error bloqueante**.
- **SC-006**: El usuario puede, para cualquier estrategia, filtrar el log a BUY / SELL / HOLD y ver conteos correctos que suman el total de decisiones de esa estrategia.
- **SC-007**: La app es instalable en un teléfono como PWA y abre a pantalla completa desde el ícono de inicio.
- **SC-008**: Cuando el motor registra una decisión/operación nueva, el dashboard la refleja **sin que el usuario recargue** (con la app abierta y red disponible).

## Assumptions

- **Backend sin cambios**: las tres estrategias, sus decisiones (incluidos HOLD) y las vistas públicas de lectura ya existen y siguen actualizándose por el motor n8n; este feature es solo frontend y no modifica backend ni n8n.
- **Acceso de lectura ya disponible**: las cinco vistas públicas son legibles con la llave pública respetando las reglas de acceso (validado). No se requieren nuevas credenciales ni cambios de permisos para lo especificado.
- **Estética como contrato**: los design tokens del handoff (colores, tipografía, espaciado, gráficas) son finales y se recrean fielmente; lo que se descarta del prototipo es su **capa de datos simulada** y sus nombres/parámetros inventados, no su look.
- **Capital inicial**: cada estrategia arranca con $10,000 MXN (baseline de las gráficas y del %P&L).
- **Serie de fallback**: para el modo DEMO offline se reutiliza una serie de precios reales ya presente en el repo.
- **Alcance móvil**: no hay experiencia de escritorio en v1; el objetivo es teléfono en vertical.
- **Idioma**: la interfaz es en español (etiquetas, copy), consistente con el handoff.
