-- DeseAI V17 · Ejecutar una sola vez en Supabase > SQL Editor.
-- Usa una base NUEVA de Supabase. No requiere service_role en la aplicación.
create schema if not exists extensions;
create extension if not exists vector with schema extensions;

-- Deseo original: texto privado, visible únicamente para quien lo creó.
create table if not exists public.wishes (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 raw_text text not null check (char_length(raw_text) between 12 and 600),
 title text not null check (char_length(title) between 3 and 120),
 summary text not null check (char_length(summary) between 3 and 240),
 category text not null check (category in ('Audífonos','Teclados','Celulares','Experiencias','Otros')),
 city text not null default '' check (char_length(city) <= 70),
 budget_amount numeric(12,2),
 currency text not null default 'PEN' check(currency in ('PEN','USD','EUR','OTRO')),
 date_label text not null default '' check (char_length(date_label) <= 70),
 embedding extensions.vector(512) not null,
 created_at timestamptz not null default now()
);
create index if not exists wishes_owner_idx on public.wishes (owner_id,created_at desc);
create index if not exists wishes_category_idx on public.wishes (category,city);
alter table public.wishes enable row level security;
drop policy if exists "Ver solo mis deseos completos" on public.wishes;
create policy "Ver solo mis deseos completos" on public.wishes for select to authenticated using ((select auth.uid())=owner_id);
drop policy if exists "Publicar mis deseos" on public.wishes;
create policy "Publicar mis deseos" on public.wishes for insert to authenticated with check ((select auth.uid())=owner_id);
drop policy if exists "Eliminar solo mis deseos" on public.wishes;
create policy "Eliminar solo mis deseos" on public.wishes for delete to authenticated using ((select auth.uid())=owner_id);

-- Sólo título público, resumen no identificable y atributos agregables.
create table if not exists public.wish_cards (
 wish_id uuid primary key references public.wishes(id) on delete cascade,
 title text not null, summary text not null, category text not null,city text not null,
 budget_amount numeric(12,2),currency text not null,
 interest_count integer not null default 0,
 created_at timestamptz not null
);
create index if not exists wish_cards_new_idx on public.wish_cards (created_at desc);
alter table public.wish_cards enable row level security;
drop policy if exists "Ver resúmenes públicos" on public.wish_cards;
create policy "Ver resúmenes públicos" on public.wish_cards for select to authenticated using (true);
-- No hay permisos públicos de INSERT, UPDATE ni DELETE para las tarjetas.

create or replace function public.copy_wish_to_card() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 insert into public.wish_cards(wish_id,title,summary,category,city,budget_amount,currency,created_at)
 values(new.id,new.title,new.summary,new.category,new.city,new.budget_amount,new.currency,new.created_at);
 return new;
end; $$;
drop trigger if exists wish_published on public.wishes;
create trigger wish_published after insert on public.wishes
 for each row execute function public.copy_wish_to_card();

-- Indicar interés NO realiza pago ni reserva.
create table if not exists public.wish_interests (
 wish_id uuid not null references public.wishes(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(wish_id,user_id)
);
alter table public.wish_interests enable row level security;
drop policy if exists "Mis intereses" on public.wish_interests;
create policy "Mis intereses" on public.wish_interests for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists "Expresar mi interés" on public.wish_interests;
create policy "Expresar mi interés" on public.wish_interests for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "Quitar mi interés" on public.wish_interests;
create policy "Quitar mi interés" on public.wish_interests for delete to authenticated using ((select auth.uid())=user_id);
create or replace function public.refresh_interest_count() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 update public.wish_cards
 set interest_count=(select count(*) from public.wish_interests where wish_id=coalesce(new.wish_id,old.wish_id))
 where wish_id=coalesce(new.wish_id,old.wish_id);
 return coalesce(new,old);
end; $$;
drop trigger if exists wish_interest_added on public.wish_interests;
create trigger wish_interest_added after insert on public.wish_interests
 for each row execute function public.refresh_interest_count();
drop trigger if exists wish_interest_removed on public.wish_interests;
create trigger wish_interest_removed after delete on public.wish_interests
 for each row execute function public.refresh_interest_count();

-- Búsqueda semántica segura: solo devuelve el resumen público, nunca raw_text,
-- owner_id ni el vector original. auth.uid se comprueba dentro de la función.
create or replace function public.match_wishes(
 query_embedding extensions.vector(512),
 match_category text,
 match_city text default '',
 match_budget numeric default null,
 match_currency text default 'PEN',
 exclude_wish_id uuid default null,
 match_count integer default 5
)
returns table(id uuid,title text,summary text,category text,city text,
 budget_amount numeric,currency text,similarity double precision)
language sql stable security definer set search_path = '' as $$
 select c.wish_id,c.title,c.summary,c.category,c.city,c.budget_amount,c.currency,
   (1 - (w.embedding operator(extensions.<=>) query_embedding))::double precision as similarity
 from public.wishes w join public.wish_cards c on c.wish_id=w.id
 where (select auth.uid()) is not null
   and w.owner_id <> (select auth.uid())
   and (exclude_wish_id is null or w.id <> exclude_wish_id)
   and w.category=match_category
   and (coalesce(match_city,'')='' or c.city='' or lower(trim(c.city))=lower(trim(match_city)))
   and (match_budget is null or c.budget_amount is null or
     (c.currency=match_currency and abs(c.budget_amount-match_budget)<=greatest(20::numeric, match_budget*0.35)))
   and 1-(w.embedding operator(extensions.<=>) query_embedding) >= 0.60
 order by w.embedding operator(extensions.<=>) query_embedding
 limit least(greatest(coalesce(match_count,5),1),10)
$$;
revoke all on function public.match_wishes(extensions.vector,text,text,numeric,text,uuid,integer) from public;
grant execute on function public.match_wishes(extensions.vector,text,text,numeric,text,uuid,integer) to authenticated;

-- El frontend utiliza exclusivamente la clave PUBLISHABLE/ANON y políticas RLS.
-- En Auth > Providers habilitar Anonymous Sign-Ins antes de ejecutar la app.

-- Límite por sesión anónima para proteger las llamadas pagadas a la IA.
-- Los límites no sustituyen CAPTCHA: un atacante puede abrir varias sesiones.
create table if not exists public.ai_usage_daily (
 user_id uuid not null references auth.users(id) on delete cascade,
 usage_day date not null,
 calls integer not null default 0,
 primary key(user_id,usage_day)
);
alter table public.ai_usage_daily enable row level security;
-- Sin políticas de lectura/escritura directa. Sólo la función SECURITY DEFINER puede modificarla.
create or replace function public.take_ai_slot() returns boolean
language plpgsql security definer set search_path = '' as $$
declare accepted integer;
begin
 if (select auth.uid()) is null then return false; end if;
 insert into public.ai_usage_daily(user_id,usage_day,calls)
 values((select auth.uid()),(now() at time zone 'UTC')::date,1)
 on conflict (user_id,usage_day)
 do update set calls=public.ai_usage_daily.calls+1
 where public.ai_usage_daily.calls < 20
 returning calls into accepted;
 return accepted is not null;
end; $$;
revoke all on function public.take_ai_slot() from public;
grant execute on function public.take_ai_slot() to authenticated;

-- Grants explícitos: RLS sigue limitando todas las operaciones autorizadas.
grant usage on schema public to authenticated;
grant usage on schema extensions to authenticated;
grant select, insert, delete on public.wishes to authenticated;
grant select on public.wish_cards to authenticated;
grant select, insert, delete on public.wish_interests to authenticated;
