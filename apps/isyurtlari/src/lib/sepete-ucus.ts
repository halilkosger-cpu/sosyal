const hareketAzaltildi = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function titret() {
  try {
    navigator.vibrate?.(25);
  } catch {}
}

function gorunurHedef(): DOMRect | null {
  const adaylar = Array.from(document.querySelectorAll<HTMLElement>('[data-sepet-hedef]'));
  for (const el of adaylar) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) return r;
  }
  return null;
}

/** Sepete eklemede titresim ve urun gorselinin sepet simgesine ucmasi. */
export function sepeteUcur(kaynak: HTMLImageElement | null | undefined) {
  titret();
  if (!kaynak || hareketAzaltildi() || typeof kaynak.animate !== 'function') return;

  const hedef = gorunurHedef();
  if (!hedef) return;

  const bas = kaynak.getBoundingClientRect();
  const boy = Math.min(bas.width, bas.height, 120);
  const x0 = bas.left + bas.width / 2 - boy / 2;
  const y0 = bas.top + bas.height / 2 - boy / 2;
  const dx = hedef.left + hedef.width / 2 - (x0 + boy / 2);
  const dy = hedef.top + hedef.height / 2 - (y0 + boy / 2);

  const kopya = document.createElement('img');
  kopya.src = kaynak.currentSrc || kaynak.src;
  kopya.alt = '';
  kopya.setAttribute('aria-hidden', 'true');
  Object.assign(kopya.style, {
    position: 'fixed',
    left: `${x0}px`,
    top: `${y0}px`,
    width: `${boy}px`,
    height: `${boy}px`,
    objectFit: 'cover',
    borderRadius: '9999px',
    zIndex: '9999',
    pointerEvents: 'none',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  });
  document.body.appendChild(kopya);

  const animasyon = kopya.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(0.6)`, opacity: 0.95, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.15)`, opacity: 0.3 },
    ],
    { duration: 650, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' }
  );
  const temizle = () => kopya.remove();
  animasyon.onfinish = temizle;
  animasyon.oncancel = temizle;
}
