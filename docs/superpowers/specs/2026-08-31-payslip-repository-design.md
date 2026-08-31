# Payslip Repository (upload + circulation) — Design

**Date:** 2026-08-31
**Status:** Approved (pending spec review)
**Repos:** `imes-upgrade/hrm-service` (backend, branch `upgrade/boot3.5-java17`), `hrm/fentahrm` (frontend, branch `feature/design-ui-v2-integration`)
**Location in product:** Finance → Payslip (`HRM_PAYSLIP`, `/rits/hrm_payslip_app`)

## Goal

Replace the current manual payslip circulation — PDFs produced by an Excel macro
and emailed to each employee by hand — with an in-product repository:

1. HR uploads a month's payslip PDFs as a batch.
2. The system derives the employee and pay period from each file name
   (`Rxxxxx_mmm-yyyy`, e.g. `R10101_Aug-2026`), matching the code against
   `Employee.employeeCode`.
3. Files that don't match the convention, or whose employee can't be resolved,
   are skipped and reported back to HR rather than silently dropped.
4. HR reviews that summary and sends the batch; each matched employee receives
   their own payslip as a password-protected PDF attachment.
5. Employees pick a year and month and view/download **their own** payslips only.

This is deliberately a pre-payroll-automation step. Payroll processing and
automatic payslip generation are a later phase; this repository is designed so
that it becomes the download interface for generated payslips too, with no
migration.

## Scope reality (important)

A payslip module **already exists on both sides**, and it does the opposite of
what this requirement describes. The plan must account for that, not ignore it:

1. **The existing module generates, it does not store files.**
   `PayslipServiceImpl` builds a payslip from a `PayrollRun`/`PayrollEntry`,
   freezes it as a JSON `PayslipSnapshot`, and the browser renders the PDF from
   that snapshot. The controller comments are explicit: *"no PDF is stored
   server-side"*. There is no upload path, no file storage, and no bytes to
   attach to an email.
2. **`emailPayslips` is keyed to a `payrollRunId`.** It cannot be reused as-is
   for an upload batch, which has no payroll run behind it.
3. **The frontend already has a tab literally called "Repository"**
   (`PayslipRepository.tsx`) that lists *generated* records. Adding a second,
   differently-named repository would be actively confusing; the existing one is
   extended instead.
4. **There is no PDF library on the backend.** `pom.xml` has no PDFBox, iText,
   or OpenPDF. Server-side password protection requires adding one.
5. **`PayslipPasswordConfig` exists but is dead.** The model, the endpoints, and
   the frontend service methods are all there (`LAST4_PAN | DOB | CUSTOM`), but
   nothing ever applies a password. This feature is what makes it real.

## Decisions (locked)

1. **One repository, two sources.** Uploaded payslips are rows in the existing
   `payslip` collection with `source = "UPLOADED"`, not a parallel collection.
   When payroll generation ships later, `source = "GENERATED"` rows appear
   alongside them in the same lists, under the same self-service guard, with no
   migration and no second employee-facing screen.
2. **Emails are HR-triggered, not upload-triggered.** Upload parses, validates,
   stores, and reports. Emails go out only when HR presses "Send emails" on that
   summary. Rationale: the error report is worthless if the correct files have
   already been mailed by the time HR reads it, and the Apr–Jul 2026 historical
   backfill must land in the repository without mailing anyone four back-dated
   payslips.
3. **Re-upload replaces, and archives the previous file.** A second upload for
   the same `site + employeeCode + year + month` sets the existing row
   `active = 0`, records `supersededBy`, and makes the new row live. Employees
   only ever see the active row. History and the access log survive.
4. **The emailed copy is encrypted; the stored copy is not.** The PDF in GridFS
   stays as uploaded, so in-app viewing works and the password pattern can be
   changed later without re-encrypting stored files. Encryption happens in
   memory, per recipient, at send time.
5. **Batch size is assumed ≤ ~200 files/month.** Upload is synchronous and
   chunked; email dispatch is asynchronous. If volumes grow past ~1000 this
   needs revisiting (see Risks).
6. **Ship in two phases.** Phase A is the repository and the error report;
   Phase B is the password-protected auto-email. Phase A is independently
   useful — it ends "employees can't retrieve past payslips" on its own — and
   it lets the Apr–Jul backfill happen before any mail machinery exists.

## Data model

### `Payslip` (existing document, extended)

New fields, all null/absent on existing rows:

| Field | Type | Notes |
|---|---|---|
| `source` | String | `GENERATED` \| `UPLOADED`. Absent is read as `GENERATED`. |
| `fileId` | String | GridFS id. `UPLOADED` only. |
| `fileName` | String | As uploaded, e.g. `R10101_Aug-2026.pdf`. |
| `fileSizeBytes` | Long | |
| `uploadBatchId` | String | Links back to the batch for audit. |
| `supersededBy` | String | Handle of the row that replaced this one. |
| `emailStatus` | String | `NOT_SENT` \| `SENT` \| `FAILED` \| `SKIPPED`. |
| `emailedAt` | LocalDateTime | |
| `emailError` | String | Last failure reason, for re-send. |

