// SOLO PayPal Sandbox. Las credenciales y llamadas REST nunca deben ejecutarse en el cliente.
export type Currency = 'USD';
export type CheckoutSnapshot = {
 checkout_id:string; paypal_id:string|null; unit_cents:number;
 unit_currency:Currency; offer_title:string; checkout_status:string;
};

export function sandboxConfigured(){
 return Boolean(process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID?.trim() &&
   !process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID?.startsWith('TU_') &&
   process.env.PAYPAL_SANDBOX_CLIENT_SECRET?.trim() &&
   !process.env.PAYPAL_SANDBOX_CLIENT_SECRET?.startsWith('TU_'));
}

const api='https://api-m.sandbox.paypal.com';
export async function paypalAccessToken():Promise<string>{
 const id=process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID;
 const secret=process.env.PAYPAL_SANDBOX_CLIENT_SECRET;
 if(!sandboxConfigured()||!id||!secret)throw new Error('PayPal Sandbox no está configurado.');
 const body=new URLSearchParams({grant_type:'client_credentials'});
 const response=await fetch(`${api}/v1/oauth2/token`,{
  method:'POST',headers:{Authorization:'Basic '+Buffer.from(`${id}:${secret}`).toString('base64'),
   'Content-Type':'application/x-www-form-urlencoded'},body,cache:'no-store',signal:AbortSignal.timeout(15000)
 });
 if(!response.ok)throw new Error(`PayPal OAuth Sandbox devolvió ${response.status}.`);
 const data=await response.json() as {access_token?:string};
 if(!data.access_token)throw new Error('PayPal Sandbox no devolvió un access token.');
 return data.access_token;
}
export async function paypalRequest(path:string,opts:{method?:string;body?:unknown;idempotencyKey?:string}={}){
 const token=await paypalAccessToken();
 const response=await fetch(`${api}${path}`,{
  method:opts.method||'GET',cache:'no-store',signal:AbortSignal.timeout(20000),
  headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',
   ...(opts.idempotencyKey?{'PayPal-Request-Id':opts.idempotencyKey}:{}),Prefer:'return=representation'},
  ...(opts.body!==undefined?{body:JSON.stringify(opts.body)}:{})
 });
 const raw=await response.text(); let data:unknown;
 try{data=raw?JSON.parse(raw):{};}catch{data={};}
 if(!response.ok)throw new Error(`PayPal Sandbox respondió ${response.status}.`);
 return data as Record<string,unknown>;
}

export function centsAsUsd(cents:number){
 if(!Number.isSafeInteger(cents)||cents<100||cents>10000000)throw new Error('Monto USD inválido.');
 return (cents/100).toFixed(2);
}
export function usdToCents(value:unknown):number{
 if(typeof value!=='string'|| !/^\d+(?:\.\d{1,2})?$/.test(value))throw new Error('Importe PayPal inválido.');
 const [whole,frac='']=value.split('.');
 const cents=Number(whole)*100+Number(frac.padEnd(2,'0'));
 if(!Number.isSafeInteger(cents)||cents<0)throw new Error('Importe PayPal inválido.');
 return cents;
}

export async function createSandboxOrder(snapshot:CheckoutSnapshot):Promise<string>{
 const value=centsAsUsd(snapshot.unit_cents);
 const response=await paypalRequest('/v2/checkout/orders',{
  method:'POST',idempotencyKey:snapshot.checkout_id,
  body:{intent:'CAPTURE',purchase_units:[{
   reference_id:snapshot.checkout_id,custom_id:snapshot.checkout_id,
   description:snapshot.offer_title.slice(0,110),
   amount:{currency_code:'USD',value},
  }],payment_source:{paypal:{experience_context:{shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW'}}}}
 });
 if(typeof response.id!=='string'||response.id.length<5)throw new Error('PayPal no generó una orden válida.');
 return response.id;
}

type CaptureResult={orderId:string;captureId:string;status:'COMPLETED'|'PENDING'|'DENIED';amountCents:number;currency:'USD'};
export function readVerifiedCapture(order:Record<string,unknown>,snapshot:CheckoutSnapshot,expectedOrderId:string):CaptureResult{
 if(order.id!==expectedOrderId)throw new Error('El identificador de orden PayPal no coincide.');
 const units=order.purchase_units;
 if(!Array.isArray(units)||units.length!==1)throw new Error('Se recibió una unidad de compra inesperada.');
 const unit=units[0] as Record<string,unknown>;
 if(unit.reference_id!==snapshot.checkout_id)throw new Error('La referencia de compra no coincide.');
 const unitAmount=unit.amount as Record<string,unknown>|undefined;
 if(unitAmount?.currency_code!=='USD'||usdToCents(unitAmount.value)!==snapshot.unit_cents)
  throw new Error('El importe de la orden no coincide.');
 const payments=unit.payments as Record<string,unknown>|undefined;
 const captures=payments?.captures;
 if(!Array.isArray(captures)||captures.length!==1)throw new Error('No se devolvió una captura PayPal verificable.');
 const capture=captures[0] as Record<string,unknown>;
 const amount=capture.amount as Record<string,unknown>|undefined;
 if(typeof capture.id!=='string'||capture.id.length<5)throw new Error('La captura no tiene identificador válido.');
 if(!['COMPLETED','PENDING','DENIED'].includes(String(capture.status)))throw new Error('La captura aún no tiene estado definitivo.');
 if(amount?.currency_code!=='USD'||usdToCents(amount.value)!==snapshot.unit_cents)
  throw new Error('El importe de captura no coincide.');
 return {orderId:expectedOrderId,captureId:capture.id,status:capture.status as CaptureResult['status'],
  amountCents:snapshot.unit_cents,currency:'USD'};
}

export async function captureSandboxOrder(snapshot:CheckoutSnapshot,orderId:string){
 const data=await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,{
  method:'POST',body:{},idempotencyKey:`c-${snapshot.checkout_id}`
 });
 return readVerifiedCapture(data,snapshot,orderId);
}
export async function verifyWebhookSignature(headers:Headers,event:unknown):Promise<boolean>{
 const webhookId=process.env.PAYPAL_WEBHOOK_ID;
 if(!webhookId||webhookId.startsWith('TU_'))throw new Error('PAYPAL_WEBHOOK_ID no está configurado.');
 const transmissionId=headers.get('paypal-transmission-id');
 const transmissionTime=headers.get('paypal-transmission-time');
 const transmissionSig=headers.get('paypal-transmission-sig');
 const certUrl=headers.get('paypal-cert-url');
 const authAlgo=headers.get('paypal-auth-algo');
 if(!transmissionId||!transmissionTime||!transmissionSig||!certUrl||!authAlgo)return false;
 // Delega la validación criptográfica a la API oficial de PayPal.
 const result=await paypalRequest('/v1/notifications/verify-webhook-signature',{
  method:'POST',body:{auth_algo:authAlgo,cert_url:certUrl,transmission_id:transmissionId,
   transmission_sig:transmissionSig,transmission_time:transmissionTime,webhook_id:webhookId,webhook_event:event},
 });
 return result.verification_status==='SUCCESS';
}
