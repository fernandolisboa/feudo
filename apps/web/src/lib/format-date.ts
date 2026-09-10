export function formatShortDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone }).format(date);
}
