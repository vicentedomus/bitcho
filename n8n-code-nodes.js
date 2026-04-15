// ============================================================
// BITCHO — Workflow de trading (n8n) con Supabase
// ============================================================
// Fuente de verdad: Supabase schema `bitcho` (proyecto BD DnD Halo)
// URL base: https://dwmzchtqjcblupmmklcl.supabase.co/rest/v1
//
// ESTRUCTURA DEL WORKFLOW (después de la migración):
//   1. Schedule Trigger (cada 1 hora)
//   2. HTTP Request "GET Bitso Ticker" → https://api.bitso.com/v3/ticker/?book=btc_mxn
//   3. HTTP Request "GET Portfolio"  → Supabase GET /portfolio?id=eq.1
//   4. HTTP Request "GET Trades"     → Supabase GET /trades?order=executed_at.desc&limit=20
//   5. HTTP Request "GET Snapshots"  → Supabase GET /snapshots?order=captured_at.desc&limit=24
//   6. Code Node "Preparar Contexto Claude"  (ver CODE NODE 1 abajo)
//   7. LLM node "Claude Haiku"
//   8. Code Node "Procesar Decisión"         (ver CODE NODE 2 abajo)
//   9. HTTP Request "Insert Snapshot" → Supabase POST /snapshots   (siempre)
//  10. IF node: {{ $json.should_record_trade === true }}
//       ├─ true  → HTTP Request "Record Trade" → Supabase POST /rpc/record_trade
//       └─ false → (termina)
//
// NODOS A ELIMINAR del workflow viejo:
//   - "Leer portfolio.json", "Leer trades.json", "Leer snapshots.json"
//   - "Agregar Snapshot" (si existía un nodo que escribía snapshots.json)
//   - Cualquier nodo "GitHub → Create/Update File" para portfolio/trades
//
// CREDENCIALES EN n8n (Settings > Credentials > New > HTTP Header Auth):
//   - Nombre: "Supabase Service Role"
//   - Headers:
//       apikey:        <SUPABASE_SERVICE_ROLE_KEY>
//       Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
//
// HEADERS A USAR EN CADA HTTP REQUEST A SUPABASE:
//   - Content-Type:    application/json
//   - Accept-Profile:  bitcho     (en GET)
//   - Content-Profile: bitcho     (en POST)
//   - Prefer:          return=representation   (opcional, devuelve la fila creada)
//
// URLs de los nodos HTTP:
//   GET Portfolio:  {{SUPABASE_URL}}/rest/v1/portfolio?select=*&id=eq.1
//   GET Trades:     {{SUPABASE_URL}}/rest/v1/trades?select=*&order=executed_at.desc&limit=20
//   GET Snapshots:  {{SUPABASE_URL}}/rest/v1/snapshots?select=*&order=captured_at.desc&limit=24
//   POST Snapshot:  {{SUPABASE_URL}}/rest/v1/snapshots
//     body:         {{ JSON.stringify($json.snapshot_payload) }}
//   POST Record Trade: {{SUPABASE_URL}}/rest/v1/rpc/record_trade
//     body:         {{ JSON.stringify($json.trade_payload) }}
// ============================================================


// ============================================================
// CODE NODE 1: "Preparar Contexto Claude"
// Input: GET Bitso Ticker + GET Portfolio + GET Trades + GET Snapshots
// Output: system_prompt + user_prompt para Claude + metadata
// ============================================================

// --- Datos de entrada ---
const bitsoData     = $('GET Bitso Ticker').first().json.payload;
const portfolioArr  = $('GET Portfolio').first().json;
const tradesRaw     = $('GET Trades').first().json;
const snapshotsRaw  = $('GET Snapshots').first().json;

const portfolio = Array.isArray(portfolioArr) ? portfolioArr[0] : portfolioArr;
// Supabase devuelve trades y snapshots en orden desc — invertir a asc cronológico
const trades    = (Array.isArray(tradesRaw)    ? tradesRaw    : []).slice().reverse();
const snapshots = (Array.isArray(snapshotsRaw) ? snapshotsRaw : []).slice().reverse();

