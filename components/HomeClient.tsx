'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import HomeHero from './HomeHero';
import HowItWorks from './HowItWorks';
import FeaturedWishes from './FeaturedWishes';
import MatchStory from './MatchStory';
import FinalCTA from './FinalCTA';
import ScrollExperience from './ScrollExperience';

export default function HomeClient(){
 const router=useRouter();const [sellerNotice,setSellerNotice]=useState(false);
 const [activeFilter,setActiveFilter]=useState('Todos');
 useEffect(()=>{const node=document.getElementById('stage-offer-toast');if(node)node.hidden=!sellerNotice;},[sellerNotice]);
 const click=(e:React.MouseEvent<HTMLElement>)=>{
  const target=e.target as HTMLElement;
  const prefill=target.closest<HTMLElement>('[data-wish-prefill], [data-create-wish]');
  if(prefill){e.preventDefault();const val=prefill.dataset.wishPrefill||prefill.dataset.createWish||'';router.push('/crear?ejemplo='+encodeURIComponent(val));return;}
  const offer=target.closest('[data-demo-offer]');
  if(offer){e.preventDefault();setSellerNotice(true);window.setTimeout(()=>setSellerNotice(false),4200);return;}
  const filter=target.closest<HTMLButtonElement>('.ds-filter');
  if(filter){e.preventDefault();const f=filter.dataset.filter||filter.dataset.kind||filter.textContent?.trim()||'Todos';setActiveFilter(f);}
 };
 useEffect(()=>{
  document.querySelectorAll<HTMLButtonElement>('.ds-filter').forEach(b=>b.classList.toggle('active',(b.dataset.kind||b.dataset.filter||b.textContent?.trim())===activeFilter));
  const cards=[...document.querySelectorAll<HTMLElement>('.ds-tech-card')];
  cards.forEach(el=>{el.hidden=activeFilter!=='Todos' && el.dataset.kind!==activeFilter;});
  const empty=document.getElementById('ds-featured-empty');if(empty)empty.hidden=cards.some(el=>!el.hidden);
 },[activeFilter]);
 return <main id="view-home" className="preview-home" onClick={click}>
  <ScrollExperience /><HomeHero /><HowItWorks /><FeaturedWishes /><MatchStory /><FinalCTA />
 </main>;
}
