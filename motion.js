/* Hareket katmanı: Lenis (akıcı kaydırma, sadece fare/touchpad) + GSAP ScrollTrigger (bölümler kaydırınca belirir).
 * "Hareketi azalt" açıksa ya da kütüphaneler yüklenmezse hiçbir şey yapmaz; içerik her zaman görünür kalır. */
(function(){
'use strict';
if(!window.gsap||!window.ScrollTrigger)return;
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var gsap=window.gsap,ST=window.ScrollTrigger;gsap.registerPlugin(ST);
var hdr=document.getElementById('hdr'),offset=function(){return -((hdr&&hdr.offsetHeight)||0)-8};

/* Akıcı kaydırma: sadece hassas işaretçili (fare/touchpad) cihazlarda; dokunmatikte tarayıcının kendi kaydırması kalır. */
var lenis=null;
if(window.Lenis&&matchMedia('(pointer: fine)').matches){
  lenis=new window.Lenis({duration:1.1,smoothWheel:true,easing:function(t){return Math.min(1,1.001-Math.pow(2,-10*t))}});
  lenis.on('scroll',ST.update);
  gsap.ticker.add(function(time){lenis.raf(time*1000)});gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){var id=a.getAttribute('href');if(id.length<2)return;var t=document.querySelector(id);if(!t)return;e.preventDefault();lenis.scrollTo(t,{offset:offset()});history.replaceState(null,'',id);});
  });
  /* Açık sohbet/menü üstünde kaydırma sayfayı değil paneli kaydırsın. */
  document.querySelectorAll('.wa-panel,.wa-body,#main-nav').forEach(function(el){el.setAttribute('data-lenis-prevent','')});
}

/* Açılış: başlık satır satır, kartlar sırayla. */
gsap.timeline({defaults:{ease:'power3.out'}})
  .from('.hero .kicker',{y:14,autoAlpha:0,duration:.5})
  .from('.hero h1',{y:28,autoAlpha:0,duration:.7},'-=.25')
  .from('.hero h1 span',{y:18,autoAlpha:0,duration:.6},'-=.35')
  .from('.hero-sub',{y:16,autoAlpha:0,duration:.55},'-=.4')
  .from('.hero-actions > *',{y:12,autoAlpha:0,duration:.45,stagger:.08},'-=.35')
  .from('.hero-cards > *',{y:40,autoAlpha:0,rotate:function(i){return i%2?2:-2},duration:.8,stagger:.14},'-=.6');

/* Hero kartları kaydırırken hafif paralaks (sadece geniş ekranda). */
ST.matchMedia({'(min-width: 961px)':function(){
  gsap.to('.hero-cards .hcard-media',{yPercent:-6,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  gsap.to('.hero-cards .hcard-studio',{yPercent:-12,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
}});

/* Bölümler: başlık + içerik kaydırınca belirir. */
function reveal(targets,trigger,vars){var list=gsap.utils.toArray(targets);if(!list.length)return;
  gsap.from(list,Object.assign({y:30,autoAlpha:0,duration:.7,ease:'power3.out',stagger:.08,scrollTrigger:{trigger:trigger||list[0],start:'top 85%',once:true}},vars||{}));}
gsap.utils.toArray('main section').forEach(function(sec){
  if(sec.classList.contains('hero'))return;
  reveal(sec.querySelectorAll(':scope h2, :scope .kicker, :scope .lead'),sec);
});
/* EVA Studio: ekran örneği "açılır", menü satırları tek tek gelir — gerçek bir TV menüsü gibi. */
reveal('.studio .board','.studio',{y:50,scale:.96,duration:.9});
reveal('.studio .board-row','.studio .board-list',{x:-24,y:0,stagger:.1,duration:.5});
reveal('.studio-feats > *','.studio-feats',{y:18,stagger:.06,duration:.5});
reveal('.svc-grid .svc','.svc-grid',{y:36,stagger:.07});
reveal('#strip > *','#strip',{x:60,y:0,stagger:.08,duration:.6});
reveal('.contact-grid > *','.contact-grid',{y:24,stagger:.1});
reveal('#ukk details','#ukk',{y:14,stagger:.05,duration:.45});

/* Görseller yüklendikçe tetik noktalarını yenile. */
addEventListener('load',function(){ST.refresh()});
})();
