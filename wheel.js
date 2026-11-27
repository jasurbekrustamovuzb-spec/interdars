/* InterDars — Omad barabani: ishtirokchilar barabanda, tushgan o‘quvchi sirli kartalardan savol tanlaydi.
   app.html'da league.js dan keyin yuklanadi. Saqlash: window.IDApp.saveLesson / share (app.html'da).
   Ma’lumot: lesson.m='wheel', lesson.wh={names:[], qs:[], rm:1}. Fayl hech qayerga yuklanmaydi — brauzerda o‘qiladi. */
(function(){
'use strict';
if(window.Wheel)return;
var R=null,S=null,raf=0,lastT=0,pt=0,tickAt=0,AC=null,CF=null,cfRaf=0;
var PAL=['#FF5D73','#FFB020','#2DD4A7','#4B8BFF','#A66BFF','#FF7A3D','#22C1E6','#F25AB4','#7BD34F','#FFD43B'];
var XLS='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
function T(s){try{return typeof window.T==='function'?window.T(s):s}catch(e){return s}}
function $(s){return R&&R.querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function say(m){var L=window.LiveQuiz;if(L&&L.say)L.say(m)}
function App(){return window.IDApp||{}}
function clone(o){return JSON.parse(JSON.stringify(o))}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function who(){try{var u=JSON.parse(localStorage.getItem('idUser')||'null')||{};return String(u.name||'').trim().split(/\s+/)[0]}catch(e){return ''}}
function defTitle(){var n=who();return n?n+'ning omad barabani':'Omad barabani'}

/* ===== o‘zbekcha/ruscha/inglizcha matnlar ===== */
(function(){var RU={'Omad barabani':'Колесо удачи','Kim javob beradi?':'Кто отвечает?','Baraban aylanadi, tushgan ishtirokchi sirli kartadan savol tanlaydi. Ismlarni yozing yoki jadval yuklang.':'Колесо крутится, выпавший участник выбирает вопрос из тайных карточек. Введите имена или загрузите таблицу.','Barabanni boshlash':'Запустить колесо','Aylantirish':'Крутить','Karta tanlang':'Выберите карточку','To’g’ri':'Верно','Noto’g’ri':'Неверно','Javobni ko’rsatish':'Показать ответ','Barabanga qaytish':'Назад к колесу','Ishtirokchilar':'Участники','Savollar':'Вопросы','Saqlash':'Сохранить','Sinab ko’rish':'Попробовать'};
var EN={'Omad barabani':'Wheel of Fortune','Kim javob beradi?':'Who answers?','Baraban aylanadi, tushgan ishtirokchi sirli kartadan savol tanlaydi. Ismlarni yozing yoki jadval yuklang.':'The wheel spins and the chosen participant picks a question from secret cards. Type names or upload a table.','Barabanni boshlash':'Start the wheel','Aylantirish':'Spin','Karta tanlang':'Pick a card','To’g’ri':'Correct','Noto’g’ri':'Wrong','Javobni ko’rsatish':'Show answer','Barabanga qaytish':'Back to wheel','Ishtirokchilar':'Participants','Savollar':'Questions','Saqlash':'Save','Sinab ko’rish':'Try it'};
[[window.RX=window.RX||{},RU],[window.EN=window.EN||{},EN]].forEach(function(p){Object.keys(p[1]).forEach(function(k){if(!(k in p[0]))p[0][k]=p[1][k]})})})();

/* ===== belgilar ===== */
var I={x:'<path d="M6 6l12 12M18 6L6 18"/>',full:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',list:'<path d="M4 6h16M4 12h16M4 18h16"/>',share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>',snd:'<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',mute:'<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/>',back:'<path d="M15 5l-7 7 7 7"/>',cards:'<rect x="4" y="6" width="11" height="14" rx="2"/><path d="M9 4h9a2 2 0 0 1 2 2v11"/>',up:'<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',trash:'<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',plus:'<path d="M12 5v14M5 12h14"/>',cup:'<path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 20h8"/>'};
function ico(n){return '<svg class="sv" viewBox="0 0 24 24" aria-hidden="true">'+I[n]+'</svg>'}

/* ===== uslublar ===== */
var CSS=`#wh{position:fixed;inset:0;z-index:9500;display:flex;flex-direction:column;font-family:inherit;color:#fff;background:#14123A;overflow:hidden}#wh[hidden]{display:none}
html.wh-open body>*:not(#wh){visibility:hidden!important}
#wh button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}#wh button:disabled{opacity:.45;cursor:default}
#wh :focus-visible{outline:3px solid #FFC53D;outline-offset:2px}
#wh .sv{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;flex:none}
#wh.light{background:#F4F6FC;color:#1B2340;color-scheme:light}
/* muharrir */
#wh .we-h{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#fff;border-bottom:1px solid #E1E6F4;color:#1B2340}
#wh .we-h b{flex:1;font-size:18px}
#wh .ic{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:rgba(127,140,180,.18);flex:none}
#wh .pri{background:#7A4DFF;color:#fff;border-radius:12px;padding:11px 18px;font-weight:700;flex:none}
#wh .sec{background:#EDE8FF;color:#5B34D6;border-radius:12px;padding:10px 14px;font-weight:700;display:inline-flex;align-items:center;gap:8px}
#wh .we-b{flex:1;overflow:auto;padding:18px max(16px,calc((100% - 820px)/2)) 80px;overscroll-behavior:contain}
#wh .card{background:#fff;border:1.5px solid #E1E6F4;border-radius:18px;padding:14px;margin-bottom:14px;color:#1B2340}
#wh .card h3{margin:0 0 2px;font-size:17px;display:flex;align-items:center;gap:8px}#wh .card small,#wh .hint{display:block;color:#69739A;font-size:13px;line-height:1.35}
#wh .inp,#wh textarea.inp{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:12px 14px;border:1.5px solid #D5DBEE;border-radius:12px;background:#fff;color:inherit}
#wh textarea.inp{min-height:140px;resize:vertical;line-height:1.5;margin-top:10px}
#wh .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}
#wh .msg{margin:8px 2px 0;font-size:14px;color:#5B34D6}
#wh .chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;max-height:120px;overflow:auto}
#wh .chip{background:#F0EBFF;color:#4B2BC0;border-radius:999px;padding:5px 11px;font-size:13px;font-weight:700}
#wh .sw{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:10px 12px;border:1.5px solid #E1E6F4;border-radius:14px;color:#1B2340}
#wh .sw b{display:block}#wh .kn{margin-left:auto;flex:none;width:44px;height:26px;border-radius:13px;background:#C5CCE6;position:relative;transition:background .15s}#wh .kn::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .15s}
#wh .sw[aria-checked=true]{border-color:#7A4DFF;background:#F6F2FF}#wh .sw[aria-checked=true] .kn{background:#7A4DFF}#wh .sw[aria-checked=true] .kn::after{transform:translateX(18px)}
#wh .ql{margin-top:10px;display:flex;flex-direction:column;gap:6px;max-height:260px;overflow:auto}
#wh .qi{display:flex;gap:10px;align-items:center;border:1px solid #E1E6F4;border-radius:12px;padding:8px 10px;font-size:14px}#wh .qi span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#wh .qi i{font-style:normal;font-size:12px;color:#7A4DFF;font-weight:700}
#wh .qi button,#wh .tp button.pk{color:#8A93B2}
#wh .tp{display:flex;align-items:center;gap:10px;border:1px solid #E1E6F4;border-radius:12px;padding:8px 10px;margin-top:6px}#wh .tp span{flex:1;min-width:0}#wh .tp small{display:inline}
/* katta ekran: baraban */
#wh.big{background:radial-gradient(90% 80% at 50% 38%,#3B2A8F 0%,#1B1650 48%,#0D0B2B 100%)}
#wh.big::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(2px 2px at 12% 20%,#fff8,transparent),radial-gradient(2px 2px at 82% 12%,#fff8,transparent),radial-gradient(3px 3px at 70% 78%,#fff6,transparent),radial-gradient(2px 2px at 26% 84%,#fff7,transparent),radial-gradient(2px 2px at 92% 56%,#fff6,transparent);animation:whtw 4s ease-in-out infinite alternate}
@keyframes whtw{to{opacity:.35}}
#wh .wh-top{position:relative;z-index:2;display:flex;align-items:center;gap:12px;padding:14px 22px}
#wh .wh-top .t{flex:1;min-width:0}#wh .wh-top b{display:block;font-size:clamp(20px,2.4vw,36px);line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#wh .wh-top small{display:block;margin-top:4px;color:#B9B3F0;font-size:clamp(13px,1.2vw,18px);font-weight:700;letter-spacing:.08em;text-transform:uppercase}
#wh.big .ic,#wh.cards .ic{background:rgba(255,255,255,.12);color:#fff;border-radius:50%;width:50px;height:50px;transition:background .15s,transform .15s}#wh.big .ic:hover:not(:disabled),#wh.cards .ic:hover:not(:disabled){background:rgba(255,255,255,.26);transform:translateY(-1px)}
#wh .wh-st{position:relative;z-index:1;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:0 2vw 2vh}
#wh .wh-w{position:relative;width:min(94vw,calc(100vh - 110px),1100px);aspect-ratio:1;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}#wh .wh-w.drag{cursor:grabbing}
#wh .wh-w canvas{position:absolute;inset:0;width:100%;height:100%;border-radius:50%;will-change:transform;filter:drop-shadow(0 18px 40px rgba(0,0,0,.45))}
#wh .wh-glow{position:absolute;inset:-2%;border-radius:50%;pointer-events:none;box-shadow:0 0 70px 6px rgba(166,107,255,.45);animation:whg 2.4s ease-in-out infinite alternate}
@keyframes whg{to{box-shadow:0 0 110px 18px rgba(255,176,32,.38)}}
#wh .wh-ptr{position:absolute;left:50%;top:-1.2%;width:7.5%;aspect-ratio:.82;transform:translateX(-50%);transform-origin:50% 22%;z-index:3;filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))}#wh .wh-ptr svg{width:100%;height:100%;display:block}
#wh .wh-ptr.flick{animation:whf .12s ease-out}
@keyframes whf{0%{transform:translateX(-50%) rotate(-24deg)}100%{transform:translateX(-50%) rotate(0)}}
#wh .wh-go{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;width:16%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFE27A,#FF9F1C 70%);color:#3B2200;font-weight:900;font-size:clamp(9px,1.05vw,15px);letter-spacing:0;text-transform:uppercase;font-family:inherit;line-height:1.1;padding:0;box-shadow:0 0 0 6px #fff,0 10px 26px rgba(0,0,0,.5);transition:transform .15s}
#wh .wh-go:hover:not(:disabled){transform:translate(-50%,-50%) scale(1.07)}#wh .wh-go:active:not(:disabled){transform:translate(-50%,-50%) scale(.95)}#wh .wh-go.idle{animation:whp 1.8s ease-in-out infinite}
@keyframes whp{50%{box-shadow:0 0 0 6px #fff,0 0 0 16px rgba(255,197,61,.35),0 10px 26px rgba(0,0,0,.5)}}
#wh .wh-hint{position:absolute;left:0;right:0;bottom:1.2vh;text-align:center;z-index:2;color:#B9B3F0;font-size:clamp(12px,1.1vw,16px);pointer-events:none}
#wh .wh-empty{margin:auto;text-align:center;padding:30px;max-width:460px}#wh .wh-empty h2{font-size:28px}
/* g‘olib */
#wh .wh-win{position:absolute;inset:0;z-index:10;display:grid;place-items:center;background:rgba(10,8,40,.72);backdrop-filter:blur(4px);animation:whi .25s ease-out}
@keyframes whi{from{opacity:0}}
#wh .wh-wc{width:min(92vw,760px);text-align:center;padding:clamp(22px,4vh,48px) clamp(18px,3vw,44px);border-radius:32px;background:linear-gradient(160deg,#fff,#EFE9FF);color:#25125F;box-shadow:0 30px 80px rgba(0,0,0,.55);animation:whz .5s cubic-bezier(.2,1.4,.4,1)}
@keyframes whz{from{transform:scale(.6);opacity:0}}
#wh .wh-wc small{font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#7A4DFF;font-size:clamp(13px,1.3vw,18px)}
#wh .wh-wn{margin:12px 0 24px;font-size:clamp(34px,7vw,92px);line-height:1.05;font-weight:900;word-break:break-word}
#wh .wh-ba{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
#wh .wh-ba .pri,#wh .wh-ba .sec{padding:14px 26px;font-size:clamp(16px,1.6vw,22px);border-radius:16px}
#wh .wh-cf{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:11}
/* panel */
#wh .wh-dr{position:absolute;top:0;right:0;bottom:0;width:min(380px,92vw);z-index:8;background:#17144A;border-left:1px solid #fff2;padding:16px;overflow:auto;animation:whs .2s ease-out}
@keyframes whs{from{transform:translateX(100%)}}
#wh .wh-dr h3{margin:0 0 10px;display:flex;align-items:center;gap:8px;font-size:18px}#wh .wh-dr h3 button{margin-left:auto}
#wh .wh-pr{display:flex;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px solid #fff1}#wh .wh-pr span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#wh .wh-pr.gone span{opacity:.45;text-decoration:line-through}#wh .wh-pr b{background:#7A4DFF;border-radius:999px;padding:2px 10px;font-size:13px}
/* kartalar sahifasi */
#wh.cards{background:radial-gradient(80% 70% at 50% 0%,#5B2DB5 0%,#22125F 55%,#0E0A2E 100%)}
#wh .wc-g{position:relative;z-index:1;flex:1;overflow:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(clamp(120px,14vw,190px),clamp(150px,17vw,230px)));justify-content:center;gap:clamp(12px,1.6vw,24px);padding:10px clamp(16px,3vw,48px) 60px;align-content:start;perspective:1200px}
#wh .wc-c{position:relative;aspect-ratio:3/4;border-radius:22px;background:linear-gradient(150deg,var(--a),var(--b));box-shadow:0 12px 28px rgba(0,0,0,.4),inset 0 0 0 3px rgba(255,255,255,.28);display:grid;place-items:center;overflow:hidden;transition:transform .2s,opacity .3s;animation:wcin .5s backwards}
@keyframes wcin{from{opacity:0;transform:translateY(22px) rotateY(80deg)}}
#wh .wc-c::before{content:"";position:absolute;inset:9px;border-radius:15px;border:2px dashed rgba(255,255,255,.4)}
#wh .wc-c::after{content:"";position:absolute;inset:-30%;background:linear-gradient(115deg,transparent 42%,rgba(255,255,255,.35) 50%,transparent 58%);transform:translateX(-80%);animation:wcs 4.5s ease-in-out infinite}
@keyframes wcs{60%,100%{transform:translateX(80%)}}
#wh .wc-c:hover:not(:disabled){transform:translateY(-8px) rotate(-1.5deg) scale(1.04)}
#wh .wc-c i{font-style:normal;font-size:clamp(34px,5vw,70px);font-weight:900;color:#fff;text-shadow:0 4px 12px rgba(0,0,0,.35);position:relative;z-index:1}
#wh .wc-c u{position:absolute;top:8px;left:12px;font-size:20px;opacity:.9;text-decoration:none;z-index:1}
#wh .wc-c.done{opacity:.22;filter:grayscale(.7);transform:scale(.92)}#wh .wc-c.done::after{display:none}
#wh .wc-who{display:inline-flex;align-items:center;gap:10px;background:#fff;color:#25125F;border-radius:999px;padding:8px 18px;font-weight:800;font-size:clamp(16px,1.8vw,26px)}
/* savol oynasi */
#wh .wq{position:absolute;inset:0;z-index:12;display:grid;place-items:center;background:rgba(8,6,32,.8);backdrop-filter:blur(5px);padding:2vw;animation:whi .2s}
#wh .wq-c{width:min(96vw,1100px);max-height:96vh;overflow:auto;border-radius:30px;background:linear-gradient(160deg,#fff,#F2ECFF);color:#25125F;padding:clamp(20px,3.4vw,52px);box-shadow:0 30px 90px rgba(0,0,0,.6);animation:wqf .6s cubic-bezier(.2,.9,.3,1);text-align:center}
@keyframes wqf{from{transform:rotateY(90deg) scale(.7);opacity:0}}
#wh .wq-c small{display:block;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#7A4DFF;font-size:clamp(13px,1.3vw,18px)}
#wh .wq-q{margin:14px 0 22px;font-size:clamp(26px,3.8vw,60px);line-height:1.2;font-weight:800;text-wrap:balance}
#wh .wq-o{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:12px;margin-bottom:22px;text-align:left}
#wh .wq-o div{display:flex;gap:12px;align-items:center;border-radius:18px;padding:clamp(12px,1.6vw,22px);background:#fff;border:2.5px solid #DDD3FF;font-size:clamp(18px,2.2vw,34px);font-weight:700;transition:all .3s}
#wh .wq-o div b{flex:none;width:1.7em;height:1.7em;border-radius:50%;display:grid;place-items:center;background:#EDE5FF;color:#5B34D6;font-size:.8em}
#wh .wq-o.rv div{opacity:.4}#wh .wq-o.rv div.ok{opacity:1;background:#DDF7EE;border-color:#14A36F;color:#0B6B49;transform:scale(1.02)}#wh .wq-o.rv div.ok b{background:#14A36F;color:#fff}
#wh .wq-a{display:none;margin:0 0 22px;padding:16px 22px;border-radius:18px;background:#DDF7EE;color:#0B6B49;font-weight:800;font-size:clamp(20px,2.6vw,40px)}#wh .wq-a.on{display:block;animation:whz .4s}
#wh .wq-ac{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
#wh .wq-ac button{padding:14px 26px;border-radius:16px;font-weight:800;font-size:clamp(16px,1.6vw,22px)}
#wh .b-ok{background:#14A36F;color:#fff}#wh .b-no{background:#E5484D;color:#fff}#wh .b-sh{background:#7A4DFF;color:#fff}#wh .b-gr{background:#E4E0F5;color:#3A2A80}
@media(max-width:700px){#wh .wh-top{padding:10px 12px}#wh.big .ic,#wh.cards .ic{width:42px;height:42px}}
@media(prefers-reduced-motion:reduce){#wh *{transition:none!important;animation:none!important}}`;

/* ===== ochish/yopish ===== */
function open(){
  if(!document.getElementById('wh-css')){var s=document.createElement('style');s.id='wh-css';s.textContent=CSS;document.head.appendChild(s)}
  if(!R){R=document.createElement('div');R.id='wh';R.setAttribute('role','dialog');R.setAttribute('aria-label','Omad barabani');
    R.addEventListener('click',onClick);R.addEventListener('input',onInput);R.addEventListener('change',onChange);R.addEventListener('pointerdown',onDown);
    document.addEventListener('pointermove',onMove);document.addEventListener('pointerup',onUp);document.addEventListener('pointercancel',onUp);document.addEventListener('keydown',onKey);document.body.appendChild(R)}
  R.hidden=false;document.documentElement.style.overflow='hidden';document.documentElement.classList.add('wh-open')}
function close(){
  stopAnim();clearTimeout(pt);if(S&&S.own&&S.pend)flush();
  if(R){R.hidden=true;R.innerHTML=''}S=null;document.documentElement.style.overflow='';document.documentElement.classList.remove('wh-open');
  try{if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen()}catch(e){}}

/* ===== jadvaldan ismlar va savollar ===== */
var NUMC=/^\s*\d+\s*[.)]?\s*$/,IDX=/^(№|#|n[°o]?\.?|t\/?r\.?|т\/?р\.?|raqam|nomer|номер|no\.?)$/i;
var NAMEH=/^(ism|ismi|ism sharif(i)?|ismi sharifi|familiya(si)?|familiya ism(i)?|f\.?\s?i\.?\s?(o|sh)\.?|ф\.?\s?и\.?\s?о\.?|фио|фамилия|имя|фамилия имя|name|full name|first name|last name|surname|o.?quvchi(lar)?|ishtirokchi(lar)?|talaba(lar)?|students?|участник(и)?|ученик(и)?|студент(ы)?)$/i;
var BADH=/^(guruh|sinf|class|group|tel|telefon|phone|yosh|age|manzil|sana|date|baho|ball|класс|группа|возраст|телефон|адрес|дата|балл)(?![A-Za-zА-Яа-яЁё])/i;
function cell(v){return String(v==null?'':v).replace(/\s+/g,' ').trim()}
function cleanName(s){s=cell(s).replace(/^(№|#)\s*/,'').replace(/^\d+\s*[.)\-–:]\s*(?=\D)/,'');return s.slice(0,60)}
function tidyRows(rows){var out=(rows||[]).map(function(r){return(Array.isArray(r)?r:[r]).map(cell)}).filter(function(r){return r.some(Boolean)});return out}
function namesFromRows(rows){
  rows=tidyRows(rows);if(!rows.length)return{names:[],col:''};
  var nc=rows.reduce(function(m,r){return Math.max(m,r.length)},0),h0=rows[0],hasH=h0.some(function(c){return IDX.test(c)||NAMEH.test(c)||BADH.test(c)})||(h0.length>1&&h0.every(function(c){return c&&!NUMC.test(c)})&&rows.length>1&&rows.slice(1,6).every(function(r){return NUMC.test(r[0]||'')}));
  var data=hasH?rows.slice(1):rows,cols=[],c;
  for(c=0;c<nc;c++){var vals=data.map(function(r){return r[c]||''}).filter(Boolean),num=vals.filter(function(v){return NUMC.test(v)}).length;
    cols.push({i:c,h:hasH?(h0[c]||''):'',vals:vals,idx:(vals.length&&num/vals.length>=.8)||(hasH&&IDX.test(h0[c]||'')&&num>0),txt:vals.some(function(v){return /[A-Za-zА-Яа-яЁёʻʼ’‘`'ЎўҚқҒғҲҳ]/.test(v)})})}
  var cand=cols.filter(function(x){return !x.idx&&x.txt&&!(hasH&&BADH.test(x.h)&&!NAMEH.test(x.h))}),use=[];
  if(hasH){use=cand.filter(function(x){return NAMEH.test(x.h)})}
  if(!use.length)use=cand.slice(0,1);
  if(!use.length&&nc===1)use=[cols[0]];
  var names=data.map(function(r){return cleanName(use.map(function(x){return r[x.i]||''}).filter(Boolean).join(' '))}).filter(function(n){return n&&!IDX.test(n)&&!NUMC.test(n)});
  return{names:names,col:use.map(function(x){return x.h||String.fromCharCode(65+x.i)}).join(' + ')}}
function linesToRows(t){return String(t||'').split(/\r?\n/).map(function(l){return l.indexOf('\t')>-1?l.split('\t'):[l]})}
function csvRows(t){t=String(t).replace(/^\uFEFF/,'');var first=t.split(/\r?\n/)[0]||'',d=[';','\t',','].reduce(function(b,x){return first.split(x).length>first.split(b).length?x:b},',');
  var rows=[],r=[],v='',q=0,i,ch;for(i=0;i<t.length;i++){ch=t[i];
    if(q){if(ch==='"'){if(t[i+1]==='"'){v+='"';i++}else q=0}else v+=ch}
    else if(ch==='"')q=1;else if(ch===d){r.push(v);v=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;r.push(v);rows.push(r);r=[];v=''}else v+=ch}
  if(v||r.length){r.push(v);rows.push(r)}return rows}
function loadXls(){return new Promise(function(ok,no){if(window.XLSX)return ok();var s=document.createElement('script');s.src=XLS;s.onload=function(){ok()};s.onerror=function(){no(new Error('lib'))};document.head.appendChild(s)})}
function readTable(f){return new Promise(function(ok,no){
  if(!f)return no(new Error('read'));if(f.size>3*1024*1024)return no(new Error('big'));
  var ext=(f.name.split('.').pop()||'').toLowerCase(),fr=new FileReader();fr.onerror=function(){no(new Error('read'))};
  if(ext==='csv'||ext==='txt'||ext==='tsv'){fr.onload=function(){ok(ext==='txt'?linesToRows(fr.result):csvRows(fr.result))};fr.readAsText(f)}
  else if(ext==='xlsx'||ext==='xls'||ext==='ods'){fr.onload=function(){loadXls().then(function(){var wb=window.XLSX.read(fr.result,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]];ok(window.XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''}))},function(){no(new Error('lib'))})};fr.readAsArrayBuffer(f)}
  else no(new Error('type'))})}
function fileMsg(e){return{big:'Fayl 3 MB dan katta',type:'Faqat .xlsx, .xls, .csv yoki .txt',lib:'Jadval kutubxonasi yuklanmadi — internetni tekshiring',read:'Faylni o’qib bo’lmadi'}[e&&e.message]||'Faylni o’qib bo’lmadi'}
function qsFromRows(rows){
  rows=tidyRows(rows);if(!rows.length)return[];
  if(rows[0].some(function(c){return /^(savol|question|вопрос|№|#|t\/r)/i.test(c)}))rows=rows.slice(1);
  var idx=rows.length&&rows.every(function(r){return NUMC.test(r[0]||'')&&r.length>1});if(idx)rows=rows.map(function(r){return r.slice(1)});
  var out=[];rows.forEach(function(r){var q=r[0];if(!q)return;var rest=r.slice(1),ne=rest.filter(Boolean);
    if(!ne.length){out.push({k:'text',q:q.slice(0,500),a:[],acc:[]});return}
    if(ne.length===1){out.push({k:'text',q:q.slice(0,500),a:[],acc:[ne[0].slice(0,300)]});return}
    var last=ne[ne.length-1],opts=ne.slice(0,-1),c=-1,m=/^[A-Da-dА-Га-г1-4]$/.exec(last);
    if(m&&opts.length>=2){var ch=m[0].toUpperCase();c='ABCD'.indexOf(ch);if(c<0)c='АБВГ'.indexOf(ch);if(c<0)c=+ch-1}
    else{var li=ne.slice(0,-1).map(function(x){return x.toLowerCase()}).indexOf(last.toLowerCase());if(li>-1&&ne.length>=3){c=li;opts=ne.slice(0,-1)}}
    if(c<0||c>=opts.length){out.push({k:'text',q:q.slice(0,500),a:[],acc:[ne[0].slice(0,300)]});return}
    out.push({q:q.slice(0,500),a:opts.slice(0,4).map(function(x){return x.slice(0,300)}),c:Math.min(c,3)})});
  return out}
function qsFromLines(t){return String(t||'').split(/\r?\n/).map(cell).filter(Boolean).map(function(l){var p=l.split('|');var q=cell(p[0]).replace(/^\d+\s*[.)]\s*/,'');return{k:'text',q:q.slice(0,500),a:[],acc:p.length>1&&cell(p[1])?[cell(p[1]).slice(0,300)]:[]}}).filter(function(x){return x.q})}
function parseNames(t){var r=namesFromRows(linesToRows(t));return r.names}

/* ===== muharrir ===== */
function startEdit(l,isNew){
  open();R.className='light';var w=l.wh||{};
  S={v:'edit',l:l,isNew:isNew,own:true,title:l.title||(isNew?defTitle():''),names:(w.names||[]).join('\n'),qs:clone(w.qs||[]),rm:w.rm===0?0:1,msg:'',qmsg:'',pick:0,chg:0};
  renderEdit();if(isNew){var f=$('#we-n');if(f)f.focus()}}
function qStat(){var n=S.qs.length;return n?n+' ta savol — kartalar ortida yashiriladi':'Savolsiz ham ishlaydi: baraban faqat kim javob berishini tanlaydi'}
function renderEdit(){
  var nm=parseNames(S.names);
  R.innerHTML='<div class="we-h"><button class="ic" data-a="exit" aria-label="Yopish">'+ico('x')+'</button><b>'+T('Omad barabani')+'</b><button class="sec" data-a="try">'+T('Sinab ko’rish')+'</button><button class="pri" data-a="save">'+T('Saqlash')+'</button></div>'
  +'<div class="we-b"><label class="card" style="display:block"><h3>Nomi</h3><input class="inp" id="we-t" maxlength="80" style="margin-top:8px" value="'+esc(S.title)+'" placeholder="Masalan: 7-sinf, takrorlash"></label>'
  +'<section class="card"><h3>👥 '+T('Ishtirokchilar')+'</h3><small>Har qatorga bitta ism yozing yoki jadval yuklang. Raqam (№) ustuni va sarlavha ismga qo’shilmaydi.</small>'
  +'<textarea class="inp" id="we-n" placeholder="Ali Valiyev&#10;Madina Karimova&#10;…">'+esc(S.names)+'</textarea>'
  +'<div class="row"><button class="sec" data-a="nfile">'+ico('up')+' Jadval yuklash</button><button class="sec" data-a="nclr">'+ico('trash')+' Tozalash</button><b id="we-nc" style="margin-left:auto">'+nm.length+' ta</b></div>'
  +'<input type="file" id="we-nf" accept=".xlsx,.xls,.csv,.txt,.ods" hidden><p class="msg" id="we-nm">'+esc(S.msg)+'</p></section>'
  +'<section class="card"><h3>🃏 '+T('Savollar')+' <small style="display:inline">(ixtiyoriy)</small></h3><small id="we-qs">'+qStat()+'</small>'
  +'<div class="row"><button class="sec" data-a="mine">'+ico('list')+' Testlarimdan</button><button class="sec" data-a="qfile">'+ico('up')+' Jadval yuklash</button><button class="sec" data-a="qclr">'+ico('trash')+' Tozalash</button></div>'
  +'<input type="file" id="we-qf" accept=".xlsx,.xls,.csv,.txt,.ods" hidden><div id="we-pk"></div>'
  +'<details style="margin-top:10px"><summary class="hint" style="cursor:pointer">Tez yozish va jadval shakli</summary><textarea class="inp" id="we-ql" style="min-height:90px" placeholder="Savol | javob&#10;Poytaxt qaysi? | Toshkent"></textarea><div class="row"><button class="sec" data-a="qadd">'+ico('plus')+' Qo’shish</button></div><p class="hint" style="margin-top:8px">Jadval ustunlari: Savol · A · B · C · D · To’g’ri javob (A–D). Faqat savol va javob bo’lsa — ochiq savol.</p></details>'
  +'<p class="msg" id="we-qm">'+esc(S.qmsg)+'</p><div class="ql" id="we-ql2"></div></section>'
  +'<section class="card"><button class="sw" role="switch" aria-checked="'+(S.rm?'true':'false')+'" data-a="rm"><span><b>Tushganni barabandan olib tashlash</b><small>Har kim faqat bir marta tushadi</small></span><i class="kn"></i></button></section></div>';
  qlist()}
function qlist(){var el=$('#we-ql2');if(!el)return;el.innerHTML=S.qs.map(function(x,i){return '<div class="qi"><i>'+(i+1)+'</i><span>'+esc(x.q)+'</span><button data-a="qdel" data-i="'+i+'" aria-label="O’chirish">'+ico('trash')+'</button></div>'}).join('');var s=$('#we-qs');if(s)s.textContent=qStat()}
function addQs(arr){var have={};S.qs.forEach(function(x){have[x.q.toLowerCase()]=1});var n=0;arr.forEach(function(x){if(!x||!x.q||S.qs.length>=60||have[x.q.toLowerCase()])return;have[x.q.toLowerCase()]=1;S.qs.push(clone(x));n++});S.chg=1;qlist();return n}
function mine(){var b=window.aiTestBridge,a=b&&b.getLessons?b.getLessons():[];return a.filter(function(l){return l.qs&&l.qs.length&&!l.deb&&l.id&&l.id.charAt(0)==='u'})}
function showPick(){var el=$('#we-pk');if(!el)return;if(S.pick){S.pick=0;el.innerHTML='';return}S.pick=1;var a=mine();
  el.innerHTML=a.length?a.map(function(l){return '<div class="tp"><span><b>'+esc(l.title)+'</b> <small>'+l.qs.length+' savol</small></span><button class="sec" data-a="padd" data-id="'+esc(l.id)+'">'+ico('plus')+'</button></div>'}).join(''):'<p class="hint" style="margin-top:8px">Hali testingiz yo’q. Jadval yuklang yoki pastda yozing.</p>'}
function sync(){var t=$('#we-t'),n=$('#we-n');if(t)S.title=t.value;if(n)S.names=n.value}
function persistOK(){return S.own}
function save(go){
  sync();var nm=parseNames(S.names);
  if(nm.length<2){S.msg='Kamida 2 ta ishtirokchi kerak.';var m=$('#we-nm');if(m)m.textContent=S.msg;var f=$('#we-n');if(f)f.focus();return false}
  var a=App();if(!a.saveLesson){say('Saqlab bo’lmadi: app.html eski. app.html va wheel.js ni birga joylang');return false}
  S.l.title=(S.title||'').trim()||defTitle();S.l.wh={names:nm.slice(0,200),qs:S.qs.slice(0,60),rm:S.rm};
  try{a.saveLesson(S.l,S.isNew)}catch(e){console.error(e);if(S.isNew&&!S.l.id){say('Saqlab bo’lmadi');return false}}
  S.isNew=false;S.chg=0;say('Saqlandi');if(go)close();return true}
function flush(){}

/* ===== katta ekran: baraban ===== */
function hostStart(l,preview){
  var w=l.wh||{},ns=(w.names||[]).filter(Boolean);
  if(ns.length<2){say('Kamida 2 ta ishtirokchi kerak');if(l.id&&l.id.charAt(0)==='u'&&!preview)startEdit(l,false);return}
  open();R.className='big';
  var all=ns.map(function(n,i){return{id:i,n:n}}),qs=shuffle((w.qs||[]).slice()).map(function(q,i){return{q:q,st:0,i:i}});
  S={v:'wheel',l:l,preview:preview,all:all,act:all.slice(),cards:qs,rm:w.rm!==0,snd:true,th:Math.random()*6.283,om:0,spin:0,drag:null,win:null,sc:{},done:{},dr:0,last:-1,sel:null,ap:0};
  drawAll()}
function nCards(){return S.cards.filter(function(c){return !c.st}).length}
function drawAll(){
  var n=S.act.length;
  if(S.v==='wheel'){
    R.className='big';
    R.innerHTML='<div class="wh-top"><div class="t"><b>'+esc(S.l.title||T('Omad barabani'))+'</b><small>'+n+' ta ishtirokchi'+(S.cards.length?' · 🃏 '+nCards()+' ta karta':'')+'</small></div>'
    +'<button class="ic" data-a="snd" aria-label="Ovoz">'+ico(S.snd?'snd':'mute')+'</button>'
    +(S.cards.length?'<button class="ic" data-a="tocards" aria-label="Kartalar" title="Kartalar sahifasi">'+ico('cards')+'</button>':'')
    +'<button class="ic" data-a="drawer" aria-label="Ishtirokchilar">'+ico('list')+'</button>'
    +(S.l.code&&!S.preview?'<button class="ic" data-a="share" aria-label="Ulashish">'+ico('share')+'</button>':'')
    +'<button class="ic" data-a="full" aria-label="To’liq ekran">'+ico('full')+'</button><button class="ic" data-a="exit" aria-label="Yopish">'+ico('x')+'</button></div>'
    +'<div class="wh-st">'+(n<1?'<div class="wh-empty"><h2>🎉 Hamma ishtirokchi tushdi</h2><p>Barabanni qayta to’ldirish uchun tugmani bosing.</p><button class="pri" data-a="refill" style="padding:14px 26px;border-radius:16px">Qaytadan boshlash</button></div>'
      :'<div class="wh-w" id="wh-w"><canvas id="wh-cv"></canvas><div class="wh-glow"></div><div class="wh-ptr" id="wh-pt"><svg viewBox="0 0 40 50"><path d="M20 49L3 17a19 19 0 1 1 34 0z" fill="#fff"/><circle cx="20" cy="17" r="7" fill="#FF5D73"/></svg></div><button class="wh-go idle" data-a="spin" id="wh-go">'+T('Aylantirish')+'</button></div><div class="wh-hint">Barabanni chetidan surib yoki o’rtadagi tugmani bosib aylantiring · Probel</div>')+'</div>';
    if(n>0){paintWheel();setRot()}
  }else if(S.v==='cards'){
    R.className='cards';var w=S.win;
    R.innerHTML='<div class="wh-top"><button class="ic" data-a="towheel" aria-label="Barabanga qaytish">'+ico('back')+'</button><div class="t"><b>'+T('Karta tanlang')+'</b><small>'+nCards()+' ta karta qoldi</small></div>'+(w?'<span class="wc-who">👤 '+esc(w.n)+'</span>':'')+'<button class="ic" data-a="full" aria-label="To’liq ekran">'+ico('full')+'</button><button class="ic" data-a="exit" aria-label="Yopish">'+ico('x')+'</button></div>'
    +'<div class="wc-g">'+S.cards.map(function(c,i){var p=PAL[i%PAL.length],p2=PAL[(i+3)%PAL.length];return '<button class="wc-c'+(c.st?' done':'')+'" data-a="card" data-i="'+i+'"'+(c.st||!w?' disabled':'')+' style="--a:'+p+';--b:'+p2+';animation-delay:'+Math.min(i*40,700)+'ms"><u>'+(c.st===1?'✅':c.st===2?'❌':'')+'</u><i>'+(i+1)+'</i></button>'}).join('')+'</div>'}
}
/* chizish */
function paintWheel(){
  var cv=$('#wh-cv');if(!cv)return;var box=cv.parentNode,sz=Math.max(300,Math.round(box.clientWidth||700)),dpr=Math.min(window.devicePixelRatio||1,2);
  cv.width=cv.height=Math.round(sz*dpr);var c=cv.getContext('2d');c.scale(dpr,dpr);var n=S.act.length,cx=sz/2,r=sz/2,ring=r*.075,R0=r-ring,a=Math.PI*2/n,i;
  c.clearRect(0,0,sz,sz);
  var g=c.createRadialGradient(cx,cx,R0,cx,cx,r);g.addColorStop(0,'#fff');g.addColorStop(1,'#CFC6FF');c.beginPath();c.arc(cx,cx,r-1,0,7);c.fillStyle=g;c.fill();
  for(i=0;i<n;i++){var col=PAL[i%PAL.length];if(i===n-1&&n>1&&col===PAL[0])col=PAL[(i+1)%PAL.length];
    c.beginPath();c.moveTo(cx,cx);c.arc(cx,cx,R0,i*a,(i+1)*a);c.closePath();c.fillStyle=col;c.fill();
    var lg=c.createRadialGradient(cx,cx,R0*.12,cx,cx,R0);lg.addColorStop(0,'rgba(255,255,255,.28)');lg.addColorStop(1,'rgba(0,0,0,.12)');c.fillStyle=lg;c.fill();
    if(n>1){c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=Math.max(1.5,sz/420);c.stroke()}}
  var fs=Math.max(10,Math.min(R0*.11,Math.PI*1.35*R0*.6/n)),maxW=R0*.66;
  for(i=0;i<n;i++){var nmx=S.act[i].n,f=fs;c.save();c.translate(cx,cx);c.rotate(i*a+a/2);c.textAlign='right';c.textBaseline='middle';c.fillStyle='#fff';c.shadowColor='rgba(0,0,0,.4)';c.shadowBlur=4;
    c.font='800 '+f+'px Nunito,"Baloo 2",system-ui,sans-serif';
    while(c.measureText(nmx).width>maxW&&f>11){f-=1;c.font='800 '+f+'px Nunito,"Baloo 2",system-ui,sans-serif'}
    if(c.measureText(nmx).width>maxW){while(nmx.length>3&&c.measureText(nmx+'…').width>maxW)nmx=nmx.slice(0,-1);nmx+='…'}
    c.fillText(nmx,R0-r*.04,0);c.restore()}
  var bn=Math.max(12,Math.min(40,Math.round(n*1.5+16)));for(i=0;i<bn;i++){var an=i/bn*Math.PI*2,bx=cx+Math.cos(an)*(R0+ring/2),by=cx+Math.sin(an)*(R0+ring/2);c.beginPath();c.arc(bx,by,ring*.28,0,7);c.fillStyle=i%2?'#FFD43B':'#fff';c.shadowColor=i%2?'#FFB020':'#fff';c.shadowBlur=8;c.fill()}
  c.shadowBlur=0;c.beginPath();c.arc(cx,cx,R0*.2,0,7);c.fillStyle='#fff';c.fill();c.beginPath();c.arc(cx,cx,r-1,0,7);c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=2;c.stroke()}
function setRot(){var cv=$('#wh-cv');if(cv)cv.style.transform='rotate('+S.th+'rad)'}
function idxAt(th){var n=S.act.length,a=Math.PI*2/n,p=((-Math.PI/2-th)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);return Math.min(n-1,Math.floor(p/a))}
/* fizika: sekin, uzoq aylanadi */
function launch(om){if(!S||S.spin||S.win||S.v!=='wheel'||S.act.length<1)return;S.om=Math.max(-11,Math.min(11,om));S.spin=1;lastT=0;S.last=idxAt(S.th);dis(true);ensureAC();raf=requestAnimationFrame(step)}
function dis(on){var b=$('#wh-go');if(b){b.disabled=on;b.classList.toggle('idle',!on)}}
function step(t){
  if(!S||!S.spin)return;if(!lastT)lastT=t;var dt=Math.min(.05,(t-lastT)/1000);lastT=t;
  var s=S.om<0?-1:1,v=Math.abs(S.om);v=v*Math.exp(-.64*dt)-.25*dt;S.om=v<=.07?0:s*v;S.th+=S.om*dt;setRot();
  var ix=idxAt(S.th);if(ix!==S.last){S.last=ix;tick()}
  if(!S.om){S.spin=0;finish(idxAt(S.th));return}
  raf=requestAnimationFrame(step)}
function stopAnim(){cancelAnimationFrame(raf);raf=0;cancelAnimationFrame(cfRaf);cfRaf=0;if(S)S.spin=0}
/* pointerlar: barabanni sudrab aylantirish */
function ang(e){var w=$('#wh-w');if(!w)return 0;var b=w.getBoundingClientRect();return Math.atan2(e.clientY-(b.top+b.height/2),e.clientX-(b.left+b.width/2))}
function onDown(e){
  if(!S||S.v!=='wheel'||S.win||S.spin)return;var w=e.target.closest&&e.target.closest('#wh-w');if(!w||e.target.closest('#wh-go'))return;
  var b=w.getBoundingClientRect(),dx=e.clientX-(b.left+b.width/2),dy=e.clientY-(b.top+b.height/2);if(Math.hypot(dx,dy)<b.width*.12)return;
  S.drag={a:ang(e),pts:[{t:performance.now(),a:S.th}],id:e.pointerId};w.classList.add('drag');try{w.setPointerCapture(e.pointerId)}catch(x){}ensureAC();e.preventDefault()}
function onMove(e){
  if(!S||!S.drag||e.pointerId!==S.drag.id)return;var a=ang(e),d=a-S.drag.a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;S.drag.a=a;S.th+=d;setRot();
  var ix=idxAt(S.th);if(ix!==S.last){S.last=ix;tick()}
  var p=S.drag.pts;p.push({t:performance.now(),a:S.th});if(p.length>6)p.shift()}
function onUp(e){
  if(!S||!S.drag||e.pointerId!==S.drag.id)return;var p=S.drag.pts,w=$('#wh-w');if(w)w.classList.remove('drag');S.drag=null;
  var f=p[0],l=p[p.length-1],dt=(l.t-f.t)/1000,om=dt>.01?(l.a-f.a)/dt:0;
  if(performance.now()-l.t>120)om=0;
  if(Math.abs(om)>1.2)launch(om*.55);else if(Math.abs(om)>.15)launch((om<0?-1:1)*3.5)}
function spinBtn(){launch((Math.random()<.5?-1:1)*(8.2+Math.random()*3))}
/* ovoz */
function ensureAC(){if(!S||!S.snd)return;try{if(!AC){var C=window.AudioContext||window.webkitAudioContext;if(C)AC=new C()}if(AC&&AC.state==='suspended')AC.resume()}catch(e){}}
function tone(f,d,ty,g,at){if(!AC||!S||!S.snd)return;try{var o=AC.createOscillator(),k=AC.createGain(),t0=AC.currentTime+(at||0);o.type=ty||'sine';o.frequency.value=f;k.gain.setValueAtTime(g||.08,t0);k.gain.exponentialRampToValueAtTime(.0001,t0+d);o.connect(k);k.connect(AC.destination);o.start(t0);o.stop(t0+d)}catch(e){}}
function tick(){var p=$('#wh-pt');if(p){p.classList.remove('flick');void p.offsetWidth;p.classList.add('flick')}var n=performance.now();if(n-tickAt<35)return;tickAt=n;tone(1300+Math.random()*120,.04,'square',.035)}
function fanfare(){[523,659,784,1047].forEach(function(f,i){tone(f,.35,'triangle',.09,i*.11)})}
/* g‘olib */
function finish(i){
  var w=S.act[i];S.win=w;S.done[w.id]=1;fanfare();dis(true);
  var more=nCards()>0;
  var o=document.createElement('div');o.className='wh-win';o.id='wh-win';
  o.innerHTML='<canvas class="wh-cf" id="wh-cf"></canvas><div class="wh-wc"><small>Navbat shunga tushdi</small><div class="wh-wn">'+esc(w.n)+'</div><div class="wh-ba">'+(more?'<button class="pri" data-a="tocards">🃏 '+T('Karta tanlang')+'</button>':'')+'<button class="sec" data-a="next">'+(more?'Savolsiz keyingisi':'Keyingi aylantirish')+'</button></div></div>';
  R.appendChild(o);confetti()}
function closeWin(){var o=$('#wh-win');if(o)o.remove();cancelAnimationFrame(cfRaf);cfRaf=0}
function afterTurn(){ /* navbat tugadi: tushgan olib tashlanadi */
  if(S.win&&S.rm)S.act=S.act.filter(function(x){return x.id!==S.win.id});S.win=null;S.v='wheel';drawAll()}
function confetti(){
  var cv=$('#wh-cf');if(!cv||matchMedia('(prefers-reduced-motion:reduce)').matches)return;var W=cv.width=R.clientWidth,H=cv.height=R.clientHeight,c=cv.getContext('2d'),ps=[],i;
  for(i=0;i<140;i++)ps.push({x:W/2+(Math.random()-.5)*W*.2,y:H*.45,vx:(Math.random()-.5)*16,vy:-Math.random()*17-4,s:6+Math.random()*8,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:PAL[i%PAL.length]});
  var t0=performance.now();(function f(t){var e=t-t0;c.clearRect(0,0,W,H);ps.forEach(function(p){p.vy+=.45;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;p.r+=p.vr;c.save();c.translate(p.x,p.y);c.rotate(p.r);c.fillStyle=p.c;c.globalAlpha=Math.max(0,1-e/3200);c.fillRect(-p.s/2,-p.s/3,p.s,p.s*.6);c.restore()});if(e<3200&&$('#wh-cf'))cfRaf=requestAnimationFrame(f)})(t0)}
/* savol oynasi */
function openQ(i){
  var cd=S.cards[i];if(!cd||cd.st||!S.win)return;S.sel=i;var q=cd.q,L='ABCDEF',o=document.createElement('div');o.className='wq';o.id='wh-q';
  var body='<div class="wq-q">'+esc(q.q)+'</div>';
  if(q.a&&q.a.length&&q.k!=='text')body+='<div class="wq-o" id="wq-o">'+q.a.map(function(x,k){return '<div data-k="'+k+'"><b>'+L[k]+'</b><span>'+esc(x)+'</span></div>'}).join('')+'</div>';
  var ans=q.k==='text'?(q.acc&&q.acc[0]):'';if(ans)body+='<div class="wq-a" id="wq-a">✔ '+esc(ans)+'</div>';
  var hasRv=(q.a&&q.a.length&&q.k!=='text')||ans;
  o.innerHTML='<div class="wq-c"><small>'+esc(S.win.n)+' · '+(i+1)+'-karta</small>'+body+'<div class="wq-ac">'+(hasRv?'<button class="b-sh" data-a="reveal">👁 '+T('Javobni ko’rsatish')+'</button>':'')+'<button class="b-ok" data-a="mark" data-v="1">✓ '+T('To’g’ri')+'</button><button class="b-no" data-a="mark" data-v="2">✗ '+T('Noto’g’ri')+'</button><button class="b-gr" data-a="qback">Boshqa karta</button></div></div>';
  R.appendChild(o);tone(660,.2,'triangle',.07)}
function reveal(){var o=$('#wq-o');if(o){o.classList.add('rv');var q=S.cards[S.sel].q,d=o.children[q.c||0];if(d)d.classList.add('ok')}var a=$('#wq-a');if(a)a.classList.add('on');var b=R.querySelector('[data-a=reveal]');if(b)b.disabled=true;tone(880,.3,'triangle',.08)}
function mark(v){var cd=S.cards[S.sel];if(!cd)return;cd.st=v;if(v===1){S.sc[S.win.id]=(S.sc[S.win.id]||0)+1;fanfare()}else tone(200,.35,'sawtooth',.06);var q=$('#wh-q');if(q)q.remove();S.sel=null;afterTurn()}
/* panel */
function drawer(){
  var d=$('#wh-dr');if(d){d.remove();return}
  var rows=S.all.slice().sort(function(a,b){return(S.sc[b.id]||0)-(S.sc[a.id]||0)}),el=document.createElement('div');el.className='wh-dr';el.id='wh-dr';
  el.innerHTML='<h3>'+ico('cup')+' '+T('Ishtirokchilar')+'<button class="ic" data-a="drawer" aria-label="Yopish">'+ico('x')+'</button></h3>'+rows.map(function(p,k){var out=S.rm&&S.done[p.id]&&!S.act.some(function(x){return x.id===p.id});return '<div class="wh-pr'+(out?' gone':'')+'"><span>'+(k+1)+'. '+esc(p.n)+'</span>'+(S.sc[p.id]?'<b>'+S.sc[p.id]+' ✓</b>':'')+'</div>'}).join('');
  R.appendChild(el)}
function fullscreen(){try{if(document.fullscreenElement)document.exitFullscreen();else if(R.requestFullscreen)R.requestFullscreen()}catch(e){}}

/* ===== hodisalar ===== */
function onInput(e){var t=e.target;if(!S||S.v!=='edit')return;S.chg=1;if(t.id==='we-n'){S.names=t.value;var c=$('#we-nc');if(c)c.textContent=parseNames(S.names).length+' ta'}else if(t.id==='we-t')S.title=t.value}
function onChange(e){
  var t=e.target;if(!S||S.v!=='edit'||(t.id!=='we-nf'&&t.id!=='we-qf'))return;var f=t.files&&t.files[0],isN=t.id==='we-nf';t.value='';if(!f)return;
  readTable(f).then(function(rows){
    if(isN){var r=namesFromRows(rows);if(!r.names.length){S.msg='Jadvalda ism topilmadi.';}else{var cur=parseNames($('#we-n').value);S.names=cur.concat(r.names).join('\n');S.msg=r.names.length+' ta ism qo’shildi'+(r.col?' (“'+r.col+'” ustuni)':'')+'. Raqam ustuni va sarlavha olinmadi.';S.chg=1}renderEdit()}
    else{var q=qsFromRows(rows),n=q.length?addQs(q):0;S.qmsg=n?n+' ta savol qo’shildi':'Jadvalda savol topilmadi.';var m=$('#we-qm');if(m)m.textContent=S.qmsg}
  },function(err){var m=fileMsg(err);if(isN){S.msg=m;var a=$('#we-nm');if(a)a.textContent=m}else{S.qmsg=m;var b=$('#we-qm');if(b)b.textContent=m}})}
function onClick(e){
  var b=e.target.closest('[data-a]');if(!b||!S)return;var a=b.dataset.a;
  if(S.v==='edit'){
    if(a==='exit'){sync();if(S.chg&&!window.confirm('Saqlanmagan o’zgarishlar o’chadi. Chiqasizmi?'))return;close()}
    else if(a==='save')save(true);
    else if(a==='try'){sync();var nm=parseNames(S.names);if(nm.length<2){S.msg='Kamida 2 ta ishtirokchi kerak.';var m=$('#we-nm');if(m)m.textContent=S.msg;return}var tmp={title:(S.title||'').trim()||defTitle(),wh:{names:nm,qs:S.qs,rm:S.rm}},keep=S;hostStart(tmp,true);S.back=keep}
    else if(a==='nfile'){var f=$('#we-nf');if(f)f.click()}else if(a==='qfile'){var g=$('#we-qf');if(g)g.click()}
    else if(a==='nclr'){S.names='';S.msg='';S.chg=1;renderEdit()}
    else if(a==='qclr'){S.qs=[];S.chg=1;qlist()}
    else if(a==='mine')showPick();
    else if(a==='padd'){var l=mine().filter(function(x){return x.id===b.dataset.id})[0];if(l){var n=addQs(l.qs);S.qmsg=n?n+' ta savol qo’shildi':'Bu savollar allaqachon qo’shilgan';var m2=$('#we-qm');if(m2)m2.textContent=S.qmsg}}
    else if(a==='qadd'){var ta=$('#we-ql'),q=qsFromLines(ta.value),n2=addQs(q);ta.value='';S.qmsg=n2?n2+' ta savol qo’shildi':'Savol yozing';var m3=$('#we-qm');if(m3)m3.textContent=S.qmsg}
    else if(a==='qdel'){S.qs.splice(+b.dataset.i,1);S.chg=1;qlist()}
    else if(a==='rm'){S.rm=S.rm?0:1;S.chg=1;b.setAttribute('aria-checked',S.rm?'true':'false')}
    return}
  if(a==='exit'){if(S.back){var k=S.back;close();startEdit2(k)}else close()}
  else if(a==='spin')spinBtn();
  else if(a==='snd'){S.snd=!S.snd;b.innerHTML=ico(S.snd?'snd':'mute');ensureAC()}
  else if(a==='full')fullscreen();
  else if(a==='drawer')drawer();
  else if(a==='share'){var ap=App();if(ap.share&&S.l&&S.l.code)ap.share(S.l);else say('Avval saqlang')}
  else if(a==='refill'){S.act=S.all.slice();S.done={};drawAll()}
  else if(a==='tocards'){if(S.spin)return;closeWin();S.v='cards';drawAll()}
  else if(a==='towheel')afterTurn();
  else if(a==='next'){closeWin();afterTurn()}
  else if(a==='card')openQ(+b.dataset.i);
  else if(a==='reveal')reveal();
  else if(a==='mark')mark(+b.dataset.v);
  else if(a==='qback'){var q=$('#wh-q');if(q)q.remove();S.sel=null}}
function startEdit2(k){open();R.className='light';S=k;renderEdit()}
function onKey(e){
  if(!S||!R||R.hidden)return;var tg=e.target;if(tg&&/INPUT|TEXTAREA/.test(tg.tagName))return;
  if(S.v==='edit'){if(e.key==='Escape'){var x=R.querySelector('[data-a=exit]');if(x)x.click()}return}
  if(e.key==='Escape'){if($('#wh-q'))return click('qback');if($('#wh-dr'))return drawer();if($('#wh-win'))return click('next');if(S.v==='cards')return afterTurn();var x2=R.querySelector('[data-a=exit]');if(x2)x2.click();return}
  if((e.key===' '||e.key==='Enter')&&S.v==='wheel'&&!S.win&&!S.spin&&!$('#wh-dr')){e.preventDefault();spinBtn()}
  else if(e.key==='Enter'&&$('#wh-win')){e.preventDefault();click(nCards()>0?'tocards':'next')}}
function click(a){var b=R.querySelector('[data-a='+a+']');if(b)b.click()}
window.addEventListener('resize',function(){if(S&&S.v==='wheel'&&R&&!R.hidden&&S.act.length){paintWheel();setRot()}});

/* ===== ochiq API ===== */
window.Wheel={
  create:function(){startEdit({m:'wheel',title:'',wh:{names:[],qs:[],rm:1}},true)},
  edit:function(l){if(l&&l.wh)startEdit(l,false)},
  host:function(l){if(l&&l.wh)hostStart(l,false)},
  parseNames:parseNames
};
})();
