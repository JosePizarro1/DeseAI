// npm run test:payments: pruebas de lógica, PayPal simulado. NUNCA red.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const pathTo=path.resolve('lib/paypal.ts');
const src=fs.readFileSync(pathTo,'utf8');
const transpile=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
assert.equal(transpile.diagnostics?.length??0,0);
const module={exports:{}};
const apiFetch=async(url,options)=>{
 const pathname=String(url);
 if(pathname.endsWith('/v1/oauth2/token')){
  assert.match(options.headers.Authorization,/^Basic /);
  return {ok:true,json:async()=>({access_token:'sandbox-access-token'})};
 }
 if(pathname.endsWith('/v2/checkout/orders')&&options.method==='POST'){
  const payload=JSON.parse(options.body);
  assert.equal(payload.intent,'CAPTURE');
  assert.equal(payload.purchase_units[0].amount.value,'19.99');
  assert.equal(payload.purchase_units[0].amount.currency_code,'USD');
  assert.equal(payload.purchase_units[0].reference_id,'checkout-01');
  return {ok:true,text:async()=>JSON.stringify({id:'PAYPAL-SANDBOX-01'})};
 }
 if(pathname.includes('/v2/checkout/orders/PAYPAL-SANDBOX-01/capture')){
  return {ok:true,text:async()=>JSON.stringify(validOrder)};
 }
 if(pathname.includes('verify-webhook-signature')){
  return {ok:true,text:async()=>JSON.stringify({verification_status:'SUCCESS'})};
 }
 throw Error(`Llamada PayPal inesperada: ${pathname}`);
};
vm.runInNewContext(transpile.outputText,{
 module,exports:module.exports,fetch:apiFetch,Buffer,AbortSignal,URLSearchParams,
 process:{env:{NEXT_PUBLIC_PAYPAL_SANDBOX_CLIENT_ID:'test-client',PAYPAL_SANDBOX_CLIENT_SECRET:'test-secret',PAYPAL_WEBHOOK_ID:'WEBHOOK-ID'}}
},{filename:'paypal.js'});
const p=module.exports;
const snapshot={checkout_id:'checkout-01',paypal_id:null,unit_cents:1999,unit_currency:'USD',offer_title:'Audífonos colectivos',checkout_status:'creating'};
const validOrder={id:'PAYPAL-SANDBOX-01',purchase_units:[{reference_id:'checkout-01',amount:{currency_code:'USD',value:'19.99'},payments:{captures:[{id:'CAPTURE-SANDBOX-01',status:'COMPLETED',amount:{currency_code:'USD',value:'19.99'}}]}}]};
assert.equal(p.centsAsUsd(1999),'19.99');
assert.equal(p.usdToCents('19.99'),1999);
assert.equal(p.usdToCents('19.9'),1990);
assert.throws(()=>p.usdToCents('19.999'));
assert.throws(()=>p.usdToCents('19x99'));
assert.throws(()=>p.centsAsUsd(-3));
assert.equal(await p.createSandboxOrder(snapshot),'PAYPAL-SANDBOX-01');
const captured=await p.captureSandboxOrder(snapshot,'PAYPAL-SANDBOX-01');
assert.equal(captured.status,'COMPLETED');assert.equal(captured.amountCents,1999);
assert.throws(()=>p.readVerifiedCapture({...validOrder,id:'OTRA'},snapshot,'PAYPAL-SANDBOX-01'));
assert.throws(()=>p.readVerifiedCapture({...validOrder,purchase_units:[{...validOrder.purchase_units[0],reference_id:'otro'}]},snapshot,'PAYPAL-SANDBOX-01'));
assert.throws(()=>p.readVerifiedCapture({...validOrder,purchase_units:[{...validOrder.purchase_units[0],amount:{currency_code:'USD',value:'0.01'}}]},snapshot,'PAYPAL-SANDBOX-01'));
const headerValues=new Map([
 ['paypal-transmission-id','T-01'],['paypal-transmission-time','2026-11-10T12:00:00Z'],
 ['paypal-transmission-sig','signed'],['paypal-cert-url','https://api.paypal.com/cert'],['paypal-auth-algo','SHA256withRSA']
]);
const headers={get:(name)=>headerValues.get(name)};
assert.equal(await p.verifyWebhookSignature(headers,{id:'WEBHOOK-01'}),true);
assert.equal(await p.verifyWebhookSignature({get:()=>null},{id:'WEBHOOK-01'}),false);
const sql=fs.readFileSync('supabase/migration_v18.sql','utf8');
assert.match(sql,/for update/gi);
assert.match(sql,/revoke all on function public\.begin_checkout\(uuid,uuid\) from public,anon,authenticated;/);
assert.match(sql,/security definer set search_path=''/);
assert.match(sql,/unique\(offer_id,buyer_id\)/);
assert.match(sql,/from public\.wish_interests/);
assert.match(sql,/PAYPAL|paypal/i);
const orderApi=fs.readFileSync('app/api/paypal/orders/route.ts','utf8');
assert.match(orderApi,/authenticatedRequest/);
assert.doesNotMatch(orderApi,/body\.price|body\.amount|body\.cents/);
const hook=fs.readFileSync('app/api/paypal/webhook/route.ts','utf8');
assert.ok(hook.indexOf('verifyWebhookSignature')<hook.indexOf('applyPayPalCapture'));
console.log('V18: amount-safe, captura, discrepancias, firma webhook, autorización y SQL: OK (PayPal simulado).');