`snapshot` stays null for uploaded rows; `fileId` stays null for generated ones.
Download branches on `source`. No backfill migration is required — reads treat a
missing `source` as `GENERATED`, which is what every existing row is.

Reused unchanged: `site`, `employeeId` (holds `employeeCode`), `employeeName`,
`employeeNumber`, `department`, `designation`, `payrollYear`, `payrollMonth`,
`payPeriodLabel`, `status`, `accessLog`, `active`, audit columns.

### `payslip_upload_batch` (new collection)

This document **is** the upload summary / error report.

```
handle, site, uploadedBy, uploadedAt,
totalFiles, matchedCount, skippedCount, emailedCount, failedEmailCount,
status: PARSING | PARSED | EMAILING | EMAILED | PARTIALLY_EMAILED,
items[]: {
  fileName, parseStatus, reason,
  employeeCode, employeeName, workEmail,
  payrollYear, payrollMonth,
  payslipHandle, emailStatus
}
```

`parseStatus ∈ OK | BAD_FILENAME | EMPLOYEE_NOT_FOUND | EMPLOYEE_NO_EMAIL |
NOT_A_PDF | REPLACED_EXISTING`.

`items[]` is bounded by the batch size (≤200), so it is a safe embedded array
rather than an unbounded one.

## File name parsing

Regex: `^([A-Za-z0-9]+)_([A-Za-z]{3})-(\d{4})\.pdf$`, month matched
case-insensitively against `Jan`–`Dec`.

The `R` prefix is **not** hard-coded. The first group is captured and looked up
against `Employee.employeeCode` (unique per site), so a future code scheme
changes the data, not the parser.

Failure handling, in order:

| Condition | `parseStatus` | Outcome |
|---|---|---|
| Not a PDF / wrong content type | `NOT_A_PDF` | Not stored, reported |
| Regex miss | `BAD_FILENAME` | Not stored, reported |
| No active `Employee` with that `employeeCode` in the site | `EMPLOYEE_NOT_FOUND` | Not stored, reported |
| Employee found, `workEmail` blank | `EMPLOYEE_NO_EMAIL` | **Stored** (self-service works), email skipped, reported |
| Active payslip already exists for that employee+period | `REPLACED_EXISTING` | Stored, previous archived, reported as informational |
| Otherwise | `OK` | Stored |

A batch never fails wholesale. One bad file never blocks the other 199.

**Counting rules**, so the summary is unambiguous: `matchedCount` is the number
of items that were **stored** — that is, `OK`, `REPLACED_EXISTING`, and
`EMPLOYEE_NO_EMAIL`. `skippedCount` is everything not stored — `NOT_A_PDF`,
`BAD_FILENAME`, `EMPLOYEE_NOT_FOUND`. Of the stored items, `OK` and
`REPLACED_EXISTING` are **eligible for email**; `EMPLOYEE_NO_EMAIL` is stored
and downloadable but starts at `emailStatus = SKIPPED` and is never mailed.
`matchedCount + skippedCount == totalFiles` always holds.

## API

Existing conventions are followed exactly: `POST` only, base
`app/v1/hrm-service/payslip`, `MessageModel` responses, site resolved through
`TenantResolverService`. The one deliberate exception is
`downloadUploadedPayslip`, which returns raw `application/pdf` bytes rather than
a `MessageModel` — an uploaded payslip is a file, and base64-wrapping it in a
JSON envelope would inflate every download for no benefit. The existing
snapshot-based download endpoints keep returning `MessageModel` unchanged.

| Endpoint | Body | Returns |
|---|---|---|
| `uploadPayslipBatch` | multipart: `files[]`, `organizationId`, `uploadedBy`, optional `batchHandle` | Batch summary |
| `getUploadBatch` | `organizationId`, `handle` | One batch (also the progress poll) |
| `getUploadBatches` | `organizationId`, optional year/month | Batch history |
| `emailUploadBatch` | `organizationId`, `handle`, `triggeredBy` | Accepted; progress read via `getUploadBatch` |
| `resendPayslipEmail` | `organizationId`, `payslipHandle`, `triggeredBy` | Per-item re-send |
| `downloadUploadedPayslip` | `organizationId`, `handle` or (`employeeId`,`year`,`month`) | `application/pdf` bytes |

`emailUploadBatch` is **idempotent by design**: it only dispatches items whose
`emailStatus` is `NOT_SENT` or `FAILED`. Pressing "Send emails" a second time
retries the failures and does not re-mail anyone who already received their
payslip. Re-sending to someone who succeeded is possible only through the
explicit per-item `resendPayslipEmail`.

