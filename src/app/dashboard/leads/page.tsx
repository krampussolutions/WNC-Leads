import Nav from "@/components/Nav";
import { Card } from "@/components/Card";
import { requireActiveUser } from "@/lib/auth";
import LeadsUI from "./ui";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const { supabase, user } = await requireActiveUser();

  // fetch any server-side initial data here if you want
  // const { data } = await supabase.from("...").select("*");

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <Card>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="mt-2 text-slate-300">Your incoming quote requests.</p>
        </Card>

        <div className="mt-6">
          {/* LeadsUI can be a "use client" component */}
          <LeadsUI userId={user.id} />
        </div>
      </main>
    </>
  );
}
