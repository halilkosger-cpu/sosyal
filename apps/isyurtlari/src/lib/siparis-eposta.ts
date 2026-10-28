/** Order.notes "Müşteri: X | Email: Y | Telefon: Z" biçiminde. */
export function notlardakiEposta(notes: string | null | undefined): string | null {
  const esles = notes?.match(/Email:\s*([^|\s]+)/i);
  return esles ? esles[1].trim().toLowerCase() : null;
}

export function siparisEpostasiUyuyor(
  girilen: string,
  notes: string | null | undefined,
  musteriEpostasi?: string | null
): boolean {
  const aranan = girilen.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(aranan)) return false;
  return aranan === notlardakiEposta(notes) || aranan === musteriEpostasi?.trim().toLowerCase();
}
