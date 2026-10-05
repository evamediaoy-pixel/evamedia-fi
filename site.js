
const hdr=document.getElementById('hdr');
const bar=document.getElementById('progress');
const menuBtn=document.querySelector('.menuBtn');
const nav=document.querySelector('header nav');

addEventListener('scroll',()=>{
  const h=document.documentElement;
  const max=h.scrollHeight-h.clientHeight;
  const p=max>0?h.scrollTop/max:0;
  bar.style.width=(p*100)+'%';
  hdr.classList.toggle('scrolled',scrollY>20);
},{passive:true});

const reveals=[...document.querySelectorAll('.reveal')];
if(innerWidth<=900){
  reveals.forEach(el=>el.classList.add('in'));
}else{
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting)e.target.classList.add('in');
  }),{threshold:.06,rootMargin:'0px 0px -4% 0px'});
  reveals.forEach(el=>io.observe(el));
}

if(menuBtn){
  menuBtn.innerHTML='<span aria-hidden="true"></span>';
  menuBtn.setAttribute('aria-expanded','false');
  menuBtn.setAttribute('aria-controls','main-nav');
}
if(nav) nav.id='main-nav';

function closeMenu(){
  hdr.classList.remove('menu-open');
  if(menuBtn) menuBtn.setAttribute('aria-expanded','false');
}
function toggleMenu(){
  const open=hdr.classList.toggle('menu-open');
  if(menuBtn) menuBtn.setAttribute('aria-expanded',String(open));
}

menuBtn?.addEventListener('click',toggleMenu);
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
document.addEventListener('click',e=>{
  if(hdr.classList.contains('menu-open') && !hdr.contains(e.target)) closeMenu();
});
