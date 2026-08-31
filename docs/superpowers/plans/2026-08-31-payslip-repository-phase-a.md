# Payslip Repository — Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HR uploads a batch of payslip PDFs; the system resolves each file to an employee and pay period from its name, stores it, reports every file it could not place, and lets each employee download their own payslips by year and month.

**Architecture:** Uploaded payslips become rows in the **existing** `payslip` Mongo collection with `source = "UPLOADED"` and a GridFS `fileId`, rather than a parallel collection — so payroll-generated payslips later appear in the same lists under the same self-service guard with no migration. A new `payslip_upload_batch` collection records one document per upload, whose embedded `items[]` array *is* the summary/error report the UI renders. Uploading is synchronous and chunked from the browser; nothing in Phase A sends email.

**Tech Stack:** Java 17, Spring Boot 3.5, Spring Data MongoDB + GridFS, Lombok, JUnit 5 + Mockito (backend); Next.js 15 (App Router), React, antd 5, zustand, Playwright (frontend unit tests).

**Spec:** `docs/superpowers/specs/2026-08-31-payslip-repository-design.md` — read it before Task 1. This plan implements **Phase A only**; Phase B (password-protected auto-email) is a separate plan and must not be started here.

## Global Constraints

- **Backend repo:** `/home/senthil/Fenta/imes-upgrade/hrm-service`, branch `upgrade/boot3.5-java17`. **This is the live source.** The copy at `/home/senthil/Fenta/imes-services/hrm-service` is stale — never edit or read it.
- **Frontend repo:** `/home/senthil/Fenta/hrm/fentahrm`, branch `feature/design-ui-v2-integration`.
- **All endpoints are POST**, under `app/v1/hrm-service/payslip`, and return `MessageModel`. The single deliberate exception is `downloadUploadedPayslip`, which returns raw `application/pdf` bytes.
- **Site resolution** is always `tenantResolver.resolveToSite(organizationId, site)` — never trust a raw `site` from the body alone.
- **RBAC objects already exist** on both sides — backend `DefaultModuleRegistry.java:166`, frontend `moduleObjectRegistry.ts:339`. Do **not** add module registry entries, and do not invent new object codes. Phase A uses only `payslip_repository`, `payslip_download`, and the root `payslip_module`.
- **Employee identity:** the code in a file name (`R10101`) is `Employee.employeeCode`. `Payslip.employeeId` stores that same employee **code**, not a Mongo id — this is pre-existing and must be preserved.
- **Batch limits:** ≤200 files per batch; browser uploads in chunks of **25**. `spring.servlet.multipart.max-file-size=10MB`, `max-request-size=50MB` (`application.properties:24-25`) — do not raise them.
- **Backend unit tests** are `*Test.java` (pure JUnit, no server). Run: `mvn -pl hrm-service test -Dtest="ClassName"`. **`*LifecycleTestCase.java` files are live HTTP tests against a running host** and are not part of the TDD loop.
- **Frontend unit tests** are `tests/unit/*.spec.ts` — pure-logic Playwright, no browser, no server. Run: `npm run test:unit`.
- **Every new `<Can>` must pass an explicit `object=`.** `useCan` does a strict object lookup and returns EMPTY (denied) for an object it cannot find; an unscoped `<Can>` silently resolves against the module root instead. This is the exact mechanism that hid the Announcements Delete button.
- **No email code in Phase A.** No PDFBox dependency, no `EmailService` changes.

---

### Task 1: Payslip file name parser

The one piece of pure logic the whole ingest rests on. Built and tested first, in isolation, with no Mongo and no Spring.

**Files:**
- Create: `src/main/java/com/rits/hrmservice/payslip/model/ParsedPayslipFileName.java`
- Create: `src/main/java/com/rits/hrmservice/payslip/service/PayslipFileNameParser.java`
- Test: `src/test/java/com/rits/hrmservice/payslip/PayslipFileNameParserTest.java`

**Interfaces:**
- Consumes: nothing.
- Produces: `ParsedPayslipFileName(String employeeCode, int year, int month)` and `PayslipFileNameParser.parse(String fileName) -> Optional<ParsedPayslipFileName>`. Task 3 calls `parse` and treats `Optional.empty()` as `BAD_FILENAME`.

- [ ] **Step 1: Write the failing test**

Create `src/test/java/com/rits/hrmservice/payslip/PayslipFileNameParserTest.java`:

```java
package com.rits.hrmservice.payslip;

import com.rits.hrmservice.payslip.model.ParsedPayslipFileName;
import com.rits.hrmservice.payslip.service.PayslipFileNameParser;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The convention HR has been following since Apr-2026: {@code Rxxxxx_mmm-yyyy.pdf}.
 *
 * <p>The employee code is deliberately NOT anchored to an "R" prefix. It is captured and looked
 * up against Employee.employeeCode, so a future code scheme is a data change, not a parser change.
 *
 * <p>Every rejection here is a file that will be reported to HR rather than silently dropped, so
 * the boundary between accept and reject is pinned case by case.
 */
class PayslipFileNameParserTest {

    @Test
    void parsesTheConventionFromTheRequirement() {
        ParsedPayslipFileName p = PayslipFileNameParser.parse("R10101_Aug-2026.pdf").orElseThrow();
        assertEquals("R10101", p.employeeCode());
        assertEquals(2026, p.year());
        assertEquals(8, p.month());
    }

    @Test
    void monthIsCaseInsensitive() {
        assertEquals(8, PayslipFileNameParser.parse("R10101_AUG-2026.pdf").orElseThrow().month());
        assertEquals(8, PayslipFileNameParser.parse("R10101_aug-2026.pdf").orElseThrow().month());
    }

    @Test
    void extensionIsCaseInsensitive() {
        assertTrue(PayslipFileNameParser.parse("R10101_Aug-2026.PDF").isPresent());
    }

    @Test
    void acceptsEveryMonthNameJanuaryThroughDecember() {
        String[] names = {"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};
        for (int i = 0; i < names.length; i++) {
            ParsedPayslipFileName p =
                    PayslipFileNameParser.parse("R1_" + names[i] + "-2026.pdf").orElseThrow();
            assertEquals(i + 1, p.month(), "month for " + names[i]);
        }
    }

    @Test
    void acceptsACodeWithoutTheRPrefix() {
        // The prefix is HR's current convention, not a rule the parser enforces.
        assertEquals("EMP007", PayslipFileNameParser.parse("EMP007_Apr-2026.pdf").orElseThrow().employeeCode());
    }

    @Test
    void rejectsAFullMonthName() {
        assertEquals(Optional.empty(), PayslipFileNameParser.parse("R10101_August-2026.pdf"));
    }

    @Test
    void rejectsANonMonthThreeLetterWord() {
        assertEquals(Optional.empty(), PayslipFileNameParser.parse("R10101_Xyz-2026.pdf"));
    }

    @Test
    void rejectsATwoDigitYear() {
        assertEquals(Optional.empty(), PayslipFileNameParser.parse("R10101_Aug-26.pdf"));
    }

    @Test
    void rejectsTheWrongSeparators() {
        assertEquals(Optional.empty(), PayslipFileNameParser.parse("R10101-Aug-2026.pdf"));
        assertEquals(Optional.empty(), PayslipFileNameParser.parse("R10101_Aug_2026.pdf"));
    }

    @Test
    void rejectsAMissingOrWrongExtension() {
        assertEquals(Optional.empty(), PayslipFileNameParser.parse("R10101_Aug-2026"));
        assertEquals(Optional.empty(), PayslipFileNameParser.parse("R10101_Aug-2026.xlsx"));
    }

    @Test
    void rejectsAnEmployeeCodeWithSeparatorCharacters() {
        assertEquals(Optional.empty(), PayslipFileNameParser.parse("R1_01_Aug-2026.pdf"));
    }

    @Test
    void rejectsNullAndBlank() {
        assertEquals(Optional.empty(), PayslipFileNameParser.parse(null));
        assertEquals(Optional.empty(), PayslipFileNameParser.parse("   "));
    }

    @Test
    void ignoresSurroundingWhitespaceFromABrowserUpload() {
        assertTrue(PayslipFileNameParser.parse("  R10101_Aug-2026.pdf  ").isPresent());
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipFileNameParserTest"
```

Expected: FAIL — compilation error, `package com.rits.hrmservice.payslip.model` does not contain `ParsedPayslipFileName`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/main/java/com/rits/hrmservice/payslip/model/ParsedPayslipFileName.java`:

```java
package com.rits.hrmservice.payslip.model;

/** The three facts a payslip file name carries. Produced only by PayslipFileNameParser. */
public record ParsedPayslipFileName(String employeeCode, int year, int month) {
}
```

Create `src/main/java/com/rits/hrmservice/payslip/service/PayslipFileNameParser.java`:

```java
package com.rits.hrmservice.payslip.service;

import com.rits.hrmservice.payslip.model.ParsedPayslipFileName;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Reads {@code Rxxxxx_mmm-yyyy.pdf} — the convention HR has followed since Apr-2026.
 *
 * <p>The employee code is captured, never validated against a prefix: it is resolved against
 * Employee.employeeCode by the caller, so a future code scheme changes the data rather than this
 * class. Anything this method rejects is reported to HR as BAD_FILENAME, never silently dropped.
 */
public final class PayslipFileNameParser {

    private static final List<String> MONTHS =
            List.of("jan", "feb", "mar", "apr", "may", "jun",
                    "jul", "aug", "sep", "oct", "nov", "dec");

    /** Code is alphanumeric only, so an underscore in it cannot be mistaken for the separator. */
    private static final Pattern PATTERN =
            Pattern.compile("^([A-Za-z0-9]+)_([A-Za-z]{3})-(\\d{4})\\.pdf$", Pattern.CASE_INSENSITIVE);

    private PayslipFileNameParser() {}

    public static Optional<ParsedPayslipFileName> parse(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return Optional.empty();
        }
        Matcher m = PATTERN.matcher(fileName.strip());
        if (!m.matches()) {
            return Optional.empty();
        }
        int month = MONTHS.indexOf(m.group(2).toLowerCase(Locale.ROOT)) + 1;
        if (month == 0) {
            return Optional.empty();
        }
        return Optional.of(new ParsedPayslipFileName(
                m.group(1), Integer.parseInt(m.group(3)), month));
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipFileNameParserTest"
```

Expected: PASS, 13 tests.

- [ ] **Step 5: Commit**

```bash
cd /home/senthil/Fenta/imes-upgrade
git add hrm-service/src/main/java/com/rits/hrmservice/payslip/model/ParsedPayslipFileName.java \
        hrm-service/src/main/java/com/rits/hrmservice/payslip/service/PayslipFileNameParser.java \
        hrm-service/src/test/java/com/rits/hrmservice/payslip/PayslipFileNameParserTest.java
git commit -m "feat(hrm-payslip): parse the Rxxxxx_mmm-yyyy payslip file name convention"
```

---

### Task 2: Upload batch model, parse statuses, and the counting rules

**Files:**
- Create: `src/main/java/com/rits/hrmservice/payslip/model/PayslipParseStatus.java`
- Create: `src/main/java/com/rits/hrmservice/payslip/model/PayslipUploadItem.java`
- Create: `src/main/java/com/rits/hrmservice/payslip/model/PayslipUploadBatch.java`
- Create: `src/main/java/com/rits/hrmservice/payslip/repository/PayslipUploadBatchRepository.java`
- Modify: `src/main/java/com/rits/hrmservice/payslip/model/Payslip.java`
- Modify: `src/main/java/com/rits/hrmservice/payslip/repository/PayslipRepository.java`
- Test: `src/test/java/com/rits/hrmservice/payslip/PayslipUploadBatchCountsTest.java`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `PayslipParseStatus` (enum with `stored()` and `emailEligible()`), `PayslipUploadItem`, `PayslipUploadBatch` with `recomputeCounts()`, and `PayslipRepository.findBySiteAndEmployeeIdAndPayrollYearAndPayrollMonthAndActive(...)`. Task 3 builds these; Tasks 6/7 read them.

- [ ] **Step 1: Write the failing test**

Create `src/test/java/com/rits/hrmservice/payslip/PayslipUploadBatchCountsTest.java`:

```java
package com.rits.hrmservice.payslip;

import com.rits.hrmservice.payslip.model.PayslipParseStatus;
import com.rits.hrmservice.payslip.model.PayslipUploadBatch;
import com.rits.hrmservice.payslip.model.PayslipUploadItem;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The summary HR reads after an upload. Two invariants matter more than the individual numbers:
 *
 * <ul>
 *   <li>every file is accounted for — matched + skipped == total, so a file can never vanish
 *       between the browser and the report;</li>
 *   <li>"stored" and "mailable" are different questions. A payslip for an employee with no work
 *       email IS stored (they can still download it) but must never be counted as mailable, or
 *       Phase B will try to send it to nobody.</li>
 * </ul>
 */
class PayslipUploadBatchCountsTest {

    private PayslipUploadItem item(PayslipParseStatus status) {
        return PayslipUploadItem.builder().fileName("f.pdf").parseStatus(status).build();
    }

    @Test
    void storedStatusesAreTheOnesThatProducedAPayslipRow() {
        assertTrue(PayslipParseStatus.OK.stored());
        assertTrue(PayslipParseStatus.REPLACED_EXISTING.stored());
        assertTrue(PayslipParseStatus.EMPLOYEE_NO_EMAIL.stored());

        assertFalse(PayslipParseStatus.BAD_FILENAME.stored());
        assertFalse(PayslipParseStatus.EMPLOYEE_NOT_FOUND.stored());
        assertFalse(PayslipParseStatus.NOT_A_PDF.stored());
    }

    @Test
    void anEmployeeWithNoEmailIsStoredButNotMailable() {
        assertTrue(PayslipParseStatus.EMPLOYEE_NO_EMAIL.stored());
        assertFalse(PayslipParseStatus.EMPLOYEE_NO_EMAIL.emailEligible());
    }

    @Test
    void replacingAnExistingPayslipIsStillMailable() {
        // A correction is the case most likely to need re-sending, not the least.
        assertTrue(PayslipParseStatus.REPLACED_EXISTING.emailEligible());
    }

    @Test
    void nothingUnstoredIsEverMailable() {
        for (PayslipParseStatus s : PayslipParseStatus.values()) {
            if (!s.stored()) {
                assertFalse(s.emailEligible(), s + " is not stored so must not be mailable");
            }
        }
    }

    @Test
    void countsSplitEveryFileIntoMatchedOrSkipped() {
        PayslipUploadBatch batch = PayslipUploadBatch.builder()
                .items(List.of(
                        item(PayslipParseStatus.OK),
                        item(PayslipParseStatus.OK),
                        item(PayslipParseStatus.REPLACED_EXISTING),
                        item(PayslipParseStatus.EMPLOYEE_NO_EMAIL),
                        item(PayslipParseStatus.BAD_FILENAME),
                        item(PayslipParseStatus.EMPLOYEE_NOT_FOUND),
                        item(PayslipParseStatus.NOT_A_PDF)))
                .build();

        batch.recomputeCounts();

        assertEquals(7, batch.getTotalFiles());
        assertEquals(4, batch.getMatchedCount());
        assertEquals(3, batch.getSkippedCount());
        assertEquals(batch.getTotalFiles(), batch.getMatchedCount() + batch.getSkippedCount());
    }

