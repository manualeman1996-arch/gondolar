-- Creates the demo admin auth user directly via SQL (alternative to the
-- service-role script `npm run seed:admin`). Run this with elevated/postgres
-- privileges (e.g. Supabase SQL editor or `apply_migration`). Idempotent.
--
--   Login → admin@shelfsearch.demo / shelfsearch123
--
-- NOTE: change the password before any non-demo use.
create extension if not exists pgcrypto with schema extensions;

do $$
declare v_uid uuid; v_retailer uuid;
begin
  select id into v_retailer from public.retailers where name = 'Super Demo' limit 1;
  select id into v_uid from auth.users where email = 'admin@shelfsearch.demo' limit 1;

  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
      confirmation_token, recovery_token, email_change,
      email_change_token_new, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token
    ) values (
      v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'admin@shelfsearch.demo', extensions.crypt('shelfsearch123', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, false,
      '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_uid, v_uid::text,
      json_build_object('sub', v_uid::text, 'email', 'admin@shelfsearch.demo', 'email_verified', true)::jsonb,
      'email', now(), now(), now()
    );
  end if;

  insert into public.profiles (auth_user_id, retailer_id, role, name)
  values (v_uid, v_retailer, 'retailer_admin', 'Admin Demo')
  on conflict (auth_user_id) do update set retailer_id = excluded.retailer_id, role = excluded.role;
end $$;
