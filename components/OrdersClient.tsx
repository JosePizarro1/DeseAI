'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {browserDB,ensureVisitor} from '@/lib/supabase';
import OrderReceipt,{type OrderSummary} from './OrderReceipt';
export default function OrdersClient(){
 const [orders,setOrders]=useState<Array<OrderSummary&{title:string}>>([]);
 const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  async function load(){
   const session=await ensureVisitor();const db=browserDB();
   if(!db||!session)throw new Error('No pudimos acceder a tus pedidos.');
   const {data,error}=await db.from('payment_orders').select('id,offer_id,price_cents,currency,status,paypal_order_id,created_at').eq('buyer_id',session.user.id).order('created_at',{ascending:false});
   if(error)throw error;
   const rows=(data||[]) as OrderSummary[];
   let titles=new Map<string,string>();
   if(rows.length){
    const result=await db.from('collective_offers').select('id,title').in('id',rows.map(row=>row.offer_id));
    if(result.error)throw result.error;
    titles=new Map((result.data||[]).map(offer=>[offer.id,offer.title]));
   }
   if(active)setOrders(rows.map(row=>({...row,title:titles.get(row.offer_id)||'Tu oferta'})));
  }
  load().catch(e=>{if(active)setError(e instanceof Error?e.message:'No se pudieron cargar tus pedidos.');}).finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[]);
 return <main className="container orders-page"><nav className="dsd-breadcrumb"><Link href="/">Inicio</Link><span>›</span>Mis pedidos</nav><h1>Mis pedidos</h1>
  {loading?<p role="status">Cargando tus pedidos…</p>:error?<p role="alert">{error}</p>:orders.length?<div className="orders-list">{orders.map(order=><div key={order.id}><span className="order-status">{({completed:'Pagado',pending:'Pendiente de confirmación',capturing:'Verificando pago',creating:'Preparando pago',created:'Pago sin completar',denied:'Pago rechazado',failed:'Pago fallido',expired:'Intento vencido'} as Record<string,string>)[order.status]||order.status}</span><OrderReceipt order={order} title={order.title}/></div>)}</div>:<div className="v18-empty-offers"><h2>Tus compras aparecerán aquí</h2><p>Encuentra un deseo y descubre las ofertas del grupo.</p><Link href="/explorar">Explorar deseos →</Link></div>}
 </main>;
}
