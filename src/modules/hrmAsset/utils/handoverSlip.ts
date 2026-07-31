/**
 * HRM Asset Module — printable handover slip for a direct assignment.
 *
 * Offered from the success state of the direct-assignment modal (screen.md
 * §8.3). Renders into a detached window and prints from there rather than
 * styling the app for print: the modal is still open behind it, and a print
 * stylesheet would have to fight the whole antd layout.
 */

import { formatDate, formatCurrency } from './assetHelpers';
import { assignmentReasonLabel } from './assetConstants';
import type { AssetResponse } from '../types/api.types';

export interface HandoverSlipInput {
  asset: Pick<
    AssetResponse,
    'assetId' | 'assetName' | 'categoryName' | 'location' | 'presentValueINR' | 'qrCodeBase64'
  > & { attributes?: { attrName: string; attrValue: string }[] };
  employeeId: string;
  employeeName?: string;
  fromDate: string;
  expectedReturnDate?: string;
  /** Reason code from ASSIGNMENT_REASONS; rendered as its label. */
  assignmentReason?: string;
  remarks?: string;
  assignedBy: string;
  custodyId?: string;
}

/** Blocks `<`, quotes and `&` so a vendor name can't inject markup. */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** The QR may arrive as raw base64 or a full data URI — normalise to a URI. */
function qrSrc(qrCodeBase64?: string): string | null {
  if (!qrCodeBase64) return null;
  return qrCodeBase64.startsWith('data:')
    ? qrCodeBase64
    : `data:image/png;base64,${qrCodeBase64}`;
}

/** Serial number lives in the category's attribute schema, not on the asset. */
export function findSerialNumber(
  attributes?: { attrName: string; attrValue: string }[],
): string | undefined {
  return (attributes ?? []).find((a) =>
    /serial/i.test(a.attrName),
  )?.attrValue;
}

function row(label: string, value?: string): string {
  if (!value) return '';
  return `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`;
}

export function buildHandoverSlipHtml(input: HandoverSlipInput): string {
  const { asset } = input;
  const reasonLabel = assignmentReasonLabel(input.assignmentReason);
  const remarksText = input.remarks?.trim() || undefined;
  const qr = qrSrc(asset.qrCodeBase64);
  const serial = findSerialNumber(asset.attributes);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Asset Handover Slip — ${esc(asset.assetId)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1f1f1f; margin: 32px; font-size: 13px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { color: #595959; font-size: 12px; margin-bottom: 20px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  .qr img { width: 96px; height: 96px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #595959;
       border-bottom: 1px solid #d9d9d9; padding-bottom: 4px; margin: 20px 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; width: 190px; font-weight: 600; padding: 4px 8px 4px 0; vertical-align: top; }
  td { padding: 4px 0; vertical-align: top; }
  .note { border: 1px solid #ffe58f; background: #fffbe6; padding: 8px 10px; margin-top: 16px; font-size: 12px; }
  .sign { display: flex; gap: 48px; margin-top: 48px; }
  .sign div { flex: 1; border-top: 1px solid #8c8c8c; padding-top: 6px; font-size: 12px; color: #595959; }
  @media print { body { margin: 12mm; } }
</style>
</head>
<body>
  <div class="head">
    <div>
      <h1>Asset Handover Slip</h1>
      <div class="sub">Direct assignment — issued without an asset request or approval chain.</div>
    </div>
    ${qr ? `<div class="qr"><img alt="QR code for ${esc(asset.assetId)}" src="${qr}" /></div>` : ''}
  </div>

  <h2>Asset</h2>
  <table>
    ${row('Asset ID', asset.assetId)}
    ${row('Name', asset.assetName)}
    ${row('Category', asset.categoryName)}
    ${row('Serial number', serial)}
    ${row('Location', asset.location)}
    ${row('Present value', asset.presentValueINR != null ? formatCurrency(asset.presentValueINR) : undefined)}
  </table>

  <h2>Assigned to</h2>
  <table>
    ${row('Employee ID', input.employeeId)}
    ${row('Name', input.employeeName)}
  </table>

  <h2>Assignment</h2>
  <table>
    ${row('Assignment date', input.fromDate ? formatDate(input.fromDate) : undefined)}
    ${row('Expected return', input.expectedReturnDate ? formatDate(input.expectedReturnDate) : undefined)}
    ${row('Reason', reasonLabel)}
    ${row('Remarks', remarksText)}
    ${row('Assigned by', input.assignedBy)}
    ${row('Custody reference', input.custodyId)}
  </table>

  <div class="note">
    I acknowledge receipt of the asset described above in working condition, and accept
    responsibility for its safe keeping until it is formally returned.
  </div>

  <div class="sign">
    <div>Employee signature &amp; date</div>
    <div>Issued by (signature &amp; date)</div>
  </div>
</body>
</html>`;
}

/**
 * Opens the slip in a new window and triggers the print dialog. Returns false
 * when the browser blocked the popup, so the caller can say so instead of
 * leaving the user wondering why nothing happened.
 */
export function printHandoverSlip(input: HandoverSlipInput): boolean {
  const win = window.open('', '_blank', 'width=820,height=1000');
  if (!win) return false;
  win.document.write(buildHandoverSlipHtml(input));
  win.document.close();
  win.focus();
  // Let the QR image decode before the print dialog freezes the render.
  win.setTimeout(() => win.print(), 250);
  return true;
}
