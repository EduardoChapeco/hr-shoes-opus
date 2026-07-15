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
import { signInWithPassword } from "@/services/auth.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/entrar")({
  head: () => ({
    meta: [{ title: "Entrar — Hr Shoes" }],
  }),
  validateSearch: (search: Record<string, unknown>): { returnUrl?: string } => {
    return {
      returnUrl: typeof search.returnUrl === "string" ? search.returnUrl : undefined,
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

  const form = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await signInWithPassword({ data });

      if (result.status === "error") {
        toast.error(result.message);
        return;
      }

      toast.success("Login efetuado com sucesso!");
      // CRITICAL: We must invalidate the router to clear any cached unauthenticated data
      await router.invalidate();
      navigate({ to: returnUrl });
    } catch (e) {
      toast.error("Ocorreu um erro ao tentar fazer login.");
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
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>

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
