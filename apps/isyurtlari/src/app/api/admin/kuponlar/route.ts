import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { adminGuard, adminEpostasi } from '@/lib/admin-auth';
import { logAudit } from '@/lib/audit-log';
import { kuponKodunuNormalize } from '@/lib/kupon';

export const dynamic = 'force-dynamic';

/**
 * Yönetim: kuponlar.
 *
 * Kullanım sayısı Kupon üzerinde bir sayaçta tutulmuyor, KuponKullanimi
 * satırları sayılıyor - sayaç tutmak, sipariş iptalinde ya da bir yarışta
 * gerçekle uyuşmayan bir sayı bırakırdı.
 */

const sayi = (deger: unknown): number | null => {
  if (deger === null || deger === undefined || deger === '') return null;
  const n = Number(deger);
  return Number.isFinite(n) ? n : null;
};

const tarih = (deger: unknown): Date | null => {
  if (!deger) return null;
  const t = new Date(String(deger));
  return Number.isNaN(t.getTime()) ? null : t;
};

export async function GET(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const kuponlar = await prisma.kupon.findMany({
      orderBy: [{ aktif: 'desc' }, { createdAt: 'desc' }],
      include: { _count: { select: { kullanimlar: true } } },
    });

    return NextResponse.json({
      kuponlar: kuponlar.map((k) => ({
        ...k,
        kullanimAdedi: k._count.kullanimlar,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error('Kuponlar okunamadı:', error);
    return NextResponse.json({ error: 'Kuponlar getirilemedi' }, { status: 500 });
  }
}

/** Gövdeden kupon alanlarını çıkarır; doğrulama hatası varsa metin döner. */
function alanlar(govde: Record<string, unknown>) {
  const tur = govde.tur === 'TUTAR' ? 'TUTAR' : 'YUZDE';
  const deger = sayi(govde.deger);

  if (deger === null || deger <= 0) return { hata: 'İndirim değeri sıfırdan büyük olmalı' };
  if (tur === 'YUZDE' && deger > 100) return { hata: 'Yüzde indirim 100’ü aşamaz' };

  const azamiKullanim = sayi(govde.azamiKullanim);
  const musteriBasina = sayi(govde.musteriBasina);
  const baslangic = tarih(govde.baslangic);
  const bitis = tarih(govde.bitis);

  if (baslangic && bitis && bitis < baslangic) {
    return { hata: 'Bitiş tarihi başlangıçtan önce olamaz' };
  }

  return {
    veri: {
      tur: tur as 'YUZDE' | 'TUTAR',
      deger,
      azamiIndirim: tur === 'YUZDE' ? sayi(govde.azamiIndirim) : null,
      asgariTutar: Math.max(0, sayi(govde.asgariTutar) ?? 0),
      aktif: govde.aktif !== false,
      baslangic,
      bitis,
      azamiKullanim: azamiKullanim !== null && azamiKullanim > 0 ? Math.floor(azamiKullanim) : null,
      musteriBasina: musteriBasina !== null && musteriBasina >= 0 ? Math.floor(musteriBasina) : 1,
      hesapZorunlu: govde.hesapZorunlu !== false,
      aciklama: String(govde.aciklama ?? '').trim() || null,
    },
  };
}

export async function POST(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const govde = await req.json();
    const kod = kuponKodunuNormalize(govde.kod);
    if (!kod || kod.length < 3) {
      return NextResponse.json({ error: 'Kupon kodu en az 3 karakter olmalı' }, { status: 400 });
    }

    const cozum = alanlar(govde);
    if ('hata' in cozum) return NextResponse.json({ error: cozum.hata }, { status: 400 });

    const kupon = await prisma.kupon.create({ data: { kod, ...cozum.veri } });

    await logAudit(
      'KUPON_OLUSTUR',
      adminEpostasi(req) ?? 'bilinmeyen',
      'success',
      `${kupon.kod}: ${kupon.tur} ${kupon.deger}`
    );

    return NextResponse.json({ ok: true, kupon }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: 'Bu kod zaten kullanılıyor' }, { status: 409 });
    }
    console.error('Kupon oluşturulamadı:', error);
    return NextResponse.json({ error: 'Kupon oluşturulamadı' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const govde = await req.json();
    if (!govde.id) return NextResponse.json({ error: 'Kupon belirtilmedi' }, { status: 400 });

    const mevcut = await prisma.kupon.findUnique({
      where: { id: String(govde.id) },
      select: { kod: true, aktif: true },
    });
    if (!mevcut) return NextResponse.json({ error: 'Kupon bulunamadı' }, { status: 404 });

    /**
     * Yalnızca "aktif" değişiyorsa diğer alanlar doğrulanmıyor: panelde
     * kuponu tek tuşla kapatmak sık yapılan iş, her seferinde tüm formu
     * göndermeyi şart koşmak gereksiz.
     */
    if (Object.keys(govde).length === 2 && typeof govde.aktif === 'boolean') {
      const kupon = await prisma.kupon.update({
        where: { id: String(govde.id) },
        data: { aktif: govde.aktif },
      });
      await logAudit(
        'KUPON_GUNCELLE',
        adminEpostasi(req) ?? 'bilinmeyen',
        'success',
        `${mevcut.kod}: ${mevcut.aktif ? 'açık' : 'kapalı'} -> ${govde.aktif ? 'açık' : 'kapalı'}`
      );
      return NextResponse.json({ ok: true, kupon });
    }

    const cozum = alanlar(govde);
    if ('hata' in cozum) return NextResponse.json({ error: cozum.hata }, { status: 400 });

    /**
     * KOD DEĞİŞTİRİLEMİYOR.
     *
     * Kod müşterinin elinde: e-postada, afişte, sosyal medyada. Kodu
     * değiştirmek dağıtılmış kuponu sessizce çalışmaz hale getirirdi.
     * Farklı bir kod isteniyorsa yeni kupon açılır, eskisi kapatılır.
     */
    const kupon = await prisma.kupon.update({
      where: { id: String(govde.id) },
      data: cozum.veri,
    });

    await logAudit(
      'KUPON_GUNCELLE',
      adminEpostasi(req) ?? 'bilinmeyen',
      'success',
      `${mevcut.kod} güncellendi`
    );

    return NextResponse.json({ ok: true, kupon });
  } catch (error) {
    console.error('Kupon güncellenemedi:', error);
    return NextResponse.json({ error: 'Kupon güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const red = adminGuard(req);
  if (red) return red;

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Kupon belirtilmedi' }, { status: 400 });

    const kupon = await prisma.kupon.findUnique({
      where: { id },
      select: { kod: true, _count: { select: { kullanimlar: true } } },
    });
    if (!kupon) return NextResponse.json({ error: 'Kupon bulunamadı' }, { status: 404 });

    /**
     * Kullanılmış kupon SİLİNMİYOR, kapatılıyor.
     *
     * Silmek, kuponu kullanmış siparişlerin kullanım kayıtlarını da
     * götürürdü (Cascade). Sipariş üzerinde kodun metni kalsa bile hangi
     * kupondan ne kadar indirim yapıldığının kaydı kaybolurdu.
     */
    if (kupon._count.kullanimlar > 0) {
      return NextResponse.json(
        {
          error: `Bu kupon ${kupon._count.kullanimlar} siparişte kullanılmış; silinemez. Kapatabilirsiniz.`,
        },
        { status: 409 }
      );
    }

    await prisma.kupon.delete({ where: { id } });
    await logAudit('KUPON_SIL', adminEpostasi(req) ?? 'bilinmeyen', 'success', kupon.kod);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Kupon silinemedi:', error);
    return NextResponse.json({ error: 'Kupon silinemedi' }, { status: 500 });
  }
}
