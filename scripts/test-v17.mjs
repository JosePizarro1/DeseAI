// Prueba local con respuestas simuladas: no llama a Supabase ni a OpenAI.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const ts=require('typescript');
const source=fs.readFileSync(path.resolve('lib/wish-ai.ts'),'utf8');
const transpiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const mock={
  title:'Audífonos inalámbricos cómodos',summary:'Quieren audífonos Bluetooth para reuniones.',
  category:'Audífonos',city:'Lima',budget_amount:90,currency:'PEN',date_label:'',
  canonical_intent:'audífonos Bluetooth inalámbricos para trabajar',
};
const calls=[];
const fetch=async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('/responses'))return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:JSON.stringify(mock)}]}]})};
  if(url.endsWith('/embeddings'))return {ok:true,json:async()=>({data:[{embedding:Array(512).fill(0.1)}]})};
  throw Error('URL de API inesperada');
};
const output={exports:{}};
vm.runInNewContext(transpiled,{module:output,exports:output.exports,fetch,process:{env:{OPENAI_API_KEY:'test-key'}},AbortSignal}, {filename:'wish-ai.js'});
const api=output.exports;
const draft=api.validateDraft({text:'Busco auriculares inalámbricos cómodos en Lima',location:'Lima, Perú',budget:'S/90',date:''});
assert.equal(draft.location,'Lima, Perú');
assert.throws(()=>api.validateDraft({text:'hola'}));
const result=await api.interpretWish(draft);
assert.equal(result.category,'Audífonos');assert.equal(result.city,'Lima');assert.equal(result.budget_amount,90);
const view=api.toView(result);assert.equal(view.source,'ai');assert.equal(view.budget,'S/ 90');
const embedding=await api.embedWish(result.canonical_intent);assert.equal(embedding.length,512);
assert.equal(calls.length,2);assert.ok(calls[0].options.headers.Authorization.startsWith('Bearer '));
mock.summary='Contacto: ventas@example.com +51987654321';
const sanitized=await api.interpretWish(draft);
assert.ok(!sanitized.summary.includes('example.com'));assert.ok(!sanitized.summary.includes('987654321'));
console.log('V17: validación, JSON de IA, embedding 512D y sanitización: OK (APIs simuladas)');
