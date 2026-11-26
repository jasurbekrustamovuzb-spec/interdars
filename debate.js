/* InterDars — Munozara: tasdiq va inkor jamoalari bitta katta ekranda. Qo‘shilish talab qilinmaydi.
   app.html'da league.js dan keyin yuklanadi. Saqlash: window.IDApp.saveLesson (app.html'da). */
(function(){
'use strict';
if(window.Debate)return;
var TEAMS=[['🦊','Tulkilar'],['🐬','Delfinlar'],['🦁','Sherlar'],['🐼','Pandalar'],['🦅','Burgutlar'],['🐺','Bo’rilar'],['🐯','Yo’lbarslar'],['🐙','Sakkizoyoqlar'],['🦉','Boyqushlar'],['🐢','Toshbaqalar'],['🦋','Kapalaklar'],['🐧','Pingvinlar']];
var PRE=[1,2,3,5,7];
var R=null,S=null,iv=0,left=0,run=0,pt=0;

function $(s){return R&&R.querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function say(m){var L=window.LiveQuiz;if(L&&L.say)L.say(m)}
function App(){return window.IDApp||{}}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function tn(i){var t=TEAMS[i]||['👥',(i+1)+'-jamoa'];return t[0]+' '+t[1]}
function fmt(s){s=Math.max(0,s);return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}

/* ===== uslublar ===== */
var CSS='#db{position:fixed;inset:0;z-index:9500;display:flex;flex-direction:column;font-family:inherit}#db[hidden]{display:none}'
+'#db.light{background:#F4F6FC;color:#1B2340;color-scheme:light}#db.dark{background:#0E1630;color:#fff;color-scheme:dark}'
+'#db button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}#db button:disabled{opacity:.55;cursor:default}'
+'#db :focus-visible{outline:3px solid #FFC53D;outline-offset:2px}'
+'#db .db-ic{width:44px;height:44px;border-radius:12px;font-size:18px;background:rgba(127,140,180,.18);flex:none}'
+'#db .db-pri{background:#4B6BFF;color:#fff;border-radius:12px;padding:11px 18px;font-weight:700;flex:none}'
+'#db .db-sec{background:#E4EAFF;color:#3149D6;border-radius:12px;padding:11px 16px;font-weight:700;flex:none}'
+'#db .db-eh,#db .db-lh,#db .db-sh{display:flex;align-items:center;gap:10px;padding:12px 16px}'
+'#db .db-eh{background:#fff;border-bottom:1px solid #E1E6F4}'
+'#db .db-nm{display:block;background:#fff;border:1.5px solid #E1E6F4;border-radius:16px;padding:10px 14px;margin-bottom:12px}#db .db-nm small{display:block;color:#69739A;font-size:13px}#db .db-nm span{display:flex;align-items:center;gap:8px}#db .db-ti{flex:1;min-width:0;font:inherit;font-size:18px;font-weight:700;border:0;background:transparent;color:inherit;padding:2px 0}#db .db-ti:focus{outline:0}'
+'#db .db-em{flex:1;overflow:auto;padding:18px max(16px,calc((100% - 820px)/2)) 70px;width:100%;box-sizing:border-box;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}'
+'#db .db-top{display:flex;gap:10px;align-items:stretch;margin-bottom:12px}#db .db-top .db-nm{flex:1;min-width:0;margin-bottom:0}#db .db-top .db-pri{align-self:stretch;white-space:nowrap;padding:0 18px;border-radius:16px}'
+'#db .db-ap{background:#fff;border:1.5px solid #CBD5FF;border-radius:16px;padding:14px;margin-bottom:12px;display:flex;flex-direction:column;gap:12px}'
+'#db .db-apt{margin:0}#db .db-apt b{display:block;font-size:17px}#db .db-apt small,#db .db-fr small,#db .db-fl small,#db .db-sw small{display:block;color:#69739A;font-size:13px;font-weight:400}'
+'#db .db-fl{display:block}#db .db-fl .db-inp{width:100%;box-sizing:border-box;margin-top:4px}'
+'#db .db-fr{display:flex;align-items:center;gap:10px;flex-wrap:wrap}#db .db-fn{flex:1;min-width:0;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
+'#db .db-note{margin:-4px 0 0;font-size:12.5px;color:#69739A}'
+'#db .db-sw{display:flex;align-items:center;gap:12px;text-align:left;width:100%;padding:10px 12px;border:1.5px solid #E1E6F4;border-radius:14px}#db .db-sw b{display:block}'
+'#db .db-kn{flex:none;width:44px;height:26px;border-radius:13px;background:#C5CCE6;position:relative;transition:background .15s}#db .db-kn::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .15s}'
+'#db .db-sw[aria-checked=true]{border-color:#4B6BFF;background:#F2F5FF}#db .db-sw[aria-checked=true] .db-kn{background:#4B6BFF}#db .db-sw[aria-checked=true] .db-kn::after{transform:translateX(18px)}'
+'#db .db-cr b{display:block;margin-bottom:6px;font-size:14px}#db .db-cr div{display:flex;gap:8px;flex-wrap:wrap}'
+'#db .db-cp{padding:8px 14px;border-radius:999px;background:#EEF1FB;font-weight:700;color:#3149D6}#db .db-cp[aria-pressed=true]{background:#4B6BFF;color:#fff}'
+'#db .db-go{width:100%;padding:13px}'
+'@media(max-width:520px){#db .db-aw{display:none}#db .db-top .db-pri{padding:0 14px}}'
+'#db .db-inp{flex:1;min-width:0;font:inherit;font-size:16px;padding:12px 14px;border:1.5px solid #D5DBEE;border-radius:12px;background:#fff;color:inherit}'
+'#db .db-msg{margin:6px 2px 12px;font-size:14px;color:#3149D6}'
+'#db .db-tc{display:flex;gap:10px;align-items:flex-start;background:#fff;border:1.5px solid #E1E6F4;border-radius:16px;padding:12px;margin-bottom:10px}'
+'#db .db-tc textarea{flex:1;min-width:0;font:inherit;font-size:16px;line-height:1.4;border:0;resize:none;background:transparent;color:inherit;min-height:48px}'
+'#db .db-tc input[type=checkbox]{appearance:none;-webkit-appearance:none;width:26px;height:26px;margin:2px 0 0;border-radius:50%;border:2px solid #B9C3E6;background:#fff;flex:none;cursor:pointer;display:grid;place-items:center}#db .db-tc input[type=checkbox]:checked{background:#4B6BFF;border-color:#4B6BFF}#db .db-tc input[type=checkbox]:checked::after{content:"\\2713";color:#fff;font-weight:800;font-size:15px;line-height:1}#db .db-tc.off textarea{opacity:.5}#db .db-hint{margin:2px 4px 10px;font-size:13px;color:#69739A}'
+'#db .db-rm{width:34px;height:34px;border-radius:10px;color:#8A93B2;flex:none}'
+'#db .db-add{width:100%;padding:14px;border:2px dashed #B9C3E6;border-radius:16px;font-weight:700;color:#3149D6;margin:2px 0 18px}'
+'#db .db-tm{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#fff;border-radius:16px;padding:14px;border:1.5px solid #E1E6F4}'
+'#db .db-tm>div:first-child{flex:1;min-width:140px}#db .db-tm small{display:block;color:#69739A}'
+'#db .db-st{display:flex;align-items:center;gap:6px}#db .db-st button{width:38px;height:38px;border-radius:50%;background:#E4EAFF;color:#3149D6;font-weight:800;font-size:20px}#db .db-st output{min-width:28px;text-align:center;font-weight:800;font-size:20px}'
+'#db .db-dr{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;padding:10px 4px;border-bottom:1px solid #E1E6F4;font-size:15px}'
+'#db .db-dr i{font-style:normal;border-radius:10px;padding:5px 9px;font-weight:700;font-size:14px;white-space:nowrap}'
+'#db .db-dr .pro,#db .db-lg .pro{background:#DDF7EE;color:#0B6B49}#db .db-dr .con,#db .db-lg .con{background:#FFE3E3;color:#A62B33}'
+'#db .db-dr small{font-weight:600;opacity:.8;margin-right:3px}'
/* katta ekran */
+'#db .db-lh{justify-content:space-between}#db .db-lt b{display:block;font-size:clamp(20px,2.6vw,34px)}#db .db-lt small{opacity:.7}#db .db-la{display:flex;gap:8px}'
+'#db .db-grid{flex:1;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;padding:8px 20px 28px;align-content:start}'
+'#db .db-dc{position:relative;text-align:left;background:#18244D;border-radius:22px;padding:20px 20px 16px;display:flex;flex-direction:column;gap:14px;min-height:190px;transition:transform .15s,background .15s}'
+'#db .db-dc:hover{background:#1F2E61;transform:translateY(-2px)}'
+'#db .db-dc b{font-size:clamp(18px,1.7vw,24px);line-height:1.3;flex:1}'
+'#db .db-no{position:absolute;top:-8px;left:-8px;width:34px;height:34px;border-radius:50%;background:#FFC53D;color:#1B2340;font-weight:800;display:grid;place-items:center}'
+'#db .db-vs{display:flex;gap:8px;flex-wrap:wrap;font-size:14px}#db .db-vs i{font-style:normal;padding:5px 10px;border-radius:10px;font-weight:700}'
+'#db .db-vs .pro{background:#14A36F}#db .db-vs .con{background:#E8504F}#db .db-dn{position:absolute;top:14px;right:16px;color:#6EE7B7;font-weight:800}'
+'#db .db-empty{margin:auto;text-align:center;padding:30px;max-width:420px}#db .db-empty p{opacity:.75}'
+'#db .db-sh{gap:8px}#db .db-cn{font-weight:800;font-size:18px;min-width:56px;text-align:center}#db .db-sp{flex:1}'
+'#db .db-tmr{font-weight:800;font-size:clamp(26px,3vw,40px);font-variant-numeric:tabular-nums;padding:0 8px}#db .db-tmr.low{color:#FFC53D}#db .db-tmr.end{color:#FF7A7A;animation:dbp .6s 4}'
+'#db .db-ch{background:rgba(255,255,255,.14);border-radius:12px;padding:10px 14px;font-weight:700}'
+'#db .db-sm{flex:1;display:flex;flex-direction:column;gap:3vh;padding:1vh 4vw 3.5vh;min-height:0}'
+'#db .db-tp{margin:0;text-align:center;font-weight:800;line-height:1.15;font-size:clamp(26px,4.4vw,68px);max-height:38vh;overflow:auto;text-wrap:balance}'
+'#db .db-sd{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:3vw;min-height:0}'
+'#db .db-pn{border-radius:28px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.5vh;padding:2vh;transition:box-shadow .2s,transform .2s}'
+'#db .db-pn.pro{background:linear-gradient(160deg,#1BB37B,#0E7F57)}#db .db-pn.con{background:linear-gradient(160deg,#F0605E,#C93241)}'
+'#db .db-pn.on{box-shadow:0 0 0 6px #FFC53D,0 0 44px rgba(255,197,61,.45);transform:scale(1.015)}'
+'#db .db-who{text-align:center;padding:6px 12px;border-radius:18px}#db .db-who small{display:block;font-size:clamp(16px,1.8vw,26px);font-weight:700;opacity:.9}'
+'#db .db-who .e{display:block;font-size:clamp(52px,8vw,124px);line-height:1.1}#db .db-who b{display:block;font-size:clamp(22px,3.2vw,48px)}'
+'#db .db-sc{display:flex;gap:8px}#db .db-sc button{width:clamp(38px,4vw,58px);height:clamp(38px,4vw,58px);border-radius:50%;background:rgba(255,255,255,.2);font-weight:800;font-size:clamp(16px,1.8vw,26px)}'
+'#db .db-sc button.sel{background:#fff;color:#14233F}'
+'#db .db-lg{max-width:640px;width:100%;margin:0 auto;padding:6px 20px 40px;overflow:auto}'
+'#db .db-rk{display:flex;align-items:center;gap:14px;background:#18244D;border-radius:18px;padding:14px 18px;margin-bottom:10px;font-size:clamp(18px,2vw,26px)}'
+'#db .db-rk:first-child{background:linear-gradient(120deg,#C98A00,#FFC53D);color:#1B2340}'
+'#db .db-rk b{flex:1}#db .db-rk em{font-style:normal;font-weight:800;font-size:1.3em}'
+'@media(max-width:700px){#db .db-sd{grid-template-columns:1fr;gap:12px}#db .db-pn{flex-direction:row;justify-content:space-around}#db .db-eh .db-sec{display:none}}'
+'@keyframes dbp{50%{transform:scale(1.18)}}@media(prefers-reduced-motion:reduce){#db *{transition:none!important;animation:none!important}}';

function open(){
  if(!document.getElementById('db-css')){var s=document.createElement('style');s.id='db-css';s.textContent=CSS;document.head.appendChild(s)}
  if(!R){R=document.createElement('div');R.id='db';R.setAttribute('role','dialog');R.setAttribute('aria-label','Munozara');
    R.addEventListener('click',onClick);R.addEventListener('input',onInput);R.addEventListener('change',onChange);document.addEventListener('keydown',onKey);document.body.appendChild(R)}
  R.hidden=false;document.documentElement.style.overflow='hidden'}
function close(){
  stopT();clearTimeout(pt);if(S&&S.own&&S.pend){flush()}
  if(R){R.hidden=true;R.innerHTML=''}S=null;document.documentElement.style.overflow='';
  try{if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen()}catch(e){}}

/* ===== mantiq ===== */
function draw(d){
  var n=d.teams,on=d.topics.filter(function(x){return x.on&&x.t.trim()}),k=Math.min(Math.floor(n/2),on.length),ids=[],i;
  for(i=0;i<n;i++)ids.push(i);ids=shuffle(ids);on=shuffle(on.slice());d.duels=[];
  for(i=0;i<k;i++)d.duels.push({t:on[i].t,h:on[i].h||[],pro:ids[2*i],con:ids[2*i+1],ps:0,cs:0});
  d.dirty=0}
function who(){try{var u=JSON.parse(localStorage.getItem('idUser')||'null')||{};return String(u.name||'').trim().split(/\s+/)[0]}catch(e){return ''}}
function defTitle(){var n=who();return n?n+'ning munozara kechasi':'Munozara kechasi'}
function clone(o){return JSON.parse(JSON.stringify(o))}
function persist(){if(!S||!S.own)return;S.pend=1;clearTimeout(pt);pt=setTimeout(flush,600)}
function flush(){if(S&&S.pend){S.pend=0;var a=App();if(a.saveLesson)a.saveLesson(S.l,false,true)}}

/* ===== AI sozlamalari ===== */
function oo(){return S.o||(S.o={q:'',web:0,n:6,lv:2,file:null,rd:0})}
function aiPanel(){
  var o=oo(),h='<section class="db-ap" aria-label="AI tavsiyalari"><p class="db-apt"><b>✨ AI yordamchi</b><small>Hammasi ixtiyoriy. Hech narsa tanlamasangiz, AI o‘zi mavzu topadi.</small></p>'
  +'<label class="db-fl"><small>Soha yoki mavzu</small><input id="db-aq" class="db-inp" maxlength="120" placeholder="Munozara qaysi soha haqida bo‘lsin?" value="'+esc(o.q)+'"></label>';
  if(window.XT){
    h+='<div class="db-fr">'+(o.file?'<span class="db-fn">📄 '+esc(o.file.name)+'</span><button class="db-sec" data-a="fx">Olib tashlash</button>'
      :'<button class="db-sec" data-a="pick"'+(o.rd?' disabled':'')+'>'+(o.rd?'O‘qilmoqda…':'📄 Darslik yuklash')+'</button><small>PDF, Word, PowerPoint · 3 MB gacha</small>')+'</div>'
      +(o.file?'<p class="db-note">Fayl qurilmangizda o‘qiladi. Faqat undan olingan matn Google AI’ga yuboriladi, fayl saqlanmaydi. Bepul rejimda Google bu matndan xizmatni yaxshilash uchun foydalanishi mumkin.</p>':'')
      +'<input type="file" id="db-f" hidden accept=".pdf,.doc,.docx,.ppt,.pptx,.txt">'}
  h+='<button class="db-sw" data-a="web" role="switch" aria-checked="'+(o.web?'true':'false')+'"><span class="db-kn"></span><span><b>🌐 Internetdan izlash</b><small>Mavzuga aloqador dolzarb mavzularni internetdan topadi</small></span></button>'
  +'<div class="db-cr"><b>Nechta mavzu?</b><div>'+[4,6,8,10].map(function(n){return '<button class="db-cp" data-a="on" data-n="'+n+'" aria-pressed="'+(o.n===n)+'">'+n+'</button>'}).join('')+'</div></div>'
  +'<div class="db-cr"><b>Qiyinlik</b><div>'+[[1,'Oson'],[2,'O‘rtacha'],[3,'Murakkab']].map(function(x){return '<button class="db-cp" data-a="ol" data-n="'+x[0]+'" aria-pressed="'+(o.lv===x[0])+'">'+x[1]+'</button>'}).join('')+'</div></div>'
  +'<button class="db-pri db-go" data-a="aigo"'+(S.busy||o.rd?' disabled':'')+'>'+(S.busy?(o.web?'Internetdan izlanmoqda…':'Mavzular tuzilmoqda…'):'✨ Mavzularni topish')+'</button></section>';
  return h}
function fileMsg(c){return{big:'Fayl 3 MB dan katta',type:'Bu format qo‘llanmaydi',enc:'Fayl parol bilan himoyalangan',long:'PDF 160 sahifadan oshmasligi kerak',read:'Faylni o‘qib bo‘lmadi'}[c]||'Faylni o‘qib bo‘lmadi'}
function readFile(f){
  var o=oo();sync();
  if(f.size>3*1024*1024){S.msg=fileMsg('big');return render()}
  o.rd=1;S.msg='';render();
  window.XT.read(f).then(function(r){
    if(!S)return;o.rd=0;
    if(!r||r.err){S.msg=fileMsg(r&&r.err)}
    else if(!r.text||r.text.length<200){S.msg='Matn topilmadi — skan qilingan bo‘lishi mumkin'}
    else{o.file={name:f.name,text:r.text.slice(0,60000)};S.msg=r.text.length>60000?'Matn qisqartirildi — faqat boshlang‘ich qismi ishlatiladi.':''}
    render()}).catch(function(){if(!S)return;o.rd=0;S.msg=fileMsg('read');render()})}

/* ===== ko‘rinishlar ===== */
function topicCard(x,i){
  return '<div class="db-tc'+(x.on?'':' off')+'"><input type="checkbox" data-f="on" data-i="'+i+'"'+(x.on?' checked':'')+' aria-label="Munozaraga kiritish"><textarea data-f="t" data-i="'+i+'" rows="2" maxlength="300" placeholder="Munozara mavzusini yozing">'+esc(x.t)+'</textarea>'
  +'<button class="db-rm" data-a="rm" data-i="'+i+'" aria-label="O‘chirish">✕</button></div>'}
function vEdit(){
  var d=S.d,h='<header class="db-eh"><button class="db-ic" data-a="close" aria-label="Yopish">✕</button>'
  +'<span class="db-sp"></span>'
  +'<button class="db-sec" data-a="start">Boshlash</button><button class="db-pri" data-a="save">Saqlash</button></header><main class="db-em">'
  +'<div class="db-top"><label class="db-nm"><small>Munozara nomi</small><span><input id="db-title" class="db-ti" maxlength="80" placeholder="Munozara nomini yozing" value="'+esc(S.title)+'"><i aria-hidden="true">✏️</i></span></label>'
  +'<button class="db-pri" data-a="ai"'+(S.busy?' disabled':'')+'>'+(S.busy?'Qidirilmoqda…':'✨ AI<span class="db-aw"> tavsiyalari</span>')+'</button></div>'
  +(S.aiOpen?aiPanel():'')
  +(S.msg?'<p class="db-msg" role="status">'+esc(S.msg)+'</p>':'')
  +d.topics.map(topicCard).join('')+(d.topics.length>1?'<p class="db-hint">Belgilangan mavzular jamoalar o’rtasida juftlanadi. Keraklisini tanlang.</p>':'')+'<button class="db-add" data-a="add">＋ Mavzu tuzish</button>'
  +'<div class="db-tm"><div><b>Jamoalar</b><small>'+(d.teams%2?'Bitta jamoa juftsiz qoladi':Math.floor(d.teams/2)+' ta munozara')+'</small></div>'
  +'<div class="db-st"><button data-a="t-" aria-label="Kamaytirish">−</button><output>'+d.teams+'</output><button data-a="t+" aria-label="Ko‘paytirish">＋</button></div>'
  +'<button class="db-sec" data-a="draw" title="Har bir mavzu uchun tasdiq va inkor jamoalarini tasodifiy tanlaydi">🆚 Jamoalarni juftlash</button></div>';
  if(d.duels.length&&!d.dirty){
    h+='<div style="margin-top:14px">'+d.duels.map(function(x){return '<div class="db-dr"><span>'+esc(x.t)+'</span><i class="pro"><small>Tasdiq</small>'+tn(x.pro)+'</i><i class="con"><small>Inkor</small>'+tn(x.con)+'</i></div>'}).join('')+'</div>'}
  return h+'</main>'}
function vList(){
  var d=S.d,h='<header class="db-lh"><div class="db-lt"><b>'+esc(S.l.title)+'</b><small>'+d.duels.length+' ta munozara</small></div><div class="db-la">'
  +'<button class="db-ic" data-a="res" title="Natijalar" aria-label="Natijalar">🏆</button>'
  +(S.own?'<button class="db-ic" data-a="edit" title="Tahrirlash" aria-label="Tahrirlash">✏️</button>':'')
  +'<button class="db-ic" data-a="fs" title="To‘liq ekran" aria-label="To‘liq ekran">⛶</button><button class="db-ic" data-a="close" aria-label="Yopish">✕</button></div></header>';
  if(!d.duels.length)return h+'<div class="db-empty"><h2>Jamoalar hali juftlanmagan</h2><p>Mavzularni tanlab, “Jamoalarni juftlash”ni bosing.</p>'+(S.own?'<button class="db-pri" data-a="edit">Tahrirlash</button>':'')+'</div>';
  return h+'<main class="db-grid">'+d.duels.map(function(x,i){
    return '<button class="db-dc" data-a="open" data-i="'+i+'"><span class="db-no">'+(i+1)+'</span>'+((x.ps||x.cs)?'<span class="db-dn">✓</span>':'')
    +'<b>'+esc(x.t)+'</b><span class="db-vs"><i class="pro">'+tn(x.pro)+'</i><i class="con">'+tn(x.con)+'</i></span></button>'}).join('')+'</main>'}
function panel(x,s){
  var p=s==='p',t=p?x.pro:x.con,v=p?x.ps:x.cs,e=TEAMS[t]||['👥',(t+1)+'-jamoa'];
  return '<section class="db-pn '+(p?'pro':'con')+(S.sp===s?' on':'')+'"><button class="db-who" data-a="sp" data-s="'+s+'" aria-pressed="'+(S.sp===s)+'">'
  +'<small>'+(p?'Tasdiq':'Inkor')+'</small><span class="e">'+e[0]+'</span><b>'+esc(e[1])+'</b></button><div class="db-sc" role="group" aria-label="Baho">'
  +[1,2,3,4,5].map(function(n){return '<button data-a="sc" data-s="'+s+'" data-n="'+n+'" class="'+(v===n?'sel':'')+'" aria-pressed="'+(v===n)+'">'+n+'</button>'}).join('')+'</div></section>'}
function vStage(){
  var d=S.d,x=d.duels[S.cur],n=d.duels.length,tm;
  if(S.tm)tm='<span class="db-tmr'+(left<=0?' end':left<=10?' low':'')+'" id="db-t">'+fmt(left)+'</span><button class="db-ic" data-a="tgo" aria-label="'+(run?'To‘xtatish':'Boshlash')+'">'+(run?'⏸':'▶')+'</button><button class="db-ic" data-a="trs" aria-label="Qayta">↺</button><button class="db-ic" data-a="tx" aria-label="Taymerni yopish">✕</button>';
  else if(S.tp)tm=PRE.map(function(m){return '<button class="db-ch" data-a="tms" data-n="'+m+'">'+m+' daq</button>'}).join('');
  else tm='<button class="db-ch" data-a="tp">⏱ Vaqt</button>';
  return '<header class="db-sh"><button class="db-ic" data-a="list" aria-label="Ro‘yxat">☰</button><button class="db-ic" data-a="prev" aria-label="Oldingi"'+(S.cur?'':' disabled')+'>‹</button>'
  +'<span class="db-cn">'+(S.cur+1)+' / '+n+'</span><button class="db-ic" data-a="next" aria-label="Keyingi"'+(S.cur<n-1?'':' disabled')+'>›</button><span class="db-sp"></span>'+tm
  +'<button class="db-ic" data-a="fs" aria-label="To‘liq ekran">⛶</button></header>'
  +'<main class="db-sm"><h1 class="db-tp">'+esc(x.t)+'</h1><div class="db-sd">'+panel(x,'p')+panel(x,'c')+'</div></main>'}
function vRes(){
  var tot={},rows;S.d.duels.forEach(function(x){tot[x.pro]=(tot[x.pro]||0)+(x.ps||0);tot[x.con]=(tot[x.con]||0)+(x.cs||0)});
  rows=Object.keys(tot).map(function(k){return{k:+k,s:tot[k]}}).sort(function(a,b){return b.s-a.s});
  return '<header class="db-lh"><div class="db-lt"><b>Natijalar</b></div><div class="db-la"><button class="db-ic" data-a="list" aria-label="Orqaga">☰</button><button class="db-ic" data-a="close" aria-label="Yopish">✕</button></div></header>'
  +'<div class="db-lg">'+rows.map(function(r,i){return '<div class="db-rk"><span>'+(i===0&&r.s>0?'🏆':(i+1))+'</span><b>'+esc(tn(r.k))+'</b><em>'+r.s+'</em></div>'}).join('')+'</div>'}
function render(){
  if(!S)return;
  var m0=R.querySelector('.db-em'),st=m0?m0.scrollTop:0;
  R.className=S.v==='edit'?'light':'dark';
  R.innerHTML=S.v==='edit'?vEdit():S.v==='stage'?vStage():S.v==='res'?vRes():vList();
  if(st){var m1=R.querySelector('.db-em');if(m1)m1.scrollTop=st}}

/* ===== taymer ===== */
function stopT(){clearInterval(iv);iv=0;run=0}
function updT(){var el=$('#db-t');if(el){el.textContent=fmt(left);el.className='db-tmr'+(left<=10&&left>0?' low':'')}}
function beep(){try{var C=window.AudioContext||window.webkitAudioContext,c=new C(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.setValueAtTime(.2,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.9);o.start();o.stop(c.currentTime+.9)}catch(e){}}
function tick(){left--;if(left<=0){left=0;stopT();beep();render()}else updT()}
function goDuel(k){var n=S.d.duels.length;if(k<0||k>=n)return;S.cur=k;S.sp='';stopT();left=S.tm||0;render()}

/* ===== AI ===== */
function token(){
  var sb=window.sb;if(!sb||!sb.auth)return Promise.reject(new Error('Hisobingizga qayta kiring.'));
  return sb.auth.getSession().then(function(r){var t=r&&r.data&&r.data.session&&r.data.session.access_token;if(!t)throw new Error('Hisobingizga qayta kiring.');return t})}
function doAI(){
  sync();var o=oo();S.busy=1;S.msg='';render();
  var ex=S.d.topics.map(function(x){return x.t.trim()}).filter(Boolean).slice(0,30);
  token().then(function(tk){return fetch('/api/generate-debate',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tk},body:JSON.stringify({count:o.n,level:o.lv,topic:o.q.trim(),web:!!o.web,text:o.file?o.file.text:'',exclude:ex})})})
  .then(function(r){if(r.status===404)throw new Error('soon');return r.json().then(function(j){if(!r.ok)throw new Error((j&&j.error)||'err');return j})})
  .then(function(j){if(!S)return;var a=(j.topics||[]).filter(function(x){return x&&typeof x.t==='string'&&x.t.trim()}).slice(0,10);
    S.d.topics=S.d.topics.filter(function(x){return x.t.trim()});
    a.forEach(function(x){S.d.topics.push({t:x.t.trim().slice(0,300),h:Array.isArray(x.h)?x.h.slice(0,3):[],on:1})});
    if(a.length)S.aiOpen=0;
    S.d.dirty=1;S.chg=1;S.msg=a.length?a.length+' ta tavsiya qo’shildi'+(o.web&&j.web===false?' (internetdan izlab bo’lmadi, shuning uchun mavzular AI’ning o’z bilimi asosida tuzildi)':'')+'. Keraksizini olib tashlang yoki o’zgartiring.':'Tavsiya topilmadi. Boshqacha yozib ko’ring.'})
  .catch(function(e){if(!S)return;var m=e&&e.message;S.msg=m==='soon'?'AI tavsiyalari tez orada ishga tushadi. Hozircha “Mavzu tuzish” orqali yozing.':(m&&m!=='err'&&m.length<120?m:'AI javob bermadi. Birozdan keyin qayta urinib ko’ring.')})
  .then(function(){if(S){S.busy=0;if(S.v==='edit')render()}})}

/* ===== saqlash ===== */
function sync(){var t=$('#db-title'),a=$('#db-ai'),q=$('#db-aq');if(t)S.title=t.value;if(a)S.ai=a.value;if(q)oo().q=q.value}
function save(go){
  sync();var d=S.d;
  d.topics=d.topics.filter(function(x){return x.t.trim()});d.topics.forEach(function(x){x.t=x.t.trim()});
  if(!d.topics.length){S.msg='Kamida bitta mavzu yozing yoki “AI tavsiyalari”ni bosing.';if(!d.topics.length)d.topics.push({t:'',h:[],on:1});return render()}
  if(!d.topics.some(function(x){return x.on})){S.msg='Kamida bitta mavzuni belgilang.';return render()}
  if(d.dirty||!d.duels.length)draw(d);
  var a=App();if(!a.saveLesson){S.msg='Saqlab bo’lmadi: app.html eski. app.html va debate.js ni birga joylang va sahifani yangilang.';return render()}
  S.l.title=(S.title||'').trim()||defTitle();S.l.deb=d;
  try{a.saveLesson(S.l,S.isNew)}catch(err){console.error('Munozara saqlash xatosi:',err);if(S.isNew&&!S.l.id){S.msg='Saqlab bo’lmadi: '+((err&&err.message)||err);return render()}}
  S.isNew=false;S.chg=0;S.own=true;say('Saqlandi');
  if(go){S.v='list';S.cur=0;render()}else close()}

/* ===== hodisalar ===== */
function onInput(e){
  var t=e.target;if(!S)return;
  if(t.id==='db-title'){S.title=t.value;S.chg=1;return}
  if(t.id==='db-ai'){S.ai=t.value;return}
  if(t.id==='db-aq'){oo().q=t.value;return}
  if(!t.dataset||!t.dataset.f)return;
  var x=S.d.topics[+t.dataset.i];if(!x)return;
  if(t.dataset.f==='on'){x.on=t.checked?1:0;if(t.parentNode&&t.parentNode.classList)t.parentNode.classList.toggle('off',!t.checked)}
  else x.t=t.value;
  S.d.dirty=1;S.chg=1}
function pressed(b){var l=b.parentNode.children;for(var k=0;k<l.length;k++)l[k].setAttribute('aria-pressed',l[k]===b?'true':'false')}
function onChange(e){var t=e.target;if(!S||!t||t.id!=='db-f')return;var f=t.files&&t.files[0];t.value='';if(f)readFile(f)}
function leaveEdit(){if(S.chg&&!window.confirm('Saqlanmagan o’zgarishlar o’chadi. Chiqasizmi?'))return;close()}
function onClick(e){
  var b=e.target.closest('[data-a]');if(!b||!S)return;
  var a=b.dataset.a,i=+b.dataset.i,d=S.d,x=d.duels&&d.duels[S.cur];
  if(a==='close'){if(S.v==='edit')leaveEdit();else close()}
  else if(a==='save')save(false);else if(a==='start')save(true);else if(a==='ai'){sync();S.aiOpen=!S.aiOpen;render()}else if(a==='aigo')doAI();
  else if(a==='web'){var ow=oo();ow.web=ow.web?0:1;b.setAttribute('aria-checked',ow.web?'true':'false')}else if(a==='on'){oo().n=+b.dataset.n;pressed(b)}else if(a==='ol'){oo().lv=+b.dataset.n;pressed(b)}
  else if(a==='pick'){var fi=$('#db-f');if(fi)fi.click()}else if(a==='fx'){sync();oo().file=null;render()}
  else if(a==='add'){sync();d.topics.push({t:'',h:[],on:1});d.dirty=1;S.chg=1;render();var l=R.querySelectorAll('.db-tc textarea');if(l.length)l[l.length-1].focus()}
  else if(a==='rm'){sync();d.topics.splice(i,1);if(!d.topics.length)d.topics.push({t:'',h:[],on:1});d.dirty=1;S.chg=1;render()}
  else if(a==='t-'||a==='t+'){sync();d.teams=Math.max(2,Math.min(12,d.teams+(a==='t+'?1:-1)));d.dirty=1;S.chg=1;render()}
  else if(a==='draw'){sync();d.topics=d.topics.filter(function(t){return t.t.trim()});if(!d.topics.length){d.topics.push({t:'',h:[],on:1});S.msg='Avval mavzu yozing.';return render()}draw(d);S.chg=1;S.msg='';render()}
  else if(a==='open'){S.v='stage';S.tp=0;goDuel(i)}
  else if(a==='list'){stopT();S.v='list';render()}
  else if(a==='res'){S.v='res';render()}
  else if(a==='edit'){if(S.own){stopT();S.v='edit';S.chg=0;S.title=S.l.title;S.d=clone(S.l.deb);render()}}
  else if(a==='prev')goDuel(S.cur-1);else if(a==='next')goDuel(S.cur+1);
  else if(a==='fs'){try{if(document.fullscreenElement)document.exitFullscreen();else if(R.requestFullscreen)R.requestFullscreen()}catch(err){}}
  else if(a==='tp'){S.tp=1;render()}
  else if(a==='tms'){S.tm=+b.dataset.n*60;left=S.tm;stopT();render()}
  else if(a==='tgo'){if(left<=0)left=S.tm;if(run)stopT();else{run=1;iv=setInterval(tick,1000)}render()}
  else if(a==='trs'){stopT();left=S.tm;render()}
  else if(a==='tx'){stopT();S.tm=0;S.tp=0;left=0;render()}
  else if(a==='sp'){S.sp=S.sp===b.dataset.s?'':b.dataset.s;render()}
  else if(a==='sc'&&x){var f=b.dataset.s==='p'?'ps':'cs',n=+b.dataset.n;x[f]=x[f]===n?0:n;persist();render()}}
function onKey(e){
  if(!S||!R||R.hidden)return;var tg=e.target;
  if(tg&&/INPUT|TEXTAREA/.test(tg.tagName)){if(e.key==='Enter'&&(tg.id==='db-ai'||tg.id==='db-aq')){e.preventDefault();doAI()}return}
  if(e.key==='Escape'){if(S.v==='stage'||S.v==='res'){stopT();S.v='list';render()}else if(S.v==='edit')leaveEdit();else close();return}
  if(S.v!=='stage')return;
  if(e.key==='ArrowRight')goDuel(S.cur+1);else if(e.key==='ArrowLeft')goDuel(S.cur-1);
  else if(e.key===' '&&S.tm){e.preventDefault();var g=$('[data-a=tgo]');if(g)g.click()}}

/* ===== ochiq API ===== */
function startEdit(l,isNew){
  open();S={l:l,isNew:isNew,v:'edit',own:true,aiOpen:0,o:null,title:l.title||(isNew?defTitle():''),ai:'',msg:'',chg:0,d:clone(l.deb),cur:0,tm:0,sp:''};
  S.d.topics=S.d.topics||[];if(!S.d.topics.length)S.d.topics.push({t:'',h:[],on:1});
  S.d.teams=S.d.teams||4;S.d.duels=S.d.duels||[];render();if(isNew){var f=R.querySelector('.db-tc textarea');if(f)f.focus()}}
window.Debate={
  create:function(){startEdit({m:'debate',title:'',deb:{teams:4,topics:[],duels:[]}},true)},
  edit:function(l){if(l&&l.deb)startEdit(l,false)},
  host:function(l){
    if(!l||!l.deb)return;open();left=0;stopT();
    S={l:l,v:'list',own:l.id.charAt(0)==='u',d:l.deb,cur:0,tm:0,sp:''};
    S.d.duels=S.d.duels||[];S.d.topics=S.d.topics||[];render()}
};
})();
