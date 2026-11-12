'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ensureVisitor,browserDB} from '@/lib/supabase';
import {usePathname} from 'next/navigation';
export default function Header(){
 const path=usePathname();
 const [visitor,setVisitor]=useState('');
 const [seller,setSeller]=useState(false);
 useEffect(()=>{
  let active=true;
  ensureVisitor().then(async session=>{
   if(!session||!active)return;
   setVisitor(session.user.id.slice(0,6));
   const {data}=await browserDB()!.from('demo_sellers').select('user_id').eq('user_id',session.user.id).maybeSingle();
   if(active)setSeller(Boolean(data));
  }).catch(()=>{});
  return()=>{active=false};
 },[]);
 return <header className="site-header"><div className="container nav-inner">
 <Link className="brand" href="/" aria-label="DeseAI, ir al inicio"><img src="/assets/deseai-logo.svg" alt="" className="stage-nav-logo"/><span>DeseAI</span></Link>
 <nav className="desktop-links"><Link href="/explorar" aria-current={path==='/explorar'?'page':undefined}>Explorar</Link><Link href="/#como-funciona">Cómo funciona</Link><Link href="/vendedor">Vendedores</Link></nav>
 <div className="nav-actions"><details className="account-menu"><summary>◉ {visitor?(seller?'Vendedor demo':'Comprador'):'Conectando…'}</summary><div><strong>{visitor?(seller?'Vendedor demo':`Comprador · ${visitor}`):'Preparando tu acceso'}</strong><p>{visitor?'Acceso activo sin registro':'Un momento…'}</p><Link href="/pedidos">Mis pedidos →</Link><Link href="/crear#mis-deseos">Mis deseos →</Link><Link href="/vendedor">{seller?'Mi panel de vendedor →':'Acceso de vendedores →'}</Link></div></details><Link className="btn btn-ink nav-cta" href="/crear">Crear mi deseo <span>✦</span></Link></div>
 <details className="mobile-menu"><summary aria-label="Abrir menú">☰</summary><nav><Link href="/">Inicio</Link><Link href="/explorar">Explorar</Link><Link href="/crear">Crear un deseo</Link><Link href="/vendedor">Vendedores</Link><Link href="/#como-funciona">Cómo funciona</Link></nav></details>
 </div></header>
}
