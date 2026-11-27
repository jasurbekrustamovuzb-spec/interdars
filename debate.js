/* InterDars — Munozara: tasdiq va inkor jamoalari bitta katta ekranda. Qo‘shilish talab qilinmaydi.
   app.html'da league.js dan keyin yuklanadi. Saqlash: window.IDApp.saveLesson (app.html'da). */
(function(){
'use strict';
if(window.Debate)return;
var PRE=[1,2,3,5,7];
var R=null,S=null,iv=0,left=0,run=0,pt=0;

function $(s){return R&&R.querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function say(m){var L=window.LiveQuiz;if(L&&L.say)L.say(m)}
function App(){return window.IDApp||{}}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
/* guruh nomlari: standart "Tasdiq" va "Inkor", xohlasa o‘zgartiradi (x.pn / x.cn) */
function nm(x,s){return s==='p'?(x.pn||'Tasdiq'):(x.cn||'Inkor')}
var I={share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>',
edit:'<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
cup:'<path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 20h8"/>',
full:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
x:'<path d="M6 6l12 12M18 6L6 18"/>',list:'<path d="M4 6h16M4 12h16M4 18h16"/>',
prev:'<path d="M15 5l-7 7 7 7"/>',next:'<path d="M9 5l7 7-7 7"/>',
play:'<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',pause:'<path d="M8 5v14M16 5v14"/>',
reset:'<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
ok:'<path d="M5 12.5l4.5 4.5L19 7.5"/>'};
function ico(n){return '<svg class="sv" viewBox="0 0 24 24" aria-hidden="true">'+I[n]+'</svg>'}
var SCALES='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 8v31M14 41h20M8 14h32"/><path d="M8 14l-6 14a6 6 0 0 0 12 0L8 14zM40 14l-6 14a6 6 0 0 0 12 0l-6-14z"/><circle cx="24" cy="7" r="2"/></svg>';
function fmt(s){s=Math.max(0,s);return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}

/* ===== uslublar ===== */
var CSS='#db{position:fixed;inset:0;z-index:9500;display:flex;flex-direction:column;font-family:inherit}#db[hidden]{display:none}'
+'html.db-open body>*:not(#db){visibility:hidden!important}'
+'#db.light{background:#F4F6FC;color:#1B2340;color-scheme:light}'
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
/* katta ekran: rasmiy, yorug' uslub (katta o'qiladigan shrift, uzoqdan ko'rinadi) */
+'#db.big{background:#FBFAF6;color:#14213D;color-scheme:light;font-family:Georgia,"Times New Roman",serif;font-variant-numeric:lining-nums;overflow:hidden;box-shadow:inset 0 10px 0 #14213D,inset 0 13px 0 #C9A227}'
+'#db.big::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(55% 70% at 0% 62%,rgba(15,107,74,.10),transparent 70%),radial-gradient(55% 70% at 100% 62%,rgba(179,38,46,.10),transparent 70%)}'
+'#db.big>*{position:relative;z-index:1}'
+'#db .sv{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;flex:none}'
+'#db.big .db-ic{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;color:#14213D;border:2px solid #14213D;background:#fff;transition:background .15s,color .15s,transform .15s}'
+'#db.big .db-ic:hover:not(:disabled){background:#14213D;color:#fff;transform:translateY(-1px)}#db.big .db-ic:disabled{opacity:.3}'
+'#db .db-lh{justify-content:space-between;padding:30px 36px 12px}'
+'#db .db-lt b{display:block;font-size:clamp(30px,3.6vw,58px);line-height:1.1;font-weight:700;color:#14213D}'
+'#db .db-lt b::after{content:"";display:block;width:96px;height:4px;background:#C9A227;margin-top:14px}'
+'#db .db-lt small{display:block;margin-top:12px;font-size:clamp(14px,1.2vw,18px);font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#4A5778}'
+'#db .db-la{display:flex;gap:12px}'
+'#db .db-grid{flex:1;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:28px;padding:22px 36px 56px;align-content:start}'
+'#db .db-dc{position:relative;display:flex;flex-direction:column;text-align:center;border-radius:6px;padding:28px 28px 0;min-height:300px;overflow:hidden;color:#14213D;background:#fff;border:2px solid #14213D;box-shadow:0 10px 24px rgba(20,33,61,.14);transition:transform .2s,box-shadow .2s}'
+'#db .db-dc::before{content:"";position:absolute;inset:6px;border:1px solid rgba(201,162,39,.7);pointer-events:none;border-radius:3px}'
+'#db .db-dc:hover{transform:translateY(-4px);box-shadow:0 18px 34px rgba(20,33,61,.22)}'
+'#db .db-no{position:static;margin:0 auto 16px;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:#14213D;color:#fff;font-size:23px;font-weight:700}'
+'#db .db-dc b{flex:1;display:flex;align-items:center;justify-content:center;font-size:clamp(23px,2vw,32px);line-height:1.3;font-weight:700;color:#14213D;padding-bottom:26px}'
+'#db .db-vs{display:grid;grid-template-columns:1fr 1fr;margin:0 -28px;font-size:clamp(14px,1.15vw,18px)}'
+'#db .db-vs i{font-style:normal;padding:16px 8px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
+'#db .db-vs .pro{background:#0F6B4A}#db .db-vs .con{background:#B3262E}'
+'#db .db-dn{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#0F6B4A;color:#fff}'
+'#db .db-dn .sv{width:18px;height:18px;stroke-width:3}'
+'#db .db-empty{margin:auto;text-align:center;padding:30px;max-width:460px}#db .db-empty h2{color:#14213D;font-size:28px}#db .db-empty p{color:#4A5778;font-size:18px}'
+'#db .db-sh{gap:12px;padding:30px 28px 14px}'
+'#db .db-cn{font-weight:700;font-size:26px;min-width:84px;text-align:center;color:#14213D;letter-spacing:.04em}#db .db-sp{flex:1}'
+'#db .db-tmr{font-weight:700;font-size:clamp(32px,3.6vw,52px);font-variant-numeric:tabular-nums;padding:0 12px;color:#14213D}#db .db-tmr.low{color:#B45309}#db .db-tmr.end{color:#B3262E;animation:dbp .6s 4}'
+'#db .db-ch{display:inline-flex;align-items:center;gap:8px;background:#fff;border:2px solid #14213D;color:#14213D;border-radius:999px;padding:11px 22px;font-weight:700;font-size:18px}'
+'#db .db-ch:hover{background:#E9EDF7}#db .db-ch .sv{width:20px;height:20px}'
+'#db .db-sm{flex:1;display:flex;flex-direction:column;gap:2.4vh;padding:0 4vw 3.4vh;min-height:0}'
+'#db .db-tp{margin:0 auto;max-width:1300px;width:100%;box-sizing:border-box;text-align:center;font-weight:700;line-height:1.2;font-size:clamp(28px,4.3vw,70px);color:#14213D;padding:0 2vw;max-height:38vh;overflow:auto;text-wrap:balance}'
+'#db .db-tp::before,#db .db-tp::after{content:"";display:block;height:4px;width:min(38%,340px);margin:0 auto;background:#C9A227}'
+'#db .db-tp::before{margin-bottom:2.4vh}#db .db-tp::after{margin-top:2.4vh}'
+'#db .db-sd{position:relative;flex:1;display:grid;grid-template-columns:1fr 1fr;gap:3.2vw;min-height:0;width:100%;max-width:1440px;margin:0 auto}'
+'#db .db-vm{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:3;width:clamp(60px,6.4vw,98px);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;color:#14213D;background:#fff;border:3px solid #14213D;box-shadow:0 0 0 8px #FBFAF6,0 10px 26px rgba(20,33,61,.25)}'
+'#db .db-vm svg{width:58%;height:58%;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'
+'#db .db-pn{position:relative;overflow:hidden;border-radius:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.2vh;padding:calc(2vh + 16px) 2vw 2.4vh;border:3px solid var(--c);box-shadow:0 16px 36px rgba(20,33,61,.14);transition:box-shadow .25s,transform .25s}'
+'#db .db-pn::before{content:"";position:absolute;left:0;right:0;top:0;height:16px;background:var(--c)}'
+'#db .db-pn.pro{--c:#0F6B4A;--d:#0A4A33;--t:#DDF1E7;background:linear-gradient(180deg,#EEF9F3,#fff 60%)}'
+'#db .db-pn.con{--c:#B3262E;--d:#7E1A21;--t:#F9DEDF;background:linear-gradient(180deg,#FDEFEF,#fff 60%)}'
+'#db .db-pn.on{box-shadow:0 0 0 5px #fff,0 0 0 11px var(--c),0 20px 44px rgba(20,33,61,.24);transform:scale(1.012)}'
+'#db .db-who{display:flex;flex-direction:column;align-items:center;gap:1.6vh;padding:4px 14px;border-radius:18px;color:var(--c)}'
+'#db .db-sig{width:clamp(64px,8.4vw,130px);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;background:var(--c);box-shadow:0 0 0 8px var(--t)}'
+'#db .db-sig svg{width:54%;height:54%;fill:none;stroke:#fff;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}'
+'#db .db-who small{font-size:clamp(15px,1.5vw,23px);font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--c)}'
+'#db .db-nmi{width:100%;box-sizing:border-box;text-align:center;font:inherit;font-weight:700;font-size:clamp(34px,5vw,82px);line-height:1.1;color:var(--d);background:transparent;border:0;border-bottom:3px dashed transparent;border-radius:6px;padding:2px 8px}'
+'#db .db-nmi:hover:not([readonly]){border-bottom-color:var(--c)}#db .db-nmi:focus{outline:0;border-bottom-color:var(--c);background:rgba(20,33,61,.05)}'
+'#db .db-sc{display:flex;gap:12px}'
+'#db .db-sc button{width:clamp(46px,4.6vw,70px);height:clamp(46px,4.6vw,70px);border-radius:50%;background:#fff;border:2.5px solid var(--c);color:var(--c);font-weight:700;font-size:clamp(20px,2.2vw,32px);transition:transform .12s,background .12s}'
+'#db .db-sc button:hover{transform:translateY(-2px);background:var(--t)}'
+'#db .db-sc button.sel{background:var(--c);color:#fff;box-shadow:0 0 0 5px var(--t)}'
+'#db .db-lg{max-width:800px;width:100%;margin:0 auto;padding:10px 24px 48px;overflow:auto;box-sizing:border-box}'
+'#db .db-tt{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}'
+'#db .db-tt div{border-radius:10px;padding:18px 10px;text-align:center;color:#fff}'
+'#db .db-tt .pro{background:#0F6B4A;color:#fff}#db .db-tt .con{background:#B3262E;color:#fff}'
+'#db .db-tt small{display:block;letter-spacing:.24em;text-transform:uppercase;font-size:15px;font-weight:700}#db .db-tt b{display:block;font-size:clamp(38px,5.4vw,64px);line-height:1.1;color:#fff}'
+'#db .db-rk{display:block;background:#fff;border:1.5px solid #CDD4E6;border-radius:10px;padding:16px 18px;margin-bottom:14px;font-size:clamp(18px,1.7vw,23px);box-shadow:0 4px 12px rgba(20,33,61,.07)}'
+'#db .db-rt{display:flex;gap:14px;align-items:flex-start;margin-bottom:14px}#db .db-rt .no{flex:none;width:34px;height:34px;border-radius:50%;background:#14213D;color:#fff;display:grid;place-items:center;font-weight:700}#db .db-rt b{flex:1;color:#14213D;line-height:1.3}'
+'#db .db-rs{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
+'#db .db-rs i{font-style:normal;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:11px 16px;border-radius:8px;color:#fff;font-weight:700}'
+'#db .db-rs .pro{background:#0F6B4A;color:#fff}#db .db-rs .con{background:#B3262E;color:#fff}'
+'#db .db-rs .w{box-shadow:0 0 0 3px #fff,0 0 0 6px #C9A227}'
+'#db .db-rs em{font-style:normal;font-weight:700;font-size:1.4em;color:#fff}'
+'@media(max-width:700px){#db .db-sd{grid-template-columns:1fr;gap:12px}#db .db-vm{display:none}#db .db-pn{flex-direction:row;flex-wrap:wrap;justify-content:space-around;gap:8px}#db .db-sig{width:48px}#db .db-who small{display:none}#db .db-nmi{width:auto;flex:1;min-width:120px;font-size:26px}#db .db-eh .db-sec{display:none}#db .db-grid{padding:16px 18px 40px}#db .db-lh{padding:14px 16px 8px}}'
+'#db .db-shr{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border-radius:12px;border:2px solid #4B6BFF;color:#3149D6;font-weight:700;background:#fff;flex:none}'
+'#db .db-shr .sv{width:19px;height:19px}'
+'@media(max-width:520px){#db .db-shr span{display:none}#db .db-shr{padding:11px 12px}}'
+'@keyframes dbp{50%{transform:scale(1.18)}}@media(prefers-reduced-motion:reduce){#db *{transition:none!important;animation:none!important}}';

function open(){
  if(!document.getElementById('db-css')){var s=document.createElement('style');s.id='db-css';s.textContent=CSS;document.head.appendChild(s)}
  if(!R){R=document.createElement('div');R.id='db';R.setAttribute('role','dialog');R.setAttribute('aria-label','Munozara');
    R.addEventListener('click',onClick);R.addEventListener('input',onInput);R.addEventListener('change',onChange);document.addEventListener('keydown',onKey);document.body.appendChild(R)}
  R.hidden=false;document.documentElement.style.overflow='hidden';document.documentElement.classList.add('db-open')}
function close(){
  stopT();clearTimeout(pt);if(S&&S.own&&S.pend){flush()}
  if(R){R.hidden=true;R.innerHTML=''}S=null;document.documentElement.style.overflow='';document.documentElement.classList.remove('db-open');
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
  +'<button class="db-shr" data-a="share" title="Saqlab, havolani ulashish — talabalar mavzularni oldindan ko‘rib tayyorlansin">'+ico('share')+'<span>Ulashish</span></button><button class="db-sec" data-a="start">Boshlash</button><button class="db-pri" data-a="save">Saqlash</button></header><main class="db-em">'
  +'<div class="db-top"><label class="db-nm"><small>Munozara nomi</small><span><input id="db-title" class="db-ti" maxlength="80" placeholder="Munozara nomini yozing" value="'+esc(S.title)+'"><i aria-hidden="true">✏️</i></span></label>'
  +'<button class="db-pri" data-a="ai"'+(S.busy?' disabled':'')+'>'+(S.busy?'Qidirilmoqda…':'✨ AI<span class="db-aw"> tavsiyalari</span>')+'</button></div>'
  +(S.aiOpen?aiPanel():'')
  +(S.msg?'<p class="db-msg" role="status">'+esc(S.msg)+'</p>':'')
  +d.topics.map(topicCard).join('')+(d.topics.length>1?'<p class="db-hint">Belgilangan mavzular guruhlar o’rtasida juftlanadi. Keraklisini tanlang.</p>':'')+'<button class="db-add" data-a="add">＋ Mavzu tuzish</button>'
  +'<div class="db-tm"><div><b>Guruhlar</b><small>'+(d.teams%2?'Bitta guruh juftsiz qoladi':Math.floor(d.teams/2)+' ta munozara')+'</small></div>'
  +'<div class="db-st"><button data-a="t-" aria-label="Kamaytirish">−</button><output>'+d.teams+'</output><button data-a="t+" aria-label="Ko‘paytirish">＋</button></div>'
  +'<button class="db-sec" data-a="draw" title="Har bir mavzu uchun tasdiq va inkor guruhlarini tasodifiy tanlaydi">🆚 Guruhlarni juftlash</button></div>';
  if(d.duels.length&&!d.dirty){
    h+='<div style="margin-top:14px">'+d.duels.map(function(x){return '<div class="db-dr"><span>'+esc(x.t)+'</span><i class="pro">'+esc(nm(x,'p'))+'</i><i class="con">'+esc(nm(x,'c'))+'</i></div>'}).join('')+'</div>'}
  return h+'</main>'}
function vList(){
  var d=S.d,h='<header class="db-lh"><div class="db-lt"><b>'+esc(S.l.title)+'</b><small>'+d.duels.length+' ta munozara</small></div><div class="db-la">'
  +'<button class="db-ic" data-a="res" title="Natijalar" aria-label="Natijalar">'+ico('cup')+'</button>'
  +'<button class="db-ic" data-a="share" title="Ulashish" aria-label="Ulashish">'+ico('share')+'</button>'
  +(S.own?'<button class="db-ic" data-a="edit" title="Tahrirlash" aria-label="Tahrirlash">'+ico('edit')+'</button>':'')
  +'<button class="db-ic" data-a="fs" title="To‘liq ekran" aria-label="To‘liq ekran">'+ico('full')+'</button><button class="db-ic" data-a="close" aria-label="Yopish">'+ico('x')+'</button></div></header>';
  if(!d.duels.length)return h+'<div class="db-empty"><h2>Guruhlar hali juftlanmagan</h2><p>Mavzularni tanlab, “Guruhlarni juftlash”ni bosing.</p>'+(S.own?'<button class="db-pri" data-a="edit">Tahrirlash</button>':'')+'</div>';
  return h+'<main class="db-grid">'+d.duels.map(function(x,i){
    return '<button class="db-dc" data-a="open" data-i="'+i+'"><span class="db-no">'+(i+1)+'</span>'+((x.ps||x.cs)?'<span class="db-dn">'+ico('ok')+'</span>':'')
    +'<b>'+esc(x.t)+'</b><span class="db-vs"><i class="pro">'+esc(nm(x,'p'))+'</i><i class="con">'+esc(nm(x,'c'))+'</i></span></button>'}).join('')+'</main>'}
function panel(x,s){
  var p=s==='p',v=p?x.ps:x.cs;
  return '<section class="db-pn '+(p?'pro':'con')+(S.sp===s?' on':'')+'"><button class="db-who" data-a="sp" data-s="'+s+'" aria-pressed="'+(S.sp===s)+'">'
  +'<span class="db-sig"><svg viewBox="0 0 24 24" aria-hidden="true">'+(p?I.ok:I.x)+'</svg></span><small>'+(p?'Tasdiqlaydi':'Inkor etadi')+'</small></button>'
  +'<input class="db-nmi" data-nm="'+s+'" value="'+esc(nm(x,s))+'" maxlength="24" aria-label="Guruh nomi" title="Nomini o‘zgartirish uchun bosing"'+(S.own?'':' readonly')+'>'
  +'<div class="db-sc" role="group" aria-label="Baho">'
  +[1,2,3,4,5].map(function(n){return '<button data-a="sc" data-s="'+s+'" data-n="'+n+'" class="'+(v===n?'sel':'')+'" aria-pressed="'+(v===n)+'">'+n+'</button>'}).join('')+'</div></section>'}
function vStage(){
  var d=S.d,x=d.duels[S.cur],n=d.duels.length,tm;
  if(S.tm)tm='<span class="db-tmr'+(left<=0?' end':left<=10?' low':'')+'" id="db-t">'+fmt(left)+'</span><button class="db-ic" data-a="tgo" aria-label="'+(run?'To‘xtatish':'Boshlash')+'">'+ico(run?'pause':'play')+'</button><button class="db-ic" data-a="trs" aria-label="Qayta">'+ico('reset')+'</button><button class="db-ic" data-a="tx" aria-label="Taymerni yopish">'+ico('x')+'</button>';
  else if(S.tp)tm=PRE.map(function(m){return '<button class="db-ch" data-a="tms" data-n="'+m+'">'+m+' daq</button>'}).join('');
  else tm='<button class="db-ch" data-a="tp">'+ico('clock')+'Vaqt</button>';
  return '<header class="db-sh"><button class="db-ic" data-a="list" aria-label="Ro‘yxat">'+ico('list')+'</button><button class="db-ic" data-a="prev" aria-label="Oldingi"'+(S.cur?'':' disabled')+'>'+ico('prev')+'</button>'
  +'<span class="db-cn">'+(S.cur+1)+' / '+n+'</span><button class="db-ic" data-a="next" aria-label="Keyingi"'+(S.cur<n-1?'':' disabled')+'>'+ico('next')+'</button><span class="db-sp"></span>'+tm
  +'<button class="db-ic" data-a="fs" aria-label="To‘liq ekran">'+ico('full')+'</button></header>'
  +'<main class="db-sm"><h1 class="db-tp">'+esc(x.t)+'</h1><div class="db-sd">'+panel(x,'p')+'<div class="db-vm" aria-hidden="true">'+SCALES+'</div>'+panel(x,'c')+'</div></main>'}
function vRes(){
  var tp=0,tc=0;S.d.duels.forEach(function(x){tp+=x.ps||0;tc+=x.cs||0});
  return '<header class="db-lh"><div class="db-lt"><b>Natijalar</b></div><div class="db-la"><button class="db-ic" data-a="list" aria-label="Orqaga">'+ico('list')+'</button><button class="db-ic" data-a="close" aria-label="Yopish">'+ico('x')+'</button></div></header>'
  +'<div class="db-lg"><div class="db-tt"><div class="pro"><small>Tasdiq</small><b>'+tp+'</b></div><div class="con"><small>Inkor</small><b>'+tc+'</b></div></div>'
  +S.d.duels.map(function(x,i){var a=x.ps||0,c=x.cs||0;
    return '<div class="db-rk"><div class="db-rt"><span class="no">'+(i+1)+'</span><b>'+esc(x.t)+'</b></div><div class="db-rs"><i class="pro'+(a>c?' w':'')+'"><span>'+esc(nm(x,'p'))+'</span><em>'+a+'</em></i><i class="con'+(c>a?' w':'')+'"><span>'+esc(nm(x,'c'))+'</span><em>'+c+'</em></i></div></div>'}).join('')+'</div>'}
function render(){
  if(!S)return;
  var m0=R.querySelector('.db-em'),st=m0?m0.scrollTop:0;
  R.className=S.v==='edit'?'light':'big';
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
  if(go==='keep'){S.msg='';render();return true}
  if(go){S.v='list';S.cur=0;render()}else close()}
function shareNow(){if(S.v==='edit'){if(!save('keep'))return}var a=App();if(a.share&&S.l&&S.l.code)a.share(S.l);else say('Ulashib bo’lmadi: avval saqlang')}

/* ===== hodisalar ===== */
function onInput(e){
  var t=e.target;if(!S)return;
  if(t.id==='db-title'){S.title=t.value;S.chg=1;return}
  if(t.id==='db-ai'){S.ai=t.value;return}
  if(t.id==='db-aq'){oo().q=t.value;return}
  if(t.dataset&&t.dataset.nm){var dx=S.d.duels&&S.d.duels[S.cur];if(dx&&S.own){var v=t.value.slice(0,24);if(t.dataset.nm==='p')dx.pn=v;else dx.cn=v;persist()}return}
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
  else if(a==='save')save(false);else if(a==='share')shareNow();else if(a==='start')save(true);else if(a==='ai'){sync();S.aiOpen=!S.aiOpen;render()}else if(a==='aigo')doAI();
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
