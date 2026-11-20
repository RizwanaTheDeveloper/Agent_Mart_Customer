let state,
  lastGood,
  route = 'home',
  args = {},
  stack = [],
  view = {
    q: '',
    type: 'All',
    purpose: 'All',
    mine: false,
    max: ''
  },
  preview = null,
  sync = {
    code: '',
    village: '',
    offset: 0,
    done: false,
    busy: false,
    loaded: 0
  },
  photoDraft = '',
  editorRef = null,
  editorCopy = null;
try {
  state = JSON.parse(localStorage.getItem(KEY) || 'null');
} catch (e) {}
;
if (!state || state.schema !== 2) state = {
  schema: 2,
  listings: DEMOS,
  refs: [],
  saved: [],
  checks: {},
  notes: {},
  imports: [],
  lang: 'en'
};
lastGood = JSON.stringify(state);
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    lastGood = JSON.stringify(state);
    return true;
  } catch (e) {
    state = JSON.parse(lastGood);
    toast('Device storage is full. Remove a photo or export your data before retrying.');
    return false;
  }
}
