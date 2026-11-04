import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export type ReportRow = string[];

export async function toPdf(title: string, headers: string[], rows: ReportRow[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.fontSize(18).text(title, { underline: false });
    doc.moveDown();
    const colW = (doc.page.width - 80) / Math.max(1, headers.length);
    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, 40 + i * colW, doc.y, { width: colW - 4, continued: i < headers.length - 1 }));
    doc.moveDown(0.5);
    doc.font('Helvetica');
    for (const row of rows) {
      row.forEach((cell, i) => doc.text(cell ?? '', 40 + i * colW, doc.y, { width: colW - 4, continued: i < row.length - 1 }));
      doc.moveDown(0.5);
    }
    doc.moveDown();
    doc.fontSize(9).text('LRMS — independent demo, not an official government system');
    doc.end();
  });
}

export async function toExcel(title: string, headers: string[], rows: ReportRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(title.slice(0, 31));
  ws.addRow(headers);
  ws.getRow(1).font = { bold: true };
  for (const row of rows) ws.addRow(row);
  ws.columns.forEach((c) => { c.width = 22; });
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
