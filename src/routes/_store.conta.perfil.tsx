import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getProfile, updateProfile } from "@/services/auth.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/conta/perfil")({
  head: () => ({ meta: [{ title: "Meu Perfil — Hr Shoes" }] }),
  loader: () => getProfile(),
  component: ProfilePage,
});

function ProfilePage() {
  const profile = Route.useLoaderData();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile.fullName || "",
    phone: profile.phone || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await updateProfile({ data: formData });
      toast.success("Perfil atualizado com sucesso!");
      router.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <h2 className="text-editorial text-2xl text-foreground mb-6">Perfil</h2>
      
      <form onSubmit={handleSubmit} className="max-w-xl bg-card p-6 rounded-xl border border-border space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">E-mail</label>
          <Input value={profile.email} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado por aqui.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Nome Completo *</label>
          <Input 
            required 
            value={formData.fullName} 
            onChange={e => setFormData({ ...formData, fullName: e.target.value })} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Telefone</label>
          <Input 
            placeholder="(11) 99999-9999"
            value={formData.phone} 
            onChange={e => setFormData({ ...formData, phone: e.target.value })} 
          />
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </section>
  );
}