`getMyPayslips` and `searchPayslips` are **extended**, not duplicated: they
return uploaded and generated rows together, each carrying `source`. Employees
get no new endpoint.

**Chunked upload.** `spring.servlet.multipart.max-request-size` is 50MB
(`application.properties:25`). 200 PDFs would sit uncomfortably close to that
ceiling, so the browser posts in chunks of ~25 files against one
`batchHandle`: the first call creates the batch, subsequent calls append. This
avoids changing server config and gives a real progress indicator.

**Byte fetching.** PDF bytes are read from GridFS only when someone actually
opens or downloads a payslip — never as part of a list response. This mirrors
the fix already made in the asset module (commit `002c90d`, "fetch an
attachment's bytes when someone opens it, not with every asset").

## Email (Phase B)

- **New method** `EmailService.sendEmailWithAttachment(to, subject, htmlBody,
  plainTextBody, fileName, byte[] content, contentType)`. `EmailServiceImpl`
  already builds its `MimeMessageHelper` multipart-capable
  (`EmailServiceImpl.java:94`), so this is an addition, not a rework. It keeps
  the existing contract: guarded by `hrm.mail.enabled`, never throws into the
  business flow, returns a boolean so per-recipient delivery can be recorded.
- **New dependency** `org.apache.pdfbox:pdfbox`. Used only at send time:
  load the stored PDF, apply a `StandardProtectionPolicy` with a user password,
  write to a byte array, attach, discard. The stored file is untouched.
- **Password derivation** from the existing `PayslipPasswordConfig.pattern`
  against the employee's record: `LAST4_PAN` (last 4 of PAN from
  `Employee.govtIds`), `DOB` (formatted per config), or `CUSTOM`. If the
  config is disabled, the PDF is attached unencrypted. If the pattern's source
  field is missing for an employee, that item is marked `FAILED` with a clear
  reason rather than silently mailed unprotected. The email body states the
  password rule.
- **Dispatch** is `@Async` on a dedicated mail executor, mirroring
  `AnnouncementAsyncConfig` / `AnnouncementMailService`. Per-item delivery
  status is recorded as `AnnouncementDeliveryServiceImpl` already does per
  recipient. 200 emails is roughly 40 seconds of SMTP — far too long to hold an
  HTTP request open. The UI polls `getUploadBatch` for progress; failed items
  are individually re-sendable.

## Access control

The RBAC objects **already exist** in `DefaultModuleRegistry.java:166`:
`payslip_module, payslip_record, payslip_generate, payslip_repository,
payslip_template, payslip_history, payslip_download`. No registry change and no
re-seeding of existing organisations is needed.

| Capability | Gate |
|---|---|
| Upload a batch | `payslip_repository` / ADD |
| View repository, batch history, error report | `payslip_repository` / VIEW |
| Send or re-send emails | `payslip_repository` / EDIT |
| Employee views/downloads own payslip | Self-service; no grant required |
| HR downloads anyone's payslip | `payslip_download` / VIEW |

Two existing gaps are closed as part of this work, because the new screens sit
directly on top of them:

1. **The backend has no permission check on any payslip endpoint** beyond
   `assertSelfService`. The UI gate is currently the only gate. A server-side
   check is added for upload / email / history, following the existing
   `AnnouncementPermission` pattern.
2. **`HrmPayslipLanding.tsx` gates its tabs on a `role` cookie**
   (`role === "ADMIN" || "HR" || "FINANCE"`), which bypasses RBAC entirely. The
   new tabs must not inherit that, so tab gating moves to `useCan`.

**Every new `<Can>` carries an explicit `object=`.** An unscoped `<Can>`
resolves against the module root object, which is exactly what hid the
Announcements Delete button from users who had been granted the permission.
`PayslipRepository.tsx:70` already contains an unscoped `<Can I="edit">`; it is
scoped while that file is being edited.

Employee self-service reuses `PayslipService.assertSelfService` unchanged — it
already refuses a read of another employee's payslip by comparing
`CallerIdentity.employeeCodeOf(X-User-ID)` against the requested code. Note the
existing `hrm.payslip.self-service.enforce` flag and its documented dependency
on `Employee.userId` being populated; uploaded payslips inherit both.

## Frontend (`src/modules/hrmPayslip`)

Existing structure is followed: atoms/molecules/organisms/templates, a single
zustand store (`payslipStore.ts`), a service class (`payslipService.ts`), CSS
modules.

- **New tab "Upload"** (HR/Admin) — `Upload.Dragger` for multi-file PDF
  selection, chunked submit with progress, then `UploadSummaryTable`: one row
  per file with its status, the reason for every skip, a "Send emails" button
  (Phase B), and CSV export of the error rows for correction.
