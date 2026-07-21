import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/routes/_store.carrinho.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace('toast.error("Erro ao atualizar carrinho.");', 'toast.error(e.message || "Estoque insuficiente ou erro de validação.");');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed cart error message');
