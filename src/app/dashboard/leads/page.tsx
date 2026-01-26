import Nav from "@/components/Nav";
import { Card } from "@/components/Card";
import { requireActiveUser } from "@/lib/auth";
import LeadsClient from "./ui";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  // Server-only: redirects if not logged in / not active
  const { supabase, user } = await requireActiveUser();

  // Server fetch initial leads (recommended so the page renders immediately)
  const { data: leads, error } = await supabase
    .from("quote_requests")
    .select(
      "id, requester_name, requester_email, requester_phone, message, status, created_at, read_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("LeadsPage fetch error:", error);
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Card>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="mt-2 text-slate-300">Your incoming quote requests.</p>
        </Card>

        <div className="mt-6">
          <LeadsClient initialLeads={(leads ?? []) as any} />
        </div>
      </main>
    </>
  );
}
