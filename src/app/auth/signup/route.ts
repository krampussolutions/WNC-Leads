import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const full_name = String(form.get("full_name") || "");
  const account_type = String(form.get("account_type") || "contractor");
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");

  if (!email || !password || !full_name) {
    return NextResponse.redirect(new URL("/signup?error=Missing%20required%20fields", req.url), { status: 303 });
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, account_type },
    },
  });

  if (error) {
    return NextResponse.redirect(new URL(`/signup?error=${encodeURIComponent(error.message)}`, req.url), { status: 303 });
  }

  // If email confirmations are ON, user must confirm, but can still land on login.
  if (!data.session) {
    return NextResponse.redirect(new URL("/login?error=Check%20your%20email%20to%20confirm%20your%20account", req.url), { status: 303 });
  }

  return NextResponse.redirect(new URL("/dashboard", req.url), { status: 303 });
}
