// ============================================================
// Bitcho dashboard — lee portfolio/trades/snapshots desde Supabase.
// Requiere: supabase-js (CDN), CONFIG (config.js).
//
// Usa views en schema public (bitcho_portfolio, bitcho_trades, bitcho_snapshots)
// que proxyan al schema bitcho. Esto evita el issue de PostgREST schema cache
// que no recarga el env var PGRST_DB_SCHEMAS sin restart del container.
// ============================================================

const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

const fmtMxn = (n) => '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtBtc = (n) => Number(n).toFixed(8) + ' BTC';
const fmtPct = (n) => (n >= 0 ? '+' : '') + Number(n).toFixed(2) + '%';

async function loadAll() {
  const [portfolioRes, tradesRes, snapshotsRes] = await Promise.all([
    sb.from('bitcho_portfolio').select('*').eq('id', 1).single(),
    sb.from('bitcho_trades').select('*').order('executed_at', { ascending: false }).limit(50),
    sb.from('bitcho_snapshots').select('*').order('captured_at', { ascending: false }).limit(168),
  ]);

  if (portfolioRes.error) return showError(portfolioRes.error);
  if (tradesRes.error)    return showError(tradesRes.error);
  if (snapshotsRes.error) return showError(snapshotsRes.error);

  const portfolio = portfolioRes.data;
  const trades    = tradesRes.data;
  const snapshots = snapshotsRes.data.slice().reverse();

  renderPortfolio(portfolio, snapshots);
  renderPrice(snapshots);
  renderTrades(trades);
  drawChart(snapshots);
}

function renderPortfolio(p, snapshots) {
  const lastPrice = snapshots.length ? Number(snapshots[snapshots.length - 1].price) : 0;
  const mxn       = Number(p.mxn_balance);
  const btc       = Number(p.btc_balance);
  const btcValue  = btc * lastPrice;
  const total     = mxn + btcValue;
  const initial   = Number(p.initial_investment);
  const pnlAbs    = total - initial;
  const pnlPct    = initial > 0 ? (pnlAbs / initial) * 100 : 0;
  const pnlClass  = pnlAbs >= 0 ? 'pnl-pos' : 'pnl-neg';
  const exposure  = total > 0 ? (btcValue / total) * 100 : 0;

  document.getElementById('portfolio-body').innerHTML = `
    <div class="grid">
      <div><span class="label">MXN disponible</span><strong>${fmtMxn(mxn)}</strong></div>
      <div><span class="label">BTC en mano</span><strong>${fmtBtc(btc)}</strong></div>
      <div><span class="label">Valor BTC</span><strong>${fmtMxn(btcValue)}</strong></div>
      <div><span class="label">Valor total</span><strong>${fmtMxn(total)}</strong></div>
      <div><span class="label">P&amp;L</span><strong class="${pnlClass}">${fmtMxn(pnlAbs)} (${fmtPct(pnlPct)})</strong></div>
      <div><span class="label">Exposición BTC</span><strong>${exposure.toFixed(1)}%</strong></div>
      <div><span class="label">Trades ejecutados</span><strong>${p.total_trades}</strong></div>
      <div><span class="label">Última actualización</span><strong>${new Date(p.updated_at).toLocaleString('es-MX')}</strong></div>
    </div>
  `;
}

function renderPrice(snapshots) {
  if (!snapshots.length) {
    document.getElementById('price-body').textContent = 'Sin snapshots.';
    return;
  }
  const last = snapshots[snapshots.length - 1];
  const change = Number(last.change_24h);
  const changeClass = change >= 0 ? 'pnl-pos' : 'pnl-neg';
  document.getElementById('price-body').innerHTML = `
    <div class="grid">
      <div><span class="label">Precio</span><strong>${fmtMxn(last.price)}</strong></div>
      <div><span class="label">Bid / Ask</span><strong>${fmtMxn(last.bid)} / ${fmtMxn(last.ask)}</strong></div>
      <div><span class="label">Volumen 24h</span><strong>${Number(last.volume).toFixed(4)} BTC</strong></div>
      <div><span class="label">Cambio 24h</span><strong class="${changeClass}">${fmtMxn(change)}</strong></div>
      <div><span class="label">High / Low 24h</span><strong>${fmtMxn(last.high_24h)} / ${fmtMxn(last.low_24h)}</strong></div>
      <div><span class="label">Capturado</span><strong>${new Date(last.captured_at).toLocaleString('es-MX')}</strong></div>
    </div>
  `;
}

function renderTrades(trades) {
  if (!trades.length) {
    document.getElementById('trades-body').textContent = 'Sin trades aún.';
    return;
  }
  const rows = trades.map(t => `
    <tr class="trade-${t.action.toLowerCase()}">
      <td>${new Date(t.executed_at).toLocaleString('es-MX')}</td>
      <td>${t.action}</td>
      <td>${fmtMxn(t.price)}</td>
      <td>${fmtMxn(t.mxn_amount)}</td>
      <td>${Number(t.btc_amount).toFixed(8)}</td>
      <td>${fmtMxn(t.fee_mxn)}</td>
      <td>${Number(t.confidence).toFixed(2)}</td>
      <td>${fmtMxn(t.portfolio_value_after)}</td>
    </tr>
  `).join('');
  document.getElementById('trades-body').innerHTML = `
    <table class="trades">
      <thead>
        <tr><th>Fecha</th><th>Acción</th><th>Precio</th><th>MXN</th><th>BTC</th><th>Fee</th><th>Conf.</th><th>Valor post</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function drawChart(snapshots) {
  const canvas = document.getElementById('price-chart');
  if (!canvas || !snapshots.length) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const prices = snapshots.map(s => Number(s.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const stepX = w / Math.max(1, snapshots.length - 1);

  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  snapshots.forEach((s, i) => {
    const x = i * stepX;
    const y = h - ((Number(s.price) - min) / range) * h;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = '#8b949e';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(fmtMxn(max), 4, 12);
  ctx.fillText(fmtMxn(min), 4, h - 4);
}

function showError(error) {
  console.error('Bitcho error:', error);
  document.getElementById('app').insertAdjacentHTML('afterbegin',
    `<div class="error">Error al cargar datos: ${error.message}</div>`);
}

loadAll();

// Realtime: escucha cambios en las tablas base (schema bitcho, no las views)
sb.channel('bitcho-changes')
  .on('postgres_changes', { event: '*', schema: 'bitcho', table: 'portfolio' }, loadAll)
  .on('postgres_changes', { event: '*', schema: 'bitcho', table: 'trades'    }, loadAll)
  .on('postgres_changes', { event: '*', schema: 'bitcho', table: 'snapshots' }, loadAll)
  .subscribe();

setInterval(loadAll, 10 * 60 * 1000);
