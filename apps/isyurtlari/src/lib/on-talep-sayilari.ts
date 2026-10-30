import { prisma } from '@isyurtlari/database';
import type { OnTalepSayilari } from '@/lib/urun-siralama';

/** Varsayılan sıralamada talep görmüş ürünleri öne almak için; iptal edilen talepler sayılmıyor. */
export async function onTalepSayilari(): Promise<OnTalepSayilari> {
  const gruplar = await prisma.preOrder.groupBy({
    by: ['productId'],
    where: { status: { not: 'CANCELLED' } },
    _count: { _all: true },
  });
  return new Map(gruplar.map((g) => [g.productId, g._count._all]));
}
