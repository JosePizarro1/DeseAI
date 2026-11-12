'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import LocationPin from './LocationPin';
import {wishes} from '@/lib/wishes';
import {browserDB,cloudConfigured,ensureVisitor,type SharedCard} from '@/lib/supabase';
const categories=['Todos','Celulares','Teclados','Audífonos','Experiencias','Otros'];
export default function ExploreClient(){
 const [q,setQ]=useState('');const [cat,setCat]=useState('Todos');
 const [cards,setCards]=useState<SharedCard[]>([]);
 const [cloudNotice,setCloudNotice]=useState(cloudConfigured()?'Cargando deseos publicados…':'Explora ideas para inspirarte.');
 useEffect(()=>{let active=true;if(!cloudConfigured())return;
  ensureVisitor().then(async()=>{
   const db=browserDB();if(!db)return;
   const {data,error}=await db.from('wish_cards').select('wish_id,title,summary,category,city,budget_amount,currency,interest_count,created_at')
    .order('created_at',{ascending:false}).limit(40);
   if(!active)return;
   if(error)throw error;setCards((data||[]) as SharedCard[]);setCloudNotice('Encuentra personas cerca de ti.');
  }).catch(()=>{if(active)setCloudNotice('No pudimos cargar los deseos. Puedes explorar las ideas de ejemplo.');});
  return()=>{active=false};
 },[]);
 const filtered=useMemo(()=>wishes.filter(w=>(cat==='Todos'||w.category===cat)&&(w.title+' '+w.sub+' '+w.location+' '+w.category).toLowerCase().includes(q.trim().toLowerCase())),[q,cat]);
 const live=useMemo(()=>cards.filter(w=>(cat==='Todos'||w.category===cat)&&(w.title+' '+w.summary+' '+w.city+' '+w.category).toLowerCase().includes(q.trim().toLowerCase())),[cards,q,cat]);
 return <main className="preview-page active"><div className="page-shell"><div className="container">
 <div className="page-heading"><span className="section-kicker">EXPLORAR DESEOS</span><h1>Descubre lo que podemos <span style={{color:'#1564d9'}}>hacer juntos.</span></h1>
 <p>Conoce deseos publicados por personas reales y explora ejemplos para inspirarte.</p></div>
 <div className="explore-tools"><input aria-label="Buscar deseos" value={q} onChange={e=>setQ(e.target.value)} className="search-box" placeholder="Buscar producto o ciudad…"/>
 <div className="categories" role="group" aria-label="Filtrar deseos">{categories.map(c=><button key={c} className={'category-btn '+(cat===c?'active':'')} onClick={()=>setCat(c)} aria-pressed={cat===c}>{c}</button>)}</div></div>
 <div className="v17-section-heading"><h2>Deseos publicados</h2><span className="v17-cloud-note">{cloudNotice}</span></div>
 {live.length?<div className="wish-grid">{live.map(w=><Link href={'/deseo/publicado/'+w.wish_id} className="wish-card v17-live-card" key={w.wish_id}>
  <div className="v17-card-art" aria-hidden="true"><img src={w.category==='Audífonos'?'/assets/audifonos-referencia-v2.webp':w.category==='Teclados'?'/assets/producto-teclado.svg':w.category==='Celulares'?'/assets/producto-celular.svg':'/assets/coincidencias-mascota.webp'} alt="" loading="lazy"/><small>Imagen de referencia</small></div>
  <div className="wish-card-body"><span className="small-muted"><LocationPin/> {w.city||'Ciudad por definir'}</span>
   <h3>{w.title}</h3><p>{w.summary}</p><div className="wish-footer"><span>{w.interest_count} personas interesadas</span><span className="circle-arrow">↗</span></div>
  </div></Link>)}</div>:<div className="v17-live-empty">Todavía no hay deseos publicados con estos filtros. <Link href="/crear">Sé el primero en crear uno →</Link></div>}
 <div className="v17-section-heading" style={{marginTop:55}}><h2>Ideas para inspirarte</h2><span>Ejemplos · No son compradores reales</span></div>
 <div className="wish-grid">{filtered.map(w=><Link href={'/deseo/'+w.id} className="wish-card" key={w.id}>
  <div className="wish-card-photo"><img alt={w.title} src={w.image} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=w.fallback}}/><span className="photo-badge">EJEMPLO · {w.category}</span></div>
  <div className="wish-card-body"><span className="small-muted">⌖ {w.location}</span><h3>{w.title}</h3><p>{w.sub}</p>
   <div className="progress-meta"><span><b>{w.current}</b> de {w.goal} interesados (demo)</span><span>{Math.round(w.current/w.goal*100)}%</span></div>
   <div className="progress-track"><div style={{width:Math.min(100,w.current/w.goal*100)+'%'}}/></div>
   <div className="wish-footer"><span>Precio ilustrativo: <strong>{w.price}</strong></span><span className="circle-arrow">↗</span></div>
  </div></Link>)}</div>
 {!filtered.length&&<div className="empty-state">No hay ejemplos con ese filtro. <Link href="/crear">Crea tu propio deseo</Link>.</div>}
 </div></div></main>;
}
