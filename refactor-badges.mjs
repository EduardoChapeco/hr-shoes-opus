import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/components/commerce/dynamic-sections/trust-badges.tsx');
let content = fs.readFileSync(file, 'utf8');

// Fix interface to use subtitle and description interchangeably since registry uses subtitle
content = content.replace(
  /description\?: string;/g,
  'description?: string;\n      subtitle?: string;'
);

// Fallback to subtitle if description is missing
content = content.replace(
  /const badges = content\.badges \|\| \[/g,
  'const badges = (content.badges || []).length > 0 ? content.badges : ['
);

content = content.replace(
  /\{badge\.description\}/g,
  '{badge.description || badge.subtitle}'
);

content = content.replace(
  /badge\.description && \(/g,
  '(badge.description || badge.subtitle) && ('
);

// Make styles beautiful and modern
content = content.replace(
  /className="w-full grid grid-cols-2 @md:grid-cols-4 gap-6 py-8 border-y border-border\/50 bg-card"/g,
  'className="w-full grid grid-cols-2 @md:grid-cols-4 gap-6 py-12 px-4 border-y border-border/30 bg-muted/30 backdrop-blur-sm"'
);

content = content.replace(
  /className="flex flex-col items-center text-center gap-3"/g,
  'className="group flex flex-col items-center text-center gap-4 transition-transform duration-300 hover:-translate-y-1"'
);

content = content.replace(
  /className="p-3 rounded-full bg-primary\/10"/g,
  'className="p-4 rounded-2xl bg-background shadow-sm border border-border/50 group-hover:shadow-md transition-shadow duration-300 group-hover:border-primary/20"'
);

content = content.replace(
  /className="font-bold text-sm text-foreground"/g,
  'className="font-bold text-[15px] tracking-tight text-foreground"'
);

content = content.replace(
  /className="text-xs text-muted-foreground mt-1"/g,
  'className="text-[13px] leading-relaxed text-muted-foreground mt-1.5"'
);

fs.writeFileSync(file, content, 'utf8');
console.log("trust-badges.tsx updated");
