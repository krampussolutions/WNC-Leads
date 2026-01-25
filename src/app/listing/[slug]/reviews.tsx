import { createSupabaseServer } from "@/lib/supabase/server";
import { requireUserOptional } from "@/lib/auth";
import { Button } from "@/components/Button";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function submitReview(formData: FormData) {
  "use server";
  const slug = String(formData.get("slug") || "");
  const rating = Number(formData.get("rating") || 0);
  const title = String(formData.get("title") || "");
  const body = String(formData.get("body") || "");

  const user = await requireUserOptional();
  if (!user) return;
  if (!slug || rating < 1 || rating > 5 || !body.trim()) return;

  const supabase = await createSupabaseServer();
  const { data: listing } = await supabase.from("listings").select("id").eq("slug", slug).maybeSingle();
  if (!listing) return;

  await supabase.from("reviews").insert({
    listing_id: listing.id,
    user_id: user.id,
    rating,
    title: title || null,
    body,
  });

  revalidatePath(`/listing/${slug}`);
}

export default async function ReviewsSection({ slug }: { slug: string }) {
  const supabase = await createSupabaseServer();
  const user = await requireUserOptional();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id,rating,title,body,created_at")
    .eq("is_approved", true)
    .in("listing_id", (await supabase.from("listings").select("id").eq("slug", slug)).data?.map((x:any)=>x.id) || [])
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mt-6 grid gap-4">
      {(reviews ?? []).length === 0 ? (
        <div className="text-sm text-slate-300">No approved reviews yet.</div>
      ) : null}

      {(reviews ?? []).map((r: any) => (
        <div key={r.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white">{r.title || "Review"}</div>
            <div className="text-sm text-slate-300">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
          </div>
          <div className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{r.body}</div>
          <div className="mt-2 text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</div>
        </div>
      ))}

      {user ? (
        <form action={submitReview} className="mt-6 grid gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <input type="hidden" name="slug" value={slug} />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="text-sm text-slate-300">Rating</label>
              <select name="rating" defaultValue="5" className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2">
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300">Title (optional)</label>
              <input name="title" className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300">Review</label>
            <textarea name="body" required rows={4} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2" />
          </div>

          <div>
            <Button type="submit">Submit review</Button>
            <div className="mt-2 text-xs text-slate-500">Reviews require approval before appearing publicly.</div>
          </div>
        </form>
      ) : (
        <div className="text-sm text-slate-300">
          <a className="underline" href="/login">Log in</a> to leave a review.
        </div>
      )}
    </div>
  );
}
