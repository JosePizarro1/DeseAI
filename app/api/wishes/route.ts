import {NextResponse} from 'next/server';
import {authenticatedRequest} from '@/lib/server-auth';
import {groqConfigured,embedWish,interpretWish,toView,validateDraft} from '@/lib/wish-ai';
import {findMatches} from '@/lib/wish-matches';
export const runtime='nodejs';
export async function POST(request:Request) {
 try {
   const {db,userId}=await authenticatedRequest(request);
   const draft=validateDraft(await request.json());
   if(!groqConfigured() && (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('TU_')))
     return NextResponse.json({error:'Falta configurar GROQ_API_KEY en el servidor.'},{status:503});
   const {data:allowed,error:limitError}=await db.rpc('take_ai_slot');
   if(limitError)throw new Error(`Límite de IA: ${limitError.message}`);
   if(!allowed)return NextResponse.json({error:'Límite de 20 análisis por sesión y día. Vuelve a intentarlo mañana.'},{status:429});
   // Reinterpretar en el servidor: no confiar en campos públicos suministrados desde el navegador.
   const analyzed=await interpretWish(draft);
   const vector=groqConfigured()?null:await embedWish(analyzed.canonical_intent);
   const {data,error}=await db.from('wishes').insert({
     owner_id:userId, raw_text:draft.text, title:analyzed.title,
     summary:analyzed.summary,category:analyzed.category,city:analyzed.city,
     budget_amount:analyzed.budget_amount,currency:analyzed.currency,
     date_label:analyzed.date_label,embedding:vector?`[${vector.join(',')}]`:null,
   }).select('id,created_at').single();
   if(error)throw new Error(`No se pudo guardar en Supabase: ${error.message}`);
   // Un error de búsqueda no debe convertir un guardado exitoso en un fallo que cause duplicados.
   const matches=await findMatches(db,analyzed,vector,data.id).catch(()=>[]);
   return NextResponse.json({wish:{id:data.id,created_at:data.created_at,...toView(analyzed)},matches,mode:'cloud'},
     {status:201,headers:{'Cache-Control':'no-store'}});
 } catch(e) {
   const message=e instanceof Error?e.message:'No se pudo publicar el deseo.';
   const status=/\(429\)/.test(message)?429:/Sesión/.test(message)?401:/Solicitud|Describe|Revisa/.test(message)?400:/configurada/.test(message)?503:502;
   return NextResponse.json({error:message},{status});
 }
}
