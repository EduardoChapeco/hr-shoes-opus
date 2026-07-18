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

export function getOpenStatus(
  extendedHours: any[] | null | undefined,
  holidayExceptions?: any[] | null | undefined
) {
  try {
    if (!extendedHours || extendedHours.length === 0) {
      return { status: "unknown", text: "Horários não configurados" };
    }

    const days = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
    const now = new Date();
    // Translate to Brazil São Paulo timezone
    const spTime = new Date(now.toLocaleString("en-US", { timeZone: TZ }));

    // Check holiday exceptions first
    if (holidayExceptions && holidayExceptions.length > 0) {
      const todayIso = spTime.toISOString().split("T")[0]; // YYYY-MM-DD
      const exception = holidayExceptions.find((e) => e.date === todayIso);
      if (exception) {
        if (!exception.open) {
          return { status: "closed", text: exception.label || "Fechado (Feriado)" };
        }
        const [openH, openM] = exception.openTime.split(":").map(Number);
        const [closeH, closeM] = exception.closeTime.split(":").map(Number);
        const openVal = openH * 60 + openM;
        const closeVal = closeH * 60 + closeM;
        const currentTimeVal = spTime.getHours() * 60 + spTime.getMinutes();

        if (currentTimeVal >= openVal && currentTimeVal <= closeVal) {
          return {
            status: "open",
            text: `Aberto até às ${exception.closeTime} (${exception.label || "Feriado"})`,
          };
        }
        if (currentTimeVal < openVal) {
          return {
            status: "closed",
            text: `Abre hoje às ${exception.openTime} (${exception.label || "Feriado"})`,
          };
        }
        return { status: "closed", text: `Fechado (${exception.label || "Feriado"})` };
      }
    }

    const currentDayName = days[spTime.getDay()];
    const currentHour = spTime.getHours();
    const currentMinute = spTime.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMinute;

    const todayHour = extendedHours.find((h) => h.day === currentDayName);
    if (!todayHour || !todayHour.open) {
      return { status: "closed", text: "Fechado hoje" };
    }

    const [openH, openM] = todayHour.openTime.split(":").map(Number);
    const [closeH, closeM] = todayHour.closeTime.split(":").map(Number);
    const openVal = openH * 60 + openM;
    const closeVal = closeH * 60 + closeM;

    if (currentTimeVal >= openVal && currentTimeVal <= closeVal) {
      return { status: "open", text: `Aberto até às ${todayHour.closeTime}` };
    }

    if (currentTimeVal < openVal) {
      return { status: "closed", text: `Abre hoje às ${todayHour.openTime}` };
    }

    return { status: "closed", text: "Fechado" };
  } catch {
    return { status: "unknown", text: "Erro ao verificar horários" };
  }
}
