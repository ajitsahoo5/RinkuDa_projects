/**
 * One-time: create Firebase Auth user + Firestore `users/{uid}` as admin.
 *
 * Prereqs:
 * 1)Firebase Console → Authentication → enable Email/Password
 * 2) Service account JSON (Firebase Console → Project settings → Service accounts → Generate new private key)
 *    OR `gcloud auth application-default login`
 *
 * Usage (PowerShell):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
 *
 * Prefer positional args with `npm run` (npm 10+ may strip --email/--password as npm flags):
 *   npm run seed-admin -- you@example.com "yourPassword6+"
 *
 * Or invoke node directly so --flags reach the script:
 *   node scripts/seed-admin.mjs --email you@example.com --password "yourPassword6+"
 *
 * Env only:
 *   $env:ADMIN_EMAIL="you@example.com"
 *   $env:ADMIN_PASSWORD="yourPassword6+"
 *   npm run seed-admin
 */
import admin from "firebase-admin";
import { argv } from "node:process";

/** Parses argv after script path: --key value / --key=value + leftover positionals */
function parseArgs(args) {
  const flags = new Map();
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--") continue;
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) {
        flags.set(a.slice(2, eq), a.slice(eq + 1));
        continue;
      }
      const key = a.slice(2);
      const next = args[i + 1];
      if (next != null && !next.startsWith("--")) {
        flags.set(key, next);
        i++;
      } else {
        flags.set(key, "");
      }
    } else {
      positionals.push(a);
    }
  }
  return { flags, positionals };
}

const cliArgs = argv.slice(2);
const { flags, positionals } = parseArgs(cliArgs);

const email = (
  flags.get("email") ??
  positionals[0] ??
  process.env.ADMIN_EMAIL ??
  ""
)
  .trim()
  .toLowerCase();
const password = flags.get("password") ?? positionals[1] ?? process.env.ADMIN_PASSWORD ?? "";
const displayName = (flags.get("name") ?? process.env.ADMIN_DISPLAY_NAME ?? "").trim() || null;

if (!email) {
  console.error(
    "Missing email. Examples:\n" +
      '  npm run seed-admin -- you@example.com "yourPassword"\n' +
      "  node scripts/seed-admin.mjs --email you@example.com --password yourPassword\n" +
      "  $env:ADMIN_EMAIL / $env:ADMIN_PASSWORD then npm run seed-admin",
  );
  process.exit(1);
}
if (password.length < 6) {
  console.error("Password must be at least 6 characters (Firebase rule).");
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "Set GOOGLE_APPLICATION_CREDENTIALS to the path of your Firebase service-account JSON file.",
  );
  console.error("See Firebase Console → Project settings → Service accounts.");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

let user;
try {
  user = await admin.auth().getUserByEmail(email);
  console.log("Auth user already exists:", user.uid);
} catch (e) {
  if (typeof e === "object" && e && "code" in e && String(e.code).includes("user-not-found")) {
    user = await admin.auth().createUser({
      email,
      password,
      displayName: displayName ?? undefined,
    });
    console.log("Created Firebase Auth user:", user.uid);
  } else {
    console.error("Auth error:", e);
    process.exit(1);
  }
}

const uid = user.uid;
const ref = admin.firestore().doc(`users/${uid}`);
const existing = await ref.get();
if (existing.exists) {
  console.log("Updating existing Firestore profile to admin + active…");
  await ref.set(
    {
      email,
      displayName: displayName ?? user.displayName ?? null,
      role: "admin",
      active: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
} else {
  await ref.set({
    email,
    displayName: displayName ?? user.displayName ?? null,
    role: "admin",
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("Created Firestore users/", uid);
}

console.log("\nDone. Sign in to the dashboard with:");
console.log("  Email:", email);
console.log("  Password: (the one you passed in)\n");
