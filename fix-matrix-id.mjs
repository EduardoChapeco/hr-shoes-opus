import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/routes/admin.catalogo.produtos.$id.tsx');
let content = fs.readFileSync(file, 'utf8');

const importStatement = `import { useState, useMemo, useEffect } from "react";`;
if (!content.includes('useEffect')) {
    content = content.replace('import { useState, useMemo } from "react";', importStatement);
}

// Find VariantsManager and replace its start
const startMarker = `function VariantsManager({ product }: { product: any }) {`;
const matrixCode = `function VariantsManager({ product }: { product: any }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [attrFields, setAttrFields] = useState<{ k: string; v: string }[]>([]);

  // Matrix State
  const initialVariantOptions = (product.attributes?.variant_options || []) as {name: string, options: string[]}[];
  const [customVariantGroups, setCustomVariantGroups] = useState<{name: string, options: string[]}[]>(initialVariantOptions);
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string[]>>({});
  const [newCustomGroupName, setNewCustomGroupName] = useState("");
  const [customOptionInput, setCustomOptionInput] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialSelected: Record<string, string[]> = {};
    initialVariantOptions.forEach(g => {
      initialSelected[g.name] = g.options || [];
    });
    setSelectedVariantOptions(initialSelected);
  }, []);

  const toggleVariantOption = (groupName: string, optionValue: string) => {
    setSelectedVariantOptions(prev => {
      const current = prev[groupName] || [];
      const newOpts = current.includes(optionValue)
        ? current.filter(o => o !== optionValue)
        : [...current, optionValue];
      
      // Update customVariantGroups to reflect the change
      setCustomVariantGroups(groups => groups.map(g => {
        if (g.name === groupName) {
          return { ...g, options: newOpts };
        }
        return g;
      }));
      
      return { ...prev, [groupName]: newOpts };
    });
  };

  const handleSaveMatrixMemory = async () => {
    try {
      const activeGroups = customVariantGroups.filter(g => (selectedVariantOptions[g.name] || []).length > 0).map(g => ({
        name: g.name,
        options: selectedVariantOptions[g.name]
      }));
      const newAttributes = { ...product.attributes, variant_options: activeGroups };
      await updateProduct({ data: { id: product.id, updates: { attributes: newAttributes } } });
      toast.success("Memória da matriz salva!");
    } catch (e) {
      toast.error("Erro ao salvar matriz");
    }
  };

  const handleGenerateMissingVariants = async () => {
    setIsSubmitting(true);
    try {
      await handleSaveMatrixMemory();
      
      const activeGroups = customVariantGroups.map(g => g.name).filter(name => (selectedVariantOptions[name] || []).length > 0);
      if (activeGroups.length === 0) {
        toast.error("Nenhuma opção selecionada");
        setIsSubmitting(false);
        return;
      }
      
      const arraysToMultiply = activeGroups.map(name => selectedVariantOptions[name] || []);
      const cartesian = arraysToMultiply.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]] as any[]);
      
      const existingVariants = product.product_variants || [];
      let added = 0;
      
      for (const combination of cartesian) {
        const comboArray = Array.isArray(combination) ? combination : [combination];
        const attrs: Record<string, string> = {};
        activeGroups.forEach((name, i) => {
          attrs[name] = comboArray[i];
        });
        
        // Check if exists
        const exists = existingVariants.some((v: any) => {
          const vAttrs = v.attributes || {};
          return activeGroups.every(name => vAttrs[name] === attrs[name]);
        });
        
        if (!exists) {
          const skuSuffix = comboArray.map(v => v.substring(0, 3).toUpperCase()).join('-');
          const sku = \`\${product.slug}-\${skuSuffix}-\${Date.now().toString().slice(-4)}\`;
          await upsertProductVariant({
            data: {
              product_id: product.id,
              sku,
              status: "active",
              attributes: attrs,
            }
          });
          added++;
        }
      }
      
      if (added > 0) {
        toast.success(\`\${added} variantes geradas com sucesso!\`);
        router.invalidate();
      } else {
        toast.info("Nenhuma variante nova necessária.");
      }
    } catch (e) {
      toast.error("Erro ao gerar variantes");
    } finally {
      setIsSubmitting(false);
    }
  };
`;

const renderMatrixUi = `      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gerador de Matriz de Variações</CardTitle>
          <CardDescription>Adicione opções e gere as variantes que estiverem faltando na tabela abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 mb-4 p-4 bg-muted/20 border rounded-xl">
            {customVariantGroups.map(group => (
              <div key={group.name} className="space-y-3 pb-3 border-b last:border-0">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-semibold text-primary">{group.name}</Label>
                  <button type="button" onClick={() => setCustomVariantGroups(prev => prev.filter(g => g.name !== group.name))} className="text-[10px] text-destructive hover:underline">Remover</button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {(group.options || []).map(opt => {
                    const isSelected = (selectedVariantOptions[group.name] || []).includes(opt);
                    return (
                      <Badge 
                        key={opt}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer hover:opacity-80 transition-opacity px-3 py-1 text-sm"
                        onClick={() => toggleVariantOption(group.name, opt)}
                      >
                        {opt}
                      </Badge>
                    );
                  })}
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="+ valor (ex: Azul)" 
                      className="h-7 w-32 text-xs"
                      value={customOptionInput[group.name] || ""}
                      onChange={(e) => setCustomOptionInput(prev => ({...prev, [group.name]: e.target.value}))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = customOptionInput[group.name]?.trim();
                          if (val) {
                            const current = selectedVariantOptions[group.name] || [];
                            if (!current.includes(val)) {
                              toggleVariantOption(group.name, val);
                            }
                            setCustomOptionInput(prev => ({...prev, [group.name]: ""}));
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-3 mb-6 p-4 border rounded-xl bg-muted/10">
            <Input 
              placeholder="Novo Atributo (ex: Tamanho)" 
              value={newCustomGroupName}
              onChange={e => setNewCustomGroupName(e.target.value)}
              className="h-8 max-w-[250px]"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newCustomGroupName.trim() && !customVariantGroups.find(g => g.name === newCustomGroupName.trim())) {
                    setCustomVariantGroups(prev => [...prev, { name: newCustomGroupName.trim(), options: [] }]);
                    setNewCustomGroupName("");
                  }
                }
              }}
            />
            <Button 
              type="button" 
              variant="secondary" 
              size="sm"
              onClick={() => {
                if (newCustomGroupName.trim() && !customVariantGroups.find(g => g.name === newCustomGroupName.trim())) {
                  setCustomVariantGroups(prev => [...prev, { name: newCustomGroupName.trim(), options: [] }]);
                  setNewCustomGroupName("");
                }
              }}
            >
              <Plus className="size-4 mr-1"/> Adicionar Opção
            </Button>
          </div>
          
          <div className="flex justify-end pt-2 border-t">
            <Button onClick={handleGenerateMissingVariants} disabled={isSubmitting}>
              {isSubmitting ? "Gerando..." : "Gerar Variantes Faltantes"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
`;

if (content.includes(startMarker)) {
    content = content.replace(startMarker, matrixCode);
}

if (content.includes('<Card>\n        <CardHeader>\n          <CardTitle className="text-base">Variantes Cadastradas</CardTitle>')) {
    content = content.replace(
        '<Card>\n        <CardHeader>\n          <CardTitle className="text-base">Variantes Cadastradas</CardTitle>',
        renderMatrixUi + '\n        <CardHeader>\n          <CardTitle className="text-base">Variantes Cadastradas</CardTitle>'
    );
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed admin.catalogo.produtos.$id.tsx');
