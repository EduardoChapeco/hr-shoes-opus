import { createFileRoute } from "@tanstack/react-router";
import { getMatchTimeReport } from "@/services/match-time.functions";
import { PageHeader } from "@/components/commerce/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/state/states";
import { Heart, Flame, HeartCrack } from "lucide-react";

export const Route = createFileRoute("/admin/match-time")({
  head: () => ({ meta: [{ title: "Match Time Reports — Hr Shoes" }] }),
  loader: async () => {
    const res = await getMatchTimeReport();
    if (res.status === "error") throw new Error(res.message);
    return res.data;
  },
  component: AdminMatchTimePage,
});

function AdminMatchTimePage() {
  const { topProducts } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Match Time"
        description="Acompanhe as preferências dos clientes na experiência de descoberta (Swipe)."
      />

      {topProducts.length === 0 ? (
        <EmptyState
          title="Nenhum dado ainda"
          description="Nenhum cliente iniciou uma sessão de Match Time. Compartilhe o link /match-time com seus clientes."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {topProducts.map((item: any, index: number) => (
            <Card key={item.product.slug} className="overflow-hidden">
              <div className="bg-muted aspect-video relative flex items-center justify-center">
                <Flame className="w-12 h-12 text-primary opacity-20" />
                <div className="absolute top-2 left-2 bg-background/80 backdrop-blur rounded-full px-3 py-1 text-xs font-bold text-foreground">
                  #{index + 1}
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg leading-tight truncate" title={item.product.name}>
                  {item.product.name}
                </CardTitle>
                <CardDescription>{item.product.slug}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-2 text-sm font-medium">
                <div className="flex items-center gap-1.5 text-primary">
                  <Heart className="w-4 h-4" fill="currentColor" />
                  <span>{item.likes} Amei</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <HeartCrack className="w-4 h-4" />
                  <span>{item.dislikes} Não Amei</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
