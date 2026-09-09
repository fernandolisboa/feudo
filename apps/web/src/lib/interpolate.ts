export function interpolate(template: string, placeholder: string, value: string): string {
  return template.replace(placeholder, () => value);
}
