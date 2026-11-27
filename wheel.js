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
var I={x:'<path d="M6 6l12 12M18 6L6 18"/>',full:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',list:'<path d="M4 6h16M4 12h16M4 18h16"/>',share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>',snd:'<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',mute:'<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/>',back:'<path d="M15 5l-7 7 7 7"/>',cards:'<rect x="4" y="6" width="11" height="14" rx="2"/><path d="M9 4h9a2 2 0 0 1 2 2v11"/>',up:'<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',play:'<path d="M8 5v14l11-7z"/>',trash:'<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',plus:'<path d="M12 5v14M5 12h14"/>',cup:'<path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 20h8"/>'};
function ico(n){return '<svg class="sv" viewBox="0 0 24 24" aria-hidden="true">'+I[n]+'</svg>'}

/* ===== uslublar ===== */
var CSS=`#wh{position:fixed;inset:0;z-index:9500;display:flex;flex-direction:column;font-family:inherit;color:#fff;background:#14123A;overflow:hidden}#wh[hidden]{display:none}
html.wh-open body>*:not(#wh){visibility:hidden!important}
#wh button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}#wh button:disabled{opacity:.45;cursor:default}
#wh :focus-visible{outline:3px solid #FFC53D;outline-offset:2px}
#wh .sv{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;flex:none}
#wh.light{background:#F4F6FC;color:#1B2340;color-scheme:light}
/* muharrir */
#wh .we-h{display:flex;align-items:center;gap:10px;padding:10px 16px;background:#fff;border-bottom:1px solid #E1E6F4;color:#1B2340;min-height:68px;box-sizing:border-box;flex:none}
#wh .we-h b{flex:1;min-width:0;font-size:18px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#wh .ic{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:rgba(127,140,180,.18);flex:none;margin:0;padding:0}
#wh .wb{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:44px;box-sizing:border-box;margin:0;padding:0 16px;border-radius:12px;font-weight:700;font-size:15px;line-height:1;white-space:nowrap;flex:none;transform:none;box-shadow:none;position:static;text-transform:none;letter-spacing:0;min-width:0;min-height:0;width:auto}
#wh .wb .sv{width:20px;height:20px}
#wh .wb-p{background:#7A4DFF;color:#fff}#wh .wb-p:hover:not(:disabled){background:#6A3BF0}
#wh .wb-s{background:#EDE8FF;color:#5B34D6}#wh .wb-s:hover:not(:disabled){background:#E2D9FF}
#wh .wb-g{background:#fff;color:#69739A;border:1.5px solid #E1E6F4}#wh .wb-g:hover:not(:disabled){background:#F6F7FC}
#wh .wb.sm{height:36px;padding:0 12px;font-size:14px;border-radius:10px}#wh .wb.sm .sv{width:17px;height:17px}
#wh .we-b{flex:1;min-height:0;overflow:auto;padding:18px max(14px,calc((100% - 860px)/2)) 90px;overscroll-behavior:contain}
#wh .wcd{display:block;background:#fff;border:1.5px solid #E1E6F4;border-radius:20px;padding:16px;margin:0 0 14px;color:#1B2340;box-shadow:0 2px 10px rgba(60,70,130,.06)}
#wh .wcd-h{display:flex;align-items:center;gap:10px;margin:0 0 4px}
#wh .wcd-h h3{margin:0;font-size:17px;flex:1;min-width:0;display:flex;align-items:center;gap:8px}
#wh .wopt{display:inline;font-size:12px;font-weight:700;color:#8A93B2}
#wh .wbadge{flex:none;background:#F0EBFF;color:#5B34D6;border-radius:999px;padding:4px 12px;font-weight:800;font-size:14px}
#wh .whint{display:block;color:#69739A;font-size:13px;line-height:1.4;margin:0}
#wh .wi{display:block;width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:12px 14px;border:1.5px solid #D5DBEE;border-radius:12px;background:#fff;color:#1B2340;margin:0}
#wh .wi:focus{outline:none;border-color:#7A4DFF;box-shadow:0 0 0 3px rgba(122,77,255,.15)}
#wh textarea.wi{min-height:150px;resize:vertical;line-height:1.5;margin-top:10px}
#wh .wcd>.wi:not(textarea){margin-top:8px}
#wh .wrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}
#wh .wmsg{margin:8px 2px 0;font-size:14px;line-height:1.35;color:#5B34D6}#wh .wmsg:empty{display:none}#wh .wmsg.err{color:#D1324B}
#wh .wtl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}
#wh .wt{display:flex;align-items:center;gap:12px;text-align:left;padding:12px;border:1.5px solid #E1E6F4;border-radius:16px;background:#FBFAFF;color:#1B2340;min-height:70px;margin:0;transition:border-color .15s,transform .15s,background .15s,box-shadow .15s}
#wh .wt:hover{border-color:#B7A3FF;transform:translateY(-1px)}
#wh .wt[aria-pressed=true]{border-color:#7A4DFF;background:#F3EEFF;box-shadow:0 0 0 3px rgba(122,77,255,.12)}
#wh .wt i{flex:none;width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-style:normal;font-size:22px;background:#EDE8FF}
#wh .wt span{min-width:0}#wh .wt b{display:block;font-size:15px;line-height:1.2}#wh .wt small{display:block;font-size:12px;color:#69739A;margin-top:2px;line-height:1.25}
#wh .wpn{margin-top:12px;border:1.5px solid #E1E6F4;border-radius:16px;padding:12px;background:#FCFBFF;animation:wpin .2s ease-out}
@keyframes wpin{from{opacity:0;transform:translateY(-6px)}}
#wh .wfl{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
#wh .wf{height:34px;padding:0 12px;margin:0;border-radius:999px;border:1.5px solid #E1E6F4;background:#fff;color:#4B5580;font-weight:700;font-size:13px;line-height:1;white-space:nowrap}
#wh .wf[aria-pressed=true]{background:#7A4DFF;border-color:#7A4DFF;color:#fff}
#wh .wlab{margin:12px 0 0;font-size:13px;font-weight:800;color:#4B5580}
#wh .wl{margin-top:10px;display:flex;flex-direction:column;gap:6px;max-height:360px;overflow:auto;overscroll-behavior:contain}
#wh .wl-r{border:1.5px solid #E8EBF6;border-radius:14px;background:#fff;overflow:hidden;flex:none}#wh .wl-r.open{border-color:#B7A3FF}
#wh .wl-t{display:flex;align-items:center;gap:8px;padding:8px 8px 8px 12px}
#wh .wl-h{flex:1;min-width:0;text-align:left;display:block;margin:0;padding:0}
#wh .wl-h b{display:block;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#wh .wl-h small{display:block;margin-top:2px;font-size:12px;color:#69739A;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#wh .wl-qs{border-top:1px solid #EEF0F8;padding:6px 10px 10px;display:flex;flex-direction:column;gap:2px;max-height:240px;overflow:auto}
#wh .wl-q{display:flex;gap:8px;align-items:flex-start;padding:6px 2px;font-size:14px;line-height:1.35;cursor:pointer}
#wh .wl-q input{flex:none;width:18px;height:18px;margin:1px 0 0;accent-color:#7A4DFF}#wh .wl-q span:last-child{flex:1;min-width:0}
#wh .wl-qs .wb{align-self:flex-start;margin-top:6px}
#wh .wk{flex:none;display:inline-grid;place-items:center;min-width:26px;height:22px;padding:0 6px;border-radius:7px;font-size:11px;font-weight:800;background:#EDE8FF;color:#5B34D6}
#wh .wk.tf{background:#DDF7EE;color:#0B6B49}#wh .wk.tx{background:#FFF1D6;color:#8A5A00}
#wh .wopts{display:flex;flex-direction:column;gap:8px;margin-top:10px}
#wh .wo{display:flex;align-items:center;gap:8px}#wh .wo>input[type=radio]{flex:none;width:20px;height:20px;margin:0;accent-color:#14A36F}
#wh .wo .wlt{flex:none;width:24px;font-weight:800;color:#5B34D6;text-align:center}
#wh .wtf{display:flex;gap:8px;margin-top:10px}#wh .wtf label{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;height:46px;border:1.5px solid #E1E6F4;border-radius:12px;font-weight:700;background:#fff;cursor:pointer}
#wh .wtf label:has(input:checked){border-color:#14A36F;background:#DDF7EE;color:#0B6B49}#wh .wtf input{accent-color:#14A36F;margin:0}
#wh details.wmore{margin-top:12px;border-top:1px dashed #DCE1F2;padding-top:10px}#wh details.wmore summary{cursor:pointer;font-size:13px;font-weight:700;color:#69739A}
#wh .wdrop{display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;text-align:left;margin:0;padding:14px;border:2px dashed #B7A3FF;border-radius:16px;background:#F7F3FF;color:#4B2BC0}
#wh .wdrop:hover:not(:disabled){background:#EFE8FF}#wh .wdrop>span{font-size:26px;flex:none}#wh .wdrop b{display:block;font-size:15px}#wh .wdrop small{display:block;font-size:12px;color:#69739A;margin-top:2px}
#wh .waf{display:flex;align-items:center;gap:10px;margin-top:8px;padding:8px 10px;border:1px solid #E1E6F4;border-radius:12px;background:#fff;font-size:14px}
#wh .waf .fi{flex:none;min-width:38px;text-align:center;border-radius:8px;padding:4px 0;font-size:11px;font-weight:800;background:#EDE8FF;color:#5B34D6}
#wh .waf div{flex:1;min-width:0}#wh .waf b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#wh .waf small{display:block;font-size:12px;color:#69739A}
#wh .waf.err small{color:#D1324B}#wh .waf button{flex:none;width:30px;height:30px;margin:0;padding:0;color:#8A93B2;display:grid;place-items:center}
#wh .wspin{flex:none;width:18px;height:18px;border-radius:50%;border:3px solid #E1D8FF;border-top-color:#7A4DFF;animation:wsp .8s linear infinite}@keyframes wsp{to{transform:rotate(360deg)}}
#wh .wpriv{margin-top:12px;padding:10px 12px;border-radius:12px;background:#F3F5FC}
#wh .wqh{display:flex;align-items:center;gap:8px;margin-top:14px}#wh .wqh[hidden]{display:none}#wh .wqh b{flex:1;font-size:14px;color:#4B5580}
#wh .wql{margin-top:8px;display:flex;flex-direction:column;gap:6px;max-height:300px;overflow:auto;overscroll-behavior:contain}
#wh .wqi{display:flex;gap:8px;align-items:center;border:1px solid #E1E6F4;border-radius:12px;padding:6px 6px 6px 10px;font-size:14px;flex:none}
#wh .wqi>i{flex:none;font-style:normal;font-size:12px;color:#7A4DFF;font-weight:800;min-width:20px}
#wh .wqi>span:not(.wk){flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#wh .wqi>button{flex:none;width:32px;height:32px;margin:0;padding:0;display:grid;place-items:center;color:#8A93B2;border-radius:8px}#wh .wqi>button:hover{background:#FDECEF;color:#D1324B}
#wh .wsw{display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;text-align:left;margin:0 0 8px;padding:12px 14px;border:1.5px solid #E1E6F4;border-radius:14px;color:#1B2340;background:#fff;height:auto;min-height:62px;position:static;transform:none;box-shadow:none}
#wh .wsw:last-child{margin-bottom:0}
#wh .wsw .wst{flex:1;min-width:0;display:block}#wh .wsw .wst b{display:block;font-size:15px;line-height:1.25;position:static}#wh .wsw .wst small{display:block;margin-top:3px;font-size:13px;color:#69739A;line-height:1.3;position:static}
#wh .wkn{flex:none;width:46px;height:28px;border-radius:14px;background:#C5CCE6;position:relative;transition:background .15s;display:block}
#wh .wkn::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .15s;box-shadow:0 1px 3px rgba(0,0,0,.25)}
#wh .wsw[aria-checked=true]{border-color:#7A4DFF;background:#F6F2FF}#wh .wsw[aria-checked=true] .wkn{background:#7A4DFF}#wh .wsw[aria-checked=true] .wkn::after{transform:translateX(18px)}
@media(max-width:560px){#wh .wtl{grid-template-columns:1fr}#wh .we-h .wb-s span{display:none}#wh .we-h .wb-s{padding:0 12px}}
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
#wh .wh-wn{margin:12px 0 24px;display:flex;flex-direction:column;align-items:center;gap:.02em;line-height:1.04;font-weight:900;font-size:clamp(34px,7vw,92px)}#wh .wh-wn span{display:block;width:max-content;max-width:none;white-space:nowrap}
#wh .wh-ba{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
#wh .wh-ba .wb{height:auto;padding:14px 26px;font-size:clamp(16px,1.6vw,22px);line-height:1.2;border-radius:16px}
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
#wh .wq{position:absolute;inset:0;z-index:12;display:grid;place-items:center;background:rgba(8,6,32,.8);backdrop-filter:blur(5px);padding:2vmin;animation:whi .2s}
#wh .wq-c{--s:1;width:min(96vw,1100px);max-height:calc(100vh - 4vmin);max-height:calc(100dvh - 4vmin);display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;border-radius:30px;background:linear-gradient(160deg,#fff,#F2ECFF);color:#25125F;padding:calc(clamp(16px,3vmin,44px)*var(--s)) clamp(16px,3vw,48px);box-shadow:0 30px 90px rgba(0,0,0,.6);animation:wqf .6s cubic-bezier(.2,.9,.3,1);text-align:center}
@keyframes wqf{from{transform:rotateY(90deg) scale(.7);opacity:0}}
#wh .wq-c small{display:block;flex:none;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#7A4DFF;font-size:calc(clamp(12px,1.3vw,18px)*var(--s));overflow-wrap:anywhere}
#wh .wq-m{flex:1 1 auto;min-height:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:2px}
#wh .wq-q{margin:calc(14px*var(--s)) 0 calc(20px*var(--s));font-size:calc(clamp(24px,min(3.8vw,6.4vh),60px)*var(--s));line-height:1.18;font-weight:800;text-wrap:balance;overflow-wrap:anywhere}
#wh .wq-o{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:calc(12px*var(--s));margin-bottom:calc(14px*var(--s));text-align:left}
#wh .wq-o div{display:flex;gap:calc(12px*var(--s));align-items:center;min-width:0;border-radius:calc(18px*var(--s));padding:calc(clamp(10px,1.4vw,20px)*var(--s)) calc(clamp(12px,1.6vw,22px)*var(--s));background:#fff;border:2.5px solid #DDD3FF;font-size:calc(clamp(17px,min(2.2vw,3.8vh),34px)*var(--s));font-weight:700;line-height:1.2;transition:opacity .3s,background-color .3s,border-color .3s,color .3s,transform .3s;overflow-wrap:anywhere}
@media(max-width:700px){#wh .wq-o{grid-template-columns:1fr}}
#wh .wq-o div b{flex:none;width:1.7em;height:1.7em;border-radius:50%;display:grid;place-items:center;background:#EDE5FF;color:#5B34D6;font-size:.8em}
#wh .wq-o.rv div{opacity:.4}#wh .wq-o.rv div.ok{opacity:1;background:#DDF7EE;border-color:#14A36F;color:#0B6B49;transform:scale(1.02)}#wh .wq-o.rv div.ok b{background:#14A36F;color:#fff}
#wh .wq-a{visibility:hidden;margin:0 0 calc(14px*var(--s));padding:calc(12px*var(--s)) calc(20px*var(--s));border-radius:calc(18px*var(--s));background:#DDF7EE;color:#0B6B49;font-weight:800;font-size:calc(clamp(19px,min(2.6vw,4.4vh),40px)*var(--s));overflow-wrap:anywhere}#wh .wq-a.on{visibility:visible;animation:whz .4s}
#wh .wq-ac{flex:none;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:calc(8px*var(--s))}
#wh .wq-ac button{padding:clamp(10px,1.6vh,14px) clamp(16px,2vw,26px);border-radius:16px;font-weight:800;font-size:clamp(15px,1.6vw,22px)}
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
var LIMQ=60,TFA=['To’g’ri','Noto’g’ri'],AIX=['pdf','doc','docx','ppt','pptx'];
function $$(s){return R?[].slice.call(R.querySelectorAll(s)):[]}
function nz(s){return String(s==null?'':s).toLowerCase().replace(/[’'ʻʼ`‘]/g,'')}
function qkind(x){return x&&x.k==='tf'?'tf':x&&x.k==='text'?'text':'mcq'}
function kTag(k){return k==='tf'?'<span class="wk tf">✓✕</span>':k==='text'?'<span class="wk tx">✎</span>':'<span class="wk">A</span>'}
function startEdit(l,isNew){
  open();R.className='light';var w=l.wh||{};
  S={v:'edit',l:l,isNew:isNew,own:true,title:l.title||(isNew?defTitle():''),names:(w.names||[]).join('\n'),qs:clone(w.qs||[]),rm:w.rm===0?0:1,sh:w.sh===0?0:1,msg:'',qmsg:'',panel:'',
    lib:{src:'all',type:'all',q:'',open:'',sel:{},more:0},wr:{k:'mcq'},ai:{files:[],kind:'mcq',count:10,busy:false,cool:0},chg:0};
  renderEdit();if(isNew){var f=$('#we-n');if(f)f.focus()}}
