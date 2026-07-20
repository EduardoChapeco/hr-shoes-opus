import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/commerce/page-header";
import { signUpWithPassword, signInWithOAuth } from "@/services/auth.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/cadastro")({
  head: () => ({
    meta: [{ title: "Cadastro — Hr Shoes" }],
  }),
  validateSearch: (search: Record<string, unknown>): { returnUrl?: string; error?: string } => {
    return {
      returnUrl: typeof search.returnUrl === "string" ? search.returnUrl : undefined,
      error: typeof search.error === "string" ? search.error : undefined,
    };
  },
  component: RegisterPage,
});

const RegisterSchema = z.object({
  fullName: z.string().min(2, "Digite seu nome completo"),
  email: z.string().email("Digite um e-mail válido"),
  password: z
    .string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .regex(/[a-zA-Z]/, "A senha deve conter pelo menos uma letra")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número"),
  isConsentLgpd: z.literal(true, {
    errorMap: () => ({ message: "Você deve aceitar os termos de privacidade (LGPD)." }),
  }),
});

type RegisterForm = z.infer<typeof RegisterSchema>;

function RegisterPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const returnUrl = search.returnUrl ?? "/conta";
  const errorParam = search.error;

  useEffect(() => {
    if (errorParam === "auth-callback-failed") {
      toast.error("Ocorreu um erro ao concluir o cadastro social. Tente novamente.");
    } else if (errorParam) {
      toast.error(errorParam);
    }
  }, [errorParam]);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { fullName: "", email: "", password: "", isConsentLgpd: false as true },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const result = await signUpWithPassword({
        data: {
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          redirectTo: returnUrl,
        },
      });

      if (result.status === "error") {
        toast.error(result.message);
        return;
      }

      if (!result.sessionActive) {
        toast.success(
          "Conta criada! Verifique seu e-mail e clique no link de confirmação para ativar seu acesso.",
          { duration: 8000 },
        );
        // User must confirm email before logging in. Redirect to /entrar.
        navigate({ to: "/entrar", search: { returnUrl } });
        return;
      }

      toast.success("Conta criada com sucesso!");
      await router.invalidate();
      navigate({ to: returnUrl });
    } catch (e: any) {
      const correlationId = Math.random().toString(36).substring(2, 10).toUpperCase();
      console.error(`[cadastro] Error ID: ${correlationId}`, e);
      toast.error(`Erro no cadastro. Código: ${e?.code || "ERR_SIGNUP"} | ID: ${correlationId}`);
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
        <span className="text-foreground">Cadastro</span>
      </nav>

      <div className="mx-auto max-w-md">
        <PageHeader title="Criar conta" description="Preencha os dados abaixo para se cadastrar." />

        <div className="mt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Maria da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isConsentLgpd"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Eu concordo com os Termos de Uso e Política de Privacidade (LGPD).
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou cadastre-se com</span>
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
            Já tem uma conta?{" "}
            <Link
              to="/entrar"
              search={{ returnUrl }}
              className="font-medium text-primary hover:underline"
            >
              Faça login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
