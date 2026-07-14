const fs = require("fs");
const path = require("path");

const dir = "src/routes";
const files = fs.readdirSync(dir);

for (const file of files) {
  if (!file.endsWith(".tsx")) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, "utf8");

  const original = content;

  // Remove import aggressively
  content = content.replace(
    /import\s*\{\s*PhaseGate\s*\}\s*from\s*['"]@\/components\/admin\/phase-gate['"];?[\r\n]*/g,
    "",
  );

  // Replace <PhaseGate ... /> aggressively
  content = content.replace(
    /<PhaseGate[^>]*\/>/g,
    '<div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>',
  );
  content = content.replace(
    /<PhaseGate[\s\S]*?\/>/g,
    '<div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>',
  );

  if (original !== content) {
    fs.writeFileSync(filePath, content);
    console.log("Fixed", file);
  }
}

// Also fix src/types/domain.ts
const domainTs = "src/types/domain.ts";
if (fs.existsSync(domainTs)) {
  let domainContent = fs.readFileSync(domainTs, "utf8");
  domainContent = domainContent.replace(
    /export type RouteRenderStatus = "structural" | "planned";\n?/g,
    "",
  );
  fs.writeFileSync(domainTs, domainContent);
}
