import {NextResponse} from 'next/server';
import {authenticatedRequest} from '@/lib/server-auth';
import {groqConfigured,embedWish,interpretWish,toView,validateDraft} from '@/lib/wish-ai';
import {findMatches} from '@/lib/wish-matches';
export const runtime='nodejs';
export async function POST(request:Request) {
 try {
   const {db}=await authenticatedRequest(request);
   const draft=validateDraft(await request.json());
   if(!groqConfigured() && (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('TU_')))
     return NextResponse.json({error:'Falta configurar GROQ_API_KEY en el servidor.'},{status:503});
   const {data:allowed,error:limitError}=await db.rpc('take_ai_slot');
   if(limitError)throw new Error(`Límite de IA: ${limitError.message}`);
   if(!allowed)return NextResponse.json({error:'Límite de 20 análisis por sesión y día. Vuelve a intentarlo mañana.'},{status:429});
   // La IA no inventa compradores: consulta únicamente deseos publicados en Supabase.
   const analyzed=await interpretWish(draft);
   const vector=groqConfigured()?null:await embedWish(analyzed.canonical_intent);
   const matches=await findMatches(db,analyzed,vector);
   return NextResponse.json({analysis:toView(analyzed),matches,mode:'ai'}, {headers:{'Cache-Control':'no-store'}});
 } catch(e) {
   const message=e instanceof Error?e.message:'No se pudo analizar el deseo.';
   const status=/\(429\)/.test(message)?429:/Sesión/.test(message)?401:/Solicitud|Describe|Revisa/.test(message)?400:/configurada/.test(message)?503:502;
   return NextResponse.json({error:message},{status});
 }
}
