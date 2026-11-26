'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Building2, Search, Heart, MessagesSquare, MapPin, Menu, X, Leaf, SlidersHorizontal, Scale, BedDouble, Move, Compass, Check, Trash2 } from 'lucide-react';
import { PropertyArt } from '../ui';
import { money } from '../../lib/model';
import { listings, type BuyerListing } from './listings';

type View = 'Discover' | 'Saved properties' | 'Compare' | 'Enquiry drafts';
type Draft = { id: string; propertyId: string; message: string; created: string };
const storageKey = 'agentmart-buyer-v1';
const navigation = [['Discover', Search], ['Saved properties', Heart], ['Compare', Scale], ['Enquiry drafts', MessagesSquare]] as const;

export default function BuyerStudio() {
  const [view, setView] = useState<View>('Discover');
  const [search, setSearch] = useState('');
  const [purpose, setPurpose] = useState('Sale');
  const [type, setType] = useState('All types');
  const [city, setCity] = useState('All cities');
  const [budget, setBudget] = useState('');
  const [sort, setSort] = useState('recommended');
  const [saved, setSaved] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [ready, setReady] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [selected, setSelected] = useState<BuyerListing | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const validId = (id: unknown): id is string => typeof id === 'string' && listings.some(p => p.id === id);
      if (Array.isArray(value.saved)) setSaved(value.saved.filter(validId));
      if (Array.isArray(value.compare)) setCompare(value.compare.filter(validId).slice(0, 3));
      if (Array.isArray(value.drafts)) setDrafts(value.drafts.filter((d: Draft) => d && typeof d.id === 'string' && validId(d.propertyId) && typeof d.message === 'string' && typeof d.created === 'string'));
    } catch { setNotice('Browser storage is unavailable or was reset. You can still browse properties.'); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ saved, compare, drafts })); }
    catch { setNotice('Your browser could not save these changes. Keep this page open to retain them.'); }
  }, [saved, compare, drafts, ready]);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timeout);
  }, [notice]);

  function navigate(next: View) { setView(next); setDrawer(false); }
  function toggleSave(id: string) { setSaved(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]); }
  function toggleCompare(id: string) {
    if (compare.includes(id)) setCompare(old => old.filter(x => x !== id));
    else if (compare.length < 3) setCompare(old => [...old, id]);
    else setNotice('Compare up to three properties. Remove one to add another.');
  }
  function resetFilters() { setSearch(''); setPurpose('Sale'); setType('All types'); setCity('All cities'); setBudget(''); setSort('recommended'); }

  const visible = listings.filter(p => {
    if (view === 'Saved properties') return saved.includes(p.id);
    return p.purpose === purpose && (type === 'All types' || p.type === type) && (city === 'All cities' || p.city === city) && (!budget || p.price <= Number(budget)) && `${p.title} ${p.city} ${p.locality}`.toLowerCase().includes(search.trim().toLowerCase());
  }).sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : 0);
  const compared = listings.filter(p => compare.includes(p.id));

  function propertyCard(p: BuyerListing) {
    return <article className="buyer-card" key={p.id}>
      <div className="buyer-card-cover"><button className="buyer-cover-button" aria-label={`View ${p.title}`} onClick={() => setSelected(p)}><PropertyArt type={p.type} variant={listings.indexOf(p)} /></button><span className="buyer-type">{p.type} · {p.purpose === 'Sale' ? 'For sale' : 'For rent'}</span><button className={'buyer-heart ' + (saved.includes(p.id) ? 'is-saved' : '')} aria-label={`${saved.includes(p.id) ? 'Unsave' : 'Save'} ${p.title}`} aria-pressed={saved.includes(p.id)} onClick={() => toggleSave(p.id)} disabled={!ready}><Heart size={19} fill={saved.includes(p.id) ? 'currentColor' : 'none'} /></button></div>
      <div className="buyer-card-body"><p className="buyer-location"><MapPin size={14} />{p.locality}, {p.city}</p><h3><button onClick={() => setSelected(p)}>{p.title}</button></h3><div className="buyer-facts"><span><Move size={15} />{p.area.toLocaleString('en-IN')} {p.unit}</span><span>{p.bedrooms ? <><BedDouble size={15} />{p.bedrooms} BHK</> : <><Compass size={15} />{p.facing}</>}</span></div><div className="buyer-card-bottom"><strong>{money(p.price)}{p.purpose === 'Rent' && <small> / month</small>}</strong><button className="buyer-compare-toggle" aria-pressed={compare.includes(p.id)} aria-label={`Compare ${p.title}`} onClick={() => toggleCompare(p.id)} disabled={!ready}>{compare.includes(p.id) ? <Check size={16} /> : <Scale size={16} />}Compare</button></div></div>
    </article>;
  }

  return <div className="buyer-shell">
    <aside className={'buyer-sidebar ' + (drawer ? 'is-open' : '')}><a className="buyer-brand" href="/buyer"><span className="buyer-brand-icon"><Building2 size={25} /></span><span>agentmart<small>BUYER STUDIO</small></span></a><div className="buyer-workspace"><span className="buyer-avatar"><Heart size={19} /></span><div><strong>Your next chapter</strong><small>Your property search, organized</small></div></div><p className="buyer-nav-label">YOUR WORKSPACE</p><nav aria-label="Buyer navigation">{navigation.map(([name, Icon]) => <button key={name} className={view === name ? 'active' : ''} aria-current={view === name ? 'page' : undefined} onClick={() => navigate(name)}><Icon size={19} /><span>{name}</span>{name === 'Saved properties' && saved.length > 0 && <b>{saved.length}</b>}{name === 'Compare' && compare.length > 0 && <b>{compare.length}</b>}</button>)}</nav><div className="buyer-sidebar-bottom"><div className="buyer-sidebar-note"><Leaf size={25} /><h3>A place for your<br />next possibility.</h3><p>Find it. Save it.<br />Make your next move.</p></div><a href="/">Open Seller Studio</a><div className="buyer-account"><span className="buyer-avatar">B</span><div><strong>Buyer workspace</strong><small>Local preview</small></div></div></div></aside>
    {drawer && <button className="buyer-scrim" aria-label="Close navigation" onClick={() => setDrawer(false)} />}
    <div className="buyer-main"><header className="buyer-topbar"><div><button className="buyer-menu" aria-label="Open navigation" aria-expanded={drawer} onClick={() => setDrawer(!drawer)}><Menu size={23} /></button><span>Buyer workspace <span className="buyer-divider">/</span> <strong>{view}</strong></span></div><a href="/">Seller Studio</a></header>
      <main className="buyer-content"><div className="buyer-preview"><Leaf size={16} /><span>Sample catalogue · fictional properties. Shortlists and enquiry drafts are saved on this browser only.</span></div><div className="buyer-heading"><div><p className="buyer-eyebrow">A SPACE FOR YOUR NEXT MOVE</p><h1>{view === 'Discover' ? 'Find a place that feels like you.' : view === 'Saved properties' ? 'Your favourites, all together.' : view === 'Compare' ? 'See the bigger picture.' : 'Keep the conversation in mind.'}</h1><p>{view === 'Discover' ? 'Explore spaces, discover possibilities and make room for what’s next.' : view === 'Saved properties' ? 'A little closer to finding the right place.' : view === 'Compare' ? 'Compare up to three properties side by side.' : 'Your private notes for future seller conversations. Drafts have not been sent.'}</p></div></div>
      {view === 'Discover' && <><section className="buyer-hero"><div><span>GOOD PLACES. NEW BEGINNINGS.</span><h2>Your next chapter<br />starts with a place.</h2><p>From your first home to your next investment,<br />find the space for what matters to you.</p><div className="buyer-purpose" aria-label="Listing purpose">{['Sale', 'Rent'].map(value => <button key={value} aria-pressed={purpose === value} className={purpose === value ? 'active' : ''} onClick={() => { setPurpose(value); setBudget(''); }}>{value === 'Sale' ? 'Buy a property' : 'Find a rental'}</button>)}</div></div><div className="buyer-hero-art"><PropertyArt type="Apartment" variant={0} /><span><Heart size={16} />A little closer to home</span></div></section>
      <section className="buyer-search-panel" aria-label="Property filters"><label className="buyer-search"><Search size={19} /><input aria-label="Search properties" placeholder="Search city, locality or property" value={search} onChange={e => setSearch(e.target.value)} /></label><div className="buyer-filter-row"><label>Property type<select aria-label="Property type" value={type} onChange={e => setType(e.target.value)}>{['All types', 'Plot', 'Apartment', 'House', 'Commercial', 'Farm land'].map(x => <option key={x}>{x}</option>)}</select></label><label>Location<select aria-label="Location" value={city} onChange={e => setCity(e.target.value)}>{['All cities', 'Amaravati', 'Vijayawada', 'Guntur'].map(x => <option key={x}>{x}</option>)}</select></label><label>{purpose === 'Rent' ? 'Max monthly rent' : 'Maximum price'}<select aria-label={purpose === 'Rent' ? 'Max monthly rent' : 'Maximum price'} value={budget} onChange={e => setBudget(e.target.value)}><option value="">Any budget</option>{(purpose === 'Rent' ? [15000, 20000, 30000, 50000] : [5000000, 7500000, 10000000, 15000000]).map(x => <option key={x} value={x}>{money(x)}</option>)}</select></label><button className="buyer-reset" onClick={resetFilters}><SlidersHorizontal size={17} />Reset filters</button></div></section></>}
      {(view === 'Discover' || view === 'Saved properties') && <><div className="buyer-results-heading"><div><h2>{view === 'Discover' ? 'Spaces worth exploring' : 'Your shortlist'}</h2><p>{visible.length} {visible.length === 1 ? 'property' : 'properties'}{view === 'Discover' ? ` for ${purpose === 'Sale' ? 'sale' : 'rent'}` : ' saved'}</p></div><label className="buyer-sort">Sort by<select aria-label="Sort properties" value={sort} onChange={e => setSort(e.target.value)}><option value="recommended">Recommended</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div>{visible.length ? <div className="buyer-property-grid">{visible.map(propertyCard)}</div> : <Empty title={view === 'Discover' ? 'No properties match just yet.' : 'Your shortlist starts here.'} text={view === 'Discover' ? 'Try another location, type or budget.' : 'Tap the heart on a property to keep it here.'} action={() => { resetFilters(); navigate('Discover'); }} label={view === 'Discover' ? 'Reset filters' : 'Explore properties'} />}</>}
      {view === 'Compare' && (compared.length ? <div className="buyer-comparison"><table><caption>Selected property comparison</caption><thead><tr><th scope="col">Property</th>{compared.map(p => <th scope="col" key={p.id}><PropertyArt type={p.type} variant={listings.indexOf(p)} /><button className="buyer-table-title" onClick={() => setSelected(p)}>{p.title}</button><button className="buyer-text-button" onClick={() => toggleCompare(p.id)} aria-label={`Remove ${p.title} from comparison`}>Remove</button></th>)}</tr></thead><tbody>{['Price', 'Purpose', 'Location', 'Type', 'Area', 'Bedrooms', 'Facing'].map(label => <tr key={label}><th scope="row">{label}</th>{compared.map(p => <td key={p.id}>{label === 'Price' ? money(p.price) + (p.purpose === 'Rent' ? ' / month' : '') : label === 'Purpose' ? p.purpose : label === 'Location' ? `${p.locality}, ${p.city}` : label === 'Type' ? p.type : label === 'Area' ? `${p.area} ${p.unit}` : label === 'Bedrooms' ? p.bedrooms || 'Not applicable' : p.facing}</td>)}</tr>)}</tbody></table><p className="buyer-comparison-note">Sale prices and monthly rents use different time periods. Check each listing’s purpose when comparing.</p></div> : <Empty title="Find your best fit." text="Add up to three properties using Compare on each property card." action={() => navigate('Discover')} label="Explore properties" />)}
      {view === 'Enquiry drafts' && (drafts.length ? <div className="buyer-drafts">{drafts.map(draft => { const property = listings.find(p => p.id === draft.propertyId)!; return <article key={draft.id}><div><span className="buyer-draft-label">LOCAL DRAFT · NOT SENT</span><h2><button onClick={() => setSelected(property)}>{property.title}</button></h2><p>{draft.message}</p><small>Saved {new Date(draft.created).toLocaleDateString('en-IN')}</small></div><button className="buyer-delete" aria-label={`Delete draft for ${property.title}`} onClick={() => setDrafts(old => old.filter(d => d.id !== draft.id))}><Trash2 size={19} /></button></article>; })}</div> : <Empty title="Make a note for your next move." text="Open a property and save your questions as an enquiry draft." action={() => navigate('Discover')} label="Explore properties" />)}
      <footer className="buyer-footer">AgentMart Buyer Studio <span>Thoughtfully organized. One possibility at a time.</span></footer></main>
    </div>
    {selected && <PropertyDialog property={selected} saved={saved.includes(selected.id)} onSave={() => toggleSave(selected.id)} onClose={() => setSelected(null)} onDraft={message => { setDrafts(old => [{ id: crypto.randomUUID(), propertyId: selected.id, message, created: new Date().toISOString() }, ...old]); setNotice('Enquiry draft saved on this browser. It has not been sent.'); setSelected(null); }} />}
    {notice && <div className="buyer-toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={17} /></button></div>}
  </div>;
}

