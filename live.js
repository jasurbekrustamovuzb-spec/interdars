/* InterDars — Jonli viktorina (Kahoot uslubi). Supabase Realtime Broadcast orqali ishlaydi. */
(function(){
'use strict';
if(window.LiveQuiz)return;
var LSH='idLiveHost',LSP='idLivePlayer',LSF='idLiveProf',MAXP=200,STALE=3*3600*1000;
var SHP=['▲','◆','●','■'];
/* [emoji, nom, gradient, guruh] — doimiy tartib: faqat oxiriga qo‘shing */
var AV=[
['👩‍🔬','Mariya Kyuri','#FF6FB1,#8A63F5','f'],['👩‍💻','Ada Lavleys','#27C99A,#4B6BFF','f'],['👩‍🚀','Valentina Tereshkova','#FF8A5B,#FF3B5C','f'],['🧙‍♀️','Donishmand ona','#8A63F5,#4B6BFF','f'],
['🦸‍♀️','Super olima','#FF3B5C,#FFB400','f'],['👸','Nodira begim','#FFB400,#FF6FB1','f'],['🦝','Qiziquvchan rakun','#1AA9CC,#27C99A','f'],['👩‍🏫','Ustoza','#4B6BFF,#27C9E6','f'],
['👩‍⚕️','Tabiba','#27C99A,#1AA9CC','f'],['🕵️‍♀️','Izlanuvchi','#6B4BD6,#2D2A7A','f'],['👩‍🎨','Ijodkor','#FF8A5B,#FFC53D','f'],['🐱','Mushukcha','#27C9E6,#4B6BFF','f'],
['👨‍🔬','Eynshteyn','#4B6BFF,#8A63F5','m'],['🧙‍♂️','Donishmand ota','#6B4BD6,#27C9E6','m'],['👨‍🚀','Gagarin','#FF8A5B,#FF3B5C','m'],['🦸‍♂️','Super olim','#FF3B5C,#4B6BFF','m'],
['🤴','Mirzo Ulug‘bek','#FFB400,#FF3B5C','m'],['👨‍⚕️','Ibn Sino','#27C99A,#4B6BFF','m'],['👨‍🏫','Al-Xorazmiy','#1AA9CC,#4B6BFF','m'],['🥷','Sirli dono','#2D2A7A,#6B4BD6','m'],
['🧸','Ayiqcha','#8A63F5,#FF6FB1','m'],['👨‍💻','Dasturchi','#27C99A,#27C9E6','m'],['🕵️‍♂️','Tadqiqotchi','#6B4BD6,#FF3B5C','m'],['👨‍🎨','Rassom','#FF8A5B,#FFC53D','m'],
['🦉','Boyqush','#8A63F5,#4B6BFF','a'],['🐘','Fil','#1AA9CC,#6B4BD6','a'],['🦊','Tulki','#FF8A5B,#FFB400','a'],['🐬','Delfin','#27C9E6,#4B6BFF','a'],
['🦅','Burgut','#FFB400,#FF3B5C','a'],['🐢','Toshbaqa','#27C99A,#1AA9CC','a'],['🦁','Sher','#FFC53D,#FF6F61','a'],['🐼','Panda','#4B6BFF,#2D2A7A','a'],
['🤖','Robot','#27C9E6,#8A63F5','a'],['👽','Mehmon','#27C99A,#6B4BD6','a'],
['🐕','Doge','#FFD95E,#F2A516','a','/media/meme-doge.jpg'],['😾','Grumpy Cat','#8A63F5,#4B6BFF','a','/media/meme-grumpy-cat.jpg'],['🦉','O RLY?','#27C99A,#1AA9CC','a','/media/meme-orly.jpg'],
['🐹','Yumaloq xomyak','#FF8A5B,#FFB400','a'],['🦦','Suvsar','#27C9E6,#4B6BFF','a'],['🐼','Qizil panda','#FF6FB1,#8A63F5','a'],['🐈','Kulib turgan mushuk','#27C99A,#4B6BFF','a'],['🐨','Koala','#6B4BD6,#27C9E6','a'],['🦄','Yakkashox','#FF6FB1,#8A63F5','a']];
var PFAV=[0,1,2,3,4,5,8,9,10,12,13,14,15,16,17,18,21,22,24,25,26,27,29,31,34,35,36,37,38,39,40,41];

/* ===== yordamchilar ===== */
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ls(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function lsDel(k){try{localStorage.removeItem(k)}catch(e){}}
function fmt(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ')}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function uinfo(){return ls('idUser')||{}}
function rid(){var s='',c='abcdefghjkmnpqrstuvwxyz23456789';for(var k=0;k<10;k++)s+=c.charAt(Math.floor(Math.random()*c.length));return s}
function pinFmt(p){return p.slice(0,3)+' '+p.slice(3)}
function randAv(){return PFAV[Math.floor(Math.random()*PFAV.length)]}
function cleanName(s,d){s=String(s||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,20);return s||d||'Ishtirokchi'}
function av(a,sz){var d=AV[a]||AV[0];return '<span class="jq-av" style="--s:'+(sz||56)+'px;background:linear-gradient(135deg,'+d[2]+')">'+(d[4]?'<img src="'+d[4]+'" alt="" loading="lazy">':d[0])+'</span>'}
function say(m){var t=$('#jqtoast');if(!t){t=document.createElement('div');t.id='jqtoast';t.className='jq-toast';document.body.appendChild(t)}t.textContent=m;t.classList.add('on');clearTimeout(say.t);say.t=setTimeout(function(){t.classList.remove('on')},2800)}
function pulse(el){if(!el)return;el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse')}
function after(ms,fn){var t=setTimeout(fn,ms);TM.push(t);return t}
var TM=[],IV=[];

/* ===== tovush ===== */
var AC=null,SND=true;
function ac(){try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){}return AC}
function tone(f,d,ty,v,at){if(!SND)return;var c=ac();if(!c)return;try{var t=c.currentTime+(at||0),o=c.createOscillator(),g=c.createGain();o.type=ty||'sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v||.08,t+.02);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+d+.05)}catch(e){}}
var S={tick:function(){tone(900,.06,'square',.03)},go:function(){tone(520,.12,'triangle',.09);tone(780,.2,'triangle',.09,.12)},
ok:function(){tone(660,.12,'triangle',.1);tone(880,.12,'triangle',.1,.1);tone(1320,.25,'triangle',.1,.2)},no:function(){tone(220,.25,'sawtooth',.06);tone(160,.35,'sawtooth',.06,.2)},
pop:function(){tone(700,.08,'sine',.06)},drum:function(){for(var k=0;k<14;k++)tone(110+k*3,.07,'triangle',.07,k*.09)},
fan:function(){[523,659,784,1046,784,1046,1318].forEach(function(f,k){tone(f,.28,'triangle',.1,k*.13)})},boom:function(){tone(90,.4,'sawtooth',.1)}};
document.addEventListener('pointerdown',function(){if(H||P)ac()},{passive:true});

/* ===== effektlar (konfetti, salyut) ===== */
var FX={c:null,x:null,p:[],on:false,d:1};
var CONF=['#FF3B5C','#FFC53D','#27C99A','#4B6BFF','#8A63F5','#27C9E6','#ffffff'];
function fxSize(){if(!FX.c)return;FX.d=Math.min(2,window.devicePixelRatio||1);FX.c.width=innerWidth*FX.d;FX.c.height=innerHeight*FX.d}
function fxAdd(p){FX.p.push(p);if(!FX.on){FX.on=true;requestAnimationFrame(fxLoop)}}
function fxLoop(){var x=FX.x;if(!x){FX.on=false;return}x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,FX.c.width,FX.c.height);x.scale(FX.d,FX.d);
  FX.p=FX.p.filter(function(p){p.life--;if(p.life<=0)return false;p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.vx*=p.fr||1;p.rot+=p.vr;
    x.globalAlpha=Math.min(1,p.life/(p.fade||30));x.fillStyle=p.col;
    if(p.sp){x.beginPath();x.arc(p.x,p.y,p.r,0,6.3);x.fill()}else{x.save();x.translate(p.x,p.y);x.rotate(p.rot);x.fillRect(-p.r,-p.r/2,p.r*2,p.r);x.restore()}
    return p.y<innerHeight+40});
  x.globalAlpha=1;if(FX.p.length)requestAnimationFrame(fxLoop);else{FX.on=false;x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,FX.c.width,FX.c.height)}}
function confetti(x,y,n,spread,up){for(var k=0;k<n;k++){var a=-Math.PI/2+(Math.random()-.5)*(spread||2.4),s=(up||9)*(.5+Math.random());fxAdd({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:.22,r:3+Math.random()*4,rot:Math.random()*6,vr:(Math.random()-.5)*.4,col:CONF[k%CONF.length],life:90+Math.random()*70,fade:30,fr:.99})}}
function rainConf(ms){var t0=Date.now(),iv=setInterval(function(){if(Date.now()-t0>ms||!FX.x){clearInterval(iv);return}for(var k=0;k<5;k++)fxAdd({x:Math.random()*innerWidth,y:-10,vx:(Math.random()-.5)*2,vy:2+Math.random()*3,g:.03,r:3+Math.random()*4,rot:Math.random()*6,vr:(Math.random()-.5)*.3,col:CONF[k%CONF.length],life:230,fade:30})},90);IV.push(iv)}
function firework(x,y){var col=CONF[Math.floor(Math.random()*6)];for(var k=0;k<46;k++){var a=k/46*6.283,s=2+Math.random()*4.5;fxAdd({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:.06,r:2.2,col:col,sp:1,life:60+Math.random()*25,fade:30,fr:.97,rot:0,vr:0})}}
function fxStop(){TM.forEach(clearTimeout);TM=[];IV.forEach(clearInterval);IV=[];FX.p=[]}
function centerOf(el){if(!el)return{x:innerWidth/2,y:innerHeight/2};var r=el.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}}

/* ===== tarmoq: Supabase Realtime Broadcast ===== */
var NET={ch:null,ok:false};
function netOpen(pin,onMsg,onSt){netClose();var sb=window.sb;if(!sb||!sb.channel)return false;
  var ch=sb.channel('idlive-'+pin,{config:{broadcast:{self:false,ack:false}}});
  ch.on('broadcast',{event:'m'},function(e){try{if(NET.ch===ch)onMsg(e.payload||{})}catch(err){console.warn('live',err)}});
  ch.subscribe(function(s){if(NET.ch!==ch)return;NET.ok=s==='SUBSCRIBED';onSt(s)});NET.ch=ch;return true}
function netClose(delay){var ch=NET.ch;NET.ch=null;NET.ok=false;if(!ch)return;setTimeout(function(){try{window.sb.removeChannel(ch)}catch(e){}},delay||0)}
function send(p){var ch=NET.ch;if(!ch)return;try{var r=ch.send({type:'broadcast',event:'m',payload:p});if(r&&r.catch)r.catch(function(){})}catch(e){}}

/* ===== qo‘riqlash: orqaga tugmasi, yangilash, chiqish ===== */
var guard=false;
function guardOn(){if(guard)return;guard=true;try{if(!(history.state&&history.state.lv))history.pushState({lv:1},'',location.href)}catch(e){}
  window.addEventListener('popstate',onPop);window.addEventListener('beforeunload',onUnload);document.addEventListener('keydown',onKey)}
function guardOff(){if(!guard)return;guard=false;window.removeEventListener('popstate',onPop);window.removeEventListener('beforeunload',onUnload);document.removeEventListener('keydown',onKey);
  try{if(history.state&&history.state.lv)history.back()}catch(e){}}
function onPop(){if(!guard)return;try{history.pushState({lv:1},'',location.href)}catch(e){}askExit()}
function onUnload(e){if(!guard)return;e.preventDefault();e.returnValue='';return ''}
function onKey(e){if(e.key==='Escape'){if($('#jqmod')&&!$('#jqmod').hidden)modalClose();else askExit()}}
var WL=null;
function wake(){try{if(navigator.wakeLock&&!WL)navigator.wakeLock.request('screen').then(function(l){WL=l;l.addEventListener('release',function(){WL=null})}).catch(function(){})}catch(e){}}
document.addEventListener('visibilitychange',function(){if(document.hidden||!(H||P))return;wake();if(P&&P.got)pHello()});

/* ===== overlay ===== */
var R=null,M=null,CSS_ON=false;
function mount(){
  if(!CSS_ON){var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);var ux=document.createElement('style');ux.textContent='.jq-av img{width:100%;height:100%;border-radius:50%;object-fit:cover}.jq-pickhead{display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left}.jq-credit{font-size:10px;line-height:1.35;opacity:.75}.jq-credit a{color:#fff;text-decoration:underline}.jq .jq-set{grid-template-columns:minmax(0,1fr);width:100%;min-width:0}.jq .jq-set .rw{width:100%;min-width:0}.jq .jq-set>.sw{width:100%;min-width:0}.jq .sw{width:100%;height:auto;min-height:58px;flex:none;position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px}.jq .sw>span{display:block;flex:1;min-width:0;line-height:1.3}.jq .sw i{position:relative;left:auto;top:auto;width:46px;height:26px;display:block;flex:none;border-radius:99px;background:rgba(255,255,255,.25);box-shadow:none}.jq .sw i::after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s}.jq .sw.on i{background:#27C99A}.jq .sw.on i::after{transform:translateX(20px)}.sw small{line-height:1.35;margin-top:4px}.jq-set{gap:12px}.jq-set .rw{gap:8px}.jq-set .seg button{min-height:40px;line-height:1.15}.jq-avg{grid-template-columns:repeat(auto-fill,minmax(52px,1fr))}@media(max-width:560px){.jq-mod{align-items:start;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px))}.jq-mb{width:100%;max-height:calc(100dvh - 20px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px));padding:16px;gap:12px;border-radius:22px}.jq-mb h3{font-size:24px}.jq-btns{gap:8px}.jq-btn{padding:10px 16px}.jq-avg{grid-template-columns:repeat(auto-fill,minmax(48px,1fr));max-height:32vh}.jq-avg button{padding:2px}.jq-credit{line-height:1.35}}';document.head.appendChild(ux);CSS_ON=true}
  if(R)return;R=document.createElement('div');R.className='jq';R.hidden=true;R.setAttribute('role','dialog');R.setAttribute('aria-label','Jonli viktorina');
  R.innerHTML='<div class="jq-bg"></div><div class="jq-main" id="jqm"></div><canvas class="jq-fx"></canvas><div class="jq-mod" id="jqmod" hidden></div><div class="jq-conn" id="jqconn" hidden>⚠️ Aloqa uzildi — qayta ulanmoqda…</div>';
  document.body.appendChild(R);M=$('#jqm');FX.c=$('.jq-fx',R);FX.x=FX.c.getContext('2d');fxSize();window.addEventListener('resize',fxSize);
  R.addEventListener('click',onClick);R.addEventListener('input',function(e){if(e.target.id==='jqname')E.n=e.target.value})}
function openOv(){mount();R.hidden=false;document.body.style.overflow='hidden';guardOn();wake()}
function closeOv(){if(R)R.hidden=true;document.body.style.overflow='';guardOff();fxStop()}
function view(html,cls){M.className='jq-main '+(cls||'');M.innerHTML=html}
function modal(html,k){var m=$('#jqmod');m.dataset.k=k||'';m.innerHTML='<div class="jq-mb">'+html+'</div>';m.hidden=false}
function modalClose(){var m=$('#jqmod');if(m){m.hidden=true;m.innerHTML='';m.dataset.k=''}}
function conn(bad){var c=$('#jqconn');if(c)c.hidden=!bad}
function topbar(extra){return '<div class="jq-top"><button class="jq-ib" data-act="exit" aria-label="Chiqish">✕</button><span class="jq-pill"><i></i>JONLI</span>'+extra+'<span class="sp"></span><button class="jq-ib" data-act="snd" id="jqsnd" aria-label="Tovush">'+(SND?'🔊':'🔇')+'</button></div>'}
function askExit(){
  if(!(H||P))return;
  if((H&&H.ph==='fin')||(P&&P.ph==='fin')){leave();return}
  if($('#jqmod').dataset.k==='exit')return;
  modal('<div class="em">⚠️</div><h3>'+(H?'Jonli testni tugatasizmi?':'Jonli testdan chiqasizmi?')+'</h3><p>'+(H?'Test barcha ishtirokchilar uchun to‘xtaydi.':'Hozirgi natijangiz yo‘qoladi.')+'</p><div class="jq-btns"><button class="jq-btn ghost" data-act="mclose">Qolish</button><button class="jq-btn bad" data-act="exitok">'+(H?'Tugatish':'Chiqish')+'</button></div>','exit')}
function leave(msg){
  if(H){send({t:'end'});clearInterval(HT);H=null;lsDel(LSH)}
  if(P){send({t:'bye',p:P.pid});clearInterval(P.hl);clearInterval(PT);P=null;lsDel(LSP)}
  netClose(350);modalClose();closeOv();if(msg)say(msg)}
function setSnd(v){SND=v;var p=ls(LSF)||{};p.snd=v;lsSet(LSF,p);if(H){H.set.snd=v;persistH()}var b=$('#jqsnd');if(b)b.textContent=v?'🔊':'🔇'}

/* ===== umumiy ko‘rinish bo‘laklari ===== */
function syncGrid(box,list,opt){opt=opt||{};if(!box)return;var have={};$$('[data-i]',box).forEach(function(el){have[el.dataset.i]=el});var seen={};
  list.forEach(function(r){var k=String(r[0]);seen[k]=1;var sig=r[1]+'|'+r[2],el=have[k];
    if(el&&el.dataset.sig===sig){el.classList.toggle('me',opt.me===r[0]);return}
    var n=document.createElement('div');n.className='jq-pt'+(opt.me===r[0]?' me':'')+(el?'':' pop');n.dataset.i=k;n.dataset.sig=sig;
    n.innerHTML=av(r[2],opt.sz||60)+'<b>'+esc(r[1])+'</b>'+(opt.kick?'<button class="jq-kick" data-act="kick" data-v="'+k+'" aria-label="Chiqarish">✕</button>':'');
    if(el)box.replaceChild(n,el);else box.appendChild(n)});
  Object.keys(have).forEach(function(k){if(!seen[k])have[k].remove()})}
function setGridSize(box,n){if(box)box.style.setProperty('--ts',(n<=12?150:n<=30?122:n<=60?100:84)+'px')}
function optsHTML(q,mode,d){var n=q.a.length,tot=0;if(d)d.forEach(function(x){tot+=x});
  return '<div class="jq-opts n'+n+'">'+q.a.map(function(t,k){var cls='jq-o c'+k+(mode==='rev'?(k===q.c?' ok':' no'):'');
    return '<div class="'+cls+'"><u>'+SHP[k]+'</u><span>'+esc(t)+'</span>'+(mode==='rev'?'<em class="jq-cnt">'+(d[k]||0)+'</em><i class="jq-mark">'+(k===q.c?'✓':'✕')+'</i><s style="--w:'+(tot?Math.round((d[k]||0)/tot*100):0)+'%"></s>':'')+'</div>'}).join('')+'</div>'}
function ringHTML(sec){return '<div class="jq-ring" id="jqring"><svg viewBox="0 0 54 54"><circle cx="27" cy="27" r="23" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="5"/><circle id="jqrc" cx="27" cy="27" r="23" fill="none" stroke="#FFC53D" stroke-width="5" stroke-linecap="round" stroke-dasharray="144.5" stroke-dashoffset="0"/></svg><b id="jqtm">'+sec+'</b></div>'}
function ringUpdate(rem,dur){var c=$('#jqrc'),b=$('#jqtm'),r=$('#jqring');if(!c)return;var s=Math.max(0,Math.ceil(rem/1000));c.style.strokeDashoffset=String(144.5*(1-Math.max(0,rem)/Math.max(1,dur)));
  if(b.textContent!==String(s)){b.textContent=s;if(s<=5&&s>0)S.tick()}if(r)r.classList.toggle('low',rem<=5000)}
function rowsHTML(top,max,small){return top.map(function(r,k){var rk=r[5],pr=r[6],mv=pr&&pr>rk?'<span class="mv up">▲'+(pr-rk)+'</span>':pr&&pr<rk?'<span class="mv dn">▼'+(rk-pr)+'</span>':'';
  return '<div class="jq-row'+(small?' sm':'')+'" style="--d:'+(k*.14)+'s"><span class="rk">'+rk+'</span>'+av(r[2],small?44:58)+'<div class="mid"><b>'+esc(r[1])+'</b><div class="tr"><i style="--w:'+Math.max(6,Math.round(r[3]/Math.max(1,max)*100))+'%"></i></div></div><div class="rt"><em>'+fmt(r[3])+'</em>'+(r[4]?'<span class="dl">+'+fmt(r[4])+'</span>':'')+mv+'</div></div>'}).join('')}
function podiumHTML(all){
  var top=all.slice(0,3),rest=all.slice(3),n=top.length,order=n>=3?[1,0,2]:n===2?[1,0]:[0],H3={0:1,1:.75,2:.56};
  var dl={};for(var k=n-1,j=0;k>=0;k--,j++)dl[k]=.6+j*1.8+(k===0&&n>1?.5:0);
  var cols=order.map(function(k){var r=top[k];return '<div class="jq-pc r'+(k+1)+'" style="--d:'+dl[k]+'s;--k:'+H3[k]+'">'+(k===0?'<div class="jq-rays"></div>':'')+'<div class="jq-pwho">'+(k===0?'<span class="crown">👑</span>':'')+'<span class="pav">'+av(r[2],k===0?96:76)+'</span><b>'+esc(r[1])+'</b><em>'+fmt(r[3])+'</em></div><div class="jq-pbar"><span>'+(k+1)+'</span></div></div>'}).join('');
  var rs=rest.length?'<div class="jq-rest" style="--d:'+(dl[0]+1.2)+'s">'+rest.slice(0,60).map(function(r,k){return '<div class="rr"><span class="rk">'+(k+4)+'</span>'+av(r[2],34)+'<b>'+esc(r[1])+'</b><em>'+fmt(r[3])+'</em></div>'}).join('')+'</div>':'';
  return '<div class="jq-pods">'+cols+'</div>'+rs}
function celebrate(all){
  fxStop();var n=Math.min(3,all.length),t=.6,seq=[];for(var k=n-1,j=0;k>=0;k--,j++)seq.push({k:k,at:(.6+j*1.8+(k===0&&n>1?.5:0)+.9)*1000});
  after(100,S.drum);
  seq.forEach(function(s){after(s.at,function(){var c=centerOf($('.jq-pc.r'+(s.k+1)+' .pav',R));S.pop();if(s.k===0){S.fan();S.boom();firework(c.x,c.y-40);confetti(innerWidth*.1,innerHeight,70,1.6,15);confetti(innerWidth*.9,innerHeight,70,1.6,15);
    after(500,function(){firework(innerWidth*.25,innerHeight*.3)});after(900,function(){firework(innerWidth*.75,innerHeight*.28)});after(1400,function(){firework(innerWidth*.5,innerHeight*.18)});rainConf(7000)}else confetti(c.x,c.y,36,2.8,8)});
    if(s.k===1&&n>=3)after(s.at+1000-1700,S.drum)})}

/* ================= USTOZ (HOST) ================= */
var H=null,HT=null,hbT=0,persT=0;
function defSet(){return{time:20,gap:3,lim:0,shufQ:true,shufA:true,board:true,late:true,snd:true}}
function persistH(now){if(!H)return;clearTimeout(persT);if(now){H.ts=Date.now();lsSet(LSH,H)}else persT=setTimeout(function(){if(H){H.ts=Date.now();lsSet(LSH,H)}},300)}
function host(l){
  if(!l||!l.qs||!l.qs.length){say('Savollar topilmadi');return false}
  if(!window.sb||!window.sb.channel){say('Jonli rejim uchun internet kerak');return false}
  if(H||P){openOv();return true}
  var pin;pin=String(100000+Math.floor(Math.random()*900000));
  H={v:1,pin:pin,lid:l.id,title:l.title,src:l.qs.map(function(x){return{q:x.q,a:x.a.slice(),c:x.c}}),set:defSet(),ph:'lobby',qi:-1,t0:0,dur:0,pl:{},n:0,qs:[],ts:Date.now(),lock:false};
  H.set.snd=(ls(LSF)||{}).snd!==false;hBoot();return true}
function hBoot(){SND=H.set.snd;openOv();
  netOpen(H.pin,hMsg,function(s){var bad=s==='CHANNEL_ERROR'||s==='TIMED_OUT'||s==='CLOSED';conn(bad);if(s==='SUBSCRIBED')bcast()});
  persistH(1);hRender();clearInterval(HT);HT=setInterval(hTick,150)}
function hResume(h){H=h;hBoot()}
function roster(){return Object.keys(H.pl).map(function(k){return H.pl[k]}).filter(function(p){return !p.gone}).sort(function(a,b){return a.i-b.i}).map(function(p){return[p.i,p.n,p.a]})}
function ranked(){return Object.keys(H.pl).map(function(k){return H.pl[k]}).sort(function(a,b){return b.s-a.s||a.i-b.i})}
function snap(pid){
  var n=Date.now(),o={ph:H.ph,ttl:H.title,nq:H.qs.length||H.src.length,qi:H.qi,dur:H.dur,rem:Math.max(0,H.t0+H.dur-n),lock:H.lock||(!H.set.late&&H.ph!=='lobby')};
  if(H.ph==='lobby')o.ros=roster();
  if(H.ph==='q'){var q=H.qs[H.qi];o.q=q.q;o.a=q.a;if(pid&&H.pl[pid]&&H.pl[pid].ans)o.my=H.pl[pid].ans.c}
  if(H.ph==='rev'){var r=H.qs[H.qi];o.q=r.q;o.a=r.a;o.c=r.c;o.dist=H.dist;o.res=H.res;o.fast=H.fast}
  if(H.ph==='board'){o.top=H.top;o.res=H.res}
  if(H.ph==='fin'){o.all=H.fin}
  return o}
function bcast(){if(H)send(Object.assign({t:'s'},snap()))}
var rosT=0;
function rosDirty(){clearTimeout(rosT);rosT=setTimeout(function(){if(!H)return;if(H.ph==='lobby')send({t:'r',l:roster()});hLobbyUpdate()},130)}
function hMsg(m){
  if(!H||!m)return;
  if(m.t==='hi'){
    var id=String(m.p||'');if(id.length<6||id.length>20)return;
    var p=H.pl[id],nm=cleanName(m.n),a=(+m.a>=0&&+m.a<AV.length)?+m.a:0;
    if(!p){
      if(H.lock&&H.ph==='lobby'||H.ph!=='lobby'&&!H.set.late){send({t:'deny',to:id,why:'late'});return}
      if(Object.keys(H.pl).length>=MAXP){send({t:'deny',to:id,why:'full'});return}
      p=H.pl[id]={i:++H.n,n:nm,a:a,s:0,ok:0,st:0,ans:null,pr:0,rk:0,f:2,d:0};if(H.ph==='lobby')S.pop();rosDirty()
    }else{if(p.n!==nm||p.a!==a){p.n=nm;p.a=a;rosDirty()}if(p.gone){p.gone=false;rosDirty()}}
    send(Object.assign({t:'s',to:id,you:p.i},snap(id)));persistH();
  }else if(m.t==='ans'){hAns(m)}
  else if(m.t==='bye'){var q=H.pl[m.p];if(q){if(H.ph==='lobby')delete H.pl[m.p];else q.gone=true;rosDirty();persistH();hQCount()}}}
function hAns(m){
  if(H.ph!=='q'||+m.qi!==H.qi)return;var p=H.pl[m.p];if(!p)return;var q=H.qs[H.qi],c=+m.c;if(!(c>=0&&c<q.a.length))return;
  if(!p.ans){p.ans={c:c,ms:Math.min(H.dur,Date.now()-H.t0)};persistH();hQCount();
    var live=Object.keys(H.pl).filter(function(k){return !H.pl[k].gone}),done=live.filter(function(k){return H.pl[k].ans}).length;
    if(live.length&&done>=live.length&&!H.early)H.early=Date.now()+700}
  send({t:'k',to:m.p,qi:H.qi})}
function hPrepare(){
  var qs=H.src.map(function(x){return{q:x.q,a:x.a.slice(),c:x.c}});
  if(H.set.shufQ)shuffle(qs);
  if(H.set.lim>0&&H.set.lim<qs.length)qs=qs.slice(0,H.set.lim);
  if(H.set.shufA)qs.forEach(function(q){var idx=q.a.map(function(_,i){return i});shuffle(idx);var c=idx.indexOf(q.c);q.a=idx.map(function(i){return q.a[i]});q.c=c});
  H.qs=qs}
function hStartGame(){
  if(!Object.keys(H.pl).length){say('Kamida 1 ishtirokchi kerak');return}
  hPrepare();H.qi=-1;Object.keys(H.pl).forEach(function(k){var p=H.pl[k];p.s=0;p.ok=0;p.st=0;p.ans=null;p.pr=0;p.rk=0});
  H.ph='count';H.t0=Date.now();H.dur=3000;H.early=0;persistH(1);bcast();hRender()}
function hQStart(){
  H.qi++;H.ph='q';H.t0=Date.now();H.dur=H.set.time*1000;H.early=0;Object.keys(H.pl).forEach(function(k){H.pl[k].ans=null});
  persistH(1);bcast();hRender();S.go()}
function hReveal(){
  if(H.ph!=='q')return;var q=H.qs[H.qi],dist=q.a.map(function(){return 0}),before=ranked();
  before.forEach(function(p,k){p.pr=k+1});
  before.forEach(function(p){var a=p.ans,pts=0,f=2;if(a){dist[a.c]++;if(a.c===q.c){f=1;pts=Math.round(1000*(1-Math.min(1,a.ms/H.dur)/2));p.ok++;p.st++}else{f=0;p.st=0}}else p.st=0;p.s+=pts;p.f=f;p.d=pts});
  var aft=ranked(),res={},fast=null,nok=0;
  aft.forEach(function(p,k){p.rk=k+1;res[p.i]=[p.f,p.d,p.s,k+1,p.pr,p.st];if(p.f===1){nok++;if(!fast||p.ans.ms<fast.ans.ms)fast=p}});
  H.dist=dist;H.res=res;H.nok=nok;H.fast=fast?[fast.n,fast.a,fast.d]:null;H.top=aft.slice(0,5).map(function(p){return[p.i,p.n,p.a,p.s,p.d,p.rk,p.pr]});
  H.ph='rev';H.t0=Date.now();H.dur=H.set.gap*1000;H.early=0;persistH(1);bcast();hRender()}
function hBoardGo(){H.ph='board';H.t0=Date.now();H.dur=H.set.gap*1000;persistH(1);bcast();hRender()}
function hFinal(){var l=ranked();H.fin=l.slice(0,MAXP).map(function(p){return[p.i,p.n,p.a,p.s,p.ok]});H.ph='fin';H.t0=Date.now();H.dur=0;persistH(1);bcast();hRender()}
function hAdvance(){if(H.ph==='rev'){if(H.qi>=H.qs.length-1)hFinal();else if(H.set.board)hBoardGo();else hQStart()}else if(H.ph==='board')hQStart()}
function hAgain(){H.ph='lobby';H.qi=-1;H.t0=0;H.dur=0;H.fin=null;Object.keys(H.pl).forEach(function(k){var p=H.pl[k];if(p.gone)delete H.pl[k];else{p.s=0;p.ok=0;p.st=0;p.ans=null}});fxStop();persistH(1);bcast();hRender()}
function hTick(){
  if(!H)return;var n=Date.now(),rem=H.t0+H.dur-n;
  if(H.ph==='count'){var s=Math.max(1,Math.ceil(rem/1000)),b=$('#jqbig');if(b&&b.dataset.n!==String(s)){b.dataset.n=s;b.textContent=s;pulse(b);S.tick()}if(rem<=0)hQStart()}
  else if(H.ph==='q'){ringUpdate(rem,H.dur);var tb=$('#jqtbar');if(tb)tb.style.setProperty('--w',(Math.max(0,rem)/H.dur*100)+'%');if(rem<=0||(H.early&&n>=H.early))hReveal()}
  else if((H.ph==='rev'||H.ph==='board')&&H.dur>0&&rem<=0)hAdvance();
  if(n-hbT>5000){hbT=n;send({t:'h',ph:H.ph,qi:H.qi})}}
function hQCount(){var el=$('#jqans');if(!el||!H)return;var live=Object.keys(H.pl).filter(function(k){return !H.pl[k].gone}),done=live.filter(function(k){return H.pl[k].ans}).length;el.innerHTML='<b>'+done+'</b><small>/ '+live.length+' javob</small>'}
function hRender(){fxStop();if(!H)return;modalClose();({lobby:hLobby,count:hCount,q:hQ,rev:hRev,board:hBoard,fin:hFin})[H.ph]()}
function joinUrl(){return location.origin+'/home#j='+H.pin}
function chipsHTML(){var s=H.set;return '<span>⏱ '+s.time+' s</span><span>'+(s.gap?'⏭ '+s.gap+' s':'⏭ qo‘lda')+'</span>'+(s.lim?'<span>🔢 '+s.lim+' savol</span>':'<span>🔢 hammasi ('+H.src.length+')</span>')+(s.shufQ?'<span>🔀 savollar</span>':'')+(s.shufA?'<span>🔀 javoblar</span>':'')+(s.board?'<span>📊 reyting</span>':'')}
function hLobby(){
  view(topbar('<b class="jq-ttl">'+esc(H.title)+'</b>')+'<div class="jq-lob"><section class="jq-card jq-jn"><small>QR kodni skanerlang — ismingizni kiriting va testga qo‘shiling</small><div class="jq-pinbig">'+pinFmt(H.pin)+'</div><div class="jq-qr" id="jqqr"><div class="jq-qrw">QR…</div></div><div class="jq-chips" id="jqchips">'+chipsHTML()+'</div><div class="jq-btns"><button class="jq-btn ghost" data-act="set">⚙ Sozlamalar</button><button class="jq-btn go" id="jqgo" data-act="start">▶ Boshlash</button></div></section>'
  +'<section class="jq-card jq-pls"><div class="jq-ph"><b>👥 <span id="jqcnt">0</span> ishtirokchi</b><button class="jq-lock" data-act="lock" id="jqlock"></button></div><div class="jq-grid" id="jqgrid"></div><div class="jq-empty" id="jqempty"><div class="bob"><span>🦉</span><span>🦊</span><span>🐬</span><span>🧙‍♀️</span></div><p>Ishtirokchilar kutilmoqda…<br><small>Telefondan QR kodni skanerlang yoki PIN kiriting</small></p></div></section></div>','host');
  hLobbyUpdate();qr(joinUrl())}
function hLobbyUpdate(){
  if(!H||H.ph!=='lobby')return;var l=roster(),g=$('#jqgrid');if(!g)return;setGridSize(g,l.length);syncGrid(g,l,{kick:true,sz:62});
  $('#jqcnt').textContent=l.length;$('#jqempty').style.display=l.length?'none':'flex';var b=$('#jqgo');if(b)b.disabled=!l.length;
  var k=$('#jqlock');if(k){k.textContent=H.lock?'🔒 Yopiq':'🔓 Ochiq';k.classList.toggle('on',!!H.lock)}var c=$('#jqchips');if(c)c.innerHTML=chipsHTML()}
var QRL=null;
function loadQR(cb){if(window.qrcode)return cb(true);var urls=['https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js','https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'],i=0;
  (function next(){if(window.qrcode)return cb(true);if(i>=urls.length)return cb(false);var s=document.createElement('script');s.src=urls[i++];s.onload=next;s.onerror=next;document.head.appendChild(s)})()}
function qr(text){loadQR(function(ok){var b=$('#jqqr');if(!b)return;if(!ok){b.innerHTML='<div class="jq-qrw small">'+esc(text)+'</div>';return}
  try{var q=window.qrcode(0,'M');q.addData(text);q.make();var n=q.getModuleCount(),d='';for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))d+='M'+c+' '+r+'h1v1h-1z';
    b.innerHTML='<div class="jq-qrw"><svg viewBox="-2 -2 '+(n+4)+' '+(n+4)+'" shape-rendering="crispEdges"><path d="'+d+'" fill="#1B2150"/></svg></div>'}catch(e){b.innerHTML='<div class="jq-qrw small">'+esc(text)+'</div>'}})}
