'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import LocationPin from './LocationPin';
import WishLoadingModal from './WishLoadingModal';
import {analyzeWish,type Analysis,type WishDraft} from '@/lib/analysis';
import {byId} from '@/lib/wishes';
import {getSavedWishes,saveWish,deleteWish,type SavedWish} from '@/lib/storage';
import {browserDB,cloudConfigured,ensureVisitor,bearerHeaders,type SharedMatch,type OwnWish} from '@/lib/supabase';

const suggestions=[
 ['🎧 Audífonos inalámbricos','Quiero unos audífonos inalámbricos cómodos para trabajar en Lima por máximo S/80.'],
 ['⌨ Teclado','Quiero un teclado mecánico silencioso para trabajar y estudiar.'],
 ['📱 Celular','Quiero un celular con una buena batería por menos de S/800.'],
];
type Mode='checking'|'cloud'|'demo';
const empty:WishDraft={text:'',location:'',budget:'',date:''};

export default function CreateWishClient(){
 const q=useSearchParams();
 const formRef=useRef<HTMLDivElement>(null);const resultRef=useRef<HTMLElement>(null);
 const [draft,setDraft]=useState<WishDraft>(empty);
 const [mode,setMode]=useState<Mode>(cloudConfigured()?'checking':'demo');
 const [result,setResult]=useState<Analysis|null>(null);
 const [matches,setMatches]=useState<SharedMatch[]>([]);
 const [saved,setSaved]=useState(false);
 const [localList,setLocalList]=useState<SavedWish[]>([]);
 const [onlineList,setOnlineList]=useState<OwnWish[]>([]);
 const [saving,setSaving]=useState(false);
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');

 const refreshMine=useCallback(async()=>{
   const db=browserDB();if(!db)return;
   const {data,error}=await db.from('wishes')
     .select('id,raw_text,title,summary,category,city,budget_amount,currency,created_at')
     .order('created_at',{ascending:false}).limit(30);
   if(error)throw error;setOnlineList((data||[]) as OwnWish[]);
 },[]);

 useEffect(()=>{
   setLocalList(getSavedWishes());
   const prefill=q.get('ejemplo');
   if(prefill)setDraft(d=>({...d,text:prefill.slice(0,600)}));
   let active=true;
   if(!cloudConfigured())return;
   ensureVisitor().then(async()=>{
     if(!active)return;
     setMode('cloud');
     await refreshMine();
   }).catch(e=>{
     if(!active)return;
     setMode('demo');
     setNotice('No pudimos conectar tu espacio. Puedes explorar ideas y volver a intentarlo.');
     console.warn(e);
   });
   return()=>{active=false};
 },[q,refreshMine]);

 function update(field:keyof WishDraft,val:string){setDraft(old=>({...old,[field]:val}));setSaved(false);setResult(null);setMatches([]);}
 async function analyze(e:React.FormEvent<HTMLFormElement>){
   e.preventDefault();setError('');setNotice('');setSaved(false);
   if(draft.text.trim().length<12){setError('Escribe al menos 12 caracteres.');return;}
   if(mode==='checking'){setError('Estamos preparando tu sesión anónima. Inténtalo de nuevo.');return;}
   setSaving(false);setBusy(true);
   try {
     if(mode==='cloud'){
       const response=await fetch('/api/wish/analyze',{method:'POST',headers:await bearerHeaders(),body:JSON.stringify(draft)});
       const json=await response.json();
       if(!response.ok)throw new Error(json.error||'No se pudo consultar la IA.');
       setResult(json.analysis as Analysis);setMatches((json.matches||[]) as SharedMatch[]);
     }else{
       setResult(analyzeWish(draft));setMatches([]);
       setNotice('Modo demostración: análisis mediante reglas del navegador, sin IA externa ni usuarios compartidos.');
     }
     window.setTimeout(()=>resultRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}),130);
   }catch(e){setError(e instanceof Error?e.message:'No se pudo analizar el deseo.');}
   finally{setBusy(false);}
 }
 async function save(){
   if(!result||saved||busy)return;
   setError('');setSaving(true);setBusy(true);
   try{
     if(mode==='cloud' && result.source==='ai'){
       const response=await fetch('/api/wishes',{method:'POST',headers:await bearerHeaders(),body:JSON.stringify(draft)});
       const json=await response.json();
       if(!response.ok)throw new Error(json.error||'No se pudo publicar el deseo.');
       setResult(json.wish as Analysis);setMatches((json.matches||[]) as SharedMatch[]);
       await refreshMine();setNotice('Tu deseo está publicado. Ahora pueden encontrarte.');
     }else{
       const entry:SavedWish={...draft,analysis:result,
         id:typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():String(Date.now()),
         createdAt:new Date().toISOString()};
       saveWish(entry);setLocalList(getSavedWishes());
       setNotice('Guardado solo en este navegador: aún no está publicado ni conectado a otros usuarios.');
     }
     setSaved(true);
   }catch(e){setError(e instanceof Error?e.message:'No se pudo guardar.');}
   finally{setBusy(false);}
 }
 async function remove(id:string,cloud:boolean){
   if(cloud){
     try{
       const db=browserDB();if(!db)throw Error('Sin conexión');
       const {error}=await db.from('wishes').delete().eq('id',id);
       if(error)throw error;await refreshMine();
     }catch(e){setError(e instanceof Error?e.message:'No se pudo eliminar');}
   }else{deleteWish(id);setLocalList(getSavedWishes());}
 }
 return <main className="preview-page active"><section className="create-v7" aria-labelledby="wish-create-heading"><div className="create-v7-shell">
  <nav className="create-v7-breadcrumb"><Link href="/">Inicio</Link><span>›</span><span>Crear deseo</span></nav>
  <div className="create-v7-heading"><div className="create-v7-eyebrow"><span>✦</span>TU IDEA PUEDE SER EL COMIENZO</div>
  <h1 id="wish-create-heading">Todo comienza con <em>un deseo.</em></h1>
  <p>Cuéntanos lo que imaginas. DeseAI te ayudará a darle forma y encontrar personas que buscan algo compatible.</p>
  <span className={'v17-cloud-pill '+(mode==='cloud'?'connected':'')}>
    {mode==='checking'?'Preparando tu espacio…':mode==='cloud'?'● Listo para publicar':'◌ Modo local'}
  </span></div>
  <div className="create-v7-layout"><div className="create-v7-form-panel" ref={formRef}><form autoComplete="off" onSubmit={analyze}>
    <div className="create-v7-form-header"><span className="create-v7-number">01 / 02</span><span>Cuéntanos tu idea</span></div>
    <label className="create-v7-label" htmlFor="wish-text">¿Qué te gustaría hacer realidad?</label>
    <div className="create-v7-textarea-wrap"><textarea id="wish-text" maxLength={600} minLength={12} rows={5} required
      value={draft.text} onChange={e=>update('text',e.target.value)} placeholder="Ej.: Busco audífonos Bluetooth en Lima por máximo S/80."/><span>{draft.text.length} / 600</span></div>
    <p className="create-v7-suggestion-label">¿Necesitas inspiración? Prueba una idea:</p>
    <div className="create-v7-ideas" role="group" aria-label="Ejemplos de deseos">
      {suggestions.map(([label,ex])=><button type="button" key={label} onClick={()=>update('text',ex)}>{label}</button>)}</div>
    <div className="create-v7-field-grid">
      <div><label htmlFor="wish-location"><LocationPin/> ¿En qué ciudad? <small>Opcional</small></label><input id="wish-location" placeholder="Ej.: Lima, Arequipa o Cusco" maxLength={100} value={draft.location} onChange={e=>update('location',e.target.value)}/></div>
      <div><label htmlFor="wish-budget">Presupuesto <small>Opcional</small></label><input id="wish-budget" placeholder="Ej.: S/80" maxLength={50} value={draft.budget} onChange={e=>update('budget',e.target.value)}/></div>
      <div><label htmlFor="wish-date">¿Cuándo? <small>Opcional</small></label><input id="wish-date" placeholder="Ej.: Este mes" maxLength={70} value={draft.date} onChange={e=>update('date',e.target.value)}/></div>
    </div>
    <div className="create-v7-form-bottom"><div className="create-v7-privacy">◌ No se exige registro. Al publicar, se compartirá un resumen sin tu texto completo.</div>
    <button disabled={busy||mode==='checking'} type="submit" className="create-v7-submit"><span>{busy?'Analizando…':'✦ Analizar mi deseo'}</span><span>→</span></button></div>
    <p role="alert" className="create-v7-form-help">{error}</p>
  </form></div>
  <aside className="create-v7-side" aria-label="Así funciona el análisis"><div className="create-v7-side-top"><span className="create-v7-circle">✦</span><span className="create-v7-side-overline">DE UNA IDEA A ALGO REAL</span></div>
   <h2>Una idea puede conectar a muchos.</h2><p>No necesitas tener un plan perfecto. Empieza con algo que te ilusione.</p>
   <div className="create-v7-path"><div><span className="create-v7-path-icon">✎</span><span><strong>Exprésalo a tu manera</strong><small>Sin formularios interminables.</small></span></div>
   <div><span className="create-v7-path-icon">✦</span><span><strong>Descubre afinidades</strong><small>Personas que buscan algo parecido.</small></span></div>
   <div><span className="create-v7-path-icon">♡</span><span><strong>Encuentra tu comunidad</strong><small>Un deseo compartido es el primer paso.</small></span></div></div>
   <div className="create-v7-side-quote">“Las mejores experiencias comienzan con un <strong>¿y si…?</strong>”</div>
  </aside></div>
  {result&&<section ref={resultRef} aria-label="Resultado del análisis" aria-live="polite" className="create-v7-results" style={{marginTop:26}}>
   <div className="create-v7-result-heading"><span className="create-v7-number">02 / 02</span>
    <span className="create-v7-mode">{result.source==='ai'?'✦ Interpretado con IA':'◌ Demostración local · sin IA externa'}</span></div>
   <h2>Tu deseo está tomando forma.</h2><p className="create-v7-result-summary">{result.summary}</p>
   <div className="create-v7-tags"><span><b>Categoría:</b> {result.category}</span><span className="location-label"><LocationPin/><b>Ciudad</b> {result.location}</span>
    <span><b>Presupuesto:</b> {result.budget}</span><span><b>Fecha:</b> {result.date}</span></div>
   <div className="create-v7-match-head"><h3>{result.source==='ai'?'Deseos de otras personas que podrían coincidir':'Ideas similares de ejemplo'}</h3>
    <p>{result.source==='ai'?'Personas que buscan algo parecido a ti.':
       'Comparación local con un catálogo de ejemplos; no representa compradores reales.'}</p></div>
   <div className="create-v7-matches">
    {result.source==='ai'? matches.map(m=><Link key={m.id} href={'/deseo/publicado/'+m.id} className="v16-match v17-match">
      <span className="v17-match-icon">{m.category==='Audífonos'?'🎧':m.category==='Teclados'?'⌨️':m.category==='Celulares'?'📱':'✦'}</span>
      <span><strong>{m.title}</strong><small>{m.category} · <span className="location-label"><LocationPin/>{m.city||'Ciudad por definir'}</span> · {Math.round(m.similarity*100)}% de afinidad</small></span><span>↗</span>
    </Link>):result.match_ids.map(id=>{const w=byId(id);if(!w)return null;return <Link key={id} href={'/deseo/'+id} className="v16-match">
      <img src={w.image} alt="" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=w.fallback}}/>
      <span><strong>{w.title}</strong><small>{w.category} · ejemplo ilustrativo</small></span><span>↗</span></Link>})}
    {result.source==='ai' && !matches.length&&<p className="create-v7-no-match">Todavía no hay otros deseos compatibles. ¡Publica el tuyo para que otros puedan encontrarlo!</p>}
    {result.source==='local' && !result.match_ids.length&&<p className="create-v7-no-match">No encontramos ideas parecidas en el catálogo de prueba.</p>}
   </div>
   <div className="create-v7-result-actions"><button className="create-v7-save" type="button" onClick={save} disabled={saved||busy}>
     {busy?'Guardando…':saved?'✓ Deseo guardado':result.source==='ai'?'Publicar mi deseo →':'Guardar en este navegador →'}</button>
    <button className="create-v7-edit" onClick={()=>formRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})} type="button">← Editar mi idea</button></div>
   <p className="v17-result-note" role="status">{notice|| (result.source==='ai'?'Al publicar, otras personas podrán ver un resumen de tu deseo. Tu texto original queda privado.':'Solo se guarda en tu navegador.')}</p>
  </section>}
  <section id="mis-deseos" aria-label="Mis deseos guardados" className="create-v7-mine"><div className="create-v7-mine-title">
   <div><span className="create-v7-eyebrow">TUS IDEAS</span><h2>Mis deseos</h2></div><span>{mode==='cloud'?'Tus deseos publicados':'Guardados en este dispositivo'}</span></div>
   <div>{mode==='cloud'?onlineList.length?onlineList.map(w=><div className="create-v7-saved-item" key={w.id}>
    <div><strong>{w.raw_text}</strong><small>{w.category} · {w.city||'Ubicación por definir'} · publicado {new Date(w.created_at).toLocaleDateString('es-PE')}</small></div>
    <button type="button" onClick={()=>remove(w.id,true)} aria-label="Eliminar deseo publicado">Eliminar</button></div>)
    :<div className="create-v7-empty-mine">Aún no has publicado deseos desde este navegador.</div>
    :localList.length?localList.map(w=><div className="create-v7-saved-item" key={w.id}>
      <div><strong>{w.text}</strong><small>{w.analysis.category} · {w.analysis.location}</small></div>
      <button type="button" onClick={()=>remove(w.id,false)}>Eliminar</button></div>)
    :<div className="create-v7-empty-mine">Tus deseos guardados aparecerán aquí.</div>}</div>
   {error&&<p className="v17-error" role="alert">{error}</p>}
  </section>
 </div></section>{busy&&<WishLoadingModal saving={saving}/>}</main>;
}
