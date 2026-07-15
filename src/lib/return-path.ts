export function normalizeInternalReturnPath(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  return value;
}
