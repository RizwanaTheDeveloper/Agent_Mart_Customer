// Buyer and seller sessions, catalog data, authentication, and transport.
// Browser document source; assembled in source-manifest.json order.
const Market = {
  side: '',
  demo: false,
  user: null,
  catalog: [],
  inventory: [],
  requests: [],
  saved: [],
  compare: [],
  profile: {},
  active: null,
  thread: null,
  filter: {
    q: '',
    type: '',
    city: '',
    maxPrice: '',
    purpose: ''
  },
  busy: false,
  security: null,
  setup: null,
  recovery: [],
  retry: new Map(),
  edit: null
};
const marketBase = {
  render,
  header,
  persist,
  firmPage,
  saveEndpoint
};
const SELLER_ROLES = ['owner', 'manager', 'agent', 'viewer'];
function marketLive() {
  return !Market.demo && !!Firm.token && !!Market.user;
}
function buyerSide() {
  return Market.side === 'buyer';
}
function sellerAdmin() {
  return Market.user && ['owner', 'manager'].includes(Market.user.role);
}
function sellerWrite() {
  return Market.user && ['owner', 'manager', 'agent'].includes(Market.user.role);
}
