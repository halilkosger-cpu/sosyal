/**
 * Yorum uçlarının ortak yardımcıları (giriş yapmış müşteri yorumu ve misafir
 * yorum bağlantısı aynı kuralları kullanır).
 */

/** Yorum metni sınırları. */
export const ASGARI_METIN = 10;
export const AZAMI_METIN = 2000;

/**
 * "Özlem Gürbüz" -> "Özlem G."
 *
 * Yorumlar herkese açık; ad soyadı olduğu gibi yayınlamak müşterinin ne satın
 * aldığını adıyla birlikte internete açmak demek. Pazaryerleri de baş
 * harflerini gösteriyor.
 */
export function kisaltilmisAd(tamAd: string): string {
  const parcalar = tamAd.split(/\s+/).filter(Boolean);
  if (parcalar.length === 0) return 'Müşteri';
  if (parcalar.length === 1) return parcalar[0];
  const son = parcalar[parcalar.length - 1];
  return `${parcalar.slice(0, -1).join(' ')} ${son.charAt(0).toLocaleUpperCase('tr-TR')}.`;
}

/** Order.notes "Müşteri: X | Email: ..." biçiminde; X'i çıkarır (yoksa boş). */
export function notlardakiAd(notes: string | null | undefined): string {
  const esles = notes?.match(/Müşteri:\s*([^|]+)/i);
  return esles ? esles[1].trim() : '';
}

export type YorumGovdesi =
  | { gecerli: true; rating: number; title: string | null; text: string }
  | { gecerli: false; hata: string };

/** İstek gövdesindeki puan, başlık ve metni doğrular. Kimlik alanlarını okumaz. */
export function yorumGovdesiniDogrula(govde: unknown): YorumGovdesi {
  if (!govde || typeof govde !== 'object') return { gecerli: false, hata: 'Geçersiz istek' };
  const g = govde as Record<string, unknown>;

  const rating = Math.floor(Number(g.rating));
  const text = String(g.text ?? '').trim();
  const title = String(g.title ?? '').trim() || null;

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { gecerli: false, hata: 'Puan 1 ile 5 arasında olmalı' };
  }
  if (text.length < ASGARI_METIN) {
    return { gecerli: false, hata: `Yorum en az ${ASGARI_METIN} karakter olmalı` };
  }
  if (text.length > AZAMI_METIN) {
    return { gecerli: false, hata: `Yorum en fazla ${AZAMI_METIN} karakter olabilir` };
  }
  return { gecerli: true, rating, title, text };
}
