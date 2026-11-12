'use client';
import Link from 'next/link';
import {useCallback,useEffect,useState} from 'react';
import {browserDB,ensureVisitor} from '@/lib/supabase';
import OrderReceipt,{type OrderSummary} from './OrderReceipt';
import PayPalSandboxCheckout from './PayPalSandboxCheckout';
export type Offer={id:string;wish_id:string;title:string;details:string;currency:'USD';price_cents:number;
 stock:number;minimum_interests:number;paid_count:number;status:string};
export default function OfferPanel({wishId,interestCount,interested,onJoin,joining,onPurchaseState}:{wishId:string;interestCount:number;interested:boolean;onJoin:()=>void;joining:boolean;onPurchaseState:(paid:boolean)=>void}){
 const [offers,setOffers]=useState<Offer[]>([]);const [busy,setBusy]=useState(true);
 const [msg,setMsg]=useState('');
 const [orders,setOrders]=useState<OrderSummary[]>([]);
 const refresh=useCallback(async()=>{
  try{
   const db=browserDB(),session=await ensureVisitor();if(!db||!session)return;
   const {data,error}=await db.from('collective_offers')
    .select('id,wish_id,title,details,currency,price_cents,stock,minimum_interests,paid_count,status')
    .eq('wish_id',wishId).eq('status','active').order('created_at',{ascending:false});
   if(error)throw error;
   const ids=(data||[]).map(offer=>offer.id);
   const paymentResult=ids.length?await db.from('payment_orders').select('id,offer_id,price_cents,currency,status,paypal_order_id,created_at').eq('buyer_id',session.user.id).in('offer_id',ids):{data:[],error:null};
   if(paymentResult.error)throw paymentResult.error;
   const payments=(paymentResult.data||[]) as OrderSummary[];
   setOrders(payments);onPurchaseState(payments.some(order=>order.status==='completed'||order.status==='pending'||order.status==='capturing'));
   setOffers((data||[]) as Offer[]);
  }catch(e){setMsg(e instanceof Error?e.message:'No se pudieron cargar las ofertas.');}
  finally{setBusy(false)}
 },[wishId,onPurchaseState]);
 useEffect(()=>{refresh()},[refresh]);
 return <section className="v18-offers" aria-label="Ofertas para el grupo">
  {busy?<p className="v18-note">Buscando ofertas…</p>:offers.length===0?<div className="v18-empty-offers">
   <h2>Forma parte del grupo</h2><p>Este deseo espera una oferta. Súmate para mostrar tu interés.</p>{!interested?<button className="purchase-join" disabled={joining} onClick={onJoin}>{joining?'Sumándote…':'Me interesa →'}</button>:<p>✓ Ya formas parte del grupo.</p>}<Link href="/vendedor">Soy vendedor →</Link>
  </div>:<div className="v18-offer-list">{offers.map(offer=>{
   const completed=orders.find(order=>order.offer_id===offer.id&&order.status==='completed');
   if(completed)return <OrderReceipt key={offer.id} order={completed} title={offer.title} compact/>;
   const unlocked=interestCount>=offer.minimum_interests;
   const full=offer.paid_count>=offer.stock;
   const enabled=unlocked&&interested&&!full;
   return <article className="v18-offer-card" key={offer.id}>
    <div className="v18-offer-top"><div><span className="purchase-available">● Oferta disponible</span><h2>{offer.title}</h2></div>
     <strong className="v18-offer-price">{new Intl.NumberFormat('es-PE',{style:'currency',currency:'USD'}).format(offer.price_cents/100)}<small> por persona</small></strong></div>
    <p className="purchase-stock">{Math.max(0,offer.stock-offer.paid_count)} unidades disponibles</p>
    <div className="purchase-group-state"><strong>{unlocked?'✓ Grupo mínimo alcanzado':`${interestCount} de ${offer.minimum_interests} personas`}</strong><span>{unlocked?'Ya puedes comprar al precio del grupo.':`Faltan ${offer.minimum_interests-interestCount} personas para habilitar el pago.`}</span></div>
    {!interested&&<button className="purchase-join" disabled={joining||full} onClick={onJoin}>{joining?'Sumándote…':full?'Oferta agotada':'Unirme al grupo →'}</button>}
    {!unlocked?<p className="v18-note">Faltan {offer.minimum_interests-interestCount} personas para habilitar el pago.</p>:
     full?<p className="v18-payment-success">Oferta agotada. Todas las unidades están pagadas.</p>:
     !interested?<p className="purchase-caption">Unirte es gratis.</p>:
     <PayPalSandboxCheckout offerId={offer.id} priceCents={offer.price_cents} enabled={enabled} onPaid={refresh}/>}
    <p className="purchase-caption">{offer.paid_count} de {offer.stock} unidades pagadas</p>
    <details className="purchase-details"><summary>Detalles de la oferta</summary><p>{offer.details||'Consulta las condiciones con el vendedor.'}</p><p>Esta demo permite probar el pago. La entrega del producto no está habilitada.</p></details>
    <small className="v18-legal">Demo · PayPal Sandbox · Usa tu cuenta de prueba.</small>
   </article>
  })}</div>}
  {msg&&<p className="v18-note" role="alert">{msg}</p>}
 </section>;
}
