import Nav from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const profile = await getProfile();
  const active = profile?.subscription_status === "active" || profile?.subscription_status === "trialing";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Pricing</h1>
        <p className="mt-2 text-slate-300">Subscribe to publish a listing and receive quote requests.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <h2 className="text-xl font-semibold">Public</h2>
            <div className="mt-2 text-4xl font-semibold">$0</div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
              <li>Browse all listings</li>
              <li>Request quotes</li>
            </ul>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">Business Listing</h2>
            <div className="mt-2 text-4xl font-semibold">$10<span className="text-base font-normal text-slate-300">/mo</span></div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
              <li>Create and publish your listing</li>
              <li>Receive quote requests in dashboard</li>
              <li>Cancel anytime</li>
            </ul>

            <div className="mt-6">
              {!profile ? (
                <a href="/login">
                  <Button>Login to subscribe</Button>
                </a>
              ) : active ? (
                <a href="/dashboard">
                  <Button variant="secondary">You&apos;re active — go to dashboard</Button>
                </a>
              ) : (
                <form action="/api/stripe/checkout" method="post">
                  <Button type="submit">Subscribe</Button>
                </form>
              )}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
