/**
 * Günlük yönetim raporu: tarih aralığı ve metin üretimi.
 *
 * Veri toplama (Prisma, GA4, Merchant) ayrı modüllerde; bu dosya yalnızca
 * saf fonksiyonlardan oluşur ve test edilebilir.
 */

const SAAT_DILIMI = 'Europe/Istanbul';
const TR_OFSETI = '+03:00'; // Türkiye 2016'dan beri sabit UTC+3, yaz saati yok.
const MAKS_KELIME = 400;
const MAKS_LISTE = 10;
const MAKS_BASLIK = 60;

export interface DunTarihAraligi {
  etiket: string; // GG.AA.YYYY
  baslangic: Date;
  bitis: Date;
}

export interface SatisOzeti {
  ciro: number;
  siparis: number;
  aov: number;
  enCokSatan: { baslik: string; adet: number }[];
  dusukStok: { baslik: string; stok: number }[];
}

export interface KanalOzeti {
  kanal: string;
  oturum: number;
  donusumOrani: number; // %
  bounceRate: number; // %
}

export interface TrafikOzeti {
  oturum: number;
  donusumOrani: number; // %
  kanallar: KanalOzeti[];
}

export interface FiyatKalemi {
  baslik: string;
  fark: number; // % (pozitif: piyasadan pahalı)
}

export interface FiyatOzeti {
  pahali: FiyatKalemi[];
  ucuz: FiyatKalemi[];
  pahaliSayi: number;
  ucuzSayi: number;
  eksikSayi: number;
  feedSorunu: string | null;
  /** Merchant boş sonuç döndü: hesapta rekabet verisi yok. */
  veriYok?: boolean;
}

export interface GunlukVeri {
  etiket: string;
  satis: SatisOzeti | null;
  onceki: SatisOzeti | null;
  trafik: TrafikOzeti | null;
  fiyat: FiyatOzeti | null;
}

/** Türkiye saatine göre "dün"ün başlangıç ve bitişini (UTC) döndürür. */
export function dunTarihAraligi(simdi: Date): DunTarihAraligi {
  const bugunTarih = new Intl.DateTimeFormat('en-CA', { timeZone: SAAT_DILIMI }).format(simdi); // YYYY-MM-DD
  const [y, m, d] = bugunTarih.split('-').map(Number);
  const dun = new Date(Date.UTC(y, m - 1, d - 1));
  const dunStr = dun.toISOString().slice(0, 10);

  const baslangic = new Date(`${dunStr}T00:00:00${TR_OFSETI}`);
  const bitis = new Date(baslangic.getTime() + 24 * 60 * 60 * 1000);
  const [dy, dm, dd] = dunStr.split('-');

  return { etiket: `${dd}.${dm}.${dy}`, baslangic, bitis };
}

export function kelimeSayisi(metin: string): number {
  return metin.split(/\s+/).filter(Boolean).length;
}

