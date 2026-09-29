# ClarityBS — Realistic 0 → 1 Plan

**Scope:** Hyderabad · one dietician (your cousin) · one KVM 4 · zero ad budget
**Written:** 2026-09-29 · **Horizon:** 24 weeks · **Currency:** INR
**Rule of this document:** every phase ends in a number, not a feeling.

---

## 0. What "1" means (and what it does not)

"1" is **not** a deployed app. A deployed app with 3 users is still 0.

**"1" is reached when all four are true:**

1. **30 patients have paid** (mix of ₹299 / ₹999 tiers)
2. Your cousin delivers without drowning — measured, not assumed (≤ 35 hrs/month of patient work)
3. **≥50% of new patients come from content or referral**, not from her phone contacts
4. The software does the repetitive half: intake, extraction, reminders, the follow-up queue

If at week 24 you have 30 paying patients and the console is a Google Sheet — you have a business.
If at week 24 you have a beautiful app and 4 patients — you have a hobby.

---

## 1. Where you actually are today (repo reality check)

Audited 2026-09-29 against this repository.

| Asset | Actual state | Verdict |
|---|---|---|
| `frontend/` — landing | Next 16, Tailwind 4, decent shell | **Keep.** It becomes the single decoder page |
| `frontend/` — consumer dashboard (habits / coach / family / learn) | Built, mock data | **Freeze.** This is the #1 time sink the strategy warns against |
| `backend/src/services/gemini.service.ts` | Real Gemini extraction call | **Keep and reuse** — it is the core of phase 2 |
| `backend/src/services/rule-engine.service.ts` | Real deterministic risk bands | **Keep and reuse** |
| `backend/src/routes/auth.routes.ts` | Hardcoded mock login | Replace (BCrypt + JWT) |
| `backend/src/routes/dashboard.routes.ts` | Mock habits + mock timeline | Delete or ignore |
| `backend/src/routes/whatsapp.routes.ts` | Webhook verify + mock echo reply | Skeleton only — no state machine |
| `prisma/schema.prisma` | `User/Report/ExtractedValue/Analysis/DietPlan/Payment/AuditLog` + 2.0 models | Report extraction half is right; **missing** Patient, Consent, Checkin, Flag, Message, Dietician |
| Payments | Razorpay keys in `.env.example`, nothing wired | Phase 2 |
| Infra | No `docker-compose.yml`, no Caddy, no `.env` | Phase 2 |
| Clinical safety | Thresholds exist in code, **not signed off** | **Blocker for real patients** (Phase 0) |

**Read this as good news.** You already have the two hardest technical pieces (report extraction, deterministic rules). What's missing is the boring workflow part — and you cannot know *which* workflow part to build until you've served patients manually. That is the entire logic of this plan.

---

## 2. The four constraints that shape every decision

| # | Constraint | Consequence |
|---|---|---|
| 1 | **Cousin's hours are the capacity ceiling** (~40 active patients before she breaks) | Every rupee of pricing and every feature is judged by *minutes it saves her*, not by elegance |
| 2 | **Health data** — DPDP Act 2023 + DPDP Rules 2025 (notified Nov 2025, phased commencement over ~12–18 months) | Consent, minimum data, audit log, erasure workflow are **phase 0**, not "later" |
| 3 | **Zero paid-acquisition budget** | Content + cousin's existing network + referrals only. SEO takes 8–16 weeks to pay off, so it starts at week 1 but is not expected to carry until week 10+ |
| 4 | **One practitioner = one brand face** | "AI dietician" positioning is a dead end. The named, credentialed human is the product |

---

## 3. Phase 0 — Unblock (this week: Sep 29 – Oct 4)

**Goal of this phase: everything that has a waiting period gets started today.** Six items, four of them can run in parallel. No patients yet.

