function documentPanel(r) {
  return `<div class="panel"><h2>Controlled document access</h2><p class="mini muted">Sharing applies to this buyer only. Grants expire after 24 hours. Revoking access cannot remove copies already downloaded.</p>${r.documents.map(d => `<div class="listrow"><div class="row"><strong>${esc(d.label)}</strong><span class="tag ${d.accessGranted ? '' : 'gray'}">${d.accessGranted ? 'Access granted' : 'Restricted'}</span></div>${buyerSide() ? d.accessGranted ? `<button class="btn outline" onclick="downloadDocument('${d.id}',this)">Create secure download link</button>` : '<small>Ask the seller to release this record.</small>' : sellerAdmin() ? `<form onsubmit="grantDocument(event,'${r.id}','${d.id}',${d.accessGranted ? 'true' : 'false'})">${input('Confirm account password', 'password', '', 'password', true)}${input('Authenticator / recovery code, if enabled', 'otp')}<div class="space"></div><button class="btn ${d.accessGranted ? 'outline' : 'secondary'}">${d.accessGranted ? 'Revoke future access' : 'Grant this buyer 24-hour access'}</button></form>` : ''}</div>`).join('') || '<p class="muted">No source documents uploaded. Request specific documents in the conversation.</p>'}</div>`;
}
async function uploadPrivateDocument(e, id) {
  e.preventDefault();
  if (Market.demo) return;
  const f = e.target.documentFile.files[0];
  if (!f || f.size > 512000) {
    toast('Choose a PDF/JPEG/PNG below 500 KiB');
    return;
  }
  const b = e.target.querySelector('button');
  b.disabled = true;
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
    await marketCall('POST', '/api/market/properties/' + id + '/documents', {
      filename: f.name,
      mime: f.type,
      label: e.target.elements.namedItem('label').value,
      data: base64
    });
    toast('Document encrypted and stored privately');
  } catch (e) {
    toast(e.message);
  } finally {
    b.disabled = false;
  }
}
async function grantDocument(e, rid, did, revoke) {
  e.preventDefault();
  try {
    const d = Object.fromEntries(new FormData(e.target));
    await marketCall('POST', '/api/market/requests/' + rid + '/grant-document', {
      ...d,
      documentId: did,
      revoke
    });
    threadMarket();
  } catch (e) {
    toast(e.message);
  }
}
async function downloadDocument(id, b) {
  try {
    const r = await marketCall('POST', '/api/market/documents/' + id + '/ticket');
    b.outerHTML = `<a class="btn" href="${esc(Firm.endpoint + r.path)}" rel="noreferrer">Open one-time download (60 seconds)</a>`;
  } catch (e) {
    toast(e.message);
  }
}
