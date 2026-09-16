# Client FAQ — Pallavan Precision Works Production Docket System

---

## 1. What This Is and How to Run It

### What does this app do?
This is a tablet-friendly digital docket system for Pallavan Precision Works machine shop floor. It allows machine operators to log hourly production numbers, automatically validates the arithmetic, enforces quality rules, and lets shift supervisors review, approve, or return dockets before exporting the verified data to Excel.

### How do I run it locally from a clean clone?
Open your terminal in the extracted folder and run these four commands in order:

```bash
# 1. Install dependencies
npm install

# 2. Start the local Firebase emulators (keep this terminal open)
npm run emulators

# 3. In a second terminal window, seed the test accounts and machines (run once)
npm run seed

# 4. Start the frontend development server
npm run dev
```

- `npm install`: Downloads the required React, Vite, and Firebase libraries.
- `npm run emulators`: Launches local Firebase Auth and Firestore database emulators so you don't need a cloud setup or credit card.
- `npm run seed`: Populates the database with preset operator, supervisor, and manager accounts.
- `npm run dev`: Starts the local web server at `http://localhost:5173`.

### What are the test login credentials?

| Role | Email | Password | What they can and cannot do |
| :--- | :--- | :--- | :--- |
| **Operator** | `operator1@ppw.local`<br>`operator2@ppw.local` | `operator123` | **Can:** Create production dockets, edit own drafts and returned dockets, submit dockets for supervisor sign-off.<br>**Cannot:** Approve dockets, return dockets, edit approved entries, or view other operators' dockets. |
| **Supervisor** | `supervisor1@ppw.local`<br>`supervisor2@ppw.local` | `super123` | **Can:** View all shop-floor dockets across all machines and shifts, approve submitted dockets, return faulty dockets with a mandatory note, and export data to Excel.<br>**Cannot:** Create new production entries or edit operator numbers directly. |
| **Manager** | `manager1@ppw.local`<br>`manager2@ppw.local` | `manager123` | **Can:** Read-only access to all plant dockets across shifts and export data to Excel.<br>**Cannot:** Create, edit, submit, approve, or return dockets. |

*(Tip: On the login screen, clicking any email under "Quick Badge-In Preset" auto-fills the credentials.)*

### What if something doesn't work when running?
- **Login fails with a network or connection error**: The Firebase emulator is not running. Run `npm run emulators` in a separate terminal and wait until it logs that Authentication and Firestore are running before logging in.
- **Java error when running emulators**: The Firebase emulator requires Java Runtime Environment (JRE 11+). Verify by running `java -version`. If missing, install OpenJDK or Java via Homebrew (`brew install openjdk`) or your OS package manager.
- **Node version mismatch**: Ensure you are using Node.js 18 or higher (`node -v`).

---

## 2. How the Backend Works

### What is the backend and why was it chosen?
The backend uses **Firebase Auth** (for credentialed access and role claims) and **Cloud Firestore** (a NoSQL document database running locally via official emulators). It was chosen because:
1. **Built-in offline persistence:** Firestore natively caches documents in browser IndexedDB, queuing local changes and syncing automatically when connectivity returns.
2. **Real-time multi-terminal updates:** Supervisors see newly submitted dockets immediately without manual page refreshes.
3. **Database-level security rules:** Validation and role permissions are executed by the database engine itself rather than relying solely on UI frontend code.

### Where does data actually live and how are duplicates prevented?
Every production record lives as a document in the `entries` collection in Firestore. 

Each document is assigned a strict deterministic key combining station, date, shift, and hour slot:
`[MachineID]_[Date]_[Shift]_[HourSlotKey]` (e.g., `PPW-CNC-01_2026-09-14_A_06000700`).

Because a document ID is unique in Firestore, it is impossible for two records to exist for the same machine during the same hour slot. Any attempt to create a second entry for that slot targets the identical document path rather than creating a duplicate.

### How are permissions enforced?
Permissions are enforced directly in Firestore Security Rules (`firestore.rules`), not merely by hiding buttons in the web interface.
- If a rogue user or compromised browser script attempts to write to an entry marked `approved`, the database rejects the write.
- If an operator attempts to approve an entry, the database rejects it.
- If a supervisor attempts to return an entry without including a text remark, the database rejects it.
- If an entry contains a rejection percentage over 10% without remarks, the database blocks the save.

This guarantees data integrity even if someone inspects network calls or bypasses UI controls.

---

## 3. How the Business Logic Works

### What are the exact formulas for calculated fields?
- **Accepted Quantity**: `Produced Quantity - Rejected Quantity`.
- **Rejection Percentage**: `(Rejected Quantity / Produced Quantity) × 100`, rounded to one decimal place.
- **Achievement Percentage**: `(Accepted Quantity / Planned Quantity) × 100`, rounded to one decimal place.
- **Running Time**: `60 Minutes - Downtime Minutes`.

