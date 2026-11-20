// Investment cashflows, IRR, growth charts, and sharing.
// Browser document source; assembled in source-manifest.json order.
function investmentCashflows(price, growth, acquisition, holding, selling, n = 10) {
  const upfront = price * (1 + acquisition / 100),
    gross = price * (1 + growth / 100) ** n,
    net = gross * (1 - selling / 100),
    flows = [-upfront, ...Array(n - 1).fill(-holding), net - holding];
  return {
    upfront,
    gross,
    net,
    flows,
    totalCost: upfront + n * holding,
    profit: net - upfront - n * holding
  };
}
function irr(flows) {
  const npv = r => flows.reduce((s, c, i) => s + c / (1 + r) ** i, 0);
  let lo = -.999,
    hi = 10,
    a = npv(lo),
    b = npv(hi);
  if (!Number.isFinite(a) || a * b > 0) return null;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2,
      v = npv(mid);
    if (v > 0) lo = mid;else hi = mid;
  }
  return (lo + hi) / 2 * 100;
}
function calcGrowth(input) {
  const n = 10,
    rates = input.rates;
  return rates.map(g => {
    const r = investmentCashflows(input.price, g, input.acquisition, input.holding, input.selling, n),
      pvCost = r.upfront + Array.from({
        length: n
      }, (_, i) => input.holding / (1 + input.inflation / 100) ** (i + 1)).reduce((a, b) => a + b, 0),
      realExit = r.net / (1 + input.inflation / 100) ** n;
    return {
      ...r,
      rate: g,
      irr: irr(r.flows),
      roi: r.profit / r.totalCost * 100,
      realExit,
      realGain: realExit - pvCost,
      values: Array.from({
        length: 11
      }, (_, i) => input.price * (1 + g / 100) ** i)
    };
  });
}
