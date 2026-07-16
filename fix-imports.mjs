import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx')) {
        callback(dirPath);
      }
    }
  });
}

walkDir(path.join(process.cwd(), 'src'), (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('@/lib/supabase-ssr')) {
    content = content.replace(/@\/lib\/supabase-ssr"/g, '@/lib/supabase-ssr.server"');
    content = content.replace(/@\/lib\/supabase-ssr'/g, "@/lib/supabase-ssr.server'");
    fs.writeFileSync(filePath, content);
    console.log('Updated:', filePath);
  }
});
