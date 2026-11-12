import Link from 'next/link';
export type OrderSummary={id:string;price_cents:number;currency:string;status:string;paypal_order_id:string|null;created_at:string;offer_id:string};
export default function OrderReceipt({order,title,compact=false}:{order:OrderSummary;title:string;compact?:boolean}){
 const amount=new Intl.NumberFormat('es-PE',{style:'currency',currency:order.currency}).format(order.price_cents/100);
 const completed=order.status==='completed';
 const heading=({completed:'¡Tu pedido está confirmado!',pending:'Estamos verificando tu pago',capturing:'Estamos verificando tu pago',created:'Tu pago está sin completar',creating:'Preparando tu pago',denied:'Tu pago fue rechazado',failed:'No se completó el pago',expired:'Este intento de pago venció'} as Record<string,string>)[order.status]||'Estado de tu pedido';
 return <section className={'order-receipt '+(compact?'compact':'')} aria-label="Resumen de tu pedido">
  <div className="order-success"><span aria-hidden="true">{completed?'✓':'◷'}</span><div><h2>{heading}</h2><p>{completed?`Pagaste ${amount} con PayPal`:'Revisa el estado antes de intentar otro pago.'}</p></div></div>
  <div className="order-body"><span className="section-kicker">TU PEDIDO</span><h3>{title}</h3><p className="order-number">Pedido {order.paypal_order_id||order.id}</p>
   <div className="order-line"><span>Cantidad</span><strong>1 unidad</strong></div>
   <div className="order-line total"><span>{completed?'Total pagado':'Importe'}</span><strong>{amount}</strong></div>
   <p className="order-date">{new Date(order.created_at).toLocaleDateString('es-PE')}</p>
   {completed&&<div className="order-next"><strong>✓ Pago confirmado</strong><p>La coordinación de entrega estará disponible en una próxima versión.</p></div>}
   {compact&&<Link className="purchase-join" href="/pedidos">Ver mi pedido →</Link>}
   <Link className="order-explore" href="/explorar">Seguir explorando</Link>
  </div>
 </section>;
}
