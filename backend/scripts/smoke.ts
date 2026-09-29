/**
 * End-to-end smoke test of the whole prototype. Requires the API running
 * (npm run dev) and a dietician seeded (npm run seed).
 *
 *   API=http://localhost:5000 EMAIL=you@example.com PASSWORD=pw npm run smoke
 *
 * Exercises: login -> consent -> profile -> typed values -> report photo ->
 * verify -> payment -> plan approve -> check-in reply -> red flag -> erasure.
 */
const API = process.env.API || "http://localhost:5000";
const EMAIL = process.env.EMAIL || "cousin@example.com";
const PASSWORD = process.env.PASSWORD || "test-password-123";
const PHONE = "9190" + String(Math.floor(Math.random() * 10000000)).padStart(7, "0");

let cookie = "";
let pass = 0;
let fail = 0;

function ok(label: string, cond: boolean, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label} ${extra}`);
  }
}

async function call(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...(cookie ? { headers: { "Content-Type": "application/json", Cookie: cookie } } : {}),
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const text = await res.text();
  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    /* html error page */
  }
  return { status: res.status, json };
}

async function say(text: string, extra: any = {}) {
  return call("/api/whatsapp/sim/inbound", {
    method: "POST",
    body: JSON.stringify({ phone: PHONE, text, ...extra }),
  });
}

async function main() {
  console.log(`\nClarityBS smoke test against ${API} (patient ${PHONE})\n`);

  const health = await call("/health");
  ok("API healthy", health.status === 200 && health.json.ok === true, JSON.stringify(health.json));

  const login = await call("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  ok("dietician login", login.status === 200 && !!login.json.name, JSON.stringify(login.json));
  const bad = await call("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: "wrong-password" }),
  });
  ok("wrong password rejected", bad.status === 401);

  console.log("\nPatient journey (WhatsApp simulator)");
  ok("first message -> welcome", (await say("Hi")).json.status === "welcome");
  ok("non-consent reply", (await say("maybe")).json.status === "consent");
  ok("consent accepted", (await say("yes")).json.status === "consent");
  ok("bad profile rejected", (await say("hello")).json.status === "bad_profile");
  ok("profile accepted", (await say("45 M 72")).json.status === "profile");

  const typed = await say("HbA1c 6.4, FBS 118, PPBS 165");
  ok("typed values ingested", typed.json.status === "ingested-typed");

  const thread = await call(`/api/whatsapp/sim/thread/${PHONE}`);
  const last = thread.json.messages?.[thread.json.messages.length - 1]?.body || "";
  ok("auto-explanation sent", /prediabetes/.test(last) && /Only a doctor can diagnose/.test(last));
  ok("upsell included", /PLAN/.test(last));

  console.log("\nReport photo -> verify queue");
  const media = await call("/api/whatsapp/sim/media", {
    method: "POST",
    body: JSON.stringify({
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AL+kQAAAABJRU5ErkJggg==",
      mime: "image/png",
    }),
  });
  ok("media stored", !!media.json.mediaId);
  const img = await say("", { type: "image", mediaId: media.json.mediaId, mime: "image/png" });
  ok("report ingested", img.json.status === "ingested");

  const queue = await call("/api/console/queue");
  const verify = queue.json.verify || [];
  const mine = verify.find((v: any) => v.label === PHONE);
  ok("simulated report in verify queue", !!mine, JSON.stringify(verify.map((v: any) => v.label)));
  ok("simulated extraction marked", !!mine?.simulated);
  ok("low confidence blocks auto-explain", (mine?.confidence ?? 1) < 0.9);

  const pid = img.json.patientId;
  const patient = await call(`/api/console/patients/${pid}`);
  ok("patient fetched from console", patient.status === 200);
  ok("consent recorded", !!patient.json.patient?.consent_at);

  console.log("\nDietician verifies and sends");
  const rid = patient.json.reports[0].id;
  const verified = await call(`/api/console/reports/${rid}`, {
    method: "PATCH",
    body: JSON.stringify({ hba1c: 6.8, fbs: 132, ppbs: 178, report_date: "2026-09-20" }),
  });
  ok("report verified", verified.status === 200);
  const afterVerify = await call(`/api/console/patients/${pid}`);
  ok("report status is verified", afterVerify.json.reports[0].status === "verified");

  const settled = await call("/api/pay/sim/settle", {
    method: "POST",
    body: JSON.stringify({ patientId: pid, tier: "guided" }),
  });
  ok("simulated payment settled", settled.status === 200 && settled.json.ok === true);
  const withPlan = await call(`/api/console/patients/${pid}`);
  ok("plan drafted", withPlan.json.plans.length > 0 && withPlan.json.plans[0].status === "draft");
  ok("tier upgraded", withPlan.json.patient.tier === "guided");

  const plid = withPlan.json.plans[0].id;
  const blocked = await call(`/api/console/plans/${plid}`, {
    method: "PATCH",
    body: JSON.stringify({ final_text: "Take metformin 500mg daily" }),
  });
  ok("medication advice blocked", blocked.status === 400);

  const goodText = "30-day food guidance:\n1. Half plate vegetables, smaller rice, dal or curd.\n2. 10 minute walk after meals.\nPlease discuss this with your doctor before making changes.";
  await call(`/api/console/plans/${plid}`, { method: "PATCH", body: JSON.stringify({ final_text: goodText }) });
  const approved = await call(`/api/console/plans/${plid}/approve`, { method: "POST" });
  ok("plan approved and delivered", approved.status === 200);
  const sent = await call(`/api/console/patients/${pid}`);
  ok("plan marked sent", sent.json.plans[0].status === "sent");
  ok("check-ins scheduled", sent.json.checkins.length === 4, `${sent.json.checkins.length} check-ins`);

  // Check-ins are due in 7/14/21/28 days, so none has been sent yet: a "2" reply
  // is handled as an ordinary message. Once the scheduler sends one, this same
  // reply is recorded as a check-in response (markCheckinResponse).
  const reply = await say("2");
  ok("reply before any check-in is sent is handled", reply.json.status === "fallback", reply.json.status);

  console.log("\nSafety");
  const red = await say("I have chest pain and feel breathless");
  ok("red flag raised", red.json.status === "symptom_red");
  const q2 = await call("/api/console/queue");
  ok("flag appears in queue", (q2.json.flags || []).some((f: any) => f.patient_id === pid));

  console.log("\nErasure (DPDP)");
  const erased = await call(`/api/console/patients/${pid}/erase`, { method: "POST" });
  ok("patient erased", erased.status === 200);
  const gone = await call(`/api/console/patients/${pid}`);
  ok("erased patient is gone", gone.status === 404);

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error("smoke test crashed:", e);
  process.exit(1);
});
