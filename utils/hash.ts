export function normalizeWord(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function hashWord(value: string) {
  const normalized = normalizeWord(value);
  const data = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}