    @Test
    void anEmptyBatchCountsToZeroRatherThanThrowing() {
        PayslipUploadBatch batch = PayslipUploadBatch.builder().build();
        batch.recomputeCounts();
        assertEquals(0, batch.getTotalFiles());
        assertEquals(0, batch.getMatchedCount());
        assertEquals(0, batch.getSkippedCount());
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipUploadBatchCountsTest"
```

Expected: FAIL — `PayslipParseStatus` does not exist.

- [ ] **Step 3: Write the minimal implementation**

Create `src/main/java/com/rits/hrmservice/payslip/model/PayslipParseStatus.java`:

```java
package com.rits.hrmservice.payslip.model;

/**
 * What happened to one file in an upload batch.
 *
 * <p>"Stored" and "mailable" are deliberately separate: a payslip whose employee has no work email
 * is stored so the employee can download it in the app, but must never enter Phase B's send list.
 */
public enum PayslipParseStatus {

    /** Parsed, employee resolved, stored as a new payslip. */
    OK(true, true),

    /** Stored, and an earlier payslip for the same employee and period was archived. */
    REPLACED_EXISTING(true, true),

    /** Stored and downloadable, but the employee has no work email to send it to. */
    EMPLOYEE_NO_EMAIL(true, false),

    /** The file name does not follow Rxxxxx_mmm-yyyy.pdf. */
    BAD_FILENAME(false, false),

    /** No active employee at this site holds that employee code. */
    EMPLOYEE_NOT_FOUND(false, false),

    /** The upload was not a PDF. */
    NOT_A_PDF(false, false);

    private final boolean stored;
    private final boolean emailEligible;

    PayslipParseStatus(boolean stored, boolean emailEligible) {
        this.stored = stored;
        this.emailEligible = emailEligible;
    }

    /** True when this file produced a payslip row. Counts toward matchedCount. */
    public boolean stored() {
        return stored;
    }

    /** True when Phase B may send this payslip. Never true for something that was not stored. */
    public boolean emailEligible() {
        return emailEligible;
    }
}
```

Create `src/main/java/com/rits/hrmservice/payslip/model/PayslipUploadItem.java`:

```java
package com.rits.hrmservice.payslip.model;

import lombok.*;

/** One file in an upload batch, and what became of it. This is a row of HR's error report. */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PayslipUploadItem {

    private String fileName;
    private PayslipParseStatus parseStatus;

    /** Human-readable explanation shown to HR. Always set for a non-stored item. */
    private String reason;

    private String employeeCode;
    private String employeeName;
    private String workEmail;

    private Integer payrollYear;
    private Integer payrollMonth;

    /** The payslip row this file produced. Null unless parseStatus.stored(). */
    private String payslipHandle;

    /** NOT_SENT | SENT | FAILED | SKIPPED. Phase A only ever writes NOT_SENT or SKIPPED. */
    private String emailStatus;
}
```

Create `src/main/java/com/rits/hrmservice/payslip/model/PayslipUploadBatch.java`:

```java
package com.rits.hrmservice.payslip.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * One HR upload. The embedded {@code items} array IS the upload summary / error report — there is
 * no second reporting structure to keep in step with it.
 *
 * <p>The array is bounded by the batch size (<=200 files), so embedding is safe here rather than
 * the unbounded-array anti-pattern it would be for an open-ended log.
 */
@Document(collection = "payslip_upload_batch")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PayslipUploadBatch {

    @Id
    private String handle;

    private String site;
    private String uploadedBy;
    private LocalDateTime uploadedAt;

    private int totalFiles;
    private int matchedCount;
    private int skippedCount;
    private int emailedCount;
    private int failedEmailCount;

    /** PARSING | PARSED | EMAILING | EMAILED | PARTIALLY_EMAILED. Phase A stops at PARSED. */
    private String status;

    @Builder.Default
    private List<PayslipUploadItem> items = new ArrayList<>();

    private int active;
    private LocalDateTime createdDateTime;
    private LocalDateTime modifiedDateTime;

    /**
     * Recomputes the headline numbers from {@code items}. Called after every chunk, so a batch
     * that is still being uploaded always reports numbers consistent with the rows it holds.
     */
    public void recomputeCounts() {
        List<PayslipUploadItem> rows = items == null ? List.of() : items;
        this.totalFiles = rows.size();
        this.matchedCount = (int) rows.stream()
                .filter(i -> i.getParseStatus() != null && i.getParseStatus().stored())
                .count();
        this.skippedCount = this.totalFiles - this.matchedCount;
    }
}
```

Create `src/main/java/com/rits/hrmservice/payslip/repository/PayslipUploadBatchRepository.java`:

```java
package com.rits.hrmservice.payslip.repository;

import com.rits.hrmservice.payslip.model.PayslipUploadBatch;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PayslipUploadBatchRepository extends MongoRepository<PayslipUploadBatch, String> {

    List<PayslipUploadBatch> findBySiteAndActiveOrderByUploadedAtDesc(String site, int active);
}
```

Modify `src/main/java/com/rits/hrmservice/payslip/model/Payslip.java` — add these fields immediately after the existing `statementType` field, keeping the existing fields untouched:

```java
    /**
     * GENERATED (from a payroll run, snapshot-backed) or UPLOADED (an HR-supplied PDF in GridFS).
     * Absent on rows written before the repository feature; readers treat absent as GENERATED,
     * which is what every one of those rows is. That is why there is no backfill migration.
     */
    private String source;

    /** GridFS file id. UPLOADED only. */
    private String fileId;

    /** The name exactly as HR uploaded it, e.g. R10101_Aug-2026.pdf. */
    private String fileName;

    private Long fileSizeBytes;

    /** The upload batch this row came from, for audit. */
    private String uploadBatchId;

    /** Handle of the row that replaced this one, when a correction was uploaded. */
    private String supersededBy;

    /** NOT_SENT | SENT | FAILED | SKIPPED. Written by Phase B; set at ingest in Phase A. */
    private String emailStatus;

    private LocalDateTime emailedAt;

    private String emailError;
```

Modify `src/main/java/com/rits/hrmservice/payslip/repository/PayslipRepository.java` — add one finder. The existing `findBySiteAndEmployeeIdAndPayrollYearAndPayrollMonth` is **not** reusable here: it ignores `active`, so it would return an already-superseded row.

```java
    Optional<Payslip> findBySiteAndEmployeeIdAndPayrollYearAndPayrollMonthAndActive(
            String site, String employeeId, int year, int month, int active);
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipUploadBatchCountsTest"
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Verify nothing else broke**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service -q compile
```

Expected: BUILD SUCCESS. The `Payslip` additions are new fields only — no existing call site changes.

- [ ] **Step 6: Commit**

```bash
cd /home/senthil/Fenta/imes-upgrade
git add hrm-service/src/main/java/com/rits/hrmservice/payslip/model/ \
        hrm-service/src/main/java/com/rits/hrmservice/payslip/repository/ \
        hrm-service/src/test/java/com/rits/hrmservice/payslip/PayslipUploadBatchCountsTest.java
git commit -m "feat(hrm-payslip): upload batch model and the stored-vs-mailable counting rules"
```

---

### Task 3: Ingest service — parse, resolve, store, replace

**Files:**
- Create: `src/main/java/com/rits/hrmservice/payslip/service/PayslipUploadService.java`
- Create: `src/main/java/com/rits/hrmservice/payslip/service/PayslipUploadServiceImpl.java`
- Test: `src/test/java/com/rits/hrmservice/payslip/PayslipUploadServiceTest.java`

**Interfaces:**
- Consumes: `PayslipFileNameParser.parse` (Task 1); `PayslipUploadBatch`, `PayslipUploadItem`, `PayslipParseStatus`, `PayslipUploadBatchRepository`, the new `PayslipRepository` finder (Task 2).
- Produces:
  - `PayslipUploadService.uploadBatch(String site, String batchHandle, String uploadedBy, List<MultipartFile> files) -> PayslipUploadBatch` — `batchHandle` null starts a new batch, non-null appends a chunk.
  - `PayslipUploadService.getBatch(String site, String handle) -> PayslipUploadBatch`
  - `PayslipUploadService.getBatches(String site) -> List<PayslipUploadBatch>`
  Task 4 adds download methods to the same interface; Task 6 calls all of them.

- [ ] **Step 1: Write the failing test**

Create `src/test/java/com/rits/hrmservice/payslip/PayslipUploadServiceTest.java`:

```java
package com.rits.hrmservice.payslip;

import com.rits.hrmservice.employee.model.Employee;
import com.rits.hrmservice.employee.repository.EmployeeRepository;
import com.rits.hrmservice.payslip.model.*;
import com.rits.hrmservice.payslip.repository.PayslipRepository;
import com.rits.hrmservice.payslip.repository.PayslipUploadBatchRepository;
import com.rits.hrmservice.payslip.service.PayslipUploadServiceImpl;
import com.rits.hrmservice.shared.audit.service.AuditService;
import com.rits.hrmservice.shared.document.DocumentStorageService;
import com.rits.hrmservice.shared.tenant.TenantResolverService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Ingest. Every case here is a file HR will actually upload, including the ones they get wrong.
 *
 * <p>The rule the whole feature rests on: a bad file is REPORTED, never dropped and never allowed
 * to fail the batch. One typo in 200 file names must cost HR one correction, not one re-upload.
 */
class PayslipUploadServiceTest {

    private PayslipRepository payslipRepository;
    private PayslipUploadBatchRepository batchRepository;
    private EmployeeRepository employeeRepository;
    private DocumentStorageService documentStorage;
    private AuditService auditService;
    private TenantResolverService tenantResolver;
    private PayslipUploadServiceImpl service;

    private static final String SITE = "RITS";

    @BeforeEach
    void setUp() throws Exception {
        payslipRepository = mock(PayslipRepository.class);
        batchRepository = mock(PayslipUploadBatchRepository.class);
        employeeRepository = mock(EmployeeRepository.class);
        documentStorage = mock(DocumentStorageService.class);
        auditService = mock(AuditService.class);
        tenantResolver = mock(TenantResolverService.class);

        when(tenantResolver.resolveOrgId(SITE)).thenReturn(Optional.of(SITE));
        when(documentStorage.uploadFile(any(MultipartFile.class), anyString(), anyString()))
                .thenReturn("gridfs-1");
        when(batchRepository.save(any(PayslipUploadBatch.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(payslipRepository.save(any(Payslip.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(payslipRepository.findBySiteAndEmployeeIdAndPayrollYearAndPayrollMonthAndActive(
                anyString(), anyString(), anyInt(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());

        service = new PayslipUploadServiceImpl(payslipRepository, batchRepository,
                employeeRepository, documentStorage, auditService, tenantResolver);
    }

    private void employeeExists(String code, String name, String email) {
        Employee e = new Employee();
        e.setEmployeeCode(code);
        e.setFullName(name);
        e.setWorkEmail(email);
        e.setDepartment("Engineering");
        e.setDesignation("Engineer");
        when(employeeRepository.findByOrganizationIdAndEmployeeCodeAndActive(SITE, code, 1))
                .thenReturn(Optional.of(e));
    }

    private MultipartFile pdf(String name) {
        return new MockMultipartFile("files", name, "application/pdf", "%PDF-1.4 fake".getBytes());
    }

    private PayslipUploadItem only(PayslipUploadBatch b) {
        assertEquals(1, b.getItems().size());
        return b.getItems().get(0);
    }

    @Test
    void storesAPayslipForAResolvableFile() {
        employeeExists("R10101", "Asha Rao", "asha@rits.com");

        PayslipUploadBatch batch =
                service.uploadBatch(SITE, null, "HRADMIN", List.of(pdf("R10101_Aug-2026.pdf")));

        PayslipUploadItem item = only(batch);
        assertEquals(PayslipParseStatus.OK, item.getParseStatus());
        assertEquals("R10101", item.getEmployeeCode());
        assertEquals("Asha Rao", item.getEmployeeName());
        assertEquals(2026, item.getPayrollYear());
        assertEquals(8, item.getPayrollMonth());
        assertEquals(1, batch.getMatchedCount());
        assertEquals(0, batch.getSkippedCount());

        ArgumentCaptor<Payslip> saved = ArgumentCaptor.forClass(Payslip.class);
        verify(payslipRepository).save(saved.capture());
        assertEquals("UPLOADED", saved.getValue().getSource());
        assertEquals("gridfs-1", saved.getValue().getFileId());
        assertEquals("R10101", saved.getValue().getEmployeeId());
        assertEquals("R10101_Aug-2026.pdf", saved.getValue().getFileName());
        assertEquals(1, saved.getValue().getActive());
        assertEquals("NOT_SENT", saved.getValue().getEmailStatus());
        assertNull(saved.getValue().getSnapshot(), "an uploaded payslip has no generated snapshot");
    }

    @Test
    void reportsABadFileNameAndStoresNothing() {
        PayslipUploadBatch batch =
                service.uploadBatch(SITE, null, "HRADMIN", List.of(pdf("payslip-august.pdf")));

        PayslipUploadItem item = only(batch);
        assertEquals(PayslipParseStatus.BAD_FILENAME, item.getParseStatus());
        assertNotNull(item.getReason(), "HR needs to be told what to fix");
        assertNull(item.getPayslipHandle());
        assertEquals(0, batch.getMatchedCount());
        assertEquals(1, batch.getSkippedCount());
        verify(payslipRepository, never()).save(any());
        verifyNoInteractions(documentStorage);
    }

    @Test
    void reportsAnUnknownEmployeeAndStoresNothing() {
        when(employeeRepository.findByOrganizationIdAndEmployeeCodeAndActive(SITE, "R99999", 1))
                .thenReturn(Optional.empty());

        PayslipUploadBatch batch =
                service.uploadBatch(SITE, null, "HRADMIN", List.of(pdf("R99999_Aug-2026.pdf")));

        assertEquals(PayslipParseStatus.EMPLOYEE_NOT_FOUND, only(batch).getParseStatus());
        verify(payslipRepository, never()).save(any());
        verifyNoInteractions(documentStorage);
    }

    @Test
    void storesAPayslipForAnEmployeeWithNoEmailButMarksItUnmailable() {
        employeeExists("R10102", "Bala N", "   ");

        PayslipUploadBatch batch =
                service.uploadBatch(SITE, null, "HRADMIN", List.of(pdf("R10102_Aug-2026.pdf")));

        PayslipUploadItem item = only(batch);
        assertEquals(PayslipParseStatus.EMPLOYEE_NO_EMAIL, item.getParseStatus());
        assertEquals("SKIPPED", item.getEmailStatus());
        assertNotNull(item.getPayslipHandle(), "it must still be downloadable in the app");
        assertEquals(1, batch.getMatchedCount());
        verify(payslipRepository).save(any());
    }

    @Test
    void rejectsANonPdfWithoutTouchingStorage() {
        MultipartFile xlsx = new MockMultipartFile(
                "files", "R10101_Aug-2026.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "x".getBytes());

        PayslipUploadBatch batch = service.uploadBatch(SITE, null, "HRADMIN", List.of(xlsx));

        assertEquals(PayslipParseStatus.NOT_A_PDF, only(batch).getParseStatus());
        verifyNoInteractions(documentStorage);
    }

    @Test
    void replacingAPayslipArchivesThePreviousRowRatherThanDeletingIt() {
        employeeExists("R10101", "Asha Rao", "asha@rits.com");
        Payslip existing = Payslip.builder()
                .handle("PS_OLD").site(SITE).employeeId("R10101")
                .payrollYear(2026).payrollMonth(8).active(1).source("UPLOADED")
                .fileId("gridfs-old").build();
        when(payslipRepository.findBySiteAndEmployeeIdAndPayrollYearAndPayrollMonthAndActive(
                SITE, "R10101", 2026, 8, 1)).thenReturn(Optional.of(existing));

        PayslipUploadBatch batch =
                service.uploadBatch(SITE, null, "HRADMIN", List.of(pdf("R10101_Aug-2026.pdf")));

        assertEquals(PayslipParseStatus.REPLACED_EXISTING, only(batch).getParseStatus());

        ArgumentCaptor<Payslip> saved = ArgumentCaptor.forClass(Payslip.class);
        verify(payslipRepository, times(2)).save(saved.capture());

        Payslip archived = saved.getAllValues().stream()
                .filter(p -> "PS_OLD".equals(p.getHandle())).findFirst().orElseThrow();
        assertEquals(0, archived.getActive(), "the old row is archived, not deleted");
        assertNotNull(archived.getSupersededBy());

        Payslip live = saved.getAllValues().stream()
                .filter(p -> !"PS_OLD".equals(p.getHandle())).findFirst().orElseThrow();
        assertEquals(1, live.getActive());
        assertEquals(archived.getSupersededBy(), live.getHandle());

        // The superseded blob is retained: the archived row still points at it.
        verify(documentStorage, never()).deleteFile(anyString());
    }

    @Test
    void oneBadFileDoesNotStopTheGoodOnesInTheSameBatch() {
        employeeExists("R10101", "Asha Rao", "asha@rits.com");
        employeeExists("R10103", "Chitra S", "chitra@rits.com");

        PayslipUploadBatch batch = service.uploadBatch(SITE, null, "HRADMIN", List.of(
                pdf("R10101_Aug-2026.pdf"),
                pdf("garbage.pdf"),
                pdf("R10103_Aug-2026.pdf")));

        assertEquals(3, batch.getTotalFiles());
        assertEquals(2, batch.getMatchedCount());
        assertEquals(1, batch.getSkippedCount());
        verify(payslipRepository, times(2)).save(any());
    }

    @Test
    void aSecondChunkAppendsToTheSameBatchRatherThanStartingANewOne() {
        employeeExists("R10101", "Asha Rao", "asha@rits.com");
        employeeExists("R10103", "Chitra S", "chitra@rits.com");

        PayslipUploadBatch first =
                service.uploadBatch(SITE, null, "HRADMIN", List.of(pdf("R10101_Aug-2026.pdf")));
        when(batchRepository.findById(first.getHandle())).thenReturn(Optional.of(first));

        PayslipUploadBatch second = service.uploadBatch(
                SITE, first.getHandle(), "HRADMIN", List.of(pdf("R10103_Aug-2026.pdf")));

        assertEquals(first.getHandle(), second.getHandle());
        assertEquals(2, second.getTotalFiles());
        assertEquals(2, second.getMatchedCount());
    }

    @Test
    void aBatchFromAnotherSiteIsNotReadable() {
        PayslipUploadBatch other = PayslipUploadBatch.builder()
                .handle("PUB_X").site("OTHER").active(1).build();
        when(batchRepository.findById("PUB_X")).thenReturn(Optional.of(other));

        assertThrows(RuntimeException.class, () -> service.getBatch(SITE, "PUB_X"));
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipUploadServiceTest"
```

Expected: FAIL — `PayslipUploadServiceImpl` does not exist.

- [ ] **Step 3: Write the minimal implementation**

Create `src/main/java/com/rits/hrmservice/payslip/service/PayslipUploadService.java`:

```java
package com.rits.hrmservice.payslip.service;

import com.rits.hrmservice.payslip.model.PayslipUploadBatch;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PayslipUploadService {

    /**
     * Ingests one chunk of files.
     *
     * @param batchHandle null to start a new batch; an existing handle to append. The browser
     *                    sends 25 files at a time against one handle so a 200-file month never
     *                    approaches the 50MB multipart request ceiling.
     */
    PayslipUploadBatch uploadBatch(String site, String batchHandle, String uploadedBy,
                                   List<MultipartFile> files);

    PayslipUploadBatch getBatch(String site, String handle);

    List<PayslipUploadBatch> getBatches(String site);
}
```

Create `src/main/java/com/rits/hrmservice/payslip/service/PayslipUploadServiceImpl.java`:

```java
package com.rits.hrmservice.payslip.service;

import com.rits.hrmservice.employee.model.Employee;
import com.rits.hrmservice.employee.repository.EmployeeRepository;
import com.rits.hrmservice.payslip.model.*;
import com.rits.hrmservice.payslip.repository.PayslipRepository;
import com.rits.hrmservice.payslip.repository.PayslipUploadBatchRepository;
import com.rits.hrmservice.shared.audit.service.AuditService;
import com.rits.hrmservice.shared.document.DocumentStorageService;
import com.rits.hrmservice.shared.exception.HrmException;
import com.rits.hrmservice.shared.tenant.TenantResolverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Turns a pile of HR-supplied PDFs into payslip rows, and tells HR about every file it could not
 * place.
 *
 * <p>Design rule, and the reason for the per-item status rather than an exception: a batch never
 * fails wholesale. One unparseable name out of 200 costs HR one correction, not one re-upload.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayslipUploadServiceImpl implements PayslipUploadService {

    private final PayslipRepository payslipRepository;
    private final PayslipUploadBatchRepository batchRepository;
    private final EmployeeRepository employeeRepository;
    private final DocumentStorageService documentStorage;
    private final AuditService auditService;
    private final TenantResolverService tenantResolver;

    private static final String MODULE = "PAYSLIP";

    @Override
    public PayslipUploadBatch uploadBatch(String site, String batchHandle, String uploadedBy,
                                          List<MultipartFile> files) {
        PayslipUploadBatch batch = batchHandle == null || batchHandle.isBlank()
                ? newBatch(site, uploadedBy)
                : getBatch(site, batchHandle);

        if (batch.getItems() == null) {
            batch.setItems(new ArrayList<>());
        }
        for (MultipartFile file : files == null ? List.<MultipartFile>of() : files) {
            batch.getItems().add(ingestOne(site, batch.getHandle(), uploadedBy, file));
        }

        batch.recomputeCounts();
        batch.setStatus("PARSED");
        batch.setModifiedDateTime(LocalDateTime.now());
        batchRepository.save(batch);

        auditService.logAction(site, MODULE, "PayslipUploadBatch", batch.getHandle(),
                "UPLOAD", uploadedBy, uploadedBy, null, null,
                "Payslip batch upload: " + batch.getMatchedCount() + " stored, "
                        + batch.getSkippedCount() + " skipped");
        return batch;
    }

    private PayslipUploadBatch newBatch(String site, String uploadedBy) {
        return PayslipUploadBatch.builder()
                .handle("PUB_" + site + "_" + System.currentTimeMillis())
                .site(site)
                .uploadedBy(uploadedBy)
                .uploadedAt(LocalDateTime.now())
                .status("PARSING")
                .items(new ArrayList<>())
                .active(1)
                .createdDateTime(LocalDateTime.now())
                .modifiedDateTime(LocalDateTime.now())
                .build();
    }

    private PayslipUploadItem ingestOne(String site, String batchId, String uploadedBy,
                                        MultipartFile file) {
        String fileName = file.getOriginalFilename();

        if (!isPdf(file)) {
            return reject(fileName, PayslipParseStatus.NOT_A_PDF,
                    "Only PDF files can be uploaded as payslips.");
        }

        Optional<ParsedPayslipFileName> parsed = PayslipFileNameParser.parse(fileName);
        if (parsed.isEmpty()) {
            return reject(fileName, PayslipParseStatus.BAD_FILENAME,
                    "File name must follow Rxxxxx_mmm-yyyy.pdf, for example R10101_Aug-2026.pdf.");
        }
        ParsedPayslipFileName p = parsed.get();

        String organizationId = tenantResolver.resolveOrgId(site).orElse(site);
        Optional<Employee> employee = employeeRepository
                .findByOrganizationIdAndEmployeeCodeAndActive(organizationId, p.employeeCode(), 1);
        if (employee.isEmpty()) {
            return reject(fileName, PayslipParseStatus.EMPLOYEE_NOT_FOUND,
                    "No active employee with code " + p.employeeCode() + " at this site.");
        }
        Employee emp = employee.get();
        boolean hasEmail = emp.getWorkEmail() != null && !emp.getWorkEmail().isBlank();

        String fileId;
        try {
            fileId = documentStorage.uploadFile(file, MODULE, batchId);
        } catch (Exception e) {
            log.error("PAYSLIP_UPLOAD_STORE_FAILED batch={} file={}", batchId, fileName, e);
            return reject(fileName, PayslipParseStatus.NOT_A_PDF,
                    "The file could not be stored: " + e.getMessage());
        }

        Optional<Payslip> existing = payslipRepository
                .findBySiteAndEmployeeIdAndPayrollYearAndPayrollMonthAndActive(
                        site, p.employeeCode(), p.year(), p.month(), 1);

        Payslip payslip = Payslip.builder()
                .handle("PS_" + site + "_" + p.employeeCode() + "_" + p.year() + p.month()
                        + "_" + System.nanoTime())
                .site(site)
                .source("UPLOADED")
                .employeeId(p.employeeCode())
                .employeeNumber(emp.getEmployeeCode())
                .employeeName(emp.getFullName())
                .department(emp.getDepartment())
                .designation(emp.getDesignation())
                .payrollYear(p.year())
                .payrollMonth(p.month())
                .payPeriodLabel(periodLabel(p.year(), p.month()))
                .statementType("PAYSLIP")
                .status("UPLOADED")
                .fileId(fileId)
                .fileName(fileName)
                .fileSizeBytes(file.getSize())
                .uploadBatchId(batchId)
                .emailStatus(hasEmail ? "NOT_SENT" : "SKIPPED")
                .generatedBy(uploadedBy)
                .generatedAt(LocalDateTime.now())
                .accessLog(new ArrayList<>())
                .active(1)
                .createdBy(uploadedBy)
                .createdDateTime(LocalDateTime.now())
                .modifiedDateTime(LocalDateTime.now())
                .build();

        PayslipParseStatus status = PayslipParseStatus.OK;
        if (existing.isPresent()) {
            Payslip old = existing.get();
            old.setActive(0);
            old.setSupersededBy(payslip.getHandle());
            old.setModifiedDateTime(LocalDateTime.now());
            old.setModifiedBy(uploadedBy);
            // The superseded blob is retained deliberately: the archived row still points at it,
            // so a wrong correction can be investigated rather than only regretted.
            payslipRepository.save(old);
            status = PayslipParseStatus.REPLACED_EXISTING;
        }
        if (!hasEmail) {
            status = PayslipParseStatus.EMPLOYEE_NO_EMAIL;
        }

        payslipRepository.save(payslip);

        return PayslipUploadItem.builder()
                .fileName(fileName)
                .parseStatus(status)
                .reason(status == PayslipParseStatus.REPLACED_EXISTING
                        ? "Replaced the payslip already held for this period."
                        : status == PayslipParseStatus.EMPLOYEE_NO_EMAIL
                            ? "Stored, but " + emp.getFullName() + " has no work email on record."
                            : null)
                .employeeCode(p.employeeCode())
                .employeeName(emp.getFullName())
                .workEmail(emp.getWorkEmail())
                .payrollYear(p.year())
                .payrollMonth(p.month())
                .payslipHandle(payslip.getHandle())
                .emailStatus(hasEmail ? "NOT_SENT" : "SKIPPED")
                .build();
    }

    private boolean isPdf(MultipartFile file) {
        String name = file.getOriginalFilename();
        boolean nameLooksPdf = name != null && name.strip().toLowerCase(Locale.ROOT).endsWith(".pdf");
        String type = file.getContentType();
        boolean typeLooksPdf = type == null || type.toLowerCase(Locale.ROOT).contains("pdf");
        return nameLooksPdf && typeLooksPdf;
    }

    private PayslipUploadItem reject(String fileName, PayslipParseStatus status, String reason) {
        return PayslipUploadItem.builder()
                .fileName(fileName)
                .parseStatus(status)
                .reason(reason)
                .build();
    }

    private String periodLabel(int year, int month) {
        return Month.of(month).getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + "-" + year;
    }

    @Override
    public PayslipUploadBatch getBatch(String site, String handle) {
        PayslipUploadBatch batch = batchRepository.findById(handle)
                .orElseThrow(() -> new HrmException("Upload batch not found: " + handle, "PAYSLIP_010"));
        if (!batch.getSite().equals(site)) {
            throw new HrmException("Upload batch does not belong to site: " + site, "PAYSLIP_008");
        }
        return batch;
    }

    @Override
    public List<PayslipUploadBatch> getBatches(String site) {
        return batchRepository.findBySiteAndActiveOrderByUploadedAtDesc(site, 1);
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipUploadServiceTest"
```

Expected: PASS, 9 tests. If `AuditService.logAction` has a different arity, match the call already used in `PayslipServiceImpl.createTemplate` rather than inventing one.

- [ ] **Step 5: Commit**

```bash
cd /home/senthil/Fenta/imes-upgrade
git add hrm-service/src/main/java/com/rits/hrmservice/payslip/service/PayslipUploadService.java \
        hrm-service/src/main/java/com/rits/hrmservice/payslip/service/PayslipUploadServiceImpl.java \
        hrm-service/src/test/java/com/rits/hrmservice/payslip/PayslipUploadServiceTest.java
git commit -m "feat(hrm-payslip): ingest uploaded payslip PDFs, reporting every file it cannot place"
```

---

### Task 4: Download an uploaded payslip

**Files:**
- Create: `src/main/java/com/rits/hrmservice/payslip/dto/PayslipFileBytes.java`
- Modify: `src/main/java/com/rits/hrmservice/payslip/service/PayslipUploadService.java`
- Modify: `src/main/java/com/rits/hrmservice/payslip/service/PayslipUploadServiceImpl.java`
- Test: `src/test/java/com/rits/hrmservice/payslip/PayslipUploadDownloadTest.java`

**Interfaces:**
- Consumes: `PayslipUploadServiceImpl` constructor from Task 3 (unchanged), `DocumentStorageService.downloadFile(String) -> Optional<GridFsResource>`.
- Produces:
  - `PayslipFileBytes(String fileName, String contentType, byte[] content)`
  - `PayslipUploadService.downloadUploaded(String site, String payslipHandle) -> PayslipFileBytes`
  - `PayslipUploadService.downloadUploadedForEmployee(String site, String employeeCode, int year, int month) -> PayslipFileBytes`
  Task 6 calls both.

- [ ] **Step 1: Write the failing test**

Create `src/test/java/com/rits/hrmservice/payslip/PayslipUploadDownloadTest.java`:

```java
package com.rits.hrmservice.payslip;

import com.rits.hrmservice.employee.repository.EmployeeRepository;
import com.rits.hrmservice.payslip.dto.PayslipFileBytes;
import com.rits.hrmservice.payslip.model.Payslip;
import com.rits.hrmservice.payslip.repository.PayslipRepository;
import com.rits.hrmservice.payslip.repository.PayslipUploadBatchRepository;
import com.rits.hrmservice.payslip.service.PayslipUploadServiceImpl;
import com.rits.hrmservice.shared.audit.service.AuditService;
import com.rits.hrmservice.shared.document.DocumentStorageService;
import com.rits.hrmservice.shared.tenant.TenantResolverService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.gridfs.GridFsResource;

import java.io.ByteArrayInputStream;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Reading a stored payslip back.
 *
 * <p>Bytes are fetched from GridFS only here — never while listing. Listing a month of payslips
 * must not drag 200 PDFs through memory; the asset module already learned that the expensive way.
 */
class PayslipUploadDownloadTest {

    private PayslipRepository payslipRepository;
    private DocumentStorageService documentStorage;
    private PayslipUploadServiceImpl service;

    private static final String SITE = "RITS";

    @BeforeEach
    void setUp() {
        payslipRepository = mock(PayslipRepository.class);
        documentStorage = mock(DocumentStorageService.class);
        service = new PayslipUploadServiceImpl(
                payslipRepository,
                mock(PayslipUploadBatchRepository.class),
                mock(EmployeeRepository.class),
                documentStorage,
                mock(AuditService.class),
                mock(TenantResolverService.class));
    }

    private Payslip uploaded() {
        return Payslip.builder()
                .handle("PS_1").site(SITE).source("UPLOADED")
                .employeeId("R10101").payrollYear(2026).payrollMonth(8)
                .fileId("gridfs-1").fileName("R10101_Aug-2026.pdf").active(1)
                .build();
    }

    private void gridFsHolds(byte[] bytes) {
        GridFsResource resource = mock(GridFsResource.class);
        try {
            when(resource.getInputStream()).thenReturn(new ByteArrayInputStream(bytes));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
        when(documentStorage.downloadFile("gridfs-1")).thenReturn(Optional.of(resource));
    }

    @Test
    void returnsTheStoredBytesWithTheOriginalFileName() {
        when(payslipRepository.findById("PS_1")).thenReturn(Optional.of(uploaded()));
        gridFsHolds("%PDF-1.4 body".getBytes());

        PayslipFileBytes file = service.downloadUploaded(SITE, "PS_1");

        assertEquals("R10101_Aug-2026.pdf", file.fileName());
        assertEquals("application/pdf", file.contentType());
        assertArrayEquals("%PDF-1.4 body".getBytes(), file.content());
    }

    @Test
    void findsAPayslipByEmployeeAndPeriodForSelfService() {
        when(payslipRepository.findBySiteAndEmployeeIdAndPayrollYearAndPayrollMonthAndActive(
                SITE, "R10101", 2026, 8, 1)).thenReturn(Optional.of(uploaded()));
        gridFsHolds("%PDF".getBytes());

        assertEquals("R10101_Aug-2026.pdf",
                service.downloadUploadedForEmployee(SITE, "R10101", 2026, 8).fileName());
    }

    @Test
    void refusesAPayslipBelongingToAnotherSite() {
        Payslip other = uploaded();
        other.setSite("OTHER");
        when(payslipRepository.findById("PS_1")).thenReturn(Optional.of(other));

        assertThrows(RuntimeException.class, () -> service.downloadUploaded(SITE, "PS_1"));
        verifyNoInteractions(documentStorage);
    }

    @Test
    void refusesAGeneratedPayslipWhichHasNoStoredFile() {
        Payslip generated = uploaded();
        generated.setSource("GENERATED");
        generated.setFileId(null);
        when(payslipRepository.findById("PS_1")).thenReturn(Optional.of(generated));

        assertThrows(RuntimeException.class, () -> service.downloadUploaded(SITE, "PS_1"));
    }

    @Test
    void reportsAMissingBlobRatherThanReturningAnEmptyPdf() {
        when(payslipRepository.findById("PS_1")).thenReturn(Optional.of(uploaded()));
        when(documentStorage.downloadFile("gridfs-1")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> service.downloadUploaded(SITE, "PS_1"));
    }

    @Test
    void recordsTheDownloadInTheAccessLog() {
        Payslip payslip = uploaded();
        when(payslipRepository.findById("PS_1")).thenReturn(Optional.of(payslip));
        gridFsHolds("%PDF".getBytes());

        service.downloadUploaded(SITE, "PS_1");

        verify(payslipRepository).save(argThat(p ->
                p.getAccessLog() != null && p.getAccessLog().size() == 1));
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipUploadDownloadTest"
```

Expected: FAIL — `downloadUploaded` is not defined.

- [ ] **Step 3: Write the minimal implementation**

Create `src/main/java/com/rits/hrmservice/payslip/dto/PayslipFileBytes.java`:

```java
package com.rits.hrmservice.payslip.dto;

/** A stored payslip PDF on its way to the browser. Never held for more than one request. */
public record PayslipFileBytes(String fileName, String contentType, byte[] content) {
}
```

Add to `PayslipUploadService`:

```java
    /** Bytes for one uploaded payslip. Callers must have already authorised the read. */
    PayslipFileBytes downloadUploaded(String site, String payslipHandle);

    /** Bytes for an employee's payslip in one period — the self-service path. */
    PayslipFileBytes downloadUploadedForEmployee(String site, String employeeCode,
                                                 int year, int month);
```

(with `import com.rits.hrmservice.payslip.dto.PayslipFileBytes;`)

Add to `PayslipUploadServiceImpl`:

```java
    @Override
    public PayslipFileBytes downloadUploaded(String site, String payslipHandle) {
        Payslip payslip = payslipRepository.findById(payslipHandle)
                .orElseThrow(() -> new HrmException("Payslip not found: " + payslipHandle, "PAYSLIP_006"));
        return readFile(site, payslip);
    }

    @Override
    public PayslipFileBytes downloadUploadedForEmployee(String site, String employeeCode,
                                                        int year, int month) {
        Payslip payslip = payslipRepository
                .findBySiteAndEmployeeIdAndPayrollYearAndPayrollMonthAndActive(
                        site, employeeCode, year, month, 1)
                .orElseThrow(() -> new HrmException(
                        "No payslip for " + employeeCode + " in " + periodLabel(year, month),
                        "PAYSLIP_006"));
        return readFile(site, payslip);
    }

    /**
     * The only place GridFS bytes are read. Listing endpoints never call this — a month of
     * payslips is 200 PDFs, and the asset module already paid for learning that lesson.
     */
    private PayslipFileBytes readFile(String site, Payslip payslip) {
        if (!site.equals(payslip.getSite())) {
            throw new HrmException("Payslip does not belong to site: " + site, "PAYSLIP_008");
        }
        if (payslip.getFileId() == null || payslip.getFileId().isBlank()) {
            throw new HrmException(
                    "This payslip was generated, not uploaded, and has no stored file.", "PAYSLIP_011");
        }
        GridFsResource resource = documentStorage.downloadFile(payslip.getFileId())
                .orElseThrow(() -> new HrmException(
                        "The stored payslip file is missing: " + payslip.getFileId(), "PAYSLIP_012"));

        byte[] content;
        try (InputStream in = resource.getInputStream()) {
            content = in.readAllBytes();
        } catch (IOException e) {
            throw new HrmException("The payslip file could not be read: " + e.getMessage(), "PAYSLIP_012");
        }

        if (payslip.getAccessLog() == null) {
            payslip.setAccessLog(new ArrayList<>());
        }
        payslip.getAccessLog().add(PayslipAccessLog.builder()
                .accessedBy(payslip.getEmployeeId())
                .accessType("DOWNLOAD")
                .accessedAt(LocalDateTime.now())
                .build());
        payslipRepository.save(payslip);

        return new PayslipFileBytes(payslip.getFileName(), "application/pdf", content);
    }
```

Add imports to the impl: `com.rits.hrmservice.payslip.dto.PayslipFileBytes`, `org.springframework.data.mongodb.gridfs.GridFsResource`, `java.io.IOException`, `java.io.InputStream`.

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipUploadDownloadTest"
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Verify the GridFS round-trip for real**

`DocumentStorageService.downloadFile` matches on `Criteria.where("_id").is(fileId)` with a **String**, while GridFS stores `_id` as an **ObjectId**. The User Guide module uses the same call, so it is expected to work — but a unit test with a mocked storage service cannot prove it. Verify against a running stack before trusting it:

```bash
# with hrm-service running locally
curl -s -X POST http://localhost:8080/app/v1/hrm-service/payslip/uploadPayslipBatch \
  -F organizationId=RITS -F uploadedBy=HRADMIN -F files=@R10101_Aug-2026.pdf | head -40
```

Then call `downloadUploadedPayslip` (Task 6) for the returned handle and confirm real PDF bytes come back. **If it returns "The stored payslip file is missing"**, fix `DocumentStorageService.downloadFile` to use `new ObjectId(fileId)` in the criteria — that fixes User Guide downloads at the same time, and is a one-line change worth its own commit.

- [ ] **Step 6: Commit**

```bash
cd /home/senthil/Fenta/imes-upgrade
git add hrm-service/src/main/java/com/rits/hrmservice/payslip/dto/PayslipFileBytes.java \
        hrm-service/src/main/java/com/rits/hrmservice/payslip/service/ \
        hrm-service/src/test/java/com/rits/hrmservice/payslip/PayslipUploadDownloadTest.java
git commit -m "feat(hrm-payslip): read an uploaded payslip's bytes, on open only"
```

---

### Task 5: Payslip permissions — a server-side gate that actually exists

Today **no payslip endpoint checks a permission** beyond self-service; the UI gate is the only gate. The new upload endpoints must not extend that.

**Files:**
- Create: `src/main/java/com/rits/hrmservice/payslip/service/PayslipPermission.java`
- Create: `src/main/java/com/rits/hrmservice/payslip/service/PayslipAccessService.java`
- Test: `src/test/java/com/rits/hrmservice/payslip/PayslipPermissionTest.java`

**Interfaces:**
- Consumes: `RbacService.getEffectivePermissions(String site, Collection<String> identities)` returning `EffectivePermissionsResponse` with `getPermissions()` of `EffectivePermissionEntry{getModuleCode(), getObjectName(), getAction()}` — the same API `AnnouncementAccessService.heldCodes` uses. Read that method before writing this one and mirror it exactly.
- Produces: `PayslipPermission` enum, and `PayslipAccessService.has(site, actor, permission) -> boolean` / `.require(site, actor, permission)`. Task 6 calls `require`.

- [ ] **Step 1: Write the failing test**

Create `src/test/java/com/rits/hrmservice/payslip/PayslipPermissionTest.java`:

```java
package com.rits.hrmservice.payslip;

import com.rits.hrmservice.payslip.service.PayslipPermission;
import com.rits.hrmservice.rbac.model.PermissionAction;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The coordinates each payslip capability occupies in HRM's (module, object, action) RBAC model.
 *
 * <p>These are pinned because they are invisible at runtime until someone is wrongly denied — and
 * because every object named here must already exist in DefaultModuleRegistry. Inventing a new
 * object code would silently deny everyone: an object absent from the registry is not grantable,
 * and useCan returns EMPTY for an object it cannot find.
 */
class PayslipPermissionTest {

    /** Exactly the objects DefaultModuleRegistry.java:166 seeds for HRM_PAYSLIP. */
    private static final java.util.Set<String> REGISTERED = java.util.Set.of(
            "payslip_module", "payslip_record", "payslip_generate",
            "payslip_repository", "payslip_template", "payslip_history", "payslip_download");

    @Test
    void everyPermissionNamesAnObjectThatIsActuallySeeded() {
        for (PayslipPermission p : PayslipPermission.values()) {
            assertTrue(REGISTERED.contains(p.objectName()),
                    p + " names " + p.objectName() + ", which is not in the module registry");
        }
    }

    @Test
    void uploadingIsAnAddOnTheRepositoryObject() {
        assertEquals("payslip_repository", PayslipPermission.UPLOAD.objectName());
        assertEquals(PermissionAction.ADD, PayslipPermission.UPLOAD.action());
    }

    @Test
    void viewingTheRepositoryAndItsHistoryIsAViewOnTheRepositoryObject() {
        assertEquals("payslip_repository", PayslipPermission.VIEW_REPOSITORY.objectName());
        assertEquals(PermissionAction.VIEW, PayslipPermission.VIEW_REPOSITORY.action());
    }

    @Test
    void hrDownloadingSomeoneElsesPayslipIsItsOwnPrivilege() {
        // Deliberately NOT the same grant as viewing the list: seeing that a payslip exists and
        // reading its contents are different things.
        assertEquals("payslip_download", PayslipPermission.DOWNLOAD_ANY.objectName());
        assertEquals(PermissionAction.VIEW, PayslipPermission.DOWNLOAD_ANY.action());
    }

    @Test
    void everyPermissionCodeIsUniqueAndNamespaced() {
        long distinct = Arrays.stream(PayslipPermission.values())
                .map(PayslipPermission::code).distinct().count();
        assertEquals(PayslipPermission.values().length, distinct);
        for (PayslipPermission p : PayslipPermission.values()) {
            assertTrue(p.code().startsWith("PAYSLIP_"), p + " code must be namespaced");
        }
    }

    @Test
    void theRootObjectIsTheModuleAccessRow() {
        assertEquals("payslip_module", PayslipPermission.ROOT_OBJECT);
        assertEquals("HRM_PAYSLIP", PayslipPermission.MODULE_CODE);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipPermissionTest"
```

Expected: FAIL — `PayslipPermission` does not exist.

- [ ] **Step 3: Write the minimal implementation**

Create `src/main/java/com/rits/hrmservice/payslip/service/PayslipPermission.java`:

```java
package com.rits.hrmservice.payslip.service;

import com.rits.hrmservice.rbac.model.PermissionAction;

/**
 * The payslip module's named permissions as coordinates in HRM's (module, object, action) RBAC
 * model — the same approach the announcement module takes, so granting one is the ordinary matrix
 * operation an administrator already knows.
 *
 * <p>Every object named here is already seeded by DefaultModuleRegistry. Nothing new is invented:
 * an object missing from the registry is not grantable, and the frontend's useCan denies any
 * object it cannot find.
 */
public enum PayslipPermission {

    /** Upload a batch of payslip PDFs. */
    UPLOAD("PAYSLIP_UPLOAD", "payslip_repository", PermissionAction.ADD),

    /** See the repository, the upload history and the error report. */
    VIEW_REPOSITORY("PAYSLIP_VIEW_REPOSITORY", "payslip_repository", PermissionAction.VIEW),

    /** Act on a batch — Phase B's send and re-send. */
    MANAGE_REPOSITORY("PAYSLIP_MANAGE_REPOSITORY", "payslip_repository", PermissionAction.EDIT),

    /** Download a payslip belonging to someone else. Not implied by seeing the list. */
    DOWNLOAD_ANY("PAYSLIP_DOWNLOAD_ANY", "payslip_download", PermissionAction.VIEW);

    public static final String MODULE_CODE = "HRM_PAYSLIP";

    /**
     * "Module Access" in the RBAC matrix. A grant here carries the same action across the module,
     * matching the convention every HRM screen already gates on.
     */
    public static final String ROOT_OBJECT = "payslip_module";

    private final String code;
    private final String objectName;
    private final PermissionAction action;

    PayslipPermission(String code, String objectName, PermissionAction action) {
        this.code = code;
        this.objectName = objectName;
        this.action = action;
    }

    public String code() {
        return code;
    }

    public String objectName() {
        return objectName;
    }

    public PermissionAction action() {
        return action;
    }
}
```

Create `src/main/java/com/rits/hrmservice/payslip/service/PayslipAccessService.java`. **Open `announcement/service/AnnouncementAccessService.java` and mirror `heldCodes`, `identitiesFor` and `key` exactly** — including the fail-closed catch that denies on a lookup error:

```java
package com.rits.hrmservice.payslip.service;

import com.rits.hrmservice.rbac.service.RbacService;
import com.rits.hrmservice.shared.exception.HrmException;
import com.rits.hrmservice.shared.util.EmployeeIdentityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Server-side permission checks for the payslip module.
 *
 * <p>Before this class the module had none: the only server-side guard on any payslip endpoint was
 * assertSelfService, so a UI gate was the whole of the access control. Upload does not inherit
 * that, because an HTTP client that skips the screen would otherwise skip the check.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayslipAccessService {

    private final RbacService rbacService;

    public boolean has(String site, String actor, PayslipPermission permission) {
        String actorCode = EmployeeIdentityUtils.parseCode(actor);
        if (site == null || actorCode == null || actorCode.isBlank() || permission == null) {
            return false;
        }
        Set<String> held = heldCodes(site, actorCode);
        return held.contains(key(permission.objectName(), permission.action().name()))
                || held.contains(key(PayslipPermission.ROOT_OBJECT, permission.action().name()));
    }

    public void require(String site, String actor, PayslipPermission permission) {
        if (has(site, actor, permission)) {
            return;
        }
        log.warn("[payslip-rbac] DENIED site={} actor={} permission={}", site, actor, permission.code());
        throw new HrmException(
                "You do not have permission to perform this action (" + permission.code() + ")",
                "PAYSLIP_403");
    }

    private String key(String objectName, String action) {
        return objectName.toLowerCase(Locale.ROOT) + "|" + action;
    }

    private Set<String> heldCodes(String site, String employeeCode) {
        try {
            var effective = rbacService.getEffectivePermissions(site, Set.of(employeeCode));
            if (effective == null || effective.getPermissions() == null) {
                return Set.of();
            }
            Set<String> held = new LinkedHashSet<>();
            effective.getPermissions().forEach(entry -> {
                if (PayslipPermission.MODULE_CODE.equalsIgnoreCase(entry.getModuleCode())
                        && entry.getObjectName() != null && entry.getAction() != null) {
                    held.add(key(entry.getObjectName(), entry.getAction().name()));
                }
            });
            return held;
        } catch (Exception e) {
            // Fail closed: an unavailable RBAC lookup denies rather than waves through.
            log.warn("Payslip permission lookup failed for {} at site {} — denying: {}",
                    employeeCode, site, e.getMessage());
            return Set.of();
        }
    }
}
```

**Before running:** confirm `rbacService.getEffectivePermissions` takes `(String, Collection<String>)` and that `AnnouncementAccessService.identitiesFor` does not do extra identity expansion this needs. If it does, mirror it here rather than passing a bare `Set.of(employeeCode)`.

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipPermissionTest"
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
cd /home/senthil/Fenta/imes-upgrade
git add hrm-service/src/main/java/com/rits/hrmservice/payslip/service/PayslipPermission.java \
        hrm-service/src/main/java/com/rits/hrmservice/payslip/service/PayslipAccessService.java \
        hrm-service/src/test/java/com/rits/hrmservice/payslip/PayslipPermissionTest.java
git commit -m "feat(hrm-payslip): server-side permission checks for the payslip repository"
```

---

### Task 6: Upload controller

**Files:**
- Create: `src/main/java/com/rits/hrmservice/payslip/controller/PayslipUploadController.java`
- Test: `src/test/java/com/rits/hrmservice/payslip/PayslipUploadControllerTest.java`

**Interfaces:**
- Consumes: `PayslipUploadService` (Tasks 3–4), `PayslipAccessService.require` (Task 5), `PayslipService.assertSelfService(site, callerUserId, employeeId)` (existing), `TenantResolverService.resolveToSite`.
- Produces: the six endpoints listed in the spec. Task 8 (frontend service) calls them.

- [ ] **Step 1: Write the failing test**

Create `src/test/java/com/rits/hrmservice/payslip/PayslipUploadControllerTest.java`:

```java
package com.rits.hrmservice.payslip;

import com.rits.hrmservice.payslip.controller.PayslipUploadController;
import com.rits.hrmservice.payslip.dto.PayslipFileBytes;
import com.rits.hrmservice.payslip.model.PayslipUploadBatch;
import com.rits.hrmservice.payslip.service.*;
import com.rits.hrmservice.shared.tenant.TenantResolverService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Wiring, and the two things that must never be skipped on the way in: site resolution and the
 * permission check. An upload endpoint that trusts the screen is not access-controlled at all.
 */
class PayslipUploadControllerTest {

    private PayslipUploadService uploadService;
    private PayslipAccessService accessService;
    private PayslipService payslipService;
    private TenantResolverService tenantResolver;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        uploadService = mock(PayslipUploadService.class);
        accessService = mock(PayslipAccessService.class);
        payslipService = mock(PayslipService.class);
        tenantResolver = mock(TenantResolverService.class);
        when(tenantResolver.resolveToSite(anyString(), any())).thenReturn("RITS");
        when(uploadService.uploadBatch(anyString(), any(), anyString(), anyList()))
                .thenReturn(PayslipUploadBatch.builder().handle("PUB_1").site("RITS").build());

        mvc = MockMvcBuilders.standaloneSetup(new PayslipUploadController(
                uploadService, accessService, payslipService, tenantResolver)).build();
    }

    @Test
    void uploadRequiresTheUploadPermissionBeforeStoringAnything() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "files", "R10101_Aug-2026.pdf", "application/pdf", "%PDF".getBytes());

        mvc.perform(multipart("/app/v1/hrm-service/payslip/uploadPayslipBatch")
                        .file(file)
                        .param("organizationId", "RITS")
                        .param("uploadedBy", "HRADMIN"))
                .andExpect(status().isOk());

        InOrder order = inOrder(accessService, uploadService);
        order.verify(accessService).require("RITS", "HRADMIN", PayslipPermission.UPLOAD);
        order.verify(uploadService).uploadBatch(eq("RITS"), isNull(), eq("HRADMIN"), anyList());
    }

    @Test
    void batchHistoryRequiresTheViewPermission() throws Exception {
        mvc.perform(post("/app/v1/hrm-service/payslip/getUploadBatches")
                        .contentType("application/json")
                        .content("{\"organizationId\":\"RITS\",\"requestedBy\":\"HRADMIN\"}"))
                .andExpect(status().isOk());

        verify(accessService).require("RITS", "HRADMIN", PayslipPermission.VIEW_REPOSITORY);
    }

    @Test
    void anEmployeeDownloadingTheirOwnPayslipGoesThroughTheSelfServiceGuard() throws Exception {
        when(uploadService.downloadUploadedForEmployee("RITS", "R10101", 2026, 8))
                .thenReturn(new PayslipFileBytes("R10101_Aug-2026.pdf", "application/pdf", "%PDF".getBytes()));

        mvc.perform(post("/app/v1/hrm-service/payslip/downloadUploadedPayslip")
                        .header("X-User-ID", "asha")
                        .contentType("application/json")
                        .content("{\"organizationId\":\"RITS\",\"employeeId\":\"R10101\","
                                + "\"payrollYear\":2026,\"payrollMonth\":8}"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"));

        verify(payslipService).assertSelfService("RITS", "asha", "R10101");
        // Self-service must NOT require an RBAC grant — an employee holds no payslip permissions.
        verify(accessService, never()).require(anyString(), anyString(), any());
    }

    @Test
    void hrDownloadingByHandleRequiresTheDownloadAnyPermission() throws Exception {
        when(uploadService.downloadUploaded("RITS", "PS_1"))
                .thenReturn(new PayslipFileBytes("R10101_Aug-2026.pdf", "application/pdf", "%PDF".getBytes()));

        mvc.perform(post("/app/v1/hrm-service/payslip/downloadUploadedPayslip")
                        .contentType("application/json")
                        .content("{\"organizationId\":\"RITS\",\"handle\":\"PS_1\","
                                + "\"requestedBy\":\"HRADMIN\"}"))
                .andExpect(status().isOk());

        verify(accessService).require("RITS", "HRADMIN", PayslipPermission.DOWNLOAD_ANY);
        verify(payslipService, never()).assertSelfService(anyString(), any(), anyString());
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipUploadControllerTest"
```

Expected: FAIL — `PayslipUploadController` does not exist.

- [ ] **Step 3: Write the minimal implementation**

Create `src/main/java/com/rits/hrmservice/payslip/controller/PayslipUploadController.java`:

```java
package com.rits.hrmservice.payslip.controller;

import com.rits.hrmservice.payslip.dto.PayslipFileBytes;
import com.rits.hrmservice.payslip.model.PayslipUploadBatch;
import com.rits.hrmservice.payslip.service.PayslipAccessService;
import com.rits.hrmservice.payslip.service.PayslipPermission;
import com.rits.hrmservice.payslip.service.PayslipService;
import com.rits.hrmservice.payslip.service.PayslipUploadService;
import com.rits.hrmservice.shared.dto.MessageModel;
import com.rits.hrmservice.shared.tenant.TenantResolverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * The upload-side half of the payslip module. Kept separate from PayslipController so neither file
 * grows into the other's business: that one generates from payroll, this one ingests HR's PDFs.
 */
@Slf4j
@RestController
@RequestMapping("app/v1/hrm-service/payslip")
@RequiredArgsConstructor
public class PayslipUploadController {

    private final PayslipUploadService uploadService;
    private final PayslipAccessService accessService;
    private final PayslipService payslipService;
    private final TenantResolverService tenantResolver;

    @PostMapping("/uploadPayslipBatch")
    public ResponseEntity<MessageModel> uploadBatch(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("organizationId") String organizationId,
            @RequestParam("uploadedBy") String uploadedBy,
            @RequestParam(value = "batchHandle", required = false) String batchHandle) {

        String site = tenantResolver.resolveToSite(organizationId, null);
        accessService.require(site, uploadedBy, PayslipPermission.UPLOAD);

        log.info("uploadPayslipBatch: site={}, files={}, batch={}", site, files.size(), batchHandle);
        PayslipUploadBatch batch = uploadService.uploadBatch(site, batchHandle, uploadedBy, files);

        return ResponseEntity.ok(MessageModel.builder()
                .site(site)
                .handle(batch.getHandle())
                .message_details(Map.of(
                        "msg", batch.getMatchedCount() + " stored, " + batch.getSkippedCount() + " skipped",
                        "msg_type", "S"))
                .response(batch)
                .build());
    }

    @PostMapping("/getUploadBatch")
    public ResponseEntity<MessageModel> getBatch(@RequestBody Map<String, String> body) {
        String site = tenantResolver.resolveToSite(body.get("organizationId"), body.get("site"));
        accessService.require(site, body.get("requestedBy"), PayslipPermission.VIEW_REPOSITORY);
        return ResponseEntity.ok(MessageModel.builder()
                .response(uploadService.getBatch(site, body.get("handle"))).build());
    }

    @PostMapping("/getUploadBatches")
    public ResponseEntity<MessageModel> getBatches(@RequestBody Map<String, String> body) {
        String site = tenantResolver.resolveToSite(body.get("organizationId"), body.get("site"));
        accessService.require(site, body.get("requestedBy"), PayslipPermission.VIEW_REPOSITORY);
        return ResponseEntity.ok(MessageModel.builder()
                .response(uploadService.getBatches(site)).build());
    }

    /**
     * Returns raw PDF bytes rather than a MessageModel — the one deliberate exception to the
     * module's envelope convention. Base64 in JSON would inflate every payslip download for
     * nothing.
     *
     * <p>Two callers, two different guards: an employee asking for their own payslip
     * (employeeId + period) is authorised by assertSelfService and needs no RBAC grant, because
     * employees hold none. HR asking by handle needs DOWNLOAD_ANY.
     */
    @PostMapping("/downloadUploadedPayslip")
    public ResponseEntity<byte[]> download(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-ID", required = false) String callerUserId) {

        String site = tenantResolver.resolveToSite((String) body.get("organizationId"),
                (String) body.get("site"));
        String handle = (String) body.get("handle");

        PayslipFileBytes file;
        if (handle != null && !handle.isBlank()) {
            accessService.require(site, (String) body.get("requestedBy"),
                    PayslipPermission.DOWNLOAD_ANY);
            file = uploadService.downloadUploaded(site, handle);
        } else {
            String employeeId = (String) body.get("employeeId");
            payslipService.assertSelfService(site, callerUserId, employeeId);
            file = uploadService.downloadUploadedForEmployee(site, employeeId,
                    asInt(body.get("payrollYear")), asInt(body.get("payrollMonth")));
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + file.fileName() + "\"")
                .body(file.content());
    }

    private int asInt(Object value) {
        return value instanceof Integer i ? i : Integer.parseInt(String.valueOf(value));
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipUploadControllerTest"
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Verify the whole backend still builds and every payslip test passes**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="Payslip*Test"
```

Expected: PASS. `PayslipCtcLifecycleTestCase` is excluded by the `*Test` pattern — that is intentional, it needs a running server.

- [ ] **Step 6: Commit**

```bash
cd /home/senthil/Fenta/imes-upgrade
git add hrm-service/src/main/java/com/rits/hrmservice/payslip/controller/PayslipUploadController.java \
        hrm-service/src/test/java/com/rits/hrmservice/payslip/PayslipUploadControllerTest.java
git commit -m "feat(hrm-payslip): batch upload, history and download endpoints"
```

---

### Task 7: Show the source on existing payslip lists

`getMyPayslips` and `searchPayslips` must return uploaded rows too, each labelled, so the frontend knows which download path to use.

**Files:**
- Modify: `src/main/java/com/rits/hrmservice/payslip/dto/PayslipListResponse.java`
- Create: `src/main/java/com/rits/hrmservice/payslip/service/PayslipListMapper.java`
- Modify: `src/main/java/com/rits/hrmservice/payslip/service/PayslipServiceImpl.java` (`mapToListResponse`, line ~818)
- Test: `src/test/java/com/rits/hrmservice/payslip/PayslipListSourceTest.java`

**Interfaces:**
- Consumes: `Payslip.getSource()` / `getFileName()` (Task 2).
- Produces: `PayslipListResponse.source` and `.fileName`, plus `PayslipListMapper.toListResponse(Payslip) -> PayslipListResponse`. Task 8's `PayslipListItem` type mirrors the DTO.

The mapping moves out of `PayslipServiceImpl` (833 lines) into its own class. It uses no instance state, it is the thing under test here, and a private method inside an already-large service is reachable only by reflection — which is a signal the boundary is in the wrong place, not a reason to write a reflective test.

- [ ] **Step 1: Write the failing test**

Create `src/test/java/com/rits/hrmservice/payslip/PayslipListSourceTest.java`:

```java
package com.rits.hrmservice.payslip;

import com.rits.hrmservice.payslip.dto.PayslipListResponse;
import com.rits.hrmservice.payslip.model.Payslip;
import com.rits.hrmservice.payslip.service.PayslipListMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * A list row must say where its payslip came from, because the two sources are downloaded by
 * different routes — bytes for an uploaded PDF, a rendered snapshot for a generated one.
 *
 * <p>The absent-means-GENERATED rule is what removes the need for a backfill migration, so it is
 * pinned here rather than left as a comment.
 */
class PayslipListSourceTest {

    @Test
    void anUploadedRowReportsItsSourceAndFileName() {
        PayslipListResponse row = PayslipListMapper.toListResponse(Payslip.builder()
                .handle("PS_1").source("UPLOADED").fileName("R10101_Aug-2026.pdf")
                .employeeId("R10101").payrollYear(2026).payrollMonth(8).build());

        assertEquals("UPLOADED", row.getSource());
        assertEquals("R10101_Aug-2026.pdf", row.getFileName());
    }

    @Test
    void aRowWrittenBeforeThisFeatureReadsAsGenerated() {
        // Every pre-existing payslip row has no source field. Absent must mean GENERATED, which
        // is what they all are -- this is why there is no migration.
        Payslip legacy = Payslip.builder().handle("PS_OLD").employeeId("R10101").build();
        assertNull(legacy.getSource());
    }

    @Test
    void aGeneratedRowHasNoFileName() {
        PayslipListResponse row = PayslipListMapper.toListResponse(Payslip.builder()
                .handle("PS_2").source("GENERATED").employeeId("R10101").build());

        assertEquals("GENERATED", row.getSource());
        assertNull(row.getFileName());
    }

    @Test
    void aRowWithNoSourceIsMappedAsGeneratedRatherThanNull() {
        // The absent-means-GENERATED rule has to hold at the boundary the UI reads, or every
        // pre-existing payslip arrives with source undefined and the download branch guesses.
        PayslipListResponse row = PayslipListMapper.toListResponse(
                Payslip.builder().handle("PS_OLD").employeeId("R10101").build());

        assertEquals("GENERATED", row.getSource());
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipListSourceTest"
```

Expected: FAIL — `PayslipListMapper` does not exist.

- [ ] **Step 3: Write the minimal implementation**

Add to `PayslipListResponse`:

```java
    /** GENERATED or UPLOADED. Absent on rows written before the repository feature. */
    private String source;

    /** The uploaded file's original name. Null for a generated payslip. */
    private String fileName;
```

Create `src/main/java/com/rits/hrmservice/payslip/service/PayslipListMapper.java`, moving the body of the existing private `mapToListResponse` into it:

```java
package com.rits.hrmservice.payslip.service;

import com.rits.hrmservice.payslip.dto.PayslipListResponse;
import com.rits.hrmservice.payslip.model.Payslip;

/**
 * Payslip row -> list DTO. Extracted from PayslipServiceImpl because it holds no instance state
 * and because the source-labelling rule below is worth testing directly.
 */
public final class PayslipListMapper {

    private PayslipListMapper() {}

    public static PayslipListResponse toListResponse(Payslip payslip) {
        return PayslipListResponse.builder()
                .handle(payslip.getHandle())
                .employeeId(payslip.getEmployeeId())
                .employeeNumber(payslip.getEmployeeNumber())
                .employeeName(payslip.getEmployeeName())
                .department(payslip.getDepartment())
                .designation(payslip.getDesignation())
                .payPeriodLabel(payslip.getPayPeriodLabel())
                .payrollYear(payslip.getPayrollYear())
                .payrollMonth(payslip.getPayrollMonth())
                .generatedAt(payslip.getGeneratedAt())
                .status(payslip.getStatus())
                // Absent means GENERATED: every row written before the repository feature is one.
                // Normalising here means no consumer has to know that, and no migration is needed.
                .source(payslip.getSource() == null ? "GENERATED" : payslip.getSource())
                .fileName(payslip.getFileName())
                .build();
    }
}
```

In `PayslipServiceImpl`, delete the private `mapToListResponse` method (line ~818) and replace its three `this::mapToListResponse` references with `PayslipListMapper::toListResponse`. Find them with:

```bash
grep -n "mapToListResponse" hrm-service/src/main/java/com/rits/hrmservice/payslip/service/PayslipServiceImpl.java
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /home/senthil/Fenta/imes-upgrade && mvn -pl hrm-service test -Dtest="PayslipListSourceTest"
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
cd /home/senthil/Fenta/imes-upgrade
git add hrm-service/src/main/java/com/rits/hrmservice/payslip/dto/PayslipListResponse.java \
        hrm-service/src/main/java/com/rits/hrmservice/payslip/service/PayslipListMapper.java \
        hrm-service/src/main/java/com/rits/hrmservice/payslip/service/PayslipServiceImpl.java \
        hrm-service/src/test/java/com/rits/hrmservice/payslip/PayslipListSourceTest.java
git commit -m "feat(hrm-payslip): label list rows with their payslip source"
```

---

### Task 8: Frontend types and service methods

**Files:**
- Modify: `src/modules/hrmPayslip/types/domain.types.ts`
- Modify: `src/modules/hrmPayslip/types/api.types.ts`
- Modify: `src/modules/hrmPayslip/types/ui.types.ts`
- Modify: `src/modules/hrmPayslip/services/payslipService.ts`

**Interfaces:**
- Consumes: the endpoints from Task 6, and `PayslipListResponse.source`/`.fileName` from Task 7.
- Produces: types `PayslipSource`, `PayslipParseStatus`, `PayslipUploadItem`, `PayslipUploadBatch`; `PayslipTabKey` gains `"upload"` and `"uploadHistory"`; `PayslipListItem` gains `source` and `fileName`; service methods `uploadPayslipBatch`, `getUploadBatch`, `getUploadBatches`, `downloadUploadedPayslip`. Tasks 9–13 consume these.

- [ ] **Step 1: Add the domain types**

In `src/modules/hrmPayslip/types/domain.types.ts`, add:

```ts
export type PayslipSource = "GENERATED" | "UPLOADED";

export type PayslipParseStatus =
  | "OK"
  | "REPLACED_EXISTING"
  | "EMPLOYEE_NO_EMAIL"
  | "BAD_FILENAME"
  | "EMPLOYEE_NOT_FOUND"
  | "NOT_A_PDF";

export interface PayslipUploadItem {
  fileName: string;
  parseStatus: PayslipParseStatus;
  reason: string | null;
  employeeCode: string | null;
  employeeName: string | null;
  workEmail: string | null;
  payrollYear: number | null;
  payrollMonth: number | null;
  payslipHandle: string | null;
  emailStatus: string | null;
}

export interface PayslipUploadBatch {
  handle: string;
  site: string;
  uploadedBy: string;
  uploadedAt: string;
  totalFiles: number;
  matchedCount: number;
  skippedCount: number;
  emailedCount: number;
  failedEmailCount: number;
  status: string;
  items: PayslipUploadItem[];
}
```

And add two fields to the existing `PayslipListItem` interface:

```ts
  source: PayslipSource;
  fileName: string | null;
```

- [ ] **Step 2: Add the request types**

In `src/modules/hrmPayslip/types/api.types.ts`:

```ts
export interface UploadPayslipBatchRequest {
  organizationId: string;
  uploadedBy: string;
  batchHandle?: string;
  files: File[];
}

export interface GetUploadBatchRequest {
  organizationId: string;
  requestedBy: string;
  handle: string;
}

export interface DownloadUploadedPayslipRequest {
  organizationId: string;
  /** HR path: identifies the payslip directly. Requires the download permission. */
  handle?: string;
  requestedBy?: string;
  /** Self-service path: the employee's own code plus the period. */
  employeeId?: string;
  payrollYear?: number;
  payrollMonth?: number;
}
```

- [ ] **Step 3: Widen the tab key**

In `src/modules/hrmPayslip/types/ui.types.ts`:

```ts
export type PayslipTabKey =
  | "generate"
  | "myPayslips"
  | "repository"
  | "upload"
  | "uploadHistory"
  | "templates";
```

- [ ] **Step 4: Add the service methods**

In `src/modules/hrmPayslip/services/payslipService.ts`, inside `HrmPayslipService`:

```ts
  /** Uploads one chunk. Pass batchHandle to append to a batch already started. */
  static async uploadPayslipBatch(
    payload: UploadPayslipBatchRequest
  ): Promise<PayslipUploadBatch> {
    const form = new FormData();
    payload.files.forEach((f) => form.append("files", f));
    form.append("organizationId", payload.organizationId);
    form.append("uploadedBy", payload.uploadedBy);
    if (payload.batchHandle) form.append("batchHandle", payload.batchHandle);
    const res = await api.post<PayslipUploadBatch>(`${BASE}/uploadPayslipBatch`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  }

  static async getUploadBatch(payload: GetUploadBatchRequest): Promise<PayslipUploadBatch> {
    const res = await api.post<PayslipUploadBatch>(`${BASE}/getUploadBatch`, payload);
    return res.data;
  }

  static async getUploadBatches(
    organizationId: string,
    requestedBy: string
  ): Promise<PayslipUploadBatch[]> {
    const res = await api.post<PayslipUploadBatch[]>(`${BASE}/getUploadBatches`, {
      organizationId,
      requestedBy,
    });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async downloadUploadedPayslip(
    payload: DownloadUploadedPayslipRequest
  ): Promise<Blob> {
    const res = await api.post(`${BASE}/downloadUploadedPayslip`, payload, {
      responseType: "blob",
    });
    return res.data as Blob;
  }
```

Add the new type names to the existing `import type { ... }` blocks at the top of the file.

- [ ] **Step 5: Verify it compiles**

```bash
cd /home/senthil/Fenta/hrm/fentahrm && npx tsc --noEmit
```

Expected: no errors in `src/modules/hrmPayslip`. Pre-existing errors elsewhere in the repo are not this task's business — confirm none of the reported lines are files you touched.

- [ ] **Step 6: Commit**

```bash
cd /home/senthil/Fenta/hrm/fentahrm
git add src/modules/hrmPayslip/types/ src/modules/hrmPayslip/services/payslipService.ts
git commit -m "feat(hrm-payslip): types and API client for the upload repository"
```

---

### Task 9: Upload helpers and the store slice

The pure logic lives in a helpers module so it can be unit-tested without a browser.

**Files:**
- Create: `src/modules/hrmPayslip/utils/uploadHelpers.ts`
- Modify: `src/modules/hrmPayslip/stores/payslipStore.ts`
- Test: `tests/unit/payslip-upload-helpers.spec.ts`

**Interfaces:**
- Consumes: types from Task 8; `HrmPayslipService.uploadPayslipBatch` / `getUploadBatch` / `getUploadBatches`.
- Produces:
  - `chunkFiles(files: File[], size?: number): File[][]`
  - `summarise(batch: PayslipUploadBatch): { total, stored, skipped, mailable, byStatus: Record<PayslipParseStatus, number> }`
  - `errorRowsToCsv(batch: PayslipUploadBatch): string`
  - `isStoredStatus(s: PayslipParseStatus): boolean`
  - store fields `uploadBatch`, `uploading`, `uploadProgress`, `batchHistory`, `batchHistoryLoading`, and actions `uploadFiles`, `loadBatchHistory`, `openBatch`, `clearUploadBatch`.
  Tasks 10–11 consume these.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/payslip-upload-helpers.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import {
  chunkFiles,
  summarise,
  errorRowsToCsv,
  isStoredStatus,
} from '../../src/modules/hrmPayslip/utils/uploadHelpers';
import type {
  PayslipUploadBatch,
  PayslipParseStatus,
} from '../../src/modules/hrmPayslip/types/domain.types';

/**
 * The pure logic behind the upload screen.
 *
 * Chunking is not cosmetic: max-request-size is 50MB, and a 200-file month posted in one request
 * would sit right on that ceiling. The summary and the CSV are what HR actually acts on -- if a
 * skipped file is missing from either, nobody ever learns it needs correcting.
 */

const file = (name: string) => new File(['%PDF'], name, { type: 'application/pdf' });

const item = (fileName: string, parseStatus: PayslipParseStatus, reason: string | null = null) => ({
  fileName,
  parseStatus,
  reason,
  employeeCode: null,
  employeeName: null,
  workEmail: null,
  payrollYear: null,
  payrollMonth: null,
  payslipHandle: null,
  emailStatus: null,
});

const batch = (items: ReturnType<typeof item>[]): PayslipUploadBatch => ({
  handle: 'PUB_1',
  site: 'RITS',
  uploadedBy: 'HRADMIN',
  uploadedAt: '2026-08-31T10:00:00',
  totalFiles: items.length,
  matchedCount: 0,
  skippedCount: 0,
  emailedCount: 0,
  failedEmailCount: 0,
  status: 'PARSED',
  items,
});

test('chunkFiles splits a full month into 25-file requests', () => {
  const files = Array.from({ length: 200 }, (_, i) => file(`R${i}_Aug-2026.pdf`));
  const chunks = chunkFiles(files);
  expect(chunks).toHaveLength(8);
  expect(chunks[0]).toHaveLength(25);
  expect(chunks.flat()).toHaveLength(200);
});

test('chunkFiles keeps a partial final chunk rather than dropping it', () => {
  const chunks = chunkFiles(Array.from({ length: 26 }, (_, i) => file(`R${i}_Aug-2026.pdf`)));
  expect(chunks).toHaveLength(2);
  expect(chunks[1]).toHaveLength(1);
});

test('chunkFiles returns nothing for an empty selection', () => {
  expect(chunkFiles([])).toEqual([]);
});

test('summarise separates stored from mailable', () => {
  const s = summarise(batch([
    item('a.pdf', 'OK'),
    item('b.pdf', 'REPLACED_EXISTING'),
    item('c.pdf', 'EMPLOYEE_NO_EMAIL'),
    item('d.pdf', 'BAD_FILENAME'),
    item('e.pdf', 'EMPLOYEE_NOT_FOUND'),
  ]));

  expect(s.total).toBe(5);
  expect(s.stored).toBe(3);
  expect(s.skipped).toBe(2);
  // The no-email payslip is stored and downloadable, but there is nobody to send it to.
  expect(s.mailable).toBe(2);
  expect(s.byStatus.BAD_FILENAME).toBe(1);
});

test('summarise never loses a file between stored and skipped', () => {
  const s = summarise(batch([item('a.pdf', 'OK'), item('b.pdf', 'NOT_A_PDF')]));
  expect(s.stored + s.skipped).toBe(s.total);
});

test('isStoredStatus agrees with the backend enum', () => {
  expect(isStoredStatus('OK')).toBe(true);
  expect(isStoredStatus('REPLACED_EXISTING')).toBe(true);
  expect(isStoredStatus('EMPLOYEE_NO_EMAIL')).toBe(true);
  expect(isStoredStatus('BAD_FILENAME')).toBe(false);
  expect(isStoredStatus('EMPLOYEE_NOT_FOUND')).toBe(false);
  expect(isStoredStatus('NOT_A_PDF')).toBe(false);
});

test('errorRowsToCsv exports only the files HR must fix', () => {
  const csv = errorRowsToCsv(batch([
    item('R10101_Aug-2026.pdf', 'OK'),
    item('payslip-august.pdf', 'BAD_FILENAME', 'File name must follow Rxxxxx_mmm-yyyy.pdf'),
    item('R99999_Aug-2026.pdf', 'EMPLOYEE_NOT_FOUND', 'No active employee with code R99999'),
  ]));

  const lines = csv.trim().split('\n');
  expect(lines).toHaveLength(3); // header + 2 problems
  expect(csv).not.toContain('R10101_Aug-2026.pdf');
  expect(csv).toContain('payslip-august.pdf');
  expect(csv).toContain('R99999_Aug-2026.pdf');
});

test('errorRowsToCsv quotes a reason containing a comma', () => {
  const csv = errorRowsToCsv(batch([
    item('x.pdf', 'BAD_FILENAME', 'Expected Rxxxxx_mmm-yyyy.pdf, for example R10101_Aug-2026.pdf'),
  ]));
  expect(csv).toContain('"Expected Rxxxxx_mmm-yyyy.pdf, for example R10101_Aug-2026.pdf"');
  expect(csv.trim().split('\n')).toHaveLength(2);
});

test('errorRowsToCsv returns just a header when every file landed', () => {
  const csv = errorRowsToCsv(batch([item('a.pdf', 'OK')]));
  expect(csv.trim().split('\n')).toHaveLength(1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /home/senthil/Fenta/hrm/fentahrm && npm run test:unit -- payslip-upload-helpers
```

Expected: FAIL — cannot resolve `../../src/modules/hrmPayslip/utils/uploadHelpers`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/modules/hrmPayslip/utils/uploadHelpers.ts`:

```ts
import type {
  PayslipParseStatus,
  PayslipUploadBatch,
} from "../types/domain.types";

/**
 * Files per upload request. max-request-size is 50MB and a full month is ~200 payslips, so the
 * browser posts in slices rather than betting the whole batch on one request that may be refused.
 */
export const UPLOAD_CHUNK_SIZE = 25;

/** Statuses that produced a payslip row. Mirrors PayslipParseStatus.stored() on the backend. */
const STORED: ReadonlySet<PayslipParseStatus> = new Set<PayslipParseStatus>([
  "OK",
  "REPLACED_EXISTING",
  "EMPLOYEE_NO_EMAIL",
]);

/** Statuses Phase B may send. EMPLOYEE_NO_EMAIL is stored but has no recipient. */
const MAILABLE: ReadonlySet<PayslipParseStatus> = new Set<PayslipParseStatus>([
  "OK",
  "REPLACED_EXISTING",
]);

export function isStoredStatus(status: PayslipParseStatus): boolean {
  return STORED.has(status);
}

export function chunkFiles(files: File[], size: number = UPLOAD_CHUNK_SIZE): File[][] {
  const chunks: File[][] = [];
  for (let i = 0; i < files.length; i += size) {
    chunks.push(files.slice(i, i + size));
  }
  return chunks;
}

export interface UploadSummary {
  total: number;
  stored: number;
  skipped: number;
  mailable: number;
  byStatus: Record<PayslipParseStatus, number>;
}

export function summarise(batch: PayslipUploadBatch): UploadSummary {
  const items = batch.items ?? [];
  const byStatus = {
    OK: 0,
    REPLACED_EXISTING: 0,
    EMPLOYEE_NO_EMAIL: 0,
    BAD_FILENAME: 0,
    EMPLOYEE_NOT_FOUND: 0,
    NOT_A_PDF: 0,
  } as Record<PayslipParseStatus, number>;

  items.forEach((i) => {
    byStatus[i.parseStatus] = (byStatus[i.parseStatus] ?? 0) + 1;
  });

  const stored = items.filter((i) => STORED.has(i.parseStatus)).length;

  return {
    total: items.length,
    stored,
    skipped: items.length - stored,
    mailable: items.filter((i) => MAILABLE.has(i.parseStatus)).length,
    byStatus,
  };
}

const CSV_HEADER = "File name,Problem,Details,Employee code,Period";

function cell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * The rows HR has to act on — nothing else. A correction list padded with successes is a list
 * nobody reads.
 */
export function errorRowsToCsv(batch: PayslipUploadBatch): string {
  const rows = (batch.items ?? [])
    .filter((i) => !STORED.has(i.parseStatus))
    .map((i) =>
      [
        cell(i.fileName),
        cell(i.parseStatus),
        cell(i.reason),
        cell(i.employeeCode),
        cell(
          i.payrollYear && i.payrollMonth ? `${i.payrollMonth}/${i.payrollYear}` : ""
        ),
      ].join(",")
    );

  return [CSV_HEADER, ...rows].join("\n");
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
cd /home/senthil/Fenta/hrm/fentahrm && npm run test:unit -- payslip-upload-helpers
```

Expected: PASS, 9 tests.

- [ ] **Step 5: Add the store slice**

In `src/modules/hrmPayslip/stores/payslipStore.ts`, add to the `PayslipState` interface:

```ts
  uploadBatch: PayslipUploadBatch | null;
  uploading: boolean;
  uploadProgress: { done: number; total: number };
  batchHistory: PayslipUploadBatch[];
  batchHistoryLoading: boolean;

  uploadFiles: (files: File[]) => Promise<void>;
  loadBatchHistory: () => Promise<void>;
  openBatch: (handle: string) => Promise<void>;
  clearUploadBatch: () => void;
```

and to the store body:

```ts
  uploadBatch: null,
  uploading: false,
  uploadProgress: { done: 0, total: 0 },
  batchHistory: [],
  batchHistoryLoading: false,

  clearUploadBatch: () => set({ uploadBatch: null, uploadProgress: { done: 0, total: 0 } }),

  uploadFiles: async (files) => {
    const organizationId = getOrganizationId();
    const uploadedBy = parseCookies().employeeCode ?? "";
    const chunks = chunkFiles(files);
    set({ uploading: true, uploadProgress: { done: 0, total: files.length } });
    try {
      let batch: PayslipUploadBatch | null = null;
      for (const chunk of chunks) {
        // Sequential, not parallel: each call appends to the same batch document, and
        // concurrent appends would race the read-modify-write on items[].
        batch = await HrmPayslipService.uploadPayslipBatch({
          organizationId,
          uploadedBy,
          batchHandle: batch?.handle,
          files: chunk,
        });
        set({
          uploadBatch: batch,
          uploadProgress: {
            done: Math.min(files.length, (batch?.items?.length ?? 0)),
            total: files.length,
          },
        });
      }
      const summary = batch ? summarise(batch) : null;
      if (summary) {
        message.success(`${summary.stored} stored, ${summary.skipped} need attention`);
      }
    } catch (e) {
      message.error("Payslip upload failed");
    } finally {
      set({ uploading: false });
    }
  },

  loadBatchHistory: async () => {
    set({ batchHistoryLoading: true });
    try {
      const data = await HrmPayslipService.getUploadBatches(
        getOrganizationId(),
        parseCookies().employeeCode ?? ""
      );
      set({ batchHistory: data });
    } catch (e) {
      message.error("Could not load upload history");
    } finally {
      set({ batchHistoryLoading: false });
    }
  },

  openBatch: async (handle) => {
    try {
      const batch = await HrmPayslipService.getUploadBatch({
        organizationId: getOrganizationId(),
        requestedBy: parseCookies().employeeCode ?? "",
        handle,
      });
      set({ uploadBatch: batch, activeTab: "upload" });
    } catch (e) {
      message.error("Could not open that batch");
    }
  },
```

Add the imports: `chunkFiles`, `summarise` from `../utils/uploadHelpers`, and `PayslipUploadBatch` from `../types/domain.types`. Also add the new fields to the reset block near line 370 so a remount clears them.

- [ ] **Step 6: Verify the whole unit suite and the type check**

```bash
cd /home/senthil/Fenta/hrm/fentahrm && npm run test:unit && npx tsc --noEmit
```

Expected: all unit specs pass; no new type errors.

- [ ] **Step 7: Commit**

```bash
cd /home/senthil/Fenta/hrm/fentahrm
git add src/modules/hrmPayslip/utils/uploadHelpers.ts \
        src/modules/hrmPayslip/stores/payslipStore.ts \
        tests/unit/payslip-upload-helpers.spec.ts
git commit -m "feat(hrm-payslip): chunked upload, batch summary and error-report CSV helpers"
```

---

### Task 10: Upload tab

**Files:**
- Create: `src/modules/hrmPayslip/components/organisms/PayslipUploadPanel.tsx`
- Create: `src/modules/hrmPayslip/components/organisms/UploadSummaryTable.tsx`
- Create: `src/modules/hrmPayslip/components/atoms/ParseStatusTag.tsx`
- Create: `src/modules/hrmPayslip/styles/PayslipUpload.module.css`

**Interfaces:**
- Consumes: store fields and actions from Task 9; `summarise`, `errorRowsToCsv`, `isStoredStatus`.
- Produces: `<PayslipUploadPanel />`, mounted by Task 13's tab list.

- [ ] **Step 1: Write the status tag**

Create `src/modules/hrmPayslip/components/atoms/ParseStatusTag.tsx`:

```tsx
'use client';

import React from "react";
import { Tag, Tooltip } from "antd";
import type { PayslipParseStatus } from "../../types/domain.types";

const LABELS: Record<PayslipParseStatus, { text: string; color: string; hint: string }> = {
  OK: { text: "Stored", color: "green", hint: "Stored and ready to send." },
  REPLACED_EXISTING: {
    text: "Replaced",
    color: "blue",
    hint: "Stored. The previous payslip for this period was archived.",
  },
  EMPLOYEE_NO_EMAIL: {
    text: "No email",
    color: "gold",
    hint: "Stored and downloadable, but this employee has no work email on record.",
  },
  BAD_FILENAME: {
    text: "Bad file name",
    color: "red",
    hint: "Rename to Rxxxxx_mmm-yyyy.pdf and upload again.",
  },
  EMPLOYEE_NOT_FOUND: {
    text: "Unknown employee",
    color: "red",
    hint: "No active employee holds that code at this site.",
  },
  NOT_A_PDF: { text: "Not a PDF", color: "red", hint: "Only PDF files can be uploaded." },
};

const ParseStatusTag: React.FC<{ status: PayslipParseStatus }> = ({ status }) => {
  const meta = LABELS[status];
  if (!meta) return <Tag>{status}</Tag>;
  return (
    <Tooltip title={meta.hint}>
      <Tag color={meta.color}>{meta.text}</Tag>
    </Tooltip>
  );
};

export default ParseStatusTag;
```

- [ ] **Step 2: Write the summary table**

Create `src/modules/hrmPayslip/components/organisms/UploadSummaryTable.tsx`:

```tsx
'use client';

import React, { useMemo } from "react";
import { Button, Space, Statistic, Table, Typography } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import ParseStatusTag from "../atoms/ParseStatusTag";
import { errorRowsToCsv, isStoredStatus, summarise } from "../../utils/uploadHelpers";
import type { PayslipUploadBatch, PayslipUploadItem } from "../../types/domain.types";
import styles from "../../styles/PayslipUpload.module.css";

interface Props {
  batch: PayslipUploadBatch;
}

const UploadSummaryTable: React.FC<Props> = ({ batch }) => {
  const summary = useMemo(() => summarise(batch), [batch]);

  const downloadErrorCsv = () => {
    const blob = new Blob([errorRowsToCsv(batch)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payslip-upload-errors-${batch.handle}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<PayslipUploadItem> = [
    { title: "File", dataIndex: "fileName", key: "fileName", ellipsis: true },
    {
      title: "Status",
      dataIndex: "parseStatus",
      key: "parseStatus",
      width: 150,
      render: (s) => <ParseStatusTag status={s} />,
    },
    { title: "Employee", dataIndex: "employeeName", key: "employeeName",
      render: (name, r) => (name ? `${r.employeeCode} — ${name}` : r.employeeCode ?? "--") },
    {
      title: "Period",
      key: "period",
      width: 110,
      render: (_, r) =>
        r.payrollYear && r.payrollMonth ? `${r.payrollMonth}/${r.payrollYear}` : "--",
    },
    { title: "Details", dataIndex: "reason", key: "reason",
      render: (reason) => reason ?? "--" },
  ];

  return (
    <div className={styles.summaryRoot}>
      <Space size="large" className={styles.summaryStats}>
        <Statistic title="Files" value={summary.total} />
        <Statistic title="Stored" value={summary.stored} valueStyle={{ color: "#389e0d" }} />
        <Statistic
          title="Need attention"
          value={summary.skipped}
          valueStyle={{ color: summary.skipped > 0 ? "#cf1322" : undefined }}
        />
        <Button
          icon={<DownloadOutlined />}
          disabled={summary.skipped === 0}
          onClick={downloadErrorCsv}
        >
          Export problems
        </Button>
      </Space>

      {summary.skipped > 0 && (
        <Typography.Paragraph type="warning" className={styles.summaryNote}>
          {summary.skipped} file{summary.skipped === 1 ? "" : "s"} could not be placed. Correct the
          name or the employee code and upload {summary.skipped === 1 ? "it" : "them"} again — the
          files already stored are unaffected.
        </Typography.Paragraph>
      )}

      <Table
        dataSource={batch.items}
        columns={columns}
        rowKey="fileName"
        size="small"
        pagination={{ pageSize: 25 }}
        rowClassName={(r) => (isStoredStatus(r.parseStatus) ? "" : styles.problemRow)}
      />
    </div>
  );
};

export default UploadSummaryTable;
```

- [ ] **Step 3: Write the upload panel**

Create `src/modules/hrmPayslip/components/organisms/PayslipUploadPanel.tsx`:

```tsx
'use client';

import React, { useState } from "react";
import { Alert, Button, Progress, Space, Typography, Upload } from "antd";
import { InboxOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { useHrmPayslipStore } from "../../stores/payslipStore";
import UploadSummaryTable from "./UploadSummaryTable";
import styles from "../../styles/PayslipUpload.module.css";

const PayslipUploadPanel: React.FC = () => {
  const { uploadBatch, uploading, uploadProgress, uploadFiles, clearUploadBatch } =
    useHrmPayslipStore();
  const [selected, setSelected] = useState<UploadFile[]>([]);

  const start = async () => {
    const files = selected
      .map((f) => f.originFileObj as File | undefined)
      .filter((f): f is File => Boolean(f));
    if (files.length === 0) return;
    await uploadFiles(files);
    setSelected([]);
  };

  return (
    <div className={styles.uploadRoot}>
      <Alert
        type="info"
        showIcon
        message="Name each file Rxxxxx_mmm-yyyy.pdf"
        description="For example R10101_Aug-2026.pdf. The employee code and pay period are read from the file name, so a file named any other way is reported back rather than stored."
        className={styles.namingHint}
      />

      <Upload.Dragger
        multiple
        accept="application/pdf,.pdf"
        beforeUpload={() => false}
        fileList={selected}
        onChange={({ fileList }) => setSelected(fileList)}
        disabled={uploading}
        className={styles.dragger}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">Drop this month&apos;s payslip PDFs here</p>
        <p className="ant-upload-hint">
          Up to 200 files at a time. They upload in batches of 25.
        </p>
      </Upload.Dragger>

      <Space className={styles.actions}>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          loading={uploading}
          disabled={selected.length === 0}
          onClick={start}
        >
          Upload {selected.length > 0 ? `${selected.length} file${selected.length === 1 ? "" : "s"}` : ""}
        </Button>
        {uploadBatch && !uploading && (
          <Button onClick={clearUploadBatch}>Start another upload</Button>
        )}
      </Space>

      {uploading && uploadProgress.total > 0 && (
        <Progress
          percent={Math.round((uploadProgress.done / uploadProgress.total) * 100)}
          status="active"
        />
      )}

      {uploadBatch && (
        <>
          <Typography.Title level={5} className={styles.summaryTitle}>
            Upload summary
          </Typography.Title>
          <UploadSummaryTable batch={uploadBatch} />
        </>
      )}
    </div>
  );
};

export default PayslipUploadPanel;
```

- [ ] **Step 4: Write the styles**

Create `src/modules/hrmPayslip/styles/PayslipUpload.module.css`. **Open `styles/PayslipRepository.module.css` first and match its conventions.** The module's tabs need the AntD flex chain or the content will not scroll — the announcements module lost scrolling to exactly this omission:

```css
.uploadRoot {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  min-height: 0;
  overflow: auto;
}

.namingHint { margin-bottom: 0; }
.dragger { padding: 12px 0; }
.actions { margin-top: 4px; }
.summaryTitle { margin: 8px 0 0; }

.summaryRoot {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.summaryStats { align-items: flex-end; flex-wrap: wrap; }
.summaryNote { margin-bottom: 0; }

.problemRow { background: #fff7f6; }
```

- [ ] **Step 5: Verify it compiles and the suite still passes**

```bash
cd /home/senthil/Fenta/hrm/fentahrm && npx tsc --noEmit && npm run test:unit
```

Expected: no new type errors; all unit specs pass.

- [ ] **Step 6: Commit**

```bash
cd /home/senthil/Fenta/hrm/fentahrm
git add src/modules/hrmPayslip/components/organisms/PayslipUploadPanel.tsx \
        src/modules/hrmPayslip/components/organisms/UploadSummaryTable.tsx \
        src/modules/hrmPayslip/components/atoms/ParseStatusTag.tsx \
        src/modules/hrmPayslip/styles/PayslipUpload.module.css
git commit -m "feat(hrm-payslip): upload tab with the per-file summary and error export"
```

---

### Task 11: Upload History tab

**Files:**
- Create: `src/modules/hrmPayslip/components/organisms/UploadHistoryPanel.tsx`

**Interfaces:**
- Consumes: store `batchHistory`, `batchHistoryLoading`, `loadBatchHistory`, `openBatch` (Task 9); `UploadSummaryTable` (Task 10).
- Produces: `<UploadHistoryPanel />`, mounted by Task 13.

- [ ] **Step 1: Write the panel**

Create `src/modules/hrmPayslip/components/organisms/UploadHistoryPanel.tsx`:

```tsx
'use client';

import React, { useEffect } from "react";
import { Button, Table, Tag, Typography } from "antd";
import { FolderOpenOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useHrmPayslipStore } from "../../stores/payslipStore";
import { formatDate } from "../../utils/payslipFormatters";
import type { PayslipUploadBatch } from "../../types/domain.types";
import styles from "../../styles/PayslipUpload.module.css";

const UploadHistoryPanel: React.FC = () => {
  const { batchHistory, batchHistoryLoading, loadBatchHistory, openBatch } =
    useHrmPayslipStore();

  useEffect(() => {
    loadBatchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: ColumnsType<PayslipUploadBatch> = [
    {
      title: "Uploaded",
      dataIndex: "uploadedAt",
      key: "uploadedAt",
      width: 170,
      render: (v) => (v ? formatDate(v) : "--"),
    },
    { title: "By", dataIndex: "uploadedBy", key: "uploadedBy", width: 140 },
    { title: "Files", dataIndex: "totalFiles", key: "totalFiles", width: 80 },
    {
      title: "Stored",
      dataIndex: "matchedCount",
      key: "matchedCount",
      width: 90,
      render: (v) => <Tag color="green">{v}</Tag>,
    },
    {
      title: "Need attention",
      dataIndex: "skippedCount",
      key: "skippedCount",
      width: 140,
      render: (v: number) => (v > 0 ? <Tag color="red">{v}</Tag> : <Tag>0</Tag>),
    },
    { title: "Status", dataIndex: "status", key: "status", width: 150 },
    {
      title: "",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Button
          size="small"
          icon={<FolderOpenOutlined />}
          onClick={() => openBatch(record.handle)}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.uploadRoot}>
      <Typography.Paragraph type="secondary">
        Every payslip upload, newest first. Open a batch to see its per-file summary and export the
        files that still need correcting.
      </Typography.Paragraph>
      <Table
        dataSource={batchHistory}
        columns={columns}
        rowKey="handle"
        size="small"
        loading={batchHistoryLoading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
};

export default UploadHistoryPanel;
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /home/senthil/Fenta/hrm/fentahrm && npx tsc --noEmit
```

Expected: no new errors. If `formatDate` is not exported from `utils/payslipFormatters`, use the export that is — `PayslipRepository.tsx` already imports it, so it exists.

- [ ] **Step 3: Commit**

```bash
cd /home/senthil/Fenta/hrm/fentahrm
git add src/modules/hrmPayslip/components/organisms/UploadHistoryPanel.tsx
git commit -m "feat(hrm-payslip): upload history tab"
```

---

### Task 12: Employee year/month selection and source-aware download

**Files:**
- Modify: `src/modules/hrmPayslip/components/organisms/EmployeePayslipView.tsx`
- Modify: `src/modules/hrmPayslip/stores/payslipStore.ts` (`downloadMyPayslip`, `downloadOne`)

**Interfaces:**
- Consumes: `HrmPayslipService.downloadUploadedPayslip` (Task 8); `PayslipListItem.source` (Tasks 7–8).
- Produces: no new exports; changes behaviour only.

- [ ] **Step 1: Make the download source-aware in the store**

In `src/modules/hrmPayslip/stores/payslipStore.ts`, replace the body of `downloadMyPayslip` so an uploaded payslip is fetched as bytes and a generated one keeps its existing snapshot path:

```ts
  downloadMyPayslip: async (year, month) => {
    const organizationId = getOrganizationId();
    const employeeId = parseCookies().employeeCode ?? "";
    const row = get().myPayslipList.find(
      (p) => p.payrollYear === year && p.payrollMonth === month
    );

    try {
      if (row?.source === "UPLOADED") {
        // An uploaded payslip is a real PDF in storage; fetch its bytes and hand them to the
        // browser. There is no snapshot to render for these.
        const blob = await HrmPayslipService.downloadUploadedPayslip({
          organizationId,
          employeeId,
          payrollYear: year,
          payrollMonth: month,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = row.fileName ?? `payslip-${month}-${year}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      // Generated payslips keep the existing snapshot-render path unchanged.
      const blob = await HrmPayslipService.downloadMyPayslip({
        organizationId,
        employeeId,
        payrollYear: year,
        payrollMonth: month,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${month}-${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      message.error("Could not download that payslip");
    }
  },
```

Ensure the store's `create` callback signature is `(set, get) =>` so `get()` is available; if it is currently `(set) =>`, widen it.

- [ ] **Step 2: Replace the month navigator with year and month dropdowns**

In `EmployeePayslipView.tsx`, replace the `<MonthNavigator ... />` element with explicit selects. Keep the rest of the component as it is:

```tsx
import { Select } from "antd";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ...inside the component, replacing <MonthNavigator/>:
<Space>
  <Select
    style={{ width: 110 }}
    value={myPayslipYear}
    onChange={handleYearChange}
    options={Array.from(
      new Set(myPayslipList.map((p) => p.payrollYear))
    )
      .sort((a, b) => b - a)
      .map((y) => ({ value: y, label: String(y) }))}
    placeholder="Year"
  />
  <Select
    style={{ width: 130 }}
    value={myPayslipMonth}
    onChange={handleMonthSelect}
    options={myPayslipList
      .filter((p) => p.payrollYear === myPayslipYear)
      .sort((a, b) => a.payrollMonth - b.payrollMonth)
      .map((p) => ({ value: p.payrollMonth, label: MONTHS[p.payrollMonth - 1] }))}
    placeholder="Month"
  />
</Space>
```

Import `Space` alongside the existing antd imports and drop the now-unused `MonthNavigator` import. Leave `MonthNavigator.tsx` in place — it is still referenced by the generation flow.

- [ ] **Step 3: Update the empty state**

The current copy says "Payslip not yet generated for …", which is wrong for a repository where payslips are uploaded. Replace that `Typography.Text` body with:

```tsx
              No payslip available for {formatPeriodLabel(myPayslipYear, myPayslipMonth)}.
```

- [ ] **Step 4: Verify**

```bash
cd /home/senthil/Fenta/hrm/fentahrm && npx tsc --noEmit && npm run test:unit
```

Expected: no new type errors; all unit specs pass.

- [ ] **Step 5: Commit**

```bash
cd /home/senthil/Fenta/hrm/fentahrm
git add src/modules/hrmPayslip/components/organisms/EmployeePayslipView.tsx \
        src/modules/hrmPayslip/stores/payslipStore.ts
git commit -m "feat(hrm-payslip): employees pick a year and month and download uploaded payslips"
```

---

### Task 13: Wire the tabs, and gate them on RBAC instead of a cookie

The tabs are currently chosen by a `role` cookie, which bypasses RBAC entirely. The new tabs must not inherit that.

**Files:**
- Modify: `src/modules/hrmPayslip/HrmPayslipLanding.tsx`
- Modify: `src/modules/hrmPayslip/components/organisms/PayslipRepository.tsx`

**Interfaces:**
- Consumes: `PayslipUploadPanel` (Task 10), `UploadHistoryPanel` (Task 11), `useCan` from `../hrmAccess/hooks/useCan`, `Can` from `../hrmAccess/components/Can`.
- Produces: the finished Phase A UI.

- [ ] **Step 1: Replace cookie-role gating with permissions**

In `HrmPayslipLanding.tsx`, remove the `parseCookies().role` block and the `isAdminOrHr` constant, and derive capability from RBAC instead:

```tsx
import { useCan } from "../hrmAccess/hooks/useCan";

const PayslipUploadPanel = dynamic(
  () => import("./components/organisms/PayslipUploadPanel"),
  { ssr: false }
);
const UploadHistoryPanel = dynamic(
  () => import("./components/organisms/UploadHistoryPanel"),
  { ssr: false }
);

// inside the component, replacing the cookie role check:
const repository = useCan(undefined, "payslip_repository");
const generation = useCan(undefined, "payslip_generate");
const templates = useCan(undefined, "payslip_template");

const canUpload = repository.canAdd;
const canViewRepository = repository.canView;
```

Then build the tab list from those flags. Every employee keeps "My Payslips"; the rest appear only for a holder of the matching grant:

```tsx
  const tabItems = useMemo(() => {
    const items = [];
    if (canUpload) {
      items.push({ key: "upload", label: "Upload", children: <PayslipUploadPanel /> });
    }
    items.push({ key: "myPayslips", label: "My Payslips", children: <EmployeePayslipView /> });
    if (canViewRepository) {
      items.push({ key: "repository", label: "Repository", children: <PayslipRepository /> });
      items.push({
        key: "uploadHistory",
        label: "Upload History",
        children: <UploadHistoryPanel />,
      });
    }
    if (generation.canView) {
      items.push({ key: "generate", label: "Generate", children: <PayslipGenerationPanel /> });
    }
    if (templates.canView) {
      items.push({ key: "templates", label: "Templates", children: <PayslipTabLayout /> });
    }
    return items;
  }, [canUpload, canViewRepository, generation.canView, templates.canView]);

  const defaultTab = canUpload ? "upload" : "myPayslips";
```

Update the `useEffect` that calls `fetchTemplates()` to key off `templates.canView` rather than `isAdminOrHr`, and remove the now-unused `parseCookies` import if nothing else in the file uses it.

- [ ] **Step 2: Scope the existing unscoped permission gate**

`PayslipRepository.tsx` line ~70 has `<Can I="edit">` with no object. Unscoped, it resolves against the module root instead of the repository object — the same mechanism that hid the Announcements Delete button from users who had been granted it. Scope it:

```tsx
            <Can I="edit" object="payslip_repository">
```

- [ ] **Step 3: Add the Source column to the repository table**

In `PayslipRepository.tsx`, add a column after `Name`:

```tsx
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: 110,
      render: (source: string) => (
        <Tag color={source === "UPLOADED" ? "blue" : "default"}>
          {source === "UPLOADED" ? "Uploaded" : "Generated"}
        </Tag>
      ),
    },
```

Import `Tag` from antd.

- [ ] **Step 4: Verify**

```bash
cd /home/senthil/Fenta/hrm/fentahrm && npx tsc --noEmit && npm run test:unit && npm run build
```

Expected: type check clean, unit specs pass, production build succeeds.

- [ ] **Step 5: Commit**

```bash
cd /home/senthil/Fenta/hrm/fentahrm
git add src/modules/hrmPayslip/HrmPayslipLanding.tsx \
        src/modules/hrmPayslip/components/organisms/PayslipRepository.tsx
git commit -m "feat(hrm-payslip): mount the upload tabs and gate payslip tabs on RBAC, not a cookie"
```

---

### Task 14: End-to-end acceptance test

The unit tests prove the logic; this proves the deployed thing works. It is a live HTTP test in the module's existing `*LifecycleTestCase` style, and is **not** part of the TDD loop.

**Files:**
- Create: `src/test/java/com/rits/hrmservice/payslip/PayslipUploadLifecycleTestCase.java`

**Interfaces:**
- Consumes: every endpoint from Task 6, against a running host.
- Produces: nothing other consumers use.

- [ ] **Step 1: Write the lifecycle test**

Open `PayslipCtcLifecycleTestCase.java` and copy its skeleton exactly — `@TestInstance(PER_CLASS)`, `@TestMethodOrder(OrderAnnotation.class)`, `base.url` system property with a logged target, the optional Keycloak token, and the `RestTemplate` + `ObjectMapper` fields. Then write the chain:

1. `@Order(1)` — create a fixture employee with a known `employeeCode` and `workEmail`, exactly as `PayslipCtcLifecycleTestCase` does. **Never start at a payslip.**
2. `@Order(2)` — upload a batch of three files as multipart: one valid (`<code>_Aug-2026.pdf`), one badly named (`payslip-august.pdf`), one for a code that does not exist (`R99999_Aug-2026.pdf`). Assert `matchedCount == 1`, `skippedCount == 2`, and that each item carries a non-null `reason`.
3. `@Order(3)` — `getUploadBatch` on the returned handle; assert the counts survive a round-trip through Mongo.
4. `@Order(4)` — `downloadUploadedPayslip` with `handle` + `requestedBy`; assert the response is `application/pdf` and the body starts with `%PDF`. **This is the step that proves the GridFS round-trip from Task 4.**
5. `@Order(5)` — upload the same valid file again; assert `REPLACED_EXISTING`, then `getMyPayslips` and assert exactly **one** active payslip for that employee and period.
6. `@Order(6)` — `downloadUploadedPayslip` self-service with `X-User-ID` set to a *different* employee's user id; assert it is refused. This is the guard the whole feature's confidentiality rests on.
7. `@Order(7)` — `getUploadBatches`; assert the batch appears in the history.

- [ ] **Step 2: Run it against a live host**

```bash
cd /home/senthil/Fenta/imes-upgrade
mvn -pl hrm-service test -Dtest="PayslipUploadLifecycleTestCase" -Dbase.url=http://localhost:8080
```

Expected: PASS, 7 ordered steps. Do **not** claim Phase A is working until this has actually run green — and report the host it ran against, since the unit tests cannot prove GridFS, multipart, or RBAC wiring.

- [ ] **Step 3: Commit**

```bash
cd /home/senthil/Fenta/imes-upgrade
git add hrm-service/src/test/java/com/rits/hrmservice/payslip/PayslipUploadLifecycleTestCase.java
git commit -m "test(hrm-payslip): end-to-end upload, download, replace and self-service refusal"
```

---

## Done when

- `mvn -pl hrm-service test -Dtest="Payslip*Test"` passes.
- `npm run test:unit` passes and `npm run build` succeeds.
- `PayslipUploadLifecycleTestCase` passes against a running host, with the host named in the report.
- HR can upload a mixed batch and see exactly which files need correcting; an employee sees only their own payslips and can download Apr-2026 onward by year and month.
- No email is sent by any code path in this phase.

## Explicitly NOT in Phase A

PDFBox, `sendEmailWithAttachment`, password derivation, `emailUploadBatch`, `resendPayslipEmail`, async mail executors, delivery tracking. All of that is Phase B and needs its own plan.
