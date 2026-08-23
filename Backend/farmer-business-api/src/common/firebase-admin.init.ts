import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

/** Initialize Firebase Admin from service-account JSON path or inline env vars. */
export function initFirebaseAdmin(config: ConfigService): boolean {
  if (admin.apps.length) return true;

  const projectId = config.get<string>('FIREBASE_PROJECT_ID')?.trim();
  const credentialsPath =
    config.get<string>('GOOGLE_APPLICATION_CREDENTIALS')?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (credentialsPath) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      ...(projectId ? { projectId } : {}),
    });
    return true;
  }

  const clientEmail = config.get<string>('FIREBASE_CLIENT_EMAIL')?.trim();
  const privateKey = config
    .get<string>('FIREBASE_PRIVATE_KEY')
    ?.replace(/\\n/g, '\n')
    .trim();

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    return true;
  }

  const serviceAccountJson = config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON')?.trim();
  if (serviceAccountJson) {
    const parsed = JSON.parse(serviceAccountJson) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId ?? parsed.project_id ?? '',
        clientEmail: parsed.client_email ?? '',
        privateKey: (parsed.private_key ?? '').replace(/\\n/g, '\n'),
      }),
    });
    return true;
  }

  return false;
}
