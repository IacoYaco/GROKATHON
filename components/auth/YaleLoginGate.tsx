"use client";

import { GraduationCap, Loader2, Shield, University } from "lucide-react";
import { useState } from "react";
import { GlossyOrb } from "@/components/visual/GlossyOrb";
import { useAuth } from "@/hooks/useAuth";

export function YaleLoginGate() {
  const { loading, casLive, demoLogin, startCasLogin, simulated } = useAuth();
  const [busy, setBusy] = useState<"student" | "faculty" | "cas" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDemo = async (role: "student" | "faculty") => {
    setBusy(role);
    setError(null);
    try {
      await demoLogin({
        role,
        netid: role === "faculty" ? "ceidfac" : "huyanh",
        displayName: role === "faculty" ? "Prof. Rivera" : "Huy Anh",
        college: role === "faculty" ? "CEID Faculty" : "Pierson",
        classYear: role === "student" ? "'30" : "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_#F4E8E4_0%,_#E8EEF8_42%,_#D8E4F5_100%)]">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(rgba(33,33,33,0.05)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="order-2 lg:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#286DC0]">
            Yale CEID · Becton Center
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-5xl font-light italic leading-[1.05] tracking-[-0.03em] text-[#212121] md:text-6xl">
            Co-Pilot for the shop floor
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#424242]">
            Sign in with your Yale NetID via CAS so CEID can tell students from
            faculty — unlocking the right tools for diagnose, DFM, certs, and
            floor oversight.
          </p>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              disabled={Boolean(busy) || !casLive}
              onClick={() => {
                setBusy("cas");
                startCasLogin();
              }}
              className="glossy-pill inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {busy === "cas" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <University className="h-4 w-4" />
              )}
              {casLive ? "Sign in with Yale CAS" : "Yale CAS (awaiting ITS registration)"}
            </button>

            <div className="gloss-panel rounded-[20px] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
                Demo Yale ID accounts
              </p>
              <p className="mt-1 text-sm text-[#424242]">
                Until this service is registered with Yale ITS, use a demo NetID
                role. Accounts persist in the app database.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={Boolean(busy) || loading}
                  onClick={() => onDemo("student")}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white/90 px-4 text-sm font-semibold text-[#00356B] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-[#E7E7E7]"
                >
                  {busy === "student" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <GraduationCap className="h-4 w-4" />
                  )}
                  Enter as Student
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy) || loading}
                  onClick={() => onDemo("faculty")}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#00356B] px-4 text-sm font-semibold text-white"
                >
                  {busy === "faculty" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  Enter as Faculty
                </button>
              </div>
              {error && <p className="mt-3 text-sm text-[#C5221F]">{error}</p>}
              {simulated && (
                <p className="mt-3 text-xs text-[#6B7280]">
                  Local preview uses a simulated Cursor viewer.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="order-1 flex justify-center lg:order-2">
          <div className="relative h-[300px] w-[300px] md:h-[380px] md:w-[380px]">
            <div className="absolute inset-8 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.95),rgba(40,109,192,0.18)_55%,rgba(146,124,135,0.25))] blur-2xl" />
            <GlossyOrb className="relative h-full w-full" accent="#286DC0" />
          </div>
        </div>
      </div>
    </div>
  );
}
