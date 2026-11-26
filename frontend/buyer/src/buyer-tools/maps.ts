export const mapProvider = {
  name: 'OpenStreetMap',
  origin: 'https://tile.openstreetmap.org',
  copyright: 'https://www.openstreetmap.org/copyright',
};

// Render the original pins/polygons, then load only the visible street tiles.
// Web requests go through the parent browser so sandbox isolation does not strip
// the HTTP Referer. Native WebView requests carry the AgentMart user agent.
export const mapAdapter = `
  const tileRequests=new Map();
  const originalDrawMap=drawMap;
  drawMap=function(id){
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
