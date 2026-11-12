-- DeseAI V18 | Ejecutar DESPUÉS de supabase/schema.sql (V17).
-- Sandbox de PayPal: cada comprador paga individualmente al comerciante de prueba.
-- Este código NO crea escrow, reparto a vendedores ni retención colectiva.

-- Solo usuarios aprobados desde el SQL Editor pueden publicar ofertas.
create table if not exists public.demo_sellers (
 user_id uuid primary key references auth.users(id) on delete restrict,
 display_name text not null check (char_length(display_name) between 2 and 60),
 created_at timestamptz not null default now()
);
alter table public.demo_sellers enable row level security;
drop policy if exists "Vendedor ve su alta" on public.demo_sellers;
create policy "Vendedor ve su alta" on public.demo_sellers
 for select to authenticated using ((select auth.uid())=user_id);

create table if not exists public.collective_offers (
 id uuid primary key default gen_random_uuid(),
 wish_id uuid not null references public.wish_cards(wish_id) on delete restrict,
 seller_id uuid not null references public.demo_sellers(user_id) on delete restrict,
 title text not null check(char_length(title) between 8 and 110),
 details text not null default '' check(char_length(details)<=320),
 currency text not null default 'USD' check(currency='USD'),
 price_cents integer not null check(price_cents between 100 and 10000000),
 stock integer not null check(stock between 2 and 100),
 minimum_interests integer not null check(minimum_interests between 2 and 100),
 status text not null default 'active' check(status in ('active','closed')),
 paid_count integer not null default 0 check(paid_count>=0),
 created_at timestamptz not null default now(),
 constraint offer_minimum_within_stock check(minimum_interests<=stock)
);
create index if not exists collective_offers_wish_idx on public.collective_offers(wish_id,created_at desc);
alter table public.collective_offers enable row level security;
drop policy if exists "Ofertas públicas para visitantes" on public.collective_offers;
create policy "Ofertas públicas para visitantes" on public.collective_offers
 for select to authenticated using(true);
drop policy if exists "Solo vendedores aprobados crean ofertas" on public.collective_offers;
create policy "Solo vendedores aprobados crean ofertas" on public.collective_offers
 for insert to authenticated
 with check ((select auth.uid())=seller_id
  and exists(select 1 from public.demo_sellers ds where ds.user_id=(select auth.uid()))
  and status='active' and paid_count=0);
-- No hay políticas directas para UPDATE/DELETE: el precio no cambia durante el checkout.

