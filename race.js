/* InterDars — Jamoaviy jang (poyga). Supabase Realtime Broadcast orqali ishlaydi (live.js bilan bir xil kanal).
   Ishtirokchilar telefondan qo‘shiladi, tasodifiy jamoalarga bo‘linadi. Har savolda to‘g‘ri javob faqat BIR jamoadoshning
   telefonida bor; xato variant bosilsa butun jamoa 0 ga tushadi. Marraga birinchi yetgan jamoa yutadi. live.js'dan keyin yuklanadi. */
(function(){
'use strict';
if(window.TeamRace)return;
var LSH='idTrHost',LSP='idTrPlayer',MAXP=80,MINP=4,STALE=3*3600*1000,DRAWMS=6000;
var SHP=['▲','◆','●','■'],CL=['a','b','c','d'];
var TMS=[{e:'🦊',n:'Qizil jamoa',c:'#FF3B5C'},{e:'🐬',n:'Ko‘k jamoa',c:'#2D7BFF'},{e:'🐸',n:'Yashil jamoa',c:'#1FCB8A'},{e:'🦁',n:'Sariq jamoa',c:'#FFB400'},{e:'🦄',n:'Binafsha jamoa',c:'#8A63F5'}];

/* ===== yordamchilar ===== */
function $(s,r){return (r||document).querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
/* sessionStorage: har bir oyna/tab o‘z o‘yinini eslab qoladi (bir brauzerda bir nechta oynadan sinaganda ular aralashib ketmasin) */
function ls(k){try{return JSON.parse(sessionStorage.getItem(k)||'null')}catch(e){return null}}
function lsSet(k,v){try{sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function lsDel(k){try{sessionStorage.removeItem(k)}catch(e){}}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function cleanName(s){s=String(s||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,20);return s||'Ishtirokchi'}
function LQ(){return window.LiveQuiz||{}}
function say(m){if(LQ().say)LQ().say(m)}
function av(a,s,n){return LQ().av?LQ().av(a,s,n,true):'<span class="jq-av" style="--s:'+s+'px;background:#4B6BFF"><span class="jq-av-initial">'+esc(String(n||'?').charAt(0))+'</span></span>'}
function obs(r){if(LQ().observe&&r)LQ().observe(r)}
function pinFmt(p){return p.slice(0,3)+' '+p.slice(3)}
function norm(t){return String(t==null?'':t).trim().toLowerCase()}
function tm(i){return TMS[i%TMS.length]}

/* ===== sof o‘yin mantiqi (sinash uchun _t orqali ochiq) ===== */
function usable(x){return !!(x&&typeof x.q==='string'&&x.q.trim()&&Array.isArray(x.a)&&x.a.length>=2&&x.a.length<=8&&typeof x.c==='number'&&x.c>=0&&x.c<x.a.length&&x.k!=='tf'&&x.a.every(function(t){return typeof t==='string'&&t.trim()}))}
function teamCount(n,want){return Math.max(2,Math.min(+want||3,5,Math.floor(n/2)))}
function split(ids,tc){ids=shuffle(ids.slice());var T=[];for(var i=0;i<tc;i++)T.push([]);ids.forEach(function(id,k){T[k%tc].push(id)});return T}
function poolFor(src,qi){var o=[];src.forEach(function(y,i){if(i!==qi)y.a.forEach(function(t){o.push(t)})});return o}
/* x={q,a,c}; members=[i,...]. Faqat bitta a’zoda to‘g‘ri javob bor; qolganlarda faqat xato variantlar. */
function buildOpts(x,pool,members){
  var good=x.a[x.c],gk=norm(good),wr=[];
  x.a.forEach(function(t,i){if(i!==x.c&&norm(t)!==gk)wr.push(t)});
  var ext=[],seen={};pool.concat(wr).forEach(function(t){var k=norm(t);if(k!==gk&&!seen[k]){seen[k]=1;ext.push(t)}});
  var foreign=ext.filter(function(t){return wr.every(function(w){return norm(w)!==norm(t)})});
  var own=members[Math.floor(Math.random()*members.length)],out={own:own,by:{}};
  members.forEach(function(m){
    var w=shuffle(wr.slice()).slice(0,3),f=shuffle(foreign.slice());
    if(m===own){while(w.length<3&&f.length)w.push(f.pop());var set=shuffle([good].concat(w));out.by[m]={a:set,c:set.indexOf(good)}}
    else{while(w.length<4&&f.length)w.push(f.pop());out.by[m]={a:shuffle(w),c:-1}}});
  return out}

/* ===== tarmoq ===== */
var NET={ch:null,ok:false};
function netOpen(pin,onMsg,onSt){netClose();var sb=window.sb;if(!sb||!sb.channel)return false;
  var ch=sb.channel('idlive-'+pin,{config:{broadcast:{self:false,ack:false}}});
  ch.on('broadcast',{event:'m'},function(e){try{if(NET.ch===ch)onMsg(e.payload||{})}catch(err){console.warn('teamrace',err)}});
  ch.subscribe(function(s){if(NET.ch!==ch)return;NET.ok=s==='SUBSCRIBED';onSt(s)});NET.ch=ch;return true}
function netClose(d){var ch=NET.ch;NET.ch=null;NET.ok=false;if(!ch)return;setTimeout(function(){try{window.sb.removeChannel(ch)}catch(e){}},d||0)}
function send(p){var ch=NET.ch;if(!ch)return;if(ch.state?ch.state!=='joined':!NET.ok)return;try{var r=ch.send({type:'broadcast',event:'m',payload:p});if(r&&r.catch)r.catch(function(){})}catch(e){}}

/* ===== overlay + qo‘riqlash ===== */
var R=null,M=null,H=null,P=null,HT=0,guard=false,TMR=[];
function after(ms,fn){var t=setTimeout(fn,ms);TMR.push(t);return t}
function clearTMR(){TMR.forEach(clearTimeout);TMR=[]}
function mount(){if(R)return;var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  R=document.createElement('div');R.className='trx';R.hidden=true;R.setAttribute('role','dialog');R.setAttribute('aria-label','Jamoaviy jang');
  R.innerHTML='<div class="trm" id="trm"></div><div class="trmod" id="trmod" hidden></div><div class="trconn" id="trconn" hidden>⚠️ Aloqa uzildi — qayta ulanmoqda…</div>';
  document.body.appendChild(R);M=$('#trm');R.addEventListener('click',onClick)}
function openOv(){mount();R.hidden=false;document.body.style.overflow='hidden';guardOn()}
function closeOv(){if(R)R.hidden=true;document.body.style.overflow='';guardOff()}
function view(h,cls){M.className='trm '+(cls||'');M.innerHTML=h;obs(M)}
function modal(h,k){var m=$('#trmod');m.dataset.k=k||'';m.innerHTML='<div class="trmb">'+h+'</div>';m.hidden=false}
function modalClose(){var m=$('#trmod');if(m){m.hidden=true;m.innerHTML='';m.dataset.k=''}}
function conn(bad){var c=$('#trconn');if(c)c.hidden=!bad}
function guardOn(){if(guard)return;guard=true;try{if(!(history.state&&history.state.tr))history.pushState({tr:1},'',location.href)}catch(e){}
  window.addEventListener('popstate',onPop);window.addEventListener('beforeunload',onUnload)}
function guardOff(){if(!guard)return;guard=false;window.removeEventListener('popstate',onPop);window.removeEventListener('beforeunload',onUnload);try{if(history.state&&history.state.tr)history.back()}catch(e){}}
function onPop(){if(!guard)return;try{history.pushState({tr:1},'',location.href)}catch(e){}askExit()}
function onUnload(e){if(!guard)return;e.preventDefault();e.returnValue='';return ''}
function askExit(){if(!(H||P))return;if((H&&H.ph==='fin')||(P&&P.S&&P.S.ph==='fin')){leave();return}if($('#trmod').dataset.k==='exit')return;
  modal('<div class="em">⚠️</div><h3>'+(H?'O‘yinni tugatasizmi?':'O‘yindan chiqasizmi?')+'</h3><p>'+(H?'O‘yin barcha ishtirokchilar uchun to‘xtaydi.':'Siz jamoangizdan chiqib ketasiz.')+'</p><div class="trbtns"><button class="trb ghost" data-act="mclose">Qolish</button><button class="trb bad" data-act="exitok">'+(H?'Tugatish':'Chiqish')+'</button></div>','exit')}
function leave(msg){clearTMR();if(H){send({t:'end'});clearInterval(HT);H=null;lsDel(LSH)}
  if(P){send({t:'bye',p:P.pid});clearInterval(P.hl);P=null;lsDel(LSP)}
  netClose(350);modalClose();closeOv();if(msg)say(msg)}
function topbar(extra){return '<div class="trt"><button class="trib" data-act="exit" aria-label="Chiqish">✕</button><span class="trpill">🏁 JAMOAVIY JANG</span>'+(extra||'')+'<span class="sp"></span></div>'}
function joinUrl(){return location.origin+'/home#j='+H.pin}
function qr(text){var b=$('#trqr');if(!b)return;
  function go(){try{var q=window.qrcode(0,'M');q.addData(text);q.make();var n=q.getModuleCount(),d='';for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))d+='M'+c+' '+r+'h1v1h-1z';b.innerHTML='<svg viewBox="-2 -2 '+(n+4)+' '+(n+4)+'" shape-rendering="crispEdges"><path d="'+d+'" fill="#1B2150"/></svg>'}catch(e){b.textContent=text}}
  if(window.qrcode)go();else b.textContent=text}

/* ===== TASHKILOTCHI ===== */
function host(l){
  if(!l||!l.qs){say('Savollar topilmadi');return false}
  if(!window.sb||!window.sb.channel){say('Jonli rejim uchun internet kerak');return false}
  if(H||P){openOv();return true}
  if(LQ().active&&LQ().active()){LQ().open&&LQ().open();return true}
  if(window.League&&window.League.active&&window.League.active()){window.League.open();return true}
  var src=l.qs.filter(usable).map(function(x){return{q:x.q,a:x.a.slice(),c:x.c}});
  if(src.length<3){say('Kamida 3 ta test savoli kerak');return false}
  H={v:1,pin:String(100000+Math.floor(Math.random()*900000)),lid:l.id,title:l.title,src:src,set:{tc:3,goal:8},ph:'lobby',pl:{},n:0,T:[],win:-1,ev:null,ts:Date.now()};
  hBoot();return true}
function hBoot(){openOv();
  netOpen(H.pin,hMsg,function(s){var bad=s==='CHANNEL_ERROR'||s==='TIMED_OUT'||s==='CLOSED';conn(bad);if(s==='SUBSCRIBED')bcast()});
  persist(1);
  if(H.ph==='draw')hGo();else hRender();
  clearInterval(HT);var hb=0;HT=setInterval(function(){if(H&&++hb%12===0)send({t:'h',ph:H.ph})},500)}
var persT=0;function persist(now){if(!H)return;clearTimeout(persT);if(now){H.ts=Date.now();lsSet(LSH,H)}else persT=setTimeout(function(){if(H){H.ts=Date.now();lsSet(LSH,H)}},300)}
function byI(i){for(var k in H.pl)if(H.pl[k].i===i)return H.pl[k];return null}
function ros(){return Object.keys(H.pl).map(function(k){return H.pl[k]}).sort(function(a,b){return a.i-b.i}).map(function(p){return[p.i,p.n,p.a,p.t,p.gone?1:0]})}
function snap(){return{ph:H.ph,ttl:H.title,goal:H.set.goal,T:H.T.map(function(T){return[T.ti,T.step,T.m.length,T.rs||0,T.fin?1:0]}),ros:ros(),ev:H.ev,win:H.win}}
var bT=0;function bcast(){if(!H||bT)return;bT=setTimeout(function(){bT=0;if(H)send(Object.assign({t:'s'},snap()))},90)}
function rosDirty(){bcast();if(H&&H.ph==='lobby')hLobbyUpdate();persist()}
function liveMem(T){return T.m.filter(function(i){var p=byI(i);return p&&!p.gone})}
function sendQTo(T,i){var p=byI(i);if(!p||!T.cur||!T.cur.by[i])return;send({t:'q',to:p.id,k:T.k,ti:T.ti,q:T.cur.q,o:T.cur.by[i].a})}
function newQ(T){var mem=liveMem(T);if(!mem.length||T.fin){T.cur=null;return}
  var qi=H.queue[T.qn%H.queue.length],x=H.src[qi];T.qn++;
  var o=buildOpts(x,poolFor(H.src,qi),mem);T.k=(T.k||0)+1;T.cur={q:x.q,own:o.own,by:o.by};
  mem.forEach(function(i){sendQTo(T,i)})}
function hMsg(m){if(!H||!m)return;
  if(m.t==='hi'){var id=String(m.p||'');if(id.length<6||id.length>20)return;var p=H.pl[id],nm=cleanName(m.n),a=m.a==null?-1:+m.a;
    if(!p){if(H.ph!=='lobby'){send({t:'deny',to:id,why:'late'});return}
      if(Object.keys(H.pl).length>=MAXP){send({t:'deny',to:id,why:'full'});return}
      p=H.pl[id]={id:id,i:++H.n,n:nm,a:a,t:-1};rosDirty()}
    else{if(p.n!==nm||p.a!==a){p.n=nm;p.a=a;rosDirty()}if(p.gone){p.gone=false;rosDirty()}}
    if(m.tr)send(Object.assign({t:'s',to:id,you:p.i},snap()));else send({t:'tr',to:id});
    if(H.ph==='play'&&p.t>=0){var T=H.T[p.t];if(T){if(!T.cur||!T.cur.by[p.i])newQ(T);else sendQTo(T,p.i)}}
    persist()}
  else if(m.t==='ans')hAns(m);
  else if(m.t==='bye'){var q=H.pl[m.p];if(q){if(H.ph==='lobby')delete H.pl[m.p];else{q.gone=true;var T2=H.ph==='play'&&q.t>=0?H.T[q.t]:null;if(T2&&T2.cur&&T2.cur.own===q.i)newQ(T2)}rosDirty();if(H.ph==='play')hRaceUpdate()}}}
function hStart(){if(!H||H.ph!=='lobby')return;
  Object.keys(H.pl).forEach(function(k){if(H.pl[k].gone)delete H.pl[k]});
  var ids=Object.keys(H.pl).map(function(k){return H.pl[k].i});
  if(ids.length<MINP){say('Kamida '+MINP+' ishtirokchi kerak');return}
  var tc=teamCount(ids.length,H.set.tc),g=split(ids,tc);
  H.T=g.map(function(m,ti){m.forEach(function(i){byI(i).t=ti});return{ti:ti,m:m,step:0,qn:0,k:0,rs:0,fin:0,cur:null}});
  H.queue=shuffle(H.src.map(function(_,i){return i}));H.ph='draw';H.t0=Date.now();persist(1);bcast();hRender();after(DRAWMS,hGo)}
function hGo(){if(!H||(H.ph!=='draw'))return;H.ph='play';H.t0=Date.now();H.T.forEach(newQ);persist(1);bcast();hRender()}
function hAns(m){if(!H||H.ph!=='play')return;var p=H.pl[m.p];if(!p||p.t<0)return;
  var T=H.T[p.t];if(!T||T.fin||!T.cur||m.k!==T.k)return;var by=T.cur.by[p.i];if(!by)return;
  var o=+m.o;if(!(o>=0&&o<by.a.length))return;var en=(H.ev?H.ev.n:0)+1;
  if(o===by.c){T.step++;H.ev={n:en,ti:T.ti,k:'ok',by:p.n};if(T.step>=H.set.goal){hFinish(T);return}}
  else{T.step=0;T.rs=(T.rs||0)+1;H.ev={n:en,ti:T.ti,k:'bad',by:p.n}}
  newQ(T);persist();bcast();hRaceUpdate()}
function hFinish(T){T.fin=1;T.cur=null;H.win=T.ti;H.ph='fin';H.t0=Date.now();persist(1);bcast();hRender()}
function rank(S){return S.T.map(function(t){return t.slice()}).sort(function(a,b){return(b[4]-a[4])||(b[1]-a[1])||(a[3]-b[3])})}
function membersHTML(S,ti,size){return S.ros.filter(function(r){return r[3]===ti&&!r[4]}).map(function(r){return '<span class="trmm" title="'+esc(r[1])+'">'+av(r[2],size,r[1])+'</span>'}).join('')}

/* --- tashkilotchi ko‘rinishlari --- */
function hRender(){if(!H)return;if(H.ph==='lobby')hLobby();else if(H.ph==='draw')hDrawV();else if(H.ph==='play')hRaceBuild();else if(H.ph==='fin')hFin()}
function hLobby(){var s=H.set;
  function seg(k,vals,suf){return '<div class="seg">'+vals.map(function(v){return '<button class="'+(s[k]===v?'on':'')+'" data-act="cfg" data-k="'+k+'" data-v="'+v+'">'+v+suf+'</button>'}).join('')+'</div>'}
  view(topbar('<b class="trchip">Kutish xonasi</b>')+'<div class="trc lobby"><div class="trjoin"><div class="trpin"><small>Qo‘shilish ID</small><b>'+pinFmt(H.pin)+'</b><button class="trb ghost sm" data-act="share">🔗 Havola</button></div><div id="trqr" class="trqr"></div></div>'+
    '<h2 class="trh">'+esc(H.title)+'</h2><div class="trset"><label>Jamoalar soni</label>'+seg('tc',[2,3,4,5],'')+'<label>Marragacha to‘g‘ri javoblar</label>'+seg('goal',[5,8,10,12],'')+'</div><div class="trnote" id="trnote"></div>'+
    '<div class="trcnt"><b id="trcnt">0</b> ishtirokchi</div><div class="trgrid" id="trgrid"></div><div class="trfoot"><button class="trb go" data-act="start" id="trstart" disabled>🎲 Jamoalarga bo‘lish va boshlash</button></div></div>');
  hLobbyUpdate();qr(joinUrl())}
function hLobbyUpdate(){var g=$('#trgrid');if(!g||!H)return;var l=ros().filter(function(r){return!r[4]});$('#trcnt').textContent=l.length;
  g.innerHTML=l.map(function(r){return '<div class="trpt">'+av(r[2],52,r[1])+'<b>'+esc(r[1])+'</b></div>'}).join('')||'<p class="trmut">Ishtirokchilar telefondan ID yoki QR orqali qo‘shiladi…</p>';obs(g);
  var b=$('#trstart');if(b)b.disabled=l.length<MINP;
  var nt=$('#trnote');if(nt){if(l.length<MINP)nt.innerHTML='Boshlash uchun kamida <b>'+MINP+'</b> ishtirokchi kerak';else{var tc=teamCount(l.length,H.set.tc);nt.innerHTML='<b>'+tc+'</b> jamoa · har birida taxminan <b>'+Math.floor(l.length/tc)+(l.length%tc?'–'+Math.ceil(l.length/tc):'')+'</b> kishi'}}}
function hDrawV(){var S=snap();
  view(topbar('<b class="trchip">Jamoalar tuzildi</b>')+'<div class="trc"><h2 class="trh big">Jamoalar tasodifiy tanlandi!</h2><p class="trmut c">Telefoningizdan jamoangizni ko‘ring. Poyga tez orada boshlanadi…</p><div class="trdraw">'+
    S.T.map(function(t,k){var T=tm(t[0]);return '<div class="trdc" style="--c:'+T.c+';animation-delay:'+(k*160)+'ms"><div class="trde">'+T.e+'</div><b>'+T.n+'</b><div class="trms">'+membersHTML(S,t[0],36)+'</div></div>'}).join('')+'</div></div>')}
var lastEv=0;
function hRaceBuild(){lastEv=H.ev?H.ev.n:0;var S=snap();
  view(topbar('<b class="trchip">Marra: '+H.set.goal+' ta to‘g‘ri javob</b>')+'<div class="trc race"><div class="trlanes">'+S.T.map(function(t){var T=tm(t[0]);
    return '<div class="trl" id="trl'+t[0]+'" style="--c:'+T.c+'"><div class="trln"><span class="e">'+T.e+'</span><b>'+T.n+'</b><span class="trms">'+membersHTML(S,t[0],26)+'</span><em id="trs'+t[0]+'">0/'+H.set.goal+'</em></div><div class="trtk"><i class="trfill" id="trf'+t[0]+'"></i><span class="trmk" id="trk'+t[0]+'" style="--p:0">'+T.e+'</span><u class="trflag">🏁</u></div></div>'}).join('')+'</div><div class="trfeed" id="trfeed"></div></div>');hRaceUpdate()}
function hRaceUpdate(){if(!H||H.ph!=='play')return;var lead=-1,max=0;
  H.T.forEach(function(T){if(T.step>max){max=T.step;lead=T.ti}});
  H.T.forEach(function(T){var p=Math.min(1,T.step/H.set.goal),k=$('#trk'+T.ti),f=$('#trf'+T.ti),s=$('#trs'+T.ti),l=$('#trl'+T.ti);if(!k)return;
    k.style.setProperty('--p',p);f.style.width=(p*100)+'%';s.textContent=T.step+'/'+H.set.goal;l.classList.toggle('lead',T.ti===lead&&max>0)});
  var ev=H.ev;if(ev&&ev.n!==lastEv){lastEv=ev.n;var l2=$('#trl'+ev.ti),T=tm(ev.ti),fd=$('#trfeed');
    if(l2){l2.classList.remove('ok','bad');void l2.offsetWidth;l2.classList.add(ev.k);after(1100,function(){var z=$('#trl'+ev.ti);if(z)z.classList.remove('ok','bad')})}
    if(fd){var d=document.createElement('div');d.className='trfe '+ev.k;d.style.setProperty('--c',T.c);d.innerHTML=ev.k==='ok'?'<b>'+T.e+' '+T.n+'</b> — to‘g‘ri javob topdi! ✅':'<b>'+T.e+' '+T.n+'</b> — xato variant bosildi, 0 ga tushdi 💥';fd.insertBefore(d,fd.firstChild);while(fd.children.length>3)fd.removeChild(fd.lastChild)}}}
function hFin(){var S=snap(),rk=rank(S),pod=[rk[1],rk[0],rk[2]].filter(Boolean),hh=[0,0,0];
  view(topbar('<b class="trchip">Yakun</b>')+'<div class="trc fin"><div class="trcf" aria-hidden="true">'+'🎉 🏆 ⭐ 🎊 ✨ 🥇'.split(' ').map(function(e,i){return '<i style="left:'+(8+i*17)+'%;animation-delay:'+(i*0.35)+'s">'+e+'</i>'}).join('')+'</div>'+
    '<h2 class="trh big">🏆 '+tm(rk[0][0]).n+' g‘olib!</h2><div class="trpod">'+pod.map(function(t){var pl=rk.indexOf(t)+1,T=tm(t[0]);return '<div class="trpc p'+pl+'" style="--c:'+T.c+'"><div class="trde">'+T.e+'</div><b>'+T.n+'</b><div class="trms">'+membersHTML(S,t[0],30)+'</div><em>'+t[1]+'/'+S.goal+'</em><small>💥 '+t[3]+' marta 0 ga tushdi</small><div class="trbar"><span>'+pl+'</span></div></div>'}).join('')+'</div><div class="trfoot"><button class="trb go" data-act="exitok">Yopish</button></div></div>')}

/* ===== ISHTIROKCHI ===== */
function join(s){if(H||P)return;
  P={pin:s.pin,pid:s.pid,n:s.n,a:s.a,got:false,S:null,i:0,q:null,sel:-1,sent:0,evn:0};
  lsSet(LSP,{pin:s.pin,pid:s.pid,n:s.n,a:s.a,ts:Date.now()});
  openOv();view(topbar()+'<div class="trcd"><div class="trspin"></div><p>O‘yinga ulanmoqda…</p></div>','pl');pNet()}
function pNet(){var me=P;netOpen(me.pin,pMsg,function(s){var bad=s==='CHANNEL_ERROR'||s==='TIMED_OUT'||s==='CLOSED';conn(bad&&P&&P.got);if(s==='SUBSCRIBED'&&P)pLoop()})}
function pHello(){if(P)send({t:'hi',p:P.pid,n:P.n,a:P.a,tr:1})}
function pLoop(){var me=P;clearInterval(me.hl);var k=0;pHello();me.hl=setInterval(function(){if(P!==me||me.got){clearInterval(me.hl);return}if(++k>=9){clearInterval(me.hl);pFail();return}pHello()},800)}
function pFail(){if(!P)return;view(topbar()+'<div class="trcd"><div class="em big">📡</div><h2>Tashkilotchi bilan aloqa yo‘q</h2><p>Internetni tekshiring yoki qayta urinib ko‘ring.</p><div class="trbtns"><button class="trb go" data-act="retry">↻ Qayta urinish</button><button class="trb ghost" data-act="exitok">Chiqish</button></div></div>','pl')}
function pResume(s){P={pin:s.pin,pid:s.pid,n:s.n,a:s.a,got:false,S:null,i:0,q:null,sel:-1,sent:0,evn:0};openOv();view(topbar()+'<div class="trcd"><div class="trspin"></div><p>O‘yinga qayta ulanmoqda…</p></div>','pl');pNet()}
function pMsg(m){if(!P)return;if(m.to&&m.to!==P.pid)return;
  if(m.t==='s'){if(m.to||P.got)pSnap(m)}
  else if(m.t==='q'){if(P.S&&P.S.ph==='play'&&m.ti===myTeam()){P.q={k:m.k,ti:m.ti,q:m.q,o:m.o};P.sel=-1;P.sent=0;pBody()}else P.pq=m}
  else if(m.t==='h'){P.lastH=Date.now();if(P.got&&P.S&&m.ph!==P.S.ph)pHello()}
  else if(m.t==='deny')leave(m.why==='full'?'Xona to‘ldi':'O‘yin boshlangan — qo‘shilib bo‘lmaydi');
  else if(m.t==='end'){if(P.S&&P.S.ph==='fin')P.over=true;else leave('Tashkilotchi o‘yinni tugatdi')}}
function myTeam(){if(!P||!P.S)return -1;for(var k=0;k<P.S.ros.length;k++)if(P.S.ros[k][0]===P.i)return P.S.ros[k][3];return -1}
function pSnap(m){var first=!P.got,prev=P.S;P.got=true;conn(false);if(m.you)P.i=m.you;P.S=m;lsSet(LSP,{pin:P.pin,pid:P.pid,n:P.n,a:P.a,ts:Date.now()});
  if(first||!prev||prev.ph!==m.ph){pRender();if(m.ph==='play'&&P.pq&&P.pq.ti===myTeam()){P.q={k:P.pq.k,ti:P.pq.ti,q:P.pq.q,o:P.pq.o};P.pq=null;pBody()}else if(m.ph==='play'&&!P.q)pHello();return}
  if(m.ph==='lobby')pLobbyUpdate();else if(m.ph==='play'){pStrip();pEvent(m.ev)}}
function pEvent(ev){if(!ev||ev.n===P.evn)return;P.evn=ev.n;if(ev.ti!==myTeam())return;
  var f=$('#trfx');if(!f)return;f.className='trfx '+ev.k;f.textContent=ev.k==='ok'?'✅ +1 qadam!':'💥 Jamoa 0 ga tushdi!';void f.offsetWidth;f.classList.add('on');setTimeout(function(){var z=$('#trfx');if(z)z.classList.remove('on')},1300)}
function pRender(){var S=P.S;if(!S)return;
  if(S.ph==='lobby')view(topbar('<b class="trchip">Kutish xonasi</b>')+'<div class="trc lobby"><div class="trcd"><div class="trme">'+av(P.a,84,P.n)+'<b>'+esc(P.n)+'</b></div><h2>Siz o‘yindasiz!</h2><p>Tashkilotchi boshlaganda jamoalar tasodifiy tuziladi.</p><div class="trcnt"><b id="trcnt">'+S.ros.length+'</b> ishtirokchi</div></div></div>','pl');
  else if(S.ph==='draw'){var ti=myTeam(),T=tm(ti<0?0:ti);view(topbar('<b class="trchip">Jamoangiz</b>')+'<div class="trc"><div class="trdraw one"><div class="trdc" style="--c:'+T.c+'"><div class="trde">'+T.e+'</div><b>'+T.n+'</b><div class="trms">'+membersHTML(S,ti,44)+'</div></div></div><div class="trrules"><p>🧩 Savolning to‘g‘ri javobi <b>faqat bir jamoadoshingizda</b> bor.</p><p>🗣️ Gaplashing — kimda to‘g‘ri variant bor?</p><p>💥 Xato variantni bossangiz, jamoa <b>0 ga tushadi</b>!</p></div></div>','pl')}
  else if(S.ph==='play'){view(topbar()+'<div class="trstrip" id="trstrip"></div><div class="trbody" id="trbody"></div><div class="trfx" id="trfx"></div>','pl play');pStrip();pBody();P.evn=S.ev?S.ev.n:0}
  else if(S.ph==='fin')pFin()}
function pLobbyUpdate(){var c=$('#trcnt');if(c&&P.S)c.textContent=P.S.ros.length}
function pStrip(){var s=$('#trstrip');if(!s||!P.S)return;var S=P.S,my=myTeam();
  s.innerHTML=S.T.map(function(t){var T=tm(t[0]),p=Math.min(100,Math.round(t[1]/S.goal*100));return '<div class="trst'+(t[0]===my?' me':'')+'" style="--c:'+T.c+'"><span>'+T.e+'</span><i><u style="width:'+p+'%"></u></i><b>'+t[1]+'</b></div>'}).join('')}
function pBody(){var b=$('#trbody');if(!b||!P.S||P.S.ph!=='play')return;var my=myTeam(),T=tm(my<0?0:my),S=P.S,st=my>=0&&S.T[my]?S.T[my][1]:0;
  if(!P.q){b.innerHTML='<div class="trcd"><div class="trspin"></div><p>Savol yuklanmoqda…</p></div>';return}
  b.innerHTML='<div class="trteam" style="--c:'+T.c+'">'+T.e+' '+T.n+' · <b>'+st+'/'+S.goal+'</b></div><div class="trq">'+esc(P.q.q)+'</div><div class="trog">'+P.q.o.map(function(t,j){return '<button class="trop '+CL[j%4]+(P.sel===j?' sel':'')+'" data-act="opt" data-v="'+j+'"><u>'+SHP[j%4]+'</u><span>'+esc(t)+'</span></button>'}).join('')+'</div><p class="trhint" id="trhint">'+(P.sent?'Tekshirilmoqda…':'To‘g‘ri javob sizda bo‘lmasligi mumkin — jamoadoshlar bilan maslahatlashing. Xato bossangiz jamoa 0 ga tushadi!')+'</p>';obs(b)}
function pOpt(j){if(!P||!P.q||P.sent||!P.S||P.S.ph!=='play')return;
  P.sel=j;P.sent=1;var k=P.q.k;send({t:'ans',p:P.pid,k:k,o:j});pBody();setTimeout(function(){if(P&&P.q&&P.q.k===k&&P.sent)pHello()},4000)}
function pFin(){var S=P.S,rk=rank(S),my=myTeam(),won=S.win===my;
  view(topbar('<b class="trchip">Yakun</b>')+'<div class="trc fin"><div class="trcd"><div class="em big">'+(won?'🏆':'🏁')+'</div><h2>'+(won?'Jamoangiz g‘olib!':tm(S.win).n+' g‘olib bo‘ldi')+'</h2></div><div class="trrank">'+rk.map(function(t,k){var T=tm(t[0]);return '<div class="trrk'+(t[0]===my?' me':'')+'" style="--c:'+T.c+'"><span class="n">'+(k+1)+'</span><span class="e">'+T.e+'</span><b>'+T.n+'</b><em>'+t[1]+'/'+S.goal+'</em></div>'}).join('')+'</div><div class="trfoot"><button class="trb go" data-act="exitok">Yopish</button></div></div>','pl')}

/* ===== bosishlar ===== */
function onClick(e){var m=$('#trmod');if(e.target===m){modalClose();return}
  var b=e.target.closest('[data-act]');if(!b)return;var a=b.dataset.act,v=b.dataset.v;
  switch(a){
    case'exit':askExit();break;case'mclose':modalClose();break;case'exitok':leave();break;
    case'cfg':if(H&&H.ph==='lobby'){H.set[b.dataset.k]=+v;persist();hLobby()}break;
    case'start':hStart();break;case'opt':pOpt(+v);break;
    case'share':if(H){var url=joinUrl();if(navigator.share&&/Android|iPhone|iPad/i.test(navigator.userAgent||''))navigator.share({title:'Jamoaviy jang',url:url}).catch(function(){});else if(navigator.clipboard)navigator.clipboard.writeText(url).then(function(){say('Havola nusxalandi')},function(){say(url)});else say(url)}break;
    case'retry':if(P){var s={pin:P.pin,pid:P.pid,n:P.n,a:P.a};netClose();clearInterval(P.hl);P=null;pResume(s)}break}}

/* ===== ochiq API ===== */
window.TeamRace={host:host,join:function(s){setTimeout(function(){join(s)},0)},active:function(){return !!(H||P)},open:function(){if(H||P)openOv()},_t:{usable:usable,teamCount:teamCount,split:split,buildOpts:buildOpts,poolFor:poolFor,rank:rank}};
function boot(){if(LQ().active&&LQ().active())return;if(window.League&&window.League.active&&window.League.active())return;var h=ls(LSH),p=ls(LSP);
  if(h&&h.pin&&h.ph!=='fin'&&Date.now()-h.ts<STALE){H=h;hBoot();return}else if(h)lsDel(LSH);
  if(p&&p.pin&&Date.now()-p.ts<STALE){pResume(p);return}else if(p)lsDel(LSP)}
if(typeof document!=='undefined'&&document.body)setTimeout(boot,500);

/* ===== uslublar ===== */
var CSS='.trx{position:fixed;inset:0;z-index:95;color:#fff;font-family:Nunito,system-ui,sans-serif;font-weight:700;background:radial-gradient(120% 80% at 50% 0,#27307F 0,#0E1034 62%);overflow:hidden;-webkit-user-select:none;user-select:none}.trx[hidden]{display:none}.trx *{box-sizing:border-box;margin:0}.trx button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}'+
'.trm{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;padding:0 0 28px;-webkit-overflow-scrolling:touch}'+
'.trt{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(14,16,52,.82);backdrop-filter:blur(8px)}.trt .sp{flex:1}'+
'.trib{width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.12);font-size:16px}.trpill{background:linear-gradient(135deg,#FF6F61,#FFA06B);padding:5px 12px;border-radius:99px;font-size:12px;font-weight:900;letter-spacing:.04em}.trchip{background:rgba(255,255,255,.14);padding:4px 11px;border-radius:99px;font-size:13px}'+
'.trc{max-width:980px;margin:0 auto;padding:14px 16px;display:flex;flex-direction:column;gap:14px;align-items:stretch}.trh{font:800 26px/1.1 "Baloo 2",Nunito,sans-serif;text-align:center}.trh.big{font-size:clamp(28px,5vw,44px)}.trmut{opacity:.7;text-align:center;font-size:14px}.trmut.c{margin-top:-6px}'+
'.trb{padding:14px 22px;border-radius:16px;background:#4B6BFF;font-weight:800;font-size:16px;box-shadow:0 4px 0 rgba(0,0,0,.25)}.trb.go{background:linear-gradient(135deg,#27C99A,#1AA9CC)}.trb.bad{background:#E5484D}.trb.ghost{background:rgba(255,255,255,.14);box-shadow:none}.trb.sm{padding:6px 12px;font-size:13px;border-radius:12px}.trb:disabled{opacity:.45;cursor:default}'+
'.trjoin{display:flex;align-items:center;justify-content:center;gap:22px;flex-wrap:wrap}.trpin{display:grid;gap:6px;justify-items:center}.trpin small{opacity:.7;font-size:13px}.trpin b{font:800 clamp(40px,8vw,64px)/1 "Baloo 2";letter-spacing:.08em}.trqr{width:150px;height:150px;background:#fff;border-radius:16px;padding:6px;display:grid;place-items:center;color:#1B2150;font-size:11px;word-break:break-all}.trqr svg{width:100%;height:100%}'+
'.trset{display:grid;gap:8px;justify-items:center;font-size:14px}.trset label{opacity:.75;margin-top:4px}.seg{display:flex;gap:6px}.seg button{min-width:48px;padding:8px 14px;border-radius:12px;background:rgba(255,255,255,.12);font-weight:800}.seg button.on{background:#FFC53D;color:#3F2E00}.trnote{text-align:center;font-size:14px;opacity:.9;min-height:20px}.trcnt{text-align:center;font-size:15px}.trcnt b{font-size:22px}'+
'.trgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:10px;justify-items:center}.trpt{display:grid;justify-items:center;gap:4px;font-size:12px;text-align:center;animation:trpop .35s}.trpt b{max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.trfoot{display:flex;justify-content:center;padding-top:6px}'+
'.trdraw{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}.trdraw.one{grid-template-columns:1fr;max-width:340px;margin:0 auto;width:100%}.trdc{background:rgba(255,255,255,.08);border:2px solid var(--c);border-radius:22px;padding:16px;display:grid;justify-items:center;gap:8px;animation:trpop .5s both;box-shadow:0 0 28px color-mix(in srgb,var(--c) 40%,transparent)}.trdc b{font:800 20px "Baloo 2";color:var(--c)}.trde{font-size:46px;line-height:1}.trms{display:inline-flex;flex-wrap:wrap;justify-content:center;gap:4px}.trmm{display:inline-block}'+
'.trrules{display:grid;gap:8px;font-size:15px;text-align:center;background:rgba(255,255,255,.08);border-radius:18px;padding:14px}'+
'.trlanes{display:grid;gap:12px}.trl{background:rgba(255,255,255,.07);border:2px solid color-mix(in srgb,var(--c) 55%,transparent);border-radius:20px;padding:12px 14px;transition:box-shadow .3s,background .3s}.trl.lead{box-shadow:0 0 0 3px #FFC53D}.trl.ok{background:color-mix(in srgb,#27C99A 28%,transparent)}.trl.bad{background:color-mix(in srgb,#E5484D 35%,transparent);animation:trshake .5s}'+
'.trln{display:flex;align-items:center;gap:10px;margin-bottom:10px}.trln .e{font-size:26px}.trln b{font:800 20px "Baloo 2";color:var(--c)}.trln .trms{margin-left:6px;flex:1;justify-content:flex-start}.trln em{font:800 22px "Baloo 2";font-style:normal}'+
'.trtk{position:relative;height:30px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden}.trfill{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 40%,transparent),var(--c));border-radius:99px;transition:width .5s cubic-bezier(.3,1.2,.4,1)}.trmk{position:absolute;top:1px;left:calc(var(--p)*(100% - 30px));font-size:24px;line-height:28px;transition:left .5s cubic-bezier(.3,1.2,.4,1)}.trflag{position:absolute;right:6px;top:3px;text-decoration:none;font-size:20px}'+
'.trfeed{display:grid;gap:6px;min-height:100px}.trfe{background:rgba(255,255,255,.1);border-left:4px solid var(--c);border-radius:10px;padding:8px 12px;font-size:15px;animation:trpop .35s}.trfe b{color:var(--c)}'+
'.trpod{display:flex;align-items:flex-end;justify-content:center;gap:12px;flex-wrap:wrap}.trpc{width:min(220px,30%);min-width:150px;background:rgba(255,255,255,.08);border:2px solid var(--c);border-radius:20px 20px 0 0;padding:12px 10px 0;display:grid;justify-items:center;gap:6px;text-align:center}.trpc b{font:800 18px "Baloo 2";color:var(--c)}.trpc em{font:800 24px "Baloo 2";font-style:normal}.trpc small{opacity:.75;font-size:12px}.trbar{width:calc(100% + 20px);margin:6px -10px 0;background:var(--c);color:#fff;font:800 30px "Baloo 2";padding:8px 0}.trpc.p1 .trbar{padding:22px 0}.trpc.p2 .trbar{padding:14px 0}.trpc.p3 .trbar{padding:6px 0}'+
'.trcf{position:absolute;inset:0;pointer-events:none;overflow:hidden}.trcf i{position:absolute;top:-30px;font-style:normal;font-size:30px;animation:trfall 4s linear infinite}'+
'.trcd{display:grid;justify-items:center;gap:10px;text-align:center;padding:30px 20px}.trcd h2{font:800 24px "Baloo 2"}.trcd p{opacity:.8}.em{font-size:44px}.em.big{font-size:64px}.trme{display:grid;justify-items:center;gap:8px;font-size:18px}.trspin{width:44px;height:44px;border-radius:50%;border:5px solid rgba(255,255,255,.2);border-top-color:#fff;animation:trrot .8s linear infinite}.trbtns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}'+
'.trstrip{position:sticky;top:58px;z-index:2;display:grid;gap:5px;padding:8px 12px;background:rgba(14,16,52,.82);backdrop-filter:blur(8px)}.trst{display:flex;align-items:center;gap:8px;font-size:12px;opacity:.85}.trst.me{opacity:1}.trst span{font-size:16px}.trst i{flex:1;height:9px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden}.trst u{display:block;height:100%;background:var(--c);border-radius:99px;transition:width .5s}.trst.me i{height:12px;box-shadow:0 0 0 2px var(--c)}.trst b{min-width:18px;text-align:right}'+
'.trbody{max-width:640px;margin:0 auto;padding:10px 14px;display:grid;gap:12px}.trteam{text-align:center;font-size:15px;color:var(--c);background:rgba(255,255,255,.08);border-radius:99px;padding:6px 12px;justify-self:center}.trq{font:800 clamp(20px,5vw,28px)/1.2 "Baloo 2",Nunito,sans-serif;text-align:center;background:rgba(255,255,255,.08);border-radius:18px;padding:16px}'+
'.trog{display:grid;gap:10px}.trop{display:flex;align-items:center;gap:12px;text-align:left;padding:16px;border-radius:16px;font-size:17px;font-weight:800;box-shadow:0 4px 0 rgba(0,0,0,.28);transition:transform .12s}.trop u{text-decoration:none;opacity:.85}.trop.a{background:#E5484D}.trop.b{background:#2D7BFF}.trop.c{background:#E0A100}.trop.d{background:#1FA97A}.trop.sel{transform:scale(1.03);outline:4px solid #fff}.trop:active{transform:scale(.98)}'+
'.trhint{text-align:center;font-size:13px;opacity:.8;min-height:34px}'+
'.trfx{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%) scale(.6);padding:16px 26px;border-radius:20px;font:800 26px "Baloo 2";opacity:0;pointer-events:none;z-index:6;transition:opacity .2s,transform .25s}.trfx.on{opacity:1;transform:translate(-50%,-50%) scale(1)}.trfx.ok{background:#1FA97A}.trfx.bad{background:#E5484D}'+
'.trrank{display:grid;gap:8px;max-width:420px;margin:0 auto;width:100%}.trrk{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.08);border-left:5px solid var(--c);border-radius:14px;padding:10px 14px}.trrk.me{background:rgba(255,255,255,.18)}.trrk .n{font:800 20px "Baloo 2";width:22px}.trrk .e{font-size:24px}.trrk b{flex:1;color:var(--c);font-weight:800}.trrk em{font-style:normal;font-weight:800}'+
'.trmod{position:absolute;inset:0;z-index:20;background:rgba(5,6,24,.6);display:grid;place-items:center;padding:20px}.trmod[hidden]{display:none}.trmb{background:#1B2150;border-radius:22px;padding:22px;max-width:360px;width:100%;display:grid;gap:12px;text-align:center}.trmb h3{font:800 22px "Baloo 2"}.trconn{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:30;background:#E0A100;color:#2B1F00;padding:8px 14px;border-radius:12px;font-size:13px}.trconn[hidden]{display:none}'+
'@keyframes trpop{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}@keyframes trshake{25%{transform:translateX(-8px)}50%{transform:translateX(8px)}75%{transform:translateX(-5px)}}@keyframes trrot{to{transform:rotate(1turn)}}@keyframes trfall{to{transform:translateY(110vh) rotate(360deg)}}'+
'@media(prefers-reduced-motion:reduce){.trx *{animation:none!important;transition:none!important}}';
})();