function hSettings(){
  var s=H.set,tot=H.src.length;
  function seg(k,vals,lab){return '<div class="seg">'+vals.map(function(v){return '<button class="'+(s[k]===v?'on':'')+'" data-act="cfg" data-k="'+k+'" data-v="'+v+'">'+lab(v)+'</button>'}).join('')+'</div>'}
  function sw(k,t,d){return '<button class="sw'+(s[k]?' on':'')+'" data-act="cfg" data-k="'+k+'" data-v="'+(s[k]?0:1)+'"><span>'+t+(d?'<small>'+d+'</small>':'')+'</span><i></i></button>'}
  var lims=[5,10,15,20].filter(function(x){return x<tot});
  modal('<h3>⚙ Test sozlamalari</h3><div class="jq-set"><div class="rw"><b>⏱ Savolga javob berish vaqti</b>'+seg('time',[10,15,20,30,45,60],function(v){return v+' soniya'})+'</div><div class="rw"><b>⏭ Savollar orasidagi tanaffus</b>'+seg('gap',[3,5,8,0],function(v){return v?v+' soniya':'Qo‘lda'})+'</div>'
  +(lims.length?'<div class="rw"><b>🔢 Savollar soni</b>'+seg('lim',[0].concat(lims),function(v){return v?v+' ta':'Hammasi ('+tot+')'})+'</div>':'')
  +sw('shufQ','🔀 Savollar tartibini aralashtirish')+sw('shufA','🔀 Javoblar tartibini aralashtirish')+sw('board','📊 Savollardan keyin reyting jadvali','Jadval keyingi savoldan oldin ko‘rsatiladi')+sw('late','🚪 Test boshlanganidan keyin qo‘shilish','Boshlangan testga ham kirish mumkin')+sw('snd','🔊 Tovush')+'</div><div class="jq-btns"><button class="jq-btn go" data-act="mclose">Tayyor</button></div>','set')}
