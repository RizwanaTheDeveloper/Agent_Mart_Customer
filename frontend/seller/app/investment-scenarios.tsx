'use client';
import { useState } from 'react';
import { calculateScenarios } from '../lib/investment';
import { money } from '../lib/model';

const fields = [
  { key: 'price', label: 'Purchase price (INR)', min: 1000, max: 1e12, step: .01 },
  { key: 'acquisition', label: 'Acquisition costs (%)', min: 0, max: 30, step: .01 },
  { key: 'holding', label: 'Annual holding cost (INR)', min: 0, max: 1e8, step: .01 },
  { key: 'selling', label: 'Sale costs (%)', min: 0, max: 30, step: .01 },
  { key: 'inflation', label: 'Inflation assumption (%)', min: 0, max: 20, step: .1 },
  { key: 'rate0', label: 'Downside rate (%)', min: -20, max: 40, step: .1 },
  { key: 'rate1', label: 'Moderate rate (%)', min: -20, max: 40, step: .1 },
  { key: 'rate2', label: 'Higher-growth rate (%)', min: -20, max: 40, step: .1 },
  { key: 'monthlyRent', label: 'Monthly rental income (INR)', min: 0, max: 1e8, step: .01 },
  { key: 'years', label: 'Years', min: 1, max: 30, step: 1 },
] as const;

export default function InvestmentScenarios() {
  const [values, setValues] = useState<Record<string, string>>({ price: '5000000', acquisition: '0', holding: '0', selling: '0', inflation: '0', rate0: '-2', rate1: '5', rate2: '8', monthlyRent: '0', years: '10' });
  let error = '', results: ReturnType<typeof calculateScenarios> = [];
  try {
    if (fields.some(field => values[field.key].trim() === '' || Number(values[field.key]) < field.min || Number(values[field.key]) > field.max)) throw Error('Complete the assumptions within the displayed limits.');
    results = calculateScenarios({ price: Number(values.price), acquisition: Number(values.acquisition), holding: Number(values.holding), selling: Number(values.selling), inflation: Number(values.inflation), years: Number(values.years), monthlyRent: Number(values.monthlyRent), rates: [Number(values.rate0), Number(values.rate1), Number(values.rate2)] });
  } catch (cause) { error = (cause as Error).message; }
  return <div className="scenario-grid"><section className="panel padded"><h2>Your investment assumptions</h2><p className="muted">The APK&apos;s three growth scenarios, with acquisition costs, fixed annual holding costs and inflation. All rates are editable assumptions.</p><div className="form-grid">{fields.map(field => <label className="field" key={field.key}><span>{field.label}</span><input aria-label={field.label} type="number" required min={field.min} max={field.max} step={field.step} value={values[field.key]} onChange={event => setValues({ ...values, [field.key]: event.target.value })} /></label>)}</div>{error && <p className="error" role="alert">{error}</p>}</section><section className="panel padded"><h2>Compare the scenarios</h2><p className="footnote">Illustrative outcomes, not forecasts. Nearby landmarks and plot codes do not determine these rates.</p>{results.map(result => <div key={result.label} style={{ borderTop: '1px solid #e3e8ee', marginTop: 18, paddingTop: 16 }}><h3>{result.label} · {result.rate}% annually</h3><div className="fact"><span>Gross exit price</span><b>{money(result.gross)}</b></div><div className="fact"><span>Purchase plus acquisition costs</span><b>{money(result.upfront)}</b></div><div className="fact"><span>Total holding costs</span><b>{money(result.holdingCosts)}</b></div><div className="fact"><span>Total rental income</span><b>{money(result.rent)}</b></div><div className="fact"><span>Selling costs</span><b>{money(result.sellingCosts)}</b></div><div className="fact"><span>Net gain / loss before tax</span><b>{money(result.profit)}</b></div><div className="fact"><span>Net sale proceeds in today&apos;s money</span><b>{money(result.realNetSale)}</b></div></div>)}<p className="footnote">Constant annual growth, flat rent and flat annual holding costs. Financing, vacancy and taxes are excluded. Enter acquisition costs yourself; defaults do not include stamp duty.</p></section></div>;
}
