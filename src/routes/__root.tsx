import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { getThemeSettings, getPublicStoreSettings } from "@/services/cms.functions";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não foi possível carregar esta página. Tente novamente ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    // Busca dados de forma otimista, se falhar, retorna nulo.
    const [themeRes, storeRes] = await Promise.all([
      getThemeSettings().catch(() => ({ status: "error", data: null })),
      getPublicStoreSettings().catch(() => ({ status: "error", data: null }))
    ]);
    return {
      theme: themeRes.status === "ok" ? themeRes.data : null,
      store: storeRes.status === "ok" ? storeRes.data : null
    };
  },
  head: ({ loaderData }) => {
    const store = (loaderData as any)?.store;
    const theme = (loaderData as any)?.theme;
    const storeName = store?.name || "Hr Shoes";
    
    const seoTitle = store?.seo_title || `${storeName} — Conforto e Estilo`;
    const seoDesc = store?.seo_description || store?.description || "Moda feminina contemporânea com conforto e estilo. Descubra a curadoria da Hr Shoes.";
    const seoKeywords = store?.seo_keywords || "";
    
    const metaTags = [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5",
      },
      { title: seoTitle },
      {
        name: "description",
        content: seoDesc,
      },
      { name: "author", content: storeName },
      { name: "theme-color", content: theme?.background_color || "#F3F1EC" },
      { property: "og:title", content: seoTitle },
      {
        property: "og:description",
        content: seoDesc,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];

    if (seoKeywords) {
      metaTags.push({ name: "keywords", content: seoKeywords });
    }
    
    return {
      meta: metaTags,
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: `https://fonts.googleapis.com/css2?family=${(theme?.font_body || "Manrope").replace(/ /g, "+")}:wght@400;500;600;700;800&family=${(theme?.font_heading || "Fraunces").replace(/ /g, "+")}:wght@400;500;600&display=swap`,
        },
      ],
    }
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const { theme } = Route.useLoaderData() as any;
  
  // Converte a cor hexadecimal para variáveis CSS amigáveis se houver tema configurado
  // (Usa uma versão simplificada ou injeta a cor bruta dependendo da implementação)
  
  const customStyles = theme ? `
    :root {
      --primary: ${theme.primary_color || "#FF4FB8"};
      --background: ${theme.background_color || "#F3F1EC"};
      --foreground: ${theme.text_color || "#292729"};
      --radius: ${theme.border_radius || "0.5rem"};
      --font-sans: "${theme.font_body || "Manrope"}", sans-serif;
      --font-serif: "${theme.font_heading || "Fraunces"}", serif;
    }
  ` : "";

  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        {theme && <style dangerouslySetInnerHTML={{ __html: customStyles }} />}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { Toaster } from "@/components/ui/sonner";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
