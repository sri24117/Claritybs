export const metadata = { title: "Privacy — ClarityBS" };

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-6">
          <a href="/" className="text-xl font-bold tracking-tight">
            ClarityBS
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-14 text-slate-700">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy</h1>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          TEMPLATE — a lawyer must review this page (and the consent text and clinic terms) before
          any real patient is onboarded. India DPDP Act 2023 and the DPDP Rules 2025 apply.
        </p>
        <p>
          <b>What we collect:</b> your WhatsApp number, age, sex, weight, and the lab report you send
          us, plus the messages exchanged with our dietician.
        </p>
        <p>
          <b>Why:</b> to explain your report and provide dietician-guided nutrition support.
        </p>
        <p>
          <b>Who sees it:</b> our qualified dietician(s) and the technology providers we use to run
          the service (messaging, database and hosting). We do not sell your data.
        </p>
        <p>
          <b>How long we keep it:</b> only as long as needed for your programme, unless the law
          requires otherwise.
        </p>
        <p>
          <b>Your choices:</b> you can withdraw consent, or ask us to delete your data, by messaging
          us on WhatsApp. We erase your report, messages and profile, and keep only payment records
          we are required to retain.
        </p>
        <p>
          <b>Not medical advice:</b> educational support only — not diagnosis or treatment, and we
          never change any medicine.
        </p>
        <p>
          <b>Contact:</b> add your grievance officer / contact email here before launch.
        </p>
      </main>
    </div>
  );
}
