function sessionBanner() {
  return '';
}
function portalPage() {
  $('app').innerHTML = `<div class="portalhero"><div class="eyebrow">AGENT MART • BUY & SELL WITH CONTEXT</div><h1>Find your next place.<br><em>Understand every detail.</em></h1><p>A separate workspace for property buyers and sellers, with source-led plot and flat insights.</p><div class="portalart">${buildingArt()}</div></div><div class="rolecards"><button class="rolecard" onclick="chooseMarketSide('buyer')"><span class="roleicon">${icon('search')}</span><h2>I'm a buyer</h2><p>Explore, compare, ask questions and track your property journey.</p><strong>Buyer sign in →</strong></button><button class="rolecard sellerrole" onclick="chooseMarketSide('seller')"><span class="roleicon">${icon('home')}</span><h2>I'm a seller</h2><p>List property, manage buyer enquiries and control document access.</p><strong>Seller sign in →</strong></button></div><div class="trustline"><span>Separate accounts</span><span>Evidence-linked insights</span><span>Private documents</span></div><div class="panel"><div class="row"><h3>Explore before connecting</h3><span class="tag amber">DEMO</span></div><p class="mini muted">Fictional listings and reports show the full flow. Live accounts require your deployed HTTPS backend.</p><div class="row"><button class="btn secondary grow" onclick="startMarketDemo('buyer')">Buyer demo</button><button class="btn outline grow" onclick="startMarketDemo('seller')">Seller demo</button></div></div><button class="btn outline full" onclick="go('firmSettings')">Connect deployed backend</button>`;
}
function chooseMarketSide(side) {
  Market.side = side;
  go('marketAuth', {
    side,
    mode: 'login'
  });
}
function marketAuthPage() {
  const side = args.side || Market.side || 'buyer',
    mode = args.mode || 'login';
  Market.side = side;
  const seller = side === 'seller';
  $('app').innerHTML = `${backbtn()}<div class="authwelcome"><span class="tag">${seller ? 'SELLER / FIRM' : 'BUYER'} ACCOUNT</span><h1>${mode === 'login' ? 'Welcome back.' : mode === 'join' ? 'Join your firm.' : 'Start your property journey.'}</h1><p>${seller ? 'Your inventory, enquiries and source documents.' : 'Your shortlist, comparisons, conversations and visits.'}</p></div><div class="chips">${[['login', 'Sign in'], ['register', 'Create account'], ...(seller ? [['join', 'Staff invitation']] : [])].map(([m, l]) => `<button class="chip ${mode === m ? 'active' : ''}" onclick="args.mode='${m}';marketAuthPage()">${l}</button>`).join('')}</div><form class="panel" onsubmit="marketAuthenticate(event,'${side}','${mode}')">${mode !== 'login' ? input('Your name', 'name', '', 'text', true) : ''}${seller && mode === 'register' ? input('Seller / real estate firm name', 'firmName', '', 'text', true) : ''}${input('Email', 'email', '', 'email', true)}${input('Password / passphrase', 'password', '', 'password', true, `minlength="${mode === 'login' ? 10 : 15}" maxlength="200" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}"`)}${mode === 'join' ? input('One-time staff invitation code', 'inviteCode', '', 'text', true) : ''}${mode === 'login' ? input('Authenticator / recovery code (if enabled)', 'otp', '', 'text', false, 'autocomplete="one-time-code"') : ''}<div class="space"></div><button class="btn full" type="submit">${mode === 'login' ? 'Sign in to ' + side + ' dashboard' : mode === 'join' ? 'Accept staff invitation' : 'Create ' + side + ' account'}</button></form><p class="tabnote">${Firm.endpoint ? 'Backend: ' + esc(Firm.endpoint) : 'No backend configured. Connect your hosted server before creating real accounts.'}</p><button class="btn outline full" onclick="go('firmSettings')">Connection settings</button><p class="footertext">Buyer and seller accounts have different permissions. A sign-in or authenticator code does not verify property ownership. Password recovery requires your server administrator; automated recovery email is not configured.</p>`;
}
async function marketAuthenticate(e, side, mode) {
  e.preventDefault();
  const b = e.target.querySelector('[type=submit]');
  b.disabled = true;
  try {
    const d = Object.fromEntries(new FormData(e.target));
    d.expectedSide = side;
    const path = mode === 'login' ? '/api/auth/login' : mode === 'join' ? '/api/auth/join' : side === 'buyer' ? '/api/auth/register-buyer' : '/api/auth/register';
    const origin = Firm.endpoint,
      r = await firmCall('POST', path, d);
    if (origin !== Firm.endpoint) throw Error('Backend changed. Sign in again.');
    Market.side = r.user.role === 'buyer' ? 'buyer' : 'seller';
    Market.demo = false;
    Market.user = r.user;
    Firm.token = r.token;
    Firm.mode = buyerSide() ? 'buyer-live' : 'live';
    Firm.data = {
      user: r.user
    };
    Market.requests = [];
    restoreLocal();
    loadBuyerPrivate();
    await refreshMarket(false);
    route = buyerSide() ? 'buyerHome' : 'sellerHome';
    args = {};
    stack = [];
    render();
    window.scrollTo(0, 0);
  } catch (e) {
    toast(e.message);
  } finally {
    b.disabled = false;
  }
}