function qStat(){var n=S.qs.length;return n?n+' ta savol — kartalar ortida yashiriladi':'Savolsiz ham ishlaydi: baraban faqat kim javob berishini tanlaydi'}
function renderEdit(){
  var nm=parseNames(S.names),old=$('.we-b'),top=old?old.scrollTop:0;
  R.innerHTML='<div class="we-h"><button class="ic" data-a="exit" aria-label="Yopish">'+ico('x')+'</button><b>'+T('Omad barabani')+'</b><button class="wb wb-s" data-a="try">'+ico('play')+'<span>'+T('Sinab ko’rish')+'</span></button><button class="wb wb-p" data-a="save">'+T('Saqlash')+'</button></div>'
  +'<div class="we-b">'
  +'<section class="wcd"><div class="wcd-h"><h3>'+T('Nomi')+'</h3></div><input class="wi" id="we-t" maxlength="80" value="'+esc(S.title)+'" placeholder="Masalan: 7-sinf, takrorlash"></section>'
  +'<section class="wcd"><div class="wcd-h"><h3>👥 '+T('Ishtirokchilar')+'</h3><span class="wbadge" id="we-nc">'+nm.length+' ta</span></div><small class="whint">Har qatorga bitta ism yozing yoki jadvaldan yuklang. Raqam (№) ustuni va sarlavha olinmaydi.</small>'
  +'<textarea class="wi" id="we-n" placeholder="Ali Valiyev&#10;Madina Karimova&#10;…">'+esc(S.names)+'</textarea>'
  +'<div class="wrow"><button class="wb wb-s" data-a="nfile">'+ico('up')+' Jadvaldan yuklash</button><button class="wb wb-g" data-a="nclr">'+ico('trash')+' Tozalash</button></div><p class="wmsg" id="we-nm">'+esc(S.msg)+'</p></section>'
  +'<section class="wcd" id="we-qsec"></section>'
  +'<section class="wcd"><button class="wsw" role="switch" aria-checked="'+(S.sh?'true':'false')+'" data-a="sh"><span class="wst"><b>Ishtirokchilarni aralashtirish</b><small>Ismlar barabanda tasodifiy tartibda joylashadi</small></span><i class="wkn"></i></button>'
  +'<button class="wsw" role="switch" aria-checked="'+(S.rm?'true':'false')+'" data-a="rm"><span class="wst"><b>Tushganni barabandan olib tashlash</b><small>Har kim faqat bir marta tushadi</small></span><i class="wkn"></i></button></section>'
  +'</div>'
  +'<input type="file" id="we-nf" accept=".xlsx,.xls,.csv,.txt,.ods" hidden><input type="file" id="we-qf" accept=".xlsx,.xls,.csv,.txt,.ods" hidden><input type="file" id="we-af" accept=".pdf,.doc,.docx,.ppt,.pptx" multiple hidden>';
  paintQ();var nb=$('.we-b');if(nb&&top)nb.scrollTop=top}
