const fs = require('fs');

const path = 'src/lib/routes.ts';
let content = fs.readFileSync(path, 'utf8');

// Remove properties from interface
content = content.replace(/  renderStatus: RouteRenderStatus;\n/g, '');
content = content.replace(/  \/\*\* If true, badge "Em breve" next to the nav label\. \*\/\n  navPlanned\?: boolean;\n/g, '');
content = content.replace(/import type \{ Audience, Phase, Role, RouteRenderStatus \} from "@\/types\/domain";/g, 'import type { Audience, Phase, Role } from "@/types/domain";');

// Remove from actual route objects
// If a route has navPlanned: true, we also remove its navGroup so it disappears from the sidebar
content = content.replace(/navGroup: "[^"]+",\n\s*navPlanned: true,/g, '');
content = content.replace(/navGroup: "[^"]+",\n\s*navIcon: "[^"]+",\n\s*navPlanned: true,/g, '');

content = content.replace(/renderStatus: "structural",\n/g, '');
content = content.replace(/navPlanned: true,\n/g, '');

fs.writeFileSync(path, content);
console.log('routes.ts cleaned');
