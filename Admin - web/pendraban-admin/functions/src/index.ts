import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

const REGION = "us-central1";

async function requireCallerAdmin(uid: string): Promise<void> {
  const snap = await admin.firestore().doc(`users/${uid}`).get();
  if (!snap.exists) throw new HttpsError("permission-denied", "No user profile.");
  if (snap.get("role") !== "admin") {
    throw new HttpsError("permission-denied", "Administrators only.");
  }
  if (snap.get("active") === false) {
    throw new HttpsError("permission-denied", "Account deactivated.");
  }
}

type CreatePayload = {
  email?: string;
  password?: string;
  displayName?: string | null;
  role?: string;
};

export const adminCreateUser = onCall({ region: REGION }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  await requireCallerAdmin(request.auth.uid);

  const body = request.data as CreatePayload;
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const role = String(body.role ?? "client").toLowerCase() === "admin" ? "admin" : "client";

  const dn = body.displayName;
  let displayName: string | null;
  if (dn == null) displayName = null;
  else if (typeof dn === "string") displayName = dn.trim() || null;
  else displayName = null;

  if (!email) throw new HttpsError("invalid-argument", "Email required.");
  if (password.length < 6) {
    throw new HttpsError("invalid-argument", "Password must be at least 6 characters.");
  }

  let uid = "";
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName ?? undefined,
    });
    uid = userRecord.uid;
    await admin.firestore().doc(`users/${userRecord.uid}`).set({
      email,
      displayName,
      role,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { uid: userRecord.uid };
  } catch (e: unknown) {
    if (uid) {
      await admin.auth().deleteUser(uid).catch((err2) => logger.warn("Rollback deleteUser failed", err2));
    }
    const code =
      typeof e === "object" && e !== null && "code" in e ? String((e as { code: string }).code) : "";
    if (code.includes("email-already-exists")) {
      throw new HttpsError("already-exists", "Email already registered.");
    }
    logger.error("adminCreateUser error", e);
    throw new HttpsError("internal", "Could not create user.");
  }
});

export const adminDeleteUser = onCall({ region: REGION }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  await requireCallerAdmin(request.auth.uid);

  const body = request.data as { uid?: string };
  const targetUid = String(body.uid ?? "");
  if (!targetUid) {
    throw new HttpsError("invalid-argument", "Missing uid.");
  }
  if (targetUid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "You cannot delete your own account.");
  }

  try {
    await admin.firestore().doc(`users/${targetUid}`).delete();
  } catch (e) {
    logger.warn("adminDeleteUser: firestore doc delete failed (continuing)", e);
  }

  try {
    await admin.auth().deleteUser(targetUid);
  } catch (e: unknown) {
    const code =
      typeof e === "object" && e !== null && "code" in e ? String((e as { code: string }).code) : "";
    if (!code.includes("user-not-found")) {
      logger.error("adminDeleteUser: auth delete failed", e);
      throw new HttpsError("internal", "Could not delete auth user.");
    }
  }

  return { ok: true as const };
});
