/* DeseAI V14 - animaciones progresivas y accesibles, sin dependencias. */
(() => {
  const root=document.getElementById('view-home');
  if(!root || !('IntersectionObserver' in window)) return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches) return; // never hide content for reduced motion
  const sections=[
    ['.stage-how-heading',0],
    ['.stage-next-cta',0],
    ['.ds-discover .ds-section-heading',0],
    ['.ds-discover .ds-filters',80],
    ['.ds-discover .ds-experience',0],
    ['.ds-discover .ds-demo-label',0],
    ['.ds-wish-content',0],
    ['.ds-wish-art',130]
  ];
  const selected=[];
  sections.forEach(([selector,delay])=>{
    root.querySelectorAll(selector).forEach((el,i)=>{
      el.classList.add('motion-reveal');
      if(selector==='.ds-discover .ds-experience')
        el.style.setProperty('--motion-delay', (i*110)+'ms');
      else if(delay) el.style.setProperty('--motion-delay',delay+'ms');
      selected.push(el);
    });
  });
  // Measure before hiding: existing sections currently on screen must stay visible.
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('motion-visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:.06,rootMargin:'0px 0px -18px 0px'});
  selected.forEach(el=>{
    const box=el.getBoundingClientRect();
    if(box.top < innerHeight*.91 && box.bottom>0){el.classList.add('motion-visible');}
    else observer.observe(el);
  });
  root.classList.add('motion-ready');
  document.documentElement.classList.add('motion-ready');

  const hero=root.querySelector('.stage-hero');
  const scene=root.querySelector('.stage-scene');
  const how=root.querySelector('.stage-how');
  const inner=how?.querySelector('.stage-how-inner');
  let raf=0;
  const clamp=(min,x,max)=>Math.max(min,Math.min(max,x));
  function tick(){
    raf=0;
    if(reduced.matches || root.classList.contains('off') || !hero) return;
    const box=hero.getBoundingClientRect();
    const progress=clamp(0,-box.top/Math.max(380,box.height*.78),1);
    // If a deep link skips a section, never leave its content invisible.
    selected.forEach(el=>{
      if(!el.classList.contains('motion-visible') && el.getBoundingClientRect().bottom<0){
        el.classList.add('motion-visible');
        observer.unobserve(el);
      }
    });
    if(scene) scene.style.setProperty('--mv14-parallax',Math.round(-progress*22)+'px');
    if(inner && how){
      const r=how.getBoundingClientRect();
      const reveal=clamp(0,(innerHeight-r.top)/Math.max(innerHeight,1),1);
      inner.style.setProperty('--mv14-how-rise',Math.round((1-reveal)*15)+'px');
    }
  }
  const queue=()=>{if(!raf) raf=requestAnimationFrame(tick)};
  window.addEventListener('scroll',queue,{passive:true});
  window.addEventListener('resize',queue,{passive:true});
  window.addEventListener('hashchange',()=>{
    queue();
    // Routed back from an internal page: content that was already seen stays visible.
    requestAnimationFrame(()=>selected.forEach(el=>{
      if(el.getBoundingClientRect().top<innerHeight*.9) el.classList.add('motion-visible');
    }));
  });
  reduced.addEventListener?.('change',()=>{
    if(reduced.matches) {
      selected.forEach(el=>el.classList.add('motion-visible'));
      scene?.style.removeProperty('--mv14-parallax');
      inner?.style.removeProperty('--mv14-how-rise');
    } else queue();
  });
  queue();
})();
