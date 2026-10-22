(function(){
"use strict";
var d=document,de=d.documentElement,w=window;
var RM=de.classList.contains('rm');
var hasG=!!(w.gsap&&w.ScrollTrigger);
if(hasG){gsap.registerPlugin(ScrollTrigger);ScrollTrigger.config({ignoreMobileResize:true});}else{de.classList.remove('js');}

/* ---------- header + mobile menu ---------- */
var hdr=d.querySelector('.hdr');
function hdrState(){if(hdr)hdr.classList.toggle('solid',w.scrollY>20||d.body.classList.contains('menu-open'));}
w.addEventListener('scroll',hdrState,{passive:true});hdrState();
var mb=d.querySelector('.menu-btn'),lenis=null;
if(mb){mb.addEventListener('click',function(){
  var o=d.body.classList.toggle('menu-open');mb.setAttribute('aria-expanded',o);
  if(lenis){o?lenis.stop():lenis.start();}hdrState();
});
d.querySelectorAll('.mnav a').forEach(function(a){a.addEventListener('click',function(){d.body.classList.remove('menu-open');if(lenis)lenis.start();});});}

/* ---------- smooth scroll ---------- */
if(!RM&&w.Lenis&&hasG){
  lenis=new Lenis({duration:1.1,smoothWheel:true});
  lenis.on('scroll',ScrollTrigger.update);
  gsap.ticker.add(function(t){lenis.raf(t*1000);});
  gsap.ticker.lagSmoothing(0);
  d.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;
    var id=a.getAttribute('href');if(id.length<2)return;var t=d.querySelector(id);if(!t)return;
    e.preventDefault();lenis.scrollTo(t,{offset:-80});if(id==='#main'){t.setAttribute('tabindex','-1');t.focus({preventScroll:true});}
  });
  if(location.hash){var ht=d.querySelector(location.hash);if(ht)w.addEventListener('load',function(){setTimeout(function(){lenis.scrollTo(ht,{offset:-80,immediate:true});},50);});}
}

/* ---------- loader (first visit only, <2s) ---------- */
var loader=d.querySelector('.loader');
function hideLoader(){if(!loader)return;introHero();if(hasG){gsap.to(loader,{yPercent:-100,duration:.6,ease:'power3.inOut',onComplete:function(){loader.remove();loader=null;}});}else loader.remove();}
var seen=false;try{seen=sessionStorage.getItem('sk_seen')==='1';sessionStorage.setItem('sk_seen','1');}catch(e){}
if(loader){
  if(seen||RM){loader.remove();loader=null;}
  else{
    var n=loader.querySelector('.n'),bar=loader.querySelector('.bar i'),o={v:0};
    if(hasG){gsap.to(o,{v:100,duration:1.2,ease:'power2.inOut',onUpdate:function(){n.textContent=Math.round(o.v);bar.style.width=o.v+'%';},onComplete:hideLoader});}
    else hideLoader();
  }
}

/* ---------- hero intro ---------- */
var introDone=false;
function introHero(){
  if(introDone||!hasG||RM)return;introDone=true;
  var c1=d.querySelector('.chap.c1');
  if(c1){gsap.from(c1.querySelectorAll('.mask>span'),{yPercent:105,duration:1,stagger:.1,ease:'power3.out',delay:.15});
    gsap.from(c1.querySelectorAll('.num,.lead,.row'),{y:30,duration:.9,stagger:.08,ease:'power3.out',delay:.35});}
  gsap.from('.story canvas',{scale:1.08,duration:1.6,ease:'power3.out'});
}
if(!loader)introHero();