// --- Precio actual (Bitso) ---
const currentPrice = parseFloat(bitsoData.last);
const bid      = parseFloat(bitsoData.bid);
const ask      = parseFloat(bitsoData.ask);
const volume   = parseFloat(bitsoData.volume);
const change24 = parseFloat(bitsoData.change_24);
const vwap     = parseFloat(bitsoData.vwap);
const high     = parseFloat(bitsoData.high);
const low      = parseFloat(bitsoData.low);

// --- Resumen de snapshots recientes ---
const snapshotsSummary = snapshots.map(s => {
  const time = s.captured_at.substring(5, 16).replace('T', ' '); // "MM-DD HH:mm"
  return `${time} | ${Number(s.price).toLocaleString()} MXN | cambio24h: ${s.change_24h}`;
}).join('\n');

// --- Métricas de portafolio ---
const mxnBalance     = parseFloat(portfolio.mxn_balance);
const btcBalance     = parseFloat(portfolio.btc_balance);
const btcValueMxn    = btcBalance * currentPrice;
const portfolioTotal = mxnBalance + btcValueMxn;
const btcExposure    = portfolioTotal > 0 ? ((btcValueMxn / portfolioTotal) * 100).toFixed(1) : 0;

// --- Precio promedio de compra ---
const buyTrades = trades.filter(t => t.action === 'BUY');
let avgBuyPrice = 0;
if (buyTrades.length > 0) {
  const totalBtc = buyTrades.reduce((s, t) => s + parseFloat(t.btc_amount), 0);
  const totalMxn = buyTrades.reduce((s, t) => s + parseFloat(t.mxn_amount), 0);
  avgBuyPrice = totalBtc > 0 ? totalMxn / totalBtc : 0;
}

// --- P&L no realizada ---
let unrealizedPnl = 0;
if (avgBuyPrice > 0 && btcBalance > 0) {
  unrealizedPnl = (((currentPrice - avgBuyPrice) / avgBuyPrice) * 100).toFixed(2);
}

// --- Último trade + cooldown ---
const lastTrade = trades.length > 0 ? trades[trades.length - 1] : null;
let lastTradeAction = 'Ninguno';
let lastTradePrice  = 0;
let hoursSinceLastTrade = 999;

if (lastTrade) {
  lastTradeAction = lastTrade.action;
  lastTradePrice  = parseFloat(lastTrade.price);
  hoursSinceLastTrade = Math.round((Date.now() - new Date(lastTrade.executed_at).getTime()) / 3600000);
}

const COOLDOWN_HOURS = 4;
const cooldownActive = hoursSinceLastTrade < COOLDOWN_HOURS;

// --- System prompt ---
const systemPrompt = `Eres Bitcho, un trader algoritmico de Bitcoin paper trading. Tu trabajo es analizar datos de mercado BTC/MXN y tomar decisiones de trading simulado.

REGLAS ESTRICTAS:
1. Responde UNICAMENTE con JSON valido, sin texto adicional
2. HOLD es la accion correcta la mayoria del tiempo (~70% de las horas)
3. Necesitas movimientos >1% para cubrir comisiones (0.5% por operacion, 1% round trip)
4. No tradees por tradear. No hacer nada tambien es una decision

ESTILO: Balanced
- No eres conservador extremo (no HOLD forever)
- No eres agresivo (no scalping cada hora)
- Acumulas gradualmente en caidas, tomas ganancias parciales en subidas
- Nunca all-in, nunca all-out

LIMITES DE OPERACION:
- Minimo por trade: $500 MXN
- Maximo por trade: 25% del valor total del portafolio
- Maximo exposicion BTC: 70% del portafolio total
- Siempre mantener al menos 30% en MXN como reserva

SENALES DE COMPRA (necesitas al menos 2 de 3):
- Caida reciente: precio bajo >=2% en las ultimas 6-12 horas
- Precio actual por debajo del promedio de 24 horas
- Tienes >=40% del portafolio en MXN (hay polvora disponible)

SENALES DE VENTA (necesitas al menos 2 de 3):
- Ganancia acumulada: BTC en mano tiene >=3% ganancia vs precio promedio de compra
- Subida reciente: precio subio >=1.5% en ultimas 6-12 horas
- Sobreexposicion: mas del 60% del portafolio esta en BTC

SIZING POR CONFIANZA:
- Alta (>0.8): hasta 25% del portafolio
- Media (0.5-0.8): hasta 15% del portafolio
- Baja (<0.5): minimo ($500 MXN) o mejor HOLD

COMISIONES:
- Cada operacion tiene 0.5% de comision (fee taker Bitso)
- Compra: btc_recibido = (mxn_gastado * 0.995) / precio_btc
- Venta: mxn_recibido = (btc_vendido * precio_btc) * 0.995
- Consideralas al calcular si un trade vale la pena`;

