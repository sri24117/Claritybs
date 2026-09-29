"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

/**
 * WhatsApp simulator. Drives the exact same inbound path as the real Meta
 * webhook, so the whole product can be tested before any API key exists.
 */
export default function Simulator() {
  const [threads, setThreads] = useState<any[]>([]);
  const [phone, setPhone] = useState("919888777000");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  const loadThreads = useCallback(() => {
    api("/whatsapp/sim/threads")
      .then((r: any) => setThreads(r.patients || []))
      .catch((e) => setErr(e.message));
  }, []);

  const loadThread = useCallback((p: string) => {
    api(`/whatsapp/sim/thread/${p}`)
      .then((r: any) => setMessages(r.messages || []))
      .catch(() => setMessages([]));
  }, []);

  useEffect(() => {
    loadThreads();
    const t = setInterval(loadThreads, 8000);
    return () => clearInterval(t);
  }, [loadThreads]);

  useEffect(() => {
    if (phone) loadThread(phone);
  }, [phone, loadThread]);

  const send = async (extra: any = {}) => {
    try {
      setErr("");
      const r = await api("/whatsapp/sim/inbound", {
        method: "POST",
        body: JSON.stringify({ phone, text, ...extra }),
      });
      setNote(`→ ${r.status}`);
      setText("");
      loadThread(phone);
      loadThreads();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const sendImage = async () => {
    try {
      setErr("");
      const png =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AL+kQAAAABJRU5ErkJggg==";
      const m = await api<any>("/whatsapp/sim/media", {
        method: "POST",
        body: JSON.stringify({ data: png, mime: "image/png" }),
      });
      await send({ type: "image", mediaId: m.mediaId, mime: "image/png", text: "" });
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const quick = async (label: string, body: string) => {
    setText(body);
    await api("/whatsapp/sim/inbound", {
      method: "POST",
      body: JSON.stringify({ phone, text: body }),
    });
    setText("");
    setNote(`→ ${label}`);
    loadThread(phone);
    loadThreads();
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6edf3]">
      <div className="mx-auto grid max-w-5xl gap-5 px-5 py-6 lg:grid-cols-[260px_1fr]">
        <div>
          <Link href="/console" className="text-sm text-[#8b98a5] hover:underline">
            ← Console
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight">WhatsApp simulator</h1>
          <p className="mt-1 text-xs text-[#8b98a5]">
            No Meta credentials configured. Every message here runs the real inbound flow; replies are
            logged to the patient&apos;s conversation instead of being sent.
          </p>

          <label className="mt-4 block text-xs text-[#8b98a5]">Patient phone (with country code)</label>
          <input
            className="mt-1 w-full rounded-lg border border-[#232a33] bg-[#0f1318] px-3 py-2 text-sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
          />

          <p className="mt-4 text-xs text-[#8b98a5]">Recent patients</p>
          <div className="mt-1 max-h-40 space-y-1 overflow-auto">
            {threads.map((t: any) => (
              <button
                key={t.id}
                onClick={() => setPhone(t.phone)}
                className={`block w-full rounded-lg border px-3 py-1.5 text-left text-xs ${
                  t.phone === phone ? "border-emerald-500/60 bg-emerald-500/10" : "border-[#232a33]"
                }`}
              >
                {t.phone} <span className="text-[#8b98a5]">· {t.state}</span>
              </button>
            ))}
            {threads.length === 0 && <p className="text-xs text-[#8b98a5]">None yet.</p>}
          </div>

          <p className="mt-4 text-xs text-[#8b98a5]">Quick scripts</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <button className="btn ghost" onClick={() => quick("new patient", "Hi")}>
              Hi
            </button>
            <button className="btn ghost" onClick={() => quick("consent", "yes")}>
              YES
            </button>
            <button className="btn ghost" onClick={() => quick("profile", "45 M 72")}>
              45 M 72
            </button>
            <button className="btn ghost" onClick={() => quick("typed values", "HbA1c 6.4, FBS 118, PPBS 165")}>
              Values
            </button>
            <button className="btn ghost" onClick={() => quick("paylink", "plan")}>
              PLAN
            </button>
            <button className="btn ghost" onClick={() => quick("red flag", "I have chest pain")}>
              Red flag
            </button>
            <button className="btn ghost" onClick={sendImage}>
              Send report photo
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#232a33] bg-[#14181d] p-4">
          <div className="flex items-center justify-between">
            <b>Conversation</b>
            {note && <span className="text-xs text-emerald-400">{note}</span>}
          </div>
          {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
          <div className="my-3 max-h-[55vh] min-h-[300px] overflow-auto">
            {messages.map((m: any, i: number) => (
              <div
                key={i}
                className={`mb-2 max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                  m.direction === "in" ? "bg-[#1d242c]" : "ml-auto bg-[#0d3b2c]"
                }`}
              >
                {m.body}
              </div>
            ))}
            {messages.length === 0 && <p className="text-sm text-[#8b98a5]">No messages yet. Send “Hi”.</p>}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-[#232a33] bg-[#0f1318] px-3 py-2 text-sm"
              placeholder="Type as the patient…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button className="btn" onClick={() => send()}>
              Send
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .btn {
          border-radius: 8px;
          border: 0;
          background: #10b981;
          color: #04130d;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn.ghost {
          background: transparent;
          color: #e6edf3;
          border: 1px solid #232a33;
        }
      `}</style>
    </div>
  );
}