/* ---------- frame sequence story ---------- */
var story=d.querySelector('.story');
if(story&&hasG&&!RM){
  var cv=story.querySelector('canvas'),ctx=cv.getContext('2d');
  var mob=w.matchMedia('(max-width: 767px)').matches;
  var N=mob?80:150,dir=mob?'m':'d',imgs=new Array(N),cur=-1,want=0;
  function src(i){return '/assets/frames/'+dir+'/f'+String(i+1).padStart(3,'0')+'.webp';}
  function load(i){if(imgs[i])return imgs[i];var im=new Image();im.decoding='async';im.src=src(i);im.onload=function(){if(i===want)draw(i,true);};imgs[i]=im;return im;}
  function size(){var r=Math.min(w.devicePixelRatio||1,2);cv.width=Math.round(cv.clientWidth*r);cv.height=Math.round(cv.clientHeight*r);cur=-1;draw(want,true);}
  function nearest(i){for(var k=0;k<N;k++){var a=imgs[i-k],b=imgs[i+k];if(a&&a.complete&&a.naturalWidth)return a;if(b&&b.complete&&b.naturalWidth)return b;}return null;}
  function draw(i,force){
    want=i;if(i===cur&&!force)return;
    var im=imgs[i]&&imgs[i].complete&&imgs[i].naturalWidth?imgs[i]:nearest(i);if(!im)return;
    cur=i;var cw=cv.width,ch=cv.height,iw=im.naturalWidth,ih=im.naturalHeight;
    var s=Math.max(cw/iw,ch/ih),dw=iw*s,dh=ih*s;
    ctx.fillStyle='#050d1a';ctx.fillRect(0,0,cw,ch);
    ctx.drawImage(im,(cw-dw)/2,(ch-dh)/2,dw,dh);
  }
  load(0);
  // load in order: first 20 now, rest in idle chunks
  for(var i=1;i<20&&i<N;i++)load(i);
  var nx=20;(function more(){if(nx>=N)return;for(var k=0;k<10&&nx<N;k++,nx++)load(nx);setTimeout(more,60);})();
  w.addEventListener('resize',size);size();

  var chaps=story.querySelectorAll('.chap'),bars=story.querySelectorAll('.prog i b');
  gsap.set([chaps[1],chaps[2],chaps[3]],{autoAlpha:0});
  var st={f:0};
  var tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:story,start:'top top',end:'+=420%',scrub:.6,pin:'.story .stage',anticipatePin:1,
    onUpdate:function(self){var p=self.progress;bars.forEach(function(b,ix){var seg=Math.min(Math.max((p-ix/4)*4,0),1);b.style.transform='scaleY('+seg+')';});}}});
  tl.to(st,{f:N-1,duration:10,onUpdate:function(){draw(Math.round(st.f));}},0);
  // chapter 1 out
  tl.to(chaps[0],{autoAlpha:0,y:-60,duration:1},1.4);
  // chapter 2
  tl.fromTo(chaps[1],{autoAlpha:0,y:60},{autoAlpha:1,y:0,duration:1},3.0);
  tl.fromTo(chaps[1].querySelectorAll('.callout'),{autoAlpha:0,scale:.8},{autoAlpha:1,scale:1,duration:.6,stagger:.2},3.4);
  tl.to(chaps[1],{autoAlpha:0,y:-60,duration:1},5.3);
  // chapter 3
  tl.fromTo(chaps[2],{autoAlpha:0,y:60},{autoAlpha:1,y:0,duration:1},6.2);
  tl.to(chaps[2],{autoAlpha:0,y:-60,duration:.8},7.9);
  // chapter 4
  tl.fromTo(chaps[3],{autoAlpha:0,y:60},{autoAlpha:1,y:0,duration:.9},8.6);
  tl.to({},{duration:.6},10);
  var hint=story.querySelector('.scroll-hint');if(hint)tl.to(hint,{autoAlpha:0,duration:.5},0.3);
}

