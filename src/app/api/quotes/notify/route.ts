import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Supabase Database Webhook target (recommended):
 * - Trigger: INSERT on public.quote_requests
 * - URL: https://YOUR_DOMAIN/api/quotes/notify
 * - Add header: x-webhook-secret: <QUOTES_WEBHOOK_SECRET>
 *
 * Env:
 * - QUOTES_WEBHOOK_SECRET (required)
 * - RESEND_API_KEY (optional)
 * - NOTIFY_FROM_EMAIL (optional)
 */
export async function POST(req: Request) {
  const secret = process.env.QUOTES_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Missing QUOTES_WEBHOOK_SECRET" }, { status: 500 });

  const header = req.headers.get("x-webhook-secret");
  if (header !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const record = payload.record ?? payload;
  const listingId = record.listing_id as string | undefined;
  if (!listingId) return NextResponse.json({ ok: true, skipped: "no listing_id" });

  const { data: listing } = await supabaseAdmin
    .from("listings")
    .select("id,owner_id,business_name")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) return NextResponse.json({ ok: true, skipped: "listing not found" });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email,full_name")
    .eq("id", listing.owner_id)
    .maybeSingle();

  if (!profile?.email) return NextResponse.json({ ok: true, skipped: "owner email not found" });

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM_EMAIL || "WNC Leads <no-reply@wncleads.com>";

  if (!resendKey) {
    return NextResponse.json({ ok: true, emailed: false, reason: "RESEND_API_KEY not set" }, { status: 200 });
  }

  const subject = `New quote request: ${listing.business_name}`;
  const html = `
    <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5">
      <h2>New quote request</h2>
      <p><strong>Business:</strong> ${escapeHtml(listing.business_name)}</p>
      <p><strong>Name:</strong> ${escapeHtml(record.requester_name || "")}</p>
      <p><strong>Email:</strong> ${escapeHtml(record.requester_email || "")}</p>
      <p><strong>Phone:</strong> ${escapeHtml(record.requester_phone || "")}</p>
      <p><strong>Message:</strong></p>
      <pre style="background:#0b1220;color:#e2e8f0;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(record.message || "")}</pre>
      <p>View this lead in your dashboard.</p>
    </div>
  `;

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [profile.email],
      subject,
      html,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    return NextResponse.json({ ok: true, emailed: false, resend_error: txt }, { status: 200 });
  }

  return NextResponse.json({ ok: true, emailed: true }, { status: 200 });
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
