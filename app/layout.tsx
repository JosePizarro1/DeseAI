import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../styles/legacy.css';
import '../styles/stage.css';
import '../styles/animations.css';
import '../styles/animations-v15.css';
import '../styles/v16.css';
import '../styles/v17.css';
import '../styles/v18.css';
import Header from '@/components/Header';
export const metadata: Metadata = {title: 'DeseAI — ¿Y si alguien más lo desea?', description: 'Descubre personas que desean lo mismo y crea oportunidades colectivas.'};
export default function RootLayout({children}:{children:ReactNode}) {
 return <html lang="es"><body><Header />{children}<footer className="v16-footer"><div className="container"><b>DeseAI</b><span>Imagina · Conecta · Hazlo real</span><small>Demo · Pagos en PayPal Sandbox</small></div></footer></body></html>;
}
