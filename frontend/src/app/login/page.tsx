"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      r.push("/console");
    } catch (x: any) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0d10] p-6 text-[#e6edf3]">
      <form onSubmit={go} className="w-full max-w-sm rounded-2xl border border-[#232a33] bg-[#14181d] p-8">
        <h1 className="text-2xl font-bold tracking-tight">ClarityBS Console</h1>
        <p className="mt-1 text-sm text-[#8b98a5]">Dietician sign-in</p>
        <div className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[#232a33] bg-[#0f1318] px-4 py-2.5 outline-none focus:border-emerald-500"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[#232a33] bg-[#0f1318] px-4 py-2.5 outline-none focus:border-emerald-500"
          />
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button
            disabled={busy}
            className="w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-[#04130d] hover:bg-emerald-400 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Log in"}
          </button>
        </div>
      </form>
    </div>
  );
}
