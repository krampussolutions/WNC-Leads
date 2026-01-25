"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function ImageUploader({
  label,
  value,
  onUploaded,
  kind,
}: {
  label: string;
  value?: string | null;
  onUploaded: (publicUrl: string) => void;
  kind: "logo" | "cover";
}) {
  const [busy, setBusy] = useState(false);
  const supabase = createSupabaseBrowser();

  async function upload(file: File) {
    setBusy(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Not signed in");

      const ext = file.name.split(".").pop() || "png";
      const path = `${uid}/${kind}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      onUploaded(data.publicUrl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="text-sm text-slate-300">{label}</div>
      {value ? (
        <img
          src={value}
          alt={label}
          className={
            kind === "cover"
              ? "h-28 w-full rounded-lg border border-slate-800 object-cover"
              : "h-24 w-24 rounded-lg border border-slate-800 object-cover"
          }
        />
      ) : (
        <div
          className={
            kind === "cover"
              ? "h-28 w-full rounded-lg border border-slate-800 bg-slate-950"
              : "h-24 w-24 rounded-lg border border-slate-800 bg-slate-950"
          }
        />
      )}

      <input
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
        className="text-sm text-slate-300"
      />
      {busy ? <div className="text-xs text-slate-400">Uploading…</div> : null}
      <div className="text-xs text-slate-500">
        Uploads go to: <span className="text-slate-400">listing-images/{`{your_user_id}`}/...</span>
      </div>
    </div>
  );
}
