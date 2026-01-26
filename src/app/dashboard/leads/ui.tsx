"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

type Lead = {
  id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  message: string;
  status: "new" | "read" | "archived";
  created_at: string;
  read_at: string | null;
  listing_id: string;
};

export default function LeadsClient({
  initialLeads,
}: {
  initialLeads: Lead[];
  userId: string;
}) {
  const supabase = createSupabaseBrowser();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [filter, setFilter] = useState<Lead["status"] | "all">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter((l) => l.status === filter);
  }, [leads, filter]);

  async function setStatus(id: string, status: Lead["status"]) {
    const patch: any = { status };
    if (status === "read") patch.read_at = new Date().toISOString();

    const { error } = await supabase
      .from("quote_requests")
      .update(patch)
      .eq("id", id);

    if (error) return;

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === "all" ? "primary" : "secondary"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "new" ? "primary" : "secondary"}
          onClick={() => setFilter("new")}
        >
          New
        </Button>
        <Button
          variant={filter === "read" ? "primary" : "secondary"}
          onClick={() => setFilter("read")}
        >
          Read
        </Button>
        <Button
          variant={filter === "archived" ? "primary" : "secondary"}
          onClick={() => setFilter("archived")}
        >
          Archived
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-slate-300">No leads in this view.</p>
        </Card>
      ) : null}

      {filtered.map((l) => (
        <Card key={l.id}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-white">
                  {l.requester_name}
                </div>
                <div className="mt-1 text-sm text-slate-300">
                  <a className="underline" href={`mailto:${l.requester_email}`}>
                    {l.requester_email}
                  </a>
                  {l.requester_phone ? (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        className="underline"
                        href={`tel:${l.requester_phone}`}
                      >
                        {l.requester_phone}
                      </a>
                    </>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {new Date(l.created_at).toLocaleString()} · Status: {l.status}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {l.status !== "read" ? (
                  <Button
                    variant="secondary"
                    onClick={() => setStatus(l.id, "read")}
                  >
                    Mark read
                  </Button>
                ) : null}
                {l.status !== "archived" ? (
                  <Button
                    variant="secondary"
                    onClick={() => setStatus(l.id, "archived")}
                  >
                    Archive
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="whitespace-pre-wrap text-sm text-slate-200">
              {l.message}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
