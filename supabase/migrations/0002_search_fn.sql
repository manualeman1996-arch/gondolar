-- ShelfSearch — search normalization + ranking function.

-- Normalize text: lowercase + strip accents. STABLE (unaccent is dictionary-based).
create or replace function public.ss_normalize(input text)
returns text language sql stable set search_path = public, extensions as $$
  select lower(extensions.unaccent(coalesce(input, '')))
$$;

-- Ranked in-store product search.
-- Returns matching product ids with a rank tier (lower = more relevant):
--   1 exact name · 2 exact brand · 3 exact category · 4 exact tag
--   5 partial (substring of full query) · 6 token (any query word matches)
create or replace function public.search_products(p_store_id uuid, p_query text)
returns table(product_id uuid, rank int)
language sql stable set search_path = public, extensions as $$
  select ranked.product_id, ranked.rank
  from (
    select
      p.id as product_id,
      least(
        case when q.nq <> '' and public.ss_normalize(p.name) = q.nq then 1 else 99 end,
        case when q.nq <> '' and public.ss_normalize(coalesce(p.brand,'')) = q.nq then 2 else 99 end,
        case when q.nq <> '' and public.ss_normalize(coalesce(c.name,'')) = q.nq then 3 else 99 end,
        case when q.nq <> '' and exists (
          select 1 from unnest(p.tags) t where public.ss_normalize(t) = q.nq
        ) then 4 else 99 end,
        case when q.nq <> '' and (
          public.ss_normalize(p.name) like '%'||q.nq||'%'
          or public.ss_normalize(coalesce(p.brand,'')) like '%'||q.nq||'%'
          or public.ss_normalize(coalesce(c.name,'')) like '%'||q.nq||'%'
          or exists (select 1 from unnest(p.tags) t where public.ss_normalize(t) like '%'||q.nq||'%')
        ) then 5 else 99 end,
        case when q.nq <> '' and exists (
          select 1 from unnest(string_to_array(q.nq, ' ')) w
          where length(w) >= 2 and (
            public.ss_normalize(p.name) like '%'||w||'%'
            or public.ss_normalize(coalesce(p.brand,'')) like '%'||w||'%'
            or public.ss_normalize(coalesce(c.name,'')) like '%'||w||'%'
            or exists (select 1 from unnest(p.tags) t where public.ss_normalize(t) like '%'||w||'%')
          )
        ) then 6 else 99 end
      ) as rank
    from public.products p
    left join public.categories c on c.id = p.category_id
    cross join lateral (select public.ss_normalize(coalesce(p_query, '')) as nq) q
    where p.store_id = p_store_id
      and p.is_active = true
  ) ranked
  where ranked.rank < 99
  order by ranked.rank;
$$;

-- Allow shopper (anon) + admin to call the search function.
grant execute on function public.search_products(uuid, text) to anon, authenticated;
grant execute on function public.ss_normalize(text) to anon, authenticated;