function hCount(){view(topbar('')+'<div class="jq-cd"><small>Tayyor bo‘ling!</small><div class="jq-big" id="jqbig" data-n="3">3</div><p>'+esc(H.title)+'</p></div>','host')}
function hHead(){return topbar('<b class="jq-chip">'+(H.qi+1)+' / '+H.qs.length+'</b><span class="jq-chip">PIN '+pinFmt(H.pin)+'</span>')}
function hQ(){var q=H.qs[H.qi];
  view(hHead()+'<div class="jq-tbar" id="jqtbar"><i></i></div><div class="jq-hq"><div class="jq-qbox">'+ringHTML(Math.ceil(H.dur/1000))+'<h1 class="jq-qt">'+esc(q.q)+'</h1><div class="jq-ans" id="jqans"></div></div>'+optsHTML(q,'q')+'<div class="jq-btns r"><button class="jq-btn ghost" data-act="skip">⏭ Tugatish</button></div></div>','host');hQCount();hTick()}
function hRev(){var q=H.qs[H.qi],tot=Object.keys(H.pl).length,f=H.fast;
  view(hHead()+'<div class="jq-hq"><div class="jq-qbox"><h1 class="jq-qt sm">'+esc(q.q)+'</h1></div>'+optsHTML(q,'rev',H.dist)+'<div class="jq-stats"><span>✅ <b>'+H.nok+'</b> / '+tot+' to‘g‘ri</span>'+(f?'<span>⚡ Eng tez: '+av(f[1],28)+' <b>'+esc(f[0])+'</b> +'+fmt(f[2])+'</span>':'')+'</div><div class="jq-btns r"><button class="jq-btn go" data-act="next">'+(H.qi>=H.qs.length-1?'🏁 Natijalar':'Keyingisi ⏭')+'</button></div></div>','host');
  if(H.nok)S.ok();else S.no();if(H.nok*2>=tot&&H.nok)confetti(innerWidth/2,innerHeight*.5,30)}