// --- User prompt ---
const userPrompt = `Analiza estos datos y decide: BUY, SELL o HOLD.

PRECIO ACTUAL:
- Precio: ${currentPrice.toLocaleString()} MXN
- Bid: ${bid.toLocaleString()} MXN
- Ask: ${ask.toLocaleString()} MXN
- Volumen 24h: ${volume} BTC
- Cambio 24h: ${change24}

HISTORIAL RECIENTE (ultimas ${snapshots.length} horas):
${snapshotsSummary}

PORTAFOLIO ACTUAL:
- MXN disponible: $${mxnBalance.toLocaleString()}
- BTC en mano: ${btcBalance.toFixed(8)}
- Valor BTC en MXN: $${btcValueMxn.toLocaleString()}
- Valor total portafolio: $${portfolioTotal.toLocaleString()} MXN
- Precio promedio de compra BTC: ${avgBuyPrice > 0 ? '$' + avgBuyPrice.toLocaleString() + ' MXN' : 'N/A (sin compras aun)'}
- Ganancia/perdida no realizada: ${avgBuyPrice > 0 ? unrealizedPnl + '%' : 'N/A'}
- Exposicion BTC: ${btcExposure}%

ULTIMO TRADE:
- Accion: ${lastTradeAction}
- Hace: ${hoursSinceLastTrade} horas
- Precio en ese momento: ${lastTradePrice > 0 ? '$' + lastTradePrice.toLocaleString() + ' MXN' : 'N/A'}

Responde SOLO con este JSON:
{
  "action": "BUY" | "SELL" | "HOLD",
  "amount_mxn": <numero si BUY, 0 si no>,
  "amount_btc": <numero si SELL, 0 si no>,
  "confidence": <0.0 a 1.0>,
  "reasoning": "<1-2 oraciones explicando tu decision>"
}`;

return [{
  json: {
    system_prompt: systemPrompt,
    user_prompt: userPrompt,
    cooldown_active: cooldownActive,
    hours_since_last_trade: hoursSinceLastTrade,
    current_price: currentPrice,
    bid, ask, volume, change_24: change24, vwap, high_24h: high, low_24h: low,
    portfolio_total: portfolioTotal,
    mxn_balance: mxnBalance,
    btc_balance: btcBalance,
    btc_exposure: parseFloat(btcExposure),
    avg_buy_price: avgBuyPrice,
  }
}];


// ============================================================
// CODE NODE 2: "Procesar Decisión"
// Input: respuesta de Claude Haiku + contexto
// Output: snapshot_payload (siempre) + trade_payload (si no HOLD)
// ============================================================

// --- Parsear respuesta de Claude ---
const claudeResponse = $('Claude Haiku').first().json;
const content = claudeResponse.content[0].text;
let decision;
try {
  decision = JSON.parse(content);
} catch (e) {
  decision = {
    action: 'HOLD',
    amount_mxn: 0,
    amount_btc: 0,
    confidence: 0,
    reasoning: 'Error parseando respuesta: ' + content.substring(0, 100)
  };
}

