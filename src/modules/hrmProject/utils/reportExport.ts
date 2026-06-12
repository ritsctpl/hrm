// Shared export helpers for project report tables (Excel + PDF).
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Cell = string | number;

export function exportToExcel(filename: string, headers: string[], rows: Cell[][]): void {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([out], { type: 'application/octet-stream' }), `${filename}.xlsx`);
}

export function exportToPdf(filename: string, title: string, headers: string[], rows: Cell[][]): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(13);
  doc.text(title, 14, 15);
  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((c) => String(c))),
    startY: 20,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [24, 144, 255] },
  });
  doc.save(`${filename}.pdf`);
}
