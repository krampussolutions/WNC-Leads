import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireUserOptional() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getProfile() {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id,email,full_name,account_type,subscription_status,stripe_customer_id,stripe_subscription_id,current_period_end"
    )
    .eq("id", user.id)
    .maybeSingle();

  return data ?? null;
}

export async function requireActiveSubscription() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const active =
    profile.subscription_status === "active" ||
    profile.subscription_status === "trialing";

  if (!active) redirect("/pricing");
  return profile;
}

/**
 * Use this on server pages that require an active subscription AND need a server supabase client.
 */
export async function requireActiveUser() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  const active =
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing";

  if (!active) redirect("/pricing");

  return { supabase, user, profile };
}