function tile(p,em,t,s){return '<button class="wt" data-a="pnl" data-p="'+p+'" aria-pressed="'+(S.panel===p)+'"><i>'+em+'</i><span><b>'+t+'</b><small>'+s+'</small></span></button>'}
function paintQ(){
  var el=$('#we-qsec');if(!el)return;
  el.innerHTML='<div class="wcd-h"><h3>🃏 '+T('Savollar')+' <small class="wopt">(ixtiyoriy)</small></h3><span class="wbadge" id="we-qb">'+S.qs.length+' ta</span></div><small class="whint" id="we-qs">'+qStat()+'</small>'
  +'<div class="wtl">'+tile('lib','📚','Tayyor savollar','Testlarim va sayt metodlaridan')+tile('write','✍️','O’zim yozaman','Test, to’g’ri/noto’g’ri, savol-javob')+tile('ai','✨','AI bilan tuzish','PDF, Word yoki PPT yuklang')+tile('table','📊','Jadvaldan','Excel yoki CSV fayl')+'</div>'
  +'<div id="we-pn"></div><p class="wmsg" id="we-qm">'+esc(S.qmsg)+'</p>'
  +'<div class="wqh" id="we-qh"><b>Qo’shilgan savollar</b><button class="wb wb-g sm" data-a="qclr">'+ico('trash')+' Hammasini o’chirish</button></div><div class="wql" id="we-ql2"></div>';
  qlist();paintPanel()}
