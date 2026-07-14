const fs = require("fs");
let c = fs.readFileSync("src/lib/routes.ts", "utf8");

c = c.replace(/  \{\s+path: "\/checkout\/identificacao"[\s\S]*?\},/g, "");
c = c.replace(/  \{\s+path: "\/checkout\/entrega"[\s\S]*?\},/g, "");
c = c.replace(/  \{\s+path: "\/checkout\/cotacao"[\s\S]*?\},/g, "");
c = c.replace(/  \{\s+path: "\/checkout\/revisao"[\s\S]*?\},/g, "");
c = c.replace(/  \{\s+path: "\/checkout\/pagamento"[\s\S]*?\},/g, "");

const checkoutRoute = `
  {
    path: "/checkout",
    label: "Finalizar Compra",
    description: "Checkout: finalização",
    audience: "public",
    roles: ["visitor", "customer"],
    phase: 2,
  },`;

c = c.replace(
  /  \{\s+path: "\/carrinho",[\s\S]*?phase: 2,\s+\},/,
  (match) => match + checkoutRoute,
);

fs.writeFileSync("src/lib/routes.ts", c);