- **New tab "Upload History"** (HR/Admin) — past batches with counts; drill into
  any batch's summary; re-send individual failed items.
- **"My Payslips"** (`EmployeePayslipView`) — add the **year and month
  dropdowns** the requirement asks for. It currently uses `MonthNavigator`,
  which walks months rather than selecting them. The empty state changes from
  "Payslip not yet generated for …" to wording that fits an uploaded-payslip
  world.
- **"Repository"** (`PayslipRepository`) — add a `Source` column
  (Uploaded/Generated); the view and download actions branch on `source`
  (bytes endpoint vs. snapshot renderer).

New store slice: `uploadBatch`, `uploadProgress`, `batchHistory`, plus actions
`uploadFiles`, `pollBatch`, `sendBatchEmails`, `resendOne`. New files stay
small and single-purpose, consistent with the module's current file sizes.

## Error handling

- Per-file status, never a whole-batch failure.
- Non-PDF and oversize files rejected per file with a reason.
- Email failures recorded per recipient with the reason, re-sendable
  individually; a partially delivered batch is `PARTIALLY_EMAILED`, not
  `EMAILED`.
- Missing password source (no PAN / no DOB) fails that item loudly rather than
  mailing an unprotected payslip.
- Backend errors use the existing `HrmException` + `PAYSLIP_xxx` code
  convention.

## Testing

**Backend** — `PayslipUploadLifecycleTestCase`, following the existing
`*LifecycleTestCase` convention (83 test files already present):

- filename parse table: valid, wrong separator, missing month, 2-digit year,
  non-PDF extension, lowercase month
- unknown employee code → `EMPLOYEE_NOT_FOUND`, file not stored
- employee without `workEmail` → stored, email skipped
- re-upload → previous row `active = 0`, `supersededBy` set, new row live
- self-service: employee A requesting employee B's uploaded payslip is refused
- `emailUploadBatch` with `hrm.mail.enabled=false` → items marked, no send
- password derivation for each pattern, including the missing-source failure

**Frontend** — `tests/unit/payslip-upload-helpers.spec.ts` (`npm run test:unit`,
Playwright pure-logic, no browser/server, matching the existing four specs):

- the filename parse helper (shared shape with the backend cases)
- summary aggregation counts
- source-based download branch selection

## Phasing

**Phase A — repository (~3 working days)**
Data model, GridFS storage, filename parsing, upload endpoint + chunking, batch
summary/error report, Upload and Upload History tabs, `Source` column,
employee year/month dropdowns and download, RBAC gates (UI + server-side),
tests. Circulation stays manual, but every payslip from Apr-2026 is in the
system and self-serve.

**Phase B — circulation (~3 working days)**
PDFBox dependency, `sendEmailWithAttachment`, password derivation from
`PayslipPasswordConfig`, async dispatch + per-item delivery tracking,
"Send emails" and re-send UI, delivery tests.

**Total ~5–8 working days**, plus a deployment window on the remote host and HR
acceptance testing. The requested date of 31-Aug-2026 is the day the
requirement was raised and is not achievable; Phase A is the earliest thing
that delivers real value.

Backfill fits the phasing naturally: Apr–Jul 2026 uploads during Phase A with no
mail machinery in existence, and Aug-2026 becomes the first auto-mailed month.

**Plan boundary:** Phase A and Phase B get **separate implementation plans**.
Phase A is releasable on its own and its plan should not be held open waiting on
the PDFBox dependency or SMTP behaviour; Phase B's plan builds on a shipped and
tested Phase A.

## Risks and non-goals

1. **Uploaded PDFs are not encrypted at rest.** The `payslip` collection is
   covered by field-level encryption (see
   `imes-upgrade/docs/hrm-service/payslip/encryption-gaps.md`), but GridFS bytes
   are not, and salary data inside a PDF is opaque to field converters. This is
   a conscious non-goal for this feature; if at-rest protection is required, it
   belongs with the wider encryption rollout, not here.
2. **Volume assumption.** Synchronous chunked upload suits ≤200 files. Past
   ~1000 the upload needs to become a polled async job and email dispatch a
   rate-limited worker, or SMTP will throttle.
3. **`hrm.payslip.self-service.enforce` defaults to false** because
   `Employee.userId` is populated for a minority of records. Until the linking
   migration runs, the server-side "own payslips only" guard is not actually
   enforcing for unresolved callers. Enabling it is a prerequisite for treating
   this module as secure, and is called out in the existing code comments.
4. **No payroll processing, no payslip generation, no salary structure, no
   attendance linking.** Explicitly out of scope per the requirement.
5. **The Excel macro remains the source of the PDFs** for this phase. This
   feature does not validate payslip *contents* — only the file name, the
   employee match, and the period.
