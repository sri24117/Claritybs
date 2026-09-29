# ClarityBS

WhatsApp is the patient app. A small dark console is the dietician app.
Everything runs on one KVM via Docker Compose.

```
claritybs/
├─ docker-compose.yml      caddy + web + api + worker + postgres
├─ Caddyfile               claritybs.in -> web, api.claritybs.in/{wa,pay} -> api
├─ .env.example            every key the app reads
├─ scripts/
│  ├─ harden.sh            firewall, ssh, fail2ban (run FIRST, after adding your SSH key)
│  └─ backup.sh            nightly age-encrypted pg_dump + reports to object storage
├─ backend/                Express + Postgres: WhatsApp flow, rules, LLM, console API
│  ├─ Dockerfile
│  ├─ schema.sql           the whole database, idempotent, no ORM needed
│  ├─ templates/base.md    the dietician edits this
│  └─ src/
│     ├─ config.ts         env + simulation flags
│     ├─ store.ts          tiny typed data layer over pg
│     ├─ services/         rules.ts (safety), llm.service.ts, whatsapp.service.ts, payments.service.ts
│     ├─ flows/            patient.flow.ts, report.flow.ts, plan.flow.ts
│     ├─ jobs/scheduler.ts check-in sender (worker container)
│     ├─ routes/           auth, wa, pay, console
│     └─ lib/              crypto (encrypted files), password (scrypt), jwt, audit
├─ frontend/               Next.js: landing, login, console, patient view, WhatsApp simulator
└─ docs/                   0-to-1 plan, patient tracker, clinical sign-off gate
```

## Run it locally in 3 minutes (no API keys)

```bash
# 1. backend
cd backend
cp ../.env.example .env          # then set DATABASE_URL to any Postgres
npm install
npm run db:init                  # applies schema.sql
npm run seed -- you@example.com "Dt. Name" 'your-password'
npm run dev                      # http://localhost:5000

# 2. frontend (new terminal)
cd frontend
npm install
echo "API_INTERNAL_URL=http://localhost:5000" > .env.local
npm run dev                      # http://localhost:3000
```

Then open **http://localhost:3000/sim**, log in with the dietician you just created, and
drive the whole product as a patient: `Hi` → `yes` → `45 M 72` → `HbA1c 6.4, FBS 118, PPBS 165`
→ `plan` → settle the simulated payment → verify the report → approve the plan.

### Verify the whole thing with one command

```bash
cd backend && npm run smoke        # 32 checks: consent -> report -> verify -> pay -> plan -> flag -> erase
```

The worker (check-in sender) runs with `npm run worker`; in Docker it is the `worker` service.

## Simulation mode (this is the prototype)

The app detects missing credentials and degrades safely instead of failing:

| Missing key | What happens |
|---|---|
| `WA_TOKEN` | Inbound messages run the real flow; replies are logged to the conversation instead of sent. `/sim` and `/wa/webhook` still work. |
| `GEMINI_API_KEY` | Extraction returns a clearly-marked simulated result at confidence 0.55, so every report lands in the dietician's **verify** queue — exactly the safety behaviour you want. Plan drafts fall back to `templates/base.md`. |
| `RAZORPAY_KEY_ID` | Payment links point at a local `/sim/pay/:linkId` page with a "Simulate payment" button that runs the same settlement path as the real `payment_link.paid` webhook. `/pay/sim/settle` also works from the console. |

Add the real keys to `.env`, restart, and the same code paths go live. No code changes.

## Deploy on the KVM (10 steps)

```bash
# 1. Add your SSH public key FIRST, then:
sudo bash scripts/harden.sh
curl -fsSL https://get.docker.com | sh

# 2. Cloudflare DNS: A records -> KVM IP for @, www, app, api (grey cloud to start)

# 3. Code
sudo mkdir -p /opt/claritybs /data/reports && cd /opt/claritybs
cp .env.example .env

# 4. Generate secrets and paste into .env
python3 -c "import secrets;print(secrets.token_urlsafe(48))"          # JWT_SECRET
python3 -c "import secrets;print(secrets.token_urlsafe(48))"          # FILE_KEY

# 5. Build and start
docker compose up -d --build

# 6. Create the dietician login
docker compose exec api npx tsx scripts/seed.ts you@example.com "Dt. Name" 'strong-password'

# 7. Meta: WhatsApp Cloud API
#    Webhook URL : https://api.claritybs.in/wa/webhook
#    Verify token: WA_VERIFY_TOKEN from .env
#    Subscribe to: messages
#    Put WA_TOKEN, WA_PHONE_ID, WA_APP_SECRET in .env
#    Create a UTILITY template named checkin_reminder (lang: en), body:
#    "Hi {{1}}, quick check-in from ClarityBS: how are you getting on? Reply here."

# 8. Razorpay: add key id/secret to .env
#    Webhook URL: https://api.claritybs.in/pay/razorpay
#    Event: payment_link.paid — put the webhook secret in .env

# 9. Restart after editing .env
docker compose up -d

# 10. Test: WhatsApp "Hi" to your number from your phone, then open https://app.claritybs.in/console
```

Nightly backups: `sudo crontab -e` →
`30 2 * * * /opt/claritybs/scripts/backup.sh >> /var/log/claritybs-backup.log 2>&1`

## Before real patients

`docs/clinical-signoff-checklist.md` is a gate, not a suggestion. The dietician signs the
thresholds in `backend/src/services/rules.ts` and the templates in
`backend/templates/base.md`; a lawyer reviews the consent text, the privacy page and the clinic
terms. Thresholds are placeholders until then.

## Known limits (MVP, on purpose)

| Limit | Fix when |
|---|---|
| One dietician pool, no per-dietician patient assignment | 2nd dietician joins |
| `schema.sql` instead of migrations | Before schema changes with real data |
| No CSRF token (SameSite=Lax + JSON-only) | Before opening the console to clinics |
| Approved plan outside the 24h window waits for the patient's reply | Add an approved plan-ready template |
| Single KVM, no HA | First paying clinic |
| Report images sent to the LLM contain patient names | Name-redaction before clinic pilots |
| English only | After 30 patients, add Telugu strings |
