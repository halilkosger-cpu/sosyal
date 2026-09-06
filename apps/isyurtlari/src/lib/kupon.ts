import { prisma } from '@isyurtlari/database';

/**
 * Kupon doğrulama ve indirim hesabı.
 *
 * ─── TEK KAYNAK ───────────────────────────────────────────────────────
 *
 * Aynı fonksiyon iki yerden çağrılıyor: ödeme sayfasındaki "kuponu uygula"
 * ucundan (müşteriye tutarı göstermek için) ve sipariş oluşturma ucundan
 * (siparişe yazılacak tutarı hesaplamak için). İkisi ayrı yazılsaydı,
 * müşteriye gösterilen indirim ile tahsil edilen tutar zamanla ayrışırdı -
 * bu sitede KDV'de tam olarak bu olmuştu.
 *
 * ÖNEMLİ: ödeme sayfasında doğrulanmış olması sipariş anında da geçerli
 * olduğu anlamına gelmez. Kupon o arada tükenmiş, süresi dolmuş ya da
 * kapatılmış olabilir. Sipariş ucu doğrulamayı KENDİSİ tekrar yapıyor;
 * istemciden gelen indirim tutarına asla güvenilmiyor.
 */

import {
  indirimiKalemlereDagit,
  kuponIndirimi,
  kuponKodunuNormalize,
} from '@/lib/kupon-hesap';

/**
 * Saf hesap fonksiyonları lib/kupon-hesap.ts'te: ödeme sayfası da onları
 * kullanıyor ve bu dosya prisma import ettiği için oradan import edilemez.
 * Sunucu tarafındaki çağıranlar tek yerden alsın diye buradan da
 * dışa aktarılıyorlar.
 */
export { indirimiKalemlereDagit, kuponIndirimi, kuponKodunuNormalize };

export interface KuponSonucu {
  gecerli: boolean;
  /** Uygulanacak indirim (TL). Geçersizse 0. */
  indirim: number;
  /** Müşteriye gösterilecek mesaj. */
  mesaj: string;
  kupon?: { id: string; kod: string; tur: string; deger: number };
}

interface DogrulaGirdisi {
  kod: string;
  /** KDV dahil, kampanya indirimi uygulanmış ürün toplamı. */
  urunToplami: number;
  customerId?: string | null;
  eposta?: string | null;
}

const gecersiz = (mesaj: string): KuponSonucu => ({ gecerli: false, indirim: 0, mesaj });

export async function kuponuDogrula({
  kod,
  urunToplami,
  customerId,
  eposta,
}: DogrulaGirdisi): Promise<KuponSonucu> {
  const normal = kuponKodunuNormalize(kod);
  if (!normal) return gecersiz('Kupon kodu girin');

  const kupon = await prisma.kupon.findUnique({ where: { kod: normal } });

  /**
   * "Kupon yok" ile "kupon geçersiz" aynı mesajı veriyor.
   *
   * Farklı mesaj verseydik, kod deneyen biri hangi kodların var olduğunu
   * öğrenirdi. Hız sınırı da uçta ayrıca uygulanıyor.
   */
  if (!kupon || !kupon.aktif) return gecersiz('Bu kupon kullanılamıyor');

  const simdi = new Date();
  if (kupon.baslangic && kupon.baslangic > simdi) return gecersiz('Bu kupon henüz başlamadı');
  if (kupon.bitis && kupon.bitis < simdi) return gecersiz('Bu kuponun süresi dolmuş');

  if (kupon.hesapZorunlu && !customerId) {
    return gecersiz('Bu kuponu kullanmak için giriş yapmanız gerekiyor');
  }

  if (urunToplami < kupon.asgariTutar) {
    return gecersiz(`Bu kupon en az ₺${kupon.asgariTutar.toFixed(2)} tutarındaki sepetlerde geçerli`);
  }

  // Toplam kullanım hakkı
  if (typeof kupon.azamiKullanim === 'number') {
    const kullanilan = await prisma.kuponKullanimi.count({ where: { kuponId: kupon.id } });
    if (kullanilan >= kupon.azamiKullanim) return gecersiz('Bu kuponun kullanım hakkı dolmuş');
  }

  /**
   * Kişi başına hak.
   *
   * Hesap varsa müşteri kimliğine, yoksa e-postaya bakılıyor. E-posta zayıf
   * bir ölçüt - değiştirmek bedava - bu yüzden kuponlar varsayılan olarak
   * hesap zorunlu (hesapZorunlu = true).
   */
  const kisiKosulu = customerId
    ? { kuponId: kupon.id, customerId }
    : eposta
      ? { kuponId: kupon.id, eposta: eposta.toLowerCase() }
      : null;

  if (kisiKosulu && kupon.musteriBasina > 0) {
    const kendiKullanimi = await prisma.kuponKullanimi.count({ where: kisiKosulu });
    if (kendiKullanimi >= kupon.musteriBasina) {
      return gecersiz('Bu kuponu daha önce kullandınız');
    }
  }

  const indirim = kuponIndirimi(kupon, urunToplami);
  if (indirim <= 0) return gecersiz('Bu kupon bu sepette indirim sağlamıyor');

  return {
    gecerli: true,
    indirim,
    mesaj:
      kupon.tur === 'YUZDE'
        ? `%${kupon.deger} indirim uygulandı`
        : `₺${indirim.toFixed(2)} indirim uygulandı`,
    kupon: { id: kupon.id, kod: kupon.kod, tur: kupon.tur, deger: kupon.deger },
  };
}

