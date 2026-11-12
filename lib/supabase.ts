import {createClient, type SupabaseClient, type Session} from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
let singleton: SupabaseClient | null = null;

export function cloudConfigured() {
  return Boolean(url && key && /^https:\/\//.test(url) && !url.includes('TU_PROYECTO') && !key?.startsWith('TU_'));
}

// Solo lo llamamos en el navegador. Supabase conserva la sesión anónima entre visitas.
export function browserDB() {
  if (!cloudConfigured()) return null;
  if (!singleton) singleton = createClient(url!, key!, {
    auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: false},
  });
  return singleton;
}

let visitorRequest: Promise<Session | null> | null = null;

export function ensureVisitor(): Promise<Session | null> {
  // Header and page mount together. Share their request so a fresh visitor
  // receives one identity rather than two competing anonymous sign-ins.
  if (!visitorRequest) {
    visitorRequest = loadVisitor().finally(() => {visitorRequest = null;});
  }
  return visitorRequest;
}

async function loadVisitor(): Promise<Session | null> {
  const db = browserDB();
  if (!db) return null;
  const {data: sessionResult, error: sessionError} = await db.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionResult.session?.access_token) return sessionResult.session;
  const {data, error} = await db.auth.signInAnonymously();
  if (error || !data.session) throw error ?? new Error('No se pudo abrir una sesión anónima.');
  return data.session;
}

export async function bearerHeaders() {
  const session = await ensureVisitor();
  if (!session?.access_token) throw new Error('No hay una sesión activa.');
  return {'Content-Type':'application/json', Authorization:`Bearer ${session.access_token}`};
}

export type SharedCard={
  wish_id:string; title:string; summary:string; category:string; city:string;
  budget_amount:number|null; currency:string; interest_count:number; created_at:string;
};
export type SharedMatch={id:string; title:string; summary:string; category:string;
  city:string; budget_amount:number|null; currency:string; similarity:number};
export type OwnWish={id:string; raw_text:string; title:string; summary:string;
  category:string; city:string; budget_amount:number|null; currency:string; created_at:string};
