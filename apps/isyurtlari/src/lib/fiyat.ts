/**
 * Siparis tutari hesabi.
 *
 * Oran hem odeme sayfasinda hem siparis ucunda kullaniliyor. Ayri ayri yazili
 * olsaydi biri degistiginde digeri sessizce eski oranda kalir ve musteriye
 * gosterilen tutar ile siparise yazilan tutar birbirini tutmazdi.
 */
export const VERGI_ORANI = 0.1;

const yuvarla = (n: number) => Math.round(n * 100) / 100;

/** Urun toplamindan vergi dahil siparis tutarini uretir. */
export function siparisToplami(urunToplami: number): {
  araToplam: number;
  vergi: number;
  toplam: number;
} {
  const araToplam = yuvarla(urunToplami);
  const vergi = yuvarla(araToplam * VERGI_ORANI);
  return { araToplam, vergi, toplam: yuvarla(araToplam + vergi) };
}