create table if not exists public.payment_orders (
 id uuid primary key default gen_random_uuid(),
 offer_id uuid not null references public.collective_offers(id) on delete restrict,
 buyer_id uuid not null references auth.users(id) on delete restrict,
 price_cents integer not null check(price_cents>0),
 currency text not null check(currency='USD'),
 status text not null default 'creating' check(status in ('creating','created','capturing','pending','completed','denied','failed','expired')),
 paypal_order_id text unique,
 paypal_capture_id text unique,
 expires_at timestamptz not null default(now()+ interval '20 minutes'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(offer_id,buyer_id)
);
create index if not exists payment_orders_offer_status_idx on public.payment_orders(offer_id,status);
alter table public.payment_orders enable row level security;
drop policy if exists "Comprador ve su orden" on public.payment_orders;
create policy "Comprador ve su orden" on public.payment_orders
 for select to authenticated using ((select auth.uid())=buyer_id);
-- No hay INSERT/UPDATE/DELETE desde el navegador.

create table if not exists public.paypal_events (
 event_id text primary key,
 event_type text not null,
 recorded_at timestamptz not null default now()
);
alter table public.paypal_events enable row level security;
-- Sin políticas: sólo llamadas privilegiadas del servidor.

create or replace function public.refresh_offer_paid_count() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and new.status is distinct from old.status then
  update public.collective_offers
  set paid_count=(select count(*) from public.payment_orders
                  where offer_id=new.offer_id and status='completed')
  where id=new.offer_id;
 end if;
 return new;
end; $$;
drop trigger if exists offer_paid_count_updated on public.payment_orders;
create trigger offer_paid_count_updated after update on public.payment_orders
 for each row execute function public.refresh_offer_paid_count();

-- Esta función sólo puede ejecutarse desde el servidor con SERVICE_ROLE.
-- El servidor verifica previamente el JWT del comprador con Supabase Auth.
-- El bloqueo FOR UPDATE serializa reservas concurrentes del mismo stock.
create or replace function public.begin_checkout(p_buyer_id uuid,p_offer_id uuid)
returns table(checkout_id uuid, paypal_id text, unit_cents integer, unit_currency text,
              offer_title text, checkout_status text)
language plpgsql security definer set search_path='' as $$
declare o public.collective_offers%rowtype;
declare existing public.payment_orders%rowtype;
declare n_reserved integer;
declare has_existing boolean;
begin
 select * into o from public.collective_offers where id=p_offer_id for update;
 if not found or o.status<>'active' then raise exception 'Esta oferta no está disponible'; end if;
 if o.seller_id=p_buyer_id then raise exception 'El vendedor no puede comprar su propia oferta'; end if;
 if not exists(select 1 from auth.users where id=p_buyer_id) then raise exception 'Comprador inválido'; end if;
 if not exists(select 1 from public.wish_interests where wish_id=o.wish_id and user_id=p_buyer_id)
 then raise exception 'Primero expresa interés en este deseo'; end if;
 if (select interest_count from public.wish_cards where wish_id=o.wish_id)<o.minimum_interests
 then raise exception 'Todavía faltan personas interesadas para activar la oferta'; end if;

 -- Elimina la reserva de slots expirados; nunca elimina un pago pendiente/completado.
 update public.payment_orders set status='expired',updated_at=now()
 where offer_id=o.id and status in ('created','creating') and expires_at<now();
 select * into existing from public.payment_orders
 where offer_id=o.id and buyer_id=p_buyer_id for update;
 has_existing:=found;
 if has_existing and existing.status='completed' then raise exception 'Ya realizaste este pago'; end if;
 if has_existing and existing.status='pending' then raise exception 'Tu pago está pendiente de confirmación'; end if;
 if has_existing and existing.status='capturing' then raise exception 'Tu pago ya está en verificación'; end if;
 if has_existing and existing.status='created' and existing.expires_at>now() then
  return query select existing.id,existing.paypal_order_id,existing.price_cents,existing.currency,o.title,existing.status;
  return;
 end if;
 if has_existing and existing.status='creating' and existing.expires_at>now() then
  raise exception 'Tu pedido se está preparando, inténtalo nuevamente';
 end if;
 select count(*) into n_reserved from public.payment_orders
 where offer_id=o.id and (status in ('completed','pending','capturing')
 or (status in ('created','creating') and expires_at>now()));
 if n_reserved>=o.stock then raise exception 'No quedan unidades disponibles'; end if;
 if has_existing then
  update public.payment_orders set price_cents=o.price_cents,currency=o.currency,
    status='creating',paypal_order_id=null,paypal_capture_id=null,
    expires_at=now()+interval '20 minutes',updated_at=now()
  where id=existing.id returning * into existing;
 else
  insert into public.payment_orders(offer_id,buyer_id,price_cents,currency)
  values(o.id,p_buyer_id,o.price_cents,o.currency)
  returning * into existing;
 end if;
 return query select existing.id,existing.paypal_order_id,existing.price_cents,existing.currency,o.title,existing.status;
end; $$;

create or replace function public.register_paypal_order(p_checkout_id uuid,p_order_id text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if length(p_order_id)<5 or length(p_order_id)>100 then return false; end if;
 update public.payment_orders set status='created',paypal_order_id=p_order_id,updated_at=now()
 where id=p_checkout_id and status='creating' and expires_at>now();
 return found;
end; $$;

-- El paso a capturing mantiene el stock bloqueado antes de tocar PayPal.
-- Las reintentos transcurridos 15 segundos usan PayPal-Request-Id idempotente.
create or replace function public.claim_capture(p_checkout_id uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare item public.payment_orders%rowtype;
begin
 select * into item from public.payment_orders where id=p_checkout_id for update;
 if not found then raise exception 'Checkout inexistente'; end if;
 if item.status='created' and item.expires_at>now() then
  update public.payment_orders set status='capturing',updated_at=now() where id=p_checkout_id;
  return true;
 elsif item.status='capturing' and item.updated_at<now()-interval '15 seconds' then
  update public.payment_orders set updated_at=now() where id=p_checkout_id;
  return true;
 end if;
 raise exception 'Checkout no disponible para capturar';
end; $$;

create or replace function public.fail_checkout(p_checkout_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 update public.payment_orders set status='failed',updated_at=now()
 where id=p_checkout_id and status='creating' and paypal_order_id is null;
end; $$;

-- Señales VERIFICADAS en servidor: respuesta de captura PayPal o webhook validado.
-- No permite que un evento tardío 'DENIED' revierta un COMPLETED.
create or replace function public.apply_paypal_signal(
 p_order_id text,p_capture_id text,p_status text,
 p_amount_cents integer,p_currency text,p_event_id text default null,
 p_event_type text default null
) returns text language plpgsql security definer set search_path='' as $$
declare checkout public.payment_orders%rowtype;
begin
 if p_status not in ('COMPLETED','PENDING','DENIED') then raise exception 'Estado de pago inválido'; end if;
 select * into checkout from public.payment_orders where paypal_order_id=p_order_id for update;
 if not found then raise exception 'Orden PayPal no registrada'; end if;
 if checkout.price_cents<>p_amount_cents or checkout.currency<>p_currency
 then raise exception 'El importe/currency del pago no coincide'; end if;
 if length(coalesce(p_capture_id,''))<5 then raise exception 'ID de captura no válido'; end if;
 if checkout.paypal_capture_id is not null and checkout.paypal_capture_id<>p_capture_id
 then raise exception 'La captura no coincide con este pedido'; end if;
 if p_event_id is not null then
  insert into public.paypal_events(event_id,event_type) values(p_event_id,coalesce(p_event_type,''))
  on conflict do nothing;
  if not found then return checkout.status; end if;
 end if;
 if checkout.status='completed' then return 'completed'; end if;
 if checkout.status in ('expired','failed','denied') then
  raise exception 'Esta orden ya no admite confirmaciones';
 end if;
 update public.payment_orders set paypal_capture_id=p_capture_id,
   status=case p_status when 'COMPLETED' then 'completed'
                        when 'PENDING' then 'pending' else 'denied' end,
   updated_at=now() where id=checkout.id;
 return case p_status when 'COMPLETED' then 'completed'
                      when 'PENDING' then 'pending' else 'denied' end;
end; $$;

-- Nunca otorgar la ejecución de las RPC de pago a anon/authenticated.
revoke all on function public.begin_checkout(uuid,uuid) from public,anon,authenticated;
revoke all on function public.register_paypal_order(uuid,text) from public,anon,authenticated;
revoke all on function public.claim_capture(uuid) from public,anon,authenticated;
revoke all on function public.fail_checkout(uuid) from public,anon,authenticated;
revoke all on function public.apply_paypal_signal(text,text,text,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.begin_checkout(uuid,uuid) to service_role;
grant execute on function public.register_paypal_order(uuid,text) to service_role;
grant execute on function public.claim_capture(uuid) to service_role;
grant execute on function public.fail_checkout(uuid) to service_role;
grant execute on function public.apply_paypal_signal(text,text,text,integer,text,text,text) to service_role;

-- Grants mínimos y RLS.
grant select on public.demo_sellers to authenticated;
grant select,insert on public.collective_offers to authenticated;
grant select on public.payment_orders to authenticated;
grant all on public.demo_sellers,public.collective_offers,public.payment_orders,public.paypal_events to service_role;

-- ALTA MANUAL DE VENDEDOR (después de que visite la web y tenga UUID en Auth):
-- insert into public.demo_sellers(user_id,display_name)
-- values ('UUID_DEL_USUARIO_SANDBOX', 'Vendedor Demo');
-- Nunca incluir SERVICE_ROLE_KEY en el navegador.
