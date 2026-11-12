'use client';
import {useEffect,useRef,useState} from 'react';
import {bearerHeaders,browserDB,ensureVisitor} from '@/lib/supabase';

type PaymentSession={start:(options:{presentationMode:'auto'},order:Promise<{orderId:string}>)=>Promise<unknown>};
type PaypalInstance={
 findEligibleMethods:(options:{currencyCode:string;amount:string})=>Promise<{isEligible:(name:string)=>boolean}>;
 createPayPalOneTimePaymentSession:(opts:{onApprove:(data:{orderId:string})=>Promise<void>;
  onCancel:()=>void;onError:(error:unknown)=>void})=>PaymentSession;
};
type PaypalGlobal={createInstance:(opts:{clientId:string;components:string[];pageType:string})=>Promise<PaypalInstance>};
type ExtendedWindow=Window & {paypal?:PaypalGlobal;__deseaiSdkPromise?:Promise<void>};
function sdkLoad():Promise<void>{
 const w=window as ExtendedWindow;
 if(w.paypal)return Promise.resolve();
 if(w.__deseaiSdkPromise)return w.__deseaiSdkPromise;
 w.__deseaiSdkPromise=new Promise<void>((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://www.sandbox.paypal.com/web-sdk/v6/core';script.async=true;
  script.onload=()=>w.paypal?resolve():reject(new Error('PayPal no se cargó correctamente.'));
  script.onerror=()=>reject(new Error('No se pudo cargar PayPal Sandbox.'));
  document.head.appendChild(script);
 }).catch(e=>{w.__deseaiSdkPromise=undefined;throw e;});
 return w.__deseaiSdkPromise;
}
async function readApi(response:Response){
 const data=await response.json().catch(()=>({})) as {error?:string;orderId?:string;status?:string;captureId?:string};
 if(!response.ok)throw new Error(data.error||`Error HTTP ${response.status}`);
 return data;
}
export default function PayPalSandboxCheckout({offerId,priceCents,enabled,onPaid}:{offerId:string;priceCents:number;enabled:boolean;onPaid:()=>void}){
 const container=useRef<HTMLDivElement>(null);const onPaidRef=useRef(onPaid);onPaidRef.current=onPaid;
 const [status,setStatus]=useState('');const [ready,setReady]=useState(false);
 const [pending,setPending]=useState(false);const [paid,setPaid]=useState(false);const [loading,setLoading]=useState(false);
 const clientId=process.env.NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID||'';
 const configured=clientId.length>8&&!clientId.startsWith('TU_');
 useEffect(()=>{
  let live=true;
  if(!enabled||!configured)return;
  ensureVisitor().then(async session=>{
   if(!live||!session)return;
   const {data}=await browserDB()!.from('payment_orders')
    .select('status').eq('offer_id',offerId).eq('buyer_id',session.user.id).maybeSingle();
   if(live&&data?.status==='completed'){setPaid(true);setStatus('✓ Tu pago se confirmó.');}
   else if(live&&['pending','capturing'].includes(data?.status||'')){setPending(true);setStatus('La operación está en verificación con PayPal. No vuelvas a pagar.');}
  }).catch(()=>{});
  return()=>{live=false};
 },[offerId,enabled,configured]);
 useEffect(()=>{
  if(!enabled||!configured||paid||pending)return;
  let active=true;let button:HTMLElement|null=null;
  async function setup(){
   try{
    await sdkLoad();if(!active)return;
    const sdk=await (window as ExtendedWindow).paypal!.createInstance({
     clientId,components:['paypal-payments'],pageType:'checkout'
    });
    const methods=await sdk.findEligibleMethods({currencyCode:'USD',amount:(priceCents/100).toFixed(2)});
    if(!methods.isEligible('paypal'))throw new Error('PayPal no está disponible para esta cuenta o región de prueba.');
    const session=sdk.createPayPalOneTimePaymentSession({
     onApprove:async ({orderId})=>{
      if(!active)return;
      setLoading(true);setStatus('Confirmando tu pedido…');
      try{
       const headers=await bearerHeaders();
       const result=await readApi(await fetch('/api/paypal/capture',{
        method:'POST',headers,body:JSON.stringify({orderId})
       }));
       if(!active)return;
       if(result.status==='completed'){
        setPaid(true);setStatus('✓ Tu pago se confirmó.');onPaidRef.current();
       }else {setPending(true);setStatus('El pago está pendiente. Aún no se confirma la compra.');}
      }catch(e){if(active)setStatus(e instanceof Error?e.message:'No se pudo confirmar el pago.');}
      finally{if(active)setLoading(false)}
     },
     onCancel:()=>{if(active){setLoading(false);setStatus('Cancelaste el pago. No se realizó ningún cargo.');}},
     onError:(error)=>{if(active){setLoading(false);setStatus(error instanceof Error?error.message:'Hubo un error en PayPal Sandbox.');}}
    });
    button=document.createElement('paypal-button');button.setAttribute('type','pay');
    button.setAttribute('class','paypal-gold');
    button.addEventListener('click',async()=>{
     if(!active)return;
     setLoading(true);setStatus('Preparando tu pago…');
     const createOrder=(async()=>{
      const headers=await bearerHeaders();
      const response=await fetch('/api/paypal/orders',{
       method:'POST',headers,body:JSON.stringify({offerId})
      });
      const result=await readApi(response);
      if(!result.orderId)throw new Error('No se recibió una orden válida.');
      return {orderId:result.orderId};
     })();
     try{
      // SDK v6 requiere una Promise<{orderId}>, NO la referencia a una función.
      await session.start({presentationMode:'auto'},createOrder);
     }catch(e){if(active)setStatus(e instanceof Error?e.message:'No se pudo iniciar el pago.');}
     finally{if(active)setLoading(false)}
    });
    if(active&&container.current){container.current.replaceChildren(button);setReady(true)}
   }catch(e){if(active)setStatus(e instanceof Error?e.message:'No se pudo cargar el botón de pago.');}
  }
  setup();
  return()=>{active=false;if(button)button.remove();};
 },[enabled,configured,offerId,priceCents,clientId,paid,pending]);
 if(!enabled)return null;
 if(!configured)return <div className="v18-note">El pago estará disponible pronto.</div>;
 if(paid)return <p className="v18-payment-success" role="status">{status||'✓ Tu pago se confirmó.'}</p>;
 if(pending)return <p className="v18-note" role="status">{status||'Estamos esperando la confirmación de tu pago.'}</p>;
 return <div className="v18-paypal-area" aria-label="Comprar con PayPal">
  <h3 className="purchase-pay-title">Comprar con PayPal</h3>

  <div ref={container} className="v18-paypal-button" aria-busy={loading} />
  {!ready&&!status&&<p className="v18-note">Cargando PayPal…</p>}
  {status&&<p className="v18-note" role="status">{status}</p>}
 </div>;
}
