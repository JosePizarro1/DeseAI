import {NextResponse} from 'next/server';
import {verifyWebhookSignature,usdToCents} from '@/lib/paypal';
import {applyPayPalCapture,paymentAdmin} from '@/lib/payments-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';

type Event={id?:string;event_type?:string;resource?:{
 id?:string;status?:string;amount?:{value?:string;currency_code?:string};
 supplementary_data?:{related_ids?:{order_id?:string}};
}};
const allowed:Record<string,'COMPLETED'|'PENDING'|'DENIED'>={
 'PAYMENT.CAPTURE.COMPLETED':'COMPLETED',
 'PAYMENT.CAPTURE.PENDING':'PENDING',
 'PAYMENT.CAPTURE.DENIED':'DENIED',
};
export async function POST(request:Request){
 try{
  const raw=await request.text();
  if(raw.length>150000)return NextResponse.json({error:'Payload demasiado grande.'},{status:413});
  const event=JSON.parse(raw) as Event;
  const valid=await verifyWebhookSignature(request.headers,event);
  if(!valid)return NextResponse.json({error:'Firma de PayPal inválida.'},{status:401});
  const status=allowed[event.event_type||''];
  if(!status)return NextResponse.json({received:true,ignored:true});
  const resource=event.resource;
  if(!event.id||!resource?.id||resource.status!==status||resource.amount?.currency_code!=='USD')
   return NextResponse.json({error:'Evento de pago incompleto.'},{status:422});
  const amount=usdToCents(resource.amount.value);
  let orderId=resource.supplementary_data?.related_ids?.order_id;
  if(!orderId){
   // Algunas variantes del webhook omiten related_ids; recuperar por captura ya conocida.
   const {data}=await paymentAdmin().from('payment_orders').select('paypal_order_id')
    .eq('paypal_capture_id',resource.id).maybeSingle();
   orderId=data?.paypal_order_id||undefined;
  }
  if(!orderId)return NextResponse.json({error:'No se identificó la orden relacionada.'},{status:422});
  const applied=await applyPayPalCapture(orderId,resource.id,status,amount,event.id,event.event_type);
  return NextResponse.json({received:true,status:applied});
 }catch{
  // 5xx hace que PayPal reintente el webhook; no afirmar que se procesó.
  return NextResponse.json({error:'No se pudo procesar el evento.'},{status:500});
 }
}