function hBoard(){var max=H.top.length?H.top[0][3]:1;
  view(hHead()+'<div class="jq-bd"><h2>🏆 Jonli reyting</h2><div class="jq-rows">'+rowsHTML(H.top,max)+'</div></div><div class="jq-btns r"><button class="jq-btn go" data-act="next">Keyingi savol ⏭</button></div>','host');S.pop()}
function hFin(){view(topbar('<b class="jq-ttl">'+esc(H.title)+' — yakun</b>')+'<div class="jq-fin">'+'<h2 class="jq-ft">🎉 G‘oliblar!</h2>'+podiumHTML(H.fin)+'</div><div class="jq-btns r"><button class="jq-btn ghost" data-act="csv">⬇ CSV</button><button class="jq-btn ghost" data-act="again">↻ Yana o‘ynash</button><button class="jq-btn go" data-act="exitok">Yopish</button></div>','host fin');celebrate(H.fin)}
function hCSV(){var rows=[['O‘rin','Ism','Ball','To‘g‘ri javoblar','Savollar']].concat(H.fin.map(function(r,k){return[k+1,r[1],r[3],r[4],H.qs.length]}));
  var csv='\ufeff'+rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"'}).join(',')}).join('\n');
  try{var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='jonli-natijalar.csv';document.body.appendChild(a);a.click();setTimeout(function(){a.remove()},500)}catch(e){say('Yuklab bo‘lmadi')}}

