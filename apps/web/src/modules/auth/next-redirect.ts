// Only ever redirects to a same-origin path this app itself renders after
// sign-in or email verification — never a client-supplied absolute URL
// (open redirect) and never anything outside the one route that needs it
// today, /convite/:id.
const NEXT_PATH_PATTERN = /^\/convite\/[A-Za-z0-9_-]+$/;

export function sanitizeNextPath(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return NEXT_PATH_PATTERN.test(value) ? value : null;
}

// FormData.get returns FormDataEntryValue (string | File | null); a hidden
// <input name="next"> only ever submits a string, but the File case is
// guarded explicitly rather than coerced with String(), which would stringify
// a File as "[object File]" instead of failing closed.
export function sanitizeNextPathFromFormData(formData: FormData): string | null {
  const value = formData.get("next");
  return sanitizeNextPath(typeof value === "string" ? value : null);
}
