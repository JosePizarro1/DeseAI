-- Ejecutar después de V18. Qwen compara resúmenes públicos sin embeddings.
alter table public.wishes alter column embedding drop not null;
create or replace function public.wish_match_candidates(
 match_category text,match_city text default '',match_budget numeric default null,
 match_currency text default 'PEN',exclude_wish_id uuid default null
) returns table(id uuid,title text,summary text,category text,city text,budget_amount numeric,currency text)
language sql stable security definer set search_path='' as $$
 select c.wish_id,c.title,c.summary,c.category,c.city,c.budget_amount,c.currency
 from public.wish_cards c join public.wishes w on w.id=c.wish_id
 where (select auth.uid()) is not null and w.owner_id<>(select auth.uid())
 and (exclude_wish_id is null or w.id<>exclude_wish_id)
 and c.category=match_category
 and (coalesce(match_city,'')='' or c.city='' or lower(trim(c.city))=lower(trim(match_city)))
 and (match_budget is null or c.budget_amount is null or
 (c.currency=match_currency and abs(c.budget_amount-match_budget)<=greatest(20::numeric,match_budget*0.35)))
 order by c.created_at desc limit 30
$$;
revoke all on function public.wish_match_candidates(text,text,numeric,text,uuid) from public;
grant execute on function public.wish_match_candidates(text,text,numeric,text,uuid) to authenticated;
