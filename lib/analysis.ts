import {wishes} from './wishes';
export type WishDraft={text:string;location:string;budget:string;date:string};
export type Analysis={title:string;summary:string;category:string;location:string;budget:string;date:string;match_ids:string[];source:'local'|'ai'};
const norm=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const families:[string,string[]][]=[['Audífonos',['audifon','auricular','headphone','bluetooth','casco']],['Teclados',['teclado','mecanico','keyboard']],['Celulares',['celular','telefono','smartphone','movil']],['Experiencias',['ceramica','aurora','viaje','taller','concierto','globo']]];
export function analyzeWish(d:WishDraft):Analysis{
 const text=norm(d.text),category=families.find(([,words])=>words.some(w=>text.includes(w)))?.[0]||'Por explorar';
 const location=d.location.trim()||(['Lima','Cusco','Arequipa','Islandia'].find(s=>text.includes(norm(s)))||'Por definir');
 const money=d.budget.trim()||(d.text.match(/(?:S\/|US\$|USD|\$)\s*\d+(?:[.,]\d+)?/i)?.[0]||'Por definir');
 const scores=wishes.map(w=>({id:w.id,score:(category===w.category?4:0)+norm(w.title+' '+w.sub+' '+w.sample).split(' ').filter(s=>s.length>4&&text.includes(s)).length})).sort((a,b)=>b.score-a.score);
 const match_ids=scores.filter(s=>s.score>=3).slice(0,3).map(s=>s.id);
 return {title:d.text.slice(0,100),summary:'Tu idea puede interesar a otras personas. Estas coincidencias se basan en ejemplos del catálogo de DeseAI.',category,location,budget:money,date:d.date.trim()||'Por definir',match_ids,source:'local'};
}
