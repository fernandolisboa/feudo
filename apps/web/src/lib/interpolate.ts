export function interpolate(template: string, placeholder: string, value: string): string {
  return template.replace(placeholder, () => value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Expands every placeholder in one pass over the original template, so a
// value that happens to contain another placeholder's literal text (an
// institution name spelling out "{date}") can never be mistaken for that
// placeholder: chaining separate interpolate() calls would re-scan already
// substituted text and corrupt it.
export function interpolateAll(template: string, values: Readonly<Record<string, string>>): string {
  const entries = Object.entries(values);
  if (entries.length === 0) {
    return template;
  }
  const pattern = new RegExp(entries.map(([key]) => escapeRegExp(`{${key}}`)).join("|"), "g");
  const lookup = new Map(entries);
  return template.replace(pattern, (match) => lookup.get(match.slice(1, -1)) ?? match);
}
