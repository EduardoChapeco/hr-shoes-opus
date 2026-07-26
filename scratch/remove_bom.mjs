import fs from 'fs';
import path from 'path';

const dir = path.resolve('supabase/migrations');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql'));

let count = 0;
for (const file of files) {
  const filePath = path.join(dir, file);
  const buffer = fs.readFileSync(filePath);
  
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    console.log(`Removing BOM from ${file}`);
    fs.writeFileSync(filePath, buffer.slice(3));
    count++;
  }
}

console.log(`Removed BOM from ${count} files.`);
