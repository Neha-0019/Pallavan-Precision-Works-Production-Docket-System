# Technical Note

I'm the engineer who built this. Here's what I did, what I didn't do, and where the bodies are buried.

## What Was Built

The complete core: shift production entry form with all fields and validation, live calculated fields, role-based access enforced at the Firestore rules layer (not just UI), the full approval chain (Draft → Submitted → Approved, with a Returned branch), offline persistence via Firestore's IndexedDB cache, sync status indicators, and Excel export. Everything from Sections 3–9 of the spec.

Stretch items (Section 10) were not attempted. The core is solid and I'd rather ship that than bolt on a half-baked signature pad.

## Stack Choice

React + TypeScript + Vite with Firebase Auth and Firestore. This is what the spec asked for and it's what I'm fastest in. Vite because CRA is dead. No component library — the UI is custom CSS tuned for a machine-shop environment (dark theme, high contrast, 48px minimum tap targets for operators in work gloves).

I chose a responsive web app over React Native. The spec mentions RN as a preference but describes a web deliverable. A tablet-optimized web app covers the use case without the overhead of native builds and Xcode/Android Studio.

## Assumptions Made Where the Spec Was Silent

### Division by Zero
- **Produced = 0**: Rejection percentage is 0.0%, not NaN or Infinity. You can't have rejections if you produced nothing.
- **Planned = 0**: Achievement percentage displays "—" rather than a number. Dividing by zero planned is meaningless — if someone enters 0 planned, it's probably a mistake but I'm not going to show them Infinity%.

### Rounding
`Math.round(value * 10) / 10` — standard round-half-up to one decimal. So 10.05% rounds to 10.1%, which would trigger the mandatory-remark rule.

### The 10% Rejection Threshold
"Exceeds 10%" means strictly greater than 10.0%. An entry with exactly 10.0% rejection does not require a remark. I read "> 10%" as "> 10.0%". If the client meant ≥ 10%, that's a one-character change in two places.

### Shift C and Midnight
Shift C (22:00–06:00) crosses midnight. The entry date belongs to the date the shift *started*, not when the hour slot occurs. So a 02:00–03:00 entry during a Shift C that started on Sept 14 carries the date 2024-09-14. This is the standard convention in manufacturing.

### Returned Entry Flow
When a supervisor returns an entry, its status becomes "returned." When the operator edits it, the status resets to "draft." The operator can also submit directly from "returned" without editing (the status transitions returned → submitted). Both paths are allowed by the Firestore rules. Every transition is recorded in the `statusHistory` array with actor, timestamp, and remark.

### Export Format
Excel over PDF. Production data is tabular — supervisors will want to sort and filter it, not just look at it. A `.xlsx` file with all calculated fields and approval status is more useful than a fixed-layout PDF.

### Rejection Reason Constraint
The six rejection reasons from the spec (Dimensional, Surface finish, Burr, Material defect, Setup error, Other) are enforced as an enum both in the UI dropdown and in the Firestore security rules. You cannot write a free-form reason even via direct API access.

## Offline Conflict Resolution

This is the hardest part of the spec and deserves honest treatment.

### What Works
Firestore's IndexedDB persistence handles the basic case: operator goes offline, creates entries, comes back online, entries sync automatically. The `hasPendingWrites` flag from Firestore snapshot metadata drives the per-entry sync indicator — a persistent visual flag, not a toast.

### The Dangerous Case: Offline Draft vs. Already-Approved Entry
Document IDs are deterministic (machine_date_shift_hourSlot), which makes uniqueness structural. But it also means an offline write targets the same document ID as an entry that may have been submitted or approved while the operator was offline.

The Firestore security rules block this: an operator can only write to a document whose current status is "draft" or "returned." If the entry was submitted or approved in the meantime, the server rejects the offline write. The Firestore SDK rolls back the optimistic local write, and the entry list shows the server's version. The operator's local input disappears — they haven't lost the data (it's in form state in memory), but they need to talk to their supervisor about the conflict.

### What I Didn't Build
A merge/diff UI that shows "your version vs. server version" when a conflict occurs. That's a real feature that would take several hours on its own — detecting the rollback, preserving the local state, presenting both versions, and letting the operator choose. Worth doing given another week.

### Two Drafts from Two Devices
If two operators create entries for the same slot while both are offline, it's last-write-wins on the same document ID. The losing write is silently overwritten. This is acceptable for drafts — no approved data is lost. In practice, this should be rare because operators are assigned to specific machines, but it's a real gap.

## What's Weak

1. **The offline conflict UX is abrupt.** When a pending write gets rejected by the server, the entry just disappears from the operator's list. There's no "hey, this slot was already taken" message that persists. The operator has to notice the entry is gone and infer what happened. A proper conflict notification system would fix this.

2. **No data export for the full audit trail.** The Excel export shows the current status of each entry, but not the full `statusHistory`. A supervisor can see who approved what in the app, but can't export that history. Adding a second sheet to the workbook with the audit trail would be an easy win.

3. **Emulator-only setup means no data persists between restarts** (unless you use `--export-on-exit` and `--import`, which the npm script does support). For a real deployment, you'd point at a live Firebase project.

4. **No automated tests.** Under the 10-14 hour budget, I chose to spend the time on the Firestore security rules (which are the real validation layer) rather than writing unit tests for the client-side validation that duplicates those rules. The rules themselves are tested manually through the emulator. Given another week, I'd add a security rules test suite using the Firebase rules testing library.

## What Would Change Given Another Week

1. A proper conflict resolution UI for offline sync failures.
2. Firestore security rules unit tests using `@firebase/rules-unit-testing`.
3. The stretch items: digital supervisor signature on approval, and a summary dashboard showing rejection rates by machine and by part over a date range.
4. Audit trail export in the Excel file.
5. Push notifications (or at minimum, a badge/counter) for supervisors when new entries are submitted.

## Deployed Link

Not included. The app runs locally against Firebase emulators. Deploying to a live Firebase project is straightforward (swap the config, deploy rules, create auth users in the console) but doesn't add assessment value for a tool that's meant to run on a factory-floor tablet connected to a local network.