function Empty({ title, text, action, label }: { title: string; text: string; action: () => void; label: string }) {
  return <div className="buyer-empty"><Building2 size={35} /><h2>{title}</h2><p>{text}</p><button className="buyer-primary" onClick={action}>{label}</button></div>;
}

function PropertyDialog({ property: p, saved, onSave, onClose, onDraft }: { property: BuyerListing; saved: boolean; onSave: () => void; onClose: () => void; onDraft: (message: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const activeElement = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = old; activeElement?.focus(); };
  }, []);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (message.trim()) onDraft(message.trim()); }
  return <dialog ref={dialog} className="buyer-dialog" aria-labelledby="buyer-property-title" onCancel={onClose} onClick={e => { if (e.target === dialog.current) onClose(); }}><div className="buyer-dialog-heading"><span>BUYER STUDIO · SAMPLE LISTING</span><button aria-label="Close property details" onClick={onClose}><X size={23} /></button></div><div className="buyer-dialog-cover"><PropertyArt type={p.type} variant={listings.indexOf(p)} /></div><div className="buyer-dialog-body"><p className="buyer-location"><MapPin size={16} />{p.locality}, {p.city}</p><div className="buyer-detail-title"><h2 id="buyer-property-title">{p.title}</h2><strong>{money(p.price)}{p.purpose === 'Rent' && <small> / month</small>}</strong></div><div className="buyer-detail-facts"><span>{p.type}</span><span>{p.area} {p.unit}</span><span>{p.facing} facing</span><span>For {p.purpose.toLowerCase()}</span></div><h3>A little more about this place</h3><p>{p.description}</p><ul className="buyer-highlights">{p.highlights.map(text => <li key={text}><Check size={16} />{text}</li>)}</ul><button className="buyer-save-detail" aria-pressed={saved} onClick={onSave}><Heart size={18} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Saved to your shortlist' : 'Save to your shortlist'}</button><form className="buyer-enquiry-form" onSubmit={submit}><h3>What would you like to ask?</h3><p>Save a private draft for later. Seller messaging and visit booking are not connected in this preview.</p><label htmlFor="buyer-message">Your questions<textarea id="buyer-message" value={message} onChange={e => setMessage(e.target.value)} required maxLength={2000} rows={3} placeholder="Ask about the property, documents or a possible visit…" /></label><button className="buyer-primary" type="submit" disabled={!message.trim()}>Save enquiry draft</button></form><p className="buyer-detail-disclaimer">Fictional listing for preview. Property illustrations are not photographs. No availability, ownership or legal verification is implied.</p></div></dialog>;
}
