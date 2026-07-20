/**
 * Auth server functions — Hr Shoes Commerce
 *
 * Handles login, signup, oauth, logout, and session retrieval using the SSR client.
 * Never stores credentials in the client; delegates all auth to Supabase.
 * Profiles are created strictly by the DB trigger `handle_new_user` on auth.users insert.
 */

import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";

import { getSSRClient } from "@/lib/supabase-ssr.server";
import { getServerClient } from "@/lib/supabase";
import { mergeGuestCart } from "./cart.functions";
import { Provider } from "@supabase/supabase-js";
import { getEnvVar } from "@/lib/env";
import { readCookieFromRequest } from "@/lib/http-cookies";
import { normalizeInternalReturnPath } from "@/lib/return-path";
import { checkRateLimit, recordFailedAttempt, resetAttempts, formatRetryAfter } from "@/lib/rate-limiter";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the client IP from the incoming request.
 * Cloudflare sets CF-Connecting-IP; falls back to X-Forwarded-For or "unknown".
 */
function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const LoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  redirectTo: z.string().optional(),
});

const RegisterSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .regex(/[a-zA-Z]/, "A senha deve conter pelo menos uma letra")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número"),
  fullName: z.string().min(2, "Nome é obrigatório"),
  redirectTo: z.string().optional(), // destination after email confirmation
  isConsentLgpd: z.boolean().optional(),
});

const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .regex(/[a-zA-Z]/, "A senha deve conter pelo menos uma letra")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número"),
});

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export const getUserSession = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getSSRClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;

    // Also fetch their profile to get their role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      email: user.email!,
      role: profile?.role ?? "customer",
    };
  } catch {
    return null;
  }
});

export const signInWithPassword = createServerFn({ method: "POST" })
  .validator(LoginSchema)
  .handler(async ({ data: { email, password, redirectTo } }) => {
    try {
      const request = getRequest();
      const ip = getClientIp(request);

      // --- Rate limit check (before touching Supabase) ---
      const rateCheck = checkRateLimit(ip);
      if (rateCheck.blocked) {
        return {
          status: "rate_limited" as const,
          message: `Muitas tentativas de login. Tente novamente em ${formatRetryAfter(rateCheck.retryAfterMs!)}.`,
          retryAfterMs: rateCheck.retryAfterMs,
        };
      }

      // Extract guest session manually before async context drops
      const guestSessionToken = readCookieFromRequest(request, "hr_shoes_guest_session");

      // Use global getResponseHeaders implicitly to ensure Set-Cookie is persisted on the RPC response
      const supabase = getSSRClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Record the failed attempt for rate limiting
        recordFailedAttempt(ip);

        if (error.status === 429) {
          return {
            status: "error" as const,
            message: "Muitas tentativas de login. Aguarde alguns minutos.",
          };
        }
        if (error.message.includes("Email not confirmed")) {
          return {
            status: "error" as const,
            message: "E-mail não confirmado. Verifique sua caixa de entrada.",
          };
        }
        return { status: "error" as const, message: "E-mail ou senha incorretos." };
      }

      // Successful login: clear the failed attempts counter
      resetAttempts(ip);

      if (data.user) {
        try {
          await mergeGuestCart({
            data: {
              customerId: data.user.id,
              accessToken: data.session?.access_token,
              guestSessionToken,
            },
          });
        } catch (err) {
          console.error("Falha ao mesclar carrinho durante login (ignorado):", err);
        }
      }

      // Return success and let the client handle the redirect to preserve client-side router state
      return { status: "success" as const };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      return { status: "error" as const, message: `Erro ao realizar login: ${message}` };
    }
  });

export const signInWithOAuth = createServerFn({ method: "POST" })
  .validator(
    z.object({
      provider: z.enum(["google", "github", "apple", "azure"]),
      redirectTo: z.string(),
    }),
  )
  .handler(async ({ data: { provider, redirectTo } }) => {
    try {
      const supabase = getSSRClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as Provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        return { status: "error" as const, message: error.message };
      }

      return { status: "success" as const, url: data.url };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      return { status: "error" as const, message: `Erro ao inicializar OAuth: ${message}` };
    }
  });

