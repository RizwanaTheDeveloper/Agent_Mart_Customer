function t(en, te) {
  return state.lang === 'te' ? te : en;
}
function header() {
  $('header').innerHTML = `<div class="mark">${icon('home')}</div><div class="brand"><strong>Agent Mart</strong><small>PROPERTY • AMARAVATI & BEYOND</small></div><button class="iconbtn" aria-label="Change language" onclick="toggleLang()">${state.lang === 'en' ? 'తె' : 'EN'}</button><button class="iconbtn" aria-label="Add property" onclick="go('edit')">${icon('plus')}</button>`;
  const active = ['detail', 'edit'].includes(route) ? 'home' : route === 'ref' ? 'crda' : route;
  $('nav').innerHTML = [['home', 'Properties', 'ప్రాపర్టీలు'], ['map', 'Map', 'మ్యాప్'], ['legal', 'Legal search', 'లీగల్ సెర్చ్'], ['crda', 'CRDA plots', 'CRDA ప్లాట్లు'], ['saved', 'Saved', 'సేవ్ చేసినవి']].map(([id, en, te]) => `<button class="${active === id ? 'active' : ''}" onclick="go('${id}')" aria-label="${en}">${icon(id)}<span>${t(en, te)}</span></button>`).join('');
}
function toggleLang() {
  state.lang = state.lang === 'en' ? 'te' : 'en';
  persist();
  render();
}
function go(r, a = {}) {
  stack.push({
    route,
    args,
    scroll: window.scrollY
  });
  route = r;
  args = a;
  render();
  window.scrollTo(0, 0);
}
function back() {
  const prev = stack.pop();
  if (prev) {
    route = prev.route;
    args = prev.args;
    render();
    window.scrollTo(0, prev.scroll);
    return true;
  }
  if (route !== 'home') {
    route = 'home';
    args = {};
    render();
    return true;
  }
  return false;
}
window.androidBack = back;
const backbtn = () => `<button class="back" onclick="back()">${icon('back')} ${t('Back', 'వెనుకకు')}</button>`;
function render() {
  header();
  try {
    ({
      home: home,
      detail: detail,
      edit: edit,
      map: mapPage,
      legal: legal,
      crda: crda,
      ref: refDetail,
      saved: savedPage,
      preview: previewPage,
      about: aboutPage
    }[route] || home)();
  } catch (e) {
    $('app').innerHTML = `<div class="empty"><h2>Unable to open this view</h2><p>Your saved data is retained.</p><button class="btn" onclick="go('home')">Properties</button></div>`;
    console.error(e);
  }
}