function qlist(){
  var el=$('#we-ql2');if(el)el.innerHTML=S.qs.map(function(x,i){return '<div class="wqi"><i>'+(i+1)+'</i>'+kTag(qkind(x))+'<span>'+esc(x.q)+'</span><button data-a="qdel" data-i="'+i+'" aria-label="O’chirish">'+ico('x')+'</button></div>'}).join('');
  var b=$('#we-qb');if(b)b.textContent=S.qs.length+' ta';var s=$('#we-qs');if(s)s.textContent=qStat();var h=$('#we-qh');if(h)h.hidden=!S.qs.length}
function qmsg(t,err){S.qmsg=t;var m=$('#we-qm');if(m){m.textContent=t;m.className='wmsg'+(err?' err':'')}}
function addQs(arr){var have={};S.qs.forEach(function(x){have[nz(x.q)]=1});var n=0;arr.forEach(function(x){if(!x||!x.q||S.qs.length>=LIMQ||have[nz(x.q)])return;have[nz(x.q)]=1;S.qs.push(clone(x));n++});if(n)S.chg=1;qlist();return n}
function addMsg(n){return n?n+' ta savol qo’shildi':(S.qs.length>=LIMQ?'Ko’pi bilan '+LIMQ+' ta savol qo’shish mumkin':'Bu savollar allaqachon qo’shilgan')}
function sync(){var t=$('#we-t'),n=$('#we-n');if(t)S.title=t.value;if(n)S.names=n.value}
function persistOK(){return S.own}
function flush(){}
function paintPanel(){
  var el=$('#we-pn');if(!el)return;var p=S.panel;
  $$('.wt[data-p]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.p===p?'true':'false')});
  if(p==='lib'){el.innerHTML=libHTML();paintLib()}else if(p==='write')el.innerHTML=writeHTML();else if(p==='ai'){el.innerHTML=aiHTML();paintAiFiles()}else el.innerHTML=''}

/* --- tayyor savollar kutubxonasi --- */
function allLessons(){var b=window.aiTestBridge,a=[];try{a=(b&&(b.getAll?b.getAll():b.getLessons?b.getLessons():[]))||[]}catch(e){}return a.filter(function(l){return l&&l.qs&&l.qs.length&&!l.deb&&!l.wh})}
function isOwn(l){return !!l.id&&String(l.id).charAt(0)==='u'}
function libHTML(){var L=S.lib;
  return '<div class="wpn"><input class="wi" id="wl-q" type="search" autocomplete="off" placeholder="Test nomi yoki savol bo’yicha qidiring" value="'+esc(L.q)+'" style="margin-top:0">'
  +'<div class="wfl" id="wl-f1">'+[['all','Hammasi'],['own','Mening testlarim'],['site','Tayyor (sayt)']].map(function(x){return '<button class="wf" data-a="lsrc" data-v="'+x[0]+'" aria-pressed="'+(L.src===x[0])+'">'+x[1]+'</button>'}).join('')+'</div>'
  +'<div class="wfl" id="wl-f2">'+[['all','Barcha turlar'],['mcq','A Test'],['tf','✓✕ To’g’ri/noto’g’ri'],['text','✎ Savol-javob']].map(function(x){return '<button class="wf" data-a="ltyp" data-v="'+x[0]+'" aria-pressed="'+(L.type===x[0])+'">'+x[1]+'</button>'}).join('')+'</div>'
  +'<div class="wl" id="wl-list"></div></div>'}
function libMatches(){var L=S.lib,q=nz(L.q.trim()),out=[];
  allLessons().forEach(function(l){var own=isOwn(l);if(L.src==='own'&&!own)return;if(L.src==='site'&&own)return;
    var qs=l.qs.map(function(x,i){return{x:x,i:i}}).filter(function(o){return o.x&&o.x.q&&(L.type==='all'||qkind(o.x)===L.type)});if(!qs.length)return;
    if(q&&nz(l.title+' '+(l.sub||'')).indexOf(q)<0){qs=qs.filter(function(o){return nz(o.x.q).indexOf(q)>-1});if(!qs.length)return}
    out.push({l:l,qs:qs,own:own})});
  out.sort(function(a,b){return(b.own?1:0)-(a.own?1:0)});return out}
function paintFilters(){$$('#wl-f1 .wf').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.v===S.lib.src?'true':'false')});$$('#wl-f2 .wf').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.v===S.lib.type?'true':'false')})}
function paintLib(){
  var el=$('#wl-list');if(!el)return;var L=S.lib,m=libMatches(),shown=m.slice(0,L.more?300:25);
  if(!m.length){el.innerHTML='<p class="whint" style="padding:10px 4px">'+(allLessons().length?'Hech narsa topilmadi. Qidiruv yoki filtrni o’zgartiring.':'Hali tayyor savollar yo’q. Boshqa usullardan foydalaning.')+'</p>';return}
  el.innerHTML=shown.map(function(o){var l=o.l,id=esc(l.id),open=L.open===l.id,cn={mcq:0,tf:0,text:0};o.qs.forEach(function(z){cn[qkind(z.x)]++});
    var info=[cn.mcq?cn.mcq+' test':'',cn.tf?cn.tf+' to’g’ri/noto’g’ri':'',cn.text?cn.text+' savol-javob':''].filter(Boolean).join(' · ');
    var h='<div class="wl-r'+(open?' open':'')+'"><div class="wl-t"><button class="wl-h" data-a="lopen" data-id="'+id+'" aria-expanded="'+open+'"><b>'+esc(l.title)+'</b><small>'+(o.own?'Mening · ':'Sayt · ')+(l.sub?esc(l.sub)+' · ':'')+info+'</small></button><button class="wb wb-s sm" data-a="ladd" data-id="'+id+'">'+ico('plus')+' Hammasi</button></div>';
    if(open){var sel=L.sel[l.id]||{},k=0;h+='<div class="wl-qs">'+o.qs.map(function(z){var on=!!sel[z.i];if(on)k++;return '<label class="wl-q"><input type="checkbox" data-lc="'+z.i+'" data-lid="'+id+'"'+(on?' checked':'')+'>'+kTag(qkind(z.x))+'<span>'+esc(z.x.q)+'</span></label>'}).join('')+'<button class="wb wb-p sm" data-a="lsel" data-id="'+id+'">Tanlanganlarni qo’shish ('+k+')</button></div>'}
    return h+'</div>'}).join('')+(m.length>shown.length?'<button class="wb wb-g sm" data-a="lmore" style="align-self:center">Yana '+(m.length-shown.length)+' ta ko’rsatish</button>':'')}
