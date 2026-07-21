import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/routes/admin.catalogo.produtos.$id.tsx');
let content = fs.readFileSync(file, 'utf8');

const targetStr = `  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [attrFields, setAttrFields] = useState<{ k: string; v: string }[]>([]);`;

if (content.includes(targetStr)) {
    // Find the SECOND occurrence and remove it.
    const firstIndex = content.indexOf(targetStr);
    const secondIndex = content.indexOf(targetStr, firstIndex + 1);
    
    if (secondIndex !== -1) {
        content = content.substring(0, secondIndex) + content.substring(secondIndex + targetStr.length);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed syntax error in admin.catalogo.produtos.$id.tsx');
    } else {
        console.log('Second occurrence not found');
    }
}