export const signUpWithPassword = createServerFn({ method: "POST" })
  .validator(RegisterSchema)
  .handler(async ({ data: { email, password, fullName, redirectTo, isConsentLgpd } }) => {
    try {
      const request = getRequest();
      // Extract guest session manually before async context drops
      const guestSessionToken = readCookieFromRequest(request, "hr_shoes_guest_session");

      const supabase = getSSRClient();

      // Build the confirmation URL. Supabase will append token_hash and type.
      // The app's /api/auth/confirm handler will process these and create the session.
      const siteUrl = getEnvVar("VITE_SITE_URL") || "https://hrshoes.pages.dev";
      const confirmUrl = `${siteUrl}/api/auth/confirm${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, is_consent_lgpd: isConsentLgpd },
          emailRedirectTo: confirmUrl,
        },
      });

      if (error) {
        console.error("[auth] signUp API error:", error);
        if (error.status === 429) {
          return {
            status: "error" as const,
            message:
              "Limite de tentativas atingido (Supabase Free Tier). Aguarde 60 min ou desative 'Confirm email' no seu painel do Supabase em Authentication -> Providers -> Email.",
          };
        }
        if (
          error.message?.toLowerCase().includes("already registered") ||
          error.message?.toLowerCase().includes("user already")
        ) {
          return {
            status: "error" as const,
            message: "Este e-mail já possui uma conta. Faça login ou recupere sua senha.",
          };
        }
        return { status: "error" as const, message: `Erro ao realizar cadastro: ${error.message}` };
      }

      // Only merge guest cart if signup returned an active session (email confirmation disabled).
      if (data.user && data.session) {
        try {
          await mergeGuestCart({
            data: {
              customerId: data.user.id,
              accessToken: data.session.access_token,
              guestSessionToken,
            },
          });
        } catch (err) {
          // Cart merge failure must never block signup success
          console.error("[auth] mergeGuestCart failed during signup (non-fatal):", err);
        }
      }

      // If no session is returned, it means email confirmation is required.
      // We return success and let the client-side handle the redirect to /entrar with a toast.
      // There are no auth cookies to set in this case.
      if (!data.session) {
        return { status: "success" as const, sessionActive: false };
      }

      // If session is active, cookies are automatically set in getResponseHeaders
      return { status: "success" as const, sessionActive: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      console.error("[auth] Erro catastrófico no signUp:", e);
      return { status: "error" as const, message: `Erro interno no cadastro: ${message}` };
    }
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const supabase = getSSRClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { status: "error" as const, message: error.message };
    }

    // Clear guest session manually using H3-compatible util
    setResponseHeader(
      "Set-Cookie",
      `hr_shoes_guest_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
        getEnvVar("VITE_SITE_URL")?.includes("localhost") ? "" : "; Secure"
      }`,
    );

    return { status: "success" as const };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    return { status: "error" as const, message: `Erro ao realizar logout: ${message}` };
  }
});

export const updatePassword = createServerFn({ method: "POST" })
  .validator(ResetPasswordSchema)
  .handler(async ({ data: { password } }) => {
    try {
      const supabase = getSSRClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return { status: "error" as const, message: error.message };
      }

      return { status: "success" as const };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      return { status: "error" as const, message: `Erro ao atualizar senha: ${message}` };
    }
  });

export const resetPasswordForEmail = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email(), redirectTo: z.string() }))
  .handler(async ({ data: { email, redirectTo } }) => {
    try {
      const supabase = getSSRClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        if (error.status === 429) {
          return {
            status: "error" as const,
            message:
              "Limite de envio de e-mails atingido. Aguarde 60 minutos antes de solicitar novamente.",
          };
        }
        return { status: "error" as const, message: error.message };
      }
      return { status: "success" as const };
    } catch (e) {
      return { status: "error" as const, message: "Erro ao solicitar redefinição." };
    }
  });

export const getProfile = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.warn(`[auth] getProfile could not load profile for ${user.id}:`, error.message);
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name || profile?.full_name || "",
    phone: user.user_metadata?.phone || profile?.phone || "",
    role: profile?.role || "customer",
    // Enriched profile fields (may be null if not yet set)
    avatarUrl: profile?.avatar_url ?? null,
    cpf: profile?.cpf ?? null,
    birthDate: profile?.birth_date ?? null,
    gender: profile?.gender ?? null,
    newsletterOptIn: profile?.newsletter_opt_in ?? false,
  };
});

// ---------------------------------------------------------------------------
// CPF validation helper (Módulo 11)
// ---------------------------------------------------------------------------
function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // all same digit
  const calcDigit = (d: string, factor: number) =>
    d
      .split("")
      .slice(0, factor - 1)
      .reduce((acc, n, i) => acc + Number(n) * (factor - i), 0) % 11;
  const r1 = calcDigit(digits, 10);
  const r2 = calcDigit(digits, 11);
  const d1 = r1 < 2 ? 0 : 11 - r1;
  const d2 = r2 < 2 ? 0 : 11 - r2;
  return Number(digits[9]) === d1 && Number(digits[10]) === d2;
}

// ---------------------------------------------------------------------------
// updateProfile (enriched)
// ---------------------------------------------------------------------------

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().max(20).optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  cpf: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || isValidCpf(v), { message: "CPF inválido" }),
  birthDate: z.string().optional().or(z.literal("")), // ISO date string
  gender: z.enum(["feminino", "masculino", "outro", "prefiro_nao_dizer"]).optional(),
  newsletterOptIn: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export async function updateProfileHandler(data: UpdateProfileInput) {
  const supabase = getSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  // Update Supabase Auth metadata (name only — phone not in auth metadata)
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: data.fullName },
  });
  if (authError) throw new Error(authError.message);

  // Build profile update payload — only include defined fields
  const profileUpdate: Record<string, unknown> = {
    full_name: data.fullName,
  };
  if (data.phone !== undefined) profileUpdate.phone = data.phone || null;
  if (data.avatarUrl !== undefined) profileUpdate.avatar_url = data.avatarUrl || null;
  if (data.cpf !== undefined) profileUpdate.cpf = data.cpf || null;
  if (data.birthDate !== undefined) profileUpdate.birth_date = data.birthDate || null;
  if (data.gender !== undefined) profileUpdate.gender = data.gender;
  if (data.newsletterOptIn !== undefined) profileUpdate.newsletter_opt_in = data.newsletterOptIn;

  const { error: dbError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id);

  if (dbError) throw new Error(dbError.message);

  return { status: "success" as const };
}

export const updateProfile = createServerFn({ method: "POST" })
  .validator(UpdateProfileSchema)
  .handler(async ({ data }) => updateProfileHandler(data));

// ---------------------------------------------------------------------------
// requestAccountDeletion — LGPD Art. 18 right to erasure
// ---------------------------------------------------------------------------

export const requestAccountDeletion = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const db = getServerClient(); // service-role needed to delete auth user

  // 1. Anonymize personal data in profiles (keep row for FK integrity with orders)
  const { error: anonError } = await db
    .from("profiles")
    .update({
      full_name: "Usuário Excluído",
      phone: null,
      avatar_url: null,
      cpf: null,
      birth_date: null,
      gender: null,
      newsletter_opt_in: false,
      deletion_requested_at: new Date().toISOString(),
      deleted_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (anonError) throw new Error("Falha ao anonimizar dados: " + anonError.message);

  // 2. Write audit log
  await db.from("account_deletion_log").insert({
    profile_id: user.id,
    requested_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    reason: "Solicitado pelo próprio usuário via /conta/perfil",
    created_by: user.id,
  });

  // 3. Delete from Supabase Auth (hard delete — invalidates all sessions)
  const { error: deleteError } = await db.auth.admin.deleteUser(user.id);
  if (deleteError) throw new Error("Falha ao remover conta: " + deleteError.message);

  return { status: "deleted" as const };
});
