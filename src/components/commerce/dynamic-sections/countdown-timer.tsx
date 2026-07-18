import * as React from "react";
import { useState, useEffect } from "react";

interface CountdownTimerProps {
  content: {
    title?: string;
    target_date: string; // ISO string
    expired_message?: string;
  };
}

export function CountdownTimer({ content }: CountdownTimerProps) {
  const { title, target_date, expired_message = "Oferta Expirada" } = content;
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!target_date) return;
    const target = new Date(target_date).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      } else {
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [target_date]);

  if (!timeLeft) return null;

  const isExpired = timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m === 0 && timeLeft.s === 0;

  return (
    <div className="w-full bg-primary text-primary-foreground py-6 px-4 rounded-xl flex flex-col items-center justify-center text-center shadow-md">
      {title && <h3 className="text-lg font-bold uppercase tracking-widest mb-3 opacity-90">{title}</h3>}
      {isExpired ? (
        <div className="text-2xl font-black">{expired_message}</div>
      ) : (
        <div className="flex items-center gap-4">
          <TimeBox value={timeLeft.d} label="Dias" />
          <span className="text-2xl font-bold opacity-50">:</span>
          <TimeBox value={timeLeft.h} label="Horas" />
          <span className="text-2xl font-bold opacity-50">:</span>
          <TimeBox value={timeLeft.m} label="Minutos" />
          <span className="text-2xl font-bold opacity-50">:</span>
          <TimeBox value={timeLeft.s} label="Segundos" />
        </div>
      )}
    </div>
  );
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-background text-foreground rounded-md w-14 h-14 flex items-center justify-center text-2xl font-black shadow-inner">
        {value.toString().padStart(2, "0")}
      </div>
      <span className="text-[10px] mt-1.5 uppercase font-medium tracking-wider opacity-80">{label}</span>
    </div>
  );
}
