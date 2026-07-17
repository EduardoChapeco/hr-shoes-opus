import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PageHeader } from "@/components/commerce/page-header";
import { updatePassword } from "@/services/auth.functions";
import { getBrowserClient } from "@/lib/supabase";

export const Route = createFileRoute("/_store/redefinir-senha")({
  head: () => ({ meta: [{ title: "Redefinir senha — Hr Shoes" }] }),
  component: ResetPasswordPage,
});

const ResetSchema = z
  .object({
    password: z
      .string()
      .min(6, "A senha deve ter no mínimo 6 caracteres")
      .regex(/[a-zA-Z]/, "A senha deve conter pelo menos uma letra")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número"),
    confirmPassword: z.string().min(6, "Confirme sua nova senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof ResetSchema>;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // When the user clicks the link in their email, Supabase sets the session in the URL fragment.
    // The browser client automatically picks it up and establishes a session.
    // We just need to verify it exists before allowing them to reset the password.
    const checkSession = async () => {
      const supabase = getBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setHasSession(!!session);
      setSessionChecked(true);
    };
    checkSession();
  }, []);

  const form = useForm<ResetForm>({
    resolver: zodResolver(ResetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetForm) => {
    try {
      const result = await updatePassword({ data: { password: data.password } });

      if (result.status === "error") {
        toast.error(result.message);
        return;
      }

      toast.success("Senha atualizada com sucesso!");
      navigate({ to: "/conta" });
    } catch (e) {
      toast.error("Erro ao redefinir a senha.");
    }
  };

  if (!sessionChecked) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">Verificando token de segurança...</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4 text-destructive">Link inválido ou expirado</h1>
        <p className="text-muted-foreground mb-6">
          Não foi possível validar sua sessão. Por favor, solicite a recuperação de senha novamente.
        </p>
        <Button onClick={() => navigate({ to: "/recuperar-senha" })}>
          Solicitar nova recuperação
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-md">
        <PageHeader title="Nova senha" description="Digite sua nova senha de acesso." />

        <div className="mt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Atualizando..." : "Atualizar Senha"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
