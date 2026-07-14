import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/commerce/page-header";
import { getUserSession } from "@/services/auth.functions";

export const Route = createFileRoute("/_store/checkout/identificacao")({
  head: () => ({
    meta: [{ title: "Identificação — Checkout Hr Shoes" }],
  }),
  beforeLoad: async () => {
    const user = await getUserSession();
    if (user) {
      throw redirect({ to: "/checkout/entrega" });
    }
  },
  component: IdentificationPage,
});

function IdentificationPage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link to="/carrinho" className="hover:text-foreground">
          Carrinho
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="text-foreground">Identificação</span>
      </nav>

      <div className="mx-auto max-w-md">
        <PageHeader title="Identificação" description="Como você prefere continuar?" />

        <div className="mt-8 space-y-4">
          <Button asChild size="lg" className="w-full">
            <Link to="/entrar" search={{ returnUrl: "/checkout/entrega" }}>
              Fazer login
            </Link>
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">ou</span>
            </div>
          </div>

          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/checkout/entrega">Continuar como visitante</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
