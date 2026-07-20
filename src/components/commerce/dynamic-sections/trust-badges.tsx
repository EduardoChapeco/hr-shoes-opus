import * as React from "react";
import { ShieldCheck, Truck, Lock, RotateCcw, CreditCard, Award } from "lucide-react";

interface TrustBadgesProps {
  content: {
    badges?: Array<{
      icon: "shield" | "truck" | "lock" | "return" | "card" | "award";
      title: string;
      description?: string;
      subtitle?: string;
    }>;
  };
}

export function TrustBadges({ content }: TrustBadgesProps) {
  const badges = (content.badges || []).length > 0 ? content.badges : [
    { icon: "lock", title: "Compra 100% Segura", description: "Seus dados estão protegidos" },
    { icon: "truck", title: "Frete Grátis", description: "Para todo o Brasil" },
    { icon: "return", title: "Primeira Troca Grátis", description: "Até 30 dias após receber" }
  ];

  const getIcon = (iconName: string) => {
    if (!iconName) return <ShieldCheck className="w-8 h-8 @md:w-10 @md:h-10 text-primary" />;
    if (iconName.startsWith("http") || iconName.startsWith("/")) {
      return <img src={iconName} alt="Badge" className="w-8 h-8 @md:w-10 @md:h-10 object-contain" />;
    }
    switch(iconName) {
      case "shield": return <ShieldCheck className="w-8 h-8 @md:w-10 @md:h-10 text-primary" />;
      case "truck": return <Truck className="w-8 h-8 @md:w-10 @md:h-10 text-primary" />;
      case "lock": return <Lock className="w-8 h-8 @md:w-10 @md:h-10 text-primary" />;
      case "return": return <RotateCcw className="w-8 h-8 @md:w-10 @md:h-10 text-primary" />;
      case "card": return <CreditCard className="w-8 h-8 @md:w-10 @md:h-10 text-primary" />;
      case "award": return <Award className="w-8 h-8 @md:w-10 @md:h-10 text-primary" />;
      default: return <ShieldCheck className="w-8 h-8 @md:w-10 @md:h-10 text-primary" />;
    }
  };

  return (
    <div className="w-full grid grid-cols-2 @md:grid-cols-4 gap-6 py-12 px-4 border-y border-border/30 bg-muted/30 backdrop-blur-sm">
      {badges.map((badge, idx) => (
        <div key={idx} className="group flex flex-col items-center text-center gap-4 transition-transform duration-300 hover:-translate-y-1">
          <div className="p-4 rounded-2xl bg-background shadow-sm border border-border/50 group-hover:shadow-md transition-shadow duration-300 group-hover:border-primary/20">
            {getIcon(badge.icon)}
          </div>
          <div>
            <h4 className="font-bold text-[15px] tracking-tight text-foreground">{badge.title}</h4>
            {(badge.description || badge.subtitle) && (
              <p className="text-[13px] leading-relaxed text-muted-foreground mt-1.5">{badge.description || badge.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
