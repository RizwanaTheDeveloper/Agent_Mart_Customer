function filterListings() {
  return state.listings.filter(p => (!view.mine || !p.demo) && (view.type === 'All' || p.type === view.type) && (view.purpose === 'All' || p.purpose === view.purpose) && (!view.max || p.price <= Number(view.max)) && (!view.q || [p.title, p.village, p.city, p.district, p.survey, p.plotCode].join(' ').toLowerCase().includes(view.q.toLowerCase())));
}
function setFilter(k, v) {
  view[k] = v;
  home();
}
