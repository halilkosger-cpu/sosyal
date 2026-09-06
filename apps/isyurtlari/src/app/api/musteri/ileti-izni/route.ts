import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@isyurtlari/database';
import { iletiRetDogrula } from '@/lib/ileti-izni';
import { musteriGuard } from '@/lib/musteri-auth';
import { hizSiniriGuard } from '@/lib/hiz-siniri';

export const dynamic = 'force-dynamic';

/**
 * Ticari elektronik ileti izni.
 *
 * İki yoldan kapatılabiliyor / açılabiliyor:
 *  - E-postadaki imzalı ret bağlantısıyla (oturum gerekmez) - yalnızca
 *    KAPATMA. Kanun reddi kolaylaştırmayı emrediyor; giriş yapmayı şart
 *    koşmak bunu zorlaştırırdı.
 *  - Oturum açmış müşteri kendi tercihini açıp kapatabilir.
 *
 * ─── NEDEN POST ───────────────────────────────────────────────────────
 *
 * E-postadaki bağlantı doğrudan bu uca gitmiyor; önce /ileti-tercihi
 * sayfası açılıyor ve müşteri onaylıyor. Sebep: e-posta istemcileri ve
 * güvenlik tarayıcıları bağlantıları önceden açıyor. GET ile kapatsaydık
 * müşteri hiç tıklamadan listeden çıkmış olabilirdi.
 */
export async function POST(req: NextRequest) {
  const sinir = await hizSiniriGuard(req, 'ileti-izni', 20, 3600);
  if (sinir) return sinir;

  try {
    const govde = await req.json();
    const istenen: boolean = govde?.izin === true;

    // ── Yol 1: imzalı ret bağlantısı ──
    if (govde?.m && govde?.s) {
      const customerId = iletiRetDogrula(String(govde.m), String(govde.s));
      if (!customerId) {
        return NextResponse.json({ error: 'Bağlantı geçersiz' }, { status: 400 });
      }

      /**
       * İmzalı bağlantı yalnızca KAPATABİLİR.
       *
       * Aynı bağlantıyla izin açılabilseydi, bir kez sızan bağlantı
       * müşteriyi tekrar tekrar listeye ekleyebilirdi. Açma işlemi
       * oturum ister.
       *
       * Ret, iletiIzniAt sıfırlanarak değil ayrı bir damgayla işleniyor:
       * iznin ne zaman alındığı kaydı silinmemeli (bkz. schema.prisma).
       */
      await prisma.customer.updateMany({
        where: { id: customerId },
        data: { iletiRetAt: new Date() },
      });

      return NextResponse.json({ ok: true, izin: false });
    }

    // ── Yol 2: oturum açmış müşteri ──
    const musteri = await musteriGuard();
    if (musteri instanceof NextResponse) return musteri;

    await prisma.customer.update({
      where: { id: musteri.id },
      data: istenen
        // Yeniden izin: izin damgası bugüne çekiliyor, ret damgası olduğu
        // gibi kalıyor - geçmişte bir kez çıkmış olması kaydı silinmiyor.
        // "İzinli mi" sorusu ikisinin hangisinin daha yeni olduğuna bakıyor.
        ? { iletiIzniAt: new Date() }
        : { iletiRetAt: new Date() },
    });

    return NextResponse.json({ ok: true, izin: istenen });
  } catch (error) {
    console.error('İleti izni güncellenemedi:', error);
    return NextResponse.json({ error: 'İşlem tamamlanamadı' }, { status: 500 });
  }
}
