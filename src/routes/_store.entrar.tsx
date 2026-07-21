import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronRight, ShieldAlert, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/commerce/page-header";
import { signInWithPassword, signInWithOAuth } from "@/services/auth.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/entrar")({
  head: () => ({
    meta: [{ title: "Entrar — Hr Shoes" }],
  }),
  validateSearch: (search: Record<string, unknown>): { returnUrl?: string; error?: string } => {
    return {
      returnUrl: typeof search.returnUrl === "string" ? search.returnUrl : undefined,
      error: typeof search.error === "string" ? search.error : undefined,
    };
  },
  component: LoginPage,
});

const LoginSchema = z.object({
  email: z.string().email("Digite um e-mail válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginForm = z.infer<typeof LoginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const returnUrl = search.returnUrl ?? "/conta";
  const errorParam = search.error;
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (errorParam === "auth-callback-failed") {
      toast.error("Ocorreu um erro ao concluir o login social. Tente novamente.");
    } else if (errorParam) {
      toast.error(errorParam);
    }
  }, [errorParam]);

  // Countdown tick when rate-limited
  useEffect(() => {
    if (!rateLimitedUntil) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((rateLimitedUntil - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        setRateLimitedUntil(null);
        if (countdownRef.current) clearInterval(countdownRef.current);
      }
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [rateLimitedUntil]);

  const form = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) return;
    try {
      const result = await signInWithPassword({
        data: { ...data, redirectTo: returnUrl },
      });

      if (result.status === "rate_limited") {
        const until = Date.now() + (result.retryAfterMs ?? 10 * 60 * 1000);
        setRateLimitedUntil(until);
        return;
      }


      toast.success("Login efetuado com sucesso!");
      // CRITICAL: We must invalidate the router to clear any cached unauthenticated data
      await router.invalidate();
      navigate({ to: returnUrl });
    } catch (e: any) {
      toast.error(e.message || "Erro inesperado ao fazer login");
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    try {
      const redirectTo = `${window.location.origin}/api/auth/callback?next=${returnUrl}`;
      const result = await signInWithOAuth({ data: { provider, redirectTo } });
      if (result.status === "success" && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.message || "Erro ao inicializar login social.");
      }
    } catch (e) {
      toast.error("Ocorreu um erro com o login social.");
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      {/* Breadcrumb */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link to="/" className="hover:text-foreground">
          Início
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-foreground">Entrar</span>
      </nav>

      <div className="mx-auto max-w-md">
        <PageHeader title="Bem-vinda de volta" description="Acesse sua conta para continuar." />

        <div className="mt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Senha</FormLabel>
                      <Link to="/recuperar-senha" className="text-xs text-primary hover:underline">
                        Esqueceu a senha?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rate limit banner */}
              {rateLimitedUntil && countdown > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <ShieldAlert className="size-4 shrink-0 text-destructive mt-0.5" aria-hidden />
                  <div>
                    <p className="text-sm font-medium text-destructive">Conta temporariamente bloqueada</p>
                    <p className="text-xs text-destructive/80 mt-0.5 flex items-center gap-1">
                      <Clock className="size-3" aria-hidden />
                      Tente novamente em {Math.floor(countdown / 60) > 0 ? `${Math.floor(countdown / 60)}m ` : ""}{countdown % 60}s
                    </p>
                  </div>
                </div>
              )}

              <Button
                id="btn-entrar"
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting || (!!rateLimitedUntil && countdown > 0)}
              >
                {form.formState.isSubmitting
                  ? "Entrando..."
                  : rateLimitedUntil && countdown > 0
                  ? `Bloqueado (${countdown}s)`
                  : "Entrar"}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full font-normal"
            onClick={() => handleOAuth("google")}
          >
            <span className="mr-2 h-4 w-4 text-lg font-bold">G</span>
            Google
          </Button>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem uma conta?{" "}
            <Link
              to="/cadastro"
              search={{ returnUrl }}
              className="font-medium text-primary hover:underline"
            >
              Crie agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
