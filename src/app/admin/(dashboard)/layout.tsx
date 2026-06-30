import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/admin/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, userEmail } = await requireProfile();

  const supabase = await createClient();
  let retailerName = "Retailer";
  if (profile.retailer_id) {
    const { data } = await supabase
      .from("retailers")
      .select("name")
      .eq("id", profile.retailer_id)
      .maybeSingle();
    retailerName = data?.name ?? retailerName;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      <Sidebar retailerName={retailerName} userEmail={userEmail} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
