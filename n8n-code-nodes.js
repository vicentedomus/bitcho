// ============================================================
// CODE NODE 1: "Preparar Contexto Claude"
// Va DESPUÉS de "Agregar Snapshot" y lee también portfolio + trades
// Input: snapshot actual + snapshots históricos + portfolio + trades
// Output: system_prompt + user_prompt listos para enviar a Claude
// ============================================================

// --- Datos de entrada ---
const bitsoData = $('GET Bitso Ticker').first().json.payload;
const snapshotsRaw = $('Leer snapshots.json').first().json;
const portfolio = $('Leer portfolio.json').first().json;
const trades = $('Leer trades.json').first().json;

const snapshots = Array.isArray(snapshotsRaw) ? snapshotsRaw : [];

// --- Precio actual ---
const currentPrice = parseFloat(bitsoData.last);
const bid = parseFloat(bitsoData.bid);
const ask = parseFloat(bitsoData.ask);
const volume = parseFloat(bitsoData.volume);
const change24 = parseFloat(bitsoData.change_24);

// --- Calcular resumen de snapshots (últimas 24h max) ---
const recent = snapshots.slice(-24);
const snapshotsSummary = recent.map(s => {
  const time = s.timestamp.substring(5, 16).replace('T', ' '); // "MM-DD HH:mm"
  return `${time} | ${s.price.toLocaleString()} MXN | cambio24h: ${s.change_24}%`;
}).join('\n');

// --- Calcular métricas del portafolio ---
const btcValueMxn = portfolio.btc_balance * currentPrice;
const portfolioTotal = portfolio.mxn_balance + btcValueMxn;
const btcExposure = portfolioTotal > 0 ? ((btcValueMxn / portfolioTotal) * 100).toFixed(1) : 0;

// --- Precio promedio de compra ---
const buyTrades = (Array.isArray(trades) ? trades : []).filter(t => t.action === 'BUY');
let avgBuyPrice = 0;
if (buyTrades.length > 0) {
  const totalBtcBought = buyTrades.reduce((sum, t) => sum + t.btc_amount, 0);
  const totalMxnSpent = buyTrades.reduce((sum, t) => sum + t.mxn_amount, 0);
  avgBuyPrice = totalMxnSpent / totalBtcBought;
}

// --- Ganancia/pérdida no realizada ---
let unrealizedPnl = 0;
if (avgBuyPrice > 0 && portfolio.btc_balance > 0) {
  unrealizedPnl = (((currentPrice - avgBuyPrice) / avgBuyPrice) * 100).toFixed(2);
}

// --- Último trade ---
const allTrades = Array.isArray(trades) ? trades : [];
const lastTrade = allTrades.length > 0 ? allTrades[allTrades.length - 1] : null;
let lastTradeAction = 'Ninguno';
let hoursSinceLastTrade = 999;
let lastTradePrice = 0;

if (lastTrade) {
  lastTradeAction = lastTrade.action;
  lastTradePrice = lastTrade.price;
  const lastTradeTime = new Date(lastTrade.timestamp);
  hoursSinceLastTrade = Math.round((Date.now() - lastTradeTime.getTime()) / (1000 * 60 * 60));
}

// --- Cooldown check (4 horas mínimo) ---
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
- Subida reciente: precio subio >=2.5% en ultimas 6-12 horas
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
- Cambio 24h: ${change24}%

HISTORIAL RECIENTE (ultimas ${recent.length} horas):
${snapshotsSummary}

PORTAFOLIO ACTUAL:
- MXN disponible: $${portfolio.mxn_balance.toLocaleString()}
- BTC en mano: ${portfolio.btc_balance.toFixed(8)}
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
    portfolio_total: portfolioTotal,
    mxn_balance: portfolio.mxn_balance,
    btc_balance: portfolio.btc_balance,
    btc_exposure: parseFloat(btcExposure),
    avg_buy_price: avgBuyPrice,
  }
}];


// ============================================================
// CODE NODE 2: "Procesar Decisión"
// Va DESPUÉS de la respuesta de Claude
// Input: respuesta de Claude + datos del contexto
// Output: portfolio actualizado + nuevo trade (si aplica)
// ============================================================

// --- Parsear respuesta de Claude ---
const claudeResponse = $('Claude Haiku').first().json;
const content = claudeResponse.content[0].text;
let decision;

try {
  decision = JSON.parse(content);
} catch (e) {
  // Si Claude no devolvió JSON válido, forzar HOLD
  decision = {
    action: 'HOLD',
    amount_mxn: 0,
    amount_btc: 0,
    confidence: 0,
    reasoning: 'Error parseando respuesta de Claude: ' + content.substring(0, 100)
  };
}

// --- Datos del contexto ---
const ctx = $('Preparar Contexto Claude').first().json;
const portfolio = $('Leer portfolio.json').first().json;
const trades = $('Leer trades.json').first().json;
const allTrades = Array.isArray(trades) ? trades : [];

const currentPrice = ctx.current_price;
const portfolioTotal = ctx.portfolio_total;
const FEE_RATE = 0.005; // 0.5% comisión Bitso

// --- Validar y ejecutar decisión ---
let newTrade = null;
let updatedPortfolio = { ...portfolio };
let actionTaken = 'HOLD';

