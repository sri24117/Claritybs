/**
 * Create (or reset) the dietician login.
 * Usage: npm run seed -- email "Name" password ["Qualification"] ["RegNo"]
 */
import { db, dbClose } from "../src/store";
import { hashPassword } from "../src/lib/password";

async function main() {
  const [email, name, pw, qual, reg] = process.argv.slice(2);
  if (!email || !name || !pw) {
    console.error('usage: npm run seed -- email "Name" password ["Qualification"] ["RegNo"]');
    process.exit(1);
  }
  const u = await db.Dietician.upsert({
    where: { email: email.toLowerCase() },
    update: { name, passwordHash: hashPassword(pw), qualification: qual, registrationNo: reg },
    create: {
      email: email.toLowerCase(),
      name,
      passwordHash: hashPassword(pw),
      qualification: qual ?? null,
      registrationNo: reg ?? null,
    },
  });
  console.log(`dietician ready: ${u.email} (${u.name})`);
  await dbClose();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
