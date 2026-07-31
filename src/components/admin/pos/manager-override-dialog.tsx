import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle } from "lucide-react";

interface ManagerOverrideDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function ManagerOverrideDialog({
  isOpen,
  onClose,
  onSuccess,
  title = "Autorização Gerencial",
  description = "Esta ação requer a senha de um gerente para prosseguir.",
}: ManagerOverrideDialogProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Idealmente, chamaríamos uma Server Function real: await validateManagerPin({ pin })
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulação temporária até o backend estar totalmente integrado
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (pin === "1234") {
        onSuccess();
        setPin("");
        onClose();
      } else {
        setError("PIN incorreto. Tente novamente.");
      }
    } catch (err) {
      setError("Ocorreu um erro ao validar o PIN.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 mb-4">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin" className="sr-only">
              PIN
            </Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoFocus
              className="text-center text-2xl tracking-widest"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive justify-center bg-destructive/10 p-2 rounded">
              <AlertCircle className="size-4" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || pin.length < 4} className="bg-orange-600 hover:bg-orange-700">
              {isLoading ? "Validando..." : "Autorizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
