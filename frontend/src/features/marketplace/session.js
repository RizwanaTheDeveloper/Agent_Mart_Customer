function startMarketDemo(side) {
  Firm.token = '';
  Firm.mode = side === 'buyer' ? 'buyer-demo' : 'demo';
  Market.demo = true;
  Market.side = side;
  Market.user = side === 'buyer' ? {
    id: 'demoBuyer',
    name: 'Customer',
    email: 'buyer@example.invalid',
    role: 'buyer'
  } : {
    id: 'do',
    name: 'Ravi • Seller',
    email: 'seller@example.invalid',
    role: 'owner'
  };
  Firm.data = freshDemo();
  Firm.data.user = Market.user;
  Firm.data.properties = marketDemo.properties;
  Market.inventory = marketDemo.properties;
  Market.catalog = marketDemo.properties.filter(p => p.published);
  Market.requests = marketDemo.requests;
  Market.saved = marketDemo.saved;
  Market.profile = marketDemo.profile;
  state.listings = Market.inventory;
  loadBuyerPrivate();
  route = side === 'buyer' ? 'buyerHome' : 'sellerHome';
  args = {};
  stack = [];
  render();
}
function loadBuyerPrivate() {
  if (!buyerSide()) return;
  let v = {};
  try {
    v = JSON.parse(localStorage.getItem('market_private_' + hash(Firm.endpoint + '|' + Market.user.id)) || '{}');
  } catch (e) {}
  state.checks = v.checks || {};
  state.notes = v.notes || {};
}
persist = function () {
  if (Market.user && buyerSide()) {
    try {
      const b = JSON.parse(localStorage.getItem(KEY) || lastGood);
      b.refs = state.refs;
      b.imports = state.imports;
      b.lang = state.lang;
      localStorage.setItem(KEY, JSON.stringify(b));
      localStorage.setItem('market_private_' + hash(Firm.endpoint + '|' + Market.user.id), JSON.stringify({
        checks: state.checks,
        notes: state.notes
      }));
      return true;
    } catch (e) {
      toast('Cannot save private notes on this device');
      return false;
    }
  }
  return marketBase.persist();
};