| # | Item | Owner | Realistic time | Why it blocks |
|---|---|---|---|---|
| 1 | **Meta Business verification** + WhatsApp number + app in Meta Business Suite | You | **3–7 days of waiting** (start day 1, it's the slowest) | Nothing WhatsApp-shaped works without it |
| 2 | **Razorpay KYC** + create the two payment links (₹299, ₹999) in the dashboard | You | 2–4 days | You cannot take money. Links work before any code exists |
| 3 | **Clinical sign-off pack** (see `clinical-signoff-checklist.md`) | Cousin | 1 evening | The codebase itself says thresholds are placeholders until she signs |
| 4 | **Consent text, privacy page, clinic terms** — lawyer review | Lawyer | 3–5 days, ₹5k–10k | DPDP consent notice + health-adjacent disclaimers. Non-negotiable before real PHI |
| 5 | **WhatsApp Business profile**: cousin's name + "Dt." + qualification, photo, trust-first bio | Cousin | 30 min | First thing every patient sees |
| 6 | **The tracking sheet** (`patient-tracker.csv`) | You | 15 min | Without it, phase 1 produces anecdotes instead of decisions |

**Two shortcuts that make this phase 3 days instead of 3 weeks:**

- **During concierge, use the free WhatsApp Business app on her phone**, not the Cloud API. 10 patients does not need an API. Cloud API arrives in phase 2.
- **Razorpay payment links are created in the dashboard and pasted into chat.** No integration needed to collect ₹299 in week 2.

**Deliverable that ends this phase:** a working WhatsApp number that can receive a photo, two live payment links, a signed clinical checklist, and lawyer-approved consent text. Nothing else.

---

## 4. Phase 1 — Concierge (Weeks 1–3: Oct 5 – Oct 25)

**Goal numbers (write these on the wall):**

| Metric | Target | Why this number |
|---|---|---|
| Real conversations started | **30** | Enough to hear the same question 5 times |
| Reports actually received | **15** | 50% is realistic for warm audiences |
| Free decodes delivered | **10** | Your labour ceiling for a free tier |
| Paying patients | **3** | One ₹299 + one ₹299 + one ₹999 ≈ ₹1,597 |
| Minutes of cousin's time per patient | **measured** | This single number decides what you build in phase 2 |

### The manual SOP (per patient — follow it exactly so the data is clean)

| Step | Action | Time budget |
|---|---|---|
| 1 | Patient sends report photo on WhatsApp | — |
| 2 | Reply with the consent message (below). Wait for "YES" | 1 min |
| 3 | Read the report yourself (eyes on the actual PDF/photo) | 3 min |
| 4 | Type the three numbers into the tracker | 1 min |
| 5 | Send the plain-language explanation (template + her edit) | 3 min |
| 6 | Ask the one qualifying question: *"What's the hardest part of your day to eat well?"* | 1 min |
| 7 | If interested → send Razorpay link | 1 min |
| 8 | On payment → she writes the plan from her own template | 15–25 min |
| 9 | Day 3 / Day 7 / Day 14 check-in, manually, from her phone | 3 min each |

### The exact words (copy-paste, then make them hers)

**Consent (step 2):**
> Hi! I'm Dt. [Name], registered dietitian, Hyderabad. Before I look at your report: I'll explain what the numbers mean and suggest food changes. I can't diagnose or change any medicine — that's your doctor's job. I'll store your number, age and report only to help you, and you can ask me to delete everything any time. Reply YES to go ahead.

**The free offer (what you send to get the first 30 conversations):**
> Send me a photo of your latest sugar report and I'll tell you what the numbers actually mean — in plain language, free. No medicines, no diagnosis, just what to eat.

**After the decode (step 5 → 6 → 7):**
> Here's what your numbers mean: [2–3 lines]. Only a doctor can diagnose this — please show them the report too.
> If you want, I can build a 14-day food plan around the way you *actually* eat — rice, idli, chai, office lunch and all. ₹299. Reply PLAN and I'll send the link.

**Check-in (step 9):**
> Quick check-in 🌿 Day [x]. Reply 1 = followed it well, 2 = partly, 3 = struggled. Or just tell me in your own words.

### Where the first 30 conversations come from (ranked by yield)

| Channel | Expected conversations | Effort |
|---|---|---|
| 1. Cousin's existing/known patients + family + WhatsApp contacts | 10–15 | 2 hours of personal asks |
| 2. Her WhatsApp status (3×/week) + 2 relevant local groups | 10–20 | 10 min/day |
| 3. 2 Instagram Reels/week starting **week 1** (not week 8) | 2–8 | 3 hrs/week |
| 4. One conversation with a local GP/clinic (ask for *referrals*, not a partnership) | 0–5 | 1 visit |

**Explicitly not in phase 1:** SEO pages, paid ads, a marketplace, a second practitioner, Telugu, a mobile app.

### The one rule of phase 1

**No new code.** When you catch yourself wanting to build something, append it to `BUILD_REQUESTS.md` with the sentence *"Cousin spent X minutes doing this."* That file *is* the phase 2 spec. If it stays empty, phase 2 is smaller.

---

## 5. Phase 2 — Build the thin slice (Weeks 4–7: Oct 26 – Nov 22)

**Gate to enter:** ≥3 paying patients **and** cousin has named at least one task as "this is repetitive". If either is missing, stay in phase 1. Building now is the most expensive mistake available to you.

### Build list, ranked by expected minutes saved per week of build time

| Priority | Build | What it replaces | Reuses from this repo |
|---|---|---|---|
| 1 | **WhatsApp Cloud API intake + consent state machine** (`new → await_consent → await_profile → active`) | Her typing the consent text 15×/day | `whatsapp.routes.ts` skeleton |
| 2 | **Report extraction + human-verify queue** | Her reading each report by eye | `gemini.service.ts`, `rule-engine.service.ts`, `ExtractedValue` model |
| 3 | **Dietician console — "Today" queue**: 🔴 flags / 🟠 verify / 🟡 plans / ⚪ no reply / 🟢 on track | Her keeping the patient list in her head | `frontend/` landing shell, dark theme |
| 4 | **Plan: draft → edit → approve → send** | Retyping plans | `templates/base.md` (cousin's own templates) |
| 5 | **Check-in scheduler + missed-reply detection** | Remembering who to chase | — |
| 6 | **Razorpay webhook → unlock tier** | Her checking if payment landed | `Payment` model |

### Non-negotiables in the build (these are not phase 3)

- Explicit consent captured and versioned before any report is stored
- **Audit log** on every console action (who viewed/edited/sent/erased what, when)
- Deterministic red-flag rules in code — the LLM never decides safety
- Report files encrypted at rest (Fernet), decrypt only on verified view
- Erasure endpoint that actually deletes files + rows, keeps only payment records
- 18+ only; medication/dose words blocked from AI output; doctor-escalation copy on every red flag

### Deploy target

The KVM 4 + Docker Compose topology you already specced: Caddy (80/443) → `web` (Next standalone) + `api` (FastAPI or Express — your call; the existing Express code can be wrapped, FastAPI is the cleaner long-term fit for the worker/scheduler split) + `worker` + `scheduler` + Postgres 16 + Redis. Encrypted `/data/reports` volume, nightly `pg_dump` + `age`-encrypted off-box backup, restore tested monthly.

**Migration decision to make consciously:** the existing Prisma schema is *patient-per-user* (consumer model). The MVP needs *patient-per-phone* with a dietician on the other side. Do **not** try to stretch the consumer schema into it. New tables, and let the consumer `User`/dashboard models sit unused until you actually need them.

**Target numbers at the end of phase 2:** all new patients onboard through WhatsApp automation; cousin's per-patient minutes down ≥40%; 11 paying patients cumulative; zero reports stored without consent.

---

## 6. Phase 3 — Content + SEO engine (Weeks 8–14: Nov 23 – Jan 10)

**Goal: 30 paying patients cumulative, and ≥25% of new leads from content — not from her phone book.**

### The five pages (not fifty)

Build exactly these, well, and interlink them:

```
/                     → free decoder CTA (the only job of the homepage)
/sugar-report-decoder → the offer + consent + WhatsApp button
/hba1c-explained      → "what does my number mean"
/can-i-eat-rice       → the Hyderabad food page (your moat)
/hyderabad-dietitian  → her credentials, what she reviews, what she won't do
/privacy              → lawyer-approved
```

Do **not** mass-produce location pages (`/dietitian-lbnagar` etc.) — Google treats that pattern as doorway abuse. Five genuinely useful pages beat fifty thin ones, and thin AI-written health pages are both a ranking risk and a trust risk.

### The content atom (one topic → seven assets)

| Day | Asset | Topic example: *rice + blood sugar* |
|---|---|---|
| Mon | Reel (15–30s) | "Can you eat rice if your sugar is high?" |
| Tue | Carousel | "5 mistakes people make with rice" |
| Wed | Blog post | /can-i-eat-rice |
| Thu | Story poll | "How many times a week do you eat rice?" |
| Fri | Practitioner reel | "How I decide rice portions for a patient" |
| Sat | WhatsApp status | "Confused by your report?" |
| Sun | Soft CTA | Free decoder |

Every asset ends with one CTA: **free report decoder**. Not "buy now" — healthcare does not convert on hard sells, and it burns the trust you spent weeks building.

### Content pillars (in priority order)

1. **"What does my report mean?"** — HbA1c 6.4, fasting 118, HbA1c vs fasting, why one reading isn't the story *(discovery engine)*
2. **"Can I still eat my normal food?"** — rice, idli vs dosa, chai, office lunch, biryani *(your differentiation — nobody else owns this)*
3. **"Why plans fail"** — the 7-day quit, family dinners, eating out *(conversion content)*
4. **Practitioner POV** — her on camera reviewing an anonymised report *(trust engine)*
5. **Real journeys** — only with written consent, only adherence stories, **never promised clinical outcomes**

**Messaging discipline:** say "clarity, adherence support, continuity". Do not say or imply "this will lower your HbA1c by X". Outcome claims you cannot substantiate are the fastest way to lose both trust and a platform account.

**Target numbers:** 10 reels/month, 2 blog posts/month, ≥25% of new patients from content/referral by week 14, 30 paying patients cumulative (≈₹18–25k cumulative revenue, ≈₹15–25k/month run-rate).

---

## 7. Phase 4 — Practitioners + clinic (Weeks 15–24)

**Goal: prove the model is not one woman's phone.** 60–80 patients, 3 dietician pilots, 1 clinic pilot.

### The dietician pitch (this is the real business)

> "It reads the report, prepares a draft, keeps the follow-up queue organised and sends the check-ins. You review and approve everything. Free for 30 days, then ₹2,999–5,999/month."

That is a materially easier sale than "buy my AI healthcare SaaS". You are selling *her afternoons back*.

### The clinic pitch

> "Your patients already generate these reports. We keep them engaged between visits and tell you who needs attention today."

Sell **continuity + follow-up**, not report reading.

**Structure clinic deals as the clinic paying for software/service — not as per-referral commissions to doctors.** Fee-splitting/referral-payment arrangements for registered medical practitioners are an ethics problem under NMC guidance; have the lawyer review any clinic commercial structure before the first pilot is signed. This one is worth the lawyer's fee.

### The build trigger for multi-practitioner

The moment pilot #2 signs, you need patient↔dietician assignment, per-practitioner queues and per-practitioner audit scoping. **Build it then, not now** — until then it's speculative complexity, and the single-practitioner version is what validates demand.

**Target numbers at week 24:** ~70 active patients, MRR ≈ ₹55–75k; 2–3 dietician subscriptions ≈ ₹12–18k; 1 clinic pilot ₹10–25k → **MRR ≈ ₹85k–1.1L**. Modest, honest, and built on revenue that already exists.

---

## 8. Unit economics (the math that decides pricing)

Per patient, first month. Cousin's time valued at ₹400/hr (opportunity cost — she can see private patients).

| | Free decode | 14-Day Reset | 30-Day Guided |
|---|---|---|---|
| Price | ₹0 | ₹299 (→₹499 after first 10) | ₹999 |
| Razorpay (2% + GST) | — | ≈ ₹7 | ≈ ₹24 |
| Gemini extraction | ≈ ₹1 | ≈ ₹1 | ≈ ₹2 |
| WhatsApp (utility msgs) | ₹0 | ≈ ₹1 | ≈ ₹3 |
| Cousin's minutes | 8–10 | 25 | 55 |
| Cousin's cost | ≈ ₹60 | ≈ ₹167 | ≈ ₹367 |
| **Contribution** | **−₹60** (marketing spend) | **≈ ₹125** | **≈ ₹605** |

**Three conclusions that fall straight out of this table:**

1. **The free decode is a ₹60 customer-acquisition cost.** That is *excellent* — but only if conversion is ≥20%. Track it weekly; if free→paid drops below 15%, the free tier is too generous (cap it at 2 decodes per number).
2. **₹299 is a conversion product, not a profit centre.** It exists to turn a stranger into someone who has paid you once. Do not put 55 minutes of her time into it. After the first 10, move it to ₹499.
3. **The 30-day guided tier is the business.** Price it at ₹999 while you have no reputation, ₹1,499 once you have 20 completed journeys. Do not launch a 90-day tier until 30-day completion data exists.

### Capacity ceiling (the number that forces phase 4)

30 paying patients × ~40 min/month average ≈ **20 hrs/month**. At ~60 active patients you are at ~40 hrs/month and she is effectively full-time with no slack for illness, festivals or her own patients. **~40 active patients is the hard ceiling for one practitioner.** This is why practitioner recruitment is a *capacity* decision, not a growth nicety.

---

## 9. What NOT to build (and what to do with what you already have)

| Don't build now | Why | When |
|---|---|---|
| Consumer dashboard (habits, coach, family, health score) | Your patient's app is WhatsApp. A dashboard nobody opens is pure cost | After 100 patients ask for it |
| Mobile app | WhatsApp already is the app | Never, probably |
| CGM / wearable integrations | Wrong customer, wrong problem | Phase 5+ |
| Dietitian marketplace | Two-sided cold-start | After 5 practitioners, not before |
| Clinic EMR / multi-tenancy | Enormous surface, one clinic pilot | After 2 paying clinics |
| Telugu strings | Premature localisation | After 30 patients, when the requests arrive |
| Custom ML model | Gemini + your verification loop is enough | When extraction accuracy <95% on your own dataset |
| Migrations framework (Alembic) | `create_all` is fine until real data exists | Before the first schema change with live data |

**Reuse from this repo, today:** `gemini.service.ts` (extraction), `rule-engine.service.ts` (bands + red flags), the `Report`/`ExtractedValue` half of the Prisma schema, and the frontend landing page. **Delete or ignore:** the consumer dashboard routes and mock auth. **Add:** Patient, Consent, Checkin, Flag, Message, Dietician models + the console.

---

## 10. Operating cadence (who does what, when)

| Rhythm | What | Who |
|---|---|---|
| **Daily, 20 min** | Console queue: reds first, then verify, then plans | Cousin |
| **Daily, 30 min** | WhatsApp replies + status post | Cousin |
| **Mon, 45 min** | Numbers review: the 12 metrics below + decide the week's one experiment | You + cousin |
| **Wed, 2 hrs** | Content batch for the week (1 reel, 1 carousel, 1 story) | You |
| **Fri, 30 min** | Free→paid conversion by channel; kill the worst channel | You + cousin |
| **Monthly** | Clinical review: every red flag, every escalation, every complaint | Cousin (sign-off) |
| **Monthly** | Restore-test the backup. An untested backup is not a backup | You |

---

## 11. The 12 numbers (weekly dashboard) + gates

**Track weekly, in one row:**

`conversations · reports received · free decodes · free→paid % · paying patients · revenue · cousin hrs/patient · check-in reply % · missed check-ins · red flags · escalations to doctor · source of each new patient`

### Go / no-go gates

| Gate | When | Go if | No-go action |
|---|---|---|---|
| **G1 — Demand** | Week 3 | ≥3 paying **or** ≥10 reports with people asking "what next" | Do not build. Re-run phase 1 with a sharper offer / different channel for 3 more weeks |
| **G2 — Bottleneck** | Week 7 | Cousin's minutes/patient down ≥40% and she confirms it | Do not add features. Fix the specific bottleneck or drop the feature |
| **G3 — Channel** | Week 14 | 30 paying **and** ≥25% of leads from content/referral | Content engine isn't working. Double down on the one channel that did convert, or stop scaling |
| **G4 — Model** | Week 24 | 1 dietician pilot converted to paid **or** 1 clinic pilot signed | The software is a cost centre. Revert to a manual agency and revisit |

---

## 12. Kill criteria (decide these now, while you're calm)

Stop and rethink if any of these is true at its gate:

1. **Free→paid conversion <10% after 30 free decodes.** The free tier is attracting the wrong people, or the offer is unclear. Fix the offer before touching the code.
2. **Cousin's minutes/patient do not fall after automation.** Then the bottleneck is clinical judgement, not workflow — and software cannot fix it.
3. **Check-in reply rate <40% by day 14.** The accountability loop isn't working, which means retention (and therefore the ₹999 tier) doesn't work. Nothing downstream survives this.
4. **Cousin does not want to scale.** Then this is a one-woman practice, not a platform — which is a perfectly good business, but a *different* plan (raise prices, stay at 40 patients, skip phases 3–4).

---

## 13. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Meta business verification stalls | Medium | Blocks everything WhatsApp | Start day 1; WhatsApp Business app as fallback for concierge |
| Patient sends an alarming report (HbA1c 12+, symptoms) | **High** | Safety + liability | Deterministic red flags in code + doctor-escalation copy + cousin trained on the SOP + emergency numbers verified (112, Tele-MANAS 14416) |
| AI reads a number wrong | **High** | Wrong advice to a patient | Confidence threshold + **human verification of every report** in phase 2; never auto-send an explanation below threshold |
| Cousin becomes the bottleneck / burns out | High | Business stops | Capacity ceiling tracked weekly; practitioner recruitment is a capacity decision, not a growth nicety |
| Health data breach / complaint | Low | Existential | Encrypt at rest, minimum data, audit log, access control, deletion SLA, breach-response plan, lawyer-reviewed notices |
| Razorpay/KYC or payment mismatch | Medium | Revenue + trust | Payment links first, webhook idempotency, mismatch → red flag to console |
| Patient misunderstands advice as medical instruction | Medium | Safety | Every explanation carries "only a doctor can diagnose"; no medication/dose language anywhere, ever |
| SEO/content yields nothing for 12 weeks | **High** (expected) | Pipeline stalls | Content starts week 1 but is *not* the week-8 pipeline; cousin's network carries weeks 1–8 |

---

## 14. Cost to run (₹/month)

| Item | Cost |
|---|---|
| KVM 4 (4 vCPU / 8 GB) | ₹1,200–2,000 |
| Domain (claritybs.in) | ₹100 (₹1,200/yr) |
| Cloudflare DNS + TLS | ₹0 |
| Gemini API (paid tier, ~50 reports/mo) | ≈ ₹50–100 |
| WhatsApp utility messages | ≈ ₹50–150 |
| Razorpay | 2% of revenue |
| Backups (age + rclone → R2) | ≈ ₹100–200 |
| **Fixed total** | **≈ ₹1,600–2,600/month** |
| Lawyer (one-time, phase 0) | ₹5,000–10,000 |

Break-even is **2 paying patients per month.** Everything above that is margin and cousin's time. This is a genuinely cheap business to run — which means the only real risk is spending your time on the wrong thing, which is what the gates above are for.

---

## 15. First 14 days, day by day

| Day | Date | Do this |
|---|---|---|
| 1 | Sep 29 | Start Meta Business verification. Start Razorpay KYC. Send the clinical sign-off pack to your cousin. Book the lawyer. |
| 2 | Sep 30 | Cousin drafts consent text + 3 plan templates. You write the tracking sheet. |
| 3 | Oct 1 | Cousin sends the personal ask to 10 people (existing patients + family). |
| 4 | Oct 2 | Create the two Razorpay payment links in the dashboard. Set up WhatsApp Business profile. |
| 5 | Oct 3 | Lawyer returns consent/privacy review. Cousin signs the clinical checklist. |
| 6–7 | Oct 4–5 | **First real report arrives.** Run the SOP exactly. Time every step. |
| 8 | Oct 6 | Post reel #1 ("What does HbA1c 6.4 mean?"). Update bio with the decoder CTA. |
| 9–10 | Oct 7–8 | Process every report that arrived. Record minutes per patient. |
| 11 | Oct 12 | First paying patient. Send the link, confirm the webhook *by hand*. |
| 12–13 | Oct 13–14 | Post reel #2 (rice). Ask each free-decode patient the qualifying question. |
| 14 | Oct 15 | **First numbers review.** Free→paid %. Minutes/patient. Write `BUILD_REQUESTS.md` from what was actually repetitive. Decide: is G1 in reach? |

---

## Appendix — companion files

- `patient-tracker.csv` — the sheet you fill in from day 6. One row per human.
- `clinical-signoff-checklist.md` — the phase-0 gate. Cousin initials it, lawyer initials the legal rows, *then* you take a real patient.

**The single sentence version:** unblock the slow things this week, sell it by hand for three weeks, build only what her stopwatch says is repetitive, then let content — not your cousin's phone book — bring the next 30 patients.
