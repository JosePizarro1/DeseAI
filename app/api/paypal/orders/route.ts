import {NextResponse} from 'next/server';
import {authenticatedRequest} from '@/lib/server-auth';
import {beginCheckout,paymentAdmin} from '@/lib/payments-server';
import {createSandboxOrder,sandboxConfigured} from '@/lib/paypal';
export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function POST(request:Request){
 let checkoutId:string|null=null;
 try{
  if(!sandboxConfigured())return NextResponse.json({error:'PayPal Sandbox no está configurado.'},{status:503});
  const {userId}=await authenticatedRequest(request);
  const body=await request.json().catch(()=>({})) as Record<string,unknown>;
  const offerId=body.offerId;
  if(typeof offerId!=='string'||!/^[0-9a-f-]{36}$/i.test(offerId))
   return NextResponse.json({error:'Oferta no válida.'},{status:400});
  const checkout=await beginCheckout(userId,offerId);
  if(checkout.checkout_status==='created'&&checkout.paypal_id)
   return NextResponse.json({orderId:checkout.paypal_id});
  checkoutId=checkout.checkout_id;
  const orderId=await createSandboxOrder(checkout);
  const {data,error}=await paymentAdmin().rpc('register_paypal_order',{
   p_checkout_id:checkout.checkout_id,p_order_id:orderId
  });
  if(error||data!==true)throw new Error('No pudimos registrar la orden creada por PayPal.');
  return NextResponse.json({orderId});
 }catch(error){
  if(checkoutId){
   try{await paymentAdmin().rpc('fail_checkout',{p_checkout_id:checkoutId});}catch{/* conserva error principal */}
  }
  // Evita exponer detalles internos de PayPal, claves o consultas SQL al navegador.
  const msg=error instanceof Error?error.message:'No se pudo preparar el pago.';
  const safe=/^(Sesión|Esta oferta|El vendedor|Comprador inválido|Primero expresa|Todavía faltan|Ya realizaste|Tu pago está pendiente|Tu pedido se está preparando|Tu pago ya está en verificación|No quedan unidades)/.test(msg)?msg:'No se pudo crear la orden en Sandbox. Revisa la configuración o inténtalo de nuevo.';
  return NextResponse.json({error:safe},{status:/^Sesión/.test(msg)?401:400});
 }
}
