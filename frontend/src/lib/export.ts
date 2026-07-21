// CSV + Excel(SpreadsheetML) exporters and the range filter. Ported from components.jsx.
import { parseTxnDate, rangeStamp, type DateRange } from '@/lib/date';

type Row = Record<string, unknown>;

export const downloadBlob = (content: BlobPart | Blob, filename: string, mime = 'application/octet-stream') => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
};

const csvEscape = (v: unknown) => {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
};

export const exportCSV = (rows: Row[], filename: string, range?: DateRange) => {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(csvEscape).join(',')];
  for (const r of rows) lines.push(headers.map((h) => csvEscape(r[h])).join(','));
  const content = '﻿' + lines.join('\r\n'); // Excel UTF-8 BOM
  downloadBlob(content, `${filename}_${rangeStamp(range || null)}.csv`, 'text/csv;charset=utf-8;');
};

export const exportExcel = (rows: Row[], filename: string, range?: DateRange, sheetName = 'Data') => {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const xmlEsc = (v: unknown) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const typeOf = (v: unknown) => typeof v === 'number' && isFinite(v) ? 'Number' : 'String';
  const rowsXml = rows.map((r) => '<Row>' + headers.map((h) => {
    const v = r[h];
    return `<Cell><Data ss:Type="${typeOf(v)}">${xmlEsc(v)}</Data></Cell>`;
  }).join('') + '</Row>').join('');
  const headerXml = '<Row>' + headers.map((h) =>
    `<Cell ss:StyleID="hdr"><Data ss:Type="String">${xmlEsc(h)}</Data></Cell>`,
  ).join('') + '</Row>';

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="hdr"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2E4191" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="${xmlEsc(sheetName)}">
  <Table>${headerXml}${rowsXml}</Table>
 </Worksheet>
</Workbook>`;
  downloadBlob(xml, `${filename}_${rangeStamp(range || null)}.xls`, 'application/vnd.ms-excel');
};

export const filterByRange = <T extends Row>(rows: T[], range: DateRange | null, dateKey = 'date'): T[] => {
  if (!range || !range.start) return rows;
  const s = new Date(range.start); s.setHours(0, 0, 0, 0);
  const e = new Date(range.end || range.start); e.setHours(23, 59, 59, 999);
  return rows.filter((r) => {
    const d = parseTxnDate(r[dateKey]);
    return d ? (d >= s && d <= e) : true;
  });
};
