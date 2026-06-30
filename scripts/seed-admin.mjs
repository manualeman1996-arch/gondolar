// Creates (idempotently) the demo admin auth user and its profile row, linked
// to the "Super Demo" retailer. Requires the service role key.
//
//   node --env-file=.env.local scripts/seed-admin.mjs
//
// Env overrides: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_ADMIN_EMAIL || "admin@shelfsearch.demo";
const password = process.env.SEED_ADMIN_PASSWORD || "shelfsearch123";

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(targetEmail) {
  // Paginate through users (demo projects are small).
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  const { data: retailer, error: rErr } = await supabase
    .from("retailers")
    .select("id")
    .eq("name", "Super Demo")
    .maybeSingle();
  if (rErr) throw rErr;
  if (!retailer) {
    console.error("Retailer 'Super Demo' not found. Run the SQL seed first.");
    process.exit(1);
  }

  let user = await findUserByEmail(email);
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created admin user ${email}`);
  } else {
    console.log(`Admin user ${email} already exists`);
  }

  const { error: pErr } = await supabase.from("profiles").upsert(
    {
      auth_user_id: user.id,
      retailer_id: retailer.id,
      role: "retailer_admin",
      name: "Admin Demo",
    },
    { onConflict: "auth_user_id" },
  );
  if (pErr) throw pErr;

  console.log("Profile linked to 'Super Demo'.");
  console.log(`\n  Login → email: ${email}  password: ${password}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
