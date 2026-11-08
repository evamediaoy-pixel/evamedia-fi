(function(){
'use strict';
var WA='358449734365';
var hdr=document.getElementById('hdr');
var bar=document.getElementById('progress');
var menuBtn=document.querySelector('.menuBtn');
var nav=document.getElementById('main-nav');

function waUrl(text){return 'https://wa.me/'+WA+(text?'?text='+encodeURIComponent(text):'');}
function openWa(text){window.open(waUrl(text),'_blank','noopener');}
function track(name,data){try{window.va&&window.va('event',{name:name,data:data||{}});}catch(e){}}

/* Scroll: progress + header */
function onScroll(){
  var h=document.documentElement,max=h.scrollHeight-h.clientHeight;
  if(bar)bar.style.width=(max>0?h.scrollTop/max*100:0)+'%';
  if(hdr)hdr.classList.toggle('scrolled',scrollY>20);
}
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* Reveal */
var reveals=[].slice.call(document.querySelectorAll('.reveal'));
if(innerWidth<=960||!('IntersectionObserver' in window)){
  reveals.forEach(function(el){el.classList.add('in')});
}else{
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}})},{threshold:.06,rootMargin:'0px 0px -4% 0px'});
  reveals.forEach(function(el){io.observe(el)});
}

/* Mobile menu */
function closeMenu(){if(!hdr)return;hdr.classList.remove('menu-open');menuBtn&&menuBtn.setAttribute('aria-expanded','false');}
if(menuBtn){
  menuBtn.addEventListener('click',function(){var o=hdr.classList.toggle('menu-open');menuBtn.setAttribute('aria-expanded',String(o));});
}
if(nav)nav.querySelectorAll('a').forEach(function(a){a.addEventListener('click',closeMenu)});
document.addEventListener('click',function(e){if(hdr&&hdr.classList.contains('menu-open')&&!hdr.contains(e.target))closeMenu();});

/* WhatsApp links with prefilled message */
document.querySelectorAll('a[data-msg]').forEach(function(a){
  a.href=waUrl(a.getAttribute('data-msg'));
  a.addEventListener('click',function(){track('whatsapp_click',{from:a.closest('section,div')?.id||'link'})});
});
document.querySelectorAll('a[href^="tel:"]').forEach(function(a){a.addEventListener('click',function(){track('phone_click')})});

/* Service cards → preselect in quote form */
var form=document.getElementById('qform');
document.querySelectorAll('.svc[data-service]').forEach(function(card){
  card.addEventListener('click',function(){
    if(!form)return;
    var v=card.getAttribute('data-service');
    form.querySelectorAll('input[name="service"]').forEach(function(i){if(i.value===v)i.checked=true;});
  });
});

/* Quote form */
if(form){
  var via='wa',note=document.getElementById('qnote'),noteDefault=note?note.textContent:'';
  form.querySelectorAll('button[data-via]').forEach(function(b){b.addEventListener('click',function(){via=b.getAttribute('data-via')})});
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var fd=new FormData(form);
    var services=fd.getAll('service');
    var when=fd.get('when')||'';
    var name=(fd.get('name')||'').trim(),company=(fd.get('company')||'').trim(),msg=(fd.get('msg')||'').trim();
    if(!services.length&&!msg){
      if(note){note.textContent='Valitse vähintään yksi palvelu tai kirjoita lyhyt kuvaus.';note.classList.add('err');}
      return;
    }
    if(note){note.textContent=noteDefault;note.classList.remove('err');}
    var lines=['Hei Eva Media! Haluaisin tarjouksen.',''];
    if(services.length)lines.push('Palvelu: '+services.join(', '));
    if(when)lines.push('Aikataulu: '+when);
    if(name)lines.push('Nimi: '+name);
    if(company)lines.push('Yritys: '+company);
    if(msg){lines.push('');lines.push(msg);}
    var text=lines.join('\n');
    track('quote_submit',{via:via,services:services.join(',')});
    if(via==='mail'){
      location.href='mailto:info@evamedia.fi?subject='+encodeURIComponent('Tarjouspyyntö'+(services.length?' – '+services.join(', '):''))+'&body='+encodeURIComponent(text);
    }else{
      openWa(text);
    }
  });
}

/* WhatsApp chat widget */
var chat=document.getElementById('waChat');
if(chat){
  var panel=document.getElementById('waPanel'),fab=document.getElementById('waFab'),teaser=document.getElementById('waTeaser');
  var input=document.getElementById('waInput'),wform=document.getElementById('waForm');
  var store={get:function(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}};
  function setOpen(o){
    panel.hidden=!o;chat.classList.toggle('open',o);fab.setAttribute('aria-expanded',String(o));
    if(o){teaser.hidden=true;chat.classList.add('seen');store.set('wa_seen','1');track('chat_open');setTimeout(function(){if(innerWidth>600)input.focus()},150);}
  }
  if(store.get('wa_seen'))chat.classList.add('seen');
  fab.addEventListener('click',function(){setOpen(panel.hidden)});
  document.getElementById('waClose').addEventListener('click',function(){setOpen(false);fab.focus()});
  document.getElementById('waTOpen').addEventListener('click',function(){setOpen(true)});
  document.getElementById('waTClose').addEventListener('click',function(){teaser.hidden=true;store.set('wa_teaser','0')});
  chat.querySelectorAll('.wa-quick button').forEach(function(b){b.addEventListener('click',function(){track('chat_quick',{topic:b.textContent});openWa(b.getAttribute('data-msg'))})});
  wform.addEventListener('submit',function(e){e.preventDefault();var t=input.value.trim();openWa(t||'Hei! Haluaisin kysyä tarjousta.');input.value='';});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!panel.hidden){setOpen(false);fab.focus();}closeMenu();}});
  /* Teaser bubble after a moment, once per session */
  if(store.get('wa_teaser')!=='0'&&!store.get('wa_seen')){
    setTimeout(function(){if(panel.hidden){teaser.hidden=false;store.set('wa_teaser','0');}},7000);
  }
}

/* Instagram pinned posts */
(function refreshPinnedInstagram(){
  var holder=document.getElementById('instagramPinned');
  if(!holder||!window.fetch)return;
  fetch('/api/instagram-pinned',{headers:{accept:'application/json'}}).then(function(r){return r.ok?r.json():null}).then(function(data){
    if(!data||!Array.isArray(data.items)||!data.items.length)return;
    holder.innerHTML='';
    data.items.slice(0,3).forEach(function(item){
      if(!item||!/^https:\/\/(www\.)?instagram\.com\//.test(item.permalink||''))return;
      var a=document.createElement('a');
      a.className='instagram-card'+(item.thumbnail?' has-thumb':'');
      a.href=item.permalink;a.target='_blank';a.rel='noopener';
      if(item.thumbnail&&/^https:\/\//.test(item.thumbnail))a.style.backgroundImage='url("'+item.thumbnail.replace(/"/g,'%22')+'")';
      var b=document.createElement('span');b.className='instagram-badge';b.textContent=(item.type||'POST').toString().toUpperCase().slice(0,12);
      var l=document.createElement('span');l.className='instagram-card-label';l.textContent='Katso Instagramissa';
      a.appendChild(b);a.appendChild(l);holder.appendChild(a);
    });
  }).catch(function(){});
})();
})();
