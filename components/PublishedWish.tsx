'use client';
import Link from 'next/link';
import LocationPin from './LocationPin';
import {useEffect,useState} from 'react';
import {browserDB,ensureVisitor,type SharedCard} from '@/lib/supabase';
import OfferPanel from './OfferPanel';
export default function PublishedWish({id}:{id:string}){
 const [wish,setWish]=useState<SharedCard|null>(null);
 const [purchased,setPurchased]=useState(false);
 const [mine,setMine]=useState(false);const [busy,setBusy]=useState(true);const [message,setMessage]=useState('');
 useEffect(()=>{
  let active=true;
  ensureVisitor().then(async session=>{
    const db=browserDB();if(!db||!session)return;
    const [{data,error},{data:interests}]=await Promise.all([
      db.from('wish_cards').select('wish_id,title,summary,category,city,budget_amount,currency,interest_count,created_at').eq('wish_id',id).maybeSingle(),
      db.from('wish_interests').select('wish_id').eq('wish_id',id).eq('user_id',session.user.id).maybeSingle(),
    ]);
    if(!active)return;
    if(error)throw error;setWish(data as SharedCard|null);setMine(Boolean(interests));
  }).catch(e=>{if(active)setMessage(e instanceof Error?e.message:'No se pudo cargar');})
    .finally(()=>{if(active)setBusy(false)});
  return()=>{active=false};
 },[id]);
 useEffect(()=>{
  let live=true;
  const timer=window.setInterval(async()=>{
   const db=browserDB();if(!db)return;
   const {data}=await db.from('wish_cards').select('interest_count').eq('wish_id',id).maybeSingle();
   if(live&&data)setWish(prev=>prev?{...prev,interest_count:data.interest_count}:prev);
  },8000);
  return()=>{live=false;window.clearInterval(timer)};
 },[id]);
 async function interest(){
  if(!wish)return;setBusy(true);setMessage('');
  try{
    const session=await ensureVisitor();const db=browserDB();
    if(!db||!session)throw new Error('No hay una sesión activa.');
    const {error}=mine?await db.from('wish_interests').delete().eq('wish_id',id).eq('user_id',session.user.id):
      await db.from('wish_interests').insert({wish_id:id,user_id:session.user.id});
    if(error)throw error;const next=!mine;setMine(next);setWish({...wish,interest_count:Math.max(0,wish.interest_count+(next?1:-1))});
    setMessage(next?'Te sumaste al grupo.':'Has retirado tu interés.');
  }catch(e){setMessage(e instanceof Error?e.message:'No se pudo actualizar');}finally{setBusy(false)}
 }
 return <main className="preview-page active"><div className="page-shell"><div className="container">
  <nav className="dsd-breadcrumb"><Link href="/explorar">Explorar</Link><span>›</span>Deseo publicado</nav>
  {busy&&!wish?<div className="v17-live-empty">Cargando deseo…</div>:!wish?<div className="v17-live-empty">No encontramos este deseo. <Link href="/explorar">Volver a explorar</Link></div>:
  <div className="purchase-page">
   <div className="purchase-steps" aria-label="Proceso de compra"><span>✓ Deseo publicado</span><span>✓ Personas conectadas</span><span>{purchased?'3 · Revisa tu pedido':'3 · Elige tu oferta'}</span></div>
   <div className="purchase-grid"><article className="purchase-product">
    <div className="purchase-art"><img src={wish.category==='Audífonos'?'/assets/audifonos-referencia-v2.webp':wish.category==='Teclados'?'/assets/producto-teclado.svg':wish.category==='Celulares'?'/assets/producto-celular.svg':'/assets/coincidencias-mascota.webp'} alt=""/><small>Imagen de referencia</small></div>
    <span className="section-kicker">{wish.category} <span className="location-label"><LocationPin/>{wish.city||'Ciudad por definir'}</span></span>
    <h1>{wish.title}</h1><p className="purchase-description">{wish.summary}</p>
    <div className="purchase-community"><span>♧</span><div><strong>{wish.interest_count} personas interesadas</strong><p>Comprar juntos empieza por querer lo mismo.</p></div></div>
    <details className="purchase-details"><summary>Cómo funciona la compra en grupo</summary><p>Súmate al deseo. Cuando se alcance el mínimo de interesados, puedes pagar tu unidad en la oferta que elijas. Cada pago se confirma por separado.</p></details>
   </article><aside className="purchase-sidebar"><OfferPanel wishId={id} interestCount={wish.interest_count} interested={mine} onJoin={interest} joining={busy} onPurchaseState={setPurchased}/>
   {mine&&!purchased&&<button className="purchase-withdraw" disabled={busy} onClick={interest}>Retirar mi interés</button>}
   </aside></div></div>}

  {message&&<p role="status" className="v17-result-note">{message}</p>}
 </div></div></main>;
}