function libFind(id){var a=libMatches();for(var i=0;i<a.length;i++)if(a[i].l.id===id)return a[i];return null}

/* --- o‘zim yozaman --- */
function writeHTML(){var k=S.wr.k;
  return '<div class="wpn"><div class="wfl" style="margin-top:0">'+[['mcq','A','Test'],['tf','✓✕','To’g’ri / noto’g’ri'],['text','✎','Savol-javob']].map(function(x){return '<button class="wf" data-a="wk" data-v="'+x[0]+'" aria-pressed="'+(k===x[0])+'">'+x[1]+' '+x[2]+'</button>'}).join('')+'</div>'
  +'<textarea class="wi" id="wr-q" maxlength="500" style="min-height:76px" placeholder="'+(k==='tf'?'Tasdiq yozing. Masalan: Yer Quyosh atrofida aylanadi':'Savol matni')+'"></textarea>'
  +(k==='mcq'?'<div class="wopts">'+[0,1,2,3].map(function(i){return '<label class="wo"><input type="radio" name="wr-c" value="'+i+'"'+(i===0?' checked':'')+' aria-label="To’g’ri javob"><span class="wlt">'+'ABCD'.charAt(i)+'</span><input class="wi" data-wo="'+i+'" maxlength="300" placeholder="'+(i===0?'To’g’ri javob (doirachani belgilang)':'Variant '+'ABCD'.charAt(i))+'"></label>'}).join('')+'</div>'
   :k==='tf'?'<div class="wtf"><label><input type="radio" name="wr-t" value="0" checked> To’g’ri</label><label><input type="radio" name="wr-t" value="1"> Noto’g’ri</label></div><p class="whint" style="margin-top:6px">Tasdiq to’g’rimi yoki noto’g’rimi — shuni belgilang.</p>'
   :'<input class="wi" id="wr-a" maxlength="300" placeholder="To’g’ri javob" style="margin-top:10px">')
  +'<div class="wrow"><button class="wb wb-p" data-a="wadd">'+ico('plus')+' Qo’shish</button></div>'
  +'<details class="wmore"><summary>Ko’p savolni birdan yozish</summary><textarea class="wi" id="we-ql" style="min-height:90px" placeholder="Savol | javob&#10;Poytaxt qaysi? | Toshkent"></textarea><div class="wrow"><button class="wb wb-s" data-a="qadd">'+ico('plus')+' Qo’shish</button></div><p class="whint" style="margin-top:8px">Har qatorga bitta savol. Javobni “|” belgisidan keyin yozing. Jadval ustunlari: Savol · A · B · C · D · To’g’ri javob (A–D).</p></details></div>'}
function writeAdd(){
  var q=cell(($('#wr-q')||{}).value),k=S.wr.k,o=null;
  if(!q){qmsg('Savol matnini yozing.',1);var f=$('#wr-q');if(f)f.focus();return}
  if(k==='mcq'){var vals=$$('[data-wo]').map(function(i){return cell(i.value)}),rc=R.querySelector('input[name=wr-c]:checked'),c=rc?+rc.value:0;
    if(!vals[c]){qmsg('To’g’ri deb belgilangan variantni yozing.',1);return}
    var a=[],ci=0;vals.forEach(function(t,i){if(!t)return;if(i===c)ci=a.length;a.push(t.slice(0,300))});
    if(a.length<2){qmsg('Kamida 2 ta variant yozing.',1);return}
    if(new Set(a.map(nz)).size<a.length){qmsg('Variantlar bir-biridan farq qilsin.',1);return}
    o={q:q.slice(0,500),a:a.slice(0,4),c:Math.min(ci,3)}}
  else if(k==='tf'){var rt=R.querySelector('input[name=wr-t]:checked');o={k:'tf',q:q.slice(0,500),a:TFA.slice(),c:rt?+rt.value:0}}
  else{var an=cell(($('#wr-a')||{}).value);if(!an){qmsg('To’g’ri javobni yozing.',1);return}o={k:'text',q:q.slice(0,500),a:[],acc:[an.slice(0,300)]}}
  var n=addQs([o]);qmsg(addMsg(n),!n);if(n){paintPanel();var f2=$('#wr-q');if(f2)f2.focus()}}

/* --- AI bilan tuzish --- */
function aiKinds(){return[['mcq','A','Test'],['tf','✓✕','To’g’ri/noto’g’ri'],['text','✎','Savol-javob'],['mixed','◉','Aralash']]}
function aiHTML(){var A=S.ai;
  return '<div class="wpn"><button class="wdrop" data-a="afile"><span>⬆️</span><div><b>Fayl tanlang</b><small>PDF, Word yoki PowerPoint · 3 MB gacha · ko’pi bilan 3 ta</small></div></button>'
  +'<div id="wa-files"></div>'
  +'<div class="wlab">Savol turi</div><div class="wfl" id="wa-k">'+aiKinds().map(function(x){return '<button class="wf" data-a="akind" data-v="'+x[0]+'" aria-pressed="'+(A.kind===x[0])+'">'+x[1]+' '+x[2]+'</button>'}).join('')+'</div>'
  +'<div class="wlab">Savollar soni</div><div class="wfl" id="wa-c">'+[5,10,15,20].map(function(n){return '<button class="wf" data-a="acnt" data-v="'+n+'" aria-pressed="'+(A.count===n)+'">'+n+'</button>'}).join('')+'</div>'
  +'<p class="whint wpriv">🔒 Faylingizning o’zi saqlanmaydi: u qurilmangizda o’qiladi, faqat undan olingan matn savol tuzish uchun Google AI’ga yuboriladi. Bepul rejimda Google bu matndan xizmatni yaxshilash uchun foydalanishi mumkin.</p>'
  +'<div class="wrow"><button class="wb wb-p" data-a="agen" id="wa-go">✨ Savollarni yaratish</button></div><p class="wmsg" id="wa-m"></p></div>'}
