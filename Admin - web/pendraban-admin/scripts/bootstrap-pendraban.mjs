/**
 * Bootstrap Pendraban: enable Email/Password Auth, create admin, uses Firebase CLI login.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { argv } from "node:process";

const require = createRequire(import.meta.url);
const identityPlatform = require("firebase-tools/lib/gcp/identityPlatform");
const { Client } = require("firebase-tools/lib/apiv2");
const { identityOrigin } = require("firebase-tools/lib/api");
const { setRefreshToken, getGlobalDefaultAccount } = require("firebase-tools/lib/auth");

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "pendraban-pacs";
const AUTH_CONSOLE = `https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers`;
const __dir = dirname(fileURLToPath(import.meta.url));

function parseArgs(args) {
  const flags = new Map();
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith("--")) {
      positionals.push(a);
      continue;
    }
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
  }
  return { flags, positionals };
}

const { flags, positionals } = parseArgs(argv.slice(2));
const email = (flags.get("email") ?? positionals[0] ?? "admin@ppacs.com").trim().toLowerCase();
const password = flags.get("password") ?? positionals[1] ?? "Ppacs@Admin2026";
const skipBrowser = flags.has("no-browser");

if (password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

function initFirebaseCliAuth() {
  const account = getGlobalDefaultAccount();
  if (!account?.tokens?.refresh_token) {
    throw new Error("Run: firebase login");
  }
  setRefreshToken(account.tokens.refresh_token);
}

async function authEmailEnabled() {
  try {
    const cfg = await identityPlatform.getConfig(PROJECT_ID);
    return cfg?.signIn?.email?.enabled === true;
  } catch {
    return false;
  }
}

async function enableEmailPasswordViaApi() {
  const v2 = new Client({ urlPrefix: identityOrigin(), apiVersion: "v2", auth: true });
  try {
    await v2.post(`projects/${PROJECT_ID}/identityPlatform:initializeAuth`, {});
  } catch (e) {
    if (!String(e.message ?? e).includes("ALREADY_EXISTS")) {
      // Spark plan: initializeAuth often needs console — continue to updateConfig / wait loop.
    }
  }
  try {
    await identityPlatform.updateConfig(
      PROJECT_ID,
      { signIn: { email: { enabled: true, passwordRequired: true } } },
      "signIn.email.enabled,signIn.email.passwordRequired",
    );
    return true;
  } catch {
    return false;
  }
}

function openAuthConsole() {
  if (skipBrowser) return;
  console.log("\nOpening Firebase Console — enable Authentication:");
  console.log("  1. Click Get started (if shown)");
  console.log("  2. Open Email/Password → Enable → Save\n");
  spawn("cmd", ["/c", "start", "", AUTH_CONSOLE], { detached: true, stdio: "ignore" }).unref();
}

async function waitForAuth(maxMs = 180_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (await authEmailEnabled()) return true;
    await new Promise((r) => setTimeout(r, 4000));
    process.stdout.write(".");
  }
  return false;
}

async function getAdminSdk() {
  const { getAccessToken } = require("firebase-tools/lib/auth");
  const scopes = require("firebase-tools/lib/scopes");
  const account = getGlobalDefaultAccount();
  const tokens = await getAccessToken(account.tokens.refresh_token, [scopes.CLOUD_PLATFORM]);
  const userToken = tokens.access_token;

  const saList = await fetch(
    `https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts`,
    { headers: { Authorization: `Bearer ${userToken}` } },
  ).then((r) => r.json());
  const saEmail = (saList.accounts ?? []).find((a) => a.email?.startsWith("firebase-adminsdk"))?.email;
  if (!saEmail) throw new Error("firebase-adminsdk service account not found.");

  const keyRes = await fetch(
    `https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts/${encodeURIComponent(saEmail)}/keys`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        keyAlgorithm: "KEY_ALG_RSA_2048",
        privateKeyType: "TYPE_GOOGLE_CREDENTIALS_FILE",
      }),
    },
  );
  const key = await keyRes.json();
  if (!key.privateKeyData) throw new Error(JSON.stringify(key));
  await new Promise((r) => setTimeout(r, 5000));
  const keyJson = JSON.parse(Buffer.from(key.privateKeyData, "base64").toString("utf8"));
  const admin = (await import("firebase-admin")).default;
  for (const app of admin.apps) await app.delete();
  admin.initializeApp({ credential: admin.credential.cert(keyJson), projectId: PROJECT_ID });
  return admin;
}

async function createAdminProfile(admin) {
  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password, emailVerified: true });
    console.log("Updated Auth user:", user.uid);
  } catch (e) {
    if (String(e?.code ?? e).includes("user-not-found")) {
      user = await admin.auth().createUser({
        email,
        password,
        emailVerified: true,
        displayName: "Pendraban Admin",
      });
      console.log("Created Auth user:", user.uid);
    } else {
      throw e;
    }
  }

  await admin
    .firestore()
    .doc(`users/${user.uid}`)
    .set(
      {
        email,
        displayName: "Pendraban Admin",
        role: "admin",
        active: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  console.log("Firestore admin profile saved.");
}

async function main() {
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Admin: ${email}`);
  initFirebaseCliAuth();

  if (!(await authEmailEnabled())) {
    const viaApi = await enableEmailPasswordViaApi();
    if (!viaApi && !(await authEmailEnabled())) {
      openAuthConsole();
      console.log("Waiting for Email/Password to be enabled in Console");
      const ready = await waitForAuth();
      console.log("");
      if (!ready) {
        throw new Error(
          `Timed out. Enable Email/Password manually:\n${AUTH_CONSOLE}\nThen run: npm run bootstrap -- ${email} "${password}"`,
        );
      }
    }
  }
  console.log("Email/Password authentication is enabled.");

  const admin = await getAdminSdk();
  await createAdminProfile(admin);

  console.log("\nAdmin login:");
  console.log("  Email:", email);
  console.log("  Password:", password);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
