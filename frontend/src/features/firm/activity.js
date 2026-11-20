function activityPage() {
  if (!manager()) {
    $('app').innerHTML = empty('Manager access required', 'Activity history is restricted.');
    return;
  }
  $('app').innerHTML = `${backbtn()}${statusStrip()}<h1>Activity history</h1><div class="panel">${Firm.data.audit.map(a => `<div class="history"><strong>${esc(a.action)}</strong><br>${esc(Firm.data.users.find(u => u.id === a.actor_id)?.name || 'Staff member')}<br><small>${new Date(a.created).toLocaleString('en-IN')} • ${esc(a.entity_id)}</small></div>`).join('') || '<p class="muted">No activity history yet.</p>'}</div><p class="footertext">Latest 100 activity events are shown. Audit entries cannot be edited from the app.</p>`;
}
if (Firm.endpoint && window.AndroidApp?.configureBackend) AndroidApp.configureBackend(Firm.endpoint);
route = 'firm';
args = {};
stack = [];
render();
function passwordPage() {
  $('app').innerHTML = `${backbtn()}<h1>Change your password</h1>${Firm.mode === 'demo' ? '<div class="notice">Offline demo accounts have no real passwords.</div>' : `<form class="panel" onsubmit="saveFirmPassword(event)">${input('Current password', 'currentPassword', '', 'password', true)}${input('New password', 'newPassword', '', 'password', true, 'minlength="10" maxlength="200"')}<div class="space"></div><button class="btn full">Change password & sign out all sessions</button></form>`}`;
}
async function saveFirmPassword(e) {
  e.preventDefault();
  try {
    await firmCall('POST', '/api/auth/password', Object.fromEntries(new FormData(e.target)));
    Firm.token = '';
    await exitFirm();
    toast('Password changed. Sign in again on each device.');
  } catch (e) {
    toast(e.message);
  }
}
const originalAbout = aboutPage;
aboutPage = function () {
  originalAbout();
  $('app').querySelector('.eyebrow').textContent = 'AGENT MART FIRMS • 3.1';
  const first = $('app').querySelector('.panel');
  if (first) first.innerHTML = '<h3>Property and firm workspace</h3><p>Local property tools plus a firm dashboard, four staff roles, branches, assignments, enquiries, follow-ups, visits and reports.</p><p class="mini muted">Live multi-user mode requires the supplied backend to be deployed on your HTTPS server. Offline demo roles do not create shared accounts. CRDA reference records and private legal checklists stay device-local.</p>';
};