if(hasG&&!RM){
  /* ---------- masked headline reveals ---------- */
  d.querySelectorAll('[data-split]').forEach(function(el){
    gsap.from(el.querySelectorAll('.mask>span'),{yPercent:110,duration:1,ease:'power3.out',stagger:.08,scrollTrigger:{trigger:el,start:'top 85%'}});
  });
  /* ---------- simple reveals ---------- */
  ScrollTrigger.batch('.reveal',{start:'top 88%',once:true,onEnter:function(b){gsap.to(b,{opacity:1,y:0,duration:.9,ease:'power3.out',stagger:.08,overwrite:'auto'});}});
  /* ---------- text light-up ---------- */
  d.querySelectorAll('.lightup').forEach(function(el){
    var full=el.textContent.trim(),words=full.split(/\s+/);
    el.innerHTML='<span class="vh">'+full+'</span>'+words.map(function(x){return '<span class="w" aria-hidden="true">'+x+'</span>';}).join(' ');
    gsap.fromTo(el.querySelectorAll('.w'),{opacity:.38},{opacity:1,stagger:.1,ease:'none',scrollTrigger:{trigger:el,start:'top 80%',end:'bottom 45%',scrub:true}});
  });
  /* ---------- counters ---------- */
  d.querySelectorAll('[data-count]').forEach(function(el){
    var to=+el.dataset.count,suf=el.dataset.suffix||'',o={v:0};
    el.textContent='0'+suf;
    ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:function(){gsap.to(o,{v:to,duration:1.6,ease:'power2.out',onUpdate:function(){el.textContent=Math.round(o.v)+suf;}});}});
  });
  /* ---------- horizontal rail on desktop ---------- */
  var mm=gsap.matchMedia();
  mm.add('(min-width: 961px) and (pointer: fine)',function(){
    var pin=d.querySelector('.hz-pin');if(!pin)return;
    var rail=pin.querySelector('.rail');
    function dist(){return Math.max(0,rail.scrollWidth-rail.clientWidth);}
    gsap.to(rail,{x:function(){return -dist();},ease:'none',scrollTrigger:{trigger:pin,start:'top top',end:function(){return '+='+dist();},pin:true,scrub:.6,invalidateOnRefresh:true}});
  });
  /* ---------- page hero parallax ---------- */
  var bg=d.querySelector('.phero .bgimg');
  if(bg)gsap.to(bg,{yPercent:18,ease:'none',scrollTrigger:{trigger:'.phero',start:'top top',end:'bottom top',scrub:true}});
  w.addEventListener('load',function(){ScrollTrigger.refresh();});
  /* safety: never leave reveals hidden above the viewport (anchor jumps, fast scroll) */
  ScrollTrigger.addEventListener('refresh',function(){d.querySelectorAll('.reveal').forEach(function(el){if(el.getBoundingClientRect().top<w.innerHeight&&getComputedStyle(el).opacity==='0')gsap.to(el,{opacity:1,y:0,duration:.6,ease:'power3.out'});});});
  if(d.fonts&&d.fonts.ready)d.fonts.ready.then(function(){ScrollTrigger.refresh();});
}

/* ---------- card glow (desktop) ---------- */
if(w.matchMedia('(pointer: fine)').matches){
  d.querySelectorAll('.card').forEach(function(c){
    var g=d.createElement('span');g.className='glow';g.setAttribute('aria-hidden','true');c.appendChild(g);
    c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();g.style.left=(e.clientX-r.left)+'px';g.style.top=(e.clientY-r.top)+'px';});
  });
}

/* ---------- click-to-play videos ---------- */
d.querySelectorAll('.vid').forEach(function(v){
  var b=v.querySelector('.play button'),vd=v.querySelector('video');if(!b||!vd)return;
  b.addEventListener('click',function(){vd.controls=true;vd.play();v.querySelector('.play').remove();});
});
/* only one video plays at a time */
d.addEventListener('play',function(e){d.querySelectorAll('video').forEach(function(x){if(x!==e.target)x.pause();});},true);

/* floating WhatsApp hides while the hero's own buttons are on screen */
var fwa=d.querySelector('.fwa');
if(fwa&&story){var fw=function(){fwa.classList.toggle('off',w.scrollY<w.innerHeight*.6);};w.addEventListener('scroll',fw,{passive:true});fw();}
/* ---------- back/forward cache ---------- */
w.addEventListener('pageshow',function(e){if(e.persisted){d.body.classList.remove('menu-open');if(lenis)lenis.start();if(hasG)ScrollTrigger.refresh();}});
})();
