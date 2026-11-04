import { kacir } from './html-kacis';
import { YORUM_ONCESI_METNI } from './yorum-mesajlari';
import { YORUM_BAGLANTISI_GECERLILIK_GUN } from './yorum-baglantisi';

/**
 * Teslimden sonra giden yorum isteği e-postası (saf şablon; gönderim
 * lib/musteri-eposta.ts'te, kimlerin seçileceği lib/yorum-istegi.ts'te).
 *
 * Kurallar:
 *  - Dürüst görüş istenir; olumlu yorum, 5 yıldız ya da ödül istenmez.
 *  - Her ürün için kişiye özel, tek kullanımlık, süreli bir bağlantı vardır.
 *  - Ticari ileti olduğu için dipnot ve çıkış (ret) bağlantısı zorunludur.
 *  - Kullanıcıdan/veritabanından gelen metinler HTML kaçırılır.
 */

export interface YorumIstegiGirdisi {
  ad: string;
  kalemler: { ad: string; baglanti: string }[];
  /** Müşterinin kendi hediye kodunu taşıyan WhatsApp bağlantısı; kod yoksa null. */
  paylasimBaglantisi: string | null;
  retBaglantisi: string;
}

const DUGME =
  'display:inline-block;background:#CC4E00;color:#ffffff;text-decoration:none;padding:9px 18px;border-radius:8px;font-weight:600;font-size:14px;';

export function yorumIstegiEpostasi(g: YorumIstegiGirdisi): { konu: string; html: string } {
  const satirlar = g.kalemler
    .map(
      (k) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:15px;color:#1f2937;">${kacir(k.ad)}</td>
        <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap;">
          <a href="${kacir(k.baglanti)}" style="${DUGME}">Görüşümü yaz</a>
        </td>
      </tr>`
    )
    .join('');

  const paylasim = g.paylasimBaglantisi
    ? `
    <div style="background:#FDF1E7;border-radius:10px;padding:16px;margin:24px 0 0;">
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px;color:#1f2937;">
        Deneyiminizi sevdiklerinizle de paylaşın: onlara sizin adınıza küçük bir hediye gönderelim.
      </p>
      <a href="${kacir(g.paylasimBaglantisi)}" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;padding:9px 18px;border-radius:8px;font-weight:600;font-size:14px;">WhatsApp ile paylaş</a>
    </div>`
    : '';

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937;">
    <h2 style="color:#CC4E00;font-size:20px;margin:0 0 16px;">Merhaba ${kacir(g.ad)}</h2>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">
      Siparişiniz elinize ulaştı umarız. Bir dakikanızı ayırıp deneyiminizi yazarsanız, hem bize hem diğer müşterilerimize yardımcı olursunuz.
    </p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${kacir(YORUM_ONCESI_METNI)}</p>
    <table style="width:100%;border-collapse:collapse;">${satirlar}
    </table>
    <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:12px 0 0;">
      Bu bağlantılar yalnızca size özeldir, her ürün için bir kez kullanılabilir ve ${YORUM_BAGLANTISI_GECERLILIK_GUN} gün geçerlidir.
    </p>${paylasim}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
    <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0;">
      Bu e-postayı, ticari elektronik ileti almayı kabul ettiğiniz için aldınız.
      <a href="${kacir(g.retBaglantisi)}" style="color:#6b7280;">Bu tür e-postaları almayı bırakmak için tıklayın.</a>
      <br>isyurtlari.com.tr
    </p>
  </div>`;

  return { konu: 'Ürününüz nasıldı? Düşüncenizi duymak isteriz', html };
}
