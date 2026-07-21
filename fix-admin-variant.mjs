import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/routes/admin.catalogo.produtos.$id.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add to default values
content = content.replace(
  /length_cm: "",\r?\n\s*status: "active" as "active" \| "inactive" \| "archived",/,
  'length_cm: "",\n      display_name: "",\n      status: "active" as "active" | "inactive" | "archived",'
);

content = content.replace(
  /length_cm: "",\r?\n\s*status: "active",\r?\n\s*stock: "0",/,
  'length_cm: "",\n      display_name: "",\n      status: "active",\n      stock: "0",'
);

// 2. Add to reset values in onOpenEdit
content = content.replace(
  /length_cm: v\.length_cm !== null && v\.length_cm !== undefined \? String\(v\.length_cm\) : "",\r?\n\s*status: v\.status \|\| "active",/,
  'length_cm: v.length_cm !== null && v.length_cm !== undefined ? String(v.length_cm) : "",\n      display_name: v.display_name || "",\n      status: v.status || "active",'
);

// 3. Add to upsert payload
content = content.replace(
  /length_cm,\r?\n\s*status: values\.status,/,
  'length_cm,\n            display_name: values.display_name || null,\n            status: values.status,'
);

// 4. Add UI element to the form (above Status)
const formUI = `<div className="space-y-2">
                <Label>Nome de ExibiÃ§Ã£o (Opcional)</Label>
                <Input placeholder="Ex: Rosa BebÃª" {...register("display_name")} />
              </div>
              <div className="space-y-2">
                <Label>Status da Variante</Label>`;

content = content.replace(
  /<div className="space-y-2">\s*<Label>Status da Variante<\/Label>/,
  formUI
);

// 5. Update Table Head/Body to show display name
content = content.replace(
  /<TableHead>Atributos \/ Tamanho<\/TableHead>/,
  '<TableHead>ExibiÃ§Ã£o / Atributos</TableHead>'
);

content = content.replace(
  /<TableCell className="text-xs">\{attrsString \|\| "PadrÃ£o"\}<\/TableCell>/,
  '<TableCell className="text-xs">{v.display_name ? <span className="font-semibold block">{v.display_name}</span> : null}<span className="text-muted-foreground">{attrsString || "PadrÃ£o"}</span></TableCell>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Admin UI for variant display name updated successfully!");
