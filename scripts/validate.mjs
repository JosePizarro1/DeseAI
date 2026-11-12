import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const expected=['app/page.tsx','app/vendedor/page.tsx','app/api/paypal/orders/route.ts','app/api/paypal/capture/route.ts','app/api/paypal/webhook/route.ts','supabase/migration_v18.sql','components/PayPalSandboxCheckout.tsx','app/explorar/page.tsx','app/crear/page.tsx','app/deseo/[id]/page.tsx','components/ScrollExperience.tsx','public/assets/globo-deseai.png','public/assets/deyo-mascota.png','public/assets/deyo-cta-transparente.webp','public/assets/paso-1-imagina.webp','public/assets/paso-2-conecta.webp','public/assets/paso-3-realidad.webp'];
const missing=expected.filter(p=>!fs.existsSync(path.join(root,p)));
let images=0;
for (const f of fs.readdirSync(path.join(root,'components'))) {
 if (!f.endsWith('.tsx')) continue;
 const text=fs.readFileSync(path.join(root,'components',f),'utf8');
 for (const [,rel] of text.matchAll(/src=\{[\"\'](\/assets\/[^\"\']+)[\"\']\}/g)) {
  images++;if(!fs.existsSync(path.join(root,'public',rel)))missing.push('asset used by '+f+': '+rel);
 }
}
console.log('Rutas/components/assets verificados. Referencias de imágenes locales:',images);
if(missing.length){console.error('Faltan archivos:',missing);process.exit(1)}
console.log('VALIDACIÓN ESTÁTICA OK (no equivale a un build de Next.js).');
