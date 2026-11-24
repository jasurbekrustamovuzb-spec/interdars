/* InterDars — Penalti sahnasi. Faqat penalti seriyasi boshlanganda yuklanadi (league.js loadStage orqali).
   window.PenaltyStage = { simulate, resolve, create }.
   Dunyo (metr): x — darvoza bo'ylab, y — yuqoriga, z — penalti nuqtasidan darvoza tomon (darvoza chizig'i z=11). */
(function(){
'use strict';
if(window.PenaltyStage)return;
var PI=Math.PI,HW=3.66,CB=2.44,PR=.06,BR=.11,ZG=11,ZK=10.82,ZB=13.2,ZAD=19,CZ=-5.2,CY0=1.55;
function clamp(v,a,b){return v<a?a:v>b?b:v}
function lerp(a,b,t){return a+(b-a)*t}
function h2(a,b){return Math.sqrt(a*a+b*b)}
function h3(a,b,c){return Math.sqrt(a*a+b*b+c*c)}
function rng(seed){var a=(seed>>>0)||1;return function(){a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ================= FIZIKA ================= */
var KD=.0105,KM=.0032;
function accel(v,w,o){var sp=h3(v[0],v[1],v[2]);
  o[0]=-KD*sp*v[0]+KM*(w[1]*v[2]-w[2]*v[1]);
  o[1]=-9.81-KD*sp*v[1]+KM*(w[2]*v[0]-w[0]*v[2]);
  o[2]=-KD*sp*v[2]+KM*(w[0]*v[1]-w[1]*v[0])}
/* maqsad nuqtaga (tx,ty) tushishi uchun boshlang'ich tezlikni topish (burama va havo qarshiligini hisobga olib) */
function launch(shot){var tx=clamp(+shot.tx||0,-9,9),ty=clamp(+shot.ty||0,-1,6),s=clamp(+shot.sp||22,15,36),cu=clamp(+shot.cu||0,-1,1),ax=tx,ay=ty,w=[18,cu*62,0],v=[0,0,0],i,dt=1/240;
  for(i=0;i<6;i++){var dx=ax,dy=ay-BR,dz=ZG,L=h3(dx,dy,dz);v=[s*dx/L,s*dy/L,s*dz/L];
    var p=[0,BR,0],q=[v[0],v[1],v[2]],a=[0,0,0],n=0;
    while(p[2]<ZG&&n<900){accel(q,w,a);q[0]+=a[0]*dt;q[1]+=a[1]*dt;q[2]+=a[2]*dt;p[0]+=q[0]*dt;p[1]+=q[1]*dt;p[2]+=q[2]*dt;n++}
    ax+=tx-p[0];ay+=ty-p[1]}
  return{v:v,w:w}}
function qmul(a,b){return[a[0]*b[0]-a[1]*b[1]-a[2]*b[2]-a[3]*b[3],a[0]*b[1]+a[1]*b[0]+a[2]*b[3]-a[3]*b[2],a[0]*b[2]-a[1]*b[3]+a[2]*b[0]+a[3]*b[1],a[0]*b[3]+a[1]*b[2]-a[2]*b[1]+a[3]*b[0]]}
function qstep(q,w,dt){var d=qmul([0,w[0],w[1],w[2]],q),r=[q[0]+.5*d[0]*dt,q[1]+.5*d[1]*dt,q[2]+.5*d[2]*dt,q[3]+.5*d[3]*dt],l=Math.sqrt(r[0]*r[0]+r[1]*r[1]+r[2]*r[2]+r[3]*r[3])||1;return[r[0]/l,r[1]/l,r[2]/l,r[3]/l]}

/* ---- darvozabon: reja va skelet ---- */
var ARM=.74,TOR=.56;
function keeperPlan(dv){if(!dv||!(dv[0]>=0))return{dive:false};
  var tx=(clamp(dv[0],0,1)-.5)*2*HW,ty=clamp(dv[1],0,1)*2.6,dx=tx,dy=ty-1.4,d=h2(dx,dy),RM=3.55;
  if(d>RM){tx=dx*RM/d;ty=1.4+dy*RM/d}
  var th=clamp(Math.atan2(tx,Math.max(ty-.5,.35)),-1.45,1.45),u=[Math.sin(th),Math.cos(th)],d0=h2(tx,ty-1.4);
  return{dive:true,tx:tx,ty:ty,th:th,PT:[tx-u[0]*(TOR+ARM),Math.max(.3,ty-u[1]*(TOR+ARM))],Td:.26+.072*d0,t0:.07,lay:Math.abs(th)>.55,jump:.14+.12*ty/2.6}}
function ik2(ax,ay,tx,ty,l1,l2,side){var dx=tx-ax,dy=ty-ay,d=h2(dx,dy)||.001,dd=clamp(d,.05,l1+l2-.001),a=(l1*l1-l2*l2+dd*dd)/(2*dd),h=Math.sqrt(Math.max(0,l1*l1-a*a)),ux=dx/d,uy=dy/d;
  return{j:[ax+ux*a-uy*h*side,ay+uy*a+ux*h*side],e:[ax+ux*dd,ay+uy*dd]}}
function keeperPose(pl,t){var th=0,Px,Py,u,pp,s,e,f,k,hd=[[0,0],[0,0]],ft=[[0,0],[0,0]],bob=Math.sin(t*5.2)*.02,sway=Math.sin(t*2.3)*.05;
  if(!pl.dive){Px=sway;Py=.9+bob;th=sway*.25;u=[Math.sin(th),Math.cos(th)];pp=[Math.cos(th),-Math.sin(th)];
    hd=[[Px-.5+sway,1.52+Math.sin(t*4)*.04],[Px+.5+sway,1.52+Math.sin(t*4+1)*.04]];ft=[[Px-.34,0],[Px+.34,0]]}
  else{s=clamp((t-pl.t0)/pl.Td,0,1);e=1-Math.pow(1-s,2.2);f=clamp((t-pl.t0-pl.Td)/.42,0,1);k=clamp(t/pl.t0,0,1);
    th=pl.th*e;if(pl.lay)th=pl.th*(1+.25*f);th=clamp(th,-1.5,1.5);
    u=[Math.sin(th),Math.cos(th)];pp=[Math.cos(th),-Math.sin(th)];
    Px=lerp(0,pl.PT[0],e);Py=lerp(.9-.1*k,pl.PT[1],e)+pl.jump*Math.sin(PI*s)*(pl.lay?.7:1);
    if(f>0){if(pl.lay)Py=lerp(Py,.27,f);else Py=lerp(Py,.9,f*f)}
    var Sx=Px+u[0]*TOR,Sy=Py+u[1]*TOR,rdy=[[Px-.5,1.52],[Px+.5,1.52]];
    for(var i=0;i<2;i++){var sg=i?1:-1,fin=[Sx+u[0]*ARM+pp[0]*.12*sg,Sy+u[1]*ARM+pp[1]*.12*sg];hd[i]=[lerp(rdy[i][0],fin[0],e),lerp(rdy[i][1],fin[1],e)];
      var fs=[Px+pp[0]*.12*sg*2-u[0]*.92+(pl.lay?0:0),Py+pp[1]*.12*sg*2-u[1]*.92];if(!pl.lay)fs[1]=Math.max(fs[1],0);if(pl.lay&&f>0)fs[1]=Math.max(.05,fs[1]);
      ft[i]=[lerp(Px+(i?.34:-.34),fs[0],e),lerp(0,fs[1],e)]}}
  var S=[Px+u[0]*TOR,Py+u[1]*TOR],Hd=[Px+u[0]*(TOR+.27),Py+u[1]*(TOR+.27)],o={P:[Px,Py],S:S,Hd:Hd,th:th,sh:[],el:[],hn:[],hp:[],kn:[],ft:[]};
  for(var j=0;j<2;j++){var sd=j?1:-1,shd=[S[0]+pp[0]*.17*sd,S[1]+pp[1]*.17*sd],hip=[Px+pp[0]*.1*sd,Py+pp[1]*.1*sd],a1=ik2(shd[0],shd[1],hd[j][0],hd[j][1],.36,.38,sd),l1=ik2(hip[0],hip[1],ft[j][0],ft[j][1],.46,.46,sd);
    o.sh.push(shd);o.el.push(a1.j);o.hn.push(a1.e);o.hp.push(hip);o.kn.push(l1.j);o.ft.push(l1.e)}
  return o}
function segs(o){var r=[[o.P[0],o.P[1],o.S[0],o.S[1],.22,0],[o.S[0],o.S[1],o.Hd[0],o.Hd[1],.12,0]];
  for(var j=0;j<2;j++){r.push([o.sh[j][0],o.sh[j][1],o.el[j][0],o.el[j][1],.09,1],[o.el[j][0],o.el[j][1],o.hn[j][0],o.hn[j][1],.1,1],[o.hn[j][0],o.hn[j][1],o.hn[j][0],o.hn[j][1],.16,2+j],[o.hp[j][0],o.hp[j][1],o.kn[j][0],o.kn[j][1],.12,0],[o.kn[j][0],o.kn[j][1],o.ft[j][0],o.ft[j][1],.1,0])}
  return r}
function segHit(px,py,pz,sg){var ax=sg[0],ay=sg[1],bx=sg[2],by=sg[3],dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy,u=L>1e-9?clamp(((px-ax)*dx+(py-ay)*dy)/L,0,1):0,cx=ax+dx*u,cy=ay+dy*u,dz=Math.max(0,Math.abs(pz-ZK)-.12),d=h3(px-cx,py-cy,dz);
  return d<sg[4]+BR?{cx:cx,cy:cy,d:d}:null}

/* ---- asosiy simulyatsiya (deterministik; tashkilotchi va o'yinchilarda bir xil natija) ---- */
function simulate(shot,dive,seed){var rnd=rng(seed||1),Lc=launch(shot),v=Lc.v,w=Lc.w,p=[0,BR,0],q=[1,0,0,0],plan=keeperPlan(dive),H=1/240,t=0,F=[],ev=[],net=[],res='miss',pt='',touched=false,crossed=false,inNet=false,caught=null,rest=0,a=[0,0,0],n=0,tg=0,tt=0,first={};
  function evt(k,x){ev.push({t:t,k:k,s:x||0})}
  function impact(k,x,y,z,s){if(s>1.2)net.push({t:t,x:x,y:y,z:z,a:Math.min(1,s/20),k:k});if(!first.net){first.net=1;evt('net',s)}}
  while(t<6){
    if(caught){var po=keeperPose(plan,t),hh=po.hn[caught.h];if(t<caught.t+.6){p[0]=hh[0];p[1]=hh[1]-.1;p[2]=ZK-.1;v=[0,0,0];t+=H;n++;if(n%4===0)F.push(t,p[0],p[1],p[2],q[0],q[1],q[2],q[3]);continue}else{caught=null;v=[0,-.5,-.6]}}
    accel(v,w,a);v[0]+=a[0]*H;v[1]+=a[1]*H;v[2]+=a[2]*H;p[0]+=v[0]*H;p[1]+=v[1]*H;p[2]+=v[2]*H;
    var ad=1-.04*H;w[0]*=ad;w[1]*=ad;w[2]*=ad;
    if(p[1]<BR){p[1]=BR;if(v[1]<-.8){evt('bounce',-v[1]);v[1]*=-.6;v[0]*=.88;v[2]*=.88}else{v[1]=0;var fr=1-.5*H;v[0]*=fr;v[2]*=fr}
      var kk=Math.min(1,H*9);w[0]=lerp(w[0],v[2]/BR,kk);w[2]=lerp(w[2],-v[0]/BR,kk)}
    /* ustunlar va to'sin */
    if(!touched||true){var ps=[-HW-PR,HW+PR],pi,dx,dz,d,nx,nz,vn;
      for(pi=0;pi<2;pi++){dx=p[0]-ps[pi];dz=p[2]-ZG;d=h2(dx,dz);
        if(d<PR+BR&&p[1]<CB+2*PR){nx=dx/(d||1);nz=dz/(d||1);vn=v[0]*nx+v[2]*nz;
          if(vn<0){v[0]-=1.6*vn*nx;v[2]-=1.6*vn*nz;v[0]*=.92;v[2]*=.92;w[0]*=.5;w[1]=-w[1]*.4;if(!pt)pt='post';evt('post',-vn)}
          p[0]=ps[pi]+nx*(PR+BR+.001);p[2]=ZG+nz*(PR+BR+.001)}}
      if(Math.abs(p[0])<=HW+PR+.02){var dy=p[1]-(CB+PR);dz=p[2]-ZG;d=h2(dy,dz);
        if(d<PR+BR){var ny=dy/(d||1);nz=dz/(d||1);vn=v[1]*ny+v[2]*nz;
          if(vn<0){v[1]-=1.6*vn*ny;v[2]-=1.6*vn*nz;v[1]*=.95;v[2]*=.92;w[0]*=-.5;if(!pt)pt='bar';evt('bar',-vn)}
          p[1]=CB+PR+ny*(PR+BR+.001);p[2]=ZG+nz*(PR+BR+.001)}}}
    /* darvozabon */
    if(!touched&&!crossed&&p[2]>ZK-.7&&p[2]<ZG+.25){var po2=keeperPose(plan,t),sl=segs(po2),si,best=null,bs=null;
      for(si=0;si<sl.length;si++){var hh2=segHit(p[0],p[1],p[2],sl[si]);if(hh2&&(!best||hh2.d<best.d)){best=hh2;bs=sl[si]}}
      if(best){touched=true;tt=t;res='save';var nx2=p[0]-best.cx,ny2=p[1]-best.cy,nz2=p[2]-ZK,nl=h3(nx2,ny2,nz2)||1;nx2/=nl;ny2/=nl;nz2/=nl;
        if(nz2>-.35){nz2=-.35;var l2=h3(nx2,ny2,nz2);nx2/=l2;ny2/=l2;nz2/=l2}
        var spd=h3(v[0],v[1],v[2]),hand=bs[5]>=1;
        if(bs[5]>=2&&spd<20.5&&rnd()<.46){caught={t:t,h:bs[5]-2};evt('catch',spd)}
        else{var vn2=v[0]*nx2+v[1]*ny2+v[2]*nz2;v[0]-=1.38*vn2*nx2;v[1]-=1.38*vn2*ny2;v[2]-=1.38*vn2*nz2;
          var kf=hand?.62:.45;v[0]=v[0]*kf+(rnd()-.5)*3+(p[0]>po2.P[0]?1:-1)*rnd()*1.5;v[1]=v[1]*kf+1+rnd()*2.4;v[2]=Math.min(v[2]*kf,-1.8-rnd()*2.4);
          w[0]*=-.5;w[1]*=-.5;w[2]=(rnd()-.5)*30;evt('parry',spd)}}}
    /* gol chizig'i */
    if(!crossed&&!touched&&p[2]>=ZG){crossed=true;if(Math.abs(p[0])<=HW&&p[1]<=CB&&p[1]>=0){res='goal';inNet=true;tg=t;evt('goal')}else evt('wide')}
    /* to'r */
    if(inNet){var imp;
      if(p[2]>ZB-BR){imp=Math.abs(v[2]);p[2]=ZB-BR;v[2]=-v[2]*.08;v[0]*=.5;v[1]*=.55;impact(0,p[0],p[1],ZB,imp)}
      if(p[0]>HW-BR-.04){imp=Math.abs(v[0]);p[0]=HW-BR-.04;v[0]=-v[0]*.08;impact(1,p[0],p[1],p[2],imp)}
      if(p[0]<-HW+BR+.04){imp=Math.abs(v[0]);p[0]=-HW+BR+.04;v[0]=-v[0]*.08;impact(2,p[0],p[1],p[2],imp)}
      var ry=CB-(p[2]-ZG)/(ZB-ZG)*.44-BR-.02;if(p[1]>ry){imp=Math.abs(v[1]);p[1]=ry;v[1]=-v[1]*.08;impact(3,p[0],p[1],p[2],imp)}}
    else if(!crossed||touched||p[2]>ZG){if(p[2]>ZAD-BR&&p[1]<1.05&&v[2]>0){p[2]=ZAD-BR;v[2]=-v[2]*.45;v[0]*=.7;evt('board',v[2])}}
    q=qstep(q,w,H);t+=H;n++;
    if(n%4===0)F.push(t,p[0],p[1],p[2],q[0],q[1],q[2],q[3]);
    if(p[1]<BR+.02&&h3(v[0],v[1],v[2])<.14){rest+=H;if(rest>.35)break}else rest=0;
    if(p[2]>40||p[2]<-9||Math.abs(p[0])>60)break}
  return{res:res,pt:res==='goal'?'':pt,frames:F,net:net,ev:ev,tg:tg,tt:tt,plan:plan,dur:t,touched:touched}}
function resolve(shot,dive,seed){try{var s=simulate(shot,dive,seed);return{r:s.res,pt:s.pt}}catch(e){return null}}

/* ================= TO'P GEOMETRIYASI (futbol to'pi) ================= */
var PH=(1+Math.sqrt(5))/2,PC=[[0,1,PH],[0,-1,PH],[0,1,-PH],[0,-1,-PH],[1,PH,0],[-1,PH,0],[1,-PH,0],[-1,-PH,0],[PH,0,1],[-PH,0,1],[PH,0,-1],[-PH,0,-1]].map(function(n){var l=h3(n[0],n[1],n[2]);return[n[0]/l,n[1]/l,n[2]/l]});
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function norm(a){var l=h3(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]}
var PATCH=PC.map(function(n){var hv=Math.abs(n[1])<.9?[0,1,0]:[1,0,0],t1=norm(cross(n,hv)),t2=cross(n,t1),A=.42,B=.78,vs=[],es=[],k;
  for(k=0;k<5;k++){var ph=k*2*PI/5+.3,c=Math.cos(ph),s=Math.sin(ph);
    vs.push([n[0]*Math.cos(A)+(t1[0]*c+t2[0]*s)*Math.sin(A),n[1]*Math.cos(A)+(t1[1]*c+t2[1]*s)*Math.sin(A),n[2]*Math.cos(A)+(t1[2]*c+t2[2]*s)*Math.sin(A)]);
    es.push([n[0]*Math.cos(B)+(t1[0]*c+t2[0]*s)*Math.sin(B),n[1]*Math.cos(B)+(t1[1]*c+t2[1]*s)*Math.sin(B),n[2]*Math.cos(B)+(t1[2]*c+t2[2]*s)*Math.sin(B)])}
  return{n:n,v:vs,e:es}});
function qrot(q,v){var w=q[0],x=q[1],y=q[2],z=q[3],tx=2*(y*v[2]-z*v[1]),ty=2*(z*v[0]-x*v[2]),tz=2*(x*v[1]-y*v[0]);return[v[0]+w*tx+y*tz-z*ty,v[1]+w*ty+z*tx-x*tz,v[2]+w*tz+x*ty-y*tx]}

/* ================= SAHNA ================= */
function create(cv,o){o=o||{};var c=cv.getContext('2d'),W=1000,H=640,sc=1,F=980,CX=500,CY=256,dead=false,raf=0,last=0,T=0,role='v',
  bg=null,crowd=null,gnd=null,fans=[],flags=[],spk=[],conf=[],trig=[],sim=null,anim=null,trail=null,dvp=null,ban=null,shake=0,ex=.15,exT=.15,flash=[],cbEnd=null,ax=null,gain=null,noiseB=null,busy=false;
  function proj(x,y,z){var d=z-CZ,k=F/d;return[CX+x*k,CY-(y-CY0)*k,k]}
  function snd(){return o.snd?o.snd():true}
  /* ---- ovoz ---- */
  function actx(){if(ax)return ax;try{ax=new(window.AudioContext||window.webkitAudioContext)();noiseB=ax.createBuffer(1,ax.sampleRate*2,ax.sampleRate);var d=noiseB.getChannelData(0),l=0;for(var i=0;i<d.length;i++){l=(l+.04*(Math.random()*2-1))/1.04;d[i]=l*9}
      var s=ax.createBufferSource();s.buffer=noiseB;s.loop=true;var f=ax.createBiquadFilter();f.type='bandpass';f.frequency.value=520;f.Q.value=.6;gain=ax.createGain();gain.gain.value=.025;s.connect(f);f.connect(gain);gain.connect(ax.destination);s.start()}catch(e){ax=null}return ax}
  function unlock(){var a=actx();if(a&&a.state==='suspended')a.resume()}
  function tone(f,d,ty,v,at){if(!snd()||!ax)return;try{var t0=ax.currentTime+(at||0),os=ax.createOscillator(),g=ax.createGain();os.type=ty||'sine';os.frequency.setValueAtTime(f,t0);os.frequency.exponentialRampToValueAtTime(Math.max(30,f*.5),t0+d);g.gain.setValueAtTime(v||.1,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+d);os.connect(g);g.connect(ax.destination);os.start(t0);os.stop(t0+d+.02)}catch(e){}}
  function swell(peak,dur,fq){if(!snd()||!ax||!gain)return;try{var t0=ax.currentTime;gain.gain.cancelScheduledValues(t0);gain.gain.setValueAtTime(gain.gain.value,t0);gain.gain.linearRampToValueAtTime(peak,t0+.35);gain.gain.linearRampToValueAtTime(.025,t0+dur)}catch(e){}}
  function sfx(k,s){if(!snd())return;unlock();if(!ax)return;
    if(k==='kick'){tone(150,.12,'sine',.22);tone(900,.04,'square',.03)}else if(k==='post'||k==='bar'){tone(1250,.35,'triangle',.12);tone(800,.4,'sine',.08,.02)}
    else if(k==='net'){swell(.09,1.2);tone(220,.25,'sawtooth',.03)}else if(k==='parry'||k==='catch'){tone(260,.12,'square',.06);tone(120,.15,'sine',.1)}
    else if(k==='bounce'){tone(110,.09,'sine',.05)}else if(k==='goal'){swell(.2,3.2);[523,659,784,1046].forEach(function(f,i){tone(f,.25,'triangle',.05,i*.09)})}
    else if(k==='groan'){swell(.07,1.8);tone(240,.6,'sawtooth',.03)}else if(k==='hush'){if(gain){try{gain.gain.setTargetAtTime(.008,ax.currentTime,.1)}catch(e){}}}}
  /* ---- o'lcham va keshlar ---- */
  function fit(){var par=cv.parentNode,pw=Math.min((par&&par.clientWidth)||600,980),ar=pw<520?.74:.64,ch=Math.min(pw*ar,Math.max(240,(window.innerHeight||700)-210));ar=Math.max(.56,ch/pw);
    var dpr=Math.min(2,window.devicePixelRatio||1);W=1000;H=Math.round(W*ar);F=980;CX=W/2;CY=H*.4;cv.style.width=pw+'px';cv.style.height=(pw*ar)+'px';cv.width=Math.round(pw*dpr);cv.height=Math.round(pw*ar*dpr);sc=cv.width/W;build()}
  function mk(){var e=document.createElement('canvas');e.width=Math.round(W*sc);e.height=Math.round(H*sc);var x=e.getContext('2d');x.setTransform(sc,0,0,sc,0,0);return{e:e,x:x}}
  function build(){var r=rng(77),i,j,x;
    /* osmon + tomlar + tribuna */
    var B=mk(),b=B.x,top=H*.03,base=CY+26;
    var g=b.createLinearGradient(0,0,0,base);g.addColorStop(0,'#04060f');g.addColorStop(.5,'#0b1330');g.addColorStop(1,'#1a2350');b.fillStyle=g;b.fillRect(0,0,W,H);
    b.fillStyle='#0a0d1c';b.fillRect(0,0,W,top+6);
    b.strokeStyle='rgba(120,140,190,.35)';b.lineWidth=1;for(i=0;i<=W;i+=40){b.beginPath();b.moveTo(i,0);b.lineTo(i+(i<W/2?18:-18),top+6);b.stroke()}
    /* proyektor nurlari va yorug'lik */
    [[70,top+4],[W-70,top+4],[W/2-260,top+4],[W/2+260,top+4]].forEach(function(l){var rg=b.createRadialGradient(l[0],l[1],2,l[0],l[1],240);rg.addColorStop(0,'rgba(255,250,225,.55)');rg.addColorStop(.25,'rgba(255,245,210,.14)');rg.addColorStop(1,'rgba(255,245,210,0)');b.fillStyle=rg;b.fillRect(l[0]-250,l[1]-10,500,420);
      b.fillStyle='#fffbe8';for(var q=0;q<8;q++){b.beginPath();b.arc(l[0]-28+q*8,l[1]-3,2.6,0,7);b.fill()}});
    /* tribuna qatorlari */
    var rows=Math.max(10,Math.floor((base-top-16)/11)),rh=(base-top-16)/rows,Cc=mk(),cc=Cc.x;
    fans=[];var P1=['#2a7de1','#f2f4ff','#8cc4ff','#ffffff','#1b4fa8'],P2=['#d8232a','#ffffff','#ff6b6b','#f6c200','#8e1018'],PM=['#222a40','#ffc53d','#27c99a','#ff7ab6','#eee'],sk=['#f1c9a0','#c98c5c','#8a5a3a','#e8b48a','#5e3b25'];
    for(i=0;i<rows;i++){var y=top+14+i*rh,dark=.12+(1-i/rows)*.0;b.fillStyle=i%2?'#10162e':'#0d1226';b.fillRect(0,y+rh-2,W,3);
      for(x=4+(i%2)*4;x<W;x+=9){var side=x/W,pal=side<.38?P1:side>.62?P2:PM,col=pal[Math.floor(r()*pal.length)];if(r()<.06)continue;
        var hy=y+rh*.28,sz=3.4+i/rows*.8;cc.fillStyle=col;cc.fillRect(x-3.2,hy+2.6,6.4,rh*.62);cc.fillStyle=sk[Math.floor(r()*sk.length)];cc.beginPath();cc.arc(x,hy,sz*.78,0,7);cc.fill();
        if(r()<.2){cc.fillStyle='rgba(255,255,255,.7)';cc.fillRect(x-1,hy-sz-1,2,2)}}}
    for(i=0;i<5;i++){x=W*(i+1)/6;b.fillStyle='rgba(0,0,0,.55)';b.fillRect(x-4,top+10,8,base-top);}
    var dg=b.createLinearGradient(0,top,0,base);dg.addColorStop(0,'rgba(0,0,10,.55)');dg.addColorStop(.7,'rgba(0,0,10,.1)');dg.addColorStop(1,'rgba(0,0,10,0)');cc.globalCompositeOperation='source-atop';cc.fillStyle=dg;cc.fillRect(0,0,W,H);cc.globalCompositeOperation='source-over';
    b.fillStyle='#0c1020';b.fillRect(0,base-2,W,CY+80-base);
    bg=B.e;crowd=Cc.e;crowd.rows=rows;crowd.top=top;crowd.rh=rh;crowd.base=base;
    flags=[];for(i=0;i<26;i++)flags.push({x:r()*W,y:top+20+r()*(base-top-60),c:['#2a7de1','#d8232a','#f6c200','#fff'][i%4],p:r()*6});
    /* o't maydoni (statik) */
    var G=mk(),gc=G.x,gy0=CY+18,i2;var gr=gc.createLinearGradient(0,gy0,0,H);gr.addColorStop(0,'#0a3a1c');gr.addColorStop(.35,'#1c6b30');gr.addColorStop(1,'#2f8d43');gc.fillStyle=gr;gc.fillRect(0,gy0,W,H-gy0);
    function quad(x0,x1,z0,z1){var a=proj(x0,0,z0),b2=proj(x1,0,z0),c2=proj(x1,0,z1),d2=proj(x0,0,z1);gc.beginPath();gc.moveTo(a[0],a[1]);gc.lineTo(b2[0],b2[1]);gc.lineTo(c2[0],c2[1]);gc.lineTo(d2[0],d2[1]);gc.closePath();gc.fill()}
    for(i2=-2;i2<12;i2++){var z0=Math.max(-1.3,-2+i2*5.5),z1=Math.min(ZAD+2,-2+(i2+1)*5.5);if(z1<=z0)continue;gc.fillStyle=i2%2?'rgba(255,255,255,.055)':'rgba(0,0,0,.075)';quad(-70,70,z0,z1)}
    var pt=document.createElement('canvas');pt.width=pt.height=96;var px=pt.getContext('2d'),r2=rng(5);for(i=0;i<420;i++){px.strokeStyle='rgba('+(r2()<.5?'255,255,255':'0,0,0')+','+(.05+r2()*.07)+')';px.lineWidth=1;var gx=r2()*96,gyy=r2()*96;px.beginPath();px.moveTo(gx,gyy);px.lineTo(gx+(r2()-.5)*2,gyy-3-r2()*4);px.stroke()}
    gc.globalAlpha=.9;gc.fillStyle=gc.createPattern(pt,'repeat');gc.fillRect(0,gy0+30,W,H-gy0-30);gc.globalAlpha=1;
    function ln(x1,z1,x2,z2,w){z1=Math.max(z1,-1.2);z2=Math.max(z2,-1.2);var dx=x2-x1,dz=z2-z1,l=h2(dx,dz)||1,nx=-dz/l*w/2,nz=dx/l*w/2,a=proj(x1+nx,0,z1+nz),b2=proj(x1-nx,0,z1-nz),c2=proj(x2-nx,0,z2-nz),d2=proj(x2+nx,0,z2+nz);gc.beginPath();gc.moveTo(a[0],a[1]);gc.lineTo(b2[0],b2[1]);gc.lineTo(c2[0],c2[1]);gc.lineTo(d2[0],d2[1]);gc.closePath();gc.fill()}
    gc.fillStyle='rgba(255,255,255,.9)';ln(-60,ZG,60,ZG,.13);ln(-9.16,ZG-5.5,9.16,ZG-5.5,.13);ln(-9.16,ZG-5.5,-9.16,ZG,.13);ln(9.16,ZG-5.5,9.16,ZG,.13);ln(-20.16,-5.5,-20.16,ZG,.13);ln(20.16,-5.5,20.16,ZG,.13);
    gc.beginPath();for(i=0;i<=16;i++){var aa=i/16*2*PI,sp=proj(Math.cos(aa)*.13,0,Math.sin(aa)*.13);i?gc.lineTo(sp[0],sp[1]):gc.moveTo(sp[0],sp[1])}gc.fill();
    var vg=gc.createRadialGradient(CX,CY+170,60,CX,CY+170,W*.75);vg.addColorStop(0,'rgba(255,255,220,.1)');vg.addColorStop(1,'rgba(0,0,0,.5)');gc.fillStyle=vg;gc.fillRect(0,gy0,W,H-gy0);
    gnd=G.e;gnd.y=gy0}
  /* ---- chizish yordamchilari ---- */
  function limb(a,b,r,col,k){c.strokeStyle=col;c.lineWidth=Math.max(1,r*2*k);c.lineCap='round';c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke()}
  function J(p){var k=F/(ZK-CZ);return[CX+p[0]*k,CY-(p[1]-CY0)*k]}
  function drawKeeper(po,k){var P=J(po.P),S=J(po.S),Hd=J(po.Hd),i;c.save();
    c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(P[0],J([0,0])[1]+2,.62*k,.12*k,0,0,7);c.fill();
    for(i=0;i<2;i++){var hp=J(po.hp[i]),kn=J(po.kn[i]),ft=J(po.ft[i]),mid=[lerp(hp[0],kn[0],.55),lerp(hp[1],kn[1],.55)];
      limb(kn,ft,.095,'#ffd23a',k);limb(hp,mid,.135,'#15171f',k);limb(ft,[ft[0]+(i?1:-1)*.1*k,ft[1]+.02*k],.09,'#0b0b10',k)}
    var sh0=J(po.sh[0]),sh1=J(po.sh[1]),hp0=J(po.hp[0]),hp1=J(po.hp[1]);
    c.fillStyle='#ff9d1a';c.beginPath();c.moveTo(sh0[0],sh0[1]);c.lineTo(sh1[0],sh1[1]);c.lineTo(hp1[0],hp1[1]);c.lineTo(hp0[0],hp0[1]);c.closePath();c.fill();
    c.lineJoin='round';c.strokeStyle='#ff9d1a';c.lineWidth=.12*k;c.stroke();
    limb(S,P,.21,'#ff9d1a',k);c.globalAlpha=.35;limb([lerp(S[0],P[0],.12),lerp(S[1],P[1],.12)],[lerp(S[0],P[0],.7),lerp(S[1],P[1],.7)],.07,'#fff',k);c.globalAlpha=1;
    limb([lerp(S[0],P[0],.62),lerp(S[1],P[1],.62)],[lerp(P[0],P[0],1),P[1]],.19,'#15171f',k);
    for(i=0;i<2;i++){var s2=J(po.sh[i]),el=J(po.el[i]),hn=J(po.hn[i]);limb(s2,el,.085,'#ff7a00',k);limb(el,hn,.075,'#ff7a00',k);
      c.fillStyle='#c6ff3c';c.beginPath();c.arc(hn[0],hn[1],.14*k,0,7);c.fill();c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.arc(hn[0],hn[1],.07*k,0,7);c.fill()}
    c.fillStyle='#e8b48a';c.beginPath();c.arc(Hd[0],Hd[1],.115*k,0,7);c.fill();c.fillStyle='#2a1a10';c.beginPath();c.arc(Hd[0],Hd[1]-.02*k,.118*k,PI*1.05,PI*1.95);c.fill();
    c.fillStyle='#1a1a1a';c.fillRect(Hd[0]-.05*k,Hd[1]-.01*k,.025*k,.025*k);c.fillRect(Hd[0]+.03*k,Hd[1]-.01*k,.025*k,.025*k);c.restore()}
  function drawBall(bp,q,k0,fast){var pr=proj(bp[0],bp[1],bp[2]),r=Math.max(1.5,pr[2]*BR),x=pr[0],y=pr[1];
    if(bp[2]-CZ<.4)return;
    if(fast>.5){for(var gI=1;gI<=3;gI++){c.globalAlpha=.12/gI;c.fillStyle='#fff';c.beginPath();c.arc(x-fast*gI*0,y+gI*1.5,r*(1-.1*gI),0,7);c.fill()}c.globalAlpha=1}
    c.save();c.beginPath();c.arc(x,y,r,0,7);c.clip();
    var g=c.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r*1.05);g.addColorStop(0,'#fff');g.addColorStop(.7,'#e6e9ef');g.addColorStop(1,'#a9afbd');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
    if(r>2.5){var i,k;c.fillStyle='#16171d';c.strokeStyle='rgba(40,44,60,.75)';c.lineWidth=Math.max(.5,r*.06);
      for(i=0;i<12;i++){var pa=PATCH[i],cn=qrot(q,pa.n);if(cn[2]>.2)continue;var vs=pa.v.map(function(v){return qrot(q,v)}),es=pa.e.map(function(v){return qrot(q,v)});
        c.beginPath();for(k=0;k<5;k++){var X=x+vs[k][0]*r,Y=y-vs[k][1]*r;k?c.lineTo(X,Y):c.moveTo(X,Y)}c.closePath();c.fill();
        if(r>5)for(k=0;k<5;k++){if(vs[k][2]>.15||es[k][2]>.15)continue;c.beginPath();c.moveTo(x+vs[k][0]*r,y-vs[k][1]*r);c.lineTo(x+es[k][0]*r,y-es[k][1]*r);c.stroke()}}}
    var sh=c.createRadialGradient(x,y,r*.55,x,y,r*1.02);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,20,.4)');c.fillStyle=sh;c.fillRect(x-r,y-r,r*2,r*2);c.restore()}
  /* to'r (tebranuvchi to'g'ri panjara) */
  function netOff(x,y,z,tm){var dx=0,dy=0,dz=0;for(var i=0;i<sim.net.length;i++){var m=sim.net[i],dt=tm-m.t;if(dt<0||dt>3)continue;var d2=(x-m.x)*(x-m.x)+(y-m.y)*(y-m.y)+(z-m.z)*(z-m.z),am=m.a*.6*Math.exp(-dt*2.4)*Math.cos(dt*15)*Math.exp(-d2/1.3);
      if(m.k===0)dz+=am;else if(m.k===1)dx+=am;else if(m.k===2)dx-=am;else dy+=am}
    return[dx,dy,dz]}
  function nv(x,y,z,tm,on){if(on){var d=netOff(x,y,z,tm);x+=d[0];y+=d[1];z+=d[2]}return proj(x,y,z)}
  function netSurf(f,nx,ny,tm,on){c.beginPath();var i,j,p;
    for(i=0;i<=nx;i++){for(j=0;j<=ny;j++){p=f(i/nx,j/ny);var q=nv(p[0],p[1],p[2],tm,on);j?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1])}}
    for(j=0;j<=ny;j++){for(i=0;i<=nx;i++){p=f(i/nx,j/ny);var q2=nv(p[0],p[1],p[2],tm,on);i?c.lineTo(q2[0],q2[1]):c.moveTo(q2[0],q2[1])}}
    c.stroke()}
  function ytop(z){return CB-(z-ZG)/(ZB-ZG)*.44}
  function drawNetBack(tm,on){c.strokeStyle='rgba(235,240,255,.34)';c.lineWidth=.7;netSurf(function(u,v){return[lerp(-HW,HW,u),v*ytop(ZB),ZB]},20,9,tm,on)}
  function drawNetSide(tm,on){c.strokeStyle='rgba(235,240,255,.3)';c.lineWidth=.7;
    netSurf(function(u,v){var z=lerp(ZG,ZB,u);return[-HW,v*ytop(z),z]},7,8,tm,on);netSurf(function(u,v){var z=lerp(ZG,ZB,u);return[HW,v*ytop(z),z]},7,8,tm,on);
    netSurf(function(u,v){var z=lerp(ZG,ZB,v);return[lerp(-HW,HW,u),ytop(z),z]},20,7,tm,on)}
  function drawPosts(){var k=F/(ZG-CZ),a=proj(-HW-PR,0,ZG),b=proj(-HW-PR,CB+2*PR,ZG),c1=proj(HW+PR,0,ZG),d=proj(HW+PR,CB+2*PR,ZG),w=2*PR*k;
    c.lineCap='butt';c.strokeStyle='#fff';c.lineWidth=w;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.moveTo(c1[0],c1[1]);c.lineTo(d[0],d[1]);c.moveTo(b[0]-w/2,b[1]);c.lineTo(d[0]+w/2,d[1]);c.stroke();
    c.strokeStyle='rgba(120,130,150,.55)';c.lineWidth=Math.max(1,w*.28);c.beginPath();c.moveTo(a[0]+w*.28,a[1]);c.lineTo(b[0]+w*.28,b[1]);c.moveTo(c1[0]+w*.28,c1[1]);c.lineTo(d[0]+w*.28,d[1]);c.moveTo(b[0],b[1]+w*.28);c.lineTo(d[0],d[1]+w*.28);c.stroke();
    var e=proj(-HW,ytop(ZB),ZB),f2=proj(HW,ytop(ZB),ZB),eb=proj(-HW,0,ZB),fb=proj(HW,0,ZB);c.strokeStyle='rgba(200,205,220,.6)';c.lineWidth=1.4;c.beginPath();c.moveTo(b[0],b[1]);c.lineTo(e[0],e[1]);c.lineTo(eb[0],eb[1]);c.moveTo(d[0],d[1]);c.lineTo(f2[0],f2[1]);c.lineTo(fb[0],fb[1]);c.moveTo(e[0],e[1]);c.lineTo(f2[0],f2[1]);c.stroke()}
  var LED=['InterDars','CHAMPIONS','LIGA','InterDars ⚽','FINAL'];
  function drawBoards(){var a=proj(-24,.95,ZAD),b=proj(24,0,ZAD),h=b[1]-a[1],w=b[0]-a[0],n=14,sw=w/n,i,off=T*18;c.save();c.beginPath();c.rect(0,a[1]-2,W,h+4);c.clip();
    for(i=-1;i<n+1;i++){var x=a[0]+i*sw,cc=['#e8002a','#0a4bd1','#ffc400','#0b0b14','#19b36b'][((i%5)+5)%5];c.fillStyle=cc;c.fillRect(x,a[1],sw+1,h);
      c.fillStyle='rgba(255,255,255,.92)';c.font='900 '+Math.max(7,h*.5)+'px "Baloo 2",Nunito,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(LED[((i%5)+5)%5],x+sw/2,a[1]+h*.52)}
    var g=c.createLinearGradient(0,a[1],0,a[1]+h);g.addColorStop(0,'rgba(255,255,255,.28)');g.addColorStop(.4,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.45)');c.fillStyle=g;c.fillRect(0,a[1],W,h);
    c.fillStyle='rgba(255,255,255,.5)';c.fillRect(((off%W)+W)%W-40,a[1],8,h);c.restore()}
  var MX=[-9,-5.4,5.4,9],MZ=15.8;
  function drawMachines(){for(var i=0;i<4;i++){var b=proj(MX[i],0,MZ),t=proj(MX[i],.62,MZ),k=b[2],on=T<(anim&&sim&&sim.res==='goal'?1:0);
      c.fillStyle='#15161c';c.fillRect(b[0]-.26*k,t[1],.52*k,b[1]-t[1]);c.fillStyle='#2b2d38';c.fillRect(b[0]-.3*k,t[1]-.06*k,.6*k,.1*k);c.fillStyle='#07070b';c.fillRect(b[0]-.07*k,t[1]-.18*k,.14*k,.14*k);
      if(spk.length){c.fillStyle='rgba(255,190,80,.35)';c.beginPath();c.arc(b[0],t[1]-.1*k,.28*k,0,7);c.fill()}}}
  /* uchqunlar: sovuq uchqun uskunasi (cold spark machine / "Sparkular") */
  function emit(){for(var i=0;i<4;i++){for(var n=0;n<2;n++)spk.push({x:MX[i]+(Math.random()-.5)*.1,y:.65,z:MZ,vx:(Math.random()-.5)*(i<2?2.6:-2.6)+(i<2?.7:-.7),vy:6.2+Math.random()*3.6,vz:(Math.random()-.5)*.8,l:1.1+Math.random()*.8,m:1.9,s:1.2,ch:0})}}
  var sparkT=0;
  function updSpark(dt){if(sparkT>0){sparkT-=dt;if(sparkT<2.8)emit()}
    for(var i=spk.length-1;i>=0;i--){var s=spk[i];s.l-=dt;if(s.l<=0){spk.splice(i,1);continue}var pvy=s.vy;s.vy-=7*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;
      if(!s.ch&&pvy>0&&s.vy<=0){for(var q=0;q<3;q++)spk.push({x:s.x,y:s.y,z:s.z,vx:s.vx*.4+(Math.random()-.5)*3.4,vy:(Math.random()-.2)*2.2,vz:(Math.random()-.5)*1.4,l:.5+Math.random()*.6,m:1,s:.8,ch:1});s.l=0}
      if(s.y<0)s.l=0}
    if(spk.length>900)spk.splice(0,spk.length-900)}
  function drawSpark(){if(!spk.length)return;c.globalCompositeOperation='lighter';c.lineCap='round';
    for(var i=0;i<spk.length;i++){var s=spk[i],p=proj(s.x,s.y,s.z),p2=proj(s.x-s.vx*.04,s.y-s.vy*.04,s.z),al=clamp(s.l/(s.m||1),0,1);c.strokeStyle='rgba(255,'+(170+Math.round(al*70))+','+(60+Math.round(al*120))+','+al+')';c.lineWidth=Math.max(.8,s.s*p[2]*.03);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p2[0],p2[1]);c.stroke()}
    c.globalCompositeOperation='source-over'}
  function drawConf(dt){if(!conf.length)return;for(var i=conf.length-1;i>=0;i--){var f=conf[i];f.y+=f.vy*dt;f.x+=Math.sin(T*3+f.p)*30*dt;f.r+=f.vr*dt;if(f.y>H+10){conf.splice(i,1);continue}
      c.save();c.translate(f.x,f.y);c.rotate(f.r);c.fillStyle=f.c;c.fillRect(-3,-1.5,6,3);c.restore()}}
  /* ---- tomoshabinlar ---- */
  function drawCrowd(){var bands=9,rows=crowd.rows,bh=(crowd.base-crowd.top)/bands,i,amp=2.2+ex*9;
    for(i=0;i<bands;i++){var y0=crowd.top+i*bh,ph=T*(5+ex*5)+i*1.3,dy=-Math.abs(Math.sin(ph))*amp*(.4+ex)*(.5+i/bands*.7);
      c.drawImage(crowd,0,Math.round(y0*sc),crowd.width,Math.max(1,Math.round(bh*sc)),0,y0+dy,W,bh)}
    /* bayroqlar */
    for(i=0;i<flags.length;i++){var f=flags[i],w=Math.sin(T*6+f.p)*4*(.5+ex);c.strokeStyle='#ccc';c.lineWidth=1;c.beginPath();c.moveTo(f.x,f.y+14);c.lineTo(f.x,f.y-6);c.stroke();c.fillStyle=f.c;c.beginPath();c.moveTo(f.x,f.y-6);c.lineTo(f.x+11+w,f.y-3);c.lineTo(f.x,f.y);c.fill()}
    /* kamera chaqnashlari */
    var fr=ex>.6?9:role==='s'?4:3;for(i=0;i<fr;i++)if(Math.random()<.4)flash.push({x:Math.random()*W,y:crowd.top+20+Math.random()*(crowd.base-crowd.top-30),l:.12});
    for(i=flash.length-1;i>=0;i--){var s=flash[i];s.l-=.016;if(s.l<=0){flash.splice(i,1);continue}c.fillStyle='rgba(255,255,255,'+(s.l/.12)+')';c.beginPath();c.arc(s.x,s.y,2+s.l*18,0,7);c.fill()}}
  /* ---- kadr ---- */
  function ballAt(tm){var F2=sim.frames,n=F2.length/8,i=tm*60,i0=Math.min(n-1,Math.floor(i)),i1=Math.min(n-1,i0+1),u=i-i0,a=i0*8,b=i1*8;if(u>1)u=1;
    var q=[lerp(F2[a+4],F2[b+4],u),lerp(F2[a+5],F2[b+5],u),lerp(F2[a+6],F2[b+6],u),lerp(F2[a+7],F2[b+7],u)],l=Math.sqrt(q[0]*q[0]+q[1]*q[1]+q[2]*q[2]+q[3]*q[3])||1;
    return{p:[lerp(F2[a+1],F2[b+1],u),lerp(F2[a+2],F2[b+2],u),lerp(F2[a+3],F2[b+3],u)],q:[q[0]/l,q[1]/l,q[2]/l,q[3]/l],v:(i1>i0?h3(F2[b+1]-F2[a+1],F2[b+2]-F2[a+2],F2[b+3]-F2[a+3])*60:0)}}
  var QID=[1,0,0,0],lastQ=QID;
  function update(dt){T+=dt;ex+=(exT-ex)*Math.min(1,dt*2.2);exT+=(.15-exT)*Math.min(1,dt*.5);shake*=Math.pow(.02,dt);updSpark(dt);
    if(anim){anim.t+=dt;for(var i=trig.length-1;i>=0;i--)if(anim.t>=trig[i][0]){var f=trig[i][1];trig.splice(i,1);f()}
      if(anim.t>=anim.end&&cbEnd){var cb=cbEnd;cbEnd=null;busy=false;try{cb()}catch(e){}}}}
  function draw(){c.setTransform(sc,0,0,sc,0,0);c.clearRect(0,0,W,H);
    c.save();if(shake>.05)c.translate((Math.random()-.5)*shake*8,(Math.random()-.5)*shake*8);
    c.drawImage(bg,0,0,W,H);drawCrowd();c.drawImage(gnd,0,gnd.y,W,H-gnd.y,0,gnd.y,W,H-gnd.y);drawBoards();drawMachines();drawSpark();
    var tm=anim?anim.t:0,on=!!(sim&&anim&&sim.net.length),bl,bp=[0,BR,0],bq=lastQ,fast=0;
    if(sim&&anim&&!anim.nk){bl=ballAt(Math.min(tm,sim.dur));bp=bl.p;bq=bl.q;lastQ=bq;fast=bl.v>12?1:0}
    var po=keeperPose(sim&&anim?sim.plan:{dive:false},tm+(anim?0:T));
    if(sim&&anim&&anim.caught){}
    /* soya */
    var sp=proj(bp[0],0,bp[2]),hh=Math.max(0,1-bp[1]/6);c.fillStyle='rgba(0,0,0,'+(.38*hh)+')';c.beginPath();c.ellipse(sp[0],sp[1],sp[2]*BR*1.1,sp[2]*BR*.35,0,0,7);c.fill();
    drawNetBack(tm,on);
    if(bp[2]>ZG+.02)drawBall(bp,bq,0,fast);
    drawNetSide(tm,on);drawPosts();
    if(bp[2]<=ZG+.02&&bp[2]>ZK)drawBall(bp,bq,0,fast);
    drawKeeper(po,F/(ZK-CZ));
    if(bp[2]<=ZK)drawBall(bp,bq,0,fast);
    /* rejalar */
    if(role==='s'&&!anim){var bs=proj(0,BR,0),pu=.5+.5*Math.sin(T*5);c.strokeStyle='rgba(255,197,61,'+(.5+.4*pu)+')';c.lineWidth=2;c.beginPath();c.arc(bs[0],bs[1],bs[2]*BR*1.9+pu*4,0,7);c.stroke()}
    if(trail&&trail.length>1){c.strokeStyle='#FFC53D';c.lineWidth=5;c.lineCap='round';c.lineJoin='round';c.shadowColor='#FFC53D';c.shadowBlur=12;c.beginPath();trail.forEach(function(p,i){i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)});c.stroke();c.shadowBlur=0}
    if(dvp&&!anim){var rp=proj(dvp[0],dvp[1],ZG),rr=22+Math.sin(T*7)*2;c.strokeStyle='#FFC53D';c.lineWidth=3;c.beginPath();c.arc(rp[0],rp[1],rr,0,7);c.moveTo(rp[0]-rr-8,rp[1]);c.lineTo(rp[0]+rr+8,rp[1]);c.moveTo(rp[0],rp[1]-rr-8);c.lineTo(rp[0],rp[1]+rr+8);c.stroke()}
    drawConf(.016);
    if(ban){var bt=T-ban.t0,sk=Math.min(1,bt*5),al=bt>ban.d-.4?clamp((ban.d-bt)/.4,0,1):1;if(bt<ban.d){c.save();c.globalAlpha=al;c.translate(W/2,H*.2);var s=.6+.4*(1-Math.pow(1-sk,3));c.scale(s,s);c.font='900 '+Math.round(H*.12)+'px "Baloo 2",Nunito,sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineWidth=10;c.strokeStyle='rgba(0,0,0,.65)';c.strokeText(ban.t,0,0);c.fillStyle=ban.c;c.fillText(ban.t,0,0);c.restore()}else ban=null}
    c.restore()}
  function frame(now){if(dead)return;raf=requestAnimationFrame(frame);var dt=Math.min(.05,(now-last)/1000||.016);last=now;update(dt);draw()}
  function setBan(t,col,d){ban={t:t,c:col,t0:T,d:d||2.2}}
  /* ---- ochiq metodlar ---- */
  function reset(r){role=r||'v';sim=null;anim=null;trail=null;dvp=null;ban=null;trig=[];cbEnd=null;busy=false;lastQ=QID;exT=.2}
  function play(d,cb){if(dead)return false;unlock();ban=null;trig=[];spk.length=0;conf.length=0;sparkT=0;busy=true;
    if(!d.k){sim={res:'miss',frames:[0,0,BR,0,1,0,0,0],net:[],ev:[],tg:0,tt:0,plan:keeperPlan(null),dur:0};anim={t:0,end:2.4,nk:1};trig.push([.1,function(){setBan('Zarba berilmadi ⏱',' #FF3B5C'.trim(),2)}]);sfx('groan');cbEnd=cb;exT=.4;return true}
    try{sim=simulate(d.k,d.d,d.seed)}catch(e){sim=null;busy=false;return false}
    var end=Math.min(sim.dur,3.6),r=sim.res,pt=d.pt!==undefined?d.pt:sim.pt;anim={t:0,end:Math.max(end,sim.res==='goal'?3.8:2.8)+.4};lastQ=QID;exT=.3;sfx('hush');
    trig.push([.02,function(){sfx('kick');exT=.35}]);
    sim.ev.forEach(function(e){var tt=e.t;trig.push([tt,function(){
      if(e.k==='post'||e.k==='bar'){sfx(e.k);shake=Math.max(shake,.5);setBan(e.k==='post'?'USTUN! 😱':'TO‘SIN! 😱','#FFC53D',1.8);exT=.7}
      else if(e.k==='net'){sfx('net');shake=Math.max(shake,1)}
      else if(e.k==='parry'||e.k==='catch'){sfx(e.k);shake=Math.max(shake,.35)}
      else if(e.k==='bounce'&&e.s>2)sfx('bounce')}])});
    var tR=r==='goal'?sim.tg:r==='save'?sim.tt:Math.min(.9,sim.dur);
    trig.push([tR+.08,function(){if(r==='goal'){setBan(sim.net.length&&pt?'GOL! (ustundan)':'GOL!','#27C99A',3);sfx('goal');exT=1;ex=Math.max(ex,.7);sparkT=3.4;shake=Math.max(shake,1.2);
        for(var i=0;i<150;i++)conf.push({x:Math.random()*W,y:-Math.random()*H*.6,vy:80+Math.random()*120,vr:(Math.random()-.5)*9,r:Math.random()*6,p:Math.random()*6,c:['#ffc53d','#ff3b5c','#27c99a','#4b6bff','#fff'][i%5]})}
      else if(r==='save'){setBan('SEYV! 🧤','#FFC53D',2.4);sfx('groan');exT=.55}
      else{if(!ban)setBan(pt==='post'||pt==='bar'?'URILDI, GOL EMAS':'AUT ❌','#FF3B5C',2.2);sfx('groan');exT=.4}}]);
    cbEnd=cb;return true}
  function pos(e){var r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height,t:performance.now()}}
  function toGoal(x,y){var d=ZG-CZ;return{x:(x-CX)*d/F,y:CY0-(y-CY)*d/F}}
  function onSpot(x,y){var b=proj(0,BR,0),r=b[2]*BR*2.6+22;return h2(x-b[0],y-b[1])<r}
  fit();raf=requestAnimationFrame(frame);
  var onR=function(){if(!dead)fit()};window.addEventListener('resize',onR);
  return{W:function(){return W},H:function(){return H},reset:reset,play:play,pos:pos,toGoal:toGoal,onSpot:onSpot,fit:fit,unlock:unlock,busy:function(){return busy},
    setTrail:function(t){trail=t},setDive:function(u,v){dvp=u==null?null:[(u-.5)*2*HW,v*2.6]},
    banner:function(t,col,d){setBan(t,col,d)},
    destroy:function(){dead=true;cancelAnimationFrame(raf);window.removeEventListener('resize',onR);try{if(ax)ax.close()}catch(e){}ax=null}}}

window.PenaltyStage={v:1,simulate:simulate,resolve:resolve,create:create,_k:{keeperPlan:keeperPlan,keeperPose:keeperPose,launch:launch}};
})();