/* ================= ISHTIROKCHI (PLAYER) ================= */
var P=null,PT=null,E={n:'',a:0,g:'f'};
function join(pin){
  return new Promise(function(resolve){
    if(H||P){resolve('none');return}
    var prof=ls(LSF)||{},u=uinfo();LiveQuiz.err='';
    P={pin:pin,pid:rid(),n:prof.n||u.name||'',a:prof.a!=null?prof.a:randAv(),ph:'conn',max:4,probe:true,tot:0,my:-1};
    SND=prof.snd!==false;var me=P;
    me.done=function(r){if(me.fin)return;me.fin=true;if(r!=='ok'){clearInterval(me.hl);if(P===me){P=null;netClose()}}resolve(r)};
    me.fail=function(){me.done('none')};
    if(!prof.n){me.joining=true;openOv();E={n:me.n,a:me.a,g:AV[me.a]?AV[me.a][3]:'a'};pEditModal();return}
    pNet();setTimeout(function(){if(!me.got&&!me.fin)me.fail()},7000)})}
function pNet(){netOpen(P.pin,pMsg,function(s){var bad=s==='CHANNEL_ERROR'||s==='TIMED_OUT'||s==='CLOSED';conn(bad&&P&&P.got);if(s==='SUBSCRIBED'&&P)pLoop()})}
function pHello(){if(P)send({t:'hi',p:P.pid,n:P.n,a:P.a})}
function pLoop(){var me=P;clearInterval(me.hl);var k=0;pHello();me.hl=setInterval(function(){if(P!==me||me.got){clearInterval(me.hl);return}if(++k>=me.max){clearInterval(me.hl);me.fail&&me.fail();return}pHello()},800)}
function pResume(s){
  P={pin:s.pin,pid:s.pid,n:s.n,a:s.a,ph:'conn',max:9,tot:0,my:-1};var me=P;SND=(ls(LSF)||{}).snd!==false;openOv();
  view(topbar('')+'<div class="jq-cd"><div class="jq-spin"></div><p>Xonaga qayta ulanmoqda…</p></div>','pl');
  me.fail=function(){if(P!==me)return;view(topbar('')+'<div class="jq-cd"><div class="em big">📡</div><h2>Tashkilotchi bilan aloqa yo‘q</h2><p>Internetni tekshiring yoki qayta urinib ko‘ring.</p><div class="jq-btns"><button class="jq-btn go" data-act="retry">↻ Qayta urinish</button><button class="jq-btn ghost" data-act="exitok">Chiqish</button></div></div>','pl')};
  pNet()}
function pMsg(m){
  if(!P)return;if(m.to&&m.to!==P.pid)return;
  if(m.t==='s'){if(!m.to){if(P.got)pSnap(m)}else if(m.to===P.pid)pSnap(m)}
  else if(m.t==='r'){if(P.got&&P.ph==='lobby'){P.ros=m.l;pLobbyUpdate()}}
  else if(m.t==='h'){P.lastH=Date.now();if(P.got&&(m.ph!==P.ph||m.qi!==P.qi))pHello()}
  else if(m.t==='k'){P.ak=true}
  else if(m.t==='deny'){var msg=m.why==='full'?'Xona to‘lgan':'O‘yin boshlangan — qo‘shilib bo‘lmaydi';LiveQuiz.err=msg;if(!P.got&&P.done)P.done('closed');else leave(msg)}
  else if(m.t==='kick'){leave('Tashkilotchi sizni xonadan chiqardi')}
  else if(m.t==='end'){if(P.ph==='fin'){P.over=true}else{leave('Tashkilotchi testni tugatdi')}}}
function pSnap(m){
  var first=!P.got;P.got=true;P.lastH=Date.now();if(m.you)P.i=m.you;
  var prev=P.ph,pq=P.qi;P.ph=m.ph;P.qi=m.qi;P.nq=m.nq;P.ttl=m.ttl;P.dl=performance.now()+m.rem;P.dur=m.dur||1;P.lock=m.lock;P.ak=false;
  if(first){conn(false);if(P.probe){P.probe=false;P.done&&P.done('ok');openOv()}lsSet(LSP,{pin:P.pin,pid:P.pid,n:P.n,a:P.a,ts:Date.now()})}
  if(m.ph==='lobby'){P.ros=m.ros||[];P.my=-1}
  if(m.ph==='q'){P.q=m.q;P.opts=m.a;P.my=m.my!=null?m.my:(pq===m.qi&&prev==='q'?P.my:-1)}
  if(m.ph==='rev'){P.q=m.q;P.opts=m.a;P.c=m.c;P.dist=m.dist;P.res=m.res||{};P.fast=m.fast;var r=P.res[P.i];if(r)P.tot=r[2]}
  if(m.ph==='board'){P.top=m.top;P.res=m.res||{};var r2=P.res[P.i];if(r2)P.tot=r2[2]}
  if(m.ph==='fin'){P.all=m.all}
  pRender();if(!P.hl2){P.hl2=1;IV.push(setInterval(function(){if(!P||!P.got||P.ph==='fin')return;if(Date.now()-P.lastH>16000)conn(true);else conn(false)},3000))}}
function pRender(){
  if(!P||!P.got)return;fxStop();clearInterval(PT);modalClose();
  ({lobby:pLobby,count:pCount,q:pQ,rev:pRev,board:pBoard,fin:pFin})[P.ph]()}
function pTop(){return topbar('<b class="jq-chip">PIN '+pinFmt(P.pin)+'</b>')}
function pLobby(){
  view(pTop()+'<div class="jq-pl"><div class="jq-me"><div class="jq-meav">'+av(P.a,112)+'</div><b id="jqmen">'+esc(P.n)+'</b><button class="jq-btn ghost sm" data-act="edit">✏️ Profilni tahrirlash</button></div><p class="jq-wait">Siz test xonasidasiz! Tashkilotchi boshlashini kuting<span class="dots"></span></p><div class="jq-ph"><b>👥 <span id="jqcnt">0</span> ishtirokchi</b></div><div class="jq-grid sm" id="jqgrid"></div></div>','pl lobby');pLobbyUpdate()}
function pLobbyUpdate(){var g=$('#jqgrid');if(!g||!P)return;var l=P.ros||[];setGridSize(g,l.length+30);syncGrid(g,l,{me:P.i,sz:48});var c=$('#jqcnt');if(c)c.textContent=l.length}
function pCount(){view(pTop()+'<div class="jq-cd"><small>Tayyor bo‘ling!</small><div class="jq-big" id="jqbig" data-n="">3</div><p>'+esc(P.ttl||'')+'</p></div>','pl');
  var tick=function(){var rem=P.dl-performance.now(),s=Math.max(1,Math.ceil(rem/1000)),b=$('#jqbig');if(b&&b.dataset.n!==String(s)){b.dataset.n=s;b.textContent=s;pulse(b);S.tick()}};tick();PT=setInterval(tick,100)}
function pQ(){
  var n=P.opts.length,locked=P.my>=0;
  view('<div class="jq-ptop"><b>'+(P.qi+1)+' / '+P.nq+'</b><div class="jq-tb" id="jqtbar"><i></i></div><b id="jqtm">'+Math.ceil(Math.max(0,P.dl-performance.now())/1000)+'</b></div><h2 class="jq-pqt">'+esc(P.q)+'</h2><div class="jq-popts n'+n+(locked?' locked':'')+'" id="jqpo">'+P.opts.map(function(t,k){return '<button class="jq-ab c'+k+(P.my===k?' sel':'')+(locked&&P.my!==k?' dim':'')+'" data-act="ans" data-v="'+k+'"><u>'+SHP[k]+'</u><span>'+esc(t)+'</span></button>'}).join('')+'</div><div class="jq-sent" id="jqsent"'+(locked?'':' hidden')+'>✓ Javob qabul qilindi — natijani kuting</div><div class="jq-pfoot"></div>','pl q');
  /* pastki qator: ism va ball */
  var f=$('.jq-pfoot');if(f)f.innerHTML=av(P.a,34)+'<b>'+esc(P.n)+'</b><em>'+fmt(P.tot)+'</em>';
  var tot=P.dur,tick=function(){var rem=P.dl-performance.now(),tb=$('#jqtbar'),tm=$('#jqtm');if(tb)tb.style.setProperty('--w',(Math.max(0,rem)/tot*100)+'%');var s=Math.max(0,Math.ceil(rem/1000));if(tm&&tm.textContent!==String(s)){tm.textContent=s;if(s<=5&&s>0&&P.my<0)S.tick()}
    if(rem<=0){var po=$('#jqpo');if(po&&!po.classList.contains('locked')){po.classList.add('locked');var se=$('#jqsent');if(se){se.hidden=false;se.textContent=P.my<0?'⏰ Vaqt tugadi':'✓ Javob qabul qilindi'}}}};tick();PT=setInterval(tick,100)}
function pAnswer(k){
  if(!P||P.ph!=='q'||P.my>=0||P.dl-performance.now()<=0)return;P.my=k;S.pop();var qi=P.qi,tries=0;
  function go(){if(!P||P.qi!==qi||P.ph!=='q'||P.ak||tries>4)return;tries++;send({t:'ans',p:P.pid,qi:qi,c:k});setTimeout(go,800)}go();
  var po=$('#jqpo');if(po){po.classList.add('locked');$$('.jq-ab',po).forEach(function(b,i){b.classList.toggle('sel',i===k);b.classList.toggle('dim',i!==k)})}var se=$('#jqsent');if(se){se.hidden=false;se.textContent='✓ Javob qabul qilindi — natijani kuting'}}
function pRev(){
  var r=P.res&&P.res[P.i],f=r?r[0]:2,pts=r?r[1]:0,rank=r?r[3]:0,st=r?r[5]:0,co=P.opts[P.c];
  var h=f===1?'<div class="jq-fbi">✓</div><h2>To‘g‘ri!</h2><div class="jq-pts" id="jqpts">+0</div>'+(st>1?'<div class="jq-st">🔥 '+st+' ta ketma-ket</div>':''):
    f===0?'<div class="jq-fbi">✕</div><h2>Noto‘g‘ri</h2><p class="jq-corr">To‘g‘ri javob: <b>'+SHP[P.c]+' '+esc(co)+'</b></p>':
    '<div class="jq-fbi">⏰</div><h2>Vaqt tugadi</h2><p class="jq-corr">To‘g‘ri javob: <b>'+SHP[P.c]+' '+esc(co)+'</b></p>';
  view(pTop()+'<div class="jq-fb '+(f===1?'ok':f===0?'no':'tm')+'">'+h+'<div class="jq-rk">'+(rank?'<b>#'+rank+'</b> o‘rin · '+fmt(P.tot)+' ball':fmt(P.tot)+' ball')+'</div></div>','pl');
  if(f===1){S.ok();confetti(innerWidth/2,innerHeight*.4,40);var el=$('#jqpts'),t0=performance.now();(function an(){var k=Math.min(1,(performance.now()-t0)/700);if(el)el.textContent='+'+fmt(pts*k);if(k<1)requestAnimationFrame(an)})()}else S.no()}
