"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const SECTIONS: Array<[string, string, string]> = [
  ["flags", "🔴 Flags: needs attention", "text-red-400"],
  ["verify", "🟠 Verify report values", "text-orange-400"],
  ["plans", "🟡 Plans to review", "text-yellow-400"],
  ["noreply", "⚪ No reply to check-in", "text-slate-400"],
  ["ontrack", "🟢 On track", "text-emerald-400"],
];

export default function Console() {
  const [q, setQ] = useState<any>(null);
  const [err, setErr] = useState("");
  const [sim, setSim] = useState("");

  useEffect(() => {
    const load = () =>
      api("/console/queue")
        .then(setQ)
        .catch((e) => setErr(e.message));
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api("/auth/me")
      .then((m: any) => setSim(m.simulation || ""))
      .catch(() => {});
  }, []);

  const logout = async () => {
    await api("/auth/logout", { method: "POST" });
    location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6edf3]">
      <div className="mx-auto max-w-4xl px-5 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Today</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/sim" className="rounded-lg border border-[#232a33] px-3 py-1.5 hover:bg-[#14181d]">
              WhatsApp simulator
            </Link>
            <button onClick={logout} className="rounded-lg border border-[#232a33] px-3 py-1.5 hover:bg-[#14181d]">
              Log out
            </button>
          </div>
        </div>
        {sim && (
          <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            {sim} — add API keys in .env to go live. Messages are logged, not sent.
          </p>
        )}
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
        {!q && !err && <p className="mt-6 text-[#8b98a5]">Loading…</p>}
        {q &&
          SECTIONS.map(([k, title, cls]) => (
            <div key={k} className="mt-5 rounded-xl border border-[#232a33] bg-[#14181d] p-4">
              <div className="flex items-center gap-2">
                <b className={cls}>{title}</b>
                <span className="rounded-full border border-[#232a33] px-2 py-0.5 text-xs text-[#8b98a5]">
                  {q[k].length}
                </span>
              </div>
              {q[k].length === 0 && <p className="mt-2 text-sm text-[#8b98a5]">Nothing here.</p>}
              {q[k].map((i: any, n: number) => (
                <div key={n} className="mt-2 flex items-center gap-3 border-t border-[#232a33] pt-2 text-sm">
                  <Link href={`/console/patients/${i.patient_id}`} className="hover:underline">
                    {i.label}
                  </Link>
                  <span className="text-[#8b98a5]">{i.rule_id || i.detail || ""}</span>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
