/**
 * Yuklemeden once gorseli tarayicida kucultur.
 *
 * Neden gerekli: next.config.js'te images.unoptimized acik (Vercel'in gorsel
 * donusturme kotasini asmamak icin), yani Blob'a ne yuklenirse ziyaretciye
 * aynen o gonderiliyor. Elle yuklenen fotograflar 1200x800 ve 500-600 KB
 * geliyordu; ana sayfada 8 urun = ~4,4 MB. Burada kucultunce sorun kaynaginda
 * cozulmus oluyor ve sunucuya ek bagimlilik gerekmiyor.
 *
 * Canvas kullanildigi icin yalnizca tarayicida calisir.
 */

const AZAMI_GENISLIK = 1000;
const KALITE = 0.82;

export interface KucultmeSonucu {
  dosya: File;
  eskiBayt: number;
  yeniBayt: number;
}

/**
 * Gorseli en fazla AZAMI_GENISLIK piksel genisligine indirir ve JPEG olarak
 * yeniden kodlar. Kucultme ise yaramazsa (dosya zaten kucukse) orijinali
 * dondurur - buyutmek anlamsiz olurdu.
 */
export function gorseliKucult(dosya: File): Promise<KucultmeSonucu> {
  return new Promise((coz) => {
    const orijinal: KucultmeSonucu = { dosya, eskiBayt: dosya.size, yeniBayt: dosya.size };

    if (!dosya.type.startsWith('image/')) return coz(orijinal);

    const url = URL.createObjectURL(dosya);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const olcek = Math.min(1, AZAMI_GENISLIK / img.naturalWidth);
        const g = Math.round(img.naturalWidth * olcek);
        const y = Math.round(img.naturalHeight * olcek);

        const tuval = document.createElement('canvas');
        tuval.width = g;
        tuval.height = y;
        const ctx = tuval.getContext('2d');
        if (!ctx) return coz(orijinal);
        ctx.drawImage(img, 0, 0, g, y);

        tuval.toBlob(
          (blob) => {
            if (!blob || blob.size >= dosya.size) return coz(orijinal);
            const ad = dosya.name.replace(/\.(png|webp|jpeg)$/i, '.jpg');
            coz({
              dosya: new File([blob], ad, { type: 'image/jpeg' }),
              eskiBayt: dosya.size,
              yeniBayt: blob.size,
            });
          },
          'image/jpeg',
          KALITE
        );
      } catch {
        coz(orijinal);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      coz(orijinal);
    };

    img.src = url;
  });
}
