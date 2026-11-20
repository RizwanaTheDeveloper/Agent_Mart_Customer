// Firm sessions, private data, role permissions, and demo state.
// Browser document source; assembled in source-manifest.json order.
const Firm = {
  mode: 'local',
  token: '',
  endpoint: localStorage.getItem('firm_endpoint_300') || '',
  data: null,
  lastSync: '',
  busy: false,
  stale: false,
  editVersion: null,
  pending: new Map(),
  retries: new Map(),
  demoUser: 'do'
};
const original = {
  header,
  render,
  home,
  detail,
  edit,
  saveProperty,
  deleteProperty,
  persist
};
function enterprise() {
  return Firm.mode === 'demo' || Firm.mode === 'live' && !!Firm.token && !!Firm.data?.firm;
}
function role() {
  return Firm.data?.user?.role || 'viewer';
}
function manager() {
  return ['owner', 'manager'].includes(role());
}
function writable() {
  return ['owner', 'manager', 'agent'].includes(role());
}
function privateKey() {
  return 'firm_private_' + hash(Firm.endpoint + '|' + (Firm.data?.user?.id || 'demo'));
}
function firmReceive(id, result) {
  const p = Firm.pending.get(id);
  if (!p) return;
  Firm.pending.delete(id);
  clearTimeout(p.timer);
  p.resolve(result);
}
window.firmReceive = firmReceive;