// --- Contexto ---
const ctx            = $('Preparar Contexto Claude').first().json;
const currentPrice   = ctx.current_price;
const portfolioTotal = ctx.portfolio_total;
const FEE_RATE       = 0.005;

// --- Snapshot (siempre se inserta) ---
const snapshotPayload = {
  captured_at: new Date().toISOString(),
  price:       currentPrice,
  bid:         ctx.bid,
  ask:         ctx.ask,
  volume:      ctx.volume,
  vwap:        ctx.vwap,
  high_24h:    ctx.high_24h,
  low_24h:     ctx.low_24h,
  change_24h:  ctx.change_24,
};

// --- Validación y preparación del trade ---
let tradePayload = null;
let actionTaken  = 'HOLD';

if (decision.action === 'BUY' && !ctx.cooldown_active) {
  let amountMxn = parseFloat(decision.amount_mxn) || 0;
  const maxAllowed = portfolioTotal * 0.25;
  const minAllowed = 500;

  if (amountMxn < minAllowed) amountMxn = 0;
  if (amountMxn > maxAllowed) amountMxn = maxAllowed;
  if (amountMxn > ctx.mxn_balance) amountMxn = ctx.mxn_balance;
  if (amountMxn < minAllowed) amountMxn = 0;

  // Cap por exposición máxima BTC (70%)
  const btcVal = ctx.btc_balance * currentPrice;
  const mxn    = ctx.mxn_balance;
  const projectedExposure = (btcVal + amountMxn * 0.995) / (mxn - amountMxn + btcVal + amountMxn * 0.995);
  if (projectedExposure > 0.70) {
    const numerator = 0.70 * mxn - 0.30 * btcVal;
    amountMxn = numerator > 0 ? Math.min(amountMxn, numerator / 0.9985) : 0;
    if (amountMxn < minAllowed) amountMxn = 0;
  }

  if (amountMxn >= minAllowed) {
    const btcBought = (amountMxn * (1 - FEE_RATE)) / currentPrice;
    const fee       = amountMxn * FEE_RATE;
    tradePayload = {
      p_action:     'BUY',
      p_price:      currentPrice,
      p_mxn_amount: parseFloat(amountMxn.toFixed(2)),
      p_btc_amount: parseFloat(btcBought.toFixed(8)),
      p_fee_mxn:    parseFloat(fee.toFixed(2)),
      p_confidence: decision.confidence,
      p_reasoning:  decision.reasoning,
    };
    actionTaken = 'BUY';
  }
} else if (decision.action === 'SELL' && !ctx.cooldown_active) {
  let amountBtc = parseFloat(decision.amount_btc) || 0;
  if (amountBtc > ctx.btc_balance) amountBtc = ctx.btc_balance;

  const mxnValue       = amountBtc * currentPrice;
  const maxAllowedMxn  = portfolioTotal * 0.25;
  if (mxnValue > maxAllowedMxn) amountBtc = maxAllowedMxn / currentPrice;
  if (amountBtc * currentPrice < 500) amountBtc = 0;

  if (amountBtc > 0) {
    const mxnReceived = amountBtc * currentPrice * (1 - FEE_RATE);
    const fee         = amountBtc * currentPrice * FEE_RATE;
    tradePayload = {
      p_action:     'SELL',
      p_price:      currentPrice,
      p_mxn_amount: parseFloat(mxnReceived.toFixed(2)),
      p_btc_amount: parseFloat(amountBtc.toFixed(8)),
      p_fee_mxn:    parseFloat(fee.toFixed(2)),
      p_confidence: decision.confidence,
      p_reasoning:  decision.reasoning,
    };
    actionTaken = 'SELL';
  }
}

return [{
  json: {
    action_taken:        actionTaken,
    decision:            decision,
    snapshot_payload:    snapshotPayload,
    trade_payload:       tradePayload,
    should_record_trade: tradePayload !== null,
  }
}];
