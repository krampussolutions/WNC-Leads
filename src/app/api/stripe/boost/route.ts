import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
  const { boost_type } = await req.json();

  const prices: any = {
    week: "price_WEEK_ID",
    month: "price_MONTH_ID",
  };

  const price = prices[boost_type];
  if (!price) return NextResponse.json({ error: "Invalid boost type" }, { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price, quantity: 1 }],
    success_url: process.env.NEXT_PUBLIC_SITE_URL + "/dashboard",
    cancel_url: process.env.NEXT_PUBLIC_SITE_URL + "/dashboard",
  });

  return NextResponse.json({ url: session.url });
}
