import {
  AlignmentType,
  Document,
  Footer,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { Program, ProjectState } from '../types.ts';
import { monthLabel } from './text.ts';
import { buildReport, type Block } from './report.ts';
import { downloadBlob } from './storage.ts';

const FONT = 'Times New Roman';
const SIZE = 24; // 12 punto
const MARGIN = 1417; // 2,5 cm (twip)
const CONTENT_WIDTH = 11906 - 2 * MARGIN;

function run(text: string, opts: { bold?: boolean; italics?: boolean; size?: number } = {}) {
  return new TextRun({ text, font: FONT, size: opts.size ?? SIZE, bold: opts.bold, italics: opts.italics });
}

function timelineTable(months: number, start: number, rows: { task: string; start: number; end: number }[]): Table {
  const taskW = 3200;
  const monthW = Math.floor((CONTENT_WIDTH - taskW) / months);
  const widths = [taskW, ...Array.from({ length: months }, () => monthW)];
  const cellPara = (text: string, bold = false, center = false, size = 20) =>
    new Paragraph({
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { line: 240 },
      children: [run(text, { bold, size })],
    });

  const header1 = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({ width: { size: widths[0], type: WidthType.DXA }, rowSpan: 2, children: [cellPara('İşin Adı', true)] }),
      new TableCell({ width: { size: monthW * months, type: WidthType.DXA }, columnSpan: months, children: [cellPara('AYLAR', true, true)] }),
    ],
  });
  const header2 = new TableRow({
    tableHeader: true,
    children: Array.from({ length: months }, (_, i) =>
      new TableCell({ width: { size: monthW, type: WidthType.DXA }, children: [cellPara(monthLabel(start, i), true, true, 14)] }),
    ),
  });

  const body = rows.map(
    (r) =>
      new TableRow({
        children: [
          new TableCell({ width: { size: widths[0], type: WidthType.DXA }, children: [cellPara(r.task)] }),
          ...Array.from({ length: months }, (_, i) => {
            const on = i + 1 >= r.start && i + 1 <= r.end;
            return new TableCell({
              width: { size: monthW, type: WidthType.DXA },
              shading: on ? { type: ShadingType.CLEAR, fill: '9CA3AF', color: 'auto' } : undefined,
              children: [cellPara('')],
            });
          }),
        ],
      }),
  );

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    rows: [header1, header2, ...body],
  });
}

function toChildren(blocks: Block[]): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  for (const b of blocks) {
    switch (b.kind) {
      case 'meta':
        out.push(
          new Paragraph({
            spacing: { line: 240, after: 60 },
            children: [run(`${b.label}: `, { bold: true }), run(b.value)],
          }),
        );
        break;
      case 'heading':
        out.push(
          new Paragraph({
            keepNext: true,
            spacing: { line: 240, before: 280, after: 120 },
            children: [run(b.text, { bold: true })],
          }),
        );
        break;
      case 'field':
        out.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 240, after: 120 },
            children: [run(`${b.label}: `, { bold: true }), run(b.text)],
          }),
        );
        break;
      case 'para':
        out.push(
          new Paragraph({
            pageBreakBefore: /^Ek\s*\d+\s*[.:]/i.test(b.text),
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 240, after: 120 },
            children: [run(b.text)],
          }),
        );
        break;
      case 'keywords':
        out.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 240, after: 120 },
            children: [run(`${b.label}: `, { bold: true }), run(b.text, { italics: true })],
          }),
        );
        break;
      case 'timeline':
        out.push(timelineTable(b.months, b.start, b.rows));
        out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
        break;
      case 'ref':
        out.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: 240, after: 120 },
            indent: { left: 720, hanging: 720 },
            children: b.segs.map((s) => run(s.t, { italics: s.i })),
          }),
        );
        break;
      case 'empty':
        // Boş bölümlerde yer tutucu metin yazılmaz; başlık kalır.
        break;
    }
  }
  return out;
}

export async function buildDocxBlob(p: ProjectState, prog: Program): Promise<Blob> {
  const doc = new Document({
    creator: '2204 Proje Asistanı',
    title: p.texts.title || 'Proje Raporu',
    styles: {
      default: {
        document: { run: { font: FONT, size: SIZE }, paragraph: { spacing: { line: 240 } } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: SIZE })],
              }),
            ],
          }),
        },
        children: toChildren(buildReport(p, prog)),
      },
    ],
  });
  return Packer.toBlob(doc);
}

export async function exportDocx(p: ProjectState, prog: Program): Promise<void> {
  const blob = await buildDocxBlob(p, prog);
  const base = (p.texts.title || 'proje-raporu')
    .toLocaleLowerCase('tr')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  downloadBlob(blob, `${base || 'proje-raporu'}.docx`);
}
