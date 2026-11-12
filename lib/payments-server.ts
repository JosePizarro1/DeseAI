import {createClient} from '@supabase/supabase-js';
import type {CheckoutSnapshot} from './paypal';

// NUNCA exportar este cliente desde componentes 'use client'.
export function paymentAdmin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!url.startsWith('https://')||url.includes('TU_PROYECTO')||!secret||secret.startsWith('TU_'))
   throw new Error('Falta configurar SUPABASE_SERVICE_ROLE_KEY o la URL de Supabase.');
 return createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
export async function beginCheckout(buyerId:string,offerId:string):Promise<CheckoutSnapshot>{
 const admin=paymentAdmin();
 const {data,error}=await admin.rpc('begin_checkout',{p_buyer_id:buyerId,p_offer_id:offerId});
 if(error)throw new Error(error.message);
 const checkout=data?.[0] as CheckoutSnapshot|undefined;
 if(!checkout)throw new Error('No fue posible preparar tu compra.');
 return checkout;
}
export async function getBuyerPayment(buyerId:string,paypalOrderId:string){
 const admin=paymentAdmin();
 const {data,error}=await admin.from('payment_orders').select('*')
  .eq('buyer_id',buyerId).eq('paypal_order_id',paypalOrderId).maybeSingle();
 if(error||!data)throw new Error('Esta orden no corresponde a tu sesión.');
 return data;
}
export async function applyPayPalCapture(orderId:string,captureId:string,status:string,amountCents:number,eventId?:string,eventType?:string){
 const admin=paymentAdmin();
 const {data,error}=await admin.rpc('apply_paypal_signal',{
  p_order_id:orderId,p_capture_id:captureId,p_status:status,
  p_amount_cents:amountCents,p_currency:'USD',p_event_id:eventId||null,p_event_type:eventType||null
 });
 if(error)throw new Error(error.message);
 return data as string;
}