### How are edge cases handled?
- **Produced is 0**: Rejection percentage displays `0.0%` (not `NaN` or `Infinity`), because zero pieces were made, so nothing was rejected.
- **Planned is 0**: Achievement percentage displays `—` (a dash), because dividing by zero planned parts is mathematically undefined and indicates an uninitialized or maintenance slot.
- **Rejected equals Produced**: Accepted quantity is `0` and Rejection rate is `100.0%`. A rejection reason and remarks are mandatory.
- **Rejected exceeds Produced**: Blocked immediately by validation. You cannot reject more parts than were produced in that hour.
- **Downtime is 60 minutes**: Running time calculates to `0m`. A downtime reason is strictly required.
- **Downtime exceeds 60 minutes**: Blocked by validation. An hourly docket cannot log more than 60 minutes of downtime in a one-hour window.
- **Rejection percentage is exactly 10.0%**: Does not trigger the mandatory remark rule. The threshold rule applies strictly when rejection **exceeds** 10.0% (e.g. `10.1%` and above).
- **Shift C crossing midnight (22:00–06:00)**: All hours in Shift C belong to the shift's starting calendar date. An entry at 03:00 AM on Sept 15 for a shift that began at 22:00 PM on Sept 14 carries the production date `2026-09-14`.

### How does the approval flow work?
1. **Draft**: Operator creates the docket. Data is saved locally and synced to the database. The operator can edit numbers freely. Status is stamped `DRAFT`.
2. **Submit**: Operator finishes the hour and submits the docket. Status becomes `SUBMITTED` (amber stamp). The operator can no longer edit the entry.
3. **Approve**: Supervisor reviews the numbers. If arithmetic and counts are verified, supervisor clicks **Approve**. Status transitions to `APPROVED` (green stamp). The docket is permanently locked.
4. **Return**: If counts don't match or explanations are inadequate, supervisor clicks **Return Docket** and enters a mandatory inspection note. Status transitions to `RETURNED` (red stamp). The docket is unlocked for that operator to correct and resubmit.

Every transition records an immutable audit record in the entry's `statusHistory` array with the user's name, role, timestamp, and remark.

### How does offline work and what happens in a conflict?
- **Going offline**: If factory Wi-Fi drops, the operator can still enter dockets. Firestore saves them into the browser's local cache. The docket displays a stack-light dot with **"Waiting to sync"**.
- **Reconnecting**: When Wi-Fi reconnects, queued changes sync in the background and the indicator flips to **"Synced"** (green).
- **Conflict**: If an operator was offline and edited a draft, but in the meantime a supervisor on another terminal already approved or modified that specific slot, the database server rejects the outdated offline write to protect approved data. The local cache updates to reflect the server's approved version.

---

## 4. What Was and Wasn't Built

### What is fully working?
- [x] Complete hourly docket entry form with all slot fields, dropdowns, and tap-friendly controls.
- [x] Live shop arithmetic calculations (Accepted, Rejection %, Achievement %, Running time).
- [x] Strict input validation and mandatory reasons for rejections, downtime, and >10% scrap.
- [x] Full role-based authentication (Operator, Supervisor, Manager) enforced at both UI and database security rule layers.
- [x] Complete docket state machine: Draft → Submitted → Approved / Returned with audit trail.
- [x] Machine-shop docket physical design system (warm steel/paper palette, machined hairline rules, rubber status stamps, stack-light andon indicators, zero generic SaaS styling).
- [x] Filing-tab filter queue with real-time count badges.
- [x] Offline data persistence with per-docket sync status indicators.
- [x] Plant shift Excel export (`.xlsx`) with all verified production numbers and metrics.

### What was not attempted from the stretch section?
- **Digital canvas signature pad**: The spec listed supervisor digital signature as an optional stretch goal. We prioritized making the backend security rules bulletproof and the audit history tamper-proof rather than adding an unverified canvas drawing.
- **Analytics chart dashboards**: Aggregated multi-week trend graphs were deferred in favor of direct Excel export, which plant supervisors prefer for custom pivot tables and shift handovers.

### What would be built next given more time?
1. **Offline conflict resolution modal**: Rather than quietly rolling back an operator's rejected offline draft when a server collision occurs, show a side-by-side comparison modal allowing the operator to review differences.
2. **Push notifications / Andon alerts**: Audible or visual stack-light alerts on supervisor tablets whenever an operator submits a docket with >10% rejection or excessive downtime.
3. **Automated Firestore rule test suite**: A programmatic test harness using `@firebase/rules-unit-testing` to run CI regression tests against security rules.
