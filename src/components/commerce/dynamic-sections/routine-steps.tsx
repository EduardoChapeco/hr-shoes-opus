import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface Step {
  step_number: number;
  title: string;
  description: string;
  image_url?: string;
  product_slug?: string;
}

interface RoutineStepsProps {
  title?: string;
  subtitle?: string;
  steps?: Step[];
}

export function RoutineSteps({
  title = "Passos da Rotina",
  subtitle = "Siga o passo a passo para garantir os melhores resultados",
  steps = [],
}: RoutineStepsProps) {
  return (
    <section className="w-full py-12 px-4 md:px-8 max-w-7xl mx-auto">
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">{title}</h2>}
          {subtitle && <p className="text-muted-foreground text-base max-w-2xl mx-auto">{subtitle}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {steps.map((step, idx) => (
          <div
            key={step.step_number || idx}
            className="flex flex-col bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            {/* Step badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg border border-primary/20">
                0{step.step_number || idx + 1}
              </span>
              <CheckCircle2 className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </div>

            {step.image_url && (
              <div className="w-full h-44 rounded-xl overflow-hidden mb-4 bg-muted">
                <img
                  src={step.image_url}
                  alt={step.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}

            <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-grow mb-4">{step.description}</p>

            {step.product_slug && (
              <Link
                to="/produto/$slug"
                params={{ slug: step.product_slug }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline mt-auto pt-2"
              >
                Ver Produto Recomendado
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
