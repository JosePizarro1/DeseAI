import {Suspense} from 'react';
import CreateWishClient from '@/components/CreateWishClient';
export default function Crear(){return <Suspense fallback={<main className="container v16-loading">Preparando formulario…</main>}><CreateWishClient/></Suspense>}
