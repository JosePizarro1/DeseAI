'use client';
import {useEffect} from 'react';
export default function ScrollExperience(){
 useEffect(()=>{
  const root=document.getElementById('view-home');if(!root)return;
  const query=(q:string, ctx:ParentNode=root)=>Array.from(ctx.querySelectorAll<HTMLElement>(q));
  const prefer=window.matchMedia('(prefers-reduced-motion: reduce)');
  let disposed=false;
  let observer:IntersectionObserver|undefined;
  let stageObserver:IntersectionObserver|undefined;
  let raf=0;
  const groups:HTMLElement[]=[];
  const attaches=(selectors:string, content:string[],delay=90)=>{
    query(selectors).forEach(group=>{
      const items:HTMLElement[]=[];
      content.forEach(s=>query(s,group).forEach(el=>{if(!items.includes(el))items.push(el)}));
      if(!items.length)return;
      group.classList.add('v15-group');
      items.forEach((el,i)=>{el.classList.add('v15-unit');el.style.setProperty('--v15-delay',Math.min(i,8)*delay+'ms');if(el.matches('img,.stage-step-visual,.ds-experience-visual,.ds-wish-art'))el.classList.add('v15-illustration')});
      groups.push(group);
    });
  };
  attaches('.stage-how-heading',['.stage-how-title-art','.stage-small-label','h2','.stage-how-intro'],110);
  attaches('.stage-step',['.stage-step-visual','.stage-n','.stage-step-copy h3','.stage-step-copy p'],120);
  attaches('.stage-next-cta',[':scope > span',':scope > a'],120);
  attaches('.ds-discover .ds-section-heading',['.ds-eyebrow','h2','p','.ds-text-link'],100);
  attaches('.ds-discover .ds-filters',[':scope > button'],75);
  attaches('.ds-discover .ds-experience',['.ds-experience-visual','.ds-exp-meta','.ds-exp-title','.ds-exp-description'],85);
  attaches('.ds-match-copy',['.ds-match-eyebrow','h2','p','.ds-match-stat','.ds-match-actions'],105);
  attaches('.ds-match-visual',[':scope > img','.ds-match-floating'],140);
  attaches('.ds-wish-content',['.ds-wish-kicker','h2','p','.ds-wish-actions','small'],105);
  attaches('.ds-wish-art',[':scope > img'],110);
  const sections=[['.stage-how-heading',0],['.stage-next-cta',0],['.ds-discover .ds-section-heading',0],['.ds-discover .ds-filters',80],['.ds-discover .ds-experience',0],['.ds-discover .ds-demo-label',0],['.ds-wish-content',0],['.ds-wish-art',130]] as const;
  const motionElements:HTMLElement[]=[];
  sections.forEach(([selector,delay])=>query(selector).forEach((el,i)=>{
    el.classList.add('motion-reveal');
    if(selector==='.ds-discover .ds-experience')el.style.setProperty('--motion-delay',(i*110)+'ms');
    else if(delay)el.style.setProperty('--motion-delay',delay+'ms');
    motionElements.push(el);
  }));
  const items=Array.from(new Set([...query('.stage-reveal,.ds-enter'),...motionElements]));
  const reveal=(el:HTMLElement)=>{
    if(el.classList.contains('stage-reveal')||el.classList.contains('stage-step'))el.classList.add('is-visible');
    if(el.classList.contains('motion-reveal'))el.classList.add('motion-visible');
    if(el.classList.contains('ds-enter'))el.classList.add('ds-visible');
    if(groups.includes(el))el.classList.add('v15-active');
  };
  // Setup animation only when movement is enabled. Otherwise all text remains visible.
  const enable=()=>{
    if(prefer.matches||disposed){groups.forEach(g=>g.classList.add('v15-active'));items.forEach(reveal);return;}
    root.classList.add('v15-ready','motion-ready');document.documentElement.classList.add('v15-intro','motion-ready');
    observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){const el=e.target as HTMLElement;el.classList.add('v15-active');observer?.unobserve(el)}})},{threshold:.06,rootMargin:'0px 0px -12px 0px'});
    stageObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){reveal(e.target as HTMLElement);stageObserver?.unobserve(e.target)}})},{threshold:.07});
    groups.forEach(g=>{const box=g.getBoundingClientRect();if(box.top<innerHeight*.92&&box.bottom>0){g.classList.add('v15-active')}else observer?.observe(g)});
    items.forEach(el=>{const b=el.getBoundingClientRect();if(b.top<innerHeight*.94&&b.bottom>0){reveal(el)}else stageObserver?.observe(el)});
  };
  // defer so React commits all section markup before measuring positions
  const t=window.requestAnimationFrame(enable);
  const hero=root.querySelector<HTMLElement>('.stage-hero');
  const scene=root.querySelector<HTMLElement>('.stage-scene');
  const how=root.querySelector<HTMLElement>('.stage-how-inner');
  const howSection=root.querySelector<HTMLElement>('.stage-how');
  const tick=()=>{
    raf=0;if(!hero)return;
    groups.forEach(g=>{const box=g.getBoundingClientRect();if(box.top<innerHeight*.92){g.classList.add('v15-active');observer?.unobserve(g)}});
    items.forEach(el=>{if(el.getBoundingClientRect().top<innerHeight*.94){reveal(el);stageObserver?.unobserve(el)}});
    if(prefer.matches){hero.style.removeProperty('opacity');hero.style.removeProperty('transform');scene?.style.removeProperty('--mv14-parallax');return;}
    const b=hero.getBoundingClientRect();const p=Math.max(0,Math.min(1,-b.top/Math.max(400,b.height*.72)));
    hero.style.opacity=String(Math.max(.12,1-p*.89));hero.style.transform=`translateY(${-Math.min(27,p*27)}px)`;
    if(scene)scene.style.setProperty('--mv14-parallax',Math.round(-p*22)+'px');
    if(how&&howSection){const b2=howSection.getBoundingClientRect();const v=Math.max(0,Math.min(1,(innerHeight-b2.top)/Math.max(innerHeight,1)));how.style.setProperty('--mv14-how-rise',Math.round((1-v)*15)+'px')}
  };
  const onScroll=()=>{if(!raf)raf=requestAnimationFrame(tick)};
  const onPreference=()=>{if(prefer.matches){root.classList.remove('v15-ready','motion-ready');document.documentElement.classList.remove('v15-intro','motion-ready');groups.forEach(g=>g.classList.add('v15-active'));items.forEach(reveal)}onScroll()};
  window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll,{passive:true});prefer.addEventListener('change',onPreference);
  // React route transitions may land directly on an anchor
  const delayed=window.setTimeout(()=>{if(location.hash==='#como-funciona')document.getElementById('como-funciona')?.scrollIntoView();onScroll()},120);
  return ()=>{disposed=true;cancelAnimationFrame(t);cancelAnimationFrame(raf);clearTimeout(delayed);observer?.disconnect();stageObserver?.disconnect();window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);prefer.removeEventListener('change',onPreference);document.documentElement.classList.remove('v15-intro','motion-ready')};
 },[]);
 return null;
}
