import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src/routes/admin.catalogo.produtos.$id.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. We need to add handleVariantImage function to VariantsManager.
const target1 = `  const onSubmitVariant = async (values: any) => {`;
const replace1 = `  const handleVariantImage = async (url: string) => {
    if (!url || !editingVariant?.id) return;
    setIsSubmitting(true);
    try {
      const res = await addProductMediaLink({ data: { product_id: product.id, variant_id: editingVariant.id, url } });
      if (res.status === "success") {
        toast.success("Imagem exclusiva da variante salva!");
        router.invalidate();
      } else {
        toast.error(res.message || "Erro ao salvar imagem.");
      }
    } catch {
      toast.error("Erro inesperado ao salvar imagem da variante.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitVariant = async (values: any) => {`;

content = content.replace(target1, replace1);

// 2. Add ImageUpload inside the variant Modal.
const target2 = `            <div className="space-y-2 pt-2 border-t">
              <Label>Atributos da Variante</Label>`;
const replace2 = `            {editingVariant && (
              <div className="space-y-2 pt-2 border-t">
                <Label>Foto EspecÃ­fica desta Variante (Opcional)</Label>
                <div className="max-w-xs">
                  <ImageUpload onChange={handleVariantImage} bucket="product-media" />
                </div>
                <p className="text-[10px] text-muted-foreground">O upload vincula a imagem instantaneamente a este SKU.</p>
              </div>
            )}
            
            <div className="space-y-2 pt-2 border-t">
              <Label>Atributos da Variante</Label>`;

content = content.replace(target2, replace2);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Variant image uploader added successfully!");
