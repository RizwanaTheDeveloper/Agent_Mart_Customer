import assets from './vendor/assets.json';
import { webTheme } from './web-theme';
import { mapAdapter } from './maps';

// The APK's UI is kept in an isolated document. Its storage and Android-only
// bridges are adapted here; it never receives access to the current app store.
export function toolsDocument(storage: Record<string, string>, channel: string) {
  const literal = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
  const script = (value: string) => value.replace(/<\/script/gi, '<\\/script');
  const bootstrap = `
    const channel=${literal(channel)};
    const send=(type,data)=>{const msg=JSON.stringify({channel,type,data});
      if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(msg);
      else parent.postMessage(JSON.parse(msg),'*');};
    const values=${literal(storage)};
    Object.defineProperty(window,'localStorage',{value:{
      getItem:k=>Object.prototype.hasOwnProperty.call(values,k)?values[k]:null,
      setItem:(k,v)=>{values[k]=String(v);send('storage',values)},
      removeItem:k=>{delete values[k];send('storage',values)},
      clear:()=>{Object.keys(values).forEach(k=>delete values[k]);send('storage',values)},
      key:n=>Object.keys(values)[n]||null,get length(){return Object.keys(values).length}
    }});
    const pending=new Map();let sequence=0;
    window.toolsReply=function(id,result){const p=pending.get(id);if(!p)return;pending.delete(id);clearTimeout(p.timer);
      if(result.error)p.reject(Error(result.error));else p.resolve(result);};
    function request(type,data){return new Promise((resolve,reject)=>{const id='bridge'+(++sequence);
      const timer=setTimeout(()=>{pending.delete(id);reject(Error('Source timed out. Please try again.'))},105000);
      pending.set(id,{resolve,reject,timer});send(type,{...data,id});});}
    window.AndroidApp={
      share:(title,text)=>send('share',{title,text}),
      configureBackend:origin=>{try{const u=new URL(origin);return u.protocol==='https:'&&u.origin===origin}catch{return false}},
      firmRequest:raw=>{const r=JSON.parse(raw);request('api',r).then(v=>window.firmReceive(r.id,v)).catch(e=>window.firmReceive(r.id,{status:503,data:{error:e.message}}))}
    };
    const originalFetch=window.fetch.bind(window);
    window.fetch=(input,options)=>{
      if(typeof input==='string'&&/^\\/(crda-query|nearby-query|development-query)\\?/.test(input)){
        return request('source',{path:input}).then(r=>({ok:r.status>=200&&r.status<300,status:r.status,json:async()=>r.data}));
      }
      return originalFetch(input,options);
    };
    document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;
      const href=a.getAttribute('href');if(/^(https?:|tel:|mailto:)/i.test(href)){e.preventDefault();send('link',{url:href})}
    });
    window.addEventListener('message',e=>{if(e.source!==parent||e.data?.channel!==channel)return;
      if(e.data.type==='reply')window.toolsReply(e.data.id,e.data.result);
      if(e.data.type==='navigate'&&['home','map','legal','crda'].includes(e.data.destination))window.toolsGo?.(e.data.destination);
    });
    window.addEventListener('error',()=>send('error',{message:'This tool could not open. Use the tools menu to try another screen.'}));
  `;
  const adaptation = `
    ${mapAdapter}
    // The Buyer map shows only listings that sellers have published, with no sample or reference pins.
    const publishedMap=new Map();
    const baseGo=go;
    go=function(name,a){if(name==='detail'&&a&&publishedMap.has(a.id)){send('open-property',{id:a.id});return}baseGo(name,a)};
    window.openPublished=function(id){send('open-property',{id:id})};
    mapPage=function(){
      $('app').innerHTML='<div class="eyebrow">PUBLISHED PROPERTIES</div><h1>Explore on the map</h1><div id="mainmap" class="map"></div><div class="notice blue" id="mapNote">Loading published properties…</div><div class="panel"><h3>Published properties</h3><div id="mapList"></div></div>';
      makeMap('mainmap',[],[],16.51,80.47,12);
      request('published',{}).then(function(r){
        const all=r.listings||[];publishedMap.clear();all.forEach(function(p){publishedMap.set(p.id,p)});
        const located=all.filter(function(p){return coords(p.lat,p.lon)});
        if(located.length)makeMap('mainmap',located,[],located[0].lat,located[0].lon,located.length>1?12:15);
        $('mapNote').textContent=all.length?located.length+' of '+all.length+' published properties have a confirmed location. Tap a pin to open the property.':'No properties have been published yet.';
        $('mapList').innerHTML=all.map(function(p){return '<div class="listrow" data-id="'+esc(p.id)+'" onclick="openPublished(this.dataset.id)"><strong>'+esc(p.title)+'</strong><small>'+esc(p.village||p.city||'')+(coords(p.lat,p.lon)?'':' • No map location')+'</small></div>'}).join('');
      }).catch(function(e){$('mapNote').textContent='Could not load published properties. '+e.message});
    };
    const embeddedSettings=settingsPage;
    settingsPage=function(){embeddedSettings();const panels=document.querySelectorAll('#app .panel');
      if(panels[1])panels[1].innerHTML='<h3>Compatible server required</h3><p>This APK contains the client only. Use an Agent Mart Firms compatible HTTPS API. The current Seller service has a different API and cannot be used as this connection.</p>';
    };
    const embeddedAuth=marketAuthenticate;
    marketAuthenticate=async function(e,side,mode){if(side!=='buyer'){e.preventDefault();toast('Open Seller from the main workspace switch.');return}return embeddedAuth(e,'buyer',mode)};
    const embeddedCall=firmCall;
    firmCall=async function(method,path,body,key){const result=await embeddedCall(method,path,body,key);
      if(path.startsWith('/api/auth/')&&result.user&&result.user.role!=='buyer')throw Error('Use a Buyer account in Buyer tools.');
      if(path.startsWith('/api/auth/')&&result.user&&result.token){Market.catalog=[];Market.inventory=[];Market.requests=[];Market.saved=[];Market.profile={};state.listings=[];}
      if(path==='/api/platform/public-config'&&!Array.isArray(result?.announcements))throw Error('The server returned an incompatible announcements response.');
      if(path.startsWith('/api/market/catalog')&&!Array.isArray(result?.properties))throw Error('The server returned an incompatible property catalogue.');
      if(path==='/api/buyer/dashboard'&&(!Array.isArray(result?.requests)||!Array.isArray(result?.saved)))throw Error('The server returned an incompatible Buyer dashboard.');
      return result;};
    const embeddedStart=startMarketDemo;
    startMarketDemo=function(){embeddedStart('buyer')};
    const embeddedAbout=aboutPage;
    aboutPage=function(){embeddedAbout();const notice=document.querySelector('#app .notice');if(notice)notice.textContent='Buyer features from the supplied AgentMart Customer 4.5 APK. This workspace runs inside your current app; it does not reuse the APK signing identity. Keep a copy of important device-local records.';};
    const embeddedRender=render;
    render=function(){if(route==='roleEntry'||route==='portal'){route='marketAuth';args={side:'buyer',mode:'login'}}
      if(route==='marketAuth')args.side='buyer';embeddedRender();};
    window.toolsGo=function(routeName){
      if(routeName===route&&Object.keys(args).length===0)return;
      if(routeName==='language'){chooseLanguage43();return}
      if(routeName==='marketAuth'){openRoleAuth('buyer','login');return}
      if(!hasRoleAccount()&&!['firmSettings','about'].includes(routeName)){toast('Sign in or choose Buyer demo first.');return}
      go(routeName);
    };
    startMarketDemo('buyer');
    const demoBar=document.createElement('div');demoBar.id='toolsStatus';
    demoBar.innerHTML='<strong>Buyer tools</strong><span id="toolsMode"></span>';
    document.body.insertBefore(demoBar,document.body.firstChild);
    const menu=document.createElement('details');menu.id='toolsMenu';
    const routes=[['home','Properties & insights'],['map','Map'],['legal','Legal checklist & notes'],['crda','CRDA records & import'],['plotAI','Plot research'],['development','Development research notes'],['investment','Investment scenarios'],['marketSaved','Saved tools properties'],['marketCompare','Detailed comparison'],['marketRequests','Interests, messages & visits'],['marketAccount','Buyer profile & preferences'],['marketSecurity','Account security'],['firmSettings','Server connection'],['marketAuth','Buyer login / registration'],['language','Language'],['about','About & sources']];
    menu.innerHTML='<summary>Choose a Buyer tool</summary><div class="toolsLinks">'+routes.map(([r,label])=>'<button type="button" data-route="'+r+'">'+label+'</button>').join('')+'<button type="button" id="toolsDemo">Restart Buyer demo</button></div>';
    demoBar.after(menu);
    menu.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;menu.open=false;
      if(b.id==='toolsDemo')startMarketDemo('buyer');else toolsGo(b.dataset.route);});
    const refreshMode=()=>{document.getElementById('toolsMode').textContent=Market.demo?'Sample workspace · changes stay on this device':Market.user?'Connected Buyer account':'Sign in or choose Buyer demo'};
    const currentRender=render;render=function(){currentRender();refreshMode();send('history',{depth:stack.length})};refreshMode();
    send('ready',{});
  `;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data: blob: https://tile.openstreetmap.org; connect-src https:; base-uri 'none'; form-action 'none'"><style>${assets.css}
    :root{--green:#273749;--ink:#2a333d}html,body{max-width:100%;overflow-x:hidden}body{padding:0!important;background:#f5f6f7!important}
    #header,#nav{display:none!important}#app{padding:16px!important;max-width:1100px;margin:auto;padding-bottom:36px!important;min-width:0}
    #toolsStatus{display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;padding:16px;background:#dbe2ea;color:#273749;font-size:13px}
    #toolsMenu{margin:12px 16px;background:white;border:1px solid #dde1e6;border-radius:10px;padding:12px}#toolsMenu summary{cursor:pointer;min-height:28px;font-weight:600;color:#273749}
    .toolsLinks{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px;margin-top:12px}.toolsLinks button{white-space:normal;text-align:left;min-height:44px;background:#f5f6f7;color:#273749;border:1px solid #dde1e6;border-radius:8px;padding:10px;cursor:pointer}
    input,select,textarea{max-width:100%;box-sizing:border-box;font-size:16px!important}button,a{touch-action:manipulation}h1{overflow-wrap:anywhere}.panel{min-width:0}.row{flex-wrap:wrap}#toast{bottom:16px!important}.grid{min-width:0}
    ${webTheme}
    @media(max-width:500px){#app{padding:12px!important}.hero{padding:18px!important}.grid{grid-template-columns:1fr!important}.facts{grid-template-columns:repeat(2,minmax(0,1fr))!important}h1{font-size:28px!important}}
    .mapcredit{flex-wrap:wrap;gap:4px 8px}.mapretry{min-height:32px;padding:4px 10px;border-radius:6px;background:#273749;color:white}.mapretry[hidden]{display:none}
    </style></head><body><header id="header"></header><main id="app"></main><nav id="nav"></nav><div id="toast" role="status"></div><script>${script(bootstrap)}</script><script>${script(assets.locales)}</script><script>${script(assets.script.replace('src="https://tile.openstreetmap.org/', 'data-osm-tile="https://tile.openstreetmap.org/'))}</script><script>${script(adaptation)}</script></body></html>`;
}
