/* DeseAI V15 — grupos independientes con entrada progresiva y sin dependencias. */
(() => {
  const root=document.getElementById('view-home');
  if (!root || !('IntersectionObserver' in window)) return;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches) return;
  const groups=[];
  const attach=(group,selectors,offset=82)=>{
    if(!group) return;
    const items=[];
    selectors.forEach((selector)=>{
      group.querySelectorAll(selector).forEach(el=>{
        // Do not capture the same DOM element more than once.
        if(items.includes(el) || el.closest('.v15-group') && el.closest('.v15-group')!==group) return;
        items.push(el);
      });
    });
    if(!items.length)return;
    group.classList.add('v15-group');
    items.forEach((el,i)=>{
      el.classList.add('v15-unit');
      if(el.matches('img,.stage-step-visual,.ds-experience-visual,.ds-wish-art')) el.classList.add('v15-illustration');
      el.style.setProperty('--v15-delay',(Math.min(i,8)*offset)+'ms');
    });
    groups.push(group);
  };
  const one=(selector,items,offset)=>attach(root.querySelector(selector),items,offset);
  const many=(selector,items,offset)=>root.querySelectorAll(selector).forEach(el=>attach(el,items,offset));
  one('.stage-how-heading',['.stage-how-title-art','.stage-small-label','h2','.stage-how-intro'],110);
  many('.stage-step',['.stage-step-visual','.stage-n','.stage-step-copy h3','.stage-step-copy p'],120);
  one('.stage-next-cta',[':scope > span',':scope > a'],120);
  one('.ds-discover .ds-section-heading',['.ds-eyebrow','h2','p','.ds-text-link'],100);
  one('.ds-discover .ds-filters',[':scope > button'],75);
  many('.ds-discover .ds-experience',['.ds-experience-visual','.ds-exp-meta','.ds-exp-title','.ds-exp-description'],85);
  one('.ds-match-copy',['.ds-match-eyebrow','h2','p','.ds-match-stat','.ds-match-actions'],105);
  one('.ds-match-visual',[':scope > img','.ds-match-floating'],140);
  one('.ds-wish-content',['.ds-wish-kicker','h2','p','.ds-wish-actions','small'],105);
  one('.ds-wish-art',[':scope > img'],110);
  const nav=[...document.querySelectorAll('.site-header .brand,.site-header .desktop-links > a,.site-header .nav-cta,.site-header .mobile-menu')];
  nav.forEach((el,i)=>el.style.setProperty('--v15-nav-delay',(i*85)+'ms'));
  const observer=new IntersectionObserver(entries=>{
    for(const item of entries){
      if(item.isIntersecting){item.target.classList.add('v15-active');observer.unobserve(item.target);}
    }
  },{threshold:.065,rootMargin:'0px 0px -12px 0px'});
  groups.forEach(group=>{
    const box=group.getBoundingClientRect();
    if(box.top<innerHeight*.91 && box.bottom>0){group.classList.add('v15-active')}
    else observer.observe(group);
  });
  root.classList.add('v15-ready');
  document.documentElement.classList.add('v15-intro');
  // When revisiting the home via internal navigation, reveal all already visible groups.
  const refresh=()=>{
    for(const group of groups){
      if(group.getBoundingClientRect().top<innerHeight*.9){group.classList.add('v15-active');observer.unobserve(group);}
    }
  };
  window.addEventListener('hashchange',()=>requestAnimationFrame(refresh));
  window.addEventListener('resize',refresh,{passive:true});
  // Fast scrolling / anchor jumps can skip IntersectionObserver notifications.
  // Any group already passed above the viewport must be revealed.
  let scrollScheduled=false;
  window.addEventListener('scroll',()=>{
    if(scrollScheduled)return;
    scrollScheduled=true;
    requestAnimationFrame(()=>{scrollScheduled=false;refresh();});
  },{passive:true});
  // Changed while page is open: never leave invisible content behind.
  preference.addEventListener?.('change',()=>{
    if(preference.matches){
      groups.forEach(el=>el.classList.add('v15-active'));
      root.classList.remove('v15-ready');
      document.documentElement.classList.remove('v15-intro');
    } else {
      root.classList.add('v15-ready');
      document.documentElement.classList.add('v15-intro');
      refresh();
    }
  });
})();
