import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/routes/admin.builder.$documentId.editor.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /onChange=\{e => updateNode\(selectedNode\.id, "content", field\.name, Number\(e\.target\.value\)\)\}\n\s*\/>\n\s*\)\s*:\s*\(/;

const replacement = `onChange={e => updateNode(selectedNode.id, "content", field.name, Number(e.target.value))}
                            />
                          ) : field.type === "collection_select" ? (
                            <select
                              className="w-full text-sm p-2 rounded-lg bg-white/5 border border-white/10 text-white"
                              value={(selectedNode.content as any)?.[field.name] ?? ""}
                              onChange={e => updateNode(selectedNode.id, "content", field.name, e.target.value)}
                            >
                              <option value="">Selecione uma coleção...</option>
                              {collections?.map((col: any) => (
                                <option key={col.id} value={col.slug}>{col.title}</option>
                              ))}
                            </select>
                          ) : field.type === "category_select" ? (
                            <select
                              className="w-full text-sm p-2 rounded-lg bg-white/5 border border-white/10 text-white"
                              value={(selectedNode.content as any)?.[field.name] ?? ""}
                              onChange={e => updateNode(selectedNode.id, "content", field.name, e.target.value)}
                            >
                              <option value="">Selecione uma categoria...</option>
                              {categories?.map((cat: any) => (
                                <option key={cat.id} value={cat.slug}>{cat.name}</option>
                              ))}
                            </select>
                          ) : (`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("admin.builder.$documentId.editor.tsx updated");
