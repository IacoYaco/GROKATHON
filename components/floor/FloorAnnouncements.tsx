"use client";

import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";

interface Announcement {
  id: number;
  authorName: string;
  body: string;
  createdAt: string;
}

export function FloorAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    void fetch("/api/faculty/announcements", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.announcements) setItems(j.announcements.slice(0, 3));
      })
      .catch(() => undefined);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="gloss-panel space-y-2 rounded-[20px] p-4">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
        <Megaphone className="h-3.5 w-3.5 text-[#286DC0]" />
        Faculty floor notes
      </h2>
      {items.map((a) => (
        <p key={a.id} className="text-sm text-[#212121]">
          <span className="font-semibold text-[#00356B]">{a.authorName}: </span>
          {a.body}
        </p>
      ))}
    </section>
  );
}
