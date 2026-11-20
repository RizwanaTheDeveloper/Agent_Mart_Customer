function saveProperty(e) {
  e.preventDefault();
  const f = new FormData(e.target),
    old = state.listings.find(p => p.id === args.id),
    v = Object.fromEntries(f);
  for (const k of ['price', 'area', 'lat', 'lon', 'road', 'bhk']) v[k] = num(v[k]);
  v.plotCode = canonical(v.plotCode);
  if (v.plotCode && !/^\d{1,3}-\d{1,4}-\d{1,5}-\d{1,5}-[A-Z0-9]{1,8}$/.test(v.plotCode)) {
    toast('Use the CRDA plot-code format shown on your record.');
    return;
  }
  if ((v.lat !== null || v.lon !== null) && !coords(v.lat, v.lon)) {
    toast('Supply both valid latitude and longitude.');
    return;
  }
  if (v.status === 'Available' && ['Plot', 'Farm land'].includes(v.type) && v.purpose === 'Sale' && !v.survey && !v.plotCode) {
    toast('Add a survey number or CRDA plot code before marking land available.');
    return;
  }
  const p = {
    ...old,
    ...v,
    id: old?.id || uid('p'),
    demo: old?.demo || false,
    photo: photoDraft,
    updatedAt: new Date().toISOString()
  };
  if (old) state.listings = state.listings.map(x => x.id === p.id ? p : x);else state.listings.unshift(p);
  if (persist()) {
    toast('Property saved on this device');
    route = 'detail';
    args = {
      id: p.id
    };
    render();
    window.scrollTo(0, 0);
  }
}
function deleteProperty(id) {
  if (!confirm('Delete this local property and its private checklist?')) return;
  state.listings = state.listings.filter(p => p.id !== id);
  state.saved = state.saved.filter(x => x !== id);
  delete state.checks[id];
  delete state.notes[id];
  if (persist()) {
    route = 'home';
    args = {};
    stack = [];
    render();
    toast('Property deleted');
  }
}
async function readPhoto(el) {
  const file = el.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    toast('Choose a photo below 8 MB.');
    return;
  }
  try {
    const data = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    const img = await new Promise((res, rej) => {
      let i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = data;
    });
    const c = document.createElement('canvas'),
      s = Math.min(1, 1000 / img.width, 1000 / img.height);
    c.width = img.width * s;
    c.height = img.height * s;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    photoDraft = c.toDataURL('image/jpeg', .7);
    $('photopreview').innerHTML = `<img class="photo-preview" src="${photoDraft}" alt="Selected property photo"><button type="button" onclick="photoDraft='';$('photopreview').innerHTML=''">Remove photo</button>`;
  } catch (e) {
    toast('This file is not a supported photo.');
  }
}
