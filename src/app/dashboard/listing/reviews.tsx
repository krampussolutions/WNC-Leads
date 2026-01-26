"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

type Review = {
  id: string;
  listing_slug: string;
  rating: number;
  title: string | null;
  body: string;
  approved: boolean;
  created_at: string;
};

export default function ReviewsSection({ slug }: { slug: string }) {
  const supabase = createSupabaseBrowser();
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("id, listing_slug, rating, title, body, approved, created_at")
      .eq("listing_slug", slug)
      .order("created_at", { ascending: false });

    if (!error) setRows((data as any) ?? []);
    setLoading(false);
  }

  async function setApproved(id: string, approved: boolean) {
    const { error } = await supabase.from("reviews").update({ approved }).eq("id", id);
    if (!error) setRows((prev) => prev.map((r) => (r.id === id ? { ...r, approved } : r)));
  }

  useEffect(() => {
    if (!slug) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!slug) {
    return (
      <Card>
        <p className="text-slate-300">No slug available for this listing.</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <p className="text-slate-300">Loading reviews…</p>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <p className="text-slate-300">No reviews yet.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {rows.map((r) => (
        <Card key={r.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm text-slate-400">
                {new Date(r.created_at).toLocaleString()} · Rating: {r.rating}/5
              </div>
              <div className="mt-2 text-white font-semibold">{r.title ?? "Review"}</div>
              <div className="mt-2 whitespace-pre-wrap text-slate-200 text-sm">{r.body}</div>
              <div className="mt-2 text-xs text-slate-500">
                Status: {r.approved ? "approved" : "pending"}
              </div>
            </div>

            <div className="flex gap-2">
              {r.approved ? (
                <Button variant="secondary" onClick={() => setApproved(r.id, false)}>
                  Unapprove
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setApproved(r.id, true)}>
                  Approve
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
