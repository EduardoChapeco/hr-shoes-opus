import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.production" });

console.log("Variáveis disponíveis (só nomes):", Object.keys(process.env).filter(k => k.includes("SUPABASE") || k.includes("DATABASE") || k.includes("PG") || k.includes("DB") || k.includes("VITE")));
