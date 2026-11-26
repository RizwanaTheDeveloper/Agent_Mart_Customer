export type ScenarioInputs = { price: number; acquisition: number; holding: number; selling: number; inflation: number; rates: number[]; years: number; monthlyRent: number };

export function calculateScenarios(input: ScenarioInputs) {
  const { price, acquisition, holding, selling, inflation, years, monthlyRent, rates } = input;
  if (![price, acquisition, holding, selling, inflation, years, monthlyRent, ...rates].every(Number.isFinite) || price <= 0 || acquisition < 0 || acquisition > 30 || holding < 0 || selling < 0 || selling > 30 || inflation < 0 || inflation > 20 || !Number.isInteger(years) || years < 1 || years > 30 || monthlyRent < 0 || rates.length !== 3 || rates.some(rate => rate < -20 || rate > 40)) throw Error('Complete the assumptions within the displayed limits.');
  const upfront = price * (1 + acquisition / 100), holdingCosts = holding * years, rent = monthlyRent * 12 * years;
  return rates.map((rate, index) => {
    const gross = price * (1 + rate / 100) ** years, sellingCosts = gross * selling / 100, netSale = gross - sellingCosts;
    return { label: ['Downside', 'Moderate', 'Higher-growth'][index], rate, gross, sellingCosts, netSale, upfront, holdingCosts, rent, profit: netSale + rent - upfront - holdingCosts, realNetSale: netSale / (1 + inflation / 100) ** years };
  });
}