function aiOk(){return S.ai.files.filter(function(f){return f.st==='ok'})}
function fsz(n){return n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB'}
function aiErr(c){return({big:'Fayl 3 MB dan katta',type:'Bu format qo’llanmaydi',enc:'Fayl parol bilan himoyalangan',long:'PDF 160 sahifadan oshmasligi kerak',read:'Faylni o’qib bo’lmadi',empty:'Matn topilmadi — skan qilingan bo’lishi mumkin'})[c]||'Faylni o’qib bo’lmadi'}
function paintAiFiles(){
  var el=$('#wa-files');if(!el)return;var A=S.ai;
  el.innerHTML=A.files.map(function(f,i){var t=f.ext==='pdf'?'PDF':f.ext.indexOf('ppt')===0?'PPT':'DOC',sub=f.st==='read'?'O’qilmoqda…':f.st==='ok'?f.chars.toLocaleString()+' belgi · '+fsz(f.size):f.msg;
    return '<div class="waf'+(f.st==='err'?' err':'')+'"><span class="fi">'+t+'</span><div><b>'+esc(f.name)+'</b><small>'+esc(sub)+'</small></div>'+(f.st==='read'?'<i class="wspin"></i>':f.st==='ok'?'<span style="color:#14A36F;font-weight:800">✓</span>':'')+'<button data-a="armf" data-i="'+i+'" aria-label="O’chirish">'+ico('x')+'</button></div>'}).join('');
  upAi()}
function upAi(){var b=$('#wa-go');if(!b)return;var A=S.ai,rd=A.files.some(function(f){return f.st==='read'});b.disabled=A.busy||rd||!aiOk().length;b.innerHTML=A.busy?'<i class="wspin" style="border-color:rgba(255,255,255,.4);border-top-color:#fff"></i> Yozilmoqda…':'✨ Savollarni yaratish'}
function aiNote(t,err){var m=$('#wa-m');if(m){m.textContent=t||'';m.className='wmsg'+(err?' err':'')}}
async function aiAdd(list){
  var api=window.aiTestApi,A=S.ai,st=S;list=[].slice.call(list||[]);if(!list.length)return;aiNote('');
  if(!api||!api.read){aiNote('AI bo’limi yuklanmadi — sahifani yangilang.',1);return}
  for(var i=0;i<list.length;i++){var file=list[i];
    if(A.files.length>=3){aiNote('Ko’pi bilan 3 ta fayl',1);break}
    var e=(file.name.split('.').pop()||'').toLowerCase(),it={name:file.name,size:file.size,ext:e,st:'read',text:'',chars:0,msg:''};
    A.files.push(it);paintAiFiles();
    if(AIX.indexOf(e)<0){it.st='err';it.msg=aiErr('type');continue}
    if(file.size>3*1024*1024){it.st='err';it.msg=aiErr('big');continue}
    try{var r=await api.read(file);
      if(r.err){it.st='err';it.msg=aiErr(r.err)}
      else if((r.text||'').length<100){it.st='err';it.msg=aiErr('empty')}
      else{it.st='ok';it.text=r.text;it.chars=r.text.length}}
    catch(x){it.st='err';it.msg=aiErr('read')}
    if(S!==st)return;paintAiFiles()}
  if(S===st)paintAiFiles()}
function aiCounts(k,n){if(k==='mixed'){var tf=Math.floor(n*.2),tx=Math.floor(n*.2);return{mcq:n-tf-tx,tf:tf,text:tx}}var c={mcq:0,tf:0,text:0};c[k]=n;return c}
function aiHint(c){var p=[];if(c.mcq)p.push(c.mcq+' ta test (4 variant, bitta to’g’ri javob)');if(c.text)p.push(c.text+' ta savol-javob (qisqa, variantsiz javob)');if(c.tf)p.push(c.tf+' ta to’g’ri yoki noto’g’ri tasdiq');return 'Faqat so’ralgan turlarda tuz: '+p.join(', ')+'. Har turga mos shakl ishlat; bir xil faktni takrorlama.'}
function aiNorm(list){var api=window.aiTestApi,b=window.aiTestBridge;if(!api||!b||!b.QE||!b.QE.from||!b.QE.clean)return[];
  var seen={},arr=list.map(api.normQ).filter(function(x){var n=nz(x.q).trim();if(!n||seen[n])return false;seen[n]=1;return true});return b.QE.clean(b.QE.from(arr))}
async function aiGen(){
  var A=S.ai,st=S,api=window.aiTestApi;if(A.busy)return;
  var fs=aiOk();if(!fs.length){aiNote('Avval fayl tanlang.',1);return}
  if(!api||!api.authH){aiNote('AI bo’limi yuklanmadi — sahifani yangilang.',1);return}
  if(Date.now()<A.cool){aiNote('Biroz kuting va qayta urinib ko’ring.',1);return}
  var cnt=A.count,counts=aiCounts(A.kind,cnt),text=fs.map(function(f){return f.text}).join('\n\n').replace(/\s+/g,' ').trim(),cut=text.length>(api.MAXC||120000);if(cut)text=text.slice(0,api.MAXC||120000);
  A.busy=true;upAi();aiNote('Savollar yozilmoqda… 10–30 soniya kuting.');
  try{
    var res=await fetch('/api/generate-test',{method:'POST',headers:await api.authH(),body:JSON.stringify({text:text,topic:'',kind:A.kind,count:cnt,counts:counts,level:'o’rtacha',request:aiHint(counts)})});
    var data={};try{data=await res.json()}catch(e){}
    if(!res.ok){var er=Error(data.error||'Test tuzishda xatolik yuz berdi.');er.retry=Number(data.retryAfter)||0;er.raw=1;throw er}
    if(S!==st)return;
    var qs=aiNorm(data.questions||[]),n=addQs(qs);
    aiNote((n?n+' ta savol qo’shildi.':'Yangi savol qo’shilmadi.')+(cut?' Matn qisqartirildi.':'')+(typeof data.remainingToday==='number'?' Bugun yana '+data.remainingToday+' ta urinish bor.':''),!n);
    if(n)qmsg(n+' ta savol AI yordamida qo’shildi')}
  catch(e){if(S!==st)return;if(e&&e.retry>0)A.cool=Date.now()+Math.min(e.retry,120)*1000;
    aiNote(e&&e.name==='TypeError'?'Aloqa xatosi. Internetni tekshirib, qayta urinib ko’ring.':(e&&e.message)||'Aloqa xatosi.',1)}
  finally{if(S===st){A.busy=false;upAi()}}}

function save(go){
  sync();var nm=parseNames(S.names);
  if(nm.length<2){S.msg='Kamida 2 ta ishtirokchi kerak.';var m=$('#we-nm');if(m){m.textContent=S.msg;m.className='wmsg err'}var f=$('#we-n');if(f)f.focus();return false}
  var a=App();if(!a.saveLesson){say('Saqlab bo’lmadi: app.html eski. app.html va wheel.js ni birga joylang');return false}
  S.l.title=(S.title||'').trim()||defTitle();S.l.wh={names:nm.slice(0,200),qs:S.qs.slice(0,LIMQ),rm:S.rm,sh:S.sh};
  try{a.saveLesson(S.l,S.isNew)}catch(e){console.error(e);if(S.isNew&&!S.l.id){say('Saqlab bo’lmadi');return false}}
  S.isNew=false;S.chg=0;say('Saqlandi');if(go)close();return true}

/* ===== katta ekran: baraban ===== */
function hostStart(l,preview){
  var w=l.wh||{},ns=(w.names||[]).filter(Boolean);
  if(ns.length<2){say('Kamida 2 ta ishtirokchi kerak');if(l.id&&l.id.charAt(0)==='u'&&!preview)startEdit(l,false);return}
  open();R.className='big';
  var all=ns.map(function(n,i){return{id:i,n:n}});if(w.sh!==0)shuffle(all);var qs=shuffle((w.qs||[]).slice()).map(function(q,i){return{q:q,st:0,i:i}});
  S={v:'wheel',l:l,preview:preview,sh:w.sh!==0,all:all,act:all.slice(),cards:qs,rm:w.rm!==0,snd:true,th:Math.random()*6.283,om:0,spin:0,drag:null,win:null,sc:{},done:{},dr:0,last:-1,sel:null,ap:0};
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
    +'<div class="wh-st">'+(n<1?'<div class="wh-empty"><h2>🎉 Hamma ishtirokchi tushdi</h2><p>Barabanni qayta to’ldirish uchun tugmani bosing.</p><button class="wb wb-p" data-a="refill" style="height:auto;padding:14px 26px;border-radius:16px">Qaytadan boshlash</button></div>'
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
  o.innerHTML='<canvas class="wh-cf" id="wh-cf"></canvas><div class="wh-wc"><small>Navbat shunga tushdi</small><div class="wh-wn" id="wh-wn">'+nameHTML(w.n)+'</div><div class="wh-ba">'+(more?'<button class="wb wb-p" data-a="tocards">🃏 '+T('Karta tanlang')+'</button>':'')+'<button class="wb wb-s" data-a="next">'+(more?'Savolsiz keyingisi':'Keyingi aylantirish')+'</button></div></div>';
  R.appendChild(o);fitName();confetti()}
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
  o.innerHTML='<div class="wq-c" id="wq-c"><small>'+esc(S.win.n)+' · '+(i+1)+'-karta</small><div class="wq-m" id="wq-m">'+body+'</div><div class="wq-ac">'+(hasRv?'<button class="b-sh" data-a="reveal">👁 '+T('Javobni ko’rsatish')+'</button>':'')+'<button class="b-ok" data-a="mark" data-v="1">✓ '+T('To’g’ri')+'</button><button class="b-no" data-a="mark" data-v="2">✗ '+T('Noto’g’ri')+'</button><button class="b-gr" data-a="qback">Boshqa karta</button></div></div>';
  R.appendChild(o);fitQ();requestAnimationFrame(fitQ);try{if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitQ)}catch(e){}tone(660,.2,'triangle',.07)}
