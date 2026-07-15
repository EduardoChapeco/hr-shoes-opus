import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { signUpWithPassword, signInWithOAuth } from "@/services/auth.functions";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";

export const Route = createFileRoute("/_store/cadastro")({
  head: () => ({
    meta: [{ title: "Cadastro — Hr Shoes" }],
  }),
  validateSearch: (search: Record<string, unknown>): { returnUrl?: string } => {
    return {
      returnUrl: typeof search.returnUrl === "string" ? search.returnUrl : undefined,
    };
  },
  component: RegisterPage,
});

const RegisterSchema = z.object({
  fullName: z.string().min(2, "Digite seu nome completo"),
  email: z.string().email("Digite um e-mail válido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type RegisterForm = z.infer<typeof RegisterSchema>;

function RegisterPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const returnUrl = search.returnUrl ?? "/conta";

  const form = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const result = await signUpWithPassword({ data });

      if (result.status === "error") {
        toast.error(result.message);
        return;
      }

      if (!result.sessionActive) {
        toast.success("Conta criada! Por favor, verifique seu e-mail para confirmar o cadastro.");
        // Do NOT navigate to /conta because the user is not logged in yet.
        navigate({ to: "/entrar", search: { returnUrl } });
        return;
      }

      toast.success("Conta criada com sucesso!");
      // CRITICAL: We must invalidate the router to clear any cached unauthenticated data
      await router.invalidate();
      navigate({ to: returnUrl });
    } catch (e) {
      toast.error("Ocorreu um erro ao tentar criar a conta.");
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

          <Button variant="outline" className="w-full font-normal" onClick={() => handleOAuth("google")}>
            <FcGoogle className="mr-2 h-4 w-4" />
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
