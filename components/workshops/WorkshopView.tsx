"use client";

import { NewsletterParser } from "@/components/workshops/NewsletterParser";

export function WorkshopView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-[#00356B] md:text-3xl">
          Workshop & Cert Sniper
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#6B7280] md:text-base">
          Paste the messy CEID weekly email. Grok extracts trainings, highlights
          certs your DFM plan still needs, and lets you claim a seat with a
          calendar file.
        </p>
      </div>
      <NewsletterParser />
    </div>
  );
}
