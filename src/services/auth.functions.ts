/**
 * Auth server functions — Hr Shoes Commerce
 *
 * Handles login, signup, oauth, logout, and session retrieval using the SSR client.
 * Never stores credentials in the client; delegates all auth to Supabase.
 * Profiles are created strictly by the DB trigger `handle_new_user` on auth.users insert.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getSSRClient } from "@/lib/supabase-ssr";
import { getServerClient } from "@/lib/supabase";
import { mergeGuestCart } from "./cart.functions";
import { Provider } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const LoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const RegisterSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  fullName: z.string().min(2, "Nome é obrigatório"),
});

const ResetPasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
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
  .handler(async ({ data: { email, password } }) => {
    try {
      const supabase = getSSRClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { status: "error" as const, message: "E-mail ou senha incorretos." };
      }

      if (data.user) {
        try {
          await mergeGuestCart({
            data: {
              customerId: data.user.id,
              accessToken: data.session?.access_token,
            },
          });
        } catch (err) {
          console.error("Falha ao mesclar carrinho durante login (ignorado):", err);
        }
      }

      return { status: "success" as const, data: data.user };
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new Error("Erro ao realizar login: " + e.message);
      }
      throw new Error("Erro ao realizar login");
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
      if (e instanceof Error) {
        throw new Error("Erro ao inicializar OAuth: " + e.message);
      }
      throw new Error("Erro ao inicializar OAuth");
    }
  });

export const signUpWithPassword = createServerFn({ method: "POST" })
  .validator(RegisterSchema)
  .handler(async ({ data: { email, password, fullName } }) => {
    try {
      const supabase = getSSRClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.status === 429) {
          return {
            status: "error" as const,
            message: "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.",
          };
        }
        return { status: "error" as const, message: error.message };
      }

      if (data.user) {
        // We do NOT manually create the profile here anymore.
        // The DB trigger `handle_new_user` handles profile creation securely.

        try {
          await mergeGuestCart({
            data: {
              customerId: data.user.id,
              accessToken: data.session?.access_token,
            },
          });
        } catch (err) {
          console.error("Falha ao mesclar carrinho durante cadastro (ignorado):", err);
        }
      }

      return { status: "success" as const, data: data.user, sessionActive: !!data.session };
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new Error("Erro ao realizar cadastro: " + e.message);
      }
      throw new Error("Erro ao realizar cadastro");
    }
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const supabase = getSSRClient();
    await supabase.auth.signOut();
    return { status: "success" as const };
  } catch {
    return { status: "error" as const };
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
      return { status: "error" as const, message: "Erro inesperado ao atualizar a senha." };
    }
  });

export const getProfile = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getSSRClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

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
  .handler(async ({ data }) => {
    const supabase = getSSRClient();
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
