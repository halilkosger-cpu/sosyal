/**
 * Hediye kodu (arkadaşa hediye).
 *
 * Müşteri sipariş sonrası kodunu sevdiklerine WhatsApp ile gönderir; kodla
 * gelen ilk sipariş, tutarı eşiğin üstündeyse, küçük bir hediye ürünle
 * paketlenir. Hediye ürünü sipariş kalemi değildir: yalnızca siparişin
 * notuna "HEDİYE EKLENECEKTİR" yazılır ve paketleme ekibi görür.
 *
 * Kurallar (iş sahibiyle birlikte belirlendi, 4 Kasım 2026):
 *  - Yalnızca ilk siparişte ve kişi başı bir kez (e-posta/telefon).
 *  - Kod sahibi kendi kodunu kullanamaz.
 *  - Ödenecek tutar en az HEDIYE_EN_AZ_SIPARIS_TUTARI.
 *  - Kod sahibine ödül verilmez (yorum karşılığı ödül mevzuata aykırıdır).
 *
 * Bu dosya yalnızca saf kuralları içerir; veritabanı erişimi hediye-db.ts'te.
 */

/** Hediyenin verilmesi için ödenecek (indirim/kupon düşülmüş) en az sipariş tutarı (TL). */
export const HEDIYE_EN_AZ_SIPARIS_TUTARI = 2000;

/** Karıştırılan karakterler (0/O, 1/I) yok: kod telefondan okunup elle yazılabiliyor. */
const KOD_KARAKTERLERI = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const KOD_UZUNLUGU = 5;
const KOD_ONEKI = 'HD-';

/**
 * Kod üretimi Web Crypto ile yapılır (Node 20+ ve tarayıcıda aynı API): bu dosya
 * ödeme sayfasından da içe aktarıldığı için Node'a özgü `crypto` modülü yok.
 * Alfabe 32 karakter olduğundan (2^32 / 32 tam bölünür) mod alma sapma yaratmaz.
 */
export function hediyeKoduUret(): string {
  const rastgele = globalThis.crypto.getRandomValues(new Uint32Array(KOD_UZUNLUGU));
  let govde = '';
  for (let i = 0; i < KOD_UZUNLUGU; i++) {
    govde += KOD_KARAKTERLERI[rastgele[i] % KOD_KARAKTERLERI.length];
  }
  return KOD_ONEKI + govde;
}

const KOD_BICIMI = new RegExp(`^HD-[${KOD_KARAKTERLERI}]{${KOD_UZUNLUGU}}$`);

/** Kullanıcının yazdığı kodu standart biçime getirir; geçersizse null. */
export function hediyeKodunuNormallestir(girdi: unknown): string | null {
  const ham = String(girdi ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!ham.startsWith('HD')) return null;
  const kod = `HD-${ham.slice(2)}`;
  return KOD_BICIMI.test(kod) ? kod : null;
}

/** Telefonu karşılaştırma için yalnızca son 10 haneye indirir (ülke kodu ve baştaki 0 atılır). */
export function telefonuNormallestir(telefon: unknown): string {
  const rakamlar = String(telefon ?? '').replace(/\D/g, '');
  return rakamlar.length >= 10 ? rakamlar.slice(-10) : '';
}

export function epostayiNormallestir(eposta: unknown): string {
  return String(eposta ?? '').trim().toLowerCase();
}

export interface HediyeUygunlukGirdisi {
  kodVar: boolean;
  /** Kodun sahibi (kaynak sipariş) ile siparişi veren aynı kişi mi? */
  kendiKodu: boolean;
  /** Bu e-posta/telefonla daha önce verilmiş (iptal edilmemiş) sipariş sayısı. */
  oncekiSiparisSayisi: number;
  /** Bu e-posta veya telefon daha önce bir hediye kullanmış mı? */
  kullanilmis: boolean;
  odenecekTutar: number;
}

export type HediyeSonucu =
  | { gecerli: true }
  | {
      gecerli: false;
      sebep: 'kod-yok' | 'kendi-kodu' | 'ilk-siparis-degil' | 'kullanilmis' | 'tutar-yetersiz';
      mesaj: string;
    };

const tl = (n: number) => n.toLocaleString('tr-TR');

export function hediyeUygunlugu(g: HediyeUygunlukGirdisi): HediyeSonucu {
  if (!g.kodVar) return { gecerli: false, sebep: 'kod-yok', mesaj: 'Hediye kodu bulunamadı.' };
  if (g.kendiKodu) {
    return { gecerli: false, sebep: 'kendi-kodu', mesaj: 'Hediye kodu, kod sahibi tarafından kullanılamaz.' };
  }
  if (g.oncekiSiparisSayisi > 0) {
    return { gecerli: false, sebep: 'ilk-siparis-degil', mesaj: 'Hediye kodu yalnızca ilk siparişte geçerlidir.' };
  }
  if (g.kullanilmis) {
    return { gecerli: false, sebep: 'kullanilmis', mesaj: 'Hediye kodu kişi başı bir kez kullanılabilir.' };
  }
  if (g.odenecekTutar < HEDIYE_EN_AZ_SIPARIS_TUTARI) {
    return {
      gecerli: false,
      sebep: 'tutar-yetersiz',
      mesaj: `Hediye için sipariş tutarı en az ${tl(HEDIYE_EN_AZ_SIPARIS_TUTARI)} ₺ olmalıdır.`,
    };
  }
  return { gecerli: true };
}

const NOT_ONEKI = 'HEDİYE EKLENECEKTİR';

/** Sipariş notuna yazılan ibare. Paketleme ekibi admin listesinde görür. */
export function hediyeNotu(kod: string): string {
  return `${NOT_ONEKI} (Kod: ${kod})`;
}

export function notHediyeIceriyor(notes: string | null | undefined): boolean {
  return Boolean(notes && notes.includes(NOT_ONEKI));
}

/**
 * Arkadaşa gönderilecek WhatsApp metni. Koşulu (2.000 ₺) baştan söyler: hediye
 * eşiğe bağlı olduğu için, söylenmezse arkadaş küçük bir siparişle gelip hayal
 * kırıklığına uğrar. Onay sayfası ve yorum isteği e-postası aynı metni kullanır.
 */
export function hediyePaylasimMetni(taban: string, kod: string): string {
  return (
    `Merhaba! İşyurtları'ndan sipariş verdim; ürünler hükümlülerin el emeğiyle üretiliyor. ` +
    `Bu kodla ilk siparişinde (${tl(HEDIYE_EN_AZ_SIPARIS_TUTARI)} ₺ ve üzeri) küçük bir hediye kazanırsın: ${kod} ` +
    `${taban}/?hediye=${kod}`
  );
}

export function whatsappPaylasimBaglantisi(taban: string, kod: string): string {
  return `https://wa.me/?text=${encodeURIComponent(hediyePaylasimMetni(taban, kod))}`;
}
