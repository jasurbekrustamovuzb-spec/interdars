/* InterDars — AI test sahifasi */
/* ===== Hujjatlardan matn ajratish (brauzerda) ===== */
var XT=(function(root){
var CDN={zip:'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',pdf:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',pdfw:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'};
var loaded={};
function lib(url){if(loaded[url])return loaded[url];return loaded[url]=new Promise(function(ok,no){var s=document.createElement('script');s.src=url;s.onload=ok;s.onerror=function(){delete loaded[url];no(new Error('lib'))};document.head.appendChild(s)})}
function ent(s){return s.replace(/&#x([0-9a-f]+);/gi,function(_,h){return String.fromCodePoint(parseInt(h,16))}).replace(/&#(\d+);/g,function(_,d){return String.fromCodePoint(+d)}).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&')}
function clean(t){return t.replace(/\u00A0/g,' ').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').replace(/[ \t]{2,}/g,' ').trim()}
function dec(u8,enc){try{return new TextDecoder(enc).decode(u8)}catch(e){var o='';for(var i=0;i<u8.length;i++)o+=String.fromCharCode(u8[i]);return o}}

/* --- DOCX --- */
function docxText(xml){var out=[],ps=xml.split(/<w:p[ >]/).slice(1);
  ps.forEach(function(p){var h=/<w:pStyle w:val="(?:Heading|Title|Sarlavha|heading)/i.test(p),t='',re=/<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>|<w:cr\/>/g,m;
    while((m=re.exec(p))){if(m[1]!==undefined)t+=ent(m[1]);else t+=m[0]==='<w:tab/>'?'\t':'\n'}
    t=t.replace(/\s+$/,'');if(t.trim())out.push((h?'# ':'')+t)});
  return out.join('\n')}
async function readDocx(zip){var f=zip.file('word/document.xml');if(!f)throw new Error('bad');var x=await f.async('string'),t=docxText(x);
  var fn=zip.file('word/footnotes.xml');if(fn){var ft=docxText(await fn.async('string'));if(ft.trim())t+='\n\n[Izohlar]\n'+ft}
  return{text:t,units:0}}

/* --- PPTX --- */
function pptxText(xml){xml=xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g,function(b){return /<p:ph[^>]*type="(sldNum|dt|ftr)"/.test(b)?'':b});
  var out=[],ps=xml.split(/<a:p[ >]/).slice(1),title=/<p:ph[^>]*type="(title|ctrTitle)"/.test(xml);
  ps.forEach(function(p,i){var t='',re=/<a:t>([\s\S]*?)<\/a:t>|<a:t [^>]*>([\s\S]*?)<\/a:t>|<a:br\/>/g,m;
    while((m=re.exec(p))){if(m[0]==='<a:br/>')t+='\n';else t+=ent(m[1]!==undefined?m[1]:m[2])}
    t=t.trim();if(t)out.push(t)});
  return out.join('\n')}
function relMap(x){var m={},re=/<Relationship [^>]*>/g,a;while((a=re.exec(x))){var id=/Id="([^"]+)"/.exec(a[0]),tg=/Target="([^"]+)"/.exec(a[0]);if(id&&tg)m[id[1]]=tg[1]}return m}
function norm(base,t){if(t.charAt(0)==='/')return t.slice(1);var p=base.split('/');p.pop();t.split('/').forEach(function(s){if(s==='..')p.pop();else if(s!=='.')p.push(s)});return p.join('/')}
async function readPptx(zip){var names=Object.keys(zip.files),slides=[];
  var pr=zip.file('ppt/presentation.xml'),rl=zip.file('ppt/_rels/presentation.xml.rels');
  if(pr&&rl){var px=await pr.async('string'),rm=relMap(await rl.async('string')),re=/<p:sldId [^>]*r:id="([^"]+)"/g,m;
    while((m=re.exec(px))){var tg=rm[m[1]];if(tg)slides.push(norm('ppt/presentation.xml',tg))}}
  if(!slides.length)slides=names.filter(function(n){return /^ppt\/slides\/slide\d+\.xml$/.test(n)}).sort(function(a,b){return +a.match(/(\d+)\.xml/)[1]-+b.match(/(\d+)\.xml/)[1]});
  var out=[];
  for(var i=0;i<slides.length;i++){var f=zip.file(slides[i]);if(!f)continue;var t=pptxText(await f.async('string'));
    var rp=slides[i].replace(/slides\/(slide\d+\.xml)$/,'slides/_rels/$1.rels'),rf=zip.file(rp),note='';
    if(rf){var rx=await rf.async('string'),nm=/Target="([^"]*notesSlide[^"]*)"/.exec(rx);if(nm){var nf=zip.file(norm(slides[i],nm[1]));if(nf)note=pptxText(await nf.async('string'))}}
    if(t||note)out.push('[Slayd '+(i+1)+']\n'+t+(note?'\n[Izoh] '+note.replace(/\n/g,' '):''))}
  return{text:out.join('\n\n'),units:slides.length}}

/* --- Eski formatlar: OLE2 (CFB) --- */
function cfb(u8){var dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
  var sig=[0xD0,0xCF,0x11,0xE0,0xA1,0xB1,0x1A,0xE1];for(var i=0;i<8;i++)if(u8[i]!==sig[i])throw new Error('notole');
  var ss=1<<dv.getUint16(30,true),mss=1<<dv.getUint16(32,true),dirStart=dv.getUint32(48,true),cut=dv.getUint32(56,true),miniStart=dv.getUint32(60,true),difStart=dv.getUint32(68,true),nDif=dv.getUint32(72,true);
  var END=0xFFFFFFFE;
  function off(s){return(s+1)*ss}
  var fatSecs=[];for(i=0;i<109;i++){var v=dv.getUint32(76+i*4,true);if(v<0xFFFFFFFA)fatSecs.push(v)}
  var d=difStart,g=0;while(d<0xFFFFFFFA&&g++<nDif+2&&off(d)+ss<=u8.length){for(i=0;i<ss/4-1;i++){var w=dv.getUint32(off(d)+i*4,true);if(w<0xFFFFFFFA)fatSecs.push(w)}d=dv.getUint32(off(d)+ss-4,true)}
  var fat=[];fatSecs.forEach(function(s){if(off(s)+ss>u8.length)return;for(var k=0;k<ss/4;k++)fat.push(dv.getUint32(off(s)+k*4,true))});
  function chain(s,F){var o=[],n=0;while(s<0xFFFFFFFA&&n++<1e6){o.push(s);s=F[s];if(s===undefined)break}return o}
  function big(s){var c=chain(s,fat),out=new Uint8Array(c.length*ss);c.forEach(function(x,i){if(off(x)+ss<=u8.length)out.set(u8.subarray(off(x),off(x)+ss),i*ss)});return out}
  var dir=big(dirStart),ents=[];for(i=0;i+128<=dir.length;i+=128){var dd=new DataView(dir.buffer,dir.byteOffset+i,128),nl=dd.getUint16(64,true),nm='';for(var k=0;k<nl/2-1;k++)nm+=String.fromCharCode(dd.getUint16(k*2,true));ents.push({name:nm,type:dd.getUint8(66),start:dd.getUint32(116,true),size:dd.getUint32(120,true)})}
  var mini=null,mfat=null;
  function miniInit(){if(mini)return;mini=big(ents[0].start);var mf=big(miniStart),mv=new DataView(mf.buffer,mf.byteOffset,mf.byteLength);mfat=[];for(var k=0;k<mf.length/4;k++)mfat.push(mv.getUint32(k*4,true))}
  function stream(name){var e=ents.filter(function(x){return x.name===name&&x.type===2})[0];if(!e)return null;
    if(e.size<cut){miniInit();var c=chain(e.start,mfat),out=new Uint8Array(c.length*mss);c.forEach(function(x,i){out.set(mini.subarray(x*mss,x*mss+mss),i*mss)});return out.subarray(0,e.size)}
    return big(e.start).subarray(0,e.size)}
  return{stream:stream}}
function readDoc(u8){var o=cfb(u8),wd=o.stream('WordDocument');if(!wd)throw new Error('bad');
  var v=new DataView(wd.buffer,wd.byteOffset,wd.byteLength),flags=v.getUint16(10,true);
  if(flags&0x100)throw new Error('enc');
  var tb=o.stream(flags&0x200?'1Table':'0Table');if(!tb)throw new Error('bad');
  var ccpText=v.getUint32(0x4C,true),fcClx=v.getUint32(0x1A2,true),lcbClx=v.getUint32(0x1A6,true);
  var clx=tb.subarray(fcClx,fcClx+lcbClx),cv=new DataView(clx.buffer,clx.byteOffset,clx.byteLength),p=0;
  while(p<clx.length&&clx[p]===1){p+=3+cv.getUint16(p+1,true)}
  if(clx[p]!==2)throw new Error('bad');var lcb=cv.getUint32(p+1,true);p+=5;
  var n=(lcb-4)/12,cps=[],pcds=[],i;for(i=0;i<=n;i++)cps.push(cv.getUint32(p+i*4,true));
  var pb=p+(n+1)*4,text='';
  for(i=0;i<n;i++){var fc=cv.getUint32(pb+i*8+2,true),comp=!!(fc&0x40000000),cnt=cps[i+1]-cps[i];if(cnt<=0)continue;
    if(comp){var st=(fc&0x3FFFFFFF)>>>1;text+=dec(wd.subarray(st,st+cnt),'windows-1252')}
    else{var s2=fc&0x3FFFFFFF;text+=dec(wd.subarray(s2,s2+cnt*2),'utf-16le')}}
  text=text.slice(0,ccpText).replace(/\x13[^\x14\x15]*\x14/g,'').replace(/[\x13\x14\x15]/g,'').replace(/\x07\x07/g,'\n').replace(/\x07/g,'\t').replace(/\r/g,'\n').replace(/[\x0B\x0C]/g,'\n').replace(/[\x00-\x08\x0E-\x1F]/g,'');
  return{text:text,units:0}}
function readPpt(u8){var o=cfb(u8),ps=o.stream('PowerPoint Document');if(!ps)throw new Error('bad');
  var v=new DataView(ps.buffer,ps.byteOffset,ps.byteLength),slides=[],notes=[];
  function atoms(s,e,acc){while(s+8<=e){var vi=v.getUint16(s,true),ty=v.getUint16(s+2,true),len=v.getUint32(s+4,true),b=s+8,en=Math.min(b+len,e);
      if((vi&0xF)===0xF)atoms(b,en,acc);
      else if(ty===0x0FA0)acc.push(dec(ps.subarray(b,en),'utf-16le'));
      else if(ty===0x0FA8)acc.push(dec(ps.subarray(b,en),'windows-1252'));
      s=en}}
  function top(){var s=0;while(s+8<=ps.length){var vi=v.getUint16(s,true),ty=v.getUint16(s+2,true),len=v.getUint32(s+4,true),b=s+8,en=Math.min(b+len,ps.length);
      if(ty===0x03EE){var a=[];atoms(b,en,a);slides.push(a)}else if(ty===0x03F0){var a2=[];atoms(b,en,a2);notes.push(a2)}
      if(len===0&&(vi&0xF)!==0xF)s=en;else s=en}}
  top();
  var cl=function(a){return a.join('\n').replace(/\r/g,'\n').replace(/\x0B/g,'\n').replace(/[\x00-\x08\x0E-\x1F]/g,'').trim()},out=[];
  slides.forEach(function(a,i){var t=cl(a),nt=notes.length===slides.length?cl(notes[i]):'';if(t||nt)out.push('[Slayd '+(i+1)+']\n'+t+(nt?'\n[Izoh] '+nt.replace(/\n/g,' '):''))});
  return{text:out.join('\n\n'),units:slides.length}}

/* --- PDF --- */
async function readPdf(buf,pdfjs){var doc=await pdfjs.getDocument({data:buf}).promise,out=[];if(doc.numPages>160)throw new Error('long');
  for(var n=1;n<=doc.numPages;n++){var pg=await doc.getPage(n),tc=await pg.getTextContent(),t='',last=null;
    tc.items.forEach(function(it){if(it.str===undefined)return;t+=it.str;t+=it.hasEOL?'\n':(it.str&&!/\s$/.test(it.str)?' ':'')});
    t=clean(t);if(t)out.push('[Sahifa '+n+']\n'+t)}
  return{text:out.join('\n\n'),units:doc.numPages}}

var MAX=25*1024*1024;
async function read(file,env){env=env||{};
  var name=(file.name||'').toLowerCase(),ext=(name.match(/\.([a-z0-9]+)$/)||[])[1]||'';
  if(file.size>MAX)return{err:'big'};
  if(ext==='txt'||ext==='md'){var tx=await file.text();return{text:clean(tx),kind:ext}}
  var buf=new Uint8Array(await file.arrayBuffer()),r;
  try{
    if(ext==='docx'||ext==='pptx'){var JS=env.JSZip||(root.JSZip||(await lib(CDN.zip),root.JSZip));var zip=await JS.loadAsync(buf);r=ext==='docx'?await readDocx(zip):await readPptx(zip)}
    else if(ext==='doc')r=readDoc(buf);
    else if(ext==='ppt')r=readPpt(buf);
    else if(ext==='pdf'){var pj=env.pdfjs||root.pdfjsLib;if(!pj){await lib(CDN.pdf);pj=root.pdfjsLib;pj.GlobalWorkerOptions.workerSrc=CDN.pdfw}r=await readPdf(buf,pj)}
    else return{err:'type'}
  }catch(e){return{err:e&&e.message==='enc'?'enc':e&&e.message==='long'?'long':'read'}}
  r.text=clean(r.text||'');r.kind=ext;return r}
return {read:read,clean:clean};
})(window);


