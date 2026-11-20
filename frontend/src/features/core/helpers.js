// Shared helpers, device storage, seed listings, and navigation.
// Browser document source; assembled in source-manifest.json order.
'use strict';

const $ = id => document.getElementById(id),
  KEY = 'agentmart_property_200',
  GIS = 'https://gis.apcrda.org/server/rest/services/LSP19Aug2026/MapServer/0',
  FIELDS = 'objectid,plot_code,plot_no,lu_desc,extn_sqyrd,area_sqm,rd_width_m,township,colony,block,district,mandal,village,lpsvillage,rs_no,zoning,latitude,longitude';
const paths = {
  home: 'M3 10 12 3l9 7M5 9v12h14V9M9 21v-8h6v8',
  map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16M15 5v16',
  legal: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6ZM8 12l3 3 5-6',
  crda: 'M4 7h16M4 12h16M4 17h16M8 4v16M16 4v16',
  saved: 'M6 3h12v18l-6-4-6 4Z',
  plus: 'M12 4v16M4 12h16',
  search: 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  back: 'M15 5l-7 7 7 7',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  share: 'M8 12l8-6M8 12l8 6M8 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0M22 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M22 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0'
};
const icon = k => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[k] || paths.home}"/></svg>`;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
const clean = v => String(v ?? '').trim().slice(0, 250),
  num = v => v === '' || v === null || v === undefined ? null : Number.isFinite(Number(v)) ? Number(v) : null;
const money = n => !Number(n) ? 'Price not supplied' : Number(n) >= 1e7 ? '₹' + (n / 1e7).toFixed(2).replace(/0+$/, '').replace(/\.$/, '') + ' Cr' : Number(n) >= 1e5 ? '₹' + (n / 1e5).toFixed(2).replace(/0+$/, '').replace(/\.$/, '') + ' Lakh' : '₹' + Number(n).toLocaleString('en-IN');
const fmt = n => n === null || n === undefined || n === '' ? 'Not supplied' : Number.isFinite(Number(n)) ? Number(n).toLocaleString('en-IN', {
  maximumFractionDigits: 2
}) : esc(n);
const hash = s => {
  let h = 0;
  for (const c of s) h = Math.imul(31, h) + c.charCodeAt(0) | 0;
  return (h >>> 0).toString(36);
};
const uid = prefix => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const coords = (lat, lon) => num(lat) !== null && num(lon) !== null && Math.abs(+lat) <= 85 && Math.abs(+lon) <= 180 && !(+lat === 0 && +lon === 0);
const canonical = s => clean(s).toUpperCase().replace(/\s/g, '');
function toast(s) {
  $('toast').textContent = s;
  $('toast').style.display = 'block';
  clearTimeout(window.tt);
  window.tt = setTimeout(() => $('toast').style.display = 'none', 4200);
}
