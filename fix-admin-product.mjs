import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/routes/admin.catalogo.produtos.$id.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove initial value
content = content.replace(/weight_grams: product\.weight_grams \|\| "",\r?\n\s*/g, '');

// Remove parsed value
content = content.replace(/const weight_grams = values\.weight_grams \? parseInt\(values\.weight_grams, 10\) : null;\r?\n\s*/g, '');

// Remove object prop
content = content.replace(/weight_grams,\r?\n\s*/g, '');

// Remove UI element completely
content = content.replace(/<div className="space-y-2">\s*<Label>Peso Antigo \(gramas\)<\/Label>\s*<Input type="number" placeholder="Ex: 600" \{\.\.\.register\("weight_grams"\)\} \/>\s*<\/div>/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Admin product edit cleaned successfully!");
