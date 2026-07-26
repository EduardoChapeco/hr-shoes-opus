import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { resolveTenantStoreId } from "@/lib/tenant";
import { getServerIdentity } from "@/lib/identity";

// --- SCHEMAS ---

export const bookingServiceSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  duration_minutes: z.number(),
  price_cents: z.number(),
  status: z.enum(["active", "archived"]),
});

export const createAppointmentSchema = z.object({
  service_id: z.string().uuid(),
  guest_name: z.string().min(2, "Nome é obrigatório"),
  guest_phone: z.string().min(10, "Telefone é obrigatório"),
  scheduled_at: z.string().datetime(),
  notes: z.string().optional(),
});

// --- FUNCTIONS ---

/**
 * Lista serviços de agendamento disponíveis na loja atual.
 */
export const listBookingServices = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const storeId = await resolveTenantStoreId();
    if (!storeId) throw new Error("Loja não encontrada no contexto.");

    const db = getServerClient();
    const { data, error } = await db
      .from("booking_services")
      .select("*")
      .eq("store_id", storeId)
      .eq("status", "active")
      .order("title");

    if (error) throw error;
    return { status: "success" as const, data };
  } catch (error: any) {
    console.error("[booking.functions] listBookingServices error:", error);
    throw new Error(error.message || "Erro ao listar serviços de agendamento.");
  }
});

/**
 * Busca horários disponíveis para um serviço em uma data específica.
 * Utiliza regra padrão de 09h às 18h com base na duração do serviço.
 */
export const getAvailableSlots = createServerFn({ method: "GET" })
  .validator(z.object({ service_id: z.string().uuid(), date: z.string() }))
  .handler(async ({ data: { service_id, date } }) => {
    try {
      const storeId = await resolveTenantStoreId();
      if (!storeId) throw new Error("Loja não encontrada no contexto.");

      const db = getServerClient();

      // 1. Fetch service to know duration
      const { data: service, error: sErr } = await db
        .from("booking_services")
        .select("duration_minutes")
        .eq("id", service_id)
        .single();

      if (sErr || !service) throw new Error("Serviço não encontrado.");

      // 2. Fetch existing appointments for the day
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      const { data: existing, error: apptErr } = await db
        .from("booking_appointments")
        .select("scheduled_at, booking_services(duration_minutes)")
        .eq("store_id", storeId)
        .neq("status", "cancelled")
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString());

      if (apptErr) throw apptErr;

      // 3. Calculate free slots (Mock logic: 09:00 to 18:00)
      const slots: string[] = [];
      const duration = service.duration_minutes || 60;

      let currentHour = 9;
      let currentMinute = 0;

      while (currentHour < 18) {
        const slotTime = new Date(
          `${date}T${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}:00.000Z`,
        );

        // Check if overlaps with any existing appointment
        const isOccupied = existing?.some((appt: any) => {
          const apptStart = new Date(appt.scheduled_at);
          const apptDuration = appt.booking_services?.duration_minutes || 60;
          const apptEnd = new Date(apptStart.getTime() + apptDuration * 60000);

          const proposedEnd = new Date(slotTime.getTime() + duration * 60000);

          // Overlap condition
          return slotTime < apptEnd && proposedEnd > apptStart;
        });

        if (!isOccupied) {
          slots.push(slotTime.toISOString());
        }

        // Increment by duration
        currentMinute += duration;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
      }

      return { status: "success" as const, data: slots };
    } catch (error: any) {
      console.error("[booking.functions] getAvailableSlots error:", error);
      throw new Error(error.message || "Erro ao buscar horários disponíveis.");
    }
  });

/**
 * Cria um novo agendamento.
 */
export const createAppointment = createServerFn({ method: "POST" })
  .validator(createAppointmentSchema)
  .handler(async ({ data: input }) => {
    try {
      const storeId = await resolveTenantStoreId();
      if (!storeId) throw new Error("Loja não encontrada no contexto.");

      // Try to get logged in user (optional)
      let customer_id = null;
      try {
        const identity = await getServerIdentity();
        customer_id = identity?.id || null;
      } catch (e) {
        // Guest user
      }

      const db = getServerClient();

      const { data, error } = await db
        .from("booking_appointments")
        .insert({
          store_id: storeId,
          service_id: input.service_id,
          customer_id,
          guest_name: input.guest_name,
          guest_phone: input.guest_phone,
          scheduled_at: input.scheduled_at,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;

      return { status: "success" as const, data };
    } catch (error: any) {
      console.error("[booking.functions] createAppointment error:", error);
      throw new Error(error.message || "Erro ao criar agendamento.");
    }
  });
