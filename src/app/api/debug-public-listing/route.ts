import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("listings")
    .select("id, slug, is_published, business_name")
    .eq("slug", "krampus-solutions")
    .maybeSingle();

  return NextResponse.json({ data, error });
}
