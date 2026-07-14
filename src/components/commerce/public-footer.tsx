import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/commerce/logo";

const COLUMNS: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: "Comprar",
    links: [
      { to: "/catalogo", label: "Catálogo" },
      { to: "/promocoes", label: "Promoções" },
      { to: "/buscar", label: "Buscar" },
    ],
  },
  {
    title: "A loja",
    links: [
      { to: "/perfil-da-loja", label: "Sobre a Hr Shoes" },
      { to: "/contato", label: "Contato" },
      { to: "/faq", label: "Dúvidas frequentes" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { to: "/trocas-e-devolucoes", label: "Trocas e devoluções" },
      { to: "/privacidade", label: "Privacidade" },
      { to: "/termos", label: "Termos" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              Moda feminina contemporânea com conforto e estilo. Curadoria da Hr
              Shoes.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="eyebrow mb-3 text-muted-foreground">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-foreground/80 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Hr Shoes. Todos os direitos reservados.</p>
          <p>Conforto e Estilo</p>
        </div>
      </div>
    </footer>
  );
}
