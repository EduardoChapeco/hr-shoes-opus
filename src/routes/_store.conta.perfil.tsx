import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  getProfile,
  updateProfile,
  requestAccountDeletion,
} from "@/services/auth.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  User,
  Phone,
  Calendar,
  FileText,
  Mail,
  Trash2,
  ShieldCheck,
  Bell,
  Camera,
} from "lucide-react";

export const Route = createFileRoute("/_store/conta/perfil")({
  head: () => ({ meta: [{ title: "Meu Perfil — Hr Shoes" }] }),
  loader: () => getProfile(),
  component: ProfilePage,
});

// ─── CPF mask helper ────────────────────────────────────────────────────────
function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

// ─── Avatar uploader (local preview — actual upload via Storage TBD in M-08) ─
function AvatarSection({
  currentUrl,
  name,
  onUrlChange,
}: {
  currentUrl: string | null;
  name: string;
  onUrlChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-20 shrink-0">
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={name}
            className="size-20 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
            <span className="text-xl font-semibold text-primary">{initials || "?"}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute bottom-0 right-0 rounded-full bg-card border border-border p-1.5 shadow hover:bg-accent transition-colors"
          aria-label="Alterar foto de perfil"
        >
          <Camera className="size-3.5 text-foreground" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            // Local preview — full upload to Supabase Storage will be wired in M-08
            const url = URL.createObjectURL(file);
            onUrlChange(url);
          }}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{name || "Sem nome"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Clique no ícone da câmera para trocar a foto
        </p>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
function ProfilePage() {
  const profile = Route.useLoaderData();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: profile.fullName || "",
    phone: profile.phone || "",
    avatarUrl: profile.avatarUrl || "",
    cpf: profile.cpf ? maskCpf(profile.cpf) : "",
    birthDate: profile.birthDate || "",
    gender: profile.gender || "",
    newsletterOptIn: profile.newsletterOptIn ?? false,
  });

  const set = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // ── Save profile ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await updateProfile({
        data: {
          fullName: formData.fullName,
          phone: formData.phone || undefined,
          avatarUrl: formData.avatarUrl || undefined,
          cpf: formData.cpf.replace(/\D/g, "") || undefined,
          birthDate: formData.birthDate || undefined,
          gender: (formData.gender as "feminino" | "masculino" | "outro" | "prefiro_nao_dizer") || undefined,
          newsletterOptIn: formData.newsletterOptIn,
        },
      });
      toast.success("Perfil atualizado com sucesso!");
      router.invalidate();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao atualizar perfil.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "EXCLUIR") return;
    setIsDeleting(true);
    try {
      await requestAccountDeletion();
      toast.success("Conta excluída. Seus dados foram anonimizados conforme a LGPD.");
      // Redirect to home — session is gone
      window.location.href = "/";
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao excluir conta.";
      toast.error(msg);
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-editorial text-2xl text-foreground">Meu Perfil</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie seus dados pessoais e preferências.
        </p>
      </div>

      {/* ── Avatar ── */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <AvatarSection
          currentUrl={formData.avatarUrl || null}
          name={formData.fullName}
          onUrlChange={(url) => set("avatarUrl", url)}
        />
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados básicos */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="size-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">Dados pessoais</h3>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm">
              <Mail className="size-3.5 text-muted-foreground" aria-hidden />
              E-mail
            </Label>
            <Input value={profile.email ?? ""} disabled className="bg-muted text-muted-foreground" />
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado aqui.</p>
          </div>

          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="perfil-nome" className="text-sm">
              Nome completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="perfil-nome"
              required
              minLength={2}
              value={formData.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="perfil-phone" className="flex items-center gap-1.5 text-sm">
              <Phone className="size-3.5 text-muted-foreground" aria-hidden />
              Telefone / WhatsApp
            </Label>
            <Input
              id="perfil-phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CPF */}
            <div className="space-y-1.5">
              <Label htmlFor="perfil-cpf" className="flex items-center gap-1.5 text-sm">
                <FileText className="size-3.5 text-muted-foreground" aria-hidden />
                CPF
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 ml-1">
                  opcional
                </Badge>
              </Label>
              <Input
                id="perfil-cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => set("cpf", maskCpf(e.target.value))}
                maxLength={14}
              />
              <p className="text-xs text-muted-foreground">
                Utilizado para emissão de nota fiscal.
              </p>
            </div>

            {/* Birth date */}
            <div className="space-y-1.5">
              <Label htmlFor="perfil-nascimento" className="flex items-center gap-1.5 text-sm">
                <Calendar className="size-3.5 text-muted-foreground" aria-hidden />
                Data de nascimento
                <Badge variant="outline" className="text-[10px] h-4 px-1.5 ml-1">
                  opcional
                </Badge>
              </Label>
              <Input
                id="perfil-nascimento"
                type="date"
                value={formData.birthDate}
                onChange={(e) => set("birthDate", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <Label className="text-sm">
              Gênero
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 ml-2">
                opcional
              </Badge>
            </Label>
            <Select
              value={formData.gender}
              onValueChange={(v) => set("gender", v)}
            >
              <SelectTrigger id="perfil-genero">
                <SelectValue placeholder="Prefiro não informar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
                <SelectItem value="prefiro_nao_dizer">Prefiro não dizer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Preferências ── */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="size-4 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold text-foreground">Preferências</h3>
          </div>

          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <p className="text-sm font-medium text-foreground">Novidades e promoções</p>
              <p className="text-xs text-muted-foreground">
                Receba e-mails com lançamentos, promoções e dicas de estilo.
              </p>
            </div>
            <Switch
              id="newsletter-opt-in"
              checked={formData.newsletterOptIn}
              onCheckedChange={(v) => set("newsletterOptIn", v)}
              aria-label="Ativar recebimento de novidades e promoções"
            />
          </div>
        </div>

        {/* Save button */}
        <Button
          id="btn-salvar-perfil"
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Salvando..." : "Salvar alterações"}
        </Button>
      </form>

      {/* ── Privacidade & LGPD ── */}
      <Separator />

      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="size-5 text-destructive mt-0.5 shrink-0" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Privacidade e dados</h3>
            <p className="text-xs text-muted-foreground mt-1">
              De acordo com a LGPD (Lei 13.709/2018), você tem o direito de solicitar a exclusão
              dos seus dados pessoais. O histórico de compras é mantido por exigência fiscal
              (5 anos), mas seus dados de identificação serão anonimizados imediatamente.
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              id="btn-excluir-conta"
              variant="destructive"
              size="sm"
              className="gap-1.5"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Solicitar exclusão da minha conta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir minha conta permanentemente</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <span className="block">
                  Esta ação é <strong>irreversível</strong>. Seus dados pessoais (nome, telefone,
                  CPF, data de nascimento) serão anonimizados imediatamente.
                </span>
                <span className="block">
                  O histórico de pedidos e transações será mantido por exigência fiscal, mas
                  desvinculado dos seus dados de identificação.
                </span>
                <span className="block mt-3 font-medium text-foreground">
                  Para confirmar, digite{" "}
                  <code className="text-destructive font-bold bg-destructive/10 px-1 rounded">
                    EXCLUIR
                  </code>{" "}
                  abaixo:
                </span>
                <Input
                  id="input-confirmar-exclusao"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="EXCLUIR"
                  className="mt-2 font-mono"
                  autoComplete="off"
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirm("")}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                id="btn-confirmar-exclusao"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "EXCLUIR" || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Excluindo..." : "Excluir minha conta"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
