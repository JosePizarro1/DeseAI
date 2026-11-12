
(function(){
const hero=document.querySelector('.stage-hero'),how=document.getElementById('how-on-home');
const items=document.querySelectorAll('.stage-reveal');
if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}})},{threshold:.17});items.forEach((e,i)=>{e.style.transitionDelay=i*110+'ms';io.observe(e)})}else items.forEach(e=>e.classList.add('is-visible'));
let scheduled=false;
function update(){scheduled=false;if(!hero || !document.getElementById('view-home') || document.getElementById('view-home').classList.contains('off'))return;
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const r=hero.getBoundingClientRect();const p=Math.min(1,Math.max(0,(-r.top)/Math.max(400,r.height*.72)));
hero.style.opacity=String(Math.max(0.12,1-p*.89));hero.style.transform=`translateY(${-Math.min(27,p*27)}px)`;
}
window.addEventListener('scroll',()=>{if(!scheduled){requestAnimationFrame(update);scheduled=true}},{passive:true});
window.addEventListener('hashchange',()=>{setTimeout(()=>{if(hero){hero.style.opacity='1';hero.style.transform='';}update()},90)});
update();
document.querySelectorAll('[data-wish-prefill]').forEach(b=>b.addEventListener('click',()=>{
const phrase=b.getAttribute('data-wish-prefill');location.hash='#crear';setTimeout(()=>{const field=document.getElementById('wish-text');if(field){field.value=phrase;field.dispatchEvent(new Event('input',{bubbles:true}));field.focus()}},90);
}));
document.querySelectorAll('[data-demo-offer]').forEach(b=>b.addEventListener('click',()=>{
const note=document.getElementById('stage-offer-toast'); if(note){note.hidden=false;setTimeout(()=>note.hidden=true,4800)}
}));
})();
