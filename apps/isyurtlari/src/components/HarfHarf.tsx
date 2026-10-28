import type { CSSProperties } from 'react';

/** Metni harf harf beliren span'lara boler; yalnizca CSS, JS gerektirmez. Kelimeler bolunmez. */
export default function HarfHarf({ metin, baslangic = 0, adimMs = 28 }: { metin: string; baslangic?: number; adimMs?: number }) {
  let sira = baslangic;
  return (
    <>
      {metin.split(' ').map((kelime, k, dizi) => (
        <span key={k} className="inline-block whitespace-nowrap">
          {Array.from(kelime).map((harf, h) => (
            <span key={h} className="harf" style={{ '--gecikme': `${sira++ * adimMs}ms` } as CSSProperties}>
              {harf}
            </span>
          ))}
          {k < dizi.length - 1 ? ' ' : null}
        </span>
      ))}
    </>
  );
}

export const harfSayisi = (metin: string) => metin.replace(/ /g, '').length;
