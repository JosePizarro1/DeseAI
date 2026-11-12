import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=ts.transpileModule(readFileSync(new URL('../lib/supabase.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
let signIns=0,fail=false,current=null;
const db={auth:{
 async getSession(){await new Promise(resolve=>setTimeout(resolve,5));return {data:{session:current},error:null};},
 async signInAnonymously(){signIns++;await new Promise(resolve=>setTimeout(resolve,5));if(fail)return {data:{session:null},error:new Error('temporary failure')};current={access_token:'test-token',user:{id:'one-visitor'}};return {data:{session:current},error:null};}
}};
const module={exports:{}};
vm.runInNewContext(source,{module,exports:module.exports,process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://test.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'public-test'}},require(name){assert.equal(name,'@supabase/supabase-js');return {createClient:()=>db};}});
const {ensureVisitor}=module.exports;
const results=await Promise.all(Array.from({length:8},()=>ensureVisitor()));
assert.equal(signIns,1,'concurrent consumers must share one sign-in');
assert.ok(results.every(session=>session===results[0]));
await ensureVisitor();assert.equal(signIns,1,'existing session must be reused');
current=null;fail=true;await assert.rejects(ensureVisitor(),/temporary failure/);
fail=false;await ensureVisitor();assert.equal(signIns,3,'a failed request must allow retry');
console.log('Session regression: concurrent sign-in, identity reuse and retry passed.');
