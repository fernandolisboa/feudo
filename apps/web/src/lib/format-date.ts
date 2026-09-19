export function formatShortDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone }).format(date);
}

export function formatShortDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(date);
}
