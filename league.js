/* InterDars \u2014 Chempionlar ligasi: 1x1 play-off turniri (BYE, duel savollari, Quyish dueli).
   live.js bilan bir xil ID/kanal (Supabase Realtime Broadcast). live.js'dan keyin yuklanadi. */
(function(){
'use strict';
if(window.League)return;
var LSH='idLgHost',LSP='idLgPlayer',MAXP=64,STALE=3*3600*1000;
var GX=12,GY0=14,GW=76,GH=32,GL=46,BX=50,BY=104,KX=50,KY=40,SHP=['\u25b2','\u25c6','\u25cf','\u25a0'];

/* ===== yordamchilar ===== */
function $(s,r){return (r||document).querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ls(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function lsDel(k){try{localStorage.removeItem(k)}catch(e){}}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function cleanName(s){s=String(s||'').replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,20);return s||'Ishtirokchi'}
function LQ(){return window.LiveQuiz||{}}
function say(m){if(LQ().say)LQ().say(m)}
function av(a,s,n){return LQ().av?LQ().av(a,s,n,true):'<span class="jq-av" style="--s:'+s+'px;background:#4B6BFF"><span class="jq-av-initial">'+esc(String(n||'?').charAt(0))+'</span></span>'}
function obs(r){if(LQ().observe&&r)LQ().observe(r)}
function pinFmt(p){return p.slice(0,3)+' '+p.slice(3)}
function rname(size){return size===2?'Final':size===4?'Yarim final':size===8?'Chorak final':'1/'+(size/2)+' final'}
var TM=[];function after(ms,fn){var t=setTimeout(fn,ms);TM.push(t);return t}
var IT=0,lastActivity=0,pourTimer=0,pourMonitorAt=0,hostTimerFrame=0;
document.addEventListener('visibilitychange',function(){if(document.hidden){stopPourFlow();if(P&&P.pourGame)P.pourGame.pauseUntilInput=true}else if((H&&H.ph==='pour'||P&&P.S&&P.S.ph==='pour')&&Date.now()-lastActivity>=600000)leave('Faolsizlik sabab xona yopildi');else if(P&&P.pourGame)refreshPour(P.pourGame)});
/* ===== turnir mantiqi: bracket va BYE ===== */
function mkm(a,b,st,third){var m={a:a,b:b,st:st,sa:0,sb:0,w:0,l:0};if(st==='bye')m.w=a;if(third)m.third=1;return m}
/* N ishtirokchi \u2192 M=2^k, B=M-N ta BYE; BYE olganlar 1-bosqichda raqibsiz o'tadi */
function mkBracket(ids){var N=ids.length,M=1;while(M<N)M*=2;var R=Math.round(Math.log(M)/Math.LN2),B=M-N,a=shuffle(ids.slice()),sl=[],i;
  for(i=0;i<B;i++)sl.push(mkm(a[i],0,'bye'));
  for(i=B;i<N;i+=2)sl.push(mkm(a[i],a[i+1],'wait'));
  shuffle(sl);var rs=[sl];
  for(i=1;i<R;i++){var c=M/Math.pow(2,i+1),r=[];for(var j=0;j<c;j++)r.push(mkm(0,0,'wait'));rs.push(r)}
  return{M:M,R:R,B:B,rounds:rs}}
/* ===== tarmoq ===== */
var NET={ch:null,ok:false};
function netOpen(pin,onMsg,onSt){netClose();var sb=window.sb;if(!sb||!sb.channel)return false;
  var ch=sb.channel('idlive-'+pin,{config:{broadcast:{self:false,ack:false}}});
  ch.on('broadcast',{event:'m'},function(e){try{if(NET.ch===ch)onMsg(e.payload||{})}catch(err){console.warn('league',err)}});
  ch.subscribe(function(s){if(NET.ch!==ch)return;NET.ok=s==='SUBSCRIBED';onSt(s)});NET.ch=ch;return true}
function netClose(d){var ch=NET.ch;NET.ch=null;NET.ok=false;if(!ch)return;setTimeout(function(){try{window.sb.removeChannel(ch)}catch(e){}},d||0)}
function send(p){var ch=NET.ch;if(!ch)return;if(ch.state?ch.state!=='joined':!NET.ok)return;try{var r=ch.send({type:'broadcast',event:'m',payload:p});if(r&&r.catch)r.catch(function(){})}catch(e){}}

/* ===== overlay + qo'riqlash ===== */
var R=null,M=null,H=null,P=null,HT=0,guard=false,WL=null;
function mount(){if(R)return;var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  R=document.createElement('div');R.className='lgx';R.hidden=true;R.setAttribute('role','dialog');R.setAttribute('aria-label','Chempionlar ligasi');
  R.innerHTML='<div class="lgm" id="lgm"></div><div class="lgmod" id="lgmod" hidden></div><div class="lgconn" id="lgconn" hidden>\u26a0\ufe0f Aloqa uzildi \u2014 qayta ulanmoqda\u2026</div>';
  document.body.appendChild(R);M=$('#lgm');R.addEventListener('click',onClick)}
function openOv(){mount();R.hidden=false;document.body.style.overflow='hidden';guardOn();lastActivity=Date.now();['pointerdown','pointermove','keydown','click','touchstart','touchmove'].forEach(function(e){document.addEventListener(e,onActivity,true)});clearInterval(IT);IT=setInterval(function(){if(!H&&!P)return;var pouring=(H&&H.ph==='pour')||(P&&P.S&&P.S.ph==='pour');if(pouring&&Date.now()-lastActivity>=600000)leave('Faolsizlik sabab xona yopildi')},1000)}
function onActivity(){lastActivity=Date.now()}
function closeOv(){if(R)R.hidden=true;document.body.style.overflow='';guardOff();clearInterval(IT);IT=0;['pointerdown','pointermove','keydown','click','touchstart','touchmove'].forEach(function(e){document.removeEventListener(e,onActivity,true)});TM.forEach(clearTimeout);TM=[]}
function view(h,cls){M.className='lgm '+(cls||'');M.innerHTML=h;obs(M)}
function modal(h,k){var m=$('#lgmod');m.dataset.k=k||'';m.innerHTML='<div class="lgmb">'+h+'</div>';m.hidden=false}
function modalClose(){var m=$('#lgmod');if(m){m.hidden=true;m.innerHTML='';m.dataset.k=''}}
function conn(bad){var c=$('#lgconn');if(c)c.hidden=!bad}
function guardOn(){if(guard)return;guard=true;try{if(!(history.state&&history.state.lg))history.pushState({lg:1},'',location.href)}catch(e){}
  window.addEventListener('popstate',onPop);window.addEventListener('beforeunload',onUnload)}
function guardOff(){if(!guard)return;guard=false;window.removeEventListener('popstate',onPop);window.removeEventListener('beforeunload',onUnload);try{if(history.state&&history.state.lg)history.back()}catch(e){}}
function onPop(){if(!guard)return;try{history.pushState({lg:1},'',location.href)}catch(e){}askExit()}
function onUnload(e){if(!guard)return;e.preventDefault();e.returnValue='';return ''}
function askExit(){if(!(H||P))return;if((H&&H.ph==='fin')||(P&&P.S&&P.S.ph==='fin')){leave();return}if($('#lgmod').dataset.k==='exit')return;
  modal('<div class="em">\u26a0\ufe0f</div><h3>'+(H?'Turnirni tugatasizmi?':'Turnirdan chiqasizmi?')+'</h3><p>'+(H?'Turnir barcha ishtirokchilar uchun to\u2018xtaydi.':'Siz turnirdan chiqib ketasiz.')+'</p><div class="lgbtns"><button class="lgb ghost" data-act="mclose">Qolish</button><button class="lgb bad" data-act="exitok">'+(H?'Tugatish':'Chiqish')+'</button></div>','exit')}
function leave(msg){stopPourFlow();if(H){send({t:'end'});clearInterval(HT);H=null;lsDel(LSH)}
  if(P){send({t:'bye',p:P.pid});clearInterval(P.hl);clearInterval(P.tm);P=null;lsDel(LSP)}
  netClose(350);modalClose();closeOv();if(msg)say(msg)}
function topbar(extra){return '<div class="lgt"><button class="lgib" data-act="exit" aria-label="Chiqish">✕</button><span class="lgpill">🏆 CHEMPIONLAR LIGASI</span>'+(extra||'')+'<span class="sp"></span></div>'}

/* ===== umumiy ko'rinishlar ===== */
function rosMap(S){var o={};(S.ros||[]).forEach(function(r){o[r[0]]=r});return o}
function mbox(m,ros,me,d){var A=m[0],B=m[1],st=m[5];
  function row(i,sc){var r=ros[i];return '<div class="lgr'+(i&&i===me?' me':'')+(i&&m[2]===i?' win':'')+'">'+(i?'<span>'+esc(r?r[1]:'?')+'</span><em>'+(st>=2?sc:'')+'</em>':'<span class="q">\u2014</span>')+'</div>'}
  return '<div class="lgmx'+(st===3?' pour':'')+'" style="animation-delay:'+(d||0)+'ms">'+row(A,m[3])+(st===1?'<div class="lgr bye">\ud83c\udf9f\ufe0f BYE</div>':row(B,m[4]))+(st===3?'<i>🥤</i>':'')+'</div>'}
function brHTML(S,me){var ros=rosMap(S),d=0;
  return '<div class="lgbr">'+S.br.map(function(r,ri){var t=ri===S.R-1?(r.length>1?'Final va 3-o\u2018rin':'Final'):rname(Math.pow(2,S.R-ri));
    return '<div class="lgcol'+(ri===S.ri?' cur':'')+'"><h4>'+t+'</h4>'+r.map(function(m){return mbox(m,ros,me,(d+=40))}).join('')+'</div>'}).join('')+'</div>'}
function optsHTML(S,my,rev){return S.a.map(function(t,i){var cl='lgop o'+i;if(rev){cl+=i===S.c?' ok':(i===my?' no':' dim')}else if(my>=0)cl+=i===my?' sel':' dim';
  return '<button class="'+cl+'"'+(rev?' disabled':' data-act="ans" data-v="'+i+'"')+'><u>'+SHP[i]+'</u><span>'+esc(t)+'</span></button>'}).join('')}
function vsBar(a,b,sc){return '<div class="lgvs">'+'<div class="s">'+av(a?a[2]:-1,46,a?a[1]:'')+'<b>'+esc(a?a[1]:'?')+'</b></div><div class="sc"><em>'+sc[0]+'</em><span>:</span><em>'+sc[1]+'</em></div><div class="s">'+av(b?b[2]:-1,46,b?b[1]:'')+'<b>'+esc(b?b[1]:'?')+'</b></div></div>'}
function podium(S){var ros=rosMap(S),f=S.fin||[],nm=function(i){var r=ros[i];return r?'<div class="pp">'+av(r[2],56,r[1])+'<b>'+esc(r[1])+'</b></div>':'<div class="pp"></div>'};
  return '<div class="lgpod"><div class="c s2">'+nm(f[1])+'<div class="bar">2</div></div><div class="c s1"><div class="cup">\ud83c\udfc6</div>'+nm(f[0])+'<div class="bar">1</div></div><div class="c s3">'+nm(f[2])+'<div class="bar">3</div></div></div>'+(f[3]?'<div class="lg4">4-o\u2018rin: <b>'+esc((ros[f[3]]||[0,'?'])[1])+'</b></div>':'')}

/* =====================  TASHKILOTCHI  ===================== */
function ok(x){return x.a&&x.a.length>=2&&x.c!=null&&(!x.k||x.k==='mcq'||x.k==='tf')}
function host(l){
  if(!l||!l.qs){say('Savollar topilmadi');return false}
  if(!window.sb||!window.sb.channel){say('Jonli rejim uchun internet kerak');return false}
  if(H||P){openOv();return true}
  if(LQ().active&&LQ().active()){LQ().open&&LQ().open();return true}
  var src=l.qs.filter(ok).map(function(x){return{q:x.q,a:x.a.slice(),c:x.c,k:x.k==='tf'?'tf':'mcq'}});
  if(src.length<2){say('Kamida 2 ta test savoli kerak');return false}
  H={v:1,pin:String(100000+Math.floor(Math.random()*900000)),lid:l.id,title:l.title,src:src,set:{time:15,nq:5},ph:'lobby',pl:{},n:0,ri:-1,qi:-1,t0:0,dur:0,rounds:[],ts:Date.now()};
  hBoot();return true}
function hBoot(){openOv();
  netOpen(H.pin,hMsg,function(s){var bad=s==='CHANNEL_ERROR'||s==='TIMED_OUT'||s==='CLOSED';conn(bad);if(s==='SUBSCRIBED')bcast()});
  persist(1);hRender();clearInterval(HT);var hb=0;HT=setInterval(function(){hTick();if(++hb%13===0&&H)send({t:'h',ph:H.ph,qi:H.qi,ri:H.ri})},500)}
var persT=0;function persist(now){if(!H)return;clearTimeout(persT);if(now){H.ts=Date.now();lsSet(LSH,H)}else persT=setTimeout(function(){if(H){H.ts=Date.now();lsSet(LSH,H)}},300)}
function byI(i){for(var k in H.pl)if(H.pl[k].i===i)return H.pl[k];return null}
function ros(){return Object.keys(H.pl).map(function(k){return H.pl[k]}).sort(function(a,b){return a.i-b.i}).map(function(p){return[p.i,p.n,p.a]})}
function snap(){var n=Date.now(),o={ph:H.ph,ttl:H.title,R:H.R||0,ri:H.ri,nq:H.nq||0,qi:H.qi,dur:H.dur,rem:Math.max(0,H.t0+H.dur-n),rn:H.rn||'',ros:ros()};
  if(H.ph!=='lobby'&&H.rounds.length)o.br=H.rounds.map(function(r){return r.map(function(m){var pr=m.pour,x=[m.a,m.b,m.w,m.sa,m.sb,m.st==='bye'?1:m.st==='duel'?2:m.st==='pour'?3:m.st==='done'?4:0,m.third?1:0,pr?[pr.turn,pr.starter,pr.results.map(function(v){return v?[Math.round(v.fill*10)/10,v.spilled?1:0,Math.round(v.overflow*10)/10,Math.round(v.ms/1000)]:0}),pr.state||null]:0,m.ok||0];return x})});
  if((H.ph==='q'||H.ph==='rev')&&H.cq){o.q=H.cq.q;o.a=H.cq.a;if(H.ph==='rev')o.c=H.cq.c}
  if(H.ph==='fin')o.fin=H.fin;return o}
var bT=0;function bcast(){if(!H||bT)return;bT=setTimeout(function(){bT=0;if(H)send(Object.assign({t:'s'},snap()))},90)}
function rosDirty(){bcast();if(H&&H.ph==='lobby')hLobbyUpdate();persist()}
function hMsg(m){if(!H||!m)return;
  if(m.t==='hi'){var id=String(m.p||'');if(id.length<6||id.length>20)return;var p=H.pl[id],nm=cleanName(m.n),a=m.a==null?-1:+m.a;
    if(!p){if(H.ph!=='lobby'){send({t:'deny',to:id,why:'late'});return}
      if(Object.keys(H.pl).length>=MAXP){send({t:'deny',to:id,why:'full'});return}
      p=H.pl[id]={i:++H.n,n:nm,a:a};rosDirty()}
    else{if(p.n!==nm||p.a!==a){p.n=nm;p.a=a;rosDirty()}if(p.gone){p.gone=false;rosDirty()}}
    if(m.lg)send(Object.assign({t:'s',to:id,you:p.i},snap()));else send({t:'lg',to:id});persist()}
  else if(m.t==='ans')hAns(m);else if(m.t==='plive')hPourLive(m);else if(m.t==='pturn')hPourTurn(m);else if(m.t==='pour')hPourResult(m);
  else if(m.t==='bye'){var q=H.pl[m.p];if(q){if(H.ph==='lobby')delete H.pl[m.p];else q.gone=true;rosDirty()}}}
function prepQ(x){var o=x.a.map(function(t,i){return{t:t,i:i}});if(x.k!=='tf')shuffle(o);return{q:x.q,a:o.map(function(z){return z.t}),c:o.map(function(z){return z.i}).indexOf(x.c)}}
function hDraw(){if(!H||H.ph!=='lobby')return;
  Object.keys(H.pl).forEach(function(k){if(H.pl[k].gone)delete H.pl[k]});
  var ids=Object.keys(H.pl).map(function(k){return H.pl[k].i});if(ids.length<2){say('Kamida 2 ishtirokchi kerak');return}
  var b=mkBracket(ids);H.M=b.M;H.R=b.R;H.B=b.B;H.rounds=b.rounds;H.bronze=0;H.ri=-1;
  var q=shuffle(H.src.slice()),nq=Math.max(1,Math.min(H.set.nq,Math.floor(q.length/H.R))),need=nq*H.R;H.nq=nq;H.warn=q.length<need?1:0;H.queue=[];
  for(var i=0;i<need;i++){if(i>0&&i%q.length===0)shuffle(q);H.queue.push(q[i%q.length])}
  H.ph='draw';H.t0=Date.now();H.dur=0;H.rn='Qur\u2018a';persist(1);bcast();hRender();}
function hRoundStart(){H.ri++;var r=H.rounds[H.ri];H.rn=r.length>1&&H.ri===H.R-1?'Final va 3-o\u2018rin':rname(H.M/Math.pow(2,H.ri));
  r.forEach(function(m){if(m.st==='wait'){m.st='duel';m.sa=m.sb=0}});
  H.qs=H.queue.slice(H.ri*H.nq,(H.ri+1)*H.nq);H.qi=-1;H.ph='pre';H.t0=Date.now();H.dur=3800;persist(1);bcast();hRender();}
function hQStart(){H.qi++;H.cq=prepQ(H.qs[H.qi]);H.an={};H.ph='q';H.t0=Date.now();H.dur=H.set.time*1000;persist(1);bcast();hRender()}
function duels(){return H.rounds[H.ri].filter(function(m){return m.st==='duel'})}
function allAns(){return duels().every(function(m){var a=byI(m.a),b=byI(m.b);return(H.an[m.a]!=null||!a||a.gone)&&(H.an[m.b]!=null||!b||b.gone)})}
function hAns(m){if(H.ph!=='q'||m.qi!==H.ri*100+H.qi)return;var p=H.pl[m.p];if(!p)return;var d=duels().some(function(x){return x.a===p.i||x.b===p.i});if(!d)return;
  var c=+m.c;if(!(c>=0&&c<H.cq.a.length))return;if(H.an[p.i]==null)H.an[p.i]=c;send({t:'k',to:m.p});hCards()}
function hReveal(){var c=H.cq.c;duels().forEach(function(m){var x=H.an[m.a]===c?1:0,y=H.an[m.b]===c?1:0;m.sa+=x;m.sb+=y;m.ok=[x,y]});
  if(H.qi>=H.nq-1){hRoundQEnd();return}
  H.ph='rev';H.t0=Date.now();H.dur=2800;persist(1);bcast();hRender();}
function hRoundQEnd(){var tied=false;
  duels().forEach(function(m){m.ok=0;if(m.sa!==m.sb){m.w=m.sa>m.sb?m.a:m.b;m.l=m.sa>m.sb?m.b:m.a;m.st='done'}
    else{var starter=Math.random()<.5?0:1;m.st='pour';m.pour={turn:starter,starter:starter,results:[null,null],state:{currentPlayer:starter+1,glassFill:0,bottleFill:85,progress:0,turnStartFill:0,hasPouredThisTurn:false,isPouring:false,pourRate:0,wavePhase:0,waveAmplitude:0,bottleSloshPhase:0,bottleSloshAmp:0,lastTiltRad:0,gameOver:false}};tied=true}});
  if(tied){H.ph='tie';H.t0=Date.now();H.dur=5000;persist(1);bcast();hRender()}else hRoundDone()}
function startPourPhase(){if(!H||H.ph!=='tie')return;H.ph='pour';H.t0=Date.now();H.dur=0;persist(1);bcast();hRender()}
function hRoundDone(){var r=H.rounds[H.ri];
  if(H.ri>=H.R-1){hFinal();return}
  var nx=H.rounds[H.ri+1];nx.forEach(function(m,s){if(!m.third){m.a=r[2*s].w;m.b=r[2*s+1].w}});
  if(H.ri===H.R-2){var l0=r[0].l,l1=r[1].l;if(l0&&l1)nx.push(mkm(l0,l1,'wait',1));else H.bronze=l0||l1||0}
  H.ph='res';H.t0=Date.now();H.dur=0;persist(1);bcast();hRender()}
function hFinal(){var r=H.rounds[H.R-1],f=r[0],t=r[1];H.fin=[f.w,f.l,t?t.w:H.bronze,t?t.l:0];H.ph='fin';H.t0=Date.now();H.dur=0;persist(1);bcast();hRender();}
function hTick(){if(!H)return;var n=Date.now(),ph=H.ph;
  if(ph==='pre'&&n>=H.t0+H.dur)hQStart();
  else if(ph==='q'){var rem=H.t0+H.dur-n;if(rem<=0||allAns())hReveal();else{var b=$('#lgbari'),s=$('#lgsec');if(b)b.style.width=(rem/H.dur*100)+'%';if(s)s.textContent=Math.ceil(rem/1000)}}
  else if(ph==='rev'&&n>=H.t0+H.dur){if(H.qi<H.nq-1)hQStart();else hRoundQEnd()}
  else if(ph==='tie'&&n>=H.t0+H.dur)startPourPhase()
  }
/* ----- quyish duelining hakamligi ----- */
function pourMatch(mi){var r=H.rounds[mi&&mi[0]];return r&&r[mi[1]]}
function pourWinner(p){var a=p.results[0],b=p.results[1],w=null;
  if(a.spilled!==b.spilled)w=a.spilled?1:0;
  else if(a.spilled&&b.spilled){if(a.overflow!==b.overflow)w=a.overflow<b.overflow?0:1}
  else if(Math.abs(a.fill-b.fill)>0.1)w=a.fill>b.fill?0:1;
  return w==null?p.starter:w}
function hPourResult(msg){if(!H||H.ph!=='pour'||!msg||!Array.isArray(msg.mi))return;
  var mt=pourMatch(msg.mi),pl=H.pl[msg.p];if(!mt||!pl||mt.st!=='pour'||!mt.pour)return;
  var side=pl.i===mt.a?0:pl.i===mt.b?1:-1,p=mt.pour;if(side<0||side!==p.turn||p.results[side])return;lastActivity=Date.now();
  var raw=msg.r||{},fill=+raw.fill,overflow=+raw.overflow,ms=+raw.ms;
  if(!isFinite(fill)||!isFinite(overflow)||!isFinite(ms))return;
  var spilled=!!raw.spilled||overflow>0.05;
  p.results[side]={fill:Math.round(clamp(fill,0,100)*10)/10,spilled:spilled,overflow:spilled?Math.round(clamp(overflow,0,100)*10)/10:0,ms:Math.round(clamp(ms,0,90000))};p.live=null;
  if(spilled){mt.w=side===0?mt.b:mt.a;mt.l=side===0?mt.a:mt.b;mt.st='done';if(H.rounds[H.ri].every(function(m){return m.st==='done'||m.st==='bye'})){hRoundDone();return}persist(1);bcast();hRender();return}
  if(!(p.results[0]&&p.results[1])){p.turn=1-side;persist(1);bcast();hRender();return}
  var win=pourWinner(p);mt.w=win===0?mt.a:mt.b;mt.l=win===0?mt.b:mt.a;mt.st='done';
  if(H.rounds[H.ri].every(function(m){return m.st==='done'||m.st==='bye'})){hRoundDone();return}
  persist(1);bcast();hRender()
}
function hPourLive(msg){if(!H||H.ph!=='pour'||!msg||!Array.isArray(msg.mi)||!msg.v)return;
  var mt=pourMatch(msg.mi),pl=H.pl[msg.p];if(!mt||!pl||mt.st!=='pour'||!mt.pour)return;
  var side=pl.i===mt.a?0:pl.i===mt.b?1:-1;if(side<0||side!==mt.pour.turn||mt.pour.results[side])return;
  lastActivity=Date.now();mt.pour.state=colaState(msg.v);mt.pour.live={side:side,state:mt.pour.state};
  var opp=byI(side===0?mt.b:mt.a),to=Object.keys(H.pl).filter(function(k){return opp&&H.pl[k]===opp})[0];
  if(to)send({t:'pview',to:to,mi:msg.mi,side:side,v:mt.pour.state});
  if(Date.now()-pourMonitorAt>=120){pourMonitorAt=Date.now();hCards()}
  var active=hostPourMatch();if(active&&active.mi[0]===msg.mi[0]&&active.mi[1]===msg.mi[1])hostPourFrameSync(active);
  var names=$('#hostPourNames');if(names&&active)names.textContent=(active.a&&active.a.n||'Ishtirokchi')+' va '+(active.b&&active.b.n||'Raqib')+' · '+((active.p.live&&active.p.live.side===0?active.a&&active.a.n:active.b&&active.b.n)||'Ishtirokchi')+' quyayapti'
}
function colaState(v){v=v||{};return{currentPlayer:+v.currentPlayer===2?2:1,glassFill:clamp(+v.glassFill||0,0,100.5),bottleFill:clamp(v.bottleFill==null?85:+v.bottleFill,0,100),progress:clamp(+v.progress||0,0,1),turnStartFill:clamp(+v.turnStartFill||0,0,100),hasPouredThisTurn:!!v.hasPouredThisTurn,isPouring:!!v.isPouring,pourRate:clamp(+v.pourRate||0,0,100),wavePhase:+v.wavePhase||0,waveAmplitude:clamp(+v.waveAmplitude||0,0,10),bottleSloshPhase:+v.bottleSloshPhase||0,bottleSloshAmp:clamp(+v.bottleSloshAmp||0,0,6),lastTiltRad:+v.lastTiltRad||0,gameOver:!!v.gameOver,spill:!!v.spill,paused:!!v.paused}}
function hPourTurn(msg){if(!H||H.ph!=='pour'||!msg||!Array.isArray(msg.mi)||!msg.v)return;var mt=pourMatch(msg.mi),pl=H.pl[msg.p];if(!mt||!pl||mt.st!=='pour'||!mt.pour)return;var side=pl.i===mt.a?0:pl.i===mt.b?1:-1,p=mt.pour;if(side<0||side!==p.turn)return;var state=colaState(msg.v),next=state.currentPlayer-1;if(next!==1-side)return;p.state=state;p.turn=next;p.live=null;var to=Object.keys(H.pl).filter(function(k){return H.pl[k]===pl})[0];if(to)send({t:'pview',to:to,mi:msg.mi,side:next,v:state});persist(1);bcast();hCards();hostPourFrameSync({m:mt,p:p,a:byI(mt.a),b:byI(mt.b),mi:msg.mi})}

/* ----- tashkilotchi ekranlari ----- */
function hRender(){if(!H)return;if(hostTimerFrame){cancelAnimationFrame(hostTimerFrame);hostTimerFrame=0}modalClose();({lobby:hLobby,draw:hDrawV,pre:hPre,q:hQ,rev:hQ,tie:hTie,pour:hPour,res:hRes,fin:hFin})[H.ph]()}
function joinUrl(){return location.origin+'/home#j='+H.pin}
function hLobby(){var s=H.set;
  function seg(k,vals,suf){return '<div class="seg">'+vals.map(function(v){return '<button class="'+(s[k]===v?'on':'')+'" data-act="cfg" data-k="'+k+'" data-v="'+v+'">'+v+suf+'</button>'}).join('')+'</div>'}
  view(topbar('<b class="lgchip">Kutish xonasi</b>')+'<div class="lgc lobby"><div class="lgjoin"><div class="lgpin"><small>Qo\u2018shilish ID</small><b>'+pinFmt(H.pin)+'</b><button class="lgb ghost sm" data-act="share">\ud83d\udd17 Havola</button></div><div id="lgqr" class="lgqr"></div></div>'+
    '<h2 class="lgh">'+esc(H.title)+'</h2><div class="lgset"><label>Savol vaqti</label>'+seg('time',[10,15,20,30],' s')+'<label>Har duelda savol</label>'+seg('nq',[3,5,7],'')+'</div><div class="lgnote" id="lgnote"></div>'+
    '<div class="lgcnt"><b id="lgcnt">0</b> ishtirokchi</div><div class="lggrid" id="lggrid"></div><div class="lgfoot"><button class="lgb go" data-act="draw" id="lgdraw" disabled>\ud83c\udfb2 Random qur\u2018a tashlash</button></div></div>');
  hLobbyUpdate();qr(joinUrl())}
function hLobbyUpdate(){var g=$('#lggrid');if(!g||!H)return;var l=ros();$('#lgcnt').textContent=l.length;
  g.innerHTML=l.map(function(r){return '<div class="lgpt">'+av(r[2],52,r[1])+'<b>'+esc(r[1])+'</b></div>'}).join('')||'<p class="lgmut">Ishtirokchilar telefondan ID yoki QR orqali qo\u2018shiladi\u2026</p>';obs(g);
  var b=$('#lgdraw');if(b)b.disabled=l.length<2;
  var N=l.length,Mx=1;while(Mx<Math.max(2,N))Mx*=2;var Rr=Math.round(Math.log(Mx)/Math.LN2),need=Rr*H.set.nq,nt=$('#lgnote');
  if(nt)nt.innerHTML=N>=2?('Taxminan <b>'+rname(Mx)+'</b>'+(Mx>N?' \u00b7 <b>'+(Mx-N)+'</b> ta BYE':'')+' \u00b7 '+Rr+' bosqich'+(H.src.length<need?' \u00b7 <span class="w">savollar yetarli emas ('+H.src.length+' ta) \u2014 duelda savollar soni kamaytiriladi</span>':'')):''}
var QRL=null;function qr(text){var b=$('#lgqr');if(!b)return;
  function go(){try{var q=window.qrcode(0,'M');q.addData(text);q.make();var n=q.getModuleCount(),d='';for(var r=0;r<n;r++)for(var c=0;c<n;c++)if(q.isDark(r,c))d+='M'+c+' '+r+'h1v1h-1z';b.innerHTML='<svg viewBox="-2 -2 '+(n+4)+' '+(n+4)+'" shape-rendering="crispEdges"><path d="'+d+'" fill="#1B2150"/></svg>'}catch(e){b.textContent=text}}
  if(window.qrcode)go();else b.textContent=text}
function hDrawV(){var S=snap(),r0=H.rounds[0],ros={};S.ros.forEach(function(r){ros[r[0]]=r});
  var cards=r0.map(function(m,k){var A=ros[m.a],B=ros[m.b];return '<div class="lgvsc" style="animation-delay:'+(k*140)+'ms"><div class="s">'+av(A[2],50,A[1])+'<b>'+esc(A[1])+'</b></div><div class="vs">'+(m.st==='bye'?'\ud83c\udf9f\ufe0f':'VS')+'</div><div class="s">'+(B?av(B[2],50,B[1])+'<b>'+esc(B[1])+'</b>':'<b class="bye">BYE \u00b7 keyingi bosqichga o\u2018tadi</b>')+'</div></div>'}).join('');
  view(topbar('<b class="lgchip">Qur\u2018a natijasi</b>')+'<div class="lgc"><h2 class="lgh">\ud83c\udfb2 Qur\u2018a tashlandi!</h2><p class="lgmut">'+Object.keys(H.pl).length+' ishtirokchi \u00b7 '+(H.B?H.B+' ta omadli chipta (BYE) \u00b7 ':'')+H.R+' bosqich \u00b7 har duelda '+H.nq+' savol'+(H.warn?' \u00b7 <span class="w">savollar takrorlanishi mumkin</span>':'')+'</p><div class="lgvsl">'+cards+'</div><div class="lgfoot"><button class="lgb go" data-act="go">\u25b6 '+rname(H.M)+'ni boshlash</button></div></div>')}
function hPre(){var ph=H.rn;view(topbar()+'<div class="lgcd"><small>Keyingi bosqich</small><div class="lgbig">'+esc(ph)+'</div><p>'+duels().length+' ta duel'+(H.rounds[H.ri].some(function(m){return m.st==='bye'})?' \u00b7 '+H.rounds[H.ri].filter(function(m){return m.st==='bye'}).length+' ta BYE':'')+'</p></div>')}
function resultShort(r){if(!r)return 'navbat kutilmoqda';return r.spilled?('to‘kildi · '+Math.round(r.overflow)+'%'):('stakan '+Math.round(r.fill)+'%')}
function cardHTML(m,ros){var A=ros[m.a]||[0,'?',-1],B=ros[m.b]||[0,'?',-1],an=H.ph==='q'?H.an||{}:{},p=m.pour,detail='';
  if(p){var live=p.live&&p.live.state,liveSide=p.live&&p.live.side,livePlayer=liveSide===0?A:liveSide===1?B:null;
    detail='<small class="pour-match">'+(m.st==='pour'?'Navbat: '+esc((p.turn===0?A[1]:B[1])||'—')+' · ':'')+resultShort(p.results[0])+' / '+resultShort(p.results[1])+'</small>';
    if(m.st==='pour'&&live){var action=live.paused?'to‘xtadi':live.isPouring?'quyayapti':(+live.progress||0)<.2?'tayyorlanmoqda':'idishni boshqaryapti';
      detail+='<small class="pour-live">'+esc(livePlayer?livePlayer[1]:'Ishtirokchi')+' '+action+' · '+Math.round(+live.glassFill||0)+'%</small><span class="pour-live-bar"><i style="width:'+clamp(+live.glassFill||0,0,100)+'%"></i></span>'}
  }
  return '<div class="lgdc'+(m.st==='pour'?' pouring':'')+(m.st==='done'?' done':'')+'"><div class="s'+(m.w===m.a&&m.w?' win':'')+'">'+av(A[2],40,A[1])+'<b>'+esc(A[1])+'</b>'+(an[m.a]!=null?'<i>✓</i>':'')+'</div><div class="sc"><em>'+m.sa+'</em><span>:</span><em>'+m.sb+'</em>'+detail+'</div><div class="s'+(m.w===m.b&&m.w?' win':'')+'">'+av(B[2],40,B[1])+'<b>'+esc(B[1])+'</b>'+(an[m.b]!=null?'<i>✓</i>':'')+'</div></div>'}
function cardsHTML(){var S=snap(),ros=rosMap(S),r=H.rounds[H.ri],byes=r.filter(function(m){return m.st==='bye'});
  return r.filter(function(m){return m.st!=='bye'}).map(function(m){return cardHTML(m,ros)}).join('')+(byes.length?'<div class="lgbyes">🎟️ BYE: '+byes.map(function(m){return esc((ros[m.a]||[0,'?'])[1])}).join(', ')+'</div>':'')}
function hCards(){var c=$('#lgduels');if(c&&H&&(H.ph==='q'||H.ph==='rev'||H.ph==='pour')){c.innerHTML=H.ph==='pour'?pourPairsHTML():cardsHTML();if(H.ph!=='pour')obs(c)}}
function pourPairsHTML(){var S=snap(),ros=rosMap(S);return H.rounds[H.ri].filter(function(m){return m.st==='pour'}).map(function(m){return cardHTML(m,ros)}).join('')}
function hTie(){var S=snap();view(topbar('<b class="lgchip">'+esc(H.rn)+'</b><b class="lgchip">Hal qiluvchi shart</b>')+'<div class="lgc"><h2 class="lgh">Savollar durang bo‘ldi</h2><p class="lgmut">G‘olibni aniqlash uchun hal qiluvchi shart boshlanadi: kim stakanni to‘ldirib to‘kib yuborsa, yutqazadi. Tayyorlaning — quyish dueli hozir boshlanadi.</p><div class="lgduels">'+pourPairsHTML()+'</div></div>')}
function hostPourMatch(){if(!H||H.ph!=='pour')return null;var r=H.rounds[H.ri]||[],chosen=null;for(var i=0;i<r.length;i++)if(r[i].st==='pour'&&r[i].pour&&r[i].pour.live){chosen=r[i];break}if(!chosen)chosen=r.filter(function(m){return m.st==='pour'&&m.pour})[0];if(!chosen)return null;return{m:chosen,p:chosen.pour,a:byI(chosen.a),b:byI(chosen.b),mi:[H.ri,r.indexOf(chosen)]}}
function hostPourFrameSync(match){var frame=$('#hostColaFrame');if(!frame||!frame.contentWindow)return;var x=match||hostPourMatch();if(!x)return;frame.contentWindow.postMessage({type:'cola-sync',mode:'watch',state:(x.p.live&&x.p.live.state)||x.p.state||{currentPlayer:x.p.turn+1,glassFill:0,bottleFill:85,progress:0},players:[x.a&&x.a.n||'Ishtirokchi',x.b&&x.b.n||'Raqib']},location.origin)}
function hPour(){view(topbar('<b class="lgchip">'+esc(H.rn)+'</b><b class="lgchip">Quyish dueli</b>')+'<div class="lgc"><div class="lgduels" id="lgduels">'+pourPairsHTML()+'</div><div style="width:min(100%,760px);height:min(48vh,390px);min-height:230px;border-radius:16px;overflow:hidden;background:#fff3bf;border:1px solid #ffffff88"><iframe id="hostColaFrame" title="Jonli quyish jarayoni" src="/cola-duel.html?mode=watch&v=4" style="width:100%;height:100%;border:0" allow="autoplay" referrerpolicy="same-origin"></iframe></div><p class="lgmut" id="hostPourNames"></p></div>');obs($('#lgduels'));hostPourFrameSync()}
function hostTimerTick(){if(!H||(H.ph!=='q'&&H.ph!=='rev')){hostTimerFrame=0;return}var rem=Math.max(0,H.t0+H.dur-Date.now()),bar=$('#lgbari'),sec=$('#lgsec'),ratio=H.ph==='rev'?1-rem/(H.dur||1):rem/(H.dur||1);if(bar)bar.style.width=Math.max(0,Math.min(100,ratio*100))+'%';if(sec)sec.textContent=H.ph==='rev'?'':String(Math.ceil(rem/1000));if(rem>0)hostTimerFrame=requestAnimationFrame(hostTimerTick);else hostTimerFrame=0}
function hQ(){var rev=H.ph==='rev';view(topbar('<b class="lgchip">'+esc(H.rn)+'</b><b class="lgchip">'+(H.qi+1)+' / '+H.nq+'</b>')+'<div class="lgc"><div class="lgbar"><i id="lgbari" style="width:'+(rev?0:100)+'%"></i></div><div class="lgsec" id="lgsec">'+(rev?'':H.set.time)+'</div><div class="lgduels" id="lgduels">'+cardsHTML()+'</div></div>');obs($('#lgduels'));hostTimerFrame=requestAnimationFrame(hostTimerTick)}
function hRes(){var S=snap(),nr=H.rounds[H.ri+1],nx=H.ri+1===H.R-1?(nr.length>1?'Final va 3-o\u2018rin':'Final'):rname(H.M/Math.pow(2,H.ri+1));
  view(topbar('<b class="lgchip">'+esc(H.rn)+' yakunlandi</b>')+'<div class="lgc"><h2 class="lgh">\u2705 Bosqich yakunlandi</h2>'+brHTML(S,0)+'<div class="lgfoot"><button class="lgb go" data-act="go">\u25b6 '+nx+'</button></div></div>')}
function hFin(){var S=snap();view(topbar('<b class="lgchip">Turnir yakuni</b>')+'<div class="lgc"><h2 class="lgh">\ud83c\udfc6 Chempion aniqlandi!</h2>'+podium(S)+brHTML(S,0)+'<div class="lgfoot"><button class="lgb ghost" data-act="exitok">Yopish</button></div></div>')}

/* =====================  ISHTIROKCHI  ===================== */
function join(s){if(H||P)return;
  P={pin:s.pin,pid:s.pid,n:s.n,a:s.a,got:false,S:null,my:-1,i:0};var me=P;
  openOv();view(topbar()+'<div class="lgcd"><div class="lgspin"></div><p>Turnirga ulanmoqda\u2026</p></div>','pl');pNet()}
function pNet(){var me=P;netOpen(me.pin,pMsg,function(s){var bad=s==='CHANNEL_ERROR'||s==='TIMED_OUT'||s==='CLOSED';conn(bad&&P&&P.got);if(s==='SUBSCRIBED'&&P)pLoop()})}
function pHello(){if(P)send({t:'hi',p:P.pid,n:P.n,a:P.a,lg:1})}
function pLoop(){var me=P;clearInterval(me.hl);var k=0;pHello();me.hl=setInterval(function(){if(P!==me||me.got){clearInterval(me.hl);return}if(++k>=9){clearInterval(me.hl);pFail();return}pHello()},800)}
function pFail(){if(!P)return;view(topbar()+'<div class="lgcd"><div class="em big">\ud83d\udce1</div><h2>Tashkilotchi bilan aloqa yo\u2018q</h2><p>Internetni tekshiring yoki qayta urinib ko\u2018ring.</p><div class="lgbtns"><button class="lgb go" data-act="retry">\u21bb Qayta urinish</button><button class="lgb ghost" data-act="exitok">Chiqish</button></div></div>','pl')}
function pResume(s){P={pin:s.pin,pid:s.pid,n:s.n,a:s.a,got:false,S:null,my:-1,i:0};openOv();view(topbar()+'<div class="lgcd"><div class="lgspin"></div><p>Turnirga qayta ulanmoqda\u2026</p></div>','pl');pNet()}
function pMsg(m){if(!P)return;if(m.to&&m.to!==P.pid)return;
  if(m.t==='s'){if(m.to||P.got)pSnap(m)}
  else if(m.t==='plive'){if(P.S&&P.S.ph==='pour'&&Array.isArray(m.mi)){var mineLive=mine(P.S,P.S.ri),liveFrame=$('#colaFrame'),turnNow=mineLive&&mineLive.m[7]?(+mineLive.m[7][0]||0):-1;if(m.p!==P.pid&&m.mi[0]===P.S.ri&&mineLive&&m.mi[1]===mineLive.s&&m.side===1-mineLive.side&&turnNow===m.side&&liveFrame&&liveFrame.contentWindow){lastActivity=Date.now();P.opponentLive=m.v;liveFrame.contentWindow.postMessage({type:'cola-sync',mode:'watch',state:m.v},location.origin)}}}
  else if(m.t==='pview'){lastActivity=Date.now();if(P.S&&P.S.ph==='pour'&&Array.isArray(m.mi)){var mineNow=mine(P.S,P.S.ri),frame=$('#colaFrame'),turnNow=mineNow&&mineNow.m[7]?(+mineNow.m[7][0]||0):-1;if(m.mi[0]===P.S.ri&&mineNow&&m.mi[1]===mineNow.s&&m.side!==mineNow.side&&turnNow===m.side&&frame&&frame.contentWindow)frame.contentWindow.postMessage({type:'cola-sync',mode:'watch',state:m.v},location.origin)}}
  else if(m.t==='h'){P.lastH=Date.now();if(P.got&&P.S&&(m.ph!==P.S.ph||m.qi!==P.S.qi||m.ri!==P.S.ri))pHello()}
  else if(m.t==='deny')leave(m.why==='full'?'Xona to‘ldi':'Turnir boshlangan — qo‘shilib bo‘lmaydi');
  else if(m.t==='end'){if(P.S&&P.S.ph==='fin')P.over=true;else leave('Tashkilotchi turnirni tugatdi')}}
function mine(S,ri){if(!S.br)return null;var r=S.br[ri];if(!r)return null;for(var s=0;s<r.length;s++){var m=r[s];if(m[0]===P.i||m[1]===P.i)return{r:ri,s:s,m:m,side:m[0]===P.i?0:1,opp:m[0]===P.i?m[1]:m[0]}}return null}
function syncPourFrame(S,mm){var frame=$('#colaFrame');if(!frame||!frame.contentWindow||!mm)return;var d=mm.m[7]||[0,0,[0,0],null],mode=(+d[0]||0)===mm.side?'play':'watch',ros=rosMap(S),players=[(ros[mm.m[0]]||[0,'Ishtirokchi'])[1],(ros[mm.m[1]]||[0,'Raqib'])[1]];frame.contentWindow.postMessage({type:'cola-sync',mode:mode,state:d[3]||{currentPlayer:(+d[0]||0)+1,glassFill:0,bottleFill:85,progress:0},players:players},location.origin)}
function pSnap(m){var first=!P.got,prev=P.S,samePour=!!(prev&&prev.ph==='pour'&&m.ph==='pour'&&prev.ri===m.ri),old=null,next=null;
  if(samePour){old=mine(prev,prev.ri);next=mine(m,m.ri);samePour=!!(old&&next&&old.s===next.s&&old.m[5]===3&&next.m[5]===3)}
  P.got=true;P.lastH=Date.now();if(m.you)P.i=m.you;P.S=m;P.dl=performance.now()+m.rem;
  if(first){conn(false);lsSet(LSP,{pin:P.pin,pid:P.pid,n:P.n,a:P.a,ts:Date.now()})}
  if(m.ph==='q'&&!(prev&&prev.ph==='q'&&prev.ri===m.ri&&prev.qi===m.qi)){P.my=-1;P.ak=false}
  if(samePour)syncPourFrame(m,next);else pRender(prev)}
function pRender(prev){var S=P.S;modalClose();clearInterval(P.tm);
  if(S.ph==='pour'){pPour(prev);return}
  ({lobby:pLobby,draw:pDraw,pre:pPre,q:pQ,rev:pRev,tie:pTie,res:pRes,fin:pFin})[S.ph]()}
function pLobby(){var S=P.S;view(topbar('<b class="lgchip">ID '+pinFmt(P.pin)+'</b>')+'<div class="lgc"><h2 class="lgh">'+esc(S.ttl)+'</h2><p class="lgmut">Tashkilotchi qur\u2018a tashlashini kuting\u2026</p><div class="lgcnt"><b>'+S.ros.length+'</b> ishtirokchi</div><div class="lggrid">'+S.ros.map(function(r){return '<div class="lgpt'+(r[0]===P.i?' me':'')+'">'+av(r[2],52,r[1])+'<b>'+esc(r[1])+'</b></div>'}).join('')+'</div></div>','pl')}
function status(S,mm){var ros=rosMap(S);
  if(!mm){var out=S.ri>=0&&S.br&&S.br[S.ri]&&!mine(S,S.ri);return{e:out?'\ud83d\udc40':'\u23f3',t:out?'Siz turnirdan chiqdingiz':'Kuting',p:out?'Turnirni tomosha qiling \u2014 chempion kim bo\u2018ladi?':'Bosqich boshlanishini kuting.'}}
  if(mm.m[5]===1)return{e:'\ud83c\udf9f\ufe0f',t:'Omadli chipta (BYE)!',p:'Siz keyingi bosqichga avtomatik o\u2018tdingiz, raqibingizni kuting.'};
  if(mm.m[5]===4)return{e:mm.m[2]===P.i?'\ud83c\udfc6':'\ud83d\ude14',t:mm.m[2]===P.i?'Siz yutdingiz!':'Mag\u2018lub bo\u2018ldingiz',p:'Boshqa duellar tugashini kuting.'};
  return null}
function pWait(S,mm){var st=status(S,mm),sc='';view(topbar('<b class="lgchip">'+esc(S.rn)+'</b>')+'<div class="lgc"><div class="lgcd inl"><div class="em big">'+st.e+'</div><h2>'+st.t+'</h2><p>'+st.p+'</p></div>'+(S.br?brHTML(S,P.i):'')+'</div>','pl')}
function pTie(){var S=P.S,mm=mine(S,S.ri),ros=rosMap(S),a=mm&&ros[mm.m[0]],b=mm&&ros[mm.m[1]],tied=!!(mm&&mm.m[5]===3);var title=tied?'Hal qiluvchi shart':(status(S,mm)||{t:'Kutib turing'}).t;var copy=tied?'Savol javoblari durang bo‘ldi. Endi stakanga xohlagan miqdorda quying. Kim stakanni to‘ldirib, kola to‘kib yuborsa yutqazadi; to‘kmagan ishtirokchi keyingi bosqichga chiqadi.':'Durang bo‘lgan juftliklar hal qiluvchi shartni o‘ynayapti. Sizning juftligingiz natijasi qayd etilgan — keyingi bosqich boshlanguncha kuting.';var detail=tied?'<div class="lgduels">'+vsBar(a,b,[mm.m[3],mm.m[4]])+'</div>':'<div class="lgcd inl"><h2>'+esc(title)+'</h2><p>'+copy+'</p></div>';view(topbar('<b class="lgchip">'+esc(S.rn)+'</b><b class="lgchip">Hal qiluvchi shart</b>')+'<div class="lgc"><div class="lgcd inl"><div class="em big">🥤</div><h2>'+(tied?'Savollar durang bo‘ldi':'Bosqich davom etmoqda')+'</h2><p>'+copy+'</p><p class="lgmut">Keyingi bosqich natijasi shu juftliklar yakunlangach ko‘rinadi.</p></div>'+detail+'</div>','pl')}
function pDraw(){var S=P.S,mm=mine(S,0),ros=rosMap(S),opp=mm&&mm.opp?ros[mm.opp]:null;
  view(topbar()+'<div class="lgc"><div class="lgcd inl"><div class="em big">\ud83c\udfb2</div><h2>Qur\u2018a tashlandi!</h2>'+(mm&&opp?'<p>Sizning raqibingiz:</p>'+vsBar(ros[P.i],opp,[0,0]):mm&&mm.m[5]===1?'<p>\ud83c\udf9f\ufe0f Siz omadli chipta (BYE) oldingiz \u2014 keyingi bosqichga avtomatik o\u2018tasiz!</p>':'<p>Natijani kuting.</p>')+'</div>'+brHTML(S,P.i)+'</div>','pl');}
function pPre(){var S=P.S,mm=mine(S,S.ri),ros=rosMap(S);
  if(!mm||mm.m[5]!==2){pWait(S,mm);return}
  view(topbar()+'<div class="lgcd"><small>'+esc(S.rn)+'</small><div class="lgbig sm">Duel!</div>'+vsBar(ros[P.i],ros[mm.opp],[0,0])+'<p>Tayyor bo\u2018ling \u2014 '+S.nq+' ta savol</p></div>','pl');}
function scoreOf(mm){return mm.side?[mm.m[4],mm.m[3]]:[mm.m[3],mm.m[4]]}
function pQ(){var S=P.S,mm=mine(S,S.ri);if(!mm||mm.m[5]!==2){pWait(S,mm);return}var ros=rosMap(S);
  view(topbar('<b class="lgchip">'+esc(S.rn)+'</b><b class="lgchip">'+(S.qi+1)+' / '+S.nq+'</b>')+'<div class="lgc lgpq">'+vsBar(ros[P.i],ros[mm.opp],scoreOf(mm))+'<div class="lgbar"><i id="lgbari"></i></div><div class="lgsec" id="lgsec"></div><h2 class="lgq p">'+esc(S.q)+'</h2><div class="lgops" id="lgops">'+optsHTML(S,P.my,false)+'</div></div>','pl');
  var tot=S.dur||1,tick=function(){var rem=P.dl-performance.now(),b=$('#lgbari'),s=$('#lgsec');if(b)b.style.width=clamp(rem/tot*100,0,100)+'%';if(s)s.textContent=Math.max(0,Math.ceil(rem/1000));if(rem<=0)clearInterval(P.tm)};tick();P.tm=setInterval(tick,200)}
function pAnswer(k){if(!P||!P.S||P.S.ph!=='q'||P.my>=0)return;P.my=k;var o=$('#lgops');if(o)o.innerHTML=optsHTML(P.S,k,false);
  var key=P.S.ri*100+P.S.qi,tries=0;P.ak=false;(function go(){if(!P||P.S.ph!=='q'||P.S.ri*100+P.S.qi!==key||P.ak||tries>4)return;tries++;send({t:'ans',p:P.pid,qi:key,c:k});setTimeout(go,800)})()}
function pRev(){var S=P.S,mm=mine(S,S.ri);if(!mm||mm.m[5]!==2){pWait(S,mm);return}var ros=rosMap(S),okk=P.my===S.c;
  view(topbar('<b class="lgchip">'+esc(S.rn)+'</b><b class="lgchip">'+(S.qi+1)+' / '+S.nq+'</b>')+'<div class="lgc lgpq">'+vsBar(ros[P.i],ros[mm.opp],scoreOf(mm))+'<div class="lgverdict '+(okk?'y':'n')+'">'+(okk?'\u2705 To\u2018g\u2018ri! +1':P.my<0?'\u23f1 Javob berilmadi':'\u274c Noto\u2018g\u2018ri')+'</div><h2 class="lgq p sm">'+esc(S.q)+'</h2><div class="lgops">'+optsHTML(S,P.my,true)+'</div></div>','pl');}
function pRes(){var S=P.S,mm=mine(S,S.ri),e,t,p,ros=rosMap(S);
  if(!mm){var o=status(S,mm);e=o.e;t=o.t;p=o.p}
  else if(mm.m[5]===1){e='\ud83c\udf9f\ufe0f';t='Omadli chipta (BYE)!';p='Siz keyingi bosqichga avtomatik o\u2018tdingiz.'}
  else if(mm.m[2]===P.i){e='\ud83c\udfc6';t='Yutdingiz! Keyingi bosqichga chiqdingiz';p='Tashkilotchi keyingi bosqichni boshlashini kuting.'}
  else{var winner=ros[mm.m[2]];e='\ud83d\ude14';t='Mag\u2018lub bo\u2018ldingiz';p=(winner?winner[1]+' ':'Raqibingiz ')+ 'yutdi va keyingi bosqichga chiqdi. Turnir yakunini kuting.'}
  view(topbar('<b class="lgchip">'+esc(S.rn)+' yakunlandi</b>')+'<div class="lgc"><div class="lgcd inl"><div class="em big">'+e+'</div><h2>'+t+'</h2><p>'+p+'</p></div>'+brHTML(S,P.i)+'</div>','pl');}
function pFin(){var S=P.S,f=S.fin||[],k=f.indexOf(P.i);view(topbar('<b class="lgchip">Turnir yakuni</b>')+'<div class="lgc"><h2 class="lgh">'+(k===0?'\ud83c\udfc6 Siz chempionsiz!':k>0?'\ud83c\udfc5 Siz '+(k+1)+'-o\u2018rinni egalladingiz!':'Turnir yakunlandi')+'</h2>'+podium(S)+brHTML(S,P.i)+'<div class="lgfoot"><button class="lgb ghost" data-act="exitok">Chiqish</button></div></div>','pl');}

/* ----- Quyish dueli: ishtirokchi oynasi ----- */
function decodePour(x){return x&&Array.isArray(x)?{fill:+x[0]||0,spilled:!!x[1],overflow:+x[2]||0,seconds:+x[3]||0}:null}
function pPour(prev){var S=P.S,mm=mine(S,S.ri);
  if(!mm||mm.m[5]!==3){var st=status(S,mm)||{e:'⏳',t:'Navbatni kuting',p:'Boshqa juftliklarning natijasi kutilmoqda.'};
    stopPourFlow();view(topbar('<b class="lgchip">'+esc(S.rn||'')+'</b><b class="lgchip">Quyish dueli</b>')+'<div class="lgc"><div class="lgcd inl"><div class="em big">'+st.e+'</div><h2>'+st.t+'</h2><p>'+st.p+'</p></div>'+brHTML(S,P.i)+'</div>','pl');return}
  var data=mm.m[7]||[0,0,[0,0]],turn=+data[0]||0,starter=+data[1]||0,results=data[2]||[0,0],myResult=decodePour(results[mm.side]),oppResult=decodePour(results[1-mm.side]),ros=rosMap(S),key=S.ri+':'+mm.s+':'+mm.side;
  if(turn!==mm.side||myResult){stopPourFlow();if(turn===mm.side)P.opponentLive=null;
    var text=myResult?'Urinishingiz qayd qilindi ('+(myResult.spilled?'stakandan '+Math.round(myResult.overflow)+'% to‘kildi':'stakanda '+Math.round(myResult.fill)+'%')+'). Endi raqibingiz quyadi.':'Raqibingiz quyayotgan jarayonni jonli ko‘ryapsiz. Navbatingiz avtomatik boshlanadi.';
    var remote=!myResult?(P.opponentLive||{}):{};
    var spectator='<div class="pour-watch"><div class="pour-intro"><span class="pour-tag">Jonli kuzatuv</span><h2 class="lgh">Raqibingiz quyayapti</h2><p>'+text+'</p></div><div class="pour-arena-card"><div class="pour-arena-head"><span>Raqib urinishda</span><b id="remoteTilt">Egilish: '+Math.round(remote.tilt||0)+'°</b></div><div class="pour-scene"><div class="pour-wall"></div><div class="pour-table"></div><div class="pour-bottle" id="remoteBottle" style="left:4%;bottom:8%"><svg viewBox="0 0 100 180" aria-hidden="true"><path d="M39 12H61V31L68 40V53Q78 66 78 82V149Q78 169 60 169H40Q22 169 22 149V82Q22 66 32 53V40L39 31Z" fill="#d7e0e8" fill-opacity=".5" stroke="#fff" stroke-width="3"/><rect id="remoteBottleLiquid" x="24" y="55" width="52" height="111" fill="#28120c"/><rect x="21" y="97" width="58" height="35" rx="7" fill="#d72b3f"/><path d="M31 114c8-10 15 10 23 0s15 10 22 0" fill="none" stroke="#fff4e9" stroke-width="4"/></svg></div><div class="pour-stream" id="remoteStream" hidden></div><svg class="pour-glass" viewBox="0 0 120 140" aria-hidden="true"><path d="M25 17H95L87 116Q60 132 33 116Z" fill="#eefaff" fill-opacity=".08" stroke="#eaf5ff" stroke-width="4"/><rect id="remoteGlassLiquid" x="29" y="116" width="62" height="0" fill="#28120c"/></svg></div><div class="pour-level"><div class="pour-level-row"><span>Stakandagi ichimlik</span><b><span id="remoteFill">'+Math.round(remote.fill||0)+'</span>%</b></div><div class="pour-meter"><i id="remoteMeter" style="width:'+(remote.fill||0)+'%"></i></div></div><p class="pour-status" id="remoteStatus">'+(remote.spilled?'To‘kildi!':remote.flowing?'Ichimlik quyilyapti…':'Raqib tayyorlanmoqda…')+'</p></div><div class="pour-duel-summary">'+cardHTML({a:mm.m[0],b:mm.m[1],w:0,sa:mm.m[3],sb:mm.m[4],st:'pour',pour:{turn:turn,starter:starter,results:[decodePour(results[0]),decodePour(results[1])]}},ros)+'</div></div>';
    view(topbar('<b class="lgchip">'+esc(S.rn||'')+'</b><b class="lgchip">Quyish dueli</b>')+'<div class="lgc">'+spectator+'</div>','pl pour-game');refreshRemotePour(remote);return}
  if(!P.pourGame||P.pourGame.key!==key)P.pourGame={key:key,ri:S.ri,mi:mm.s,side:mm.side,started:true,submitted:false,progress:0,tilt:0,fill:0,used:0,overflow:0,spilled:false,startedAt:Date.now(),lastFlow:0,flowing:false,pauseUntilInput:false};
  var g=P.pourGame;g.mm=mm;
  var A=ros[P.i]||[0,'Siz',-1],B=ros[mm.opp]||[0,'Raqib',-1];
  var gameHtml='<div class="pour-wrap"><div class="pour-intro"><span class="pour-tag">Teng natijani aniqlash</span><h2 class="lgh">Quyish dueli</h2><p>Idishni belgilangan yo‘lak bo‘ylab stakan ustiga olib boring. Stakan to‘lsa va ichimlik tashqariga to‘kilsa, urinish yutqaziladi.</p></div>'+
    '<div class="pour-vs">'+vsBar(A,B,[0,0])+'</div>'+
    '<div class="pour-instructions"><b>Qanday o‘ynaladi?</b><span>1. “Boshlash”ni bosing.</span><span>2. Qizil idishni o‘ngga suring — u bir xil yo‘lakda ko‘tariladi.</span><span>3. Stakan ustida idishni yuqoriga tortib eging. Ichimlik oqimini boshqarib, so‘ng natijani yuboring.</span></div>'+
    '<div class="pour-arena-card"><div class="pour-arena-head"><span>Stakan ustiga olib boring</span><b id="pourTiltLabel">Egilish: '+Math.round(g.tilt)+'°</b></div><div class="pour-scene" id="pourScene">'+
      '<div class="pour-wall"></div><div class="pour-table"></div><div class="pour-guide" aria-hidden="true"><i></i><span>bir xil yo‘lak</span><i></i></div>'+
      '<div class="pour-bottle" id="pourBottle" role="slider" tabindex="0" aria-label="Ichimlik idishi: o‘ngga suring, yuqoriga tortib eging" aria-valuemin="0" aria-valuemax="118" aria-valuenow="'+Math.round(g.tilt)+'">'+
        '<svg viewBox="0 0 100 180" aria-hidden="true"><defs><clipPath id="pourBottleClip"><path d="M34 53Q24 64 24 81V149Q24 166 40 166H60Q76 166 76 149V81Q76 64 66 53Z"/></clipPath></defs>'+
          '<path d="M39 12H61V31L68 40V53Q78 66 78 82V149Q78 169 60 169H40Q22 169 22 149V82Q22 66 32 53V40L39 31Z" fill="#d7e0e8" fill-opacity=".42" stroke="#f6fbff" stroke-width="3"/>'+
          '<rect id="pourBottleLiquid" x="24" y="55" width="52" height="111" fill="#28120c" clip-path="url(#pourBottleClip)"/>'+
          '<path d="M28 80V147Q28 160 40 160" fill="none" stroke="#ffffff" stroke-opacity=".28" stroke-width="3"/>'+
          '<path d="M37 39H63V53H37Z" fill="#bec9d2" fill-opacity=".55" stroke="#fff" stroke-opacity=".65" stroke-width="2"/><path d="M38 14H62V31H38Z" fill="#dce3e8" stroke="#fff" stroke-width="2"/>'+
          '<rect x="21" y="97" width="58" height="35" rx="7" fill="#d72b3f"/><path d="M31 114c8-10 15 10 23 0s15 10 22 0" fill="none" stroke="#fff4e9" stroke-width="4" stroke-linecap="round"/>'+
          '<path d="M41 9H59V15H41Z" fill="#f2f4f6" stroke="#fff" stroke-width="2"/></svg></div>'+
      '<div class="pour-stream" id="pourStream" hidden></div>'+
      '<svg class="pour-glass" viewBox="0 0 120 140" aria-label="Tiniq stakan"><defs><clipPath id="pourGlassClip"><path d="M25 17H95L87 116Q60 132 33 116Z"/></clipPath></defs>'+
        '<path d="M25 17H95L87 116Q60 132 33 116Z" fill="#eefaff" fill-opacity=".08" stroke="#eaf5ff" stroke-opacity=".88" stroke-width="4"/>'+
        '<rect id="pourGlassLiquid" x="29" y="116" width="62" height="0" fill="#28120c" clip-path="url(#pourGlassClip)"/>'+
        '<path d="M30 23H90M35 108H85" stroke="#fff" stroke-opacity=".45" stroke-width="2"/><path d="M34 34V101" stroke="#fff" stroke-opacity=".24" stroke-width="4" stroke-linecap="round"/></svg>'+
      '<div class="pour-bottle-home">idish</div><div class="pour-glass-home">stakan</div></div>'+
    '<div class="pour-level"><div class="pour-level-row"><span>Stakandagi ichimlik</span><b><span id="pourFillText">'+Math.round(g.fill)+'</span>%</b></div><div class="pour-meter"><i id="pourFillMeter" style="width:'+g.fill+'%"></i></div><div class="pour-level-row pour-sub"><span>Idishda qolgan</span><b><span id="pourLeftText">'+Math.round(100-g.used)+'</span>%</b></div></div>'+
    '<label class="pour-tilt"><span>Idishni egish</span><input id="pourTilt" type="range" min="0" max="118" value="'+Math.round(g.tilt)+'"><b id="pourTiltRead">'+Math.round(g.tilt)+'°</b></label>'+ 
    '<p class="pour-status" id="pourStatus">'+(g.spilled?'Stakandan to‘kildi — urinish tugadi.':g.started?'Idishni suring, stakan ustida egishni boshqaring.':'Tayyor bo‘lsangiz boshlang; har bir ishtirokchiga bitta urinish beriladi.')+'</p>'+
    '<div class="pour-actions"><button class="lgb go" id="pourStart" data-act="pourStart"'+(g.started?' hidden':'')+'>Boshlash</button><button class="lgb go" id="pourSubmit" data-act="pourSubmit"'+(!g.started?' hidden':'')+(g.submitted?' disabled':'')+'>'+(g.submitted?'Natija yuborildi':'Natijani yuborish')+'</button></div>'+
    '<p class="pour-rule">Stakanga xavfsiz quyilgan ko‘proq ichimlik yutadi. To‘kilgan ishtirokchi yutqazadi; ikkalasi to‘ksa, kamroq to‘kkan yutadi. Natija aynan teng bo‘lsa, navbat boshida tasodifiy tanlangan ishtirokchi g‘olib bo‘ladi.</p></div></div>';
  view(topbar('<b class="lgchip">'+esc(S.rn||'')+'</b><b class="lgchip">Quyish dueli</b>')+'<div class="lgc">'+gameHtml+brHTML(S,P.i)+'</div>','pl pour-game');
  refreshPour(g);if(g.started)bindPour(g)
}
function startPour(){var g=P&&P.pourGame;if(!g||g.started||g.submitted)return;g.started=true;g.startedAt=Date.now();g.pauseUntilInput=false;var b=$('#pourStart'),s=$('#pourSubmit'),r=$('#pourTilt');if(b)b.hidden=true;if(s)s.hidden=false;if(r)r.disabled=false;var st=$('#pourStatus');if(st)st.textContent='Idishni o‘ngga suring, keyin yuqoriga tortib eging.';bindPour(g);refreshPour(g)}
function sendPourLive(g,force){if(!P||!P.S||!g||!g.started||g.submitted)return;var now=Date.now();if(!force&&now-(g.lastBroadcastAt||0)<100)return;g.lastBroadcastAt=now;send({t:'plive',p:P.pid,mi:[g.ri,g.mi],side:g.side, v:{progress:g.progress,tilt:g.tilt,fill:g.fill,used:g.used,flowing:g.flowing,spilled:g.spilled}})}
function submitPour(){var g=P&&P.pourGame;if(!g||!g.started||g.submitted||!P||!P.S)return;stopPourFlow();g.submitted=true;
  var btn=$('#pourSubmit');if(btn){btn.disabled=true;btn.textContent='Natija yuborildi'}
  var msg={t:'pour',p:P.pid,mi:[g.ri,g.mi],r:{fill:g.fill,spilled:g.spilled,overflow:g.overflow,ms:Math.min(90000,Date.now()-g.startedAt)}};
  sendPourLive(g,true);send(msg);var st=$('#pourStatus');if(st)st.textContent='Natija yuborildi. Raqibingizning urinishini kuting.'}
function stopPourFlow(){if(pourTimer){clearInterval(pourTimer);pourTimer=0}if(P&&P.pourGame)P.pourGame.flowing=false}
function syncPourFlow(g){if(!g||!P||P.pourGame!==g||!g.started||g.submitted||g.spilled||g.used>=100||g.progress<.92||g.tilt<24||g.pauseUntilInput){stopPourFlow();return}
  if(pourTimer)return;g.flowing=true;g.lastFlow=Date.now();
  pourTimer=setInterval(function(){if(!P||P.pourGame!==g||document.hidden){stopPourFlow();if(g)g.pauseUntilInput=true;return}
    if(!g.started||g.submitted||g.spilled||g.progress<.92||g.tilt<24||g.pauseUntilInput){stopPourFlow();refreshPour(g);return}
    var now=Date.now(),dt=clamp((now-g.lastFlow)/1000,0,.12),ratio=clamp((g.tilt-24)/71,0,1),rate=4+ratio*ratio*36,amount=Math.min(100-g.used,rate*dt),next=g.fill+amount;
    g.used=Math.min(100,g.used+amount);g.lastFlow=now;
    if(next>100){g.overflow=Math.round((next-100)*100)/100;g.fill=100;g.spilled=true;stopPourFlow()}
    else{g.fill=Math.round(next*100)/100;if(g.used>=99.99)stopPourFlow()}
    refreshPour(g);sendPourLive(g);if(g.spilled)submitPour()
  },50)
}
function refreshPour(g){if(!P||P.pourGame!==g)return;
  var scene=$('#pourScene'),bottle=$('#pourBottle'),glass=$('#pourGlassLiquid'),liquid=$('#pourBottleLiquid');
  if(scene&&bottle){var rect=scene.getBoundingClientRect(),br=bottle.getBoundingClientRect(),gr=$('.pour-glass',scene).getBoundingClientRect(),w=rect.width,h=rect.height,bw=bottle.offsetWidth,bh=bottle.offsetHeight;
    var start=w*.04,tip=Math.sin(62*Math.PI/180)*bh*.74,target=clamp(gr.left-rect.left+gr.width*.5-bw*.5-tip,w*.13,w*.66),lift=g.progress*g.progress*(3-2*g.progress);
    bottle.style.left=(start+(target-start)*g.progress)+'px';bottle.style.bottom=(h*(.08+.24*lift))+'px';bottle.style.transform='rotate('+Math.round(g.tilt)+'deg)';
    bottle.setAttribute('aria-valuenow',String(Math.round(g.tilt)));
    var stream=$('#pourStream');if(stream)stream.hidden=!(g.flowing&&g.progress>=.92&&g.tilt>=24)
  }
  var remaining=clamp(1-g.used/100,0,1),by=$('#pourBottleLiquid'),gy=$('#pourGlassLiquid');
  if(by){by.setAttribute('y',String(55+(1-remaining)*111));by.setAttribute('height',String(remaining*111))}
  if(gy){var height=g.fill*.9;gy.setAttribute('y',String(116-height));gy.setAttribute('height',String(height))}
  var fill=$('#pourFillText'),meter=$('#pourFillMeter'),left=$('#pourLeftText'),tilt=$('#pourTilt'),tl=$('#pourTiltRead'),label=$('#pourTiltLabel'),statusEl=$('#pourStatus');
  if(fill)fill.textContent=String(Math.round(g.fill));if(meter)meter.style.width=clamp(g.fill,0,100)+'%';if(left)left.textContent=String(Math.round(100-g.used));
  if(tilt&&+tilt.value!==Math.round(g.tilt))tilt.value=String(Math.round(g.tilt));if(tl)tl.textContent=Math.round(g.tilt)+'°';if(label)label.textContent='Egilish: '+Math.round(g.tilt)+'°';
  if(statusEl){statusEl.textContent=g.spilled?'Stakandan to‘kildi — urinish tugadi.':g.flowing?'Ichimlik quyilyapti — idishni yengil tushirib oqimni sekinlating.':g.progress<.92?'Idishni stakan ustiga olib boring.':g.tilt<24?'Yuqoriga tortib idishni eging.':'Egilishni boshqaring; to‘kilmasidan natijani yuboring.'}
}
function bindPour(g){var scene=$('#pourScene'),bottle=$('#pourBottle'),slider=$('#pourTilt');if(!scene||!bottle||bottle.dataset.bound)return;bottle.dataset.bound='1';
  bottle.addEventListener('pointerdown',function(e){if(!g.started||g.submitted||g.spilled)return;e.preventDefault();g.pauseUntilInput=false;g.drag=true;g.pointer=e.pointerId;g.lastX=e.clientX;g.lastY=e.clientY;try{bottle.setPointerCapture(e.pointerId)}catch(x){}});
  bottle.addEventListener('pointermove',function(e){if(!g.drag||e.pointerId!==g.pointer||g.submitted)return;e.preventDefault();var dx=e.clientX-g.lastX,dy=e.clientY-g.lastY;g.lastX=e.clientX;g.lastY=e.clientY;g.progress=clamp(g.progress+dx/Math.max(80,scene.clientWidth*.30),0,1);if(g.progress>=.92)g.tilt=clamp(g.tilt-dy*.58,0,118);refreshPour(g);syncPourFlow(g);sendPourLive(g)});
  function release(e){if(!g.drag||e.pointerId!==g.pointer)return;g.drag=false;g.pointer=null;syncPourFlow(g)}
  bottle.addEventListener('pointerup',release);bottle.addEventListener('pointercancel',release);
  bottle.addEventListener('keydown',function(e){if(!g.started||g.submitted)return;if(e.key==='ArrowRight'){g.progress=clamp(g.progress+.05,0,1);e.preventDefault()}else if(e.key==='ArrowLeft'){g.progress=clamp(g.progress-.05,0,1);e.preventDefault()}else if(e.key==='ArrowUp'&&g.progress>=.92){g.tilt=clamp(g.tilt+5,0,118);e.preventDefault()}else if(e.key==='ArrowDown'&&g.progress>=.92){g.tilt=clamp(g.tilt-5,0,118);e.preventDefault()}else return;g.pauseUntilInput=false;refreshPour(g);syncPourFlow(g);sendPourLive(g)});
  if(slider)slider.addEventListener('input',function(){if(!g.started||g.submitted)return;g.pauseUntilInput=false;g.tilt=clamp(+slider.value,0,118);refreshPour(g);syncPourFlow(g);sendPourLive(g)})
}
function refreshRemotePour(v){var bottle=$('#remoteBottle'),glass=$('#remoteGlassLiquid'),liq=$('#remoteBottleLiquid'),stream=$('#remoteStream'),fill=$('#remoteFill'),meter=$('#remoteMeter'),tilt=$('#remoteTilt'),statusEl=$('#remoteStatus');if(!bottle)return;v=v||{};var p=clamp(+v.progress||0,0,1),a=clamp(+v.tilt||0,0,118),f=clamp(+v.fill||0,0,100),used=clamp(+v.used||0,0,100),lift=p*p*(3-2*p);bottle.style.left=(4+p*58)+'%';bottle.style.bottom=(8+24*lift)+'%';bottle.style.transform='rotate('+Math.round(a)+'deg)';if(liq){liq.setAttribute('y',String(55+used*1.11));liq.setAttribute('height',String((100-used)*1.11))}if(glass){glass.setAttribute('y',String(116-f*.9));glass.setAttribute('height',String(f*.9))}if(stream)stream.hidden=!(v.flowing&&p>=.92&&a>=24);if(fill)fill.textContent=String(Math.round(f));if(meter)meter.style.width=f+'%';if(tilt)tilt.textContent='Egilish: '+Math.round(a)+'°';if(statusEl)statusEl.textContent=v.spilled?'Stakandan to‘kildi — urinish tugadi.':v.flowing?'Raqib quyayapti…':p<.92?'Raqib idishni ko‘taryapti…':'Raqib egilishni boshqaryapti…'}
function pPour(prev){var S=P.S,mm=mine(S,S.ri);if(!mm||mm.m[5]!==3){pWait(S,mm);return}var d=mm.m[7]||[0,0,[0,0],null],mode=(+d[0]||0)===mm.side?'play':'watch',state=d[3]||{currentPlayer:(+d[0]||0)+1,glassFill:0,bottleFill:85,progress:0,turnStartFill:0,hasPouredThisTurn:false,isPouring:false,pourRate:0,wavePhase:0,waveAmplitude:0,bottleSloshPhase:0,bottleSloshAmp:0,lastTiltRad:0,gameOver:false};
  var ros=rosMap(S),A=ros[mm.m[0]]||[0,'Ishtirokchi',-1],B=ros[mm.m[1]]||[0,'Raqib',-1],players=[A[1],B[1]];
  view('<div class="cola-frame-shell"><iframe id="colaFrame" title="Kola quyish dueli: '+esc(A[1])+' va '+esc(B[1])+'" src="/cola-duel.html?mode='+mode+'&v=3" allow="autoplay" referrerpolicy="same-origin"></iframe><button class="cola-exit" data-act="exit" aria-label="Turnirdan chiqish">✕</button></div>','pl cola-game');var frame=$('#colaFrame');if(frame)frame.addEventListener('load',function(){if(P&&P.S&&P.S.ph==='pour'){var latest=mine(P.S,P.S.ri);if(latest)syncPourFrame(P.S,latest)}})
}
function onColaFrameMessage(e){if(e.origin!==location.origin)return;
  var hostFrame=$('#hostColaFrame');if(H&&hostFrame&&e.source===hostFrame.contentWindow&&e.data&&e.data.type==='cola-ready'){hostPourFrameSync();return}
  if(!P||!P.S||P.S.ph!=='pour')return;var frame=$('#colaFrame'),mm=mine(P.S,P.S.ri);if(!frame||e.source!==frame.contentWindow||!mm)return;var mi=[P.S.ri,mm.s];
  if(e.data&&e.data.type==='cola-ready'){syncPourFrame(P.S,mm)}
  else if(e.data&&e.data.type==='cola-state'&&mm.m[7]&&(+mm.m[7][0]||0)===mm.side){lastActivity=Date.now();send({t:'plive',p:P.pid,mi:mi,side:mm.side,v:e.data.state||{}})}
  else if(e.data&&e.data.type==='cola-turn'&&mm.m[7]&&(+mm.m[7][0]||0)===mm.side){lastActivity=Date.now();send({t:'pturn',p:P.pid,mi:mi,v:e.data.state||{}})}
  else if(e.data&&e.data.type==='cola-spill'&&mm.m[7]&&(+mm.m[7][0]||0)===mm.side){lastActivity=Date.now();var st=Object.assign({},e.data.state||{},{spill:true});send({t:'plive',p:P.pid,mi:mi,side:mm.side,v:st});send({t:'pour',p:P.pid,mi:mi,r:{fill:st.glassFill,spilled:true,overflow:e.data.overflow||Math.max(0,(+st.glassFill||100)-100),ms:0}})}
}
window.addEventListener('message',onColaFrameMessage);

/* ===== tugmalar ===== */

function onClick(e){var m=$('#lgmod');if(e.target===m){modalClose();return}
  var b=e.target.closest('[data-act]');if(!b)return;var a=b.dataset.act,v=b.dataset.v;
  switch(a){
    case'exit':askExit();break;case'mclose':modalClose();break;case'exitok':leave();break;
    case'cfg':if(H&&H.ph==='lobby'){H.set[b.dataset.k]=+v;persist();hLobby()}break;
    case'draw':hDraw();break;
    case'go':if(H){if(H.ph==='draw'||H.ph==='res')hRoundStart()}break;
    case'ans':pAnswer(+v);break;case'pourStart':startPour();break;case'pourSubmit':submitPour();break;
    case'share':if(H){var url=joinUrl();if(navigator.share&&/Android|iPhone|iPad/i.test(navigator.userAgent||''))navigator.share({title:'Chempionlar ligasi',url:url}).catch(function(){});else if(navigator.clipboard)navigator.clipboard.writeText(url).then(function(){say('Havola nusxalandi')},function(){say(url)});else say(url)}break;
    case'retry':if(P){var s={pin:P.pin,pid:P.pid,n:P.n,a:P.a};stopPourFlow();netClose();clearInterval(P.hl);P=null;pResume(s)}break}}

/* ===== ochiq API ===== */
window.League={host:host,join:function(s){setTimeout(function(){join(s)},0)},active:function(){return !!(H||P)},open:function(){if(H||P)openOv()},_t:{mkBracket:mkBracket,rname:rname}};
function boot(){if(LQ().active&&LQ().active())return;var h=ls(LSH),p=ls(LSP);
  if(h&&h.pin&&h.ph==='lobby'&&Date.now()-h.ts<STALE){H=h;hBoot();return}else if(h)lsDel(LSH);
  if(p&&p.pin&&Date.now()-p.ts<STALE){pResume(p);return}else if(p)lsDel(LSP)}
if(typeof document!=='undefined'&&document.body)setTimeout(boot,500);

/* ===== uslublar ===== */
var CSS='.lgx{position:fixed;inset:0;z-index:95;color:#fff;font-family:Nunito,system-ui,sans-serif;font-weight:700;background:radial-gradient(120% 80% at 50% 0,#2A2F7A 0,#0E1034 60%);overflow:hidden;-webkit-user-select:none;user-select:none}.lgx[hidden]{display:none}.lgx *{box-sizing:border-box;margin:0}.lgx button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}'+
'.lgm{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;padding:0 0 28px;-webkit-overflow-scrolling:touch}.pour-live{display:block!important;color:#27C99A!important;font-size:11px!important;font-weight:900}.pour-live-bar{display:block;height:5px;margin:5px 7px 0;background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden}.pour-live-bar i{display:block;height:100%;background:linear-gradient(90deg,#FFC53D,#27C99A);border-radius:inherit;transition:width .15s linear}.lgm.cola-game{padding:0;overflow:hidden;background:#fffbeb}.cola-frame-shell{position:absolute;inset:0;width:100%;height:100%;background:#fffbeb}.cola-frame-shell iframe{display:block;border:0;width:100%;height:100%;background:#fffbeb}.cola-exit{position:absolute;z-index:10;right:10px;top:calc(env(safe-area-inset-top,0px) + 10px);width:38px;height:38px;border-radius:12px!important;background:rgba(255,255,255,.86)!important;color:#991b1b!important;border:1px solid rgba(220,38,38,.25)!important;box-shadow:0 3px 12px rgba(0,0,0,.15);font-size:17px}.lgm.pour-game{inset:auto;left:50%;top:50%;width:min(100vw,56.25dvh);height:min(100dvh,177.78vw);transform:translate(-50%,-50%);aspect-ratio:9/16;padding:0 0 env(safe-area-inset-bottom,0px);border-radius:0;background:linear-gradient(165deg,#fffbeb 0%,#fef3c7 48%,#fed7aa 100%);color:#1e293b}.lgm.pour-game .lgt{background:rgba(255,255,255,.78);color:#1e293b;border-bottom:1px solid rgba(255,255,255,.9);padding:7px 9px}.lgm.pour-game .lgib{background:rgba(220,38,38,.1);color:#991b1b;width:32px;height:32px}.lgm.pour-game .lgpill{font-size:9px;padding:5px 8px}.lgm.pour-game .lgchip{background:rgba(255,255,255,.76);padding:4px 8px;font-size:10px}.lgm.pour-game .lgc{padding:8px 10px;gap:7px}.lgm.pour-game .lgmut{color:#475569;opacity:1}.lgm.pour-game .lgh{color:#1e293b;font-size:clamp(20px,6vw,27px)}.lgm.pour-game .lgbr,.lgm.pour-game .pour-instructions,.lgm.pour-game .pour-rule{display:none}.lgt{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(14,16,52,.82);backdrop-filter:blur(8px)}.lgt .sp{flex:1}'+
'.lgib{width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.12);font-size:16px}.lgpill{background:linear-gradient(90deg,#FFC53D,#FF8A5B);color:#33250A;font-weight:900;font-size:11px;letter-spacing:.06em;padding:6px 10px;border-radius:999px}.lgchip{background:rgba(255,255,255,.14);padding:6px 11px;border-radius:999px;font-size:12px}'+
'.lgc{width:100%;max-width:980px;margin:0 auto;padding:14px 16px;display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center}.lgh{font-family:"Baloo 2",Nunito,sans-serif;font-weight:800;font-size:clamp(22px,4vw,34px);line-height:1.1}.lgmut{opacity:.75;font-size:14px;max-width:560px}.lgmut .w,.lgnote .w{color:#FFC53D}'+
'.lgb{padding:14px 22px;border-radius:16px;font-weight:900;font-size:16px;background:rgba(255,255,255,.14)}.lgb.go{background:linear-gradient(90deg,#27C99A,#4B6BFF);box-shadow:0 8px 24px rgba(39,201,154,.35)}.lgb.bad{background:#FF3B5C}.lgb.sm{padding:6px 12px;font-size:12px;border-radius:10px}.lgb:disabled{opacity:.4;cursor:not-allowed}.lgbtns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.lgfoot{display:flex;gap:10px;justify-content:center;padding:6px 0}'+
'.lgjoin{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap}.lgpin{background:rgba(255,255,255,.1);border-radius:20px;padding:14px 22px;display:flex;flex-direction:column;gap:6px;align-items:center}.lgpin small{opacity:.7}.lgpin b{font-family:"Baloo 2",sans-serif;font-size:clamp(34px,7vw,56px);letter-spacing:.08em;line-height:1}.lgqr{width:132px;height:132px;background:#fff;border-radius:16px;padding:6px;color:#1B2150;font-size:10px;overflow:hidden}.lgqr svg{width:100%;height:100%}'+
'.lgset{display:grid;grid-template-columns:auto auto;gap:8px 12px;align-items:center;background:rgba(255,255,255,.07);padding:12px 14px;border-radius:16px}.lgset label{font-size:13px;opacity:.8;text-align:left}.seg{display:flex;gap:4px}.seg button{padding:7px 12px;border-radius:10px;background:rgba(255,255,255,.1);font-size:13px}.seg button.on{background:#FFC53D;color:#33250A}.lgnote{font-size:13px;opacity:.85}.lgcnt{font-size:15px}.lgcnt b{font-size:22px;color:#FFC53D}'+
'.lggrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px;width:100%}.lgpt{display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 4px;border-radius:14px;background:rgba(255,255,255,.08);animation:lgpop .35s both}.lgpt.me{outline:2px solid #FFC53D}.lgpt b{font-size:12px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
'.lgcd{min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px;text-align:center}.lgcd.inl{min-height:0;padding:10px}.lgbig{font-family:"Baloo 2",sans-serif;font-weight:800;font-size:clamp(46px,12vw,110px);line-height:1;background:linear-gradient(90deg,#FFC53D,#FF8A5B);-webkit-background-clip:text;background-clip:text;color:transparent;animation:lgpop .5s both}.lgbig.sm{font-size:clamp(40px,10vw,70px)}.em{font-size:44px}.em.big{font-size:64px}.lgcd h2{font-family:"Baloo 2",sans-serif;font-size:26px}'+
'.lgspin{width:46px;height:46px;border-radius:50%;border:5px solid rgba(255,255,255,.2);border-top-color:#FFC53D;animation:lgrot 1s linear infinite}@keyframes lgrot{to{transform:rotate(360deg)}}@keyframes lgpop{from{opacity:0;transform:scale(.85) translateY(8px)}to{opacity:1;transform:none}}'+
'.lgbr{display:flex;gap:14px;overflow-x:auto;width:100%;padding:6px 2px 10px;text-align:left;-webkit-overflow-scrolling:touch}.lgcol{display:flex;flex-direction:column;justify-content:space-around;gap:8px;min-width:150px;flex:1}.lgcol h4{font-size:12px;opacity:.7;text-align:center;text-transform:uppercase;letter-spacing:.05em}.lgcol.cur h4{color:#FFC53D;opacity:1}'+
'.lgmx{background:rgba(255,255,255,.09);border-radius:12px;overflow:hidden;position:relative;animation:lgpop .4s both}.lgmx i{position:absolute;right:6px;top:50%;transform:translateY(-50%);font-style:normal}.lgr{display:flex;justify-content:space-between;gap:6px;padding:7px 10px;font-size:13px;border-bottom:1px solid rgba(255,255,255,.07)}.lgr:last-child{border:0}.lgr span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lgr.me{background:rgba(255,197,61,.22)}.lgr.win{color:#27C99A}.lgr.win span{font-weight:900}.lgr.bye{color:#FFC53D;font-size:12px}.lgr .q{opacity:.4}'+
'.lgvsl{display:flex;flex-direction:column;gap:10px;width:100%}.lgvsc{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;background:rgba(255,255,255,.08);border-radius:18px;padding:10px 14px;animation:lgpop .5s both}.lgvsc .s{display:flex;align-items:center;gap:10px;justify-content:flex-start;font-size:15px}.lgvsc .s:last-child{justify-content:flex-end;flex-direction:row-reverse}.lgvsc .vs{font-family:"Baloo 2",sans-serif;font-size:22px;color:#FFC53D}.lgvsc .bye{color:#FFC53D;font-size:13px}'+
'.lgvs{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;width:100%;max-width:560px;background:rgba(255,255,255,.08);border-radius:20px;padding:8px 12px}.lgvs .s{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}.lgvs .s b{font-size:13px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lgvs .sc,.lgdc .sc{display:flex;align-items:center;gap:6px;font-family:"Baloo 2",sans-serif;font-size:30px;flex-direction:row}.lgvs .sc em,.lgdc .sc em{font-style:normal;background:rgba(255,255,255,.14);border-radius:10px;min-width:38px;padding:0 8px}.lgvs.sm{padding:6px 10px}.lgvs.sm .sc{font-size:24px}.dots{font-size:13px;min-height:18px;letter-spacing:2px}'+
'.lgbar{width:100%;max-width:700px;height:10px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden}.lgbar i{display:block;height:100%;background:linear-gradient(90deg,#27C99A,#FFC53D);transition:width .2s linear}.lgsec{font-family:"Baloo 2",sans-serif;font-size:34px;color:#FFC53D;line-height:1}.lgq{font-family:"Baloo 2",sans-serif;font-weight:800;font-size:clamp(24px,4.4vw,44px);line-height:1.15;max-width:900px}.lgq.p{font-size:clamp(20px,5.4vw,28px)}.lgq.sm{font-size:18px;opacity:.85}'+
'.lgops{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:900px}.lgops.host{pointer-events:none}.lgop{display:flex;align-items:center;gap:10px;padding:16px 14px;border-radius:16px;font-size:clamp(15px,2.6vw,22px);text-align:left;min-height:64px;transition:transform .12s,opacity .2s}.lgop u{text-decoration:none;font-size:18px;opacity:.9}.lgop:active{transform:scale(.97)}.o0{background:#FF3B5C}.o1{background:#2D7BFF}.o2{background:#E39B00}.o3{background:#1FA56E}.lgop.dim{opacity:.35}.lgop.sel{outline:3px solid #fff}.lgop.ok{outline:3px solid #fff;box-shadow:0 0 22px rgba(39,201,154,.9)}.lgop.no{opacity:.6}'+
'.lgverdict{font-family:"Baloo 2",sans-serif;font-size:26px;padding:6px 18px;border-radius:14px}.lgverdict.y{background:rgba(39,201,154,.25)}.lgverdict.n{background:rgba(255,59,92,.25)}'+
'.lgduels{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;width:100%}.lgdc{display:grid;grid-template-columns:1fr auto 1fr;align-items:start;gap:6px;background:rgba(255,255,255,.08);border-radius:16px;padding:10px}.lgdc.done{opacity:.8}.lgdc .s{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:12px;min-width:0;position:relative}.lgdc .s b{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lgdc .s.win b{color:#27C99A}.lgdc .s i{position:absolute;top:0;right:8px;font-style:normal;color:#27C99A}.lgdc .sc{flex-wrap:wrap;justify-content:center;font-size:22px}.lgdc .sc small{width:100%;font-family:Nunito;font-size:10px;opacity:.8}.lgbyes{grid-column:1/-1;opacity:.8;font-size:13px}'+
'.lgpod{display:flex;align-items:flex-end;justify-content:center;gap:10px;margin:10px 0;width:100%}.lgpod .c{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;max-width:170px}.lgpod .pp{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:13px;min-height:84px;justify-content:flex-end}.lgpod .bar{width:100%;border-radius:14px 14px 0 0;display:flex;justify-content:center;padding-top:8px;font-family:"Baloo 2",sans-serif;font-size:30px;color:#33250A}.s1 .bar{height:150px;background:linear-gradient(#FFD95E,#F2A516)}.s2 .bar{height:104px;background:linear-gradient(#E4E8F4,#9BA6C2)}.s3 .bar{height:76px;background:linear-gradient(#F3B27A,#C77A3E)}.cup{font-size:40px;animation:lgpop .8s infinite alternate}.lg4{opacity:.85}'+
'.lgmx.pour{box-shadow:0 0 0 2px #FFC53D}.pour-match{display:block;width:100%;font:700 10px Nunito,sans-serif;opacity:.78;text-align:center;margin-top:3px}'+
'.pour-wrap{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;max-width:760px;margin:0 auto}.pour-watch{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}.pour-duel-summary{width:100%;max-width:420px}.pour-intro{text-align:center;display:flex;flex-direction:column;gap:7px;max-width:680px}.pour-intro p,.pour-rule,.pour-status,.pour-instructions{font-size:13px;line-height:1.5;opacity:.86}.pour-tag{align-self:center;border-radius:999px;padding:5px 12px;background:rgba(255,197,61,.15);color:#FFD057;font-size:11px;letter-spacing:.06em;text-transform:uppercase}.pour-vs{width:100%;display:flex;justify-content:center}.pour-instructions{display:grid;grid-template-columns:1fr 1fr;gap:5px 14px;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:12px 15px;width:100%}.pour-instructions b{grid-column:1/-1;color:#FFD057}.pour-arena-card{width:100%;display:flex;flex-direction:column;gap:10px;background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.055));border:1px solid rgba(255,255,255,.13);border-radius:22px;padding:12px;box-shadow:0 14px 35px rgba(0,0,0,.18)}.pour-scene{position:relative;width:100%;height:290px;overflow:hidden;border-radius:16px;background:linear-gradient(180deg,#222958 0%,#31396d 55%,#4a3450 56%,#7a4942 100%);touch-action:none;isolation:isolate}.pour-game .pour-scene{height:clamp(210px,34dvh,280px);flex:none}.pour-game .pour-intro{gap:3px}.pour-game .pour-intro p{display:none}.pour-game .pour-wrap{gap:8px}.pour-game .pour-watch{gap:8px}.pour-game .pour-watch .pour-intro p{display:block;font-size:11px}.pour-game .pour-arena-card{gap:8px;padding:9px 10px;background:rgba(255,255,255,.78);border-color:rgba(255,255,255,.95);box-shadow:0 10px 28px rgba(146,64,14,.12),0 2px 6px rgba(0,0,0,.04)}.pour-game .pour-arena-head{color:#334155;font-size:12px}.pour-game .pour-arena-head b,.pour-game .pour-level-row b{color:#b91c1c}.pour-game .pour-level-row{color:#475569}.pour-game .pour-tilt{color:#334155}.pour-game .pour-tilt b{color:#b91c1c}.pour-game .pour-tilt input{accent-color:#dc2626}.pour-game .pour-status{color:#475569;min-height:18px}.pour-game .pour-tag{background:rgba(239,68,68,.1);color:#b91c1c}.pour-game .lgvs{background:rgba(255,255,255,.76);color:#334155;padding:5px 8px;gap:5px}.pour-game .lgvs .sc em{background:#fee2e2;color:#991b1b;min-width:30px}.pour-game .pour-meter{background:#e2e8f0}.pour-game .pour-meter i{background:linear-gradient(90deg,#ef4444,#991b1b)}.pour-game .pour-bottle{width:17%;min-width:62px;max-width:92px}.pour-game .pour-glass{width:20%;min-width:72px;max-width:100px}.pour-game .pour-stream{left:72%;top:42%;height:44%}.pour-game .pour-actions .lgb{width:100%;min-height:40px;background:linear-gradient(135deg,#ef4444,#b91c1c);box-shadow:0 8px 20px rgba(220,38,38,.35);color:white}.pour-wall{position:absolute;inset:0 0 43%;opacity:.34;background:radial-gradient(ellipse at 50% 110%,rgba(255,255,255,.22),transparent 60%),repeating-linear-gradient(90deg,transparent 0 11%,rgba(255,255,255,.04) 11.2% 11.6%,transparent 12% 22%)}.pour-table{position:absolute;left:0;right:0;bottom:0;height:16%;background:linear-gradient(180deg,#99624b,#593b37);border-top:5px solid #c58a64;box-shadow:0 -5px 18px rgba(10,10,25,.24)}.pour-guide{position:absolute;left:5%;right:5%;bottom:17%;height:2px;border-top:2px dashed rgba(255,255,255,.28);display:flex;justify-content:center;z-index:1}.pour-guide span{position:absolute;top:-20px;font-size:10px;color:rgba(255,255,255,.7);white-space:nowrap}.pour-guide i{display:none}.pour-bottle{position:absolute;left:4%;bottom:8%;width:17%;min-width:72px;max-width:110px;aspect-ratio:100/180;z-index:3;touch-action:none;cursor:grab;filter:drop-shadow(0 10px 9px rgba(0,0,0,.32));transform-origin:50% 82%;user-select:none;-webkit-user-select:none}.pour-bottle:active{cursor:grabbing}.pour-bottle svg{display:block;width:100%;height:100%;overflow:visible}.pour-glass{position:absolute;z-index:2;left:75%;bottom:8%;transform:translateX(-50%);width:18%;min-width:78px;max-width:120px;height:44%;filter:drop-shadow(0 8px 7px rgba(0,0,0,.18))}.pour-stream{position:absolute;z-index:2;left:72%;top:42%;width:7px;height:44%;border-radius:99px;background:linear-gradient(90deg,#170a08,#593018 45%,#25100b);opacity:.86;transform:rotate(-5deg);transform-origin:top;pointer-events:none}.pour-stream[hidden]{display:none}.pour-bottle-home,.pour-glass-home{position:absolute;bottom:3%;z-index:1;font-size:10px;color:rgba(255,255,255,.7)}.pour-bottle-home{left:8%}.pour-glass-home{left:70%}.pour-level{display:flex;flex-direction:column;gap:7px}.pour-level-row b{font-size:14px;color:#FFD057}.pour-meter{height:9px;background:rgba(255,255,255,.13);border-radius:99px;overflow:hidden}.pour-meter i{display:block;height:100%;width:0;background:linear-gradient(90deg,#7c3b20,#2b120d);border-radius:99px}.pour-level-row.pour-sub{font-size:11px;opacity:.65}.pour-tilt{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;font-size:13px}.pour-tilt input{width:100%;accent-color:#FFC53D}.pour-tilt b{min-width:40px;text-align:right;color:#FFD057}.pour-status{text-align:center;min-height:20px;color:#fff}.pour-actions{display:flex;justify-content:center;width:100%}.pour-rule{text-align:center;max-width:630px;opacity:.67}.pour-wrap .lgb{min-width:200px}.pour-bottle[aria-disabled=true]{opacity:.55;pointer-events:none}'+
'@media(max-width:560px){.pour-instructions{grid-template-columns:1fr}.pour-instructions b{grid-column:auto}.pour-scene{height:250px}.pour-bottle{width:20%;min-width:70px}.pour-glass{width:22%;height:42%;left:76%}.pour-stream{left:72%;top:43%;height:38%}.pour-arena-card{padding:9px}.pour-wrap{gap:11px}}'+
'.lgmod{position:absolute;inset:0;z-index:5;background:rgba(5,6,30,.7);display:grid;place-items:center;padding:20px}.lgmod[hidden]{display:none}.lgmb{background:#1B1F5E;border-radius:22px;padding:22px;max-width:360px;width:100%;display:flex;flex-direction:column;gap:12px;text-align:center}.lgmb h3{font-family:"Baloo 2",sans-serif;font-size:22px}.lgmb p{opacity:.8;font-size:14px}.lgconn{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:6;background:#FF3B5C;padding:8px 14px;border-radius:999px;font-size:13px}.lgconn[hidden]{display:none}'+
'@media(max-width:560px){.lgops{grid-template-columns:1fr}.lgcol{min-width:138px}}';
})();
