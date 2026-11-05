'use client';

import { useEffect, useState } from 'react';
import { illeriGetir, ilVerisiniGetir, type IlOzeti, type IlVerisi } from '@/lib/adres-alanlari';

export interface AdresFormDegeri {
  ad: string;
  soyad: string;
  ilKodu: string;
  il: string;
  ilce: string;
  mahalle: string;
  sokak: string;
  binaSite: string;
  kat: string;
  daireNo: string;
  postaKodu: string;
}

export const BOS_ADRES_FORMU: AdresFormDegeri = {
  ad: '',
  soyad: '',
  ilKodu: '',
  il: '',
  ilce: '',
  mahalle: '',
  sokak: '',
  binaSite: '',
  kat: '',
  daireNo: '',
  postaKodu: '',
};

/** Form degerini siparis/kargo icin tek satirlik metne cevirir. */
export function adresFormunuMetne(f: AdresFormDegeri): string {
  const parcalar = [
    f.mahalle && `${f.mahalle}`,
    f.sokak,
    f.binaSite && `Bina/Site: ${f.binaSite}`,
    f.kat && `Kat: ${f.kat}`,
    f.daireNo && `Kapı No: ${f.daireNo}`,
    f.postaKodu,
    `${f.ilce} / ${f.il}`,
  ];
  return parcalar.filter(Boolean).join(', ');
}

interface Props {
  value: AdresFormDegeri;
  onChange: (next: AdresFormDegeri) => void;
  /** Ad ve soyad alanlari gosterilsin mi (adres defterinde zaten varsa gizlenebilir). */
  adSoyadGoster?: boolean;
  idOneki?: string;
}

const etiket = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function AdresFormu({ value, onChange, adSoyadGoster = true, idOneki = 'adres' }: Props) {
  const [iller, setIller] = useState<IlOzeti[]>([]);
  const [ilVerisi, setIlVerisi] = useState<IlVerisi | null>(null);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    let iptal = false;
    illeriGetir()
      .then((liste) => {
        if (!iptal) setIller(liste);
      })
      .catch(() => {
        if (!iptal) setHata('İl listesi yüklenemedi. Sayfayı yenileyin.');
      });
    return () => {
      iptal = true;
    };
  }, []);

  // Kayitli il secildiyse (or. adres defterinden) ilce/mahalle listesini hemen yukle.
  useEffect(() => {
    if (!value.ilKodu) {
      setIlVerisi(null);
      return;
    }
    let iptal = false;
    setYukleniyor(true);
    ilVerisiniGetir(value.ilKodu)
      .then((veri) => {
        if (!iptal) setIlVerisi(veri);
      })
      .catch(() => {
        if (!iptal) setHata('İlçe listesi yüklenemedi.');
      })
      .finally(() => {
        if (!iptal) setYukleniyor(false);
      });
    return () => {
      iptal = true;
    };
  }, [value.ilKodu]);

  const degistir = (parca: Partial<AdresFormDegeri>) => onChange({ ...value, ...parca });

  const ilSec = (kod: string) => {
    const secilen = iller.find((i) => i.code === kod);
    degistir({ ilKodu: kod, il: secilen?.name ?? '', ilce: '', mahalle: '' });
  };

  const ilceSec = (ad: string) => degistir({ ilce: ad, mahalle: '' });

  const ilceListesi = ilVerisi?.ilceler ?? [];
  const mahalleListesi = ilVerisi && value.ilce ? ilVerisi.mahalleler[value.ilce] ?? [] : [];

  return (
    <div className="space-y-4">
      {adSoyadGoster && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${idOneki}-ad`} className={etiket}>Ad</label>
            <input id={`${idOneki}-ad`} type="text" autoComplete="given-name" value={value.ad} onChange={(e) => degistir({ ad: e.target.value })} className="store-input" required />
          </div>
          <div>
            <label htmlFor={`${idOneki}-soyad`} className={etiket}>Soyad</label>
            <input id={`${idOneki}-soyad`} type="text" autoComplete="family-name" value={value.soyad} onChange={(e) => degistir({ soyad: e.target.value })} className="store-input" required />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${idOneki}-il`} className={etiket}>İl</label>
          <select id={`${idOneki}-il`} value={value.ilKodu} onChange={(e) => ilSec(e.target.value)} className="store-input" required>
            <option value="">İl seçin</option>
            {iller.map((i) => (
              <option key={i.code} value={i.code}>{i.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${idOneki}-ilce`} className={etiket}>İlçe</label>
          <select id={`${idOneki}-ilce`} value={value.ilce} onChange={(e) => ilceSec(e.target.value)} className="store-input" required disabled={!value.ilKodu || yukleniyor}>
            <option value="">{value.ilKodu ? 'İlçe seçin' : 'Önce il seçin'}</option>
            {ilceListesi.map((ad) => (
              <option key={ad} value={ad}>{ad}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`${idOneki}-mahalle`} className={etiket}>Mahalle</label>
        <select id={`${idOneki}-mahalle`} value={value.mahalle} onChange={(e) => degistir({ mahalle: e.target.value })} className="store-input" required disabled={!value.ilce}>
          <option value="">{value.ilce ? 'Mahalle seçin' : 'Önce ilçe seçin'}</option>
          {mahalleListesi.map((ad) => (
            <option key={ad} value={ad}>{ad}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${idOneki}-sokak`} className={etiket}>Sokak / Cadde</label>
        <input id={`${idOneki}-sokak`} type="text" autoComplete="address-line1" value={value.sokak} onChange={(e) => degistir({ sokak: e.target.value })} className="store-input" placeholder="Örn: Atatürk Caddesi" required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor={`${idOneki}-bina`} className={etiket}>Bina / Site</label>
          <input id={`${idOneki}-bina`} type="text" value={value.binaSite} onChange={(e) => degistir({ binaSite: e.target.value })} className="store-input" />
        </div>
        <div>
          <label htmlFor={`${idOneki}-kat`} className={etiket}>Kat <span className="text-gray-400 font-normal">(isteğe bağlı)</span></label>
          <input id={`${idOneki}-kat`} type="text" value={value.kat} onChange={(e) => degistir({ kat: e.target.value })} className="store-input" placeholder="Katlı değilse boş" />
        </div>
        <div>
          <label htmlFor={`${idOneki}-daire`} className={etiket}>Kapı / Daire No</label>
          <input id={`${idOneki}-daire`} type="text" value={value.daireNo} onChange={(e) => degistir({ daireNo: e.target.value })} className="store-input" required />
        </div>
      </div>

      <div>
        <label htmlFor={`${idOneki}-posta`} className={etiket}>Posta kodu <span className="text-gray-400 font-normal">(isteğe bağlı)</span></label>
        <input id={`${idOneki}-posta`} type="text" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={value.postaKodu} onChange={(e) => degistir({ postaKodu: e.target.value.replace(/\D/g, '').slice(0, 5) })} className="store-input" />
      </div>

      {hata && <p className="text-xs text-red-600">{hata}</p>}
    </div>
  );
}