function pBoard(){var top=P.top||[],max=top.length?top[0][3]:1,r=P.res&&P.res[P.i],mine=r&&r[3]>5;
  view(pTop()+'<div class="jq-bd sm"><h2>🏆 Jonli reyting</h2><div class="jq-rows">'+rowsHTML(top,max,true)+'</div>'+(r?'<div class="jq-mine">Sizning o‘rningiz: <b>#'+r[3]+'</b> · '+fmt(r[2])+' ball'+(r[4]&&r[4]>r[3]?' <span class="mv up">▲'+(r[4]-r[3])+'</span>':r[4]&&r[4]<r[3]?' <span class="mv dn">▼'+(r[3]-r[4])+'</span>':'')+'</div>':'')+'</div>','pl')}
function pFin(){var all=P.all||[],k=-1;all.forEach(function(r,j){if(r[0]===P.i)k=j});var me=k>=0?all[k]:null;
  view(pTop()+'<div class="jq-fin sm"><h2 class="jq-ft">'+(k>=0&&k<3?'🏆 Tabriklaymiz!':'🎉 Test yakunlandi!')+'</h2>'+podiumHTML(all)+'</div>'+(me?'<div class="jq-mine big">Siz: <b>#'+(k+1)+'</b> · '+fmt(me[3])+' ball · '+me[4]+'/'+P.nq+' to‘g‘ri</div>':'')+'<div class="jq-btns r"><button class="jq-btn go" data-act="exitok">Chiqish</button></div>','pl fin');celebrate(all);
  if(k>=0&&k<3)after(5200,function(){confetti(innerWidth/2,innerHeight*.5,80)})}
function pEdit(){E={n:P.n,a:P.a,g:AV[P.a]?AV[P.a][3]:'f'};pEditModal()}
function pEditModal(){
  var list=PFAV.map(function(i){return{d:AV[i],i:i}});
  modal('<h3>'+(P&&P.joining?'Testga qo‘shiling':'Profilingiz')+'</h3><label class="jq-lab" for="jqname">Ismingiz</label><input id="jqname" class="jq-inp" maxlength="20" value="'+esc(E.n)+'" placeholder="Ismingizni yozing" autocomplete="given-name"><div class="jq-prev">'+av(E.a,64)+'<b>'+esc((AV[E.a]||AV[0])[1])+'</b></div><div class="jq-pickhead"><b>Avatar tanlang</b><button class="jq-btn ghost sm" data-act="pfrnd">🎲 Tasodifiy</button></div><div class="jq-avg" role="group" aria-label="Avatarlar">'+list.map(function(x){return '<button class="'+(E.a===x.i?'on':'')+'" data-act="pfav" data-v="'+x.i+'" aria-label="'+esc(x.d[1])+'" title="'+esc(x.d[1])+'">'+av(x.i,48)+'</button>'}).join('')+'</div><small class="jq-credit">Mem avatarlari: <a href="https://commons.wikimedia.org/wiki/File:Doge_meme_example.jpg" target="_blank" rel="noreferrer">Doge — likeaduck, CC BY 2.0</a> · <a href="https://commons.wikimedia.org/wiki/File:Grumpy_Cat_meme_example.jpg" target="_blank" rel="noreferrer">Grumpy Cat — Gage Skidmore, CC BY-SA 4.0</a> · <a href="https://commons.wikimedia.org/wiki/File:O_RLY.jpg" target="_blank" rel="noreferrer">O RLY? — public domain</a></small><div class="jq-btns"><button class="jq-btn ghost" data-act="'+(P&&P.joining?'joincancel':'mclose')+'">'+(P&&P.joining?'Bekor':'Yopish')+'</button><button class="jq-btn go" data-act="pfsave">'+(P&&P.joining?'Testga kirish':'Saqlash')+'</button></div>','edit');
  if(P&&P.joining)setTimeout(function(){var n=$('#jqname');if(n)n.focus()},80)}
function pSave(){var raw=($('#jqname')||{}).value||'',joining=!!P.joining;if(joining&&!raw.trim()){say('Ismingizni kiriting');var input=$('#jqname');if(input)input.focus();return}P.n=cleanName(raw,P.n);P.a=E.a;var p=ls(LSF)||{};p.n=P.n;p.a=P.a;lsSet(LSF,p);var s=ls(LSP);if(s){s.n=P.n;s.a=P.a;lsSet(LSP,s)}modalClose();if(joining){P.joining=false;pNet();var me=P;setTimeout(function(){if(!me.got&&!me.fin)me.fail()},7000)}else{pHello();if(P.ph==='lobby')pLobby();say('Profil saqlandi')}}

/* ===== bosish hodisalari ===== */
function onClick(e){
  var m=$('#jqmod');if(e.target===m){if(P&&P.joining)cancelJoin();else modalClose();return}
  var b=e.target.closest('[data-act]');if(!b)return;var a=b.dataset.act,v=b.dataset.v;
  switch(a){
    case'exit':askExit();break;case'mclose':if(P&&P.joining)cancelJoin();else modalClose();break;case'joincancel':cancelJoin();break;case'exitok':leave();break;
    case'snd':setSnd(!SND);break;
    case'set':if(H)hSettings();break;
    case'cfg':if(H){var k=b.dataset.k,x=v==='true'?true:v==='false'?false:+v;if(k==='shufQ'||k==='shufA'||k==='board'||k==='late'||k==='snd')x=!!+v;H.set[k]=x;if(k==='snd')setSnd(!!x);persistH();hSettings();hLobbyUpdate()}break;
    case'start':if(H&&H.ph==='lobby')hStartGame();break;
    case'skip':if(H&&H.ph==='q')hReveal();break;
    case'next':if(H)hAdvance();break;
    case'again':if(H)hAgain();break;
    case'csv':if(H&&H.fin)hCSV();break;
    case'lock':if(H){H.lock=!H.lock;persistH();hLobbyUpdate();bcast()}break;
    case'kick':if(H){Object.keys(H.pl).forEach(function(id){if(String(H.pl[id].i)===v){send({t:'kick',to:id});delete H.pl[id]}});rosDirty();persistH()}break;
    case'ans':pAnswer(+v);break;
    case'edit':if(P)pEdit();break;
    case'pfav':E.n=($('#jqname')||{}).value||E.n;E.a=+v;pEditModal();break;
    case'pfrnd':E.n=($('#jqname')||{}).value||E.n;E.a=randAv();E.g=AV[E.a][3];pEditModal();break;
    case'pfsave':if(P){E.n=($('#jqname')||{}).value||E.n;pSave()}break;
    case'retry':if(P){var s={pin:P.pin,pid:P.pid,n:P.n,a:P.a};netClose();clearInterval(P.hl);P=null;pResume(s)}break}}

