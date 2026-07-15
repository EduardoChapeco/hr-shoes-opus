/**
 * Auth server functions — Hr Shoes Commerce
 *
 * Handles login, signup, oauth, logout, and session retrieval using the SSR client.
 * Never stores credentials in the client; delegates all auth to Supabase.
 * Profiles are created strictly by the DB trigger `handle_new_user` on auth.users insert.
 */

import { createServerFn } from "@tanstack/react-start";
import * as Router from "@tanstack/react-router";
import { z } from "zod";

import { getSSRClient } from "@/lib/supabase-ssr";
import { getServerClient } from "@/lib/supabase";
import { mergeGuestCart } from "./cart.functions";
import { Provider } from "@supabase/supabase-js";
import { getEnvVar } from "@/lib/env";

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

export const getUserSession = createServerFn({ method: "GET" }).handler(async ({ request }) => {
  try {
    const responseHeaders = new Headers();
    const supabase = getSSRClient(request, responseHeaders);
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
  .handler(async ({ data: { email, password, redirectTo }, request }) => {
    try {
      // Extract guest session manually before async context drops
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(/hr_shoes_guest_session=([^;]+)/);
      const guestSessionToken = match ? match[1] : null;

      const responseHeaders = new Headers();
      const supabase = getSSRClient(request, responseHeaders);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.status === 429) {
          return { status: "error" as const, message: "Muitas tentativas de login. Aguarde alguns minutos." };
        }
        if (error.message.includes("Email not confirmed")) {
          return { status: "error" as const, message: "E-mail não confirmado. Verifique sua caixa de entrada." };
        }
        return { status: "error" as const, message: "E-mail ou senha incorretos." };
      }

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

      if (redirectTo) {
        throw Router.redirect({
          to: redirectTo,
          headers: responseHeaders,
        });
      }

      throw Router.redirect({
        to: "/admin",
        headers: responseHeaders,
      });
    } catch (e: unknown) {
      if (e instanceof Response || (e && typeof e === 'object' && 'isRedirect' in e)) throw e;
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
  .handler(async ({ data: { provider, redirectTo }, request }) => {
    try {
      const responseHeaders = new Headers();
      const supabase = getSSRClient(request, responseHeaders);
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
      if (e instanceof Response || (e && typeof e === 'object' && 'isRedirect' in e)) throw e;
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      return { status: "error" as const, message: `Erro ao inicializar OAuth: ${message}` };
    }
  });

export const signUpWithPassword = createServerFn({ method: "POST" })
  .validator(RegisterSchema)
  .handler(async ({ data: { email, password, fullName, redirectTo }, request }) => {
    try {
      // Extract guest session manually before async context drops
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(/hr_shoes_guest_session=([^;]+)/);
      const guestSessionToken = match ? match[1] : null;

      const responseHeaders = new Headers();
      const supabase = getSSRClient(request, responseHeaders);

      // Build the confirmation URL. Supabase will append token_hash and type.
      // The app's /api/auth/confirm handler will process these and create the session.
      const siteUrl = getEnvVar("VITE_SITE_URL") || "https://hrshoes.pages.dev";
      const confirmUrl = `${siteUrl}/api/auth/confirm${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: confirmUrl,
        },
      });

      if (error) {
        console.error("[auth] signUp API error:", error);
        if (error.status === 429) {
          return {
            status: "error" as const,
            message: "Limite de tentativas atingido (Supabase Free Tier). Aguarde 60 min ou desative 'Confirm email' no seu painel do Supabase em Authentication -> Providers -> Email.",
          };
        }
        if (error.message?.toLowerCase().includes("already registered") || error.message?.toLowerCase().includes("user already")) {
          return { status: "error" as const, message: "Este e-mail já possui uma conta. Faça login ou recupere sua senha." };
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

      // If session is active, we MUST throw redirect to propagate the Set-Cookie headers
      // since vinxi/http context is lost and we can't use setCookie.
      throw Router.redirect({
        to: redirectTo || "/conta",
        headers: responseHeaders,
      });
    } catch (e: unknown) {
      if (e instanceof Response || (e && typeof e === 'object' && 'isRedirect' in e)) throw e;
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      console.error("[auth] Erro catastrófico no signUp:", e);
      return { status: "error" as const, message: `Erro interno no cadastro: ${message}` };
    }
  });

export const signOut = createServerFn({ method: "POST" })
  .handler(async ({ request }) => {
    try {
      const responseHeaders = new Headers();
      const supabase = getSSRClient(request, responseHeaders);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { status: "error" as const, message: error.message };
      }

      // Clear guest session manually via Headers to avoid unctx crash
      responseHeaders.append(
        "Set-Cookie",
        `hr_shoes_guest_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${
          process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`
      );

      throw Router.redirect({
        to: "/entrar",
        headers: responseHeaders,
      });
    } catch (e: unknown) {
      if (e instanceof Response || (e && typeof e === 'object' && 'isRedirect' in e)) throw e;
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      return { status: "error" as const, message: `Erro ao realizar logout: ${message}` };
    }
  });

export const updatePassword = createServerFn({ method: "POST" })
  .validator(ResetPasswordSchema)
  .handler(async ({ data: { password }, request }) => {
    try {
      const responseHeaders = new Headers();
      const supabase = getSSRClient(request, responseHeaders);
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return { status: "error" as const, message: error.message };
      }

      throw Router.redirect({
        to: "/conta",
        headers: responseHeaders,
      });
    } catch (e: unknown) {
      // If it's a redirect, let it pass through
      if (e instanceof Response || (e && typeof e === 'object' && 'isRedirect' in e)) {
        throw e;
      }
      return { status: "error" as const, message: "Erro inesperado ao atualizar a senha." };
    }
  });

export const resetPasswordForEmail = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email(), redirectTo: z.string() }))
  .handler(async ({ data: { email, redirectTo }, request }) => {
    try {
      const responseHeaders = new Headers();
      const supabase = getSSRClient(request, responseHeaders);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        if (error.status === 429) {
          return {
            status: "error" as const,
            message: "Limite de envio de e-mails atingido. Aguarde 60 minutos antes de solicitar novamente.",
          };
        }
        return { status: "error" as const, message: error.message };
      }
      return { status: "success" as const };
    } catch (e) {
      if (e instanceof Response || (e && typeof e === 'object' && 'isRedirect' in e)) throw e;
      return { status: "error" as const, message: "Erro ao solicitar redefinição." };
    }
  });

export const getProfile = createServerFn({ method: "GET" }).handler(async ({ request }) => {
  const responseHeaders = new Headers();
  const supabase = getSSRClient(request, responseHeaders);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (error) {
    console.warn(`[auth] getProfile could not load profile for ${user.id}:`, error.message);
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.full_name || profile?.full_name || "",
    phone: user.user_metadata?.phone || profile?.phone || "",
    role: profile?.role || "customer",
  };
});

export const updateProfile = createServerFn({ method: "POST" })
  .validator(
    z.object({
      fullName: z.string().min(2),
      phone: z.string().optional(),
    }),
  )
  .handler(async ({ data, request }) => {
    const responseHeaders = new Headers();
    const supabase = getSSRClient(request, responseHeaders);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: data.fullName,
        phone: data.phone,
      },
    });

    if (error) throw new Error(error.message);

    // Also update profiles table
    await supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        phone: data.phone,
      })
      .eq("id", user.id);

    return { status: "success" };
  });
