async function securityMarket() {
  const session = Firm.token;
  if (Market.demo) {
    $('app').innerHTML = `${backbtn()}<div class="eyebrow">ACCOUNT PROTECTION</div><h1>Security controls</h1><div class="notice">Offline demo: no real passwords, authenticator factors or document encryption keys are created here.</div><div class="panel"><h2>Available in connected mode</h2><ul class="insightlist"><li>Server-side account and firm isolation.</li><li>Optional authenticator-based MFA and single-use recovery codes.</li><li>Active-session list and session revocation.</li><li>Encrypted private documents with expiring buyer grants.</li><li>One-use downloads that recheck grants and sessions.</li></ul><p class="mini muted">No software build is a complete-security guarantee. Production email/phone verification, malware scanning, security review and device testing are not certified by this demo.</p></div>`;
    return;
  }
  try {
    const [s, list] = await Promise.all([marketCall('GET', '/api/security/status'), marketCall('GET', '/api/security/sessions')]);
    if (route !== 'marketSecurity' || session !== Firm.token) return;
    Market.security = s;
    $('app').innerHTML = `${backbtn()}<div class="eyebrow">YOUR ACCOUNT, YOUR CONTROL</div><h1>Security centre</h1><div class="panel"><div class="row"><h2>Authenticator protection</h2><span class="tag">${s.mfaEnabled ? 'Enabled' : 'Not enabled'}</span></div><p class="mini muted">Time-based authenticator codes, with recovery codes kept offline. This is not a property verification badge.</p>${s.mfaEnabled ? `<small>${s.recoveryRemaining} recovery codes remain.</small><form onsubmit="disableMarketMfa(event)">${input('Current password', 'password', '', 'password', true)}${input('Authenticator / recovery code', 'otp', '', 'text', true)}<div class="space"></div><button class="btn outline full">Disable authenticator protection</button></form>` : s.encryptionConfigured ? `<form onsubmit="setupMarketMfa(event)">${input('Confirm current password', 'password', '', 'password', true)}<div class="space"></div><button class="btn full">Set up authenticator</button></form>` : '<div class="notice">Server encryption key must be configured before authenticator setup or private document upload can be enabled.</div>'}<div id="mfaSetup"></div></div><div class="panel"><h2>Active sessions</h2>${list.sessions.map(x => `<div class="listrow"><strong>${x.current ? 'This session' : 'Other session'}</strong><small>${esc(x.label)}<br>Expires ${new Date(x.expires * 1000).toLocaleString('en-IN')}</small><button class="btn outline" onclick="revokeMarketSession('${x.id}')">Revoke ${x.current ? 'and sign out' : 'session'}</button></div>`).join('')}</div><div class="panel"><h2>Change password</h2><form onsubmit="changeMarketPassword(event)">${input('Current password', 'currentPassword', '', 'password', true)}${input('New passphrase (15+ characters)', 'newPassword', '', 'password', true, 'minlength="15" maxlength="200"')}${input('Authenticator / recovery code, if enabled', 'otp')}<div class="space"></div><button class="btn secondary full">Change password & revoke all sessions</button></form></div>`;
  } catch (e) {
    toast(e.message);
  }
}
async function setupMarketMfa(e) {
  e.preventDefault();
  try {
    const r = await marketCall('POST', '/api/security/mfa/setup', {
      password: e.target.password.value
    });
    Market.setup = r;
    $('mfaSetup').innerHTML = `<div class="notice blue">Add a manual account in your authenticator app: issuer Agent Mart, account ${esc(r.account)}. This secret is shown only for setup and must not be shared.</div><label>Manual setup key</label><textarea readonly>${esc(r.secret)}</textarea><form onsubmit="confirmMarketMfa(event)">${input('Current 6-digit authenticator code', 'otp', '', 'text', true, 'pattern="[0-9]{6}" maxlength="6"')}<div class="space"></div><button class="btn full">Confirm setup</button></form>`;
  } catch (e) {
    toast(e.message);
  }
}
async function confirmMarketMfa(e) {
  e.preventDefault();
  try {
    const r = await marketCall('POST', '/api/security/mfa/confirm', {
      otp: e.target.otp.value
    });
    Market.setup = null;
    Market.recovery = r.recoveryCodes;
    $('mfaSetup').innerHTML = `<div class="notice">Authenticator enabled. Save these recovery codes offline now. They are not saved in app storage and each can be used only once.</div><textarea readonly style="min-height:220px">${esc(r.recoveryCodes.join('\n'))}</textarea><button class="btn secondary full" onclick="Market.recovery=[];securityMarket()">I saved the codes; close this view</button>`;
  } catch (e) {
    toast(e.message);
  }
}
async function disableMarketMfa(e) {
  e.preventDefault();
  try {
    await marketCall('POST', '/api/security/mfa/disable', Object.fromEntries(new FormData(e.target)));
    securityMarket();
    toast('Authenticator disabled; other sessions revoked');
  } catch (e) {
    toast(e.message);
  }
}
async function revokeMarketSession(id) {
  try {
    const r = await marketCall('DELETE', '/api/security/sessions/' + id);
    if (r.currentRevoked) await marketLogout();else securityMarket();
  } catch (e) {
    toast(e.message);
  }
}
async function changeMarketPassword(e) {
  e.preventDefault();
  try {
    await marketCall('POST', '/api/auth/password', Object.fromEntries(new FormData(e.target)));
    Firm.token = '';
    await marketLogout();
    toast('Password changed; sign in again on each device');
  } catch (e) {
    toast(e.message);
  }
}
route = 'portal';
args = {};
stack = [];
render();

// Keep the v3.1 property-first workflow; account services remain optional.
