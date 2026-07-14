const fs = require('fs');
const path = require('path');

const dir = 'src/routes';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('PhaseGate')) {
    content = content.replace(/import \{ PhaseGate \} from "@\/components\/admin\/phase-gate";\n/g, '');
    
    // Replace <PhaseGate ... /> with <div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>
    content = content.replace(/<PhaseGate[^>]*\/>/g, '<div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>');
    content = content.replace(/<PhaseGate[\s\S]*?\/>/g, '<div className="p-8 text-muted-foreground text-sm">Este módulo está sendo construído.</div>');
    
    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  }
}
