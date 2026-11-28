export const mapProvider = {
  name: 'OpenStreetMap',
  origin: 'https://tile.openstreetmap.org',
  copyright: 'https://www.openstreetmap.org/copyright',
};

// Render the original pins/polygons, then load only the visible street tiles.
// Web requests go through the parent browser so sandbox isolation does not strip
// the HTTP Referer. Native WebView requests carry the AgentMart user agent.
export const mapAdapter = `
  // Attach point lookup to every embedded map while retaining pin selection and dragging.
  const originalMakeMapWithCrda=makeMap;
  makeMap=function(...args){
    originalMakeMapWithCrda(...args);
    const id=args[0],el=document.getElementById(id);if(!el||!maps[id])return;
    const down=el.onpointerdown,up=el.onpointerup;let pressed=null;
    el.onpointerdown=event=>{
      if(event.target.closest('.crda-map-popup'))return;
      pressed=event.target.closest('button,a,input,select')?null:{x:event.clientX,y:event.clientY};
      if(down)down.call(el,event);
    };
    el.onpointerup=event=>{
      const start=pressed;pressed=null;if(up)up.call(el,event);
      if(!start||!el.isConnected||Math.abs(event.clientX-start.x)+Math.abs(event.clientY-start.y)>8)return;
      const m=maps[id],rect=el.getBoundingClientRect(),center=world(m.lat,m.lon,m.z);
      const point=unworld(center[0]+event.clientX-rect.left-rect.width/2,center[1]+event.clientY-rect.top-rect.height/2,m.z);
      void crdaMapPoint(el,m,point[0],((point[1]+540)%360)-180);
    };
    const caption=el.querySelector('.mapcaption');if(caption)caption.textContent=maps[id].pick?'Tap to set a pin and look up its CRDA number':'Drag to explore. Tap the map for its CRDA plot number.';
  };
  async function crdaMapPoint(el,m,lat,lon){
    const sequence=m.crdaSequence=(m.crdaSequence||0)+1;
    el.querySelector('.crda-map-popup')?.remove();
    const panel=document.createElement('div');panel.className='crda-map-popup';panel.setAttribute('role','status');
    Object.assign(panel.style,{position:'absolute',left:'12px',top:'12px',width:'260px',maxWidth:'calc(100% - 70px)',maxHeight:'calc(100% - 64px)',overflow:'auto',padding:'16px',background:'white',color:'#293e32',borderRadius:'10px',boxShadow:'0 3px 14px #0003',zIndex:20,fontSize:'13px',lineHeight:'1.5'});
    const close=document.createElement('button');close.type='button';close.textContent='Close';close.setAttribute('aria-label','Close CRDA plot details');close.style.cssText='float:right;min-height:32px;margin:0 0 8px 8px';
    close.onclick=event=>{event.stopPropagation();m.crdaSequence++;panel.remove()};panel.appendChild(close);
    const content=document.createElement('div');content.textContent='Looking up CRDA number...';panel.appendChild(content);el.appendChild(panel);
    try{
      const result=await request('planning',{action:'identify',layer:'plots',lat,lon});
      if(!el.isConnected||maps[m.id]!==m||m.crdaSequence!==sequence)return;
      const features=result.data?.features||[];content.replaceChildren();
      const add=(tag,text)=>{const node=document.createElement(tag);node.textContent=String(text);content.appendChild(node)};
      const plots=features.filter(feature=>feature.properties?.plot_code);
      if(!plots.length)add('p','No CRDA plot number is mapped at this location.');
      for(const feature of plots){const p=feature.properties;add('strong','CRDA plot code: '+p.plot_code);for(const [label,value]of [['Plot number',p.plot_no],['Village',p.village||p.lpsvillage],['Land use',p.lu_desc]])if(value!==null&&value!==undefined&&value!=='')add('p',label+': '+value)}
      add('small','Source: public APCRDA GIS');
    }catch{
      if(el.isConnected&&maps[m.id]===m&&m.crdaSequence===sequence)content.textContent='CRDA lookup is unavailable. Tap the map again to retry.';
    }
  }
  const tileRequests=new Map();
  const originalDrawMap=drawMap;
  drawMap=function(id){
    if(maps[id])maps[id].crdaSequence=(maps[id].crdaSequence||0)+1;
    document.getElementById(id)?.querySelector('.crda-map-popup')?.remove();
    originalDrawMap(id);
    const el=document.getElementById(id);if(!el)return;
    const images=[...el.querySelectorAll('img[data-osm-tile]')];
    const status=el.querySelector('.mapstatus');
    if(!images.length||!status)return;
    const generation=String(Number(el.dataset.mapGeneration||0)+1);el.dataset.mapGeneration=generation;
    el.querySelector('.mapretry')?.remove();
    status.setAttribute('role','status');status.textContent='Loading OpenStreetMap…';
    let loaded=0,failed=0;
    const retry=document.createElement('button');retry.type='button';retry.className='mapretry';
    retry.textContent='Retry';retry.setAttribute('aria-label','Retry map');retry.hidden=true;
    retry.onclick=()=>drawMap(id);el.querySelector('.mapcredit').appendChild(retry);
    function update(){if(!status.isConnected||el.dataset.mapGeneration!==generation)return;
      if(loaded+failed<images.length)return;
      status.textContent=loaded?(failed?'OpenStreetMap • some tiles unavailable':'OpenStreetMap • zoom '+maps[id].z):'Map unavailable. Check your connection and retry.';
      retry.hidden=failed===0;
    }
    for(const image of images){
      image.removeAttribute('onload');image.removeAttribute('onerror');
      let settled=false;
      const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);if(ok)loaded++;else{failed++;tileRequests.delete(image.dataset.osmTile)}update()};
      const timer=setTimeout(()=>finish(false),25000);
      image.onload=()=>finish(true);image.onerror=()=>finish(false);
      const url=image.dataset.osmTile;
      if(window.ReactNativeWebView){image.src=url;continue}
      let task=tileRequests.get(url);
      if(!task){
        const parts=new URL(url).pathname.slice(1).replace('.png','').split('/').map(Number);
        task=request('tile',{z:parts[0],x:parts[1],y:parts[2]}).then(r=>r.image);
        tileRequests.set(url,task);
        task.catch(()=>tileRequests.delete(url));
        // Small session cache; normal HTTP caching remains enabled by the browser.
        if(tileRequests.size>64)tileRequests.delete(tileRequests.keys().next().value);
      }
      task.then(src=>{if(image.isConnected&&!settled)image.src=src;else{clearTimeout(timer);settled=true}}).catch(()=>finish(false));
    }
  };
  let resizeMapTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeMapTimer);resizeMapTimer=setTimeout(()=>{
    Object.keys(maps).forEach(id=>{const el=document.getElementById(id);if(el&&el.clientWidth)drawMap(id)});
  },150)});
`;
