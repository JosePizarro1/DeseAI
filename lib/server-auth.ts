import {createClient, type SupabaseClient} from '@supabase/supabase-js';

// Sin service_role: las consultas respetan Row Level Security del usuario autenticado.
export async function authenticatedRequest(request:Request):Promise<{db:SupabaseClient;userId:string}> {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 const token=request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!url || !key || !token || !url.startsWith('https://')) throw new Error('Sesión no disponible.');
 const db=createClient(url,key,{
   auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
   global:{headers:{Authorization:`Bearer ${token}`}},
 });
 const {data:{user},error}=await db.auth.getUser(token); // verificamos JWT con Supabase Auth
 if(error || !user) throw new Error('Sesión anónima no válida.');
 return {db,userId:user.id};
}
