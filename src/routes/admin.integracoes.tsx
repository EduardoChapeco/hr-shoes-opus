import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Settings2, Save, Copy } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { listIntegrations, upsertIntegration } from "@/services/growth.functions";

export const Route = createFileRoute("/admin/integracoes")({
  head: () => ({ meta: [{ title: "Integrações — Hr Shoes" }] }),
  loader: async () => {
    return await listIntegrations();
  },
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const integrations = Route.useLoaderData() || [];
  const router = useRouter();

  const getIntegration = (provider: string) => {
    return (
      integrations.find((i: any) => i.provider === provider) || {
        is_active: false,
        credentials: {},
      }
    );
  };

  const [metaPixel, setMetaPixel] = useState(getIntegration("meta_pixel"));
  const [googleAnalytics, setGoogleAnalytics] = useState(getIntegration("google_analytics"));
  const [melhorEnvio, setMelhorEnvio] = useState(getIntegration("melhor_envio"));
  const [googleMerchant, setGoogleMerchant] = useState(getIntegration("google_merchant_center"));
  const [isSaving, setIsSaving] = useState(false);
  const storeId = integrations.length > 0 ? integrations[0].store_id : "";
  const feedUrl = storeId 
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/feed/xml?store=${storeId}` 
    : "Loja não identificada. Salve uma configuração primeiro.";

  const handleSave = async (provider: "meta_pixel" | "google_analytics" | "melhor_envio" | "google_merchant_center", state: any) => {
    setIsSaving(true);
    try {
      await upsertIntegration({
        data: {
          provider,
          is_active: state.is_active,
          credentials: state.credentials,
        },
      });
      toast.success("Integração salva com sucesso!");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro inesperado ao salvar integração.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações e Pixels"
        description="Conecte sua loja a serviços externos e ferramentas de marketing."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meta Pixel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Meta Pixel (Facebook/Instagram)
            </CardTitle>
            <CardDescription>Rastreie conversões dos seus anúncios da Meta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status da Integração</span>
              <Switch
                checked={metaPixel.is_active}
                onCheckedChange={(c) => setMetaPixel({ ...metaPixel, is_active: c })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ID do Pixel</label>
              <Input
                placeholder="Ex: 1234567890"
                value={metaPixel.credentials?.pixel_id || ""}
                onChange={(e) =>
                  setMetaPixel({
                    ...metaPixel,
                    credentials: { ...metaPixel.credentials, pixel_id: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Token de Conversão (API) - Opcional</label>
              <Input
                type="password"
                placeholder="Token de Acesso"
                value={metaPixel.credentials?.access_token || ""}
                onChange={(e) =>
                  setMetaPixel({
                    ...metaPixel,
                    credentials: { ...metaPixel.credentials, access_token: e.target.value },
                  })
                }
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button disabled={isSaving} onClick={() => handleSave("meta_pixel", metaPixel)}>
              <Save className="mr-2 h-4 w-4" /> Salvar Configuração
            </Button>
          </CardFooter>
        </Card>

        {/* Google Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Google Analytics (GA4)
            </CardTitle>
            <CardDescription>Acompanhe o tráfego e as vendas da sua loja.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status da Integração</span>
              <Switch
                checked={googleAnalytics.is_active}
                onCheckedChange={(c) => setGoogleAnalytics({ ...googleAnalytics, is_active: c })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ID de Medição (Measurement ID)</label>
              <Input
                placeholder="Ex: G-XXXXXXXXXX"
                value={googleAnalytics.credentials?.measurement_id || ""}
                onChange={(e) =>
                  setGoogleAnalytics({
                    ...googleAnalytics,
                    credentials: { ...googleAnalytics.credentials, measurement_id: e.target.value },
                  })
                }
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              disabled={isSaving}
              onClick={() => handleSave("google_analytics", googleAnalytics)}
            >
              <Save className="mr-2 h-4 w-4" /> Salvar Configuração
            </Button>
          </CardFooter>
        </Card>

        {/* Melhor Envio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Logística (Melhor Envio)
            </CardTitle>
            <CardDescription>Conecte sua conta para cálculo automático de frete e emissão de etiquetas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status da Integração</span>
              <Switch
                checked={melhorEnvio.is_active}
                onCheckedChange={(c) => setMelhorEnvio({ ...melhorEnvio, is_active: c })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Token de Acesso (Bearer Token)</label>
              <Input
                type="password"
                placeholder="Insira seu token de API"
                value={melhorEnvio.credentials?.api_token || ""}
                onChange={(e) =>
                  setMelhorEnvio({
                    ...melhorEnvio,
                    credentials: { ...melhorEnvio.credentials, api_token: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CEP de Origem da Loja</label>
              <Input
                placeholder="Ex: 89900000"
                value={melhorEnvio.credentials?.postal_code || ""}
                onChange={(e) =>
                  setMelhorEnvio({
                    ...melhorEnvio,
                    credentials: { ...melhorEnvio.credentials, postal_code: e.target.value.replace(/\D/g, "") },
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium">Modo Sandbox (Testes)</span>
              <Switch
                checked={melhorEnvio.credentials?.sandbox ?? true}
                onCheckedChange={(c) =>
                  setMelhorEnvio({
                    ...melhorEnvio,
                    credentials: { ...melhorEnvio.credentials, sandbox: c },
                  })
                }
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              disabled={isSaving}
              onClick={() => handleSave("melhor_envio", melhorEnvio)}
            >
              <Save className="mr-2 h-4 w-4" /> Salvar Configuração
            </Button>
          </CardFooter>
        </Card>

        {/* Google Merchant Center */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Google Merchant Center
            </CardTitle>
            <CardDescription>Sincronize seu catálogo de produtos no Google Shopping.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status da Integração</span>
              <Switch
                checked={googleMerchant.is_active}
                onCheckedChange={(c) => setGoogleMerchant({ ...googleMerchant, is_active: c })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Merchant ID</label>
              <Input
                placeholder="Ex: 123456789"
                value={googleMerchant.credentials?.merchant_id || ""}
                onChange={(e) =>
                  setGoogleMerchant({
                    ...googleMerchant,
                    credentials: { ...googleMerchant.credentials, merchant_id: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Feed XML URL (Catálogo)</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={feedUrl}
                  className="bg-muted text-muted-foreground"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (feedUrl && !feedUrl.startsWith("Loja")) {
                      navigator.clipboard.writeText(feedUrl);
                      toast.success("URL do Feed copiada para a área de transferência!");
                    } else {
                      toast.error("Salve a configuração primeiro para obter a URL.");
                    }
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" /> Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copie este link e adicione como fonte de dados (Feed) no Google Merchant Center ou Meta Commerce Manager.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              disabled={isSaving}
              onClick={() => handleSave("google_merchant_center", googleMerchant)}
            >
              <Save className="mr-2 h-4 w-4" /> Salvar Configuração
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