/* savol kartasi: matn uzunligiga qarab o‘lchamni moslaydi, hammasi ekranga sig‘adi */
function fitQ(){
  var c=$('#wq-c'),m=$('#wq-m');if(!c||!m||!S)return;
  var s=1,g=0;c.style.maxHeight=Math.max(220,innerHeight-Math.round(Math.min(innerWidth,innerHeight)*.04))+'px';c.style.setProperty('--s',s);
  while(g++<40&&s>.3&&(m.scrollHeight>m.clientHeight+2||m.scrollWidth>m.clientWidth+2)){s=Math.round((s-.04)*100)/100;c.style.setProperty('--s',s)}}
/* g‘olib ismi: familiya va ism alohida qatorda, so‘z bo‘linmaydi */
function nameHTML(n){var ws=String(n).trim().split(/\s+/),out=[];ws.forEach(function(x){if(out.length&&/^(o[’'ʻʼ‘`]?g[’'ʻʼ‘`]?li|qizi|ug[’'ʻʼ‘`]?li|kizi|ўғли|қизи|ogli|ugli)$/i.test(x))out[out.length-1]+=' '+x;else out.push(x)});return out.map(function(x){return '<span>'+esc(x)+'</span>'}).join('')}
function fitName(){
  var el=$('#wh-wn');if(!el)return;var box=el.parentNode,cs=getComputedStyle(box),av=box.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight),n=el.children.length,fs=Math.max(26,Math.min(innerWidth*.085,innerHeight*(n>2?.12:.17),120)),g=0;
  el.style.fontSize=fs+'px';
  while(g++<60&&fs>22){var mx=0;[].forEach.call(el.children,function(c){mx=Math.max(mx,c.offsetWidth)});if(mx<=av)break;fs=Math.max(22,fs*.93);el.style.fontSize=fs+'px'}}
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
function onInput(e){var t=e.target;if(!S||S.v!=='edit')return;
  if(t.id==='we-n'){S.chg=1;S.names=t.value;var c=$('#we-nc');if(c)c.textContent=parseNames(S.names).length+' ta'}
  else if(t.id==='we-t'){S.chg=1;S.title=t.value}
  else if(t.id==='wl-q'){S.lib.q=t.value;S.lib.open='';paintLib()}}
