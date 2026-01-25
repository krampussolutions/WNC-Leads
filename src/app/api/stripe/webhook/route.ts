import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const secretKey = requireEnv("STRIPE_SECRET_KEY");
    const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");

    const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });

    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err?.message ?? "unknown"}` },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;

        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        const userId = (session.metadata?.supabase_user_id as string) || null;

        if (userId && customerId) {
          await supabaseAdmin
            .from("profiles")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId ?? null,
              subscription_status: "active",
            })
            .eq("id", userId);
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

        if (!customerId) break;

        const status =
          event.type === "customer.subscription.deleted" ? "canceled" : (sub.status as string);

        const currentPeriodEnd =
          typeof sub.current_period_end === "number"
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null;

        await supabaseAdmin
          .from("profiles")
          .update({
            stripe_subscription_id: sub.id,
            subscription_status: status,
            // If your column is timestamptz, ISO string is fine.
            current_period_end: currentPeriodEnd,
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    // IMPORTANT: return 500 so Stripe retries if something is genuinely wrong
    return NextResponse.json({ error: err?.message ?? "Webhook error" }, { status: 500 });
  }
}
