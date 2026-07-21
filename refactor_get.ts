import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';

function walkDir(dir: string, callback: (filepath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

function refactorCallers(srcDir: string) {
  walkDir(srcDir, (filepath) => {
    if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
      let content = fs.readFileSync(filepath, 'utf8');
      let originalContent = content;

      // Replace: res.status === "ok" or "success" ? res.data : []  => res || []
      content = content.replace(/([a-zA-Z0-9_]+)\.status\s*===\s*["'](?:ok|success)["']\s*\?\s*\1\.data\s*:\s*([^,;)\n]+)/g, (match, varName, fallback) => {
        return `${varName} || ${fallback}`;
      });

      // Handle cases like: {collections?.status === "ok" && collections.data.map(...)}
      content = content.replace(/\{([a-zA-Z0-9_]+)\?\.status\s*===\s*["'](?:ok|success)["']\s*&&\s*\1\.data\.map/g, '{$1?.map');
      
      // Handle cases like: {categories?.status === "ok" && categories.data.map
      content = content.replace(/([a-zA-Z0-9_]+)\?\.status\s*===\s*["'](?:ok|success)["']\s*&&\s*\1\.data/g, '$1');

      // Handle: if (res.status === "ok") { setProducts(res.data) }
      content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)(?:\?)?\.status\s*===\s*["'](?:ok|success)["']\s*\)\s*\{([^}]*)\}/g, (match, varName, body) => {
        let newBody = body.replace(new RegExp(`${varName}\\.data`, 'g'), varName);
        return `if (${varName}) {${newBody}}`;
      });
      // also without braces: if (res.status === "ok") setProducts(res.data);
      content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)(?:\?)?\.status\s*===\s*["'](?:ok|success)["']\s*\)\s*([^{}\n]+)/g, (match, varName, body) => {
        let newBody = body.replace(new RegExp(`${varName}\\.data`, 'g'), varName);
        return `if (${varName}) ${newBody}`;
      });

      // Handle: if (res.status === "error") throw new Error(res.message); return res.data;
      content = content.replace(/if\s*\(\s*([a-zA-Z0-9_]+)\.status\s*===\s*["']error["']\s*\)\s*throw\s*new\s*Error\([^)]+\);\s*return\s*\1\.data;/g, 'return $1;');


      if (content !== originalContent) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Refactored caller: ${filepath}`);
      }
    }
  });
}

function refactorServerFunctions(srcDir: string) {
  walkDir(srcDir, (filepath) => {
    if (filepath.includes('.functions.ts')) {
      let content = fs.readFileSync(filepath, 'utf8');
      let originalContent = content;

      // Replace: return { status: "ok" as const, data };
      content = content.replace(/return\s*\{\s*status:\s*["'](?:ok|success)["']\s*(?:as\s*const)?\s*,\s*data\s*\}\s*;/g, 'return data;');
      
      // Replace: return { status: "ok" as const, data: X };
      content = content.replace(/return\s*\{\s*status:\s*["'](?:ok|success)["']\s*(?:as\s*const)?\s*,\s*data:\s*([^}]+)\}\s*;/g, 'return $1;');

      // Replace: if (e instanceof SupabaseUnconfiguredError) return { status: "unconfigured" as const };
      content = content.replace(/if\s*\(e\s*instanceof\s*SupabaseUnconfiguredError\)\s*return\s*\{\s*status:\s*["']unconfigured["']\s*(?:as\s*const)?\s*\}\s*;/g, 'if (e instanceof SupabaseUnconfiguredError) throw e;');

      // Replace: return { status: "error" as const, message: "..." };
      content = content.replace(/return\s*\{\s*status:\s*["']error["']\s*(?:as\s*const)?\s*,\s*message:\s*([^}]+)\}\s*;/g, 'throw new Error($1);');

      if (content !== originalContent) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Refactored server fn: ${filepath}`);
      }
    }
  });
}

const srcDir = path.join(process.cwd(), 'src');
console.log('--- Refactoring Server Functions ---');
refactorServerFunctions(srcDir);
console.log('--- Refactoring Callers ---');
refactorCallers(srcDir);
