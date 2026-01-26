import { createSupabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function approveReview(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = await createSupabaseServer();

  // RLS ensures only listing owner can update
  await supabase.from("reviews").update({ approved: true }).eq("id", id);

  revalidatePath("/dashboard");
}

async function rejectReview(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = await createSupabaseServer();

  // Optional: delete, or set approved=false and keep it
  await supabase.from("reviews").delete().eq("id", id);

  revalidatePath("/dashboard");
}

export default async function ReviewsPanel() {
  const supabase = await createSupabaseServer();

  // Find the current user's listing
  const { data: listing } = await supabase
    .from("listings")
    .select("id,business_name,slug")
    .maybeSingle(); // If you have multiple listings per user, change this logic

  if (!listing) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <div className="text-white font-semibold">Reviews</div>
        <div className="mt-2 text-slate-400 text-sm">No listing found for this account.</div>
      </div>
    );
  }

  // Pending reviews (owner can read all due to RLS policy)
  const { data: pending } = await supabase
    .from("reviews")
    .select("id,rating,title,body,reviewer_name,created_at,approved")
    .eq("listing_id", listing.id)
    .eq("approved", false)
    .order("created_at", { ascending: false })
    .limit(50);

  // Approved reviews (owner can also read these)
  const { data: approved } = await supabase
    .from("reviews")
    .select("id")
    .eq("listing_id", listing.id)
    .eq("approved", true);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-semibold">Reviews</div>
          <div className="text-slate-400 text-sm">
            {approved?.length || 0} approved • {pending?.length || 0} pending
          </div>
        </div>
        <a className="text-sm text-emerald-400" href={`/listing/${listing.slug}`}>
          View public page
        </a>
      </div>

      {!pending?.length ? (
        <div className="mt-4 text-slate-400 text-sm">No pending reviews right now.</div>
      ) : (
        <div className="mt-4 grid gap-4">
          {pending.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center justify-between">
                <div className="text-slate-200">
                  <span className="font-semibold">{r.reviewer_name || "Anonymous"}</span>
                  <span className="ml-2 text-slate-400">• {new Date(r.created_at).toLocaleString()}</span>
                </div>
                <div className="text-slate-200">⭐ {r.rating}/5</div>
              </div>
              {r.title ? <div className="mt-2 font-semibold text-white">{r.title}</div> : null}
              <div className="mt-2 whitespace-pre-wrap text-slate-300">{r.body}</div>

              <div className="mt-4 flex gap-2">
                <form action={approveReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
                    Approve
                  </button>
                </form>

                <form action={rejectReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
