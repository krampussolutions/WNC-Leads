import Nav from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { requireUser, getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  await requireUser();
  const profile = await getProfile();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Account</h1>
        <p className="mt-2 text-slate-300">Manage your subscription and billing.</p>

        <div className="mt-8">
          <Card>
            <div className="text-sm text-slate-300">
              <div><span className="text-slate-400">Email:</span> {profile?.email}</div>
              <div className="mt-1"><span className="text-slate-400">Subscription:</span> {profile?.subscription_status ?? "none"}</div>
            </div>

            <div className="mt-6">
              <form action="/api/stripe/portal" method="post">
                <Button type="submit">Open billing portal (cancel anytime)</Button>
              </form>
              <p className="mt-2 text-xs text-slate-400">
                Cancellation is handled by Stripe Billing Portal. Webhook updates your access automatically.
              </p>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
