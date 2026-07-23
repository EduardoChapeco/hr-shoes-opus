const fs = require('fs');

const files = [
  'src/routes/admin.catalogo.categorias.$id.tsx',
  'src/routes/admin.catalogo.categorias.novo.tsx',
  'src/routes/admin.catalogo.colecoes.$id.tsx',
  'src/routes/admin.catalogo.colecoes.novo.tsx',
  'src/routes/admin.catalogo.produtos.$id.tsx',
  'src/routes/admin.catalogo.produtos.novo.tsx',
  'src/routes/admin.catalogo.tipos.tsx',
  'src/routes/admin.clientes.$id.tsx',
  'src/routes/admin.cms.navegacao.tsx',
  'src/routes/admin.cms.tema.tsx',
  'src/routes/admin.conversas.tsx',
  'src/routes/admin.criador.tsx',
  'src/routes/admin.equipe.tsx',
  'src/routes/admin.integracoes.tsx',
  'src/routes/admin.marketing.carrinhos.tsx',
  'src/routes/admin.marketing.cupons.tsx',
  'src/routes/admin.stories.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  const regex = /if\s*\(\s*res\s*\)\s*\{([\s\S]*?)\}\s*else\s*\{\s*toast\.error\(\s*res\.message[\s\S]*?\)\s*;\s*\}/g;
  
  let modified = false;
  content = content.replace(regex, (match, successBlock) => {
    modified = true;
    return successBlock.trim();
  });
  
  if (modified) {
    content = content.replace(/catch\s*\((.*?)\)\s*\{\s*toast\.error\((["'])(.*?)\2\);/g, (match, eVar, quote, errMsg) => {
        return 'catch (' + eVar + ') {\n        toast.error(' + eVar + ' instanceof Error ? ' + eVar + '.message : "' + errMsg + '");';
    });
    
    fs.writeFileSync(file, content, 'utf8');
    console.log("Fixed " + file);
  }
});
