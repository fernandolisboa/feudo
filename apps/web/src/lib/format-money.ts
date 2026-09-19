export function formatMoney(centavos: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(centavos / 100);
}
