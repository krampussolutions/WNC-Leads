import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mapStripeStatus(status: Stripe.Subscription.Status) {
  // Stripe statuses: incomplete, incomplete_expired, trialing, active,
  // past_due, canceled, unpaid, paused
  if (status === "active" || status === "trialing") return "active";
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") return "canceled";
  // incomplete / past_due / paused -> treat as pending
  return "pending";
}

async function updateProfileByUserId(userId: string, patch: Record<string, any>) {
  const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", userId);
  if (error) console.error("profiles update (by userId) error:", error);
}

async function updateProfileByCustomerId(customerId: string, patch: Record<string, any>) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update(patch)
    .eq("stripe_customer_id", customerId);

  if (error) console.error("profiles update (by customerId) error:", error);
}

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      /**
       * Checkout finished. Often the subscription is already created here,
       * but payment may still be "incomplete" until invoice payment succeeds.
       */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const customerId = (session.customer as string) || null;
        const subscriptionId = (session.subscription as string) || null;

        const userId =
          session.metadata?.supabase_user_id ||
          // some integrations put metadata on subscription_data only; safest is to rely on session.metadata
          undefined;

        if (userId) {
          // DO NOT force active here; use Stripe status from the subscription if available
          let status: string = "pending";

          if (subscriptionId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            status = mapStripeStatus(sub.status);
          }

          await updateProfileByUserId(userId, {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: status,
          });
        } else if (customerId) {
          // best-effort: set customer id only
          await updateProfileByCustomerId(customerId, {
            stripe_customer_id: customerId,
          });
        }

        break;
      }

      /**
       * The single best event to keep your DB accurate.
       * Fires for active/trialing/past_due/canceled/etc changes.
       */
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const customerId = sub.customer as string;
        const subscriptionId = sub.id;
        const status = mapStripeStatus(sub.status);

        const userId = (sub.metadata?.supabase_user_id as string | undefined) || undefined;

        const patch = {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: status,
          current_period_end: sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null,
        };

        if (userId) {
          await updateProfileByUserId(userId, patch);
        } else {
          await updateProfileByCustomerId(customerId, patch);
        }

        break;
      }

      /**
       * If you want to flip pending -> active exactly when money clears,
       * this is the best “payment succeeded” signal.
       */
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // If invoice is for a subscription, mark active.
        if (invoice.subscription) {
          await updateProfileByCustomerId(customerId, {
            subscription_status: "active",
            stripe_subscription_id: invoice.subscription as string,
          });
        }
        break;
      }

      /**
       * Payment failed -> pending (or canceled depending on your business rules)
       */
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await updateProfileByCustomerId(customerId, {
          subscription_status: "pending",
        });
        break;
      }

      default:
        // ignore
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error("Webhook handler error:", e);
    return NextResponse.json({ error: e?.message ?? "Webhook handler error" }, { status: 500 });
  }
}
