'use client';
import {useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {browserDB,ensureVisitor,type SharedCard} from '@/lib/supabase';
export default function SellerClient(){
 const [userId,setUserId]=useState('');const [allowed,setAllowed]=useState(false);
 const [checking,setChecking]=useState(true);const [error,setError]=useState('');
 const [cards,setCards]=useState<SharedCard[]>([]);const [wishId,setWishId]=useState('');
 const [title,setTitle]=useState('Oferta colectiva de audífonos inalámbricos');
 const [details,setDetails]=useState('Precio especial al alcanzar el mínimo de personas interesadas.');
 const [price,setPrice]=useState('19.99');const [stock,setStock]=useState(3);
 const [minimum,setMinimum]=useState(2);const [busy,setBusy]=useState(false);
 const [published,setPublished]=useState('');
 useEffect(()=>{
  let live=true;
  ensureVisitor().then(async session=>{
   if(!session)throw new Error('Supabase no está configurado.');
   const db=browserDB()!;
   const [{data:seller,error:se},{data:wishes,error:we}]=await Promise.all([
    db.from('demo_sellers').select('display_name').eq('user_id',session.user.id).maybeSingle(),
    db.from('wish_cards').select('wish_id,title,summary,category,city,budget_amount,currency,interest_count,created_at')
     .order('created_at',{ascending:false}).limit(50)
   ]);
   if(se||we)throw se||we;
   if(!live)return;
   setUserId(session.user.id);setAllowed(Boolean(seller));setCards((wishes||[]) as SharedCard[]);
   if(wishes?.[0])setWishId(wishes[0].wish_id);
  }).catch(e=>{if(live)setError(e instanceof Error?e.message:'No se pudo conectar');})
   .finally(()=>{if(live)setChecking(false)});
  return()=>{live=false}
 },[]);
 async function publish(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError('');setPublished('');setBusy(true);
  try{
   if(!allowed)throw new Error('No estás autorizado como vendedor.');
   if(!/^\d{1,5}(?:\.\d{1,2})?$/.test(price))throw new Error('Ingresa un precio válido en dólares.');
   const [d,f='']=price.split('.');const cents=Number(d)*100+Number(f.padEnd(2,'0'));
   if(cents<100||cents>10000000)throw new Error('Precio fuera de rango.');
   const db=browserDB();if(!db)throw new Error('Supabase no está conectado.');
   const {data,error}=await db.from('collective_offers').insert({
    wish_id:wishId,seller_id:userId,title:title.trim(),details:details.trim(),
    currency:'USD',price_cents:cents,stock,minimum_interests:minimum
   }).select('id').single();
   if(error)throw error;
   setPublished(`/deseo/publicado/${wishId}`);
  }catch(e){setError(e instanceof Error?e.message:'No se publicó la oferta.');}
  finally{setBusy(false)}
 }
 return <main className="preview-page active"><div className="page-shell"><div className="container v18-seller-page">
  <nav className="dsd-breadcrumb"><Link href="/">Inicio</Link><span>›</span>Vendedores</nav>
  <span className="section-kicker">DESEAI PARA VENDEDORES</span>
  <h1>Convierte un deseo colectivo en una oferta.</h1>
  <p>Encuentra un grupo interesado y propón tu oferta.</p>
  {checking?<div className="v18-note">Comprobando autorización…</div>:
   !allowed?<div className="v18-seller-info"><h2>Acceso de vendedor no habilitado</h2>
    <p>Solicita la aprobación de tu acceso para publicar ofertas.</p>
    {userId&&<><span>Tu identificador de acceso:</span><code className="v18-seller-id">{userId}</code></>}
    <p>Comparte este identificador con el administrador de DeseAI.</p>
   </div>:<form className="v18-seller-form" onSubmit={publish}>
    <label>Deseo publicado<select required value={wishId} onChange={e=>setWishId(e.target.value)}>
      {cards.map(w=><option key={w.wish_id} value={w.wish_id}>{w.title} · {w.interest_count} interesados</option>)}
     </select></label>
    <label>Título de tu oferta<input required minLength={8} maxLength={110} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    <label>Descripción<input maxLength={320} value={details} onChange={e=>setDetails(e.target.value)}/></label>
    <div className="v18-seller-fields">
     <label>Precio unitario (USD)<input required inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)}/></label>
     <label>Unidades disponibles<input required type="number" min={2} max={100} value={stock} onChange={e=>setStock(Number(e.target.value))}/></label>
     <label>Mínimo de interesados<input required type="number" min={2} max={stock} value={minimum} onChange={e=>setMinimum(Number(e.target.value))}/></label>
    </div>
    <p className="v18-note">El precio se fija en USD al publicar. Demo con pagos en PayPal Sandbox.</p>
    <button className="dsd-primary" type="submit" disabled={busy||!cards.length}>{busy?'Publicando…':'Publicar oferta →'}</button>
    {!cards.length&&<p className="v18-note">Aún no hay deseos publicados. Vuelve cuando se forme un grupo.</p>}
   </form>}
  {error&&<p className="v18-note" role="alert">{error}</p>}
  {published&&<p className="v18-payment-success" role="status">¡Oferta publicada! <Link href={published}>Ver en el deseo →</Link></p>}
 </div></div></main>;
}
