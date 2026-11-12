'use client';
import {useEffect,useRef} from 'react';

export default function WishLoadingModal({saving}:{saving:boolean}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const element=dialog.current;
  element?.showModal();
  return()=>{element?.close()};
 },[]);
 return <dialog ref={dialog} className="wish-loading-modal" aria-labelledby="wish-loading-title" aria-describedby="wish-loading-description" onCancel={event=>event.preventDefault()}>
  <div className="wish-loading-content">
   <div className="wish-loading-art" aria-hidden="true"><span className="wish-loading-orbit"/><img src="/assets/deyo-mascota.png" alt=""/><span className="wish-loading-spark">✦</span></div>
   <span className="wish-loading-kicker">DEYO ESTÁ CONTIGO</span>
   <h2 id="wish-loading-title">{saving?'Tu deseo está por salir al mundo.':'Buscando lo que nos conecta.'}</h2>
   <p id="wish-loading-description">{saving?'Estamos preparando tu publicación y sus coincidencias.':'Deyo interpreta tu idea y busca deseos compatibles.'}</p>
   <div className="wish-loading-status" role="status" aria-live="polite"><span className="wish-loading-dots" aria-hidden="true"><i/><i/><i/></span>{saving?'Publicando tu deseo…':'Analizando tu deseo…'}</div>
   <small>Puede tardar unos segundos.</small>
  </div>
 </dialog>;
}
