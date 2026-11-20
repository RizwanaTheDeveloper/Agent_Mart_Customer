function investmentPage() {
  Growth.result = calcGrowth(Growth);
  const rows = Growth.result;
  $('app').innerHTML = `${backbtn()}<div class="hero"><div class="eyebrow">10-YEAR INVESTMENT SCENARIOS</div><h1>Model the possibilities.<br>Keep the assumptions visible.</h1><p>Illustrative growth paths, costs, cash flows and inflation. No forecast is inferred from the plot code or nearby projects.</p></div><div class="notice">Editable scenarios, not a prediction or guaranteed return. Actual plot prices can fall, stagnate or be difficult to realize. ${esc(Growth.label)}</div><form class="panel" onsubmit="updateGrowth(event)"><h2>Your inputs</h2>${input('Purchase price (INR)', 'price', Growth.price, 'number', true, 'min="1000" max="1000000000000" step="0.01"')}<div class="grid">${input('Acquisition costs (%)', 'acquisition', Growth.acquisition, 'number', true, 'min="0" max="30" step="0.01"')}${input('Annual holding cost (INR)', 'holding', Growth.holding, 'number', true, 'min="0" max="100000000" step="0.01"')}${input('Sale costs (%)', 'selling', Growth.selling, 'number', true, 'min="0" max="30" step="0.01"')}${input('Inflation assumption (%)', 'inflation', Growth.inflation, 'number', true, 'min="0" max="20" step="0.1"')}</div><h3 style="margin-top:20px">Annual appreciation assumptions</h3><div class="grid">${input('Downside rate (%)', 'rate0', Growth.rates[0], 'number', true, 'min="-20" max="40" step="0.1"')}${input('Moderate rate (%)', 'rate1', Growth.rates[1], 'number', true, 'min="-20" max="40" step="0.1"')}${input('Higher-growth rate (%)', 'rate2', Growth.rates[2], 'number', true, 'min="-20" max="40" step="0.1"')}</div><p class="mini muted">Starting rates −2%, 5% and 8% are hypothetical examples, not estimates for Amaravati. Costs and inflation start at zero; enter your actual assumptions. Taxes, borrowing costs and rental income are excluded.</p><button class="btn full">Recalculate 10-year outlook</button></form><div class="panel"><h2>Illustrative gross value paths</h2>${growthChart(rows)}<small>Before acquisition, holding and sale costs. The model assumes a constant annual growth rate in each scenario.</small></div><div class="scenariocards">${rows.map((r, i) => `<div class="panel"><div class="row"><span class="tag ${i === 0 ? 'red' : i === 1 ? '' : 'amber'}">${['DOWNSIDE', 'MODERATE', 'HIGHER GROWTH'][i]} • ${r.rate}% / YEAR</span><small>Year 10</small></div><div class="price" style="margin-top:12px">${money(r.gross)}</div><small>Illustrative gross property value</small><div class="facts">${fact('Net sale proceeds', money(r.net))}${fact('Total cash outlay', money(r.totalCost))}${fact('Nominal net gain / loss', signedMoney(r.profit))}${fact('Return on cash outlay', r.roi.toFixed(1) + '%')}${fact('Annual cash-flow IRR', r.irr === null ? 'Not available' : r.irr.toFixed(2) + '%')}${fact('Real net gain / loss', signedMoney(r.realGain))}</div><small>Real gain compares inflation-discounted sale proceeds with inflation-discounted cash costs. IRR assumes year-end holding costs and a sale at the end of year 10.</small></div>`).join('')}</div><div class="panel"><h2>Year-by-year property value</h2><div class="scroll" style="max-height:none"><table class="previewtable"><thead><tr><th>Year</th><th>${rows[0].rate}%</th><th>${rows[1].rate}%</th><th>${rows[2].rate}%</th></tr></thead><tbody>${Array.from({
    length: 11
  }, (_, n) => `<tr><td>${n === 0 ? 'Today' : n}</td>${rows.map(r => `<td>${money(r.values[n])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div><details><summary>How to interpret this outlook</summary><p class="mini">Gross value = purchase price × (1 + annual assumption) raised to the year. Net proceeds subtract assumed sale costs. Nominal gain subtracts acquisition and all ten annual holding payments. No borrowing, tax, rental income or future cost escalation is modelled.</p><p class="mini">Nearby schools and proposed projects do not automatically determine appreciation. Check actual comparable transactions, permitted use, title, infrastructure execution and exit liquidity independently.</p><a href="https://www.rbi.org.in/scripts/FS_PressRelease.aspx?prid=63436">RBI historical house-price index context ↗</a><small style="display:block">A broad historical housing index is not a forecast for an individual CRDA plot. Example assumptions here are not calibrated from that index.</small></details><button class="btn full" onclick="shareGrowth()">Share assumptions & scenario results</button>`;
}
function signedMoney(v) {
  if (Math.abs(v) < .005) return '₹0';
  return (v < 0 ? '−' : '+') + money(Math.abs(v));
}
function updateGrowth(e) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target)),
    rates = [+d.rate0, +d.rate1, +d.rate2];
  if (rates[0] > rates[1] || rates[1] > rates[2]) {
    toast('Keep downside ≤ moderate ≤ higher-growth assumptions.');
    return;
  }
  for (const k of ['price', 'acquisition', 'holding', 'selling', 'inflation']) Growth[k] = +d[k];
  Growth.rates = rates;
  Growth.label = 'User-entered assumptions, not a market valuation.';
  investmentPage();
  toast('Scenario calculations updated');
}
function growthChart(rows) {
  const W = 320,
    H = 190,
    L = 38,
    R = 25,
    T = 16,
    B = 30,
    max = Math.max(...rows.flatMap(r => r.values)) * 1.06,
    min = 0,
    x = n => L + n / 10 * (W - L - R),
    y = v => H - B - (v - min) / (max - min) * (H - T - B);
  return `<svg viewBox="0 0 ${W} ${H}" class="growthchart" role="img" aria-label="Illustrative ten-year property value paths">${[0, .5, 1].map(v => `<line x1="${L}" y1="${y(max * v)}" x2="${W - R}" y2="${y(max * v)}" stroke="#d5d3f4"/><text x="${L - 4}" y="${y(max * v) + 3}" text-anchor="end">${(max * v / 1e5).toFixed(0)}L</text>`).join('')}${[0, 5, 10].map(n => `<text x="${x(n)}" y="${H - 10}" text-anchor="middle">${n === 0 ? 'Today' : 'Year ' + n}</text>`).join('')}${rows.map((r, i) => `<path d="${r.values.map((v, n) => (n ? 'L' : 'M') + x(n) + ',' + y(v)).join(' ')}" fill="none" stroke="${['#b65d5d', '#221d76', '#c58a35'][i]}" stroke-width="2.5"/>`).join('')}</svg><div class="row mini"><span style="color:#b65d5d">Downside</span><span style="color:#221d76">Moderate</span><span style="color:#c58a35">Higher growth</span></div>`;
}
function shareGrowth() {
  shareText('Illustrative 10-year property scenarios', `ILLUSTRATIVE SCENARIOS - NOT A FORECAST\nPurchase: ${money(Growth.price)}\nAcquisition: ${Growth.acquisition}% | Annual holding: INR ${Growth.holding} | Sale costs: ${Growth.selling}% | Inflation: ${Growth.inflation}%\n${calcGrowth(Growth).map((r, i) => `${['Downside', 'Moderate', 'Higher growth'][i]} (${r.rate}%/year): year-10 gross ${money(r.gross)}, nominal net gain/loss ${signedMoney(r.profit)}, cash-flow IRR ${r.irr?.toFixed(2)}%`).join('\n')}\nTaxes, borrowing and rental income excluded. No plot-code-based appreciation forecast or guaranteed return is provided.`);
}
route = 'firm';
args = {};
render();

// Separate buyer and seller presentation; authorization remains server-side.
