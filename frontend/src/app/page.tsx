import type { Metadata } from "next";
import Link from "next/link";

const WA = process.env.NEXT_PUBLIC_WA_NUMBER || "91XXXXXXXXXX";
const DIET = process.env.NEXT_PUBLIC_DIETICIAN || "our dietician";
const waLink = `https://wa.me/${WA}?text=${encodeURIComponent(
  "Hi, I want my sugar report explained in simple language",
)}`;

export const metadata: Metadata = {
  title: "ClarityBS: your sugar report, explained in simple language",
  description:
    "Send your HbA1c, fasting and post-meal sugar numbers on WhatsApp. A dietician explains them in plain language and helps you build food habits that fit your life. Hyderabad food. No jargon.",
};

const steps = [
  "Send your report on WhatsApp",
  "We explain the numbers in plain language",
  "Get a food plan built around what you actually eat",
  "Stay on track with check-ins and dietician follow-up",
];

const plans = [
  {
    n: "Free report check",
    p: "₹0",
    f: ["HbA1c, fasting & post-meal explained", "Simple next steps", "Questions for your doctor"],
  },
  {
    n: "14-Day Sugar Reset",
    p: "₹299",
    f: ["Plan built on Hyderabad foods", "Rice, idli, chai guidance", "3 check-ins"],
  },
  {
    n: "30-Day Dietician Program",
    p: "₹999",
    f: ["Personalized, dietician-reviewed", "Weekly check-ins", "Adjustments as you go"],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold tracking-tight">
            ClarityBS
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
            <Link href="/privacy" className="hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/login" className="hover:text-slate-900">
              Dietician login
            </Link>
            <a href={waLink} className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
              Send my report
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-20">
          <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight">
            Confused by your sugar report?
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-600">
            Send your HbA1c, fasting and post-meal numbers on WhatsApp. We explain what they mean in
            simple language, reviewed by {DIET}. Hyderabad food. No jargon. No diagnosis.
          </p>
          <a
            href={waLink}
            className="mt-8 inline-block rounded-full bg-emerald-600 px-8 py-4 text-lg font-semibold text-white hover:bg-emerald-700"
          >
            Send my report on WhatsApp →
          </a>
          <p className="mt-4 text-sm text-slate-500">
            Free. No card needed. Reply STOP any time to delete your data.
          </p>
        </section>

        <section className="border-t border-slate-100 py-16">
          <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {steps.map((s, i) => (
              <div key={s} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <b className="text-emerald-600">{i + 1}.</b> {s}
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-100 py-16">
          <h2 className="text-2xl font-bold tracking-tight">Simple pricing</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {plans.map((x) => (
              <div key={x.n} className="rounded-2xl border border-slate-100 p-6">
                <h3 className="font-semibold">{x.n}</h3>
                <div className="my-3 text-3xl font-bold text-emerald-600">{x.p}</div>
                <ul className="space-y-2 text-sm text-slate-600">
                  {x.f.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-100 py-16 text-sm leading-relaxed text-slate-500">
          <p>
            ClarityBS provides educational nutrition support. It is not a diagnosis or treatment, and
            it does not change any medicine — that is always your doctor&apos;s decision. If you feel
            unwell, contact your doctor or call 112. Your data is used only to help you, and you can
            ask us to delete it at any time. See our <Link href="/privacy" className="underline">Privacy</Link>{" "}
            notice.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-10 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} ClarityBS · Hyderabad · Dietician-led, safety-first
      </footer>
    </div>
  );
}
