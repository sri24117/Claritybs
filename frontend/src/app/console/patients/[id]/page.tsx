"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const n = (x: any) => (x === "" || x === null || x === undefined ? null : Number(x));

function ReportRow({ r, onSaved, onErr }: { r: any; onSaved: () => void; onErr: (m: string) => void }) {
  const [v, setV] = useState({
    hba1c: r.hba1c ?? "",
    fbs: r.fbs ?? "",
    ppbs: r.ppbs ?? "",
    report_date: r.report_date ? String(r.report_date).slice(0, 10) : "",
  });
  const save = async () => {
    try {
      await api(`/console/reports/${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          hba1c: n(v.hba1c),
          fbs: n(v.fbs),
          ppbs: n(v.ppbs),
          report_date: v.report_date || null,
        }),
      });
      onSaved();
    } catch (e: any) {
      onErr(e.message);
    }
  };
  const set = (k: string) => (e: any) => setV({ ...v, [k]: e.target.value });
  return (
    <tr className="border-t border-[#232a33]">
      <td className="py-2">
        #{r.id.slice(0, 6)}{" "}
        <span
          className={`ml-1 rounded-full border px-2 py-0.5 text-[11px] ${
            r.status === "needs_verification"
              ? "border-orange-500/50 text-orange-300"
              : r.status === "verified"
                ? "border-emerald-500/50 text-emerald-300"
                : "border-[#232a33] text-[#8b98a5]"
          }`}
        >
          {r.status}
          {r.simulated ? " · sim" : ""}
        </span>
      </td>
      <td>
        <input className="inp" value={v.hba1c} onChange={set("hba1c")} placeholder="HbA1c" />
      </td>
      <td>
        <input className="inp" value={v.fbs} onChange={set("fbs")} placeholder="FBS" />
      </td>
      <td>
        <input className="inp" value={v.ppbs} onChange={set("ppbs")} placeholder="PPBS" />
      </td>
      <td>
        <input className="inp" value={v.report_date} onChange={set("report_date")} placeholder="YYYY-MM-DD" />
      </td>
      <td className="space-x-2 whitespace-nowrap">
        <button className="btn" onClick={save}>
          Verify
        </button>
        {r.has_file && (
          <a className="btn ghost" href={`/api/console/reports/${r.id}/file`} target="_blank" rel="noreferrer">
            File
          </a>
        )}
      </td>
    </tr>
  );
}

function PlanBox({ pl, onDone, onErr }: { pl: any; onDone: () => void; onErr: (m: string) => void }) {
  const [t, setT] = useState(pl.final_text || "");
  const locked = pl.status === "sent";
  const save = async () => {
    try {
      await api(`/console/plans/${pl.id}`, { method: "PATCH", body: JSON.stringify({ final_text: t }) });
      onDone();
    } catch (e: any) {
      onErr(e.message);
    }
  };
  const approve = async () => {
    try {
      await save();
      const r = await api(`/console/plans/${pl.id}/approve`, { method: "POST" });
      onErr(`Delivery: ${r.delivery}`);
      onDone();
    } catch (e: any) {
      onErr(e.message);
    }
  };
  return (
    <div className="mt-3 rounded-xl border border-[#232a33] p-3">
      <div className="flex items-center gap-2 text-sm">
        <b>{pl.tier} plan</b>
        <span className="rounded-full border border-[#232a33] px-2 py-0.5 text-[11px] text-[#8b98a5]">
          {pl.status}
        </span>
      </div>
      {pl.status === "drafting" ? (
        <p className="mt-2 text-sm text-[#8b98a5]">Drafting… refresh in a moment.</p>
      ) : (
        <>
          <textarea
            className="mt-2 min-h-[180px] w-full rounded-lg border border-[#232a33] bg-[#0f1318] p-3 text-sm"
            value={t}
            onChange={(e) => setT(e.target.value)}
            disabled={locked}
          />
          {!locked && (
            <div className="mt-2 flex gap-2">
              <button className="btn ghost" onClick={save}>
                Save edits
              </button>
              <button className="btn" onClick={approve}>
                Approve &amp; send
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [name, setName] = useState("");

  const load = useCallback(
    () =>
      api(`/console/patients/${id}`)
        .then(setD)
        .catch((e) => setErr(e.message)),
    [id],
  );
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (fn: () => Promise<any>, ok?: string) => {
    try {
      setErr("");
      const r = await fn();
      if (r?.status) setNote(`Status: ${r.status}`);
      else if (ok) setNote(ok);
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  if (!d) return <div className="min-h-screen bg-[#0b0d10] p-6 text-[#e6edf3]">{err ? <p className="text-red-400">{err}</p> : "Loading…"}</div>;
  const p = d.patient;

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e6edf3]">
      <style jsx global>{`
        .inp {
          width: 92px;
          border-radius: 6px;
          border: 1px solid #232a33;
          background: #0f1318;
          padding: 4px 6px;
          font-size: 13px;
          color: #e6edf3;
        }
        .btn {
          border-radius: 8px;
          border: 0;
          background: #10b981;
          color: #04130d;
          padding: 5px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn.ghost {
          background: transparent;
          color: #e6edf3;
          border: 1px solid #232a33;
        }
        .btn.danger {
          background: #ef4444;
          color: #fff;
        }
        .card {
          margin-top: 16px;
          border-radius: 12px;
          border: 1px solid #232a33;
          background: #14181d;
          padding: 14px;
        }
      `}</style>

      <div className="mx-auto max-w-4xl px-5 py-6">
        <Link href="/console" className="text-sm text-[#8b98a5] hover:underline">
          ← Queue
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{p.name || p.phone}</h1>
          <span className="rounded-full border border-[#232a33] px-3 py-1 text-xs text-[#8b98a5]">{p.tier}</span>
        </div>
        <p className="text-sm text-[#8b98a5]">
          {p.phone} · {p.age ?? "?"}y · {p.sex ?? "?"} · {p.weight_kg ?? "?"}kg · state: {p.state}
          {p.consent_at ? ` · consented ${String(p.consent_at).slice(0, 10)} (${p.consent_version})` : " · NO CONSENT"}
        </p>
        {err && <p className="mt-2 text-sm text-orange-400">{err}</p>}
        {note && <p className="mt-2 text-sm text-emerald-400">{note}</p>}

        <div className="card flex flex-wrap items-center gap-2">
          <input
            className="inp"
            style={{ width: 180 }}
            placeholder="Set name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn ghost" onClick={() => act(() => api(`/console/patients/${p.id}`, { method: "PATCH", body: JSON.stringify({ name }) }), "Name saved")}>
            Save name
          </button>
          <button className="btn ghost" onClick={() => act(() => api(`/console/patients/${p.id}/paylink`, { method: "POST", body: JSON.stringify({ tier: "reset" }) }), "₹299 link sent")}>
            Send ₹299 link
          </button>
          <button className="btn ghost" onClick={() => act(() => api(`/console/patients/${p.id}/paylink`, { method: "POST", body: JSON.stringify({ tier: "guided" }) }), "₹999 link sent")}>
            Send ₹999 link
          </button>
          <button className="btn ghost" onClick={() => act(() => api(`/console/patients/${p.id}/plans`, { method: "POST", body: JSON.stringify({ tier: "reset" }) }), "Plan drafting")}>
            New 14-day plan
          </button>
          <button className="btn ghost" onClick={() => act(() => api(`/console/patients/${p.id}/plans`, { method: "POST", body: JSON.stringify({ tier: "guided" }) }), "Plan drafting")}>
            New 30-day plan
          </button>
          <button
            className="btn danger"
            style={{ marginLeft: "auto" }}
            onClick={() => {
              if (confirm("Erase ALL data for this patient? This cannot be undone.")) {
                act(() => api(`/console/patients/${p.id}/erase`, { method: "POST" }), "Patient erased");
              }
            }}
          >
            Erase all data
          </button>
        </div>

        {d.flags.length > 0 && (
          <div className="card">
            <b className="text-red-400">Open flags</b>
            {d.flags.map((f: any) => (
              <div key={f.id} className="mt-2 flex items-center gap-3 border-t border-[#232a33] pt-2 text-sm">
                <span className={f.severity === "red" ? "text-red-400" : "text-orange-400"}>{f.rule_id}</span>
                <span className="text-[#8b98a5]">{f.detail}</span>
                <button
                  className="btn ghost"
                  style={{ marginLeft: "auto" }}
                  onClick={() => act(() => api(`/console/flags/${f.id}/resolve`, { method: "POST" }), "Flag resolved")}
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <b>Reports</b>
          <table className="mt-2 w-full text-sm">
            <thead className="text-[#8b98a5]">
              <tr>
                <th className="text-left">#</th>
                <th className="text-left">HbA1c</th>
                <th className="text-left">FBS</th>
                <th className="text-left">PPBS</th>
                <th className="text-left">Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {d.reports.map((r: any) => (
                <ReportRow key={r.id} r={r} onSaved={load} onErr={setErr} />
              ))}
            </tbody>
          </table>
          {d.reports.length === 0 && <p className="mt-2 text-sm text-[#8b98a5]">No reports yet.</p>}
        </div>

        <div className="card">
          <b>Plans</b>
          {d.plans.map((pl: any) => (
            <PlanBox key={pl.id} pl={pl} onDone={load} onErr={setErr} />
          ))}
          {d.plans.length === 0 && <p className="mt-2 text-sm text-[#8b98a5]">No plans yet.</p>}
        </div>

        <div className="card">
          <b>Check-ins</b>
          {d.checkins.length === 0 && <p className="mt-2 text-sm text-[#8b98a5]">None scheduled.</p>}
          {d.checkins.map((c: any) => (
            <div key={c.id} className="mt-1 flex gap-3 border-t border-[#232a33] pt-1 text-sm">
              <span>{String(c.due_at).slice(0, 10)}</span>
              <span className="text-[#8b98a5]">{c.status}</span>
              {c.note && <span className="text-[#8b98a5]">— {c.note}</span>}
            </div>
          ))}
        </div>

        <div className="card">
          <b>Conversation</b>
          <div className="my-2">
            {d.messages.map((m: any, i: number) => (
              <div
                key={i}
                className={`mb-1 max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                  m.direction === "in" ? "bg-[#1d242c]" : "ml-auto bg-[#0d3b2c]"
                }`}
              >
                {m.body}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="inp"
              style={{ flex: 1, width: "auto" }}
              placeholder="Message the patient…"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />
            <button
              className="btn"
              onClick={() =>
                msg &&
                act(async () => {
                  const r = await api(`/console/patients/${p.id}/message`, {
                    method: "POST",
                    body: JSON.stringify({ body: msg }),
                  });
                  setMsg("");
                  return r;
                })
              }
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