if (decision.action === 'BUY' && !ctx.cooldown_active) {
  let amountMxn = decision.amount_mxn;

  // Validaciones
  const maxAllowed = portfolioTotal * 0.25;
  const minAllowed = 500;

  if (amountMxn < minAllowed) amountMxn = 0; // muy poco, cancelar
  if (amountMxn > maxAllowed) amountMxn = maxAllowed; // cap al 25%
  if (amountMxn > portfolio.mxn_balance) amountMxn = portfolio.mxn_balance; // no gastar más de lo que hay
  if (amountMxn < minAllowed) amountMxn = 0; // si después de ajustar sigue bajo, cancelar

  // Check exposición máxima BTC (70%)
  const newBtcValue = (portfolio.btc_balance * currentPrice) + (amountMxn * 0.995);
  const newTotal = (portfolio.mxn_balance - amountMxn) + newBtcValue;
  const newExposure = newBtcValue / newTotal;
  if (newExposure > 0.70) {
    // Reducir monto para no pasar del 70%
    // btcValue + (x * 0.995) = 0.70 * (mxn - x + btcValue + x*0.995)
    const btcVal = portfolio.btc_balance * currentPrice;
    const mxn = portfolio.mxn_balance;
    // 0.70*(mxn - x + btcVal + x*0.995) = btcVal + x*0.995
    // 0.70*mxn - 0.70*x + 0.70*btcVal + 0.70*0.995*x = btcVal + 0.995*x
    // 0.70*mxn + 0.70*btcVal - btcVal = 0.995*x - 0.70*0.995*x + 0.70*x
    // 0.70*mxn - 0.30*btcVal = x*(0.995 - 0.6965 + 0.70)
    // 0.70*mxn - 0.30*btcVal = x*(0.9985)
    const numerator = 0.70 * mxn - 0.30 * btcVal;
    if (numerator > 0) {
      amountMxn = Math.min(amountMxn, numerator / 0.9985);
    } else {
      amountMxn = 0;
    }
    if (amountMxn < minAllowed) amountMxn = 0;
  }

  if (amountMxn >= minAllowed) {
    const btcBought = (amountMxn * (1 - FEE_RATE)) / currentPrice;
    const fee = amountMxn * FEE_RATE;

    updatedPortfolio.mxn_balance = parseFloat((portfolio.mxn_balance - amountMxn).toFixed(2));
    updatedPortfolio.btc_balance = parseFloat((portfolio.btc_balance + btcBought).toFixed(8));
    updatedPortfolio.total_trades = (portfolio.total_trades || 0) + 1;
    updatedPortfolio.last_updated = new Date().toISOString();

    newTrade = {
      id: allTrades.length + 1,
      timestamp: new Date().toISOString(),
      action: 'BUY',
      price: currentPrice,
      mxn_amount: parseFloat(amountMxn.toFixed(2)),
      btc_amount: parseFloat(btcBought.toFixed(8)),
      fee_mxn: parseFloat(fee.toFixed(2)),
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      portfolio_value_after: parseFloat((updatedPortfolio.mxn_balance + updatedPortfolio.btc_balance * currentPrice).toFixed(2)),
    };
    actionTaken = 'BUY';
  }

} else if (decision.action === 'SELL' && !ctx.cooldown_active) {
  let amountBtc = decision.amount_btc;

  // Validaciones
  if (amountBtc > portfolio.btc_balance) amountBtc = portfolio.btc_balance;

  const mxnValue = amountBtc * currentPrice;
  const maxAllowedMxn = portfolioTotal * 0.25;
  if (mxnValue > maxAllowedMxn) {
    amountBtc = maxAllowedMxn / currentPrice;
  }

  const minMxnValue = 500;
  if (amountBtc * currentPrice < minMxnValue) amountBtc = 0;

  if (amountBtc > 0) {
    const mxnReceived = amountBtc * currentPrice * (1 - FEE_RATE);
    const fee = amountBtc * currentPrice * FEE_RATE;

    updatedPortfolio.mxn_balance = parseFloat((portfolio.mxn_balance + mxnReceived).toFixed(2));
    updatedPortfolio.btc_balance = parseFloat((portfolio.btc_balance - amountBtc).toFixed(8));
    updatedPortfolio.total_trades = (portfolio.total_trades || 0) + 1;
    updatedPortfolio.last_updated = new Date().toISOString();

    newTrade = {
      id: allTrades.length + 1,
      timestamp: new Date().toISOString(),
      action: 'SELL',
      price: currentPrice,
      mxn_amount: parseFloat(mxnReceived.toFixed(2)),
      btc_amount: parseFloat(amountBtc.toFixed(8)),
      fee_mxn: parseFloat(fee.toFixed(2)),
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      portfolio_value_after: parseFloat((updatedPortfolio.mxn_balance + updatedPortfolio.btc_balance * currentPrice).toFixed(2)),
    };
    actionTaken = 'SELL';
  }
}

// --- Preparar output ---
const updatedTrades = newTrade ? [...allTrades, newTrade] : allTrades;

const portfolioJson = JSON.stringify(updatedPortfolio, null, 2);
const tradesJson = JSON.stringify(updatedTrades, null, 2);

return [{
  json: {
    action_taken: actionTaken,
    decision: decision,
    new_trade: newTrade,
    updated_portfolio: updatedPortfolio,
    portfolio_base64: Buffer.from(portfolioJson).toString('base64'),
    trades_base64: Buffer.from(tradesJson).toString('base64'),
    commit_message: actionTaken === 'HOLD'
      ? `hold: BTC ${currentPrice.toLocaleString()} MXN | ${decision.reasoning}`
      : `${actionTaken.toLowerCase()}: ${newTrade.btc_amount} BTC @ ${currentPrice.toLocaleString()} MXN | ${decision.reasoning}`,
    should_update_github: actionTaken !== 'HOLD',
  }
}];
