import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/components/commerce/dynamic-sections/hero-carousel.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace the fallback empty state
content = content.replace(
  /className="flex aspect-\[21\/9\] w-full/g,
  'className="flex aspect-[4/5] @md:aspect-[21/9] w-full'
);

// Replace the main slide container to enforce aspect ratio
content = content.replace(
  /className="relative min-w-0 flex-full shrink-0 grow-0 basis-full bg-\[#222\]"/g,
  'className="relative min-w-0 flex-full shrink-0 grow-0 basis-full bg-[#111] aspect-[4/5] @md:aspect-[21/9]"'
);

// Update the image to be absolute inset-0 object-cover
content = content.replace(
  /<picture className="block w-full">/g,
  '<picture className="absolute inset-0 block w-full h-full">'
);

content = content.replace(
  /className="block w-full h-auto object-cover"/g,
  'className="block w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"'
);

content = content.replace(
  /className="w-full aspect-\[21\/9\] bg-gradient-to-tr from-\[#1a1a2e\] to-\[#16213e\]/g,
  'className="absolute inset-0 w-full h-full bg-gradient-to-tr from-[#1a1a2e] to-[#16213e]'
);

// Update the overlay gradient for better aesthetics
content = content.replace(
  /className="absolute inset-0 bg-black\/30 pointer-events-none"/g,
  'className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"'
);

fs.writeFileSync(file, content, 'utf8');
console.log("hero-carousel.tsx updated");
