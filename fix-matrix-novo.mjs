import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/routes/admin.catalogo.produtos.novo.tsx');
let content = fs.readFileSync(file, 'utf8');

// Find the onSubmit payload construction
const oldPayloadStr = `        const payloadVariants = variants
          .filter((v) => v.sku)
          .map((v) => ({
            sku: v.sku,
            attributes: v.attributes,
            price_cents: priceCents,
            stock: v.stock,
          }));

        const res = await createProduct({
          data: {
            title: values.title,
            slug: baseSlug,
            description: values.description || null,
            brand: values.brand || null,
            price_cents: priceCents,
            compare_at_cents: compareAtCents,
            status: values.status as "draft" | "published" | "archived",
            type_id: selectedTypeId === "generic" ? null : selectedTypeId,
            attributes: values.attributes,
            short_description: values.short_description || null,
            manufacturer: values.manufacturer || null,
            ean: values.ean || null,
            meta_title: values.meta_title || null,
            meta_description: values.meta_description || null,
            is_physical: values.is_physical,
            weight_kg: values.weight_kg ? parseFloat(values.weight_kg) : null,
            width_cm: values.width_cm ? parseFloat(values.width_cm) : null,
            height_cm: values.height_cm ? parseFloat(values.height_cm) : null,
            length_cm: values.length_cm ? parseFloat(values.length_cm) : null,
            preparation_time_days: values.preparation_time_days ? parseInt(values.preparation_time_days, 10) : 0,
            media_urls,
            category_ids: selectedCategory ? [selectedCategory] : [],
            variants: payloadVariants,
          },
        });`;

const newPayloadStr = `        const payloadVariants = variants
          .filter((v) => v.sku)
          .map((v) => ({
            sku: v.sku,
            attributes: v.attributes,
            price_cents: priceCents,
            stock: v.stock,
          }));
          
        // Combine all active groups to save the Matrix memory
        const allGroups = [...variantGroups, ...customVariantGroups];
        const activeGroups = allGroups.filter(g => (selectedVariantOptions[g.name] || []).length > 0).map(g => ({
          name: g.name,
          options: selectedVariantOptions[g.name]
        }));
        
        const finalAttributes = {
          ...values.attributes,
          variant_options: activeGroups.length > 0 ? activeGroups : undefined
        };

        const res = await createProduct({
          data: {
            title: values.title,
            slug: baseSlug,
            description: values.description || null,
            brand: values.brand || null,
            price_cents: priceCents,
            compare_at_cents: compareAtCents,
            status: values.status as "draft" | "published" | "archived",
            type_id: selectedTypeId === "generic" ? null : selectedTypeId,
            attributes: finalAttributes,
            short_description: values.short_description || null,
            manufacturer: values.manufacturer || null,
            ean: values.ean || null,
            meta_title: values.meta_title || null,
            meta_description: values.meta_description || null,
            is_physical: values.is_physical,
            weight_kg: values.weight_kg ? parseFloat(values.weight_kg) : null,
            width_cm: values.width_cm ? parseFloat(values.width_cm) : null,
            height_cm: values.height_cm ? parseFloat(values.height_cm) : null,
            length_cm: values.length_cm ? parseFloat(values.length_cm) : null,
            preparation_time_days: values.preparation_time_days ? parseInt(values.preparation_time_days, 10) : 0,
            media_urls,
            category_ids: selectedCategory ? [selectedCategory] : [],
            variants: payloadVariants,
          },
        });`;

if (content.includes('attributes: values.attributes,')) {
    content = content.replace(oldPayloadStr, newPayloadStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed admin.catalogo.produtos.novo.tsx');
} else {
    console.log('Could not find the target string in novo.tsx');
}
