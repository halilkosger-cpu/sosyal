import ExcelJS from 'exceljs';

export type HucreDegeri = string | number | Date | null | undefined;

export interface Sutun {
  baslik: string;
  genislik?: number;
  /** Excel sayi bicimi, ornek: '#,##0.00 "₺"' veya 'dd.mm.yyyy hh:mm'. */
  bicim?: string;
}

export const TL_BICIMI = '#,##0.00 "₺"';
export const TARIH_BICIMI = 'dd.mm.yyyy hh:mm';

export async function excelDosyasi(
  sayfaAdi: string,
  sutunlar: Sutun[],
  satirlar: HucreDegeri[][]
): Promise<Buffer> {
  const kitap = new ExcelJS.Workbook();
  kitap.created = new Date();
  const sayfa = kitap.addWorksheet(sayfaAdi, { views: [{ state: 'frozen', ySplit: 1 }] });

  sayfa.columns = sutunlar.map((s) => ({
    header: s.baslik,
    width: s.genislik ?? 18,
    style: s.bicim ? { numFmt: s.bicim } : {},
  }));
  sayfa.getRow(1).font = { bold: true };
  sayfa.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sutunlar.length } };

  for (const satir of satirlar) sayfa.addRow(satir.map((h) => (h === undefined ? null : h)));

  return Buffer.from(await kitap.xlsx.writeBuffer());
}

export function excelYaniti(dosya: Buffer, dosyaAdi: string): Response {
  return new Response(new Uint8Array(dosya), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${dosyaAdi}"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