/* ===== AI test sahifasi ===== */
(function(){
var $=function(s){return document.querySelector(s)},$$=function(s){return [].slice.call(document.querySelectorAll(s))};
var T=function(x){return window.tt?window.tt(x):x};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])})}
var B=window.aiTestBridge,MAXF=3,MAXB=3*1024*1024,MAXC=120000;
var SPARK='<svg viewBox="0 0 24 24" aria-hidden="true"><path class="s1" d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z"/><path class="s2" d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z"/><path class="s3" d="M5 17l.6 1.4L7 19l-1.4.6L5 21l-.6-1.4L3 19l1.4-.6z"/></svg>';
window.AI_ORB=function(c){return '<span class="orb '+(c||'')+'">'+SPARK+'</span>'};
var MYS_HINT='Bu savollar «Sirli kartalar» sinf o’yini uchun. Har bir savol va to’g’ri javob faqat yuklangan manbadagi aniq ma’lumotga tayansin; manbada yo’q narsani o’ylab topma. Mavzuning eng muhim va esda qolarli joylaridan tuz: asosiy tushunchalar, ta’riflar, sanalar, nomlar, sonlar, sabab va natija. Savollar qisqa va aniq bo’lsin, katta ekranda tez o’qilsin; javob variantlari qisqa va bir-biridan aniq farq qilsin; to’g’ri javob manbadagi iboraga mos bo’lsin.';
var S={mys:false,files:[],count:10,level:'o’rtacha',busy:false,ctl:null,cool:0,coolT:null,remain:null,cur:null,editId:null,saved:false,dirty:false,wt:null,bad:-1};
var LV=[['oson','🌱','Sodda'],['o’rtacha','⚖️','O’rtacha'],['murakkab','🔥','Murakkab']];
var MS=['quiz','team','mill','mystery'];

