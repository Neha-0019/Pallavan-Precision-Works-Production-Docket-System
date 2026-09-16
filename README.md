# Pallavan Precision Works — Shift Production Entry System

Internal tool for recording and approving hourly machine production output. Built for ApexFlow Technologies' Manufacturing Systems Programme.

Replaces a paper-based process where operators fill printed sheets, supervisors check arithmetic by hand, and management sees numbers days later.

## Quick Start

You need Node.js 18+ and Java (for Firebase emulators).

```bash
# 1. Install dependencies
npm install

# 2. Start Firebase emulators (Auth + Firestore) — keep this running
npm run emulators

# 3. In a new terminal, seed the test users (run once)
npm run seed

# 4. Start the dev server
npm run dev
```

Open http://localhost:5173 in your browser. (To customize connection parameters, copy `.env.example` to `.env` if desired; default settings automatically connect to local emulators.)

See `CLIENT_FAQ.md` for client questions, formulas, and operational flow details.

**If login fails with a connection error**, the Firebase emulators aren't running. Go back to step 2.

The Firebase Emulator UI is available at http://localhost:4000 — useful for inspecting Firestore documents and auth users directly.

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Operator | `operator1@ppw.local` | `operator123` |
| Operator | `operator2@ppw.local` | `operator123` |
| Supervisor | `supervisor1@ppw.local` | `super123` |
| Supervisor | `supervisor2@ppw.local` | `super123` |
| Manager | `manager1@ppw.local` | `manager123` |
| Manager | `manager2@ppw.local` | `manager123` |

## What Each Role Can Do

- **Operators**: Create production entries, edit their own drafts and returned entries, submit entries for approval. See only their own entries. Sync indicator shows whether entries have been uploaded.
- **Supervisors**: See all entries across all operators. Approve submitted entries, or return them with a mandatory remark. Cannot create entries. Can export to Excel.
- **Managers**: Read-only view of all entries. Can export to Excel.

## Tech Stack

- React + TypeScript + Vite
- Firebase Auth + Firestore (emulator-only — no cloud project needed)
- xlsx for Excel export
- No component library — custom CSS for factory-floor tablet use

## Deployment

No deployed link. This runs locally against Firebase emulators. Deploying to a live Firebase project is straightforward but wasn't in scope — you'd swap the Firebase config in `src/firebase.ts` and deploy Firestore security rules with `firebase deploy --only firestore:rules`.
