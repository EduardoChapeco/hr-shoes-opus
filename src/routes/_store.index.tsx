import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Truck, ShieldCheck, RefreshCcw, Sparkles } from "lucide-react";

import heroImg from "@/assets/hero-editorial.jpg";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/_store/")({
  head: () => ({
    meta: [
      { title: "Hr Shoes — Conforto e Estilo" },
      {
        name: "description",
        content:
          "Loja online da Hr Shoes: moda feminina contemporânea com conforto e estilo.",
      },
    ],
  }),
  component: Home,
});

const BENEFITS = [
  { icon: Truck, title: "Entrega e retirada", text: "Receba em casa ou retire na loja." },
  { icon: ShieldCheck, title: "Compra segura", text: "Pagamento protegido e dados cuidados." },
  { icon: RefreshCcw, title: "Trocas facilitadas", text: "Processo simples de troca e devolução." },
  { icon: Sparkles, title: "Curadoria", text: "Peças escolhidas com conforto e estilo." },
];

function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto grid max-w-screen-xl items-center gap-8 px-4 pt-8 md:grid-cols-2 md:gap-12 md:px-6 md:pt-14">
        <div className="order-2 md:order-1">
          <p className="eyebrow text-primary">Nova temporada</p>
          <h1 className="text-editorial mt-3 text-4xl text-foreground sm:text-5xl lg:text-6xl">
            Conforto e estilo em cada passo
          </h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            Moda feminina contemporânea da Hr Shoes. Uma curadoria pensada para
            o seu dia a dia — leve, elegante e confortável.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/catalogo">
                Ver catálogo
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/perfil-da-loja">Conhecer a loja</Link>
            </Button>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="overflow-hidden rounded-3xl bg-secondary shadow-md">
            <img
              src={heroImg}
              alt="Composição editorial da Hr Shoes com scarpin e tecido acetinado"
              width={1280}
              height={1600}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto mt-14 max-w-screen-xl px-4 md:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-border bg-card p-5"
            >
              <b.icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                {b.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured — connectable section, honest empty state (no fake products) */}
      <section className="mx-auto mt-16 max-w-screen-xl px-4 md:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow text-primary">Vitrine</p>
            <h2 className="text-editorial text-2xl text-foreground sm:text-3xl">
              Destaques
            </h2>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/catalogo">
              Ver tudo
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
        <EmptyState
          title="Ainda não há produtos publicados"
          description="Assim que a loja publicar os primeiros produtos, eles aparecerão aqui automaticamente."
        />
      </section>

      {/* Editorial */}
      <section className="mx-auto mt-16 max-w-screen-xl px-4 md:px-6">
        <div className="rounded-3xl bg-accent px-6 py-12 text-center md:px-16 md:py-16">
          <p className="eyebrow text-primary">Hr Shoes</p>
          <p className="text-editorial mx-auto mt-3 max-w-2xl text-2xl text-accent-foreground sm:text-3xl">
            Moda que combina o cuidado de uma loja de bairro com a experiência
            de uma grande vitrine online.
          </p>
        </div>
      </section>
    </div>
  );
}
