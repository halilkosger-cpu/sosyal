/**
 * Yapilandirilmis adres alanlari: sokak, bina/site, kat, kapi no.
 *
 * Kat ve bina/site opsiyoneldir (bazi evler katli degildir). Sokak ve kapi no
 * zorunludur. addressLine bu parcalardan uretilen tek satirlik metindir; kargo
 * etiketi ve eski kayitlar bu metni kullanmaya devam eder.
 */

export interface AcikAdresParcalari {
  sokak: string;
  binaSite?: string | null;
  kat?: string | null;
  daireNo: string;
}

const kirp = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

export function acikAdresOlustur(p: AcikAdresParcalari): string {
  const parcalar = [
    kirp(p.sokak),
    kirp(p.binaSite) ? `Bina/Site: ${kirp(p.binaSite)}` : '',
    kirp(p.kat) ? `Kat: ${kirp(p.kat)}` : '',
    `Kapı No: ${kirp(p.daireNo)}`,
  ];
  return parcalar.filter(Boolean).join(', ');
}

/** Il, ilce, mahalle verisi: public/adres altinda, il secilince tek dosya yuklenir. */
export interface IlOzeti {
  code: string;
  name: string;
}

export interface IlVerisi {
  kod: string;
  ad: string;
  ilceler: string[];
  mahalleler: Record<string, string[]>;
}

const onbellek = new Map<string, Promise<IlVerisi>>();

export async function ilVerisiniGetir(kod: string): Promise<IlVerisi> {
  if (!/^\d{2}$/.test(kod)) throw new Error('Geçersiz il kodu');
  let istek = onbellek.get(kod);
  if (!istek) {
    istek = fetch(`/adres/il/${kod}.json`).then((yanit) => {
      if (!yanit.ok) throw new Error('İl verisi yüklenemedi');
      return yanit.json() as Promise<IlVerisi>;
    });
    onbellek.set(kod, istek);
    istek.catch(() => onbellek.delete(kod));
  }
  return istek;
}

export async function illeriGetir(): Promise<IlOzeti[]> {
  const yanit = await fetch('/adres/iller.json');
  if (!yanit.ok) throw new Error('İl listesi yüklenemedi');
  return (await yanit.json()) as IlOzeti[];
}
