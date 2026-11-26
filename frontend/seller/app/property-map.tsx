'use client';
import {useEffect,useRef,useState} from 'react';
import {Badge,Empty} from './ui';
import {money,type Item} from '../lib/model';

const LEAFLET='1.9.4';
let loader:Promise<any>|null=null;
function loadLeaflet():Promise<any>{
  if(typeof window==='undefined')return Promise.reject();
  if((window as any).L)return Promise.resolve((window as any).L);
  if(loader)return loader;
  loader=new Promise((resolve,reject)=>{
    const css=document.createElement('link');css.rel='stylesheet';css.href=`https://unpkg.com/leaflet@${LEAFLET}/dist/leaflet.css`;document.head.appendChild(css);
    const js=document.createElement('script');js.src=`https://unpkg.com/leaflet@${LEAFLET}/dist/leaflet.js`;js.onload=()=>resolve((window as any).L);js.onerror=()=>{loader=null;reject(new Error('Map could not load'))};document.head.appendChild(js);
  });
  return loader;
}
const located=(p:Item)=>Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lon))&&p.lat!==''&&p.lon!==''&&p.lat!=null&&p.lon!=null&&Math.abs(Number(p.lat))<=90&&Math.abs(Number(p.lon))<=180;

export default function PropertyMap({properties,onOpen,onEdit,canEdit}:{properties:Item[];onOpen:(p:Item)=>void;onEdit:(p:Item)=>void;canEdit:boolean}){
  const box=useRef<HTMLDivElement>(null),map=useRef<any>(null),layer=useRef<any>(null);
  const [filter,setFilter]=useState('All'),[error,setError]=useState('');
  const shown=properties.filter(p=>filter==='All'||(filter==='Published'?p.published:!p.published));
  const pins=shown.filter(located),missing=shown.filter(p=>!located(p));
  useEffect(()=>{
    let dead=false;
    loadLeaflet().then(L=>{
      if(dead||!box.current)return;
      if(!map.current){map.current=L.map(box.current,{scrollWheelZoom:false}).setView([16.5,80.6],9);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map.current);layer.current=L.layerGroup().addTo(map.current)}
      layer.current.clearLayers();
      const pts:any[]=[];
      pins.forEach(p=>{
        const ll=[Number(p.lat),Number(p.lon)];pts.push(ll);
        const icon=L.divIcon({className:'',html:`<span class="map-pin ${p.published?'live':''}"></span>`,iconSize:[22,22],iconAnchor:[11,11]});
        const m=L.marker(ll,{icon,title:p.title}).addTo(layer.current);
        m.on('click',()=>onOpen(p));
      });
      if(pts.length)map.current.fitBounds(pts,{padding:[40,40],maxZoom:pts.length>1?15:13});
      setTimeout(()=>map.current&&map.current.invalidateSize(),50);
    }).catch(e=>setError(e?.message||'Map could not load'));
    return()=>{dead=true};
  },[pins.map(p=>p.id+p.lat+p.lon+p.published).join('|')]);
  useEffect(()=>()=>{if(map.current){map.current.remove();map.current=null}},[]);
  return <>
    <div className="tabs">{['All','Published','Private drafts'].map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{x==='Private drafts'?'Private':x}</button>)}</div>
    {error?<Empty title="Map unavailable" description={error+'. Check your connection and try again.'}/>:<div className="panel map-panel"><div ref={box} className="property-map" role="region" aria-label="Map of your properties"/><div className="map-legend"><span><i className="map-pin live"/>Published</span><span><i className="map-pin"/>Private draft</span></div></div>}
    {!properties.length&&<Empty title="No properties yet" description="Add a property with a location to see it on the map."/>}
    {missing.length>0&&<section className="panel padded map-missing"><div className="section-heading"><div><h2>No location yet</h2></div></div>{missing.map(p=><div key={p.id} className="followup-row"><span className="followup-text"><strong>{p.title}</strong><small>{p.type} · {p.village||p.city||'No address'} · {money(p.price)}</small></span><Badge>{p.published?'Published':'Draft'}</Badge>{canEdit&&<button className="text-btn" onClick={()=>onEdit(p)}>Add location</button>}</div>)}</section>}
  </>;
}
