import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/services/builder.functions.ts');
let content = fs.readFileSync(file, 'utf8');

// Use string replace instead of regex for the signature to avoid newline issues
const sigOld = `async function hydrateBindings(
  nodes: ExperienceNode[],
  db: ReturnType<typeof getServerClient>
): Promise<ExperienceNode[]> {`;

const sigNew = `async function hydrateBindings(
  nodes: ExperienceNode[],
  db: ReturnType<typeof getServerClient>,
  store_id: string
): Promise<ExperienceNode[]> {`;

content = content.replace(sigOld, sigNew);
content = content.replace(sigOld.replace(/\n/g, '\r\n'), sigNew.replace(/\n/g, '\r\n'));

fs.writeFileSync(file, content, 'utf8');
console.log("builder.functions.ts signature updated");
