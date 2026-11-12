import type {SupabaseClient} from '@supabase/supabase-js';
import {rankWishCandidates,type AIResult} from './wish-ai';
import type {SharedMatch} from './supabase';

export async function findMatches(db:SupabaseClient, result:AIResult,vector:number[]|null,excludeId:string|null=null):Promise<SharedMatch[]> {
 if(vector===null) {
   const {data,error}=await db.rpc('wish_match_candidates',{
     match_category:result.category,match_city:result.city,match_budget:result.budget_amount,
     match_currency:result.currency,exclude_wish_id:excludeId,
   });
   if(error)throw new Error(`Error al buscar candidatos: ${error.message}`);
   const candidates=(data||[]) as SharedMatch[];
   if(!candidates.length)return [];
   const ranked=await rankWishCandidates(result.canonical_intent,candidates.map(c=>({id:c.id,title:c.title,summary:c.summary})));
   const scores=new Map<string,number>();
   for(const item of ranked) {
     if(typeof item.id==='string' && Number.isFinite(item.similarity) && item.similarity>=0.6 && item.similarity<=1)
       scores.set(item.id,item.similarity);
   }
   return candidates.filter(c=>scores.has(c.id)).map(c=>({...c,similarity:scores.get(c.id)!}))
     .sort((a,b)=>b.similarity-a.similarity).slice(0,5);
 }
 const {data,error}=await db.rpc('match_wishes',{
   query_embedding:`[${vector.join(',')}]`,
   match_category:result.category,
   match_city:result.city,
   match_budget:result.budget_amount,
   match_currency:result.currency,
   exclude_wish_id:excludeId,
   match_count:5,
 });
 if(error) throw new Error(`Error al buscar coincidencias: ${error.message}`);
 return (data||[]) as SharedMatch[];
}
