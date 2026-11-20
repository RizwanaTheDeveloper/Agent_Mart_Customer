// Enquiries, conversations, visits, and private documents.
// Browser document source; assembled in source-manifest.json order.
async function submitMarketEnquiry(e, id) {
  e.preventDefault();
  const b = e.target.querySelector('button');
  b.disabled = true;
  try {
    const d = Object.fromEntries(new FormData(e.target));
    d.contactConsent = $('enquiryConsent').checked;
    let result;
    if (Market.demo) {
      let r = marketDemo.requests.find(r => r.propertyId === id);
      if (!r) {
        r = {
          id: uid('demoReq'),
          propertyId: id,
          propertyTitle: marketDemo.properties.find(p => p.id === id).title,
          buyerName: 'Customer',
          status: 'Pending',
          version: 1,
          messages: [],
          documents: [],
          created: new Date().toISOString(),
          demoPhone: d.phone
        };
        marketDemo.requests.unshift(r);
      }
      r.messages.push({
        id: uid('m'),
        sender_id: 'demoBuyer',
        body: d.message,
        created: new Date().toISOString()
      });
      saveMarketDemo();
      Market.requests = marketDemo.requests;
      result = {
        id: r.id
      };
    } else result = await marketCall('POST', '/api/market/properties/' + id + '/enquire', d);
    go('marketThread', {
      id: result.id
    });
    toast('Enquiry submitted');
  } catch (e) {
    toast(e.message);
  } finally {
    b.disabled = false;
  }
}
async function requestsMarket() {
  const session = Firm.token;
  if (marketLive()) await refreshMarket(false);
  if (route !== 'marketRequests' || session !== Firm.token) return;
  $('app').innerHTML = `${sessionBanner()}<div class="eyebrow">CONVERSATIONS, CONTACT & VISITS</div><h1>${buyerSide() ? 'My enquiries' : 'Buyer enquiries'}</h1><div class="panel">${Market.requests.map(r => `<div class="listrow" onclick="go('marketThread',{id:'${r.id}'})"><div class="row"><strong>${esc(buyerSide() ? r.propertyTitle : r.buyerName)}</strong><span class="tag">${esc(r.status)}</span></div><small>${esc(r.propertyTitle)}</small><small>${new Date(r.created).toLocaleDateString('en-IN')} · ${r.messages.length} messages</small></div>`).join('') || '<p class="muted">No enquiries yet.</p>'}</div>`;
}
async function threadMarket() {
  const session = Firm.token,
    requestId = args.id;
  let r = Market.requests.find(r => r.id === args.id);
  if (!Market.demo) {
    try {
      r = (await marketCall('GET', '/api/market/requests/' + args.id)).request;
    } catch (e) {
      $('app').innerHTML = empty('Enquiry unavailable', esc(e.message));
      return;
    }
  }
  if (!r) {
    $('app').innerHTML = empty('No conversation', 'Go back to your enquiries.');
    return;
  }
  if (route !== 'marketThread' || args.id !== requestId || session !== Firm.token) return;
  Market.thread = r;
  $('app').innerHTML = `${backbtn()}${sessionBanner()}<div class="row"><h2>${esc(r.propertyTitle)}</h2><span class="tag">${esc(r.status)}</span></div><p class="mini muted">${buyerSide() ? 'Your conversation with the seller.' : 'Buyer: ' + esc(r.buyerName)}</p>${r.status === 'Accepted' ? `<div class="contactcard"><strong>Contact released by consent</strong><small>Phone is user-supplied, not identity-verified.</small>${(buyerSide() ? r.sellerPhone : r.buyerPhone) && /^\d{10}$/.test(buyerSide() ? r.sellerPhone : r.buyerPhone) ? `<a class="btn outline" href="tel:+91${buyerSide() ? r.sellerPhone : r.buyerPhone}">Call ${buyerSide() ? 'seller' : 'buyer'}</a>` : '<small>No real contact supplied in this record.</small>'}</div>` : '<div class="notice blue">Contact details stay hidden until the seller accepts this enquiry.</div>'}<div class="conversation">${r.messages.map(m => `<div class="bubble ${m.sender_id === Market.user.id ? 'mine' : ''}"><small>${m.sender_id === Market.user.id ? 'You' : buyerSide() ? 'Seller' : 'Buyer'}</small><p>${esc(m.body)}</p><small>${new Date(m.created).toLocaleString('en-IN')}</small></div>`).join('')}</div>${['Pending', 'Accepted'].includes(r.status) ? `<form class="panel" onsubmit="sendMarketMessage(event,'${r.id}')"><label>Message to ${buyerSide() ? 'seller' : 'buyer'}</label><textarea name="message" required maxlength="2000"></textarea><div class="space"></div><button class="btn full">Send message</button></form>` : ''}${!buyerSide() && r.status === 'Pending' && sellerAdmin() ? `<div class="row"><button class="btn grow" onclick="requestDecision('${r.id}','accept')">Accept enquiry</button><button class="btn outline grow" onclick="requestDecision('${r.id}','decline')">Decline</button></div>` : ''}${r.status === 'Accepted' ? visitPanel(r) + documentPanel(r) : ''}<p class="footertext">Messages are shared with this enquiry's participants. Internal CRM notes are separate. Closing an enquiry stops future conversation and document access; it cannot recall details or files already received.</p>`;
}
async function sendMarketMessage(e, id) {
  e.preventDefault();
  const b = e.target.querySelector('button');
  b.disabled = true;
  try {
    if (Market.demo) {
      const r = marketDemo.requests.find(r => r.id === id);
      r.messages.push({
        id: uid('m'),
        sender_id: Market.user.id,
        body: e.target.message.value,
        created: new Date().toISOString()
      });
      saveMarketDemo();
    } else await marketCall('POST', '/api/market/requests/' + id + '/message', {
      message: e.target.message.value
    });
    threadMarket();
  } catch (e) {
    toast(e.message);
  } finally {
    b.disabled = false;
  }
}
async function requestDecision(id, action) {
  try {
    if (Market.demo) {
      let r = marketDemo.requests.find(r => r.id === id);
      r.status = action === 'accept' ? 'Accepted' : 'Declined';
      r.version++;
      r.buyerPhone = '';
      r.sellerPhone = '';
      saveMarketDemo();
    } else await marketCall('POST', '/api/market/requests/' + id + '/' + action, {
      version: Market.thread.version
    });
    await refreshMarket(false);
    threadMarket();
  } catch (e) {
    toast(e.message);
  }
}
function visitPanel(r) {
  return `<div class="panel"><h2>Site visit</h2>${r.visit ? `<strong>${new Date(r.visit.scheduled).toLocaleString('en-IN')}</strong><p><span class="tag">${esc(r.visit.status)}</span> ${r.buyerConfirmedVisit ? '<span class="tag">Buyer confirmed in app</span>' : ''}</p>${buyerSide() && r.visit.status === 'Proposed' ? `<button class="btn full" onclick="confirmMarketVisit('${r.id}')">Confirm this proposal</button>` : ''}` : '<p class="muted">No visit proposed yet.</p>'}${!buyerSide() ? `<form onsubmit="proposeMarketVisit(event,'${r.id}')"><label>Propose a future time</label><input name="scheduled" type="datetime-local" required><label>Public meeting notes</label><input name="note" maxlength="1000"><div class="space"></div><button class="btn secondary full">Send visit proposal</button></form>` : ''}</div>`;
}
async function proposeMarketVisit(e, id) {
  e.preventDefault();
  try {
    const d = Object.fromEntries(new FormData(e.target));
    d.scheduled = new Date(d.scheduled).toISOString();
    if (Market.demo) {
      let r = marketDemo.requests.find(r => r.id === id);
      r.visit = {
        id: uid('v'),
        scheduled: d.scheduled,
        status: 'Proposed',
        version: 1
      };
      r.buyerConfirmedVisit = false;
      saveMarketDemo();
    } else await marketCall('POST', '/api/market/requests/' + id + '/propose-visit', d);
    threadMarket();
  } catch (e) {
    toast(e.message);
  }
}
async function confirmMarketVisit(id) {
  try {
    if (Market.demo) {
      const r = marketDemo.requests.find(r => r.id === id);
      r.visit.status = 'Confirmed';
      r.visit.version++;
      r.buyerConfirmedVisit = true;
      saveMarketDemo();
    } else await marketCall('POST', '/api/market/requests/' + id + '/confirm-visit', {
      visitVersion: Market.thread.visit.version
    });
    threadMarket();
  } catch (e) {
    toast(e.message);
  }
}
