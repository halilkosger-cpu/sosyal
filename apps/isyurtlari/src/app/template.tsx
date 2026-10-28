import type { ReactNode } from 'react';

// Sayfa gecisi View Transitions ile yapiliyor. Burada opacity:0 baslangicli animasyon
// SSR ciktisini hidrasyona kadar gorunmez tutuyor ve mobil LCP'yi ~8 sn geciktiriyordu.
export default function Template({ children }: { children: ReactNode }) {
  return <div className="w-full flex-1">{children}</div>;
}
