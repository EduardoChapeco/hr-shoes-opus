/**
 * Date/time helpers — Hr Shoes Commerce.
 * RULE (AGENTS.md): store ISO UTC; display in America/Sao_Paulo.
 */

const TZ = "America/Sao_Paulo";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string | Date): string {
  return dateFmt.format(typeof iso === "string" ? new Date(iso) : iso);
}

export function formatDateTime(iso: string | Date): string {
  return dateTimeFmt.format(typeof iso === "string" ? new Date(iso) : iso);
}
