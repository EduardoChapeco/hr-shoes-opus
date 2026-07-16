import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { getThemeSettings, updateThemeSettings } from "@/services/cms.functions";
import { ErrorState, UnconfiguredState } from "@/components/state/states";

export const Route = createFileRoute("/admin/cms/tema")({
  head: () => ({ meta: [{ title: "Tema — Hr Shoes" }] }),
  loader: async () => {
    return await getThemeSettings();
  },
  component: ThemeSettingsPage,
});

function ThemeSettingsPage() {
  const res = Route.useLoaderData();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (res.status === "unconfigured") {
    return (
      <div className="container max-w-4xl py-12 mx-auto px-4">
        <UnconfiguredState
          title="Integração Indisponível"
          description="A conexão com o Supabase não está configurada no servidor de produção."
        />
      </div>
    );
  }

  if (res.status === "error" || !res.data) {
    return (
      <div className="container max-w-4xl py-12 mx-auto px-4">
        <ErrorState
          title="Erro ao Carregar Tema"
          description={res.message || "Não foi possível conectar ao banco de dados."}
          onRetry={() => router.invalidate()}
        />
      </div>
    );
  }

  const theme = res.data;

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      primary_color: theme.primary_color || "#FF4FB8",
      background_color: theme.background_color || "#F3F1EC",
      text_color: theme.text_color || "#292729",
      font_heading: theme.font_heading || "Fraunces",
      font_body: theme.font_body || "Manrope",
      border_radius: theme.border_radius || "0.5rem",
      logo_url: theme.logo_url || null,
      favicon_url: theme.favicon_url || null,
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const res = await updateThemeSettings({ data: values });
      if (res.status === "success") {
        toast.success("Configurações de tema atualizadas!");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao atualizar");
      }
    } catch (e) {
      toast.error("Erro inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Tema e Aparência"
        description="Personalize as cores, fontes e estilo visual da sua loja."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cores da Marca</CardTitle>
            <CardDescription>Escolha as cores principais que representam sua loja.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex gap-2">
                <Input type="color" className="w-12 h-10 p-1" {...register("primary_color")} />
                <Input type="text" {...register("primary_color")} placeholder="#FF4FB8" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input type="color" className="w-12 h-10 p-1" {...register("background_color")} />
                <Input type="text" {...register("background_color")} placeholder="#F3F1EC" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor do Texto</Label>
              <div className="flex gap-2">
                <Input type="color" className="w-12 h-10 p-1" {...register("text_color")} />
                <Input type="text" {...register("text_color")} placeholder="#292729" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Identidade Visual</CardTitle>
            <CardDescription>Envie o logotipo e o favicon da sua loja.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Logotipo (Recomendado: PNG Transparente)</Label>
              <ImageUpload
                value={watch("logo_url")}
                onChange={(url) => setValue("logo_url", url, { shouldDirty: true })}
                onRemove={() => setValue("logo_url", null, { shouldDirty: true })}
                bucket="cms-media"
              />
            </div>
            <div className="space-y-2">
              <Label>Favicon (Recomendado: Ícone 1:1, 32x32px)</Label>
              <ImageUpload
                value={watch("favicon_url")}
                onChange={(url) => setValue("favicon_url", url, { shouldDirty: true })}
                onRemove={() => setValue("favicon_url", null, { shouldDirty: true })}
                bucket="cms-media"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipografia e Estilo</CardTitle>
            <CardDescription>Defina as fontes e o formato dos elementos.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Fonte de Títulos</Label>
              <Select
                defaultValue={theme.font_heading}
                onValueChange={(v) => setValue("font_heading", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fraunces">Fraunces (Serifada Clássica)</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display (Elegante)</SelectItem>
                  <SelectItem value="Inter">Inter (Moderna)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fonte de Textos</Label>
              <Select
                defaultValue={theme.font_body}
                onValueChange={(v) => setValue("font_body", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manrope">Manrope (Limpa)</SelectItem>
                  <SelectItem value="Roboto">Roboto (Padrão)</SelectItem>
                  <SelectItem value="Open Sans">Open Sans (Legível)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Arredondamento de Bordas (Botões/Cards)</Label>
              <Select
                defaultValue={theme.border_radius}
                onValueChange={(v) => setValue("border_radius", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0rem">Quadrado (0rem)</SelectItem>
                  <SelectItem value="0.25rem">Suave (0.25rem)</SelectItem>
                  <SelectItem value="0.5rem">Padrão (0.5rem)</SelectItem>
                  <SelectItem value="1rem">Arredondado (1rem)</SelectItem>
                  <SelectItem value="9999px">Pílula (9999px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