const tl = (n: number) => `${n.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`;
const yuzde = (n: number) => `%${n.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
const kisalt = (s: string) => (s.length > MAKS_BASLIK ? `${s.slice(0, MAKS_BASLIK - 1)}…` : s);

function degisim(simdi: number, onceki: number): string {
  if (!onceki) return 'karşılaştırma yok';
  const oran = ((simdi - onceki) / onceki) * 100;
  return `${oran >= 0 ? '+' : ''}${yuzde(Math.round(oran * 10) / 10)} (önceki gün ${tl(onceki)})`;
}

function bolum1(veri: GunlukVeri): string[] {
  const satirlar = ['1. Fiyat Rekabet Analizi (Price Positioning)'];
  if (!veri.fiyat) return [...satirlar, '- Fiyat verisi alınamadı.'];

  const f = veri.fiyat;
  if (f.veriYok) return [...satirlar, '- Rekabet verisi bu hesapta dönmedi.'];
  satirlar.push(`- Piyasadan %10+ pahalı: ${f.pahaliSayi} ürün`);
  f.pahali.slice(0, MAKS_LISTE).forEach((k) => satirlar.push(`- ${kisalt(k.baslik)} (${yuzde(k.fark)} pahalı)`));
  satirlar.push(`- Piyasadan %10+ ucuz (marj fırsatı): ${f.ucuzSayi} ürün`);
  f.ucuz.slice(0, MAKS_LISTE).forEach((k) => satirlar.push(`- ${kisalt(k.baslik)} (${yuzde(k.fark)} ucuz)`));
  satirlar.push(`- Eksik fiyat/benchmark: ${f.eksikSayi} ürün`);
  if (f.feedSorunu) satirlar.push(`- Feed uyarısı: ${f.feedSorunu}`);
  return satirlar;
}

function bolum2(veri: GunlukVeri): string[] {
  const satirlar = ['2. Günlük Performans ve Trafik Özeti'];
  if (veri.satis) {
    const s = veri.satis;
    const o = veri.onceki;
    satirlar.push(`- Ciro: ${tl(s.ciro)} | değişim: ${o ? degisim(s.ciro, o.ciro) : 'karşılaştırma yok'}`);
    satirlar.push(`- Sipariş: ${s.siparis}${o ? ` (önceki gün ${o.siparis})` : ''}`);
    satirlar.push(`- Sepet ortalaması (AOV): ${tl(s.aov)}${o ? ` (önceki gün ${tl(o.aov)})` : ''}`);
  } else {
    satirlar.push('- Satış verisi alınamadı.');
  }

  if (veri.trafik) {
    const t = veri.trafik;
    satirlar.push(`- Oturum: ${t.oturum} | Dönüşüm: ${yuzde(t.donusumOrani)}`);
    const sirali = [...t.kanallar].sort((a, b) => b.donusumOrani - a.donusumOrani);
    sirali.slice(0, 5).forEach((k) =>
      satirlar.push(`- ${k.kanal}: ${k.oturum} oturum, dönüşüm ${yuzde(k.donusumOrani)}, çıkış ${yuzde(k.bounceRate)}`)
    );
  } else {
    satirlar.push('- Trafik verisi alınamadı.');
  }
  return satirlar;
}

function bolum3(veri: GunlukVeri): string[] {
  const satirlar = ['3. Uzman Satış Stratejileri & Eylem Planı (Bugün İçin)'];
  const f = veri.fiyat;

  if (f && f.pahaliSayi > 0) {
    satirlar.push(`- Fiyatlama: ${f.pahaliSayi} pahalı ürünü piyasa seviyesine yaklaştırın; ilk sırada olanlardan başlayın.`);
  }
  if (f && f.ucuzSayi > 0) {
    satirlar.push(`- Marj fırsatı: ${f.ucuzSayi} ucuz üründe fiyat artışı test edilebilir.`);
  }
  const enCok = veri.satis?.enCokSatan.slice(0, 2) ?? [];
  if (enCok.length === 2) {
    satirlar.push(`- Çapraz satış: ${kisalt(enCok[0].baslik)} ile ${kisalt(enCok[1].baslik)} için sepet kampanyası.`);
  }
  const kotuKanal = veri.trafik?.kanallar.filter((k) => k.oturum >= 50).sort((a, b) => a.donusumOrani - b.donusumOrani)[0];
  if (kotuKanal) {
    satirlar.push(`- Kanal: ${kotuKanal.kanal} dönüşümü düşük (${yuzde(kotuKanal.donusumOrani)}); hedefleme gözden geçirilsin.`);
  }
  const dusuk = veri.satis?.dusukStok.slice(0, 3) ?? [];
  if (dusuk.length > 0) {
    satirlar.push(`- Stok: ${dusuk.map((d) => `${kisalt(d.baslik)} (${d.stok} adet)`).join(', ')} tükenmeden tamamlanmalı.`);
  }
  if (satirlar.length === 1) satirlar.push('- Bugün için öncelikli eylem tespit edilmedi.');
  return satirlar;
}

/**
 * Üç bölümlü raporu üretir. 400 kelimeyi aşarsa sondaki satırlar kesilir.
 */
export function gunlukRaporMetniOlustur(veri: GunlukVeri): string {
  const satirlar = [...bolum1(veri), '', ...bolum2(veri), '', ...bolum3(veri)];

  while (kelimeSayisi(satirlar.join('\n')) > MAKS_KELIME && satirlar.length > 1) {
    satirlar.splice(satirlar.length - 1, 1);
  }
  return satirlar.join('\n');
}
