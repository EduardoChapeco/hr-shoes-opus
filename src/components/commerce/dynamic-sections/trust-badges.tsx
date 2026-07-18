import * as React from "react";
import { ShieldCheck, Truck, Lock, RotateCcw, CreditCard, Award } from "lucide-react";

interface TrustBadgesProps {
  content: {
    badges?: Array<{
      icon: "shield" | "truck" | "lock" | "return" | "card" | "award";
      title: string;
      description?: string;
    }>;
  };
}

export function TrustBadges({ content }: TrustBadgesProps) {
  const badges = content.badges || [
    { icon: "lock", title: "Compra 100% Segura", description: "Seus dados estão protegidos" },
    { icon: "truck", title: "Frete Grátis", description: "Para todo o Brasil" },
    { icon: "return", title: "Primeira Troca Grátis", description: "Até 30 dias após receber" }
  ];

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case "shield": return <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-primary" />;
      case "truck": return <Truck className="w-8 h-8 md:w-10 md:h-10 text-primary" />;
      case "lock": return <Lock className="w-8 h-8 md:w-10 md:h-10 text-primary" />;
      case "return": return <RotateCcw className="w-8 h-8 md:w-10 md:h-10 text-primary" />;
      case "card": return <CreditCard className="w-8 h-8 md:w-10 md:h-10 text-primary" />;
      case "award": return <Award className="w-8 h-8 md:w-10 md:h-10 text-primary" />;
      default: return <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-primary" />;
    }
  };

  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-border/50 bg-card">
      {badges.map((badge, idx) => (
        <div key={idx} className="flex flex-col items-center text-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            {getIcon(badge.icon)}
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">{badge.title}</h4>
            {badge.description && (
              <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
