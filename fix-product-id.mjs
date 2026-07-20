import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/routes/admin.catalogo.produtos.$id.tsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('ImageCropperDialog')) {
    content = content.replace(
        'import { PageHeader } from "@/components/commerce/page-header";',
        'import { PageHeader } from "@/components/commerce/page-header";\nimport { ImageCropperDialog } from "@/components/ui/image-cropper-dialog";\nimport { Crop } from "lucide-react";'
    );
}

if (!content.includes('cropModalOpen')) {
    content = content.replace(
        'const [previewUrls, setPreviewUrls] = useState<string[]>(initialPreviewUrls);',
        'const [previewUrls, setPreviewUrls] = useState<string[]>(initialPreviewUrls);\n  const [cropModalOpen, setCropModalOpen] = useState(false);\n  const [currentCropIndex, setCurrentCropIndex] = useState<number | null>(null);\n  const [currentCropSrc, setCurrentCropSrc] = useState<string | null>(null);'
    );
}

const cropHandler = `
  const handleCropComplete = async (croppedBase64: string) => {
    if (currentCropIndex === null) return;
    
    // Check if the current crop is an existing file (already a URL) or a newly added File
    const originalFile = files[currentCropIndex];
    
    const res = await fetch(croppedBase64);
    const blob = await res.blob();
    const newFile = new File([blob], originalFile ? originalFile.name : \`cropped-\${Date.now()}.jpg\`, { type: 'image/jpeg' });
    
    if (originalFile) {
        setFiles(prev => {
        const newFiles = [...prev];
        newFiles[currentCropIndex] = newFile;
        return newFiles;
        });
    } else {
        // Replace existing URL from the original product data with a new File to be uploaded
        setFiles(prev => [...prev, newFile]);
    }
    
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      newUrls[currentCropIndex] = croppedBase64;
      return newUrls;
    });
  };

  const handleOpenCrop = (index: number) => {
    setCurrentCropIndex(index);
    setCurrentCropSrc(previewUrls[index]);
    setCropModalOpen(true);
  };
`;

if (!content.includes('handleOpenCrop')) {
    content = content.replace(
        'const removeFile = (index: number) => {',
        `${cropHandler}\n  const removeFile = (index: number) => {`
    );
}

// Add the crop button
content = content.replace(
    '<button\n                          type="button"\n                          onClick={() => removeFile(i)}',
    '<button\n                          type="button"\n                          onClick={(e) => { e.preventDefault(); handleOpenCrop(i); }}\n                          className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary"\n                        >\n                          <Crop className="size-4" />\n                        </button>\n                        <button\n                          type="button"\n                          onClick={() => removeFile(i)}'
);

// Add the dialog at the end
if (!content.includes('<ImageCropperDialog')) {
    content = content.replace(
        '</form>\n        </div>\n      </Tabs>\n    </div>',
        '</form>\n        </div>\n      </Tabs>\n      <ImageCropperDialog\n        open={cropModalOpen}\n        onOpenChange={setCropModalOpen}\n        imageSrc={currentCropSrc}\n        onCropCompleteAction={handleCropComplete}\n      />\n    </div>'
    );
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed admin.catalogo.produtos.$id.tsx');
