// Buyer preferences, MFA, sessions, and password changes.
// Browser document source; assembled in source-manifest.json order.
function accountMarket() {
  $('app').innerHTML = `${sessionBanner()}<div class="accounthead"><div class="bigavatar">${esc(Market.user.name.slice(0, 1))}</div><h1>${esc(Market.user.name)}</h1><p>${esc(Market.user.email || '')}</p><span class="tag">${buyerSide() ? 'BUYER' : esc(Market.user.role.toUpperCase())}</span></div><div class="panel linklist"><a href="#" onclick="event.preventDefault();go('marketSecurity')">Account security & sessions →</a><a href="#" onclick="event.preventDefault();go('plotAI')">Plot and nearby research →</a><a href="#" onclick="event.preventDefault();go('investment')">10-year investment scenarios →</a>${!buyerSide() ? '<a href="#" onclick="event.preventDefault();go(\'firmMore\')">Firm team, branches & CRM →</a>' : ''}<a href="#" onclick="event.preventDefault();go('firmSettings')">Backend connection →</a><a href="#" onclick="event.preventDefault();go('about')">Data-source information →</a></div>${buyerSide() ? `<form class="panel" onsubmit="saveBuyerPreferences(event)"><h2>My search preferences</h2>${input('Preferred city', 'city', Market.profile.city)}${select('Preferred type', 'type', ['', 'Plot', 'Apartment', 'House', 'Commercial', 'Farm land'], Market.profile.type || '')}${input('Budget ceiling (INR)', 'maxPrice', Market.profile.maxPrice, 'number', false, 'min="0"')}<div class="space"></div><button class="btn secondary full">Save preferences</button></form>` : ''}<button class="btn danger full" onclick="marketLogout()">${Market.demo ? 'Exit demo' : 'Sign out & clear current session'}</button><p class="footertext">Account authentication is not identity proofing or property-ownership verification. Real provider integrations and independent review are still required.</p>`;
}
async function saveBuyerPreferences(e) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  try {
    if (Market.demo) {
      marketDemo.profile = d;
      Market.profile = d;
      saveMarketDemo();
    } else {
      await marketCall('POST', '/api/buyer/preferences', d);
      Market.profile = d;
    }
    toast('Search preferences saved');
  } catch (e) {
    toast(e.message);
  }
}
