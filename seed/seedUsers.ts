/**
 * Seed script — creates auth users and Firestore user docs in the emulators.
 * Run once after starting emulators: npx tsx seed/seedUsers.ts
 *
 * Uses the Firebase Admin SDK via REST endpoints on the emulators
 * to avoid needing a service account or project credentials.
 */

const AUTH_EMULATOR = 'http://127.0.0.1:9099';
const FIRESTORE_EMULATOR = 'http://127.0.0.1:8080';
const PROJECT_ID = 'demo-ppw';

const USERS = [
  { email: 'operator1@ppw.local', password: 'operator123', displayName: 'Ravi Kumar', role: 'operator' },
  { email: 'operator2@ppw.local', password: 'operator123', displayName: 'Priya Sharma', role: 'operator' },
  { email: 'supervisor1@ppw.local', password: 'super123', displayName: 'Anand Raj', role: 'supervisor' },
  { email: 'supervisor2@ppw.local', password: 'super123', displayName: 'Meena Devi', role: 'supervisor' },
  { email: 'manager1@ppw.local', password: 'manager123', displayName: 'Vikram Singh', role: 'manager' },
  { email: 'manager2@ppw.local', password: 'manager123', displayName: 'Lakshmi Iyer', role: 'manager' },
];

async function clearAuth() {
  // Delete all auth accounts in the emulator
  await fetch(`${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' });
}

async function createAuthUser(email: string, password: string, displayName: string): Promise<string> {
  const res = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create auth user ${email}: ${text}`);
  }
  const data = await res.json();
  return data.localId;
}

async function createFirestoreDoc(collectionPath: string, docId: string, fields: Record<string, unknown>) {
  const firestoreFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string') {
      firestoreFields[key] = { stringValue: value };
    }
  }

  const url = `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionPath}/${docId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer owner', // bypasses security rules in emulator
    },
    body: JSON.stringify({ fields: firestoreFields }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create Firestore doc ${collectionPath}/${docId}: ${text}`);
  }
}

async function main() {
  console.log('Clearing existing auth users...');
  await clearAuth();

  console.log('Seeding users...\n');

  for (const user of USERS) {
    try {
      const uid = await createAuthUser(user.email, user.password, user.displayName);
      await createFirestoreDoc('users', uid, {
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      });
      console.log(`  ✓ ${user.role.padEnd(12)} ${user.email.padEnd(28)} (uid: ${uid})`);
    } catch (err) {
      console.error(`  ✗ Failed: ${user.email}`, err);
    }
  }

  console.log('\nDone. Users are ready in the emulators.');
  console.log('Credentials for testing:');
  console.log('  Operators:   operator1@ppw.local / operator123');
  console.log('  Supervisors: supervisor1@ppw.local / super123');
  console.log('  Managers:    manager1@ppw.local / manager123');
}

main().catch(console.error);