function onChange(e){
  var t=e.target;if(!S||S.v!=='edit')return;
  if(t.dataset&&t.dataset.lc!==undefined){var id=t.getAttribute('data-lid'),sel=S.lib.sel[id]||(S.lib.sel[id]={});if(t.checked)sel[t.dataset.lc]=true;else delete sel[t.dataset.lc];
    var bt=R.querySelector('[data-a=lsel][data-id="'+id.replace(/"/g,'\\"')+'"]');if(bt)bt.textContent='Tanlanganlarni qo’shish ('+Object.keys(sel).length+')';return}
  if(t.id==='we-af'){var fl=t.files;aiAdd(fl);setTimeout(function(){t.value=''},0);return}
  if(t.id!=='we-nf'&&t.id!=='we-qf')return;var f=t.files&&t.files[0],isN=t.id==='we-nf';t.value='';if(!f)return;
  readTable(f).then(function(rows){
    if(isN){var r=namesFromRows(rows);if(!r.names.length){S.msg='Jadvalda ism topilmadi.'}else{sync();var cur=parseNames(S.names);S.names=cur.concat(r.names).join('\n');S.msg=r.names.length+' ta ism qo’shildi'+(r.col?' (“'+r.col+'” ustuni)':'')+'. Raqam ustuni va sarlavha olinmadi.';S.chg=1}renderEdit()}
    else{var q=qsFromRows(rows),n=q.length?addQs(q):0;qmsg(q.length?addMsg(n):'Jadvalda savol topilmadi.',!n)}
  },function(err){var m=fileMsg(err);if(isN){S.msg=m;var a=$('#we-nm');if(a){a.textContent=m;a.className='wmsg err'}}else qmsg(m,1)})}
function onClick(e){
  var b=e.target.closest('[data-a]');if(!b||!S)return;var a=b.dataset.a;
  if(S.v==='edit'){
    if(a==='exit'){sync();if(S.chg&&!window.confirm('Saqlanmagan o’zgarishlar o’chadi. Chiqasizmi?'))return;close()}
    else if(a==='save')save(true);
    else if(a==='try'){sync();var nm=parseNames(S.names);if(nm.length<2){S.msg='Kamida 2 ta ishtirokchi kerak.';var m=$('#we-nm');if(m){m.textContent=S.msg;m.className='wmsg err'}return}var tmp={title:(S.title||'').trim()||defTitle(),wh:{names:nm,qs:S.qs,rm:S.rm,sh:S.sh}},keep=S;hostStart(tmp,true);S.back=keep}
    else if(a==='nfile'){var f=$('#we-nf');if(f)f.click()}
    else if(a==='nclr'){S.names='';S.msg='';S.chg=1;var tt=$('#we-t');if(tt)S.title=tt.value;renderEdit()}
    else if(a==='pnl'){var p=b.dataset.p;if(p==='table'){var g=$('#we-qf');if(g)g.click();return}S.panel=S.panel===p?'':p;paintPanel();if(S.panel==='lib'){var q=$('#wl-q');if(q&&!('ontouchstart' in window))q.focus()}}
    else if(a==='lsrc'){S.lib.src=b.dataset.v;S.lib.open='';paintFilters();paintLib()}
    else if(a==='ltyp'){S.lib.type=b.dataset.v;S.lib.open='';paintFilters();paintLib()}
    else if(a==='lmore'){S.lib.more=1;paintLib()}
    else if(a==='lopen'){var id=b.dataset.id;if(S.lib.open===id)S.lib.open='';else{S.lib.open=id;var o=libFind(id),sel={};if(o)o.qs.forEach(function(z){sel[z.i]=true});S.lib.sel[id]=sel}paintLib()}
    else if(a==='ladd'){var o2=libFind(b.dataset.id);if(o2){var n=addQs(o2.qs.map(function(z){return z.x}));qmsg(addMsg(n),!n)}}
    else if(a==='lsel'){var o3=libFind(b.dataset.id),sl=S.lib.sel[b.dataset.id]||{};if(o3){var n2=addQs(o3.qs.filter(function(z){return sl[z.i]}).map(function(z){return z.x}));qmsg(addMsg(n2),!n2)}}
    else if(a==='wk'){S.wr.k=b.dataset.v;paintPanel()}
    else if(a==='wadd')writeAdd();
    else if(a==='qadd'){var ta=$('#we-ql'),q2=qsFromLines(ta.value),n3=q2.length?addQs(q2):0;if(n3)ta.value='';qmsg(q2.length?addMsg(n3):'Savol yozing.',!n3)}
    else if(a==='qclr'){if(!S.qs.length)return;if(S.qs.length>3&&!window.confirm('Barcha savollar o’chirilsinmi?'))return;S.qs=[];S.chg=1;qlist();qmsg('')}
    else if(a==='qdel'){S.qs.splice(+b.dataset.i,1);S.chg=1;qlist()}
    else if(a==='afile'){var af=$('#we-af');if(af)af.click()}
    else if(a==='armf'){S.ai.files.splice(+b.dataset.i,1);paintAiFiles()}
    else if(a==='akind'){S.ai.kind=b.dataset.v;$$('#wa-k .wf').forEach(function(x){x.setAttribute('aria-pressed',x.dataset.v===S.ai.kind?'true':'false')})}
    else if(a==='acnt'){S.ai.count=+b.dataset.v;$$('#wa-c .wf').forEach(function(x){x.setAttribute('aria-pressed',+x.dataset.v===S.ai.count?'true':'false')})}
    else if(a==='agen')aiGen();
    else if(a==='rm'){S.rm=S.rm?0:1;S.chg=1;b.setAttribute('aria-checked',S.rm?'true':'false')}
    else if(a==='sh'){S.sh=S.sh?0:1;S.chg=1;b.setAttribute('aria-checked',S.sh?'true':'false')}
    return}
  if(a==='exit'){if(S.back){var k=S.back;close();startEdit2(k)}else close()}
  else if(a==='spin')spinBtn();
  else if(a==='snd'){S.snd=!S.snd;b.innerHTML=ico(S.snd?'snd':'mute');ensureAC()}
  else if(a==='full')fullscreen();
  else if(a==='drawer')drawer();
  else if(a==='share'){var ap=App();if(ap.share&&S.l&&S.l.code)ap.share(S.l);else say('Avval saqlang')}
  else if(a==='refill'){S.act=S.sh?shuffle(S.all.slice()):S.all.slice();S.done={};drawAll()}
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
window.addEventListener('resize',function(){if(S&&R&&!R.hidden&&S.v!=='edit'){if(S.v==='wheel'&&S.act.length){paintWheel();setRot()}fitQ();fitName()}});

/* ===== ochiq API ===== */
window.Wheel={
  create:function(){startEdit({m:'wheel',title:'',wh:{names:[],qs:[],rm:1}},true)},
  edit:function(l){if(l&&l.wh)startEdit(l,false)},
  host:function(l){if(l&&l.wh)hostStart(l,false)},
  parseNames:parseNames
};
})();
