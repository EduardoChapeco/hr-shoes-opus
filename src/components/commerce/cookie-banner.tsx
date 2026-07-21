import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Look for hr_shoes_cookie_consent in actual browser cookies
    const hasConsent = document.cookie.split('; ').find(row => row.startsWith('hr_shoes_cookie_consent='));
    if (!hasConsent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    // Set cookie to expire in 1 year (31536000 seconds)
    document.cookie = "hr_shoes_cookie_consent=accepted; path=/; max-age=31536000; SameSite=Lax";
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pb-20 sm:pb-6 pointer-events-none">
      <div className="mx-auto max-w-4xl bg-background border shadow-xl rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-auto">
        <div className="text-sm text-muted-foreground flex-1">
          <p className="font-medium text-foreground mb-1">Valorizamos sua privacidade</p>
          Utilizamos cookies essenciais para o funcionamento do site e para melhorar sua experiência. 
          Ao continuar navegando, você concorda com a nossa{" "}
          <Link to="/privacidade" className="underline hover:text-foreground">
            Política de Privacidade
          </Link>.
        </div>
        <div className="flex shrink-0 gap-3 w-full sm:w-auto">
          <Button onClick={handleAccept} className="w-full sm:w-auto">
            Entendi e Aceito
          </Button>
        </div>
      </div>
    </div>
  );
}
