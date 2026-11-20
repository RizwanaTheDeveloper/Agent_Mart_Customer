// English, Telugu, and Hindi translations and language selector.
// Browser document source; assembled in source-manifest.json order.
const Language43 = {
  code: localStorage.getItem('agentmart_language43') || (['te', 'hi'].includes(state.lang) ? state.lang : 'en'),
  original: new WeakMap(),
  last: new WeakMap(),
  pending: false
};
state.lang = 'en';
