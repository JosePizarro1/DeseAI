import {NextResponse} from 'next/server';
import {authenticatedRequest} from '@/lib/server-auth';
import {getBuyerPayment,applyPayPalCapture,paymentAdmin} from '@/lib/payments-server';
import {captureSandboxOrder,readVerifiedCapture,paypalRequest,type CheckoutSnapshot} from '@/lib/paypal';
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:Request){
 try{
  const {userId}=await authenticatedRequest(request);
  const body=await request.json().catch(()=>({})) as Record<string,unknown>;
  const orderId=body.orderId;
  if(typeof orderId!=='string'||! /^[A-Za-z0-9-]{5,100}$/.test(orderId))
   return NextResponse.json({error:'Orden de PayPal inválida.'},{status:400});
  const payment=await getBuyerPayment(userId,orderId);
  if(payment.status==='completed')return NextResponse.json({status:'completed',captureId:payment.paypal_capture_id});
  if(payment.status==='denied'||payment.status==='failed'||payment.status==='expired')
   return NextResponse.json({error:'Esta reserva de compra ya no está vigente.'},{status:409});
  if(!['created','pending','capturing'].includes(payment.status))
   return NextResponse.json({error:'Esta orden no puede capturarse.'},{status:409});
  const snapshot:CheckoutSnapshot={checkout_id:payment.id,paypal_id:payment.paypal_order_id,
   unit_cents:payment.price_cents,unit_currency:payment.currency,offer_title:'',checkout_status:payment.status};
  // Si la confirmación del frontend se perdió y ya capturamos, consultamos a PayPal
  // en lugar de intentar ejecutar una segunda captura.
  let captured;
  if(payment.status==='pending'){
   captured=readVerifiedCapture(await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}`),snapshot,orderId);
  }else{
   // Reclama el cupo ANTES de contactar PayPal (evita la doble venta al expirar el checkout).
   const {data,error}=await paymentAdmin().rpc('claim_capture',{p_checkout_id:payment.id});
   if(error||data!==true)throw new Error('Checkout ya en proceso o vencido.');
   captured=await captureSandboxOrder(snapshot,orderId);
  }
  const state=await applyPayPalCapture(orderId,captured.captureId,captured.status,captured.amountCents);
  return NextResponse.json({status:state,captureId:captured.captureId});
 }catch(error){
  const msg=error instanceof Error?error.message:'';
  const code=/Sesión|no corresponde/.test(msg)?401:400;
  return NextResponse.json({error:code===401?'Sesión no válida o pedido ajeno.':'No pudimos confirmar el pago. Revisa el estado en Sandbox antes de intentar de nuevo.'},{status:code});
 }
}
