# Phase-0 Gate: Clinical & Legal Sign-off

**No real patient until every row below is signed.** The codebase marks its safety
thresholds and templates as placeholders specifically because they require a
qualified human to own them. This checklist is that handover.

- **Patient-facing legal sign-off (lawyer):** consent text, privacy page, clinic terms,
  WhatsApp consent flow, disclaimer wording.
- **Clinical sign-off (dietician):** red-flag thresholds, escalation SOP, scope of
  practice, plan templates.

| # | Item | Owner | Sign-off | Date |
|---|---|---|---|---|
| **A. Clinical safety rules** | | | | |
| A1 | Red-flag thresholds reviewed and accepted (HbA1c ≥10%, FBS ≥300, PPBS ≥400, any glucose <70) — or amended to her clinical judgement | Dietician | ☐ initials | |
| A2 | Plausibility bands reviewed (HbA1c 3–20, FBS 30–600, PPBS 30–800) — values outside are never auto-explained | Dietician | ☐ initials | |
| A3 | Symptom keyword list reviewed (chest pain, breathless, vomiting, unconsciousness…) | Dietician | ☐ initials | |
| A4 | Self-harm keyword list reviewed + Tele-MANAS 14416 and emergency 112 **verified as current** | Dietician | ☐ initials | |
| A5 | Medication/dose blocklist reviewed (metformin, insulin, glimepiride, sitagliptin, empagliflozin, mg, tablets, "stop taking"…) | Dietician | ☐ initials | |
| A6 | Escalation SOP written: which values → "see your doctor today", which → "go to hospital now", who she calls, how fast | Dietician | ☐ initials | |
| A7 | Scope statement written and displayed: she explains numbers and suggests food; she does **not** diagnose, treat, or change any medication | Dietician | ☐ initials | |
| **B. Plan templates** | | | | |
| B1 | `api/templates/base.md` placeholder replaced with her own Hyderabad templates (breakfast, rice, chai, office lunch, weekend/festival, movement) | Dietician | ☐ initials | |
| B2 | Every template checked for: no diagnosis, no medication/supplement/dose advice, ends with "discuss this with your doctor" | Dietician | ☐ initials | |
| B3 | 18+ only — minors are redirected to a parent/guardian and a doctor | Dietician | ☐ initials | |
| **C. Credentials & trust** | | | | |
| C1 | Qualification + registration number (IDA / state registry) verified and displayed on the site and WhatsApp profile | You | ☐ | |
| C2 | No "doctor-backed" or outcome-promising language anywhere unless a named medical professional relationship actually exists | You | ☐ | |
| **D. Legal & data (DPDP)** | | | | |
| D1 | Consent notice states what is collected, why, who sees it, how long it's kept, and how to withdraw | Lawyer | ☐ initials | |
| D2 | Privacy page reviewed and published (what / why / who / choices / not-medical-advice / grievance contact) | Lawyer | ☐ initials | |
| D3 | Clinic/practitioner terms reviewed — **no per-referral commission to doctors**; any clinic deal structured as a software/service fee (NMC ethics) | Lawyer | ☐ initials | |
| D4 | Deletion workflow tested end-to-end (files + rows erased, payment records retained) | You | ☐ | |
| D5 | Audit logging verified: every view / edit / send / erase records actor, action, entity, timestamp | You | ☐ | |
| D6 | Report files encrypted at rest; decryption only on authenticated, audited view | You | ☐ | |
| D7 | Retention period decided and documented; breach-response contact named | Lawyer + You | ☐ | |
| **E. Payments** | | | | |
| E1 | Razorpay KYC complete; ₹299 and ₹999 payment links created and **test-paid** end-to-end | You | ☐ | |
| E2 | Webhook signature verification + idempotency (duplicate payment events ignored) | You | ☐ | |
| E3 | Payment-mismatch path raises a red flag in the console, never a silent success | You | ☐ | |

**Signed:** Dietician ____________________  Lawyer ____________________  Founder ____________________  Date ____________

*Gate rule: if A1–A7 or D1–D3 are unsigned, you may demo the product but you may not
store a real patient's report.*