/* ---- yordamchilar ---- */
function reqText(){var r=$('#ax-req').value.trim();return S.mys?(MYS_HINT+(r?' '+r:'')).slice(0,1200):r}
function status(m,err){var e=$('#ax-status');if(!m){e.className='ax-status';e.textContent='';return}e.textContent=T(m);e.className='ax-status on'+(err?' error':'')}
function fsize(n){return n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB'}
function ext(n){return(n.split('.').pop()||'').toLowerCase()}
function ftype(e){return e==='pdf'?'pdf':e.indexOf('ppt')===0?'ppt':'doc'}
async function authH(){var r=window.sb&&window.sb.auth?await window.sb.auth.getSession():null,t=r&&r.data&&r.data.session&&r.data.session.access_token;if(!t)throw Error(T('Hisobingizga qayta kiring.'));return{'Content-Type':'application/json','Authorization':'Bearer '+t}}
function okFiles(){return S.files.filter(function(f){return f.st==='ok'})}
function msgFor(c){return({big:'Fayl 3 MB dan katta',type:'Bu format qo’llanmaydi',enc:'Fayl parol bilan himoyalangan',long:'PDF 160 sahifadan oshmasligi kerak',read:'Faylni o’qib bo’lmadi',empty:'Matn topilmadi — skan qilingan bo’lishi mumkin'})[c]||'Faylni o’qib bo’lmadi'}

/* ---- fayllar ---- */
function renderFiles(){
  $('#ax-files').innerHTML=S.files.map(function(f,i){
    var t=ftype(f.ext),sub=f.st==='read'?T('O’qilmoqda…'):f.st==='ok'?f.chars.toLocaleString()+' '+T('belgi')+' · '+fsize(f.size):T(f.msg);
    return '<div class="axf'+(f.st==='err'?' err':'')+'"><span class="fi '+t+'">'+t.toUpperCase()+'</span><div><b>'+esc(f.name)+'</b><small>'+esc(sub)+'</small></div>'+(f.st==='read'?'<i class="axspin"></i>':f.st==='ok'?'<span class="axok">✓</span>':'')+'<button class="x" data-rmf="'+i+'" aria-label="'+T('O’chirish')+'">✕</button></div>'}).join('');
  $('#ax-drop').classList.toggle('has',!!S.files.length);
  upBtn()}
function upBtn(){var b=$('#ax-go'),ready=okFiles().length>0,cd=Date.now()<S.cool;
  b.disabled=!ready||S.busy||cd;
  $('#ax-hint').hidden=ready||S.files.some(function(f){return f.st==='read'});
  if(!cd)b.querySelector('.lb').textContent=T('Test tuzish')}
async function addFiles(list){
  list=[].slice.call(list||[]);if(!list.length)return;status('');
  for(var i=0;i<list.length;i++){var file=list[i];
    if(S.files.length>=MAXF){status('Ko’pi bilan 3 ta fayl',true);break}
    var e=ext(file.name),item={name:file.name,size:file.size,ext:e,st:'read',text:'',chars:0,msg:''};
    S.files.push(item);renderFiles();
    if(['pdf','doc','docx','ppt','pptx'].indexOf(e)<0){item.st='err';item.msg=msgFor('type');continue}
    if(file.size>MAXB){item.st='err';item.msg=msgFor('big');continue}
    try{var r=await XT.read(file);
      if(r.err){item.st='err';item.msg=msgFor(r.err)}
      else if((r.text||'').length<100){item.st='err';item.msg=msgFor('empty')}
      else{item.st='ok';item.text=r.text;item.chars=r.text.length}}
    catch(x){item.st='err';item.msg=msgFor('read')}
    renderFiles()}
  renderFiles()}

/* ---- kutish ---- */
var WM=['Fayl o’qilmoqda…','Muhim qismlar ajratilmoqda…','Savollar yozilmoqda…','Javoblar tekshirilmoqda…'];
function wait(on){
  clearInterval(S.wt);$('#ax-wait').hidden=!on;$('#ax-form').hidden=on;
  if(!on)return;var k=0;
  function tick(){$('#ax-wm').textContent=T(WM[k%WM.length]);$$('#ax-wd i').forEach(function(d,i){d.classList.toggle('on',i<=k%WM.length)});k++}
  tick();S.wt=setInterval(tick,3800)}
function setCool(sec){S.cool=Date.now()+Math.max(0,sec)*1000;clearInterval(S.coolT);
  function tick(){var left=Math.max(0,Math.ceil((S.cool-Date.now())/1000)),b=$('#ax-go');
    if(left>3600){b.disabled=true;b.querySelector('.lb').textContent=T('Ertaga qayta urinib ko’ring');S.coolT=setTimeout(tick,(left-3599)*1000)}
    else if(left){b.disabled=true;b.querySelector('.lb').textContent=T('Qayta urinish')+' '+left+' '+T('soniya');S.coolT=setTimeout(tick,1000)}
    else{S.coolT=null;upBtn()}}
  tick()}
function quota(){var q=$('#ax-quota');if(S.remain==null){q.hidden=true;return}q.hidden=false;q.textContent=T('Bugun yana')+' '+S.remain+' '+T('ta')}

/* ---- tuzish ---- */
async function generate(){
  if(S.busy||Date.now()<S.cool)return;
  var fs=okFiles();if(!fs.length){status('Avval fayl tanlang.',true);return}
  var text=fs.map(function(f){return f.text}).join('\n\n').replace(/\s+/g,' ').trim(),cut=text.length>MAXC;if(cut)text=text.slice(0,MAXC);
  S.busy=true;status('');wait(true);S.ctl=window.AbortController?new AbortController():null;
  try{
    var res=await fetch('/api/generate-test',{method:'POST',headers:await authH(),signal:S.ctl&&S.ctl.signal,body:JSON.stringify({text:text,topic:$('#ax-topic').value.trim(),count:S.count,level:S.level,request:reqText()})});
    var data={};try{data=await res.json()}catch(e){}
    if(!res.ok){var er=Error(data.error||T('Test tuzishda xatolik yuz berdi.'));er.retry=Number(data.retryAfter)||0;er.raw=true;throw er}
    S.cur={topic:$('#ax-topic').value.trim()||data.topic||T('Yangi test'),questions:data.questions.map(function(q){return{q:q.q,options:q.options.slice(),correctIndex:q.correctIndex,evidence:q.evidence||''}}),file:fs.map(function(f){return f.name}).join(', '),m:S.mys?'mystery':'quiz'};
    if(S.mys)S.cur.xc=B.xc.def(S.cur.questions.length);
    S.editId=null;S.saved=false;S.dirty=true;S.bad=-1;
    if(typeof data.remainingToday==='number'){S.remain=data.remainingToday;quota()}
    wait(false);showEditor(true);
    if(cut)status('Matn qisqartirildi — faqat boshlang’ich qismi ishlatildi.');
    if(window.confetti)confetti(innerWidth/2,innerHeight*.3,36)
  }catch(e){
    wait(false);
    if(e&&e.name==='AbortError')status('Bekor qilindi');
    else{status(e.raw?e.message:T('Aloqa xatosi. Internetni tekshirib, qayta urinib ko’ring.'),true);if(e.retry>0)setCool(e.retry)}
  }finally{S.busy=false;S.ctl=null;upBtn()}}

/* ---- muharrir ---- */
function showEditor(on){$('#ax-form').hidden=on;$('#ax-editor').hidden=!on;$('#ax-saved-s').hidden=on||!savedList().length;if(on)editor();else $('#ax-editor').innerHTML='';window.scrollTo(0,0)}
function letter(j){return 'ABCDE'.charAt(j)}
function valid(){var qs=S.cur.questions;for(var i=0;i<qs.length;i++){var q=qs[i],o=q.options.map(function(x){return x.trim()});if(!q.q.trim()||o.some(function(x){return !x})||new Set(o).size<o.length||q.correctIndex<0||q.correctIndex>=o.length)return i}return -1}
function editor(){
  var box=$('#ax-editor'),c=S.cur;if(!c){box.innerHTML='';return}
  if(c.m==='mystery'&&!Array.isArray(c.xc))c.xc=B.xc.def(c.questions.length);
  var n=c.questions.length,M=B.MT,h='';
  h+='<div class="axe-top">'+AI_ORB('sm')+'<div><b>'+T(S.editId?'Testni tahrirlash':'Test tayyor')+'</b><small>'+n+' '+T('savol')+(S.editId?'':' · '+T('Tekshirib, kerak bo’lsa tahrirlang'))+'</small></div></div>';
  h+='<div class="axs"><label><span class="lab">'+T('Test nomi')+'</span><input class="inp" id="ax-title" maxlength="180" value="'+esc(c.topic)+'"></label>';
  h+='<div><span class="lab">'+T('Test turi')+'</span><div class="pills" id="ax-m">'+MS.map(function(k){var m=M[k],ok=n>=m.min;return '<button class="pill" data-m="'+k+'" aria-pressed="'+(c.m===k)+'">'+m.e+' '+T(m.n)+'</button>'}).join('')+'</div></div></div>';
  h+='<p class="axtip"><b class="ltr ok">A</b>'+T('Yashil harf — to’g’ri javob. Boshqa harfni bosib o’zgartiring.')+'</p>';
  h+=c.questions.map(function(q,i){
    return '<article class="aiq'+(S.bad===i?' bad':'')+'" data-q="'+i+'"><div class="aiq-h"><span class="num">'+(i+1)+'</span><textarea class="aiq-t" data-qtext="'+i+'" maxlength="500" rows="2" aria-label="'+T('Savol matni')+'">'+esc(q.q)+'</textarea><button class="ibtn" data-del-q="'+i+'" aria-label="'+T('O’chirish')+'">🗑</button></div>'+
    '<div class="aiq-o">'+q.options.map(function(o,j){return '<div class="aiq-op'+(q.correctIndex===j?' ok':'')+'"><button class="ltr" data-correct="'+i+'-'+j+'" aria-label="'+T('To’g’ri javob')+'" aria-pressed="'+(q.correctIndex===j)+'">'+(q.correctIndex===j?'✓':letter(j))+'</button><input data-option="'+i+'-'+j+'" maxlength="300" value="'+esc(o)+'" aria-label="'+T('Javob')+' '+letter(j)+'"></div>'}).join('')+'</div>'+
    (q.evidence?'<details class="aiq-ev"><summary>📖 '+T('Manba')+'</summary><p>'+esc(q.evidence)+'</p></details>':'')+'</article>'}).join('');
  if(c.m==='mystery')h+='<div id="xc-ai"></div>';
  h+='<div class="aibar"><button class="go alt" id="ax-add">＋ '+T('Savol')+'</button>'+(S.saved&&!S.dirty?'<button class="cta" id="ax-play">▶ '+T('Boshlash')+'</button>':'<button class="cta" id="ax-save"><svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg> '+T('Saqlash')+'</button>')+'</div>';
  box.innerHTML=h;$$('#ax-editor .aiq-t').forEach(grow);
  if(c.m==='mystery')B.xc.mount($('#xc-ai'),c.xc,markDirty)}
function markDirty(){if(S.saved){S.dirty=true;var bar=$('.aibar .cta');if(bar&&bar.id==='ax-play'){bar.id='ax-save';bar.innerHTML='<svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg> '+T('Saqlash')}}else S.dirty=true}
function grow(t){t.style.height='auto';t.style.height=t.scrollHeight+'px'}
function save(){
  var c=S.cur,title=$('#ax-title').value.trim();
  if(!title){status('Test nomini kiriting.',true);$('#ax-title').focus();return}
  if(c.questions.length<3){status('Kamida 3 ta savol bo’lsin.',true);return}
  var bad=valid();if(bad>-1){S.bad=bad;editor();status('Belgilangan savolni tekshiring: matn, 4 ta turli javob va bitta to’g’ri javob kerak.',true);var el=$('#ax-editor [data-q="'+bad+'"]');if(el)el.scrollIntoView({block:'center',behavior:'smooth'});return}
  var m=B.MT[c.m||'quiz'];if(c.questions.length<m.min){status(T(m.n)+' '+T('uchun kamida')+' '+m.min+' '+T('savol kerak'),true);return}
  var old=B.getLessons().filter(function(x){return x.id===S.editId})[0];
  var l={id:S.editId||'u'+Date.now(),code:old&&old.code||String(100000+Math.floor(Math.random()*900000)),title:title,sub:old&&old.sub||'AI · '+c.file,cls:old&&old.cls||'Sinf',m:c.m||'quiz',created:old&&old.created||Date.now(),xc:(c.m==='mystery'&&Array.isArray(c.xc))?B.xc.clean(c.xc):undefined,qs:c.questions.map(function(q){return{q:q.q.trim(),a:q.options.map(function(x){return x.trim()}),c:q.correctIndex,evidence:q.evidence||''}}),aiTest:true};
  B.saveLesson(l);S.cur=null;S.editId=null;S.saved=false;S.dirty=false;S.bad=-1;S.files=[];renderFiles();showEditor(false);renderSaved();status('Test saqlandi');
  var row=$('#ax-saved [data-open="'+l.id+'"]');row=row&&row.closest('.axr');if(row){row.classList.add('new');setTimeout(function(){row.scrollIntoView({block:'center',behavior:'smooth'})},60)}
  if(window.confetti)confetti(innerWidth/2,innerHeight*.5,30)}
function savedList(){return B.getLessons().filter(function(x){return x.aiTest})}
function renderSaved(){
  var list=savedList(),box=$('#ax-saved');$('#ax-saved-s').hidden=!list.length||!$('#ax-editor').hidden;
  box.innerHTML=list.map(function(l){return '<div class="axr"><span class="tile" style="background:#EDE6FF">'+AI_ORB('xs')+'</span><div><b>'+esc(l.title)+'</b><small>'+(l.qs||[]).length+' '+T('savol')+' · '+new Date(l.created).toLocaleDateString()+'</small></div><button class="ibtn" data-open="'+esc(l.id)+'" aria-label="'+T('Tahrirlash')+'">✏️</button><button class="ibtn pl" data-play="'+esc(l.id)+'" aria-label="'+T('Boshlash')+'">▶</button><button class="ibtn" data-share="'+esc(l.id)+'" aria-label="'+T('Ulashish')+'"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.6l6.8-4M8.6 13.4l6.8 4"/></svg></button><button class="ibtn" data-delsv="'+esc(l.id)+'" aria-label="'+T('O’chirish')+'">🗑</button></div>'}).join('')}
function openSaved(id){var l=B.getLessons().filter(function(x){return x.id===id})[0];if(!l||!l.qs)return;
  S.cur={topic:l.title,file:(l.sub||'').replace(/^AI · /,''),m:l.m||'quiz',xc:Array.isArray(l.xc)?JSON.parse(JSON.stringify(l.xc)):undefined,questions:l.qs.map(function(q){return{q:q.q,options:q.a.slice(),correctIndex:q.c,evidence:q.evidence||''}})};
  S.editId=l.id;S.saved=true;S.dirty=false;S.bad=-1;status('');showEditor(true)}
function leave(){
  if(!$('#ax-editor').hidden){
    if(S.cur&&S.dirty&&!S.saved){B.ask('Saqlanmagan test','Chiqsangiz, tayyorlangan savollar yo’qoladi.','Chiqish',closeEd);return}
    closeEd();return}
  B.go('yaratish')}
function closeEd(){S.cur=null;S.editId=null;showEditor(false);renderSaved()}

/* ---- hodisalar ---- */
function init(){
  var mb=$('#ax-mys');if(mb)mb.addEventListener('click',function(){S.mys=!S.mys;mb.setAttribute('aria-pressed',S.mys)});
  var inp=$('#ax-file');
  inp.addEventListener('change',function(){addFiles(this.files);this.value=''});
  var dz=$('#ax-drop');
  ['dragenter','dragover'].forEach(function(ev){dz.addEventListener(ev,function(e){e.preventDefault();dz.classList.add('over')})});
  ['dragleave','drop'].forEach(function(ev){dz.addEventListener(ev,function(e){e.preventDefault();dz.classList.remove('over')})});
  dz.addEventListener('drop',function(e){addFiles(e.dataTransfer&&e.dataTransfer.files)});
  $('#ax-files').addEventListener('click',function(e){var b=e.target.closest('[data-rmf]');if(!b)return;S.files.splice(+b.dataset.rmf,1);status('');renderFiles()});
  $('#ax-cnt').addEventListener('click',function(e){var b=e.target.closest('[data-n]');if(!b)return;S.count=+b.dataset.n;$$('#ax-cnt .pill').forEach(function(p){p.setAttribute('aria-pressed',p===b)})});
  $('#ax-lv').addEventListener('click',function(e){var b=e.target.closest('[data-l]');if(!b)return;S.level=b.dataset.l;$$('#ax-lv button').forEach(function(p){p.setAttribute('aria-pressed',p===b)})});
  $('#ax-go').addEventListener('click',generate);
  $('#ax-cancel').addEventListener('click',function(){if(S.ctl)S.ctl.abort()});
  $('#ai-back').addEventListener('click',leave);
  var ed=$('#ax-editor');
  ed.addEventListener('input',function(e){var t=e.target;if(!S.cur)return;
    if(t.id==='ax-title')S.cur.topic=t.value;
    else if(t.dataset.qtext!==undefined){S.cur.questions[+t.dataset.qtext].q=t.value;grow(t)}
    else if(t.dataset.option!==undefined){var x=t.dataset.option.split('-');S.cur.questions[+x[0]].options[+x[1]]=t.value}
    else return;
    if(S.saved){S.dirty=true;var bar=$('.aibar .cta');if(bar&&bar.id==='ax-play'){bar.id='ax-save';bar.innerHTML='<svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg> '+T('Saqlash')}}else S.dirty=true});
  ed.addEventListener('click',function(e){var t=e.target,b;if(!S.cur)return;
    if(b=t.closest('[data-correct]')){var p=b.dataset.correct.split('-');S.cur.questions[+p[0]].correctIndex=+p[1];S.dirty=true;var y=document.scrollingElement.scrollTop;editor();document.scrollingElement.scrollTop=y;return}
    if(b=t.closest('[data-del-q]')){S.cur.questions.splice(+b.dataset.delQ,1);S.dirty=true;S.bad=-1;editor();return}
    if(b=t.closest('[data-m]')){S.cur.m=b.dataset.m;S.dirty=true;editor();return}
    if(t.closest('#ax-add')){S.cur.questions.push({q:'',options:['','','',''],correctIndex:0,evidence:''});S.dirty=true;editor();var l=$$('#ax-editor .aiq');if(l.length){var last=l[l.length-1];last.scrollIntoView({block:'center',behavior:'smooth'});var ta=last.querySelector('textarea');if(ta)ta.focus()}return}
    if(t.closest('#ax-save')){save();return}
    if(t.closest('#ax-play')){B.play(S.editId);return}});
  $('#ax-saved').addEventListener('click',function(e){var b;
    if(b=e.target.closest('[data-open]')){openSaved(b.dataset.open);return}
    if(b=e.target.closest('[data-share]')){B.share(b.dataset.share);return}
    if(b=e.target.closest('[data-delsv]')){var id=b.dataset.delsv;B.ask('Test o’chirilsinmi?','Test butunlay o’chiriladi.','O’chirish',function(){B.deleteLesson(id);renderSaved()})}});
  document.addEventListener('langchange',function(){renderFiles();quota();if(S.cur&&!$('#ax-editor').hidden)editor();renderSaved();upBtn()});
  renderFiles();renderSaved();quota()}
init();
document.addEventListener('visibilitychange',function(){if(!document.hidden)renderSaved()});
})();
