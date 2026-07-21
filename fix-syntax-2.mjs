import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/routes/admin.catalogo.produtos.$id.tsx');
let lines = fs.readFileSync(file, 'utf8').split('\n');

const startIndex = lines.findIndex(l => l.includes('const router = useRouter();') && lines.indexOf(l) > 700);

if (startIndex !== -1) {
    // Remove the 5 duplicated variable declarations
    lines.splice(startIndex, 5);
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log('Fixed syntax error!');
} else {
    console.log('Not found');
}
