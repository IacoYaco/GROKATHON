"use client";

import { NewsletterParser } from "@/components/workshops/NewsletterParser";

export function WorkshopView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-light italic tracking-[-0.02em] text-[#212121] md:text-4xl">
          Workshop & Cert Sniper
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#424242] md:text-base">
          Paste the messy CEID weekly email. Grok extracts trainings, highlights
          certs your DFM plan still needs, and lets you claim a seat with a
          calendar file.
        </p>
      </div>
      <NewsletterParser />
    </div>
  );
}
