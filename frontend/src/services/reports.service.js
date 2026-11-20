function reportsPage() {
  const leads = visibleLeads(),
    props = state.listings,
    visits = visibleVisits(),
    stages = ['New', 'Contacted', 'Qualified', 'Visit planned', 'Negotiation', 'Won', 'Lost'];
  $('app').innerHTML = `${backbtn()}${statusStrip()}<div class="eyebrow">WORKSPACE PERFORMANCE</div><h1>Firm reports</h1><div class="grid"><div class="stat"><div class="pillcount">${props.length}</div><small>visible properties</small></div><div class="stat"><div class="pillcount">${props.filter(p => p.status === 'Available').length}</div><small>available properties</small></div><div class="stat"><div class="pillcount">${leads.length}</div><small>visible enquiries</small></div><div class="stat"><div class="pillcount">${visits.filter(v => v.status === 'Completed').length}</div><small>completed visits</small></div></div><div class="panel" style="margin-top:17px"><h2>Enquiry stages</h2>${stages.map(s => {
    const n = leads.filter(l => l.stage === s).length;
    return `<div class="reportrow"><span>${s}</span><div class="reportbar"><i style="width:${leads.length ? n / leads.length * 100 : 0}%"></i></div><b>${n}</b></div>`;
  }).join('')}</div><div class="panel"><h2>Property availability</h2>${['Draft', 'Available', 'On hold', 'Sold', 'Rented'].map(s => `<div class="row fact"><span>${s}</span><b>${props.filter(p => p.status === s).length}</b></div>`).join('')}</div><div class="notice blue">Counts reflect records visible to your role, capped at the current sync limit. Won is a staff-recorded lead stage, not proof of a completed registered sale.</div><button class="btn outline full" onclick="exportReport()">Share summary CSV</button>`;
}
function exportReport() {
  const rows = [['metric', 'count'], ['visible_properties', state.listings.length], ['available_properties', state.listings.filter(p => p.status === 'Available').length], ['visible_enquiries', visibleLeads().length], ['completed_visits', visibleVisits().filter(v => v.status === 'Completed').length]];
  shareText('Agent Mart firm summary', rows.map(r => r.join(',')).join('\n'));
}
