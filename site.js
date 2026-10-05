
const hdr=document.getElementById('hdr'),bar=document.getElementById('progress');
addEventListener('scroll',()=>{const h=document.documentElement;const p=h.scrollTop/(h.scrollHeight-h.clientHeight);bar.style.width=(p*100)+'%';hdr.classList.toggle('scrolled',scrollY>20)});
const reveals=[...document.querySelectorAll('.reveal')];if(innerWidth<=900){reveals.forEach(el=>el.classList.add('in'))}else{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.06,rootMargin:'0px 0px -4% 0px'});reveals.forEach(el=>io.observe(el));}
document.querySelector('.menuBtn').onclick=()=>{const n=document.querySelector('nav');n.style.display=n.style.display==='flex'?'none':'flex';n.style.position='absolute';n.style.top='72px';n.style.right='14px';n.style.flexDirection='column';n.style.alignItems='stretch';n.style.padding='18px';n.style.background='rgba(7,16,25,.96)';n.style.border='1px solid rgba(255,255,255,.1)';n.style.borderRadius='18px'};

