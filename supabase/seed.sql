-- ShelfSearch — demo seed data ("Super Demo" retailer).
-- Idempotent: safe to re-run. Does NOT create the admin auth user — that is done
-- by `npm run seed:admin` (needs the service role key). See README.

do $$
declare
  v_retailer uuid;
  v_palermo  uuid;
  v_belgrano uuid;
begin
  -- Retailer ------------------------------------------------------------------
  select id into v_retailer from public.retailers where name = 'Super Demo' limit 1;
  if v_retailer is null then
    insert into public.retailers (name, country)
    values ('Super Demo', 'AR')
    returning id into v_retailer;
  end if;

  -- Stores --------------------------------------------------------------------
  insert into public.stores (retailer_id, name, slug, address, city, state, country, format, is_active)
  values (v_retailer, 'Super Demo Palermo', 'super-demo-palermo', 'Av. Santa Fe 3200', 'CABA', 'Buenos Aires', 'AR', 'supermercado', true)
  on conflict (slug) do update set name = excluded.name
  returning id into v_palermo;

  insert into public.stores (retailer_id, name, slug, address, city, state, country, format, is_active)
  values (v_retailer, 'Super Demo Belgrano', 'super-demo-belgrano', 'Av. Cabildo 2100', 'CABA', 'Buenos Aires', 'AR', 'supermercado', true)
  on conflict (slug) do update set name = excluded.name
  returning id into v_belgrano;

  -- Categories ----------------------------------------------------------------
  insert into public.categories (retailer_id, name, slug)
  select v_retailer, c.name, c.slug
  from (values
    ('Yerba', 'yerba'), ('Lácteos', 'lacteos'), ('Bebidas', 'bebidas'),
    ('Limpieza', 'limpieza'), ('Bebé', 'bebe'), ('Mascotas', 'mascotas'),
    ('Almacén', 'almacen'), ('Perfumería', 'perfumeria')
  ) as c(name, slug)
  on conflict (retailer_id, slug) do nothing;

  -- Products + locations (temp staging table) ---------------------------------
  create temporary table tmp_seed (
    store_slug text, name text, brand text, category_slug text, tags text[],
    aisle text, shelf text, side text, height text, zone text, instructions text
  ) on commit drop;

  insert into tmp_seed values
    -- Palermo
    ('super-demo-palermo','Playadito Suave 1kg','Playadito','yerba','{yerba,suave,mate}','1','A','izquierda','media','Almacén','Pasillo 1, primera góndola al entrar'),
    ('super-demo-palermo','Taragüi Tradicional 1kg','Taragüi','yerba','{yerba,tradicional,mate}','1','A','izquierda','media','Almacén',''),
    ('super-demo-palermo','Rosamonte 1kg','Rosamonte','yerba','{yerba,mate}','1','A','derecha','alta','Almacén',''),
    ('super-demo-palermo','La Serenísima Leche sin lactosa 1L','La Serenísima','lacteos','{leche,"sin lactosa",deslactosada}','3','B','derecha','media','Frío','Heladera de lácteos al fondo'),
    ('super-demo-palermo','Sancor Leche descremada 1L','Sancor','lacteos','{leche,descremada}','3','B','derecha','baja','Frío',''),
    ('super-demo-palermo','Coca-Cola Zero 2.25L','Coca-Cola','bebidas','{gaseosa,coca,zero,bebida}','5','C','derecha','media','Bebidas',''),
    ('super-demo-palermo','Pepsi Black 2.25L','Pepsi','bebidas','{gaseosa,pepsi,black,bebida}','5','C','derecha','media','Bebidas',''),
    ('super-demo-palermo','Pampers Confort Sec Talle G','Pampers','bebe','{pañales,bebe,"talle g"}','7','D','izquierda','media','Bebé',''),
    ('super-demo-palermo','Huggies Triple Protección Talle G','Huggies','bebe','{pañales,bebe,"talle g",huggies}','7','D','izquierda','media','Bebé','Sector bebé, frente a fórmulas infantiles'),
    ('super-demo-palermo','Babysec Talle G','Babysec','bebe','{pañales,bebe,"talle g"}','7','D','derecha','baja','Bebé',''),
    ('super-demo-palermo','Magistral Detergente','Magistral','limpieza','{detergente,lavavajilla,cocina}','9','E','izquierda','media','Limpieza',''),
    ('super-demo-palermo','Ariel Jabón Líquido','Ariel','limpieza','{jabon,ropa,lavado}','9','E','derecha','alta','Limpieza',''),
    ('super-demo-palermo','Dog Chow Adulto','Dog Chow','mascotas','{perro,alimento,"comida perro"}','11','F','izquierda','baja','Mascotas',''),
    ('super-demo-palermo','Cat Chow Gatos Adultos','Cat Chow','mascotas','{gato,alimento,"comida gato"}','11','F','izquierda','media','Mascotas',''),
    ('super-demo-palermo','Shampoo Dove','Dove','perfumeria','{shampoo,pelo,cabello}','13','G','derecha','media','Perfumería',''),
    ('super-demo-palermo','Shampoo Head & Shoulders','Head & Shoulders','perfumeria','{shampoo,anticaspa,cabello}','13','G','derecha','alta','Perfumería',''),
    ('super-demo-palermo','Fideos Matarazzo','Matarazzo','almacen','{fideos,pasta}','2','A','derecha','media','Almacén',''),
    ('super-demo-palermo','Arroz Gallo','Gallo','almacen','{arroz}','2','A','derecha','baja','Almacén',''),
    ('super-demo-palermo','Café Nescafé','Nescafé','almacen','{cafe,instantaneo}','2','B','izquierda','media','Almacén',''),
    ('super-demo-palermo','Vino Malbec Demo','Demo','bebidas','{vino,malbec,tinto}','6','C','izquierda','media','Bebidas',''),
    -- Belgrano (subset)
    ('super-demo-belgrano','Playadito Suave 1kg','Playadito','yerba','{yerba,suave,mate}','2','A','derecha','media','Almacén',''),
    ('super-demo-belgrano','Taragüi Tradicional 1kg','Taragüi','yerba','{yerba,tradicional,mate}','2','A','derecha','media','Almacén',''),
    ('super-demo-belgrano','Rosamonte 1kg','Rosamonte','yerba','{yerba,mate}','2','A','izquierda','alta','Almacén',''),
    ('super-demo-belgrano','La Serenísima Leche sin lactosa 1L','La Serenísima','lacteos','{leche,"sin lactosa",deslactosada}','4','B','izquierda','media','Frío',''),
    ('super-demo-belgrano','Sancor Leche descremada 1L','Sancor','lacteos','{leche,descremada}','4','B','izquierda','baja','Frío',''),
    ('super-demo-belgrano','Coca-Cola Zero 2.25L','Coca-Cola','bebidas','{gaseosa,coca,zero,bebida}','6','C','izquierda','media','Bebidas',''),
    ('super-demo-belgrano','Pepsi Black 2.25L','Pepsi','bebidas','{gaseosa,pepsi,black,bebida}','6','C','izquierda','media','Bebidas',''),
    ('super-demo-belgrano','Shampoo Dove','Dove','perfumeria','{shampoo,pelo,cabello}','12','G','izquierda','media','Perfumería',''),
    ('super-demo-belgrano','Shampoo Head & Shoulders','Head & Shoulders','perfumeria','{shampoo,anticaspa,cabello}','12','G','izquierda','alta','Perfumería','');

  insert into public.products (retailer_id, store_id, category_id, name, brand, tags, is_active)
  select v_retailer, s.id, c.id, t.name, nullif(t.brand, ''), t.tags, true
  from tmp_seed t
  join public.stores s on s.slug = t.store_slug
  left join public.categories c on c.retailer_id = v_retailer and c.slug = t.category_slug
  on conflict (store_id, lower(name), lower(coalesce(brand, ''))) do nothing;

  insert into public.product_locations (product_id, store_id, aisle, shelf, side, height, zone, instructions)
  select p.id, p.store_id, nullif(t.aisle,''), nullif(t.shelf,''), nullif(t.side,''),
         nullif(t.height,''), nullif(t.zone,''), nullif(t.instructions,'')
  from tmp_seed t
  join public.stores s on s.slug = t.store_slug
  join public.products p
    on p.store_id = s.id
   and lower(p.name) = lower(t.name)
   and lower(coalesce(p.brand,'')) = lower(coalesce(nullif(t.brand,''), ''))
  on conflict (product_id) do update set
    aisle = excluded.aisle, shelf = excluded.shelf, side = excluded.side,
    height = excluded.height, zone = excluded.zone, instructions = excluded.instructions;

  -- Campaigns -----------------------------------------------------------------
  if not exists (select 1 from public.campaigns where name = 'Huggies Talle G — Palermo') then
    insert into public.campaigns (retailer_id, name, brand, store_id, category_id, product_id, keywords, start_date, end_date, is_active)
    select v_retailer, 'Huggies Talle G — Palermo', 'Huggies', v_palermo,
           (select id from public.categories where retailer_id = v_retailer and slug = 'bebe'),
           p.id, array['pañales','bebe','talle g','huggies'],
           current_date - 7, current_date + 30, true
    from public.products p
    where p.store_id = v_palermo and lower(p.name) = lower('Huggies Triple Protección Talle G');
  end if;

  if not exists (select 1 from public.campaigns where name = 'Pepsi Black — Todas') then
    insert into public.campaigns (retailer_id, name, brand, store_id, category_id, product_id, keywords, start_date, end_date, is_active)
    select v_retailer, 'Pepsi Black — Todas', 'Pepsi', null,
           (select id from public.categories where retailer_id = v_retailer and slug = 'bebidas'),
           p.id, array['gaseosa','coca','coca zero','bebida','pepsi'],
           current_date - 7, current_date + 30, true
    from public.products p
    where p.store_id = v_palermo and lower(p.name) = lower('Pepsi Black 2.25L');
  end if;
end $$;
