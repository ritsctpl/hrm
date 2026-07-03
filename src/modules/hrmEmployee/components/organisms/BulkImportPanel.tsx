/**
 * BulkImportPanel - Modal for bulk importing employees from a CSV/Excel file.
 *
 * Flow: select file -> parse (xlsx) -> VALIDATE (dry-run, backend checks every row)
 *       -> if all rows valid, CONFIRM commits them (all-or-nothing).
 * The backend endpoint (/employee/bulk-import) accepts the whole array in one call
 * and only commits when zero rows have errors.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Modal, Upload, Button, Alert, Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmEmployeeService } from '../../services/hrmEmployeeService';
import Can from '../../../hrmAccess/components/Can';
import type { BulkImportPanelProps } from '../../types/ui.types';
import type { BulkImportResponse, CreateEmployeeRequest } from '../../types/api.types';
import formStyles from '../../styles/HrmEmployeeForm.module.css';

const MAX_ROWS = 500;

/** Backend row-error shape (employee-package ImportRowError). */
interface RowError {
  rowNumber: number;
  email?: string;
  errorCode?: string;
  errorMessage?: string;
}

/** Template column header -> CreateEmployeeRequest field. Order defines the template. */
const COLUMNS: { header: string; field: keyof CreateEmployeeRequest; required?: boolean }[] = [
  { header: 'First Name', field: 'firstName', required: true },
  { header: 'Last Name', field: 'lastName', required: true },
  { header: 'Work Email', field: 'workEmail', required: true },
  { header: 'Phone', field: 'phone', required: true },
  { header: 'Title', field: 'title', required: true },
  { header: 'Department', field: 'department', required: true },
  { header: 'Role', field: 'role', required: true },
  { header: 'Location', field: 'location', required: true },
  { header: 'Designation', field: 'designation' },
  { header: 'Employee Code', field: 'employeeCode' },
  { header: 'Reporting Manager', field: 'reportingManager' },
  { header: 'Joining Date', field: 'joiningDate' },
  { header: 'Gender', field: 'gender' },
  { header: 'Marital Status', field: 'maritalStatus' },
  { header: 'Nick Name', field: 'nickName' },
  { header: 'Business Units', field: 'businessUnits' }, // semicolon-separated -> array
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const HEADER_MAP = new Map(COLUMNS.map((c) => [norm(c.header), c]));

/** Normalize any date cell (Date, Excel serial, ISO, or dd-mm-yyyy) to backend's yyyy-MM-dd. */
function toIsoDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const iso = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  if (value instanceof Date) return iso(value.getFullYear(), value.getMonth() + 1, value.getDate());
  // Excel serial number (a raw XLSX date cell)
  if (typeof value === 'number' && value > 0) {
    const d = new Date(Math.round((value - 25569) * 86400000));
    if (!Number.isNaN(d.getTime())) return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // already ISO
  // dd-mm-yyyy or dd/mm/yyyy (how Excel re-saves an exported date in most locales).
  // Day-first unless a component is clearly the month (>12).
  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const a = +m[1], b = +m[2], y = +m[3];
    const day = a > 12 ? a : b > 12 ? b : a;   // ambiguous -> day-first
    const mon = a > 12 ? b : b > 12 ? a : b;
    return iso(y, mon, day);
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return s; // unparseable — let the backend report it
}

/** Parse a selected CSV/XLSX file into CreateEmployeeRequest rows (client-side, via xlsx). */
async function parseFile(file: File): Promise<CreateEmployeeRequest[]> {
  const buf = await file.arrayBuffer();
  // raw:false + dateNF keeps a date cell (e.g. Joining Date) as a "yyyy-mm-dd" string
  // instead of an Excel serial number, which the backend LocalDate parser rejects.
  // raw:true keeps each cell as its underlying text — crucially, a CSV date stays the
  // literal "01-07-2026" instead of being reformatted (and mis-read) as "1/7/26".
  // toIsoDate() below then interprets it correctly. Non-date cells are stringified on use.
  const wb = XLSX.read(buf, { type: 'array', raw: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: true,
  });

  return rows.map((raw) => {
    const emp: Partial<CreateEmployeeRequest> = { businessUnits: [] };
    for (const [key, value] of Object.entries(raw)) {
      const col = HEADER_MAP.get(norm(key));
      if (!col) continue;
      const v = String(value ?? '').trim();
      if (col.field === 'businessUnits') {
        emp.businessUnits = v ? v.split(';').map((x) => x.trim()).filter(Boolean) : [];
      } else if (col.field === 'joiningDate') {
        // Normalize to yyyy-MM-dd; only send when present (empty string is not a valid LocalDate).
        const iso = toIsoDate(value);
        if (iso) (emp as { joiningDate?: string }).joiningDate = iso;
      } else if (col.field === 'phone') {
        // Strip spaces/dashes/parens; add a leading '+' if a bare digit string was
        // entered without one, so an exported phone passes the E.164 check on re-import.
        let ph = v.replace(/[\s\-().]/g, '');
        if (ph && ph[0] !== '+' && /^\d+$/.test(ph)) ph = '+' + ph;
        (emp as { phone?: string }).phone = ph;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (emp as any)[col.field] = v;
      }
    }
    // Derive fullName when not supplied
    if (!emp.fullName) {
      emp.fullName = [emp.firstName, emp.lastName].filter(Boolean).join(' ').trim();
    }
    return emp as CreateEmployeeRequest;
  });
}

const BulkImportPanel: React.FC<BulkImportPanelProps> = ({ open, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<CreateEmployeeRequest[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [validated, setValidated] = useState(false); // dry-run passed with 0 errors
  const [result, setResult] = useState<BulkImportResponse | null>(null);
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);

  const reset = () => {
    setFile(null);
    setParsed(null);
    setValidated(false);
    setResult(null);
    setRowErrors([]);
  };

  const submit = useCallback(
    async (dryRun: boolean, employees: CreateEmployeeRequest[]) => {
      const cookies = parseCookies();
      const organizationId = getOrganizationId();
      const importedBy = cookies.username || 'system';
      return HrmEmployeeService.bulkImport({ organizationId, employees, importedBy, dryRun });
    },
    []
  );

  const handleValidate = useCallback(async () => {
    if (!file) {
      message.warning('Please select a file');
      return;
    }
    setBusy(true);
    setResult(null);
    setRowErrors([]);
    setValidated(false);
    try {
      const employees = await parseFile(file);
      if (employees.length === 0) {
        message.warning('No rows found in the file. Use the template and add at least one row.');
        return;
      }
      if (employees.length > MAX_ROWS) {
        message.error(`Too many rows (${employees.length}). Max ${MAX_ROWS} per import.`);
        return;
      }
      setParsed(employees);
      const res = await submit(true, employees);
      const errs = (res.errors ?? []) as unknown as RowError[];
      setRowErrors(errs);
      if (res.failureCount === 0) {
        setValidated(true);
        message.success(`Validated ${res.totalRows} rows — all OK. Click "Confirm Import" to commit.`);
      } else {
        message.warning(`${res.failureCount} of ${res.totalRows} rows have errors. Fix the file and re-validate.`);
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setBusy(false);
    }
  }, [file, submit]);

  const handleCommit = useCallback(async () => {
    if (!parsed) return;
    setBusy(true);
    try {
      const res = await submit(false, parsed);
      setResult(res);
      setRowErrors((res.errors ?? []) as unknown as RowError[]);
      if (res.committed) {
        message.success(`Imported ${res.successCount} employees.`);
      } else {
        message.error('Import failed — see errors.');
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  }, [parsed, submit]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const headers = COLUMNS.map((c) => (c.required ? `${c.header}*` : c.header));
    const example = [
      'John', 'Doe', 'john.doe@company.com', '+919000000000', 'Mr', 'Engineering',
      'Engineer', 'Bengaluru', 'Senior Engineer', '', '', '2026-01-15', 'MALE', 'SINGLE', 'JD', 'BU1; BU2',
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const errorColumns: ColumnsType<RowError> = [
    { title: 'Row', dataIndex: 'rowNumber', key: 'rowNumber', width: 60 },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Error', dataIndex: 'errorMessage', key: 'errorMessage' },
  ];

  const footer = result
    ? [<Button key="close" onClick={handleClose}>Close</Button>]
    : [
        <Button key="cancel" onClick={handleClose}>Cancel</Button>,
        <Button key="validate" onClick={handleValidate} loading={busy} disabled={!file}>
          Validate
        </Button>,
        <Can key="import" I="add">
          <Button type="primary" loading={busy} onClick={handleCommit} disabled={!validated}>
            Confirm Import{parsed ? ` (${parsed.length})` : ''}
          </Button>
        </Can>,
      ];

  return (
    <Modal
      title="Bulk Import Employees"
      open={open}
      onCancel={handleClose}
      width={640}
      destroyOnHidden
      footer={footer}
    >
      {!result ? (
        <div style={{ padding: '12px 0' }}>
          <Alert
            type="info"
            showIcon
            message="Upload a CSV/Excel file with one row per employee. Download the template for the exact columns (* = required). The 'Role' column is the access role each new hire is granted. On import, every employee also gets a login and is emailed their credentials. Validate first, then confirm — all rows or none."
            style={{ marginBottom: 16 }}
          />

          <Button icon={<DownloadOutlined />} style={{ marginBottom: 16 }} onClick={downloadTemplate}>
            Download Template
          </Button>

          <div className={formStyles.bulkImportDropZone}>
            <Upload
              beforeUpload={(f) => {
                setFile(f);
                setParsed(null);
                setValidated(false);
                setRowErrors([]);
                return false;
              }}
              maxCount={1}
              onRemove={() => reset()}
              accept=".csv,.xlsx,.xls"
              fileList={file ? [{ uid: '-1', name: file.name, status: 'done' as const }] : []}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
            <p style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>Supported formats: CSV, XLSX (max {MAX_ROWS} rows)</p>
          </div>

          {rowErrors.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Alert
                type="warning"
                showIcon
                message={`${rowErrors.length} row(s) need attention — fix the file and re-validate.`}
                style={{ marginBottom: 12 }}
              />
              <Table<RowError>
                columns={errorColumns}
                dataSource={rowErrors}
                rowKey={(r) => `${r.rowNumber}-${r.email}`}
                size="small"
                pagination={false}
              />
            </div>
          )}
        </div>
      ) : (
        <div className={formStyles.bulkImportResults}>
          <Alert
            type={result.committed ? 'success' : 'warning'}
            showIcon
            message={`Processed ${result.totalRows} rows: ${result.successCount} succeeded, ${result.failureCount} failed`}
            style={{ marginBottom: 16 }}
          />
          {rowErrors.length > 0 && (
            <Table<RowError>
              columns={errorColumns}
              dataSource={rowErrors}
              rowKey={(r) => `${r.rowNumber}-${r.email}`}
              size="small"
              pagination={false}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default BulkImportPanel;
