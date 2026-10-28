type GizliAlanlar = 'purchasePrice' | 'minStockLevel';

export function vitrinUrunu<T extends Record<string, any>>(urun: T): Omit<T, GizliAlanlar> {
  const { purchasePrice: _alis, minStockLevel: _esik, ...vitrin } = urun;
  return vitrin;
}