/* ===== ochiq API va ishga tushirish ===== */
var LiveQuiz={host:host,join:join,err:'',active:function(){return !!(H||P)},open:function(){if(H||P)openOv()}};
window.LiveQuiz=LiveQuiz;
function cancelJoin(){if(!P||!P.joining)return;var me=P;P=null;me.done('cancelled');modalClose();closeOv()}
function boot(){
  mount();
  var h=ls(LSH),p=ls(LSP),m=location.hash.match(/^#j=(\d{6})$/),pend=null;try{pend=localStorage.getItem('idPendingLive');localStorage.removeItem('idPendingLive')}catch(e){}
  var pin=m?m[1]:pend;if(m){try{history.replaceState(null,'','#bosh')}catch(e){}}
  if(h&&h.pin&&Date.now()-h.ts<STALE){hResume(h);return}else if(h)lsDel(LSH);
  if(pin){if(p&&p.pin!==pin)lsDel(LSP);setTimeout(function(){join(pin).then(function(r){if(r==='none')say('Jonli xona topilmadi — PIN kodni tekshiring');else if(r==='closed')say(LiveQuiz.err||'Xonaga kirib bo‘lmadi')})},0);return}
  if(p&&p.pin&&Date.now()-p.ts<STALE){pResume(p);return}else if(p)lsDel(LSP)}

var CSS='.jq{position:fixed;inset:0;z-index:90;color:#fff;font-family:Nunito,system-ui,sans-serif;font-weight:700;overflow:hidden;background:#0E1034;overscroll-behavior:none;-webkit-user-select:none;user-select:none}.jq[hidden]{display:none}.jq *{box-sizing:border-box;margin:0}:where(.jq) button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}.jq h1,.lv h2,.lv h3,.lv .disp{font-family:"Baloo 2",Nunito,sans-serif;font-weight:800;line-height:1.05}'
+'.jq-bg{position:absolute;inset:0;background:radial-gradient(120% 90% at 10% 0%,#5B3BD6 0%,#2A1F8F 38%,#12123F 75%,#0A0B2B 100%)}.jq-bg::before,.jq-bg::after{content:"";position:absolute;border-radius:50%;filter:blur(90px);opacity:.35;animation:jqfl 14s ease-in-out infinite}.jq-bg::before{width:42vmax;height:42vmax;background:#FF3B5C;right:-12vmax;top:-14vmax}.jq-bg::after{width:38vmax;height:38vmax;background:#27C9E6;left:-12vmax;bottom:-14vmax;animation-delay:-7s}@keyframes jqfl{50%{transform:translate(4vmax,3vmax) scale(1.1)}}'
+'.jq-main{position:absolute;inset:0;display:flex;flex-direction:column;gap:clamp(8px,1.6vh,16px);padding:calc(12px + env(safe-area-inset-top,0px)) clamp(12px,2vw,28px) calc(12px + env(safe-area-inset-bottom,0px));overflow:hidden}.jq-fx{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}'
+'.jq-top{display:flex;align-items:center;gap:10px;flex:none;min-height:44px}.jq-top .sp,.sp{flex:1}.jq-ib{width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.22);display:grid;place-items:center;font-size:18px;font-weight:800;flex:none}'
+'.jq-pill{display:inline-flex;align-items:center;gap:7px;background:#FF3B5C;border-radius:99px;padding:4px 13px;font-weight:800;font-size:13px;letter-spacing:.06em;box-shadow:0 4px 0 #B81E3A;flex:none}.jq-pill i{width:9px;height:9px;border-radius:50%;background:#fff;animation:jqbl 1.1s infinite}@keyframes jqbl{50%{opacity:.25}}'
+'.jq-ttl{font-family:"Baloo 2",Nunito,sans-serif;font-size:clamp(16px,2.4vw,24px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}.jq-chip{background:rgba(255,255,255,.14);border-radius:99px;padding:5px 14px;font-weight:800;font-size:14px;white-space:nowrap}'
+'.jq-card{background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.18);border-radius:26px;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);padding:clamp(14px,2vw,22px);box-shadow:0 18px 40px rgba(0,0,0,.25)}'
+'.jq-btns{display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;flex:none}.jq-btns.r{justify-content:flex-end}.jq-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:18px;padding:12px 22px;font-family:"Baloo 2",Nunito,sans-serif;font-weight:800;font-size:18px;transition:transform .12s}.jq-btn.sm{padding:8px 16px;font-size:15px;border-radius:14px}.jq-btn.go{background:#FFC53D;color:#3F2E00;box-shadow:0 5px 0 #D79A12}.jq-btn.ghost{background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.3)}.jq-btn.bad{background:#FF3B5C;box-shadow:0 5px 0 #B81E3A}.jq-btn:active{transform:translateY(3px)}.jq-btn[disabled]{opacity:.45;pointer-events:none}'
/* lobbi */
+'.jq-lob{flex:1;min-height:0;display:grid;grid-template-columns:minmax(300px,390px) 1fr;gap:clamp(12px,2vw,24px)}.jq-jn{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;min-height:0;overflow:auto}.jq-jn small{opacity:.9;font-size:14px}.jq-pinbig{font-family:"Baloo 2",Nunito,sans-serif;font-weight:800;font-size:clamp(34px,4.6vw,62px);letter-spacing:.08em;white-space:nowrap;line-height:1;background:#fff;color:#1B2150;border-radius:20px;padding:6px 18px;box-shadow:0 6px 0 rgba(0,0,0,.25)}'
+'.jq-qr{flex:1;min-height:0;display:grid;place-items:center;width:100%}.jq-qrw{background:#fff;border-radius:20px;padding:12px;width:min(100%,clamp(150px,32vh,290px));aspect-ratio:1;color:#1B2150;display:grid;place-items:center;box-shadow:0 6px 0 rgba(0,0,0,.25)}.jq-qrw svg{width:100%;height:100%}.jq-qrw.small{font-size:12px;word-break:break-all;aspect-ratio:auto;padding:10px}'
+'.jq-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.jq-chips span{background:rgba(255,255,255,.14);border-radius:99px;padding:3px 10px;font-size:12px;font-weight:800}.jq-pls{display:flex;flex-direction:column;min-height:0}.jq-ph{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;font-size:18px;flex:none}.jq-lock{background:rgba(255,255,255,.14);border-radius:99px;padding:5px 14px;font-size:14px;font-weight:800}.jq-lock.on{background:#FF3B5C}'
+'.jq-grid{--ts:122px;flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--ts),1fr));gap:10px;align-content:start;padding:4px}.jq-pt{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.14);border-radius:20px;padding:12px 6px 10px;text-align:center;min-width:0}.jq-pt b{font-size:14px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.jq-pt.me{border-color:#FFC53D;background:rgba(255,197,61,.18)}.jq-pt.pop{animation:jqpop .55s cubic-bezier(.2,1.6,.4,1)}@keyframes jqpop{from{transform:scale(0) rotate(-12deg);opacity:0}}.jq-pt:not(.pop){animation:jqbob 4s ease-in-out infinite}.jq-pt:nth-child(3n){animation-delay:-1.3s}.jq-pt:nth-child(3n+1){animation-delay:-2.6s}@keyframes jqbob{50%{transform:translateY(-4px)}}'
+'.jq-kick{position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,.35);font-size:11px;opacity:0;transition:opacity .15s}.jq-pt:hover .jq-kick,.jq-pt:focus-within .jq-kick{opacity:1}@media(hover:none){.jq-kick{opacity:.7}}'
+'.jq-av{display:inline-grid;place-items:center;width:var(--s);height:var(--s);border-radius:50%;font-size:calc(var(--s)*.58);line-height:1;box-shadow:inset 0 -4px 0 rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.25);flex:none}'
+'.jq-empty{position:absolute;inset:60px 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;opacity:.9;pointer-events:none}.jq-pls{position:relative}.jq-empty .bob{display:flex;gap:14px;font-size:44px}.jq-empty .bob span{animation:jqbob 2.4s ease-in-out infinite}.jq-empty .bob span:nth-child(2){animation-delay:-.6s}.jq-empty .bob span:nth-child(3){animation-delay:-1.2s}.jq-empty .bob span:nth-child(4){animation-delay:-1.8s}.jq-empty small{opacity:.75}'
/* sanash, savol */
+'.jq-cd{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center}.jq-cd small{font-size:clamp(18px,3vw,30px);font-family:"Baloo 2",Nunito,sans-serif}.jq-big{font-family:"Baloo 2",Nunito,sans-serif;font-weight:800;font-size:clamp(140px,34vh,300px);line-height:1;text-shadow:0 10px 0 rgba(0,0,0,.25)}.pulse{animation:jqpu .6s cubic-bezier(.2,1.6,.4,1)}@keyframes jqpu{from{transform:scale(.3);opacity:0}}.jq-cd .em{font-size:64px}.jq-cd p{opacity:.85}.jq-spin{width:56px;height:56px;border-radius:50%;border:6px solid rgba(255,255,255,.25);border-top-color:#FFC53D;animation:jqsp 1s linear infinite}@keyframes jqsp{to{transform:rotate(1turn)}}'
+'.jq-tbar,.jq-tb{height:10px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden;flex:none}.jq-tbar i,.jq-tb i{display:block;height:100%;width:var(--w,100%);background:linear-gradient(90deg,#27C99A,#FFC53D,#FF3B5C);background-size:300% 100%;background-position:calc(100% - var(--w,100%)) 0;border-radius:99px}.jq-tb{flex:1}'
+'.jq-hq{flex:1;min-height:0;display:flex;flex-direction:column;gap:clamp(8px,1.6vh,18px)}.jq-qbox{flex:none;display:flex;align-items:center;gap:clamp(12px,2vw,24px);background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.2);border-radius:28px;padding:clamp(12px,2.2vh,26px) clamp(16px,2.4vw,32px)}.jq-qt{font-size:clamp(22px,4vw,46px);flex:1;text-align:center}.jq-qt.sm{font-size:clamp(18px,2.8vw,32px)}'
+'.jq-ring{position:relative;width:clamp(64px,11vh,104px);aspect-ratio:1;flex:none}.jq-ring svg{width:100%;height:100%;transform:rotate(-90deg)}.jq-ring circle#jqrc{transition:stroke-dashoffset .2s linear}.jq-ring b{position:absolute;inset:0;display:grid;place-items:center;font:800 clamp(24px,4.2vh,42px) "Baloo 2",sans-serif}.jq-ring.low b{color:#FFC53D;animation:jqpl .5s infinite alternate}@keyframes jqpl{to{transform:scale(1.18)}}.jq-ans{flex:none;text-align:center;min-width:70px}.jq-ans b{display:block;font:800 clamp(28px,5vh,46px) "Baloo 2",sans-serif;line-height:1}.jq-ans small{opacity:.8;font-size:13px}'
+'.c0{--c:#FF3B5C;--d:#B81E3A}.c1{--c:#2D7BFF;--d:#1A4FB8}.c2{--c:#FFB400;--d:#B07A00;color:#2b2000}.c3{--c:#1FCB8A;--d:#0E8F62}'
+'.jq-opts{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:clamp(8px,1.6vw,18px)}.jq-opts.n3 .jq-o:last-child{grid-column:1/-1}.jq-o{position:relative;display:flex;align-items:center;gap:14px;background:var(--c);box-shadow:0 6px 0 var(--d);border-radius:22px;padding:0 clamp(14px,2vw,28px);font-family:"Baloo 2",Nunito,sans-serif;font-weight:800;font-size:clamp(18px,3vw,34px);overflow:hidden;min-height:60px}.jq-o u{text-decoration:none;font-size:1.3em;opacity:.9;flex:none}.jq-o span{flex:1;line-height:1.1}'
+'.jq-o.no{filter:saturate(.25) brightness(.65);opacity:.8}.jq-o.ok{box-shadow:0 0 0 5px #fff,0 0 44px rgba(255,255,255,.55);animation:jqok .9s cubic-bezier(.2,1.5,.4,1)}@keyframes jqok{from{transform:scale(.94)}60%{transform:scale(1.04)}}.jq-cnt{font-style:normal;background:rgba(0,0,0,.28);border-radius:14px;padding:2px 14px;font-size:.8em;z-index:1}.jq-mark{font-style:normal;font-size:1.3em;z-index:1}.jq-o s{position:absolute;left:0;bottom:0;height:7px;width:var(--w);background:rgba(255,255,255,.7);transition:width .8s}.jq-stats{display:flex;gap:18px;flex-wrap:wrap;justify-content:center;font-size:clamp(14px,1.8vw,19px);flex:none}.jq-stats span{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.12);border-radius:99px;padding:5px 16px}'
/* reyting */
+'.jq-bd{flex:1;min-height:0;display:flex;flex-direction:column;gap:14px;justify-content:center;max-width:960px;width:100%;margin:0 auto}.jq-bd h2{text-align:center;font-size:clamp(26px,4vw,44px)}.jq-rows{display:grid;gap:10px}.jq-row{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.18);border-radius:22px;padding:8px 14px;animation:jqsl .6s var(--d) cubic-bezier(.2,1.3,.4,1) both}@keyframes jqsl{from{transform:translateX(-60px);opacity:0}}.jq-row .rk{font:800 clamp(22px,3vw,34px) "Baloo 2",sans-serif;width:40px;text-align:center;flex:none}.jq-row:nth-child(1) .rk{color:#FFC53D}.jq-row .mid{flex:1;min-width:0}.jq-row .mid b{display:block;font-size:clamp(15px,2.2vw,22px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jq-row .tr{height:12px;border-radius:99px;background:rgba(255,255,255,.15);margin-top:4px;overflow:hidden}.jq-row .tr i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#27C99A,#FFC53D);width:var(--w);animation:jqgr 1s calc(var(--d) + .2s) ease-out both}@keyframes jqgr{from{width:0}}'
+'.jq-row .rt{text-align:right;flex:none;display:flex;flex-direction:column;align-items:flex-end;min-width:64px}.jq-row .rt em{font:800 clamp(18px,2.6vw,28px) "Baloo 2",sans-serif;font-style:normal}.jq-row .dl{font-size:13px;color:#7CF0C4}.mv{font-size:12px;font-weight:800}.mv.up{color:#7CF0C4}.mv.dn{color:#FF8FA3}.jq-row.sm{padding:6px 10px;border-radius:16px}.jq-bd.sm h2{font-size:26px}.jq-mine{background:#FFC53D;color:#3F2E00;border-radius:18px;padding:10px 16px;text-align:center;font-size:16px;flex:none}.jq-mine.big{margin:0 auto;font-size:18px}'
/* final */
+'.jq-fin{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;overflow:hidden}.jq-ft{text-align:center;font-size:clamp(26px,4.4vw,48px);animation:jqpu .8s both}.jq-pods{flex:1;min-height:200px;display:flex;align-items:flex-end;justify-content:center;gap:clamp(8px,2vw,22px)}.jq-pc{position:relative;flex:1;max-width:250px;display:flex;flex-direction:column;align-items:center;min-width:0}.jq-pwho{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;max-width:100%;position:relative;z-index:2;animation:jqdr .9s calc(var(--d) + .55s) cubic-bezier(.2,1.5,.4,1) both}@keyframes jqdr{from{opacity:0;transform:translateY(-80px) scale(.5)}}.jq-pwho b{font:800 clamp(15px,2.2vw,24px) "Baloo 2",sans-serif;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.jq-pwho em{font-style:normal;font-size:clamp(14px,1.8vw,20px);background:rgba(255,255,255,.16);border-radius:99px;padding:1px 12px}.crown{font-size:clamp(28px,4vw,44px);animation:jqcr 1.6s ease-in-out infinite;margin-bottom:-8px}@keyframes jqcr{50%{transform:translateY(-6px) rotate(8deg)}}'
+'.jq-pbar{width:100%;height:calc(var(--k)*clamp(90px,30vh,280px));border-radius:22px 22px 0 0;display:grid;place-items:start center;padding-top:10px;font:800 clamp(34px,6vh,64px) "Baloo 2",sans-serif;transform-origin:bottom;animation:jqri .9s var(--d) cubic-bezier(.2,1.3,.4,1) both;background:linear-gradient(180deg,#9A7BFF,#5B3BD6);box-shadow:inset 0 6px 0 rgba(255,255,255,.25)}.r1 .jq-pbar{background:linear-gradient(180deg,#FFD95E,#F2A516);color:#5B3D00}.r2 .jq-pbar{background:linear-gradient(180deg,#E3E8F5,#9AA4C8);color:#2A3166}.r3 .jq-pbar{background:linear-gradient(180deg,#FFB47A,#D9743A);color:#5A2A08}@keyframes jqri{from{transform:scaleY(0)}}'
+'.jq-rays{position:absolute;left:50%;bottom:20%;width:min(90vw,720px);aspect-ratio:1;transform:translateX(-50%);background:repeating-conic-gradient(rgba(255,214,90,.28) 0 8deg,transparent 8deg 20deg);border-radius:50%;-webkit-mask:radial-gradient(circle,#000 0,transparent 70%);mask:radial-gradient(circle,#000 0,transparent 70%);animation:jqsp 14s linear infinite,jqfi 1s calc(var(--d) + .6s) both;z-index:0}@keyframes jqfi{from{opacity:0}}'
+'.jq-rest{flex:none;max-height:26vh;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;animation:jqfi .8s var(--d) both}.jq-rest .rr{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.12);border-radius:14px;padding:6px 10px}.jq-rest .rk{font:800 16px "Baloo 2",sans-serif;width:26px;text-align:center}.jq-rest b{flex:1;min-width:0;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jq-rest em{font-style:normal;font-weight:800;font-size:14px}'
/* ishtirokchi */
+'.jq-pl{flex:1;min-height:0;display:flex;flex-direction:column;gap:12px;overflow:hidden}.jq-me{display:flex;flex-direction:column;align-items:center;gap:8px;flex:none}.jq-me b{font:800 26px "Baloo 2",sans-serif}.jq-meav{animation:jqbob 3s ease-in-out infinite}.jq-wait{text-align:center;opacity:.9;flex:none}.dots::after{content:"";animation:jqdt 1.4s steps(4) infinite}@keyframes jqdt{0%{content:""}25%{content:"."}50%{content:".."}75%,100%{content:"..."}}.jq-grid.sm{grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:8px}.jq-grid.sm .jq-pt{padding:8px 4px}.jq-grid.sm .jq-pt b{font-size:12px}'
+'.jq-ptop{display:flex;align-items:center;gap:12px;flex:none;font:800 18px "Baloo 2",sans-serif}.jq-pqt{font-size:clamp(20px,5.6vw,34px);text-align:center;padding:10px 4px;flex:none;max-height:32vh;overflow:auto}.jq-popts{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:10px}.jq-popts.n3 .jq-ab:last-child{grid-column:1/-1}@media(max-width:420px){.jq-popts.n4,.jq-popts.n3{grid-template-columns:1fr}.jq-popts.n3 .jq-ab:last-child{grid-column:auto}}'
+'.jq-ab{display:flex;align-items:center;gap:12px;background:var(--c);box-shadow:0 6px 0 var(--d);border-radius:20px;padding:10px 14px;font-family:"Baloo 2",Nunito,sans-serif;font-weight:800;font-size:clamp(16px,4.4vw,24px);text-align:left;transition:transform .1s,opacity .2s;color:#fff}.jq-ab.c2{color:#2b2000}.jq-ab u{text-decoration:none;font-size:1.5em;flex:none}.jq-ab span{flex:1;line-height:1.1}.jq-ab:active{transform:translateY(4px);box-shadow:0 2px 0 var(--d)}.jq-popts.locked .jq-ab{pointer-events:none}.jq-ab.dim{opacity:.3}.jq-ab.sel{outline:4px solid #fff;transform:scale(1.02)}.jq-sent{text-align:center;background:rgba(255,255,255,.16);border-radius:16px;padding:10px;flex:none}.jq-pfoot{display:flex;align-items:center;gap:10px;flex:none;background:rgba(0,0,0,.25);border-radius:18px;padding:6px 14px}.jq-pfoot b{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.jq-pfoot em{font-style:normal;background:#fff;color:#1B2150;border-radius:99px;padding:2px 14px;font-weight:800}'
+'.jq-fb{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;border-radius:32px;padding:20px;margin-bottom:6px}.jq-fb.ok{background:linear-gradient(160deg,#1FCB8A,#0E8F62)}.jq-fb.no{background:linear-gradient(160deg,#FF3B5C,#B81E3A)}.jq-fb.tm{background:linear-gradient(160deg,#6B4BD6,#2D2A7A)}.jq-fb h2{font-size:clamp(34px,9vw,56px)}.jq-fbi{width:112px;height:112px;border-radius:50%;background:#fff;color:#1B2150;display:grid;place-items:center;font:800 64px "Baloo 2",sans-serif;animation:jqpu .7s cubic-bezier(.2,1.6,.4,1)}.jq-fb.ok .jq-fbi{color:#0E8F62}.jq-fb.no .jq-fbi{color:#B81E3A}.jq-pts{font:800 clamp(40px,11vw,64px) "Baloo 2",sans-serif}.jq-st{background:rgba(0,0,0,.25);border-radius:99px;padding:4px 16px}.jq-corr{font-size:18px}.jq-rk{background:rgba(0,0,0,.28);border-radius:99px;padding:8px 20px;font-size:18px;margin-top:6px}'
/* oyna */
+'.jq-mod{position:absolute;inset:0;z-index:5;background:rgba(10,11,43,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:grid;place-items:center;padding:16px;overflow:auto}.jq-mod[hidden]{display:none}.jq-mb{width:min(520px,100%);max-height:92vh;overflow:auto;background:#1E1B5E;border:2px solid rgba(255,255,255,.22);border-radius:28px;padding:22px;display:flex;flex-direction:column;gap:14px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.5);animation:jqpu .35s cubic-bezier(.2,1.4,.4,1)}.jq-mb h3{font-size:26px}.jq-mb .em{font-size:48px}.jq-mb p{opacity:.9}'
+'.jq-set{display:grid;gap:10px;text-align:left}.jq-set .rw{display:grid;gap:6px}.seg{display:flex;flex-wrap:wrap;gap:6px}.seg button{background:rgba(255,255,255,.12);border:2px solid rgba(255,255,255,.18);border-radius:12px;padding:6px 12px;font-weight:800;font-size:14px}.seg button.on{background:#FFC53D;color:#3F2E00;border-color:#FFC53D}.sw{display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(255,255,255,.1);border-radius:14px;padding:10px 14px;text-align:left}.sw small{display:block;opacity:.7;font-size:12px;font-weight:600}.sw i{width:46px;height:26px;border-radius:99px;background:rgba(255,255,255,.25);position:relative;flex:none;transition:background .2s}.sw i::after{content:"";position:absolute;left:3px;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s}.sw.on i{background:#27C99A}.sw.on i::after{transform:translateX(20px)}'
+'.jq-lab{text-align:left;font-size:13px;opacity:.8}.jq-inp{width:100%;border-radius:14px;border:2px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;padding:12px 14px;font:800 18px Nunito,sans-serif;outline:none;-webkit-user-select:text;user-select:text}.jq-inp:focus{border-color:#FFC53D}.jq-prev{display:flex;align-items:center;gap:12px;justify-content:center}.jq-avg{display:grid;grid-template-columns:repeat(auto-fill,minmax(58px,1fr));gap:8px;max-height:210px;overflow:auto;padding:4px}.jq-avg button{border-radius:50%;padding:3px;border:3px solid transparent;justify-self:center}.jq-avg button.on{border-color:#FFC53D}'
+'.jq-conn{position:absolute;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:6;background:#FF3B5C;border-radius:99px;padding:6px 16px;font-size:14px;box-shadow:0 6px 18px rgba(0,0,0,.3)}.jq-conn[hidden]{display:none}.jq-toast{position:fixed;left:50%;bottom:calc(100px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);background:#1B2150;color:#fff;padding:10px 18px;border-radius:14px;font:700 14px Nunito,sans-serif;opacity:0;pointer-events:none;transition:.25s;z-index:120;max-width:90vw;text-align:center}.jq-toast.on{opacity:1;transform:translate(-50%,0)}'
+'@media(max-width:820px){.jq-lob{grid-template-columns:1fr;overflow-y:auto;grid-auto-rows:min-content}.jq-jn{overflow:visible}.jq-pls{min-height:300px}.jq-qbox{flex-wrap:wrap;justify-content:center}.jq-opts{grid-template-columns:1fr}.jq-opts.n3 .jq-o:last-child{grid-column:auto}.jq-ttl{display:none}}@media(prefers-reduced-motion:reduce){.jq *{animation-duration:.01s!important}}';

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
