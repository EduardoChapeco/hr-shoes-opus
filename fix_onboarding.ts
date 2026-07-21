import * as fs from 'fs';
import * as path from 'path';

const fullPath = path.join(process.cwd(), 'src/services/onboarding.functions.ts');
let content = fs.readFileSync(fullPath, 'utf8');

// Fix internal data fetchers to return `{ status: "ok" as const, data }` 
// Currently they return `data` but the caller expects `storeRes.status === "error"`.
// Wait, the functions might be defined like:
// async function getStoreData(storeId: string) { ... if (error) return { status: "error", error }; return data; }
content = content.replace(/(async\s+function\s+[a-zA-Z0-9_]+\([^)]*\)\s*(?::\s*Promise<[^>]+>\s*)?\{\s*try\s*\{[\s\S]*?)return\s+data;\s*\}(?=\s*catch)/g, '$1return { status: "ok" as const, data };\n    }');

fs.writeFileSync(fullPath, content, 'utf8');
console.log('Fixed onboarding functions');
