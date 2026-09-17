# Technical Note — Pallavan Precision Works Production Docket System

**Author:** Neha Panbude  
**Programme:** ApexFlow Technologies Manufacturing Systems Programme  
**Project:** Pallavan Precision Works (PPW) — Shift Production Entry & Approval System  

---

## 1. What Was Built

### Core Architecture & Tech Stack
- **Frontend:** Built with **React 19**, **TypeScript**, and **Vite**, designed as a tablet-first, glove-friendly PWA interface (dark-mode industrial aesthetic, 48px minimum touch targets, high-contrast typography).
- **Backend & Database:** **Firebase Authentication** (custom claims and role-based personas) paired with **Cloud Firestore** running entirely on local emulators (`demo-ppw`) for offline development without cloud credentials.
- **Export Utility:** Client-side **SheetJS (`xlsx`)** workbook generation for structured manufacturing reporting.

### Functional Scope (Sections 3–9 of the Specification)
1. **Shift Production Entry:** Hourly production recording parameterized by Date, Shift (A, B, C), Hour Slot, Machine ID (`PPW-CNC-01` through `PPW-GRIND-05`), and Part Number (`PN-4471-A` through `PN-2256`).
2. **Deterministic Uniqueness:** Structural document keys (`${machineId}_${date}_${shift}_${hourSlotKey}`) preventing duplicate dockets for identical machine bays and slots.
3. **Live Shop Arithmetic Engine:** Real-time formula computation:
   - $\text{Accepted Qty} = \text{Produced Qty} - \text{Rejected Qty}$
   - $\text{Rejection Rate (\%)} = (\text{Rejected Qty} / \text{Produced Qty}) \times 100$
   - $\text{Achievement Rate (\%)} = (\text{Accepted Qty} / \text{Planned Qty}) \times 100$
   - $\text{Running Time (min)} = 60 - \text{Downtime Minutes}$
4. **Enforced Quality Rules:**
   - Mandatory rejection reason dropdown when $\text{Rejected} > 0$.
   - Mandatory downtime explanation when $\text{Downtime} > 0$.
   - Boundary-triggered inline amber caution alerts and database-enforced mandatory remarks whenever rejection strictly exceeds $10.0\%$.
5. **State Machine & Lifecycle Pipeline:**
   - Four discrete states: `draft` $\rightarrow$ `submitted` $\rightarrow$ `approved` / `returned`.
   - Immutable audit logging on every state change (`statusHistory` array tracking UID, display name, timestamp, and inspection notes).
6. **Hardened Role-Based Security Rules (`firestore.rules`):**
   - Access control and data validations are enforced directly by the Firestore database engine, preventing compromised clients from writing unauthorized transitions or bypassing math constraints.
7. **Offline-First Persistence:** Native Firestore IndexedDB caching enabling operators to log dockets without active network connectivity, backed by per-entry synchronization indicators (`hasPendingWrites`).

---

## 2. What Was Not Built

1. **Section 10 Stretch Features:** Canvas-based digital supervisor signatures and longitudinal trend analytics charts (Pareto/trend graphs) were intentionally omitted in favor of shipping an airtight, validated core system.
2. **Interactive Conflict Resolution & Merge UI:** In cases where an offline write conflicts with an entry that was already approved on the server, the server rejects the write and rolls back locally. A side-by-side visual merge modal was not constructed.
3. **Multi-Sheet Export:** The Excel exporter generates an audit-ready single sheet with all operational counts and status flags, but does not split out a separate secondary tab for granular transition timestamps.

---

## 3. Assumptions Made Where the Specification Was Unclear

1. **Division by Zero:**
   - When $\text{Produced} = 0$, rejection rate evaluates to `0.0%` (not `NaN` or `Infinity`), as zero pieces produced implies zero defects.
   - When $\text{Planned} = 0$, achievement percentage displays as a dash (`—`) rather than `Infinity%`, representing an unassigned or maintenance slot.
2. **Mathematical Rounding:**
   - Round-half-up to one decimal place (`Math.round(val * 10) / 10`). For example, $10.05\%$ rounds to $10.1\%$, which appropriately triggers the mandatory quality remark requirement.
3. **The 10.0% Rejection Threshold:**
   - Interpreted as strictly greater than ($> 10.0\%$). An entry with exactly $10.0\%$ scrap does not require mandatory remarks; $10.1\%$ and above does.
4. **Shift C Midnight Crossing (22:00–06:00):**
   - In accordance with standard manufacturing practice, all hours within Shift C (including 00:00 to 06:00 AM) are timestamped with the calendar date on which the shift commenced, preserving 8-hour batch accounting continuity.
5. **Supervisor Return Flow:**
   - Returning a docket requires an explicit inspection note from the supervisor. The returned docket is editable by the originating operator and transitions from `returned` $\rightarrow$ `draft` upon modification, or directly `returned` $\rightarrow$ `submitted` upon resubmission.
6. **Rejection Taxonomy:**
   - Rejection causes are strictly constrained to the 6 industrial categories (`Dimensional`, `Surface finish`, `Burr`, `Material defect`, `Setup error`, `Other`) in both frontend select pickers and backend security rules.

---

## 4. Anything Weak or Incomplete

1. **Silent Local Rollback on Offline Conflicts:** If an offline operator creates an entry for a slot that was already approved on the server, the server rule rejects the mutation when reconnected. The local optimistic entry rolls back without a persistent visual banner explaining why the slot was lost.
2. **Single-Sheet Audit Export:** While supervisors can inspect full audit histories within the web application, the Excel download only exports the current status snapshot rather than the complete chronological transition log.
3. **Emulator-Only Configuration:** The current setup is configured exclusively against local Firebase emulators. While production deployment only requires swapping `src/firebase.ts` configuration, continuous database migration scripts were not bundled.
4. **Automated Unit Testing:** Due to time allocation prioritising database-level `firestore.rules` and full TypeScript type integrity, formal automated unit tests (e.g., Vitest or `@firebase/rules-unit-testing`) were not added.

---

## 5. What I Would Change Given Another Week

1. **Security Rules Test Suite:** Implement automated unit tests for `firestore.rules` using `@firebase/rules-unit-testing` covering all RBAC transition paths and boundary cases.
2. **Interactive Conflict Resolution Modal:** Build a conflict reconciliation dialogue that detects optimistic write rollbacks, displays the server version alongside local draft state, and allows the operator to review differences.
3. **Live Supervisor Push Notifications:** Implement web push notifications or a live badge count in the header to alert supervisors in real time when new dockets are queued for review.
4. **Two-Tab Excel Reporting:** Expand the SheetJS utility to export a secondary tab containing the full chronological audit trail with supervisor inspection remarks.
5. **Section 10 Stretch Implementations:** Add HTML5 Canvas touch signature capture on supervisor approval and historical scrap Pareto charts by machine and part number.

