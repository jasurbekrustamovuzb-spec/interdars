/* InterDars — Penalti sahnasi. Faqat penalti seriyasi boshlanganda yuklanadi (league.js loadStage orqali).
   window.PenaltyStage = { simulate, resolve, create }.
   Dunyo (metr): x — darvoza bo'ylab, y — yuqoriga, z — penalti nuqtasidan darvoza tomon (darvoza chizig'i z=11). */
(function(){
'use strict';
if(window.PenaltyStage)return;
var PI=Math.PI,HW=3.66,CB=2.44,PR=.06,BR=.11,ZG=11,ZK=10.82,ZB=13.2,ZAD=19,CZ=-5.4,CY0=2.8;
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
    if(inNet){var imp,dg=1-2.4*H;v[0]*=dg;v[2]*=dg;
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
function create(cv,o){o=o||{};var c=cv.getContext('2d'),W=720,H=1200,sc=1,F=1300,CX=360,CY=500,dead=false,raf=0,last=0,T=0,role='v',
  bg=null,crowd=null,ov=null,ovE=null,gnd=null,flags=[],spk=[],conf=[],trig=[],sim=null,anim=null,trail=null,dvp=null,ban=null,shake=0,ex=.15,exT=.15,flash=[],cbEnd=null,ax=null,gain=null,noiseB=null,busy=false,
  hudD=null,zm=1,path=[],rings=[],nf=0,MX=[0,0,0,0],MZ=18.2,BT=0,GYC=0;
  function proj(x,y,z){var d=z-CZ,k=F/d;return[CX+x*k,CY-(y-CY0)*k,k]}
  function snd(){return o.snd?o.snd():true}
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
  /* ---- o'lcham, kamera (portret, darvoza katta) ---- */
  function fit(){var par=cv.parentNode,vh=window.innerHeight||800,vw=window.innerWidth||400,pa=Math.min((par&&par.clientWidth)||vw,o.maxW||640),avH=Math.max(380,vh-(o.pad||130)),ar=clamp(avH/pa,1.2,1.95),pw=Math.min(pa,avH/ar),dpr=Math.min(2,window.devicePixelRatio||1);
    W=720;H=Math.round(W*ar);cv.style.width=pw+'px';cv.style.height=(pw*ar)+'px';cv.width=Math.round(pw*dpr);cv.height=Math.round(pw*ar*dpr);sc=cv.width/W;
    var kg=.76*W/(2*HW),gb=H*.575;CY0=2.8;CY=gb-CY0*kg;var ks=(H*.87-CY)/CY0;F=11/(1/kg-1/ks);CZ=ZG-F/kg;CX=W/2;
    var kM=F/(MZ-CZ);MX=[.085,.335,.665,.915].map(function(f){return(f-.5)*W/kM});GYC=proj(0,1.2,ZG)[1];build()}
  function mk(){var e=document.createElement('canvas');e.width=Math.round(W*sc);e.height=Math.round(H*sc);var x=e.getContext('2d');x.setTransform(sc,0,0,sc,0,0);return{e:e,x:x}}
  function glow(x,y,r,a,col){var g=ov.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,'rgba('+col+','+a+')');g.addColorStop(.35,'rgba('+col+','+a*.3+')');g.addColorStop(1,'rgba('+col+',0)');ov.fillStyle=g;ov.fillRect(x-r,y-r,r*2,r*2)}
  function build(){var r=rng(77),i,j,x,y,top=Math.round(H*.075),bTop=proj(0,.95,ZAD)[1]-3,S=bTop-top;BT=bTop;
    var B=mk(),b=B.x,Cc=mk(),cc=Cc.x,O=mk();ov=O.x;ovE=O.e;
    var g=b.createLinearGradient(0,0,0,bTop);g.addColorStop(0,'#02030a');g.addColorStop(.4,'#0a1130');g.addColorStop(1,'#1c2859');b.fillStyle=g;b.fillRect(0,0,W,H);
    /* tom konstruksiyasi + proyektorlar */
    b.fillStyle='#06080f';b.fillRect(0,0,W,top);b.strokeStyle='rgba(150,172,220,.4)';b.lineWidth=1.6;b.beginPath();b.moveTo(0,top-5);b.lineTo(W,top-5);b.moveTo(0,top*.4);b.lineTo(W,top*.4);
    for(i=0;i<=W;i+=34){b.moveTo(i,top*.4);b.lineTo(i+17,top-5);b.moveTo(i+17,top-5);b.lineTo(i+34,top*.4)}b.stroke();
    b.fillStyle='#0c0f1a';b.fillRect(0,top-5,W,5);
    [[.06,.46,1],[.94,.46,1],[.31,.62,.6],[.69,.62,.6]].forEach(function(l){var lx=W*l[0],ly=top*l[1],pw=118*l[2],ph=52*l[2];b.fillStyle='#10131f';b.strokeStyle='#4b5570';b.lineWidth=2;b.fillRect(lx-pw/2,ly-ph/2,pw,ph);b.strokeRect(lx-pw/2,ly-ph/2,pw,ph);
      b.fillStyle='#fffbe6';for(var q=0;q<2;q++)for(var p=0;p<6;p++){b.beginPath();b.arc(lx-pw/2+10*l[2]+p*(pw-20*l[2])/5,ly-ph*.22+q*ph*.44,5.2*l[2],0,7);b.fill()}
      glow(lx,ly,260*l[2],.62,'255,246,214')});
    /* tribuna: 3 qavat + oyna-konkurslar */
    var TI=[[0,.33,6.2],[.40,.69,8.4],[.76,1,11]],CO=[[.33,.40],[.69,.76]],AI=[.17,.38,.62,.83];
    function aisleAt(xx){for(var k=0;k<AI.length;k++)if(Math.abs(xx-W*AI[k])<9)return true;return false}
    var PL=['#2a7de1','#f4f6ff','#8cc4ff','#ffffff','#1b4fa8'],PR2=['#d8232a','#ffffff','#ff7a7a','#f6c200','#8e1018'],PM=['#222a40','#ffc53d','#27c99a','#ff7ab6','#eee','#4b6bff'],SK=['#f1c9a0','#c98c5c','#8a5a3a','#e8b48a','#5e3b25'],HR=['#15100c','#3a2414','#6b4423','#c9a24a','#222'];
    TI.forEach(function(t){var y0=top+t[0]*S,y1=top+t[1]*S,sz=t[2],rh=sz*2.55,rows=Math.max(3,Math.round((y1-y0)/rh));rh=(y1-y0)/rows;
      for(i=0;i<rows;i++){y=y0+i*rh;b.fillStyle=i%2?'#10172f':'#0b1126';b.fillRect(0,y,W,rh+1);b.fillStyle='rgba(255,255,255,.07)';b.fillRect(0,y+rh-1.5,W,1.5);
        var s2=sz*(.86+i/rows*.28),step=s2*2.75;
        for(x=(i%2)*step*.5+step*.4;x<W;x+=step){if(aisleAt(x)||r()<.05)continue;var fx=x/W,pal=fx<.36?PL:fx>.64?PR2:PM,col=pal[Math.floor(r()*pal.length)],hy=y+rh*.32;
          cc.fillStyle=col;cc.beginPath();cc.ellipse(x,y+rh*1.02,s2*1.08,s2*1.22,0,PI,2*PI);cc.fill();
          cc.fillStyle=SK[Math.floor(r()*SK.length)];cc.beginPath();cc.arc(x,hy,s2*.64,0,7);cc.fill();
          cc.fillStyle=HR[Math.floor(r()*HR.length)];cc.beginPath();cc.arc(x,hy-s2*.06,s2*.66,PI*1.02,PI*1.98);cc.fill();
          if(r()<.1){cc.fillStyle='rgba(255,255,255,.85)';cc.fillRect(x-1.2,hy-s2-2,2.4,2.4)}}}
      AI.forEach(function(a){var ax2=W*a;b.fillStyle='#1a2140';b.fillRect(ax2-9,y0,18,y1-y0);b.strokeStyle='rgba(180,195,230,.25)';b.lineWidth=1;for(var s3=y0;s3<y1;s3+=sz*1.4){b.beginPath();b.moveTo(ax2-9,s3);b.lineTo(ax2+9,s3);b.stroke()}})});
    CO.forEach(function(k){var y0=top+k[0]*S,y1=top+k[1]*S;b.fillStyle='#090d1c';b.fillRect(0,y0,W,y1-y0);b.fillStyle='#2a3254';b.fillRect(0,y0,W,3);b.fillRect(0,y1-3,W,3);
      for(x=6;x<W;x+=46){var wg=b.createLinearGradient(0,y0+6,0,y1-6);wg.addColorStop(0,'rgba(255,224,150,.62)');wg.addColorStop(1,'rgba(255,170,90,.38)');b.fillStyle=wg;b.fillRect(x,y0+7,38,y1-y0-14)}
      b.fillStyle='rgba(8,12,28,.7)';for(x=0;x<W;x+=46)b.fillRect(x+38,y0+4,8,y1-y0-8)});
    /* yoritish: yuqori qorong'i, pastki yorqin */
    var dg=cc.createLinearGradient(0,top,0,bTop);dg.addColorStop(0,'rgba(0,0,12,.55)');dg.addColorStop(.6,'rgba(0,0,12,.12)');dg.addColorStop(1,'rgba(30,20,0,0)');cc.globalCompositeOperation='source-atop';cc.fillStyle=dg;cc.fillRect(0,0,W,H);cc.globalCompositeOperation='source-over';
    b.fillStyle='#070a14';b.fillRect(0,bTop,W,H-bTop);
    crowd=Cc.e;crowd.top=top;crowd.base=bTop;bg=B.e;
    flags=[];for(i=0;i<34;i++)flags.push({x:r()*W,y:top+S*(.05+r()*.9),c:['#2a7de1','#d8232a','#f6c200','#fff','#27c99a'][i%5],p:r()*6});
    /* proyektor nurlari (ustki qatlam) */
    [[.06,.46],[.94,.46],[.31,.62],[.69,.62]].forEach(function(l){glow(W*l[0],top*l[1]+10,300,.28,'255,244,210')});
    var vg=ov.createLinearGradient(0,0,0,H);vg.addColorStop(0,'rgba(0,0,10,.0)');vg.addColorStop(1,'rgba(0,0,10,.0)');
    /* o't maydoni */
    var G=mk(),gc=G.x,gy0=proj(0,0,ZAD)[1];var gr=gc.createLinearGradient(0,gy0,0,H);gr.addColorStop(0,'#0b4a22');gr.addColorStop(.3,'#1b7332');gr.addColorStop(1,'#33a14a');gc.fillStyle=gr;gc.fillRect(0,gy0,W,H-gy0);
    function quad(x0,x1,z0,z1,cl){var a=proj(x0,0,z0),b2=proj(x1,0,z0),c2=proj(x1,0,z1),d2=proj(x0,0,z1);gc.fillStyle=cl;gc.beginPath();gc.moveTo(a[0],a[1]);gc.lineTo(b2[0],b2[1]);gc.lineTo(c2[0],c2[1]);gc.lineTo(d2[0],d2[1]);gc.closePath();gc.fill()}
    for(j=-9;j<8;j++){var z0=Math.max(CZ+.4,ZG+j*5.5),z1=Math.min(ZAD+.5,ZG+(j+1)*5.5);if(z1>z0)quad(-90,90,z0,z1,j%2?'rgba(255,255,255,.1)':'rgba(0,12,0,.16)')}
    var pt=document.createElement('canvas');pt.width=pt.height=96;var px=pt.getContext('2d'),r2=rng(5);for(i=0;i<460;i++){px.strokeStyle='rgba('+(r2()<.5?'255,255,255':'0,0,0')+','+(.05+r2()*.08)+')';px.lineWidth=1;var gx=r2()*96,gyy=r2()*96;px.beginPath();px.moveTo(gx,gyy);px.lineTo(gx+(r2()-.5)*2,gyy-3-r2()*4);px.stroke()}
    gc.globalAlpha=.85;gc.fillStyle=gc.createPattern(pt,'repeat');gc.fillRect(0,gy0+24,W,H-gy0-24);gc.globalAlpha=1;
    function ln(x1,z1,x2,z2,w){z1=Math.max(z1,CZ+.5);z2=Math.max(z2,CZ+.5);var dx=x2-x1,dz=z2-z1,l=h2(dx,dz)||1,nx=-dz/l*w/2,nz=dx/l*w/2,a=proj(x1+nx,0,z1+nz),b2=proj(x1-nx,0,z1-nz),c2=proj(x2-nx,0,z2-nz),d2=proj(x2+nx,0,z2+nz);gc.beginPath();gc.moveTo(a[0],a[1]);gc.lineTo(b2[0],b2[1]);gc.lineTo(c2[0],c2[1]);gc.lineTo(d2[0],d2[1]);gc.closePath();gc.fill()}
    gc.fillStyle='rgba(255,255,255,.93)';ln(-90,ZG,90,ZG,.075);ln(-9.16,ZG-5.5,9.16,ZG-5.5,.075);ln(-9.16,ZG-5.5,-9.16,ZG,.075);ln(9.16,ZG-5.5,9.16,ZG,.075);
    var spn=proj(0,0,0);gc.beginPath();gc.ellipse(spn[0],spn[1],spn[2]*.2,spn[2]*.075,0,0,7);gc.fill();
    var vg2=gc.createRadialGradient(CX,H*.78,40,CX,H*.78,W*.95);vg2.addColorStop(0,'rgba(255,255,200,.1)');vg2.addColorStop(1,'rgba(0,0,0,.45)');gc.fillStyle=vg2;gc.fillRect(0,gy0,W,H-gy0);
    gnd=G.e;gnd.y=gy0}
  /* ---- chizish yordamchilari ---- */
  function J(p){var k=F/(ZK-CZ);return[CX+p[0]*k,CY-(p[1]-CY0)*k]}
  function tube(a,b,r0,r1,col,ol){var dx=b[0]-a[0],dy=b[1]-a[1],l=h2(dx,dy)||1,nx=-dy/l,ny=dx/l;
    for(var ps=0;ps<2;ps++){var e=ps?0:ol;c.fillStyle=ps?col:'#0d1020';c.beginPath();c.moveTo(a[0]+nx*(r0+e),a[1]+ny*(r0+e));c.lineTo(b[0]+nx*(r1+e),b[1]+ny*(r1+e));c.lineTo(b[0]-nx*(r1+e),b[1]-ny*(r1+e));c.lineTo(a[0]-nx*(r0+e),a[1]-ny*(r0+e));c.closePath();c.fill();
      c.beginPath();c.arc(a[0],a[1],r0+e,0,7);c.fill();c.beginPath();c.arc(b[0],b[1],r1+e,0,7);c.fill()}}
  function glove(h,el,k,col){var dx=h[0]-el[0],dy=h[1]-el[1],l=h2(dx,dy)||1,ux=dx/l,uy=dy/l,nx=-uy,ny=ux,R=.165*k,i;
    c.save();c.translate(h[0],h[1]);c.rotate(Math.atan2(uy,ux)-PI/2);
    c.fillStyle='#0d1020';c.beginPath();c.arc(0,0,R+2.2,0,7);c.fill();for(i=-1.5;i<=1.5;i++){c.beginPath();c.ellipse(i*R*.5,-R*.95,R*.27+2.2,R*.5+2.2,0,0,7);c.fill()}
    c.fillStyle='#f4f6ff';c.beginPath();c.arc(0,0,R,0,7);c.fill();for(i=-1.5;i<=1.5;i++){c.beginPath();c.ellipse(i*R*.5,-R*.95,R*.27,R*.5,0,0,7);c.fill()}
    c.fillStyle=col;c.beginPath();c.arc(0,R*.28,R*.62,0,PI);c.fill();c.fillStyle='rgba(0,0,0,.18)';for(i=-1;i<=1;i++){c.fillRect(i*R*.5-.8,-R*1.3,1.6,R*.9)}
    c.fillStyle=col;c.fillRect(-R*.9,R*.62,R*1.8,R*.34);c.restore()}
  function drawKeeper(po,k,look){var P=J(po.P),S=J(po.S),Hd=J(po.Hd),i,u=[Math.sin(po.th),Math.cos(po.th)],pp=[Math.cos(po.th),-Math.sin(po.th)],OL=2.4,JE='#ff3d9a',JD='#c3156f',SH='#2b2f8f',SO='#ff3d9a',BO='#d4ff2e';c.save();
    var gy=J([P[0],0])[1],air=clamp(po.P[1]/1.6,0,1);c.fillStyle='rgba(0,0,0,'+(.4-.18*air)+')';c.beginPath();c.ellipse(J([po.P[0],0])[0],gy+3,.75*k*(1-.2*air),.15*k,0,0,7);c.fill();
    for(i=0;i<2;i++){var hp=J(po.hp[i]),kn=J(po.kn[i]),ft=J(po.ft[i]),dx=ft[0]-kn[0],dy=ft[1]-kn[1],dl=h2(dx,dy)||1,sg=i?1:-1,mid=[lerp(hp[0],kn[0],.62),lerp(hp[1],kn[1],.62)];
      tube(kn,ft,.1*k,.072*k,SO,OL);c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=.045*k;var bp=[lerp(kn[0],ft[0],.42),lerp(kn[1],ft[1],.42)],q=[-dy/dl,dx/dl];c.beginPath();c.moveTo(bp[0]+q[0]*.09*k,bp[1]+q[1]*.09*k);c.lineTo(bp[0]-q[0]*.09*k,bp[1]-q[1]*.09*k);c.stroke();
      tube(hp,mid,.145*k,.12*k,SH,OL);tube(mid,kn,.115*k,.105*k,SH,OL);
      var tx=ft[0]+dx/dl*.17*k+sg*.04*k,ty=ft[1]+dy/dl*.17*k+.03*k;tube(ft,[tx,ty],.082*k,.07*k,BO,OL);c.fillStyle='#14161f';c.beginPath();c.arc(tx,ty,.045*k,0,7);c.fill()}
    /* tana */
    var sh0=J(po.sh[0]),sh1=J(po.sh[1]),wx=.2*k,P0=[P[0]-pp[0]*wx,P[1]+pp[1]*wx],P1=[P[0]+pp[0]*wx,P[1]-pp[1]*wx],S0=[S[0]-pp[0]*.27*k,S[1]+pp[1]*.27*k],S1=[S[0]+pp[0]*.27*k,S[1]-pp[1]*.27*k];
    for(var ps=0;ps<2;ps++){var e=ps?0:OL*1.4;c.fillStyle=ps?JE:'#0d1020';c.beginPath();c.moveTo(S0[0]-e*pp[0],S0[1]+e*pp[1]);c.quadraticCurveTo((S0[0]+P0[0])/2-pp[0]*.05*k-e,(S0[1]+P0[1])/2,P0[0]-e*pp[0],P0[1]+e*pp[1]);c.lineTo(P1[0]+e*pp[0],P1[1]-e*pp[1]);c.quadraticCurveTo((S1[0]+P1[0])/2+pp[0]*.05*k+e,(S1[1]+P1[1])/2,S1[0]+e*pp[0],S1[1]-e*pp[1]);c.closePath();c.fill()}
    c.save();c.beginPath();c.moveTo(S0[0],S0[1]);c.lineTo(P0[0],P0[1]);c.lineTo(P1[0],P1[1]);c.lineTo(S1[0],S1[1]);c.closePath();c.clip();
    var tg=c.createLinearGradient(S0[0],S0[1],S1[0],S1[1]);tg.addColorStop(0,'rgba(255,255,255,.22)');tg.addColorStop(.5,'rgba(255,255,255,0)');tg.addColorStop(1,'rgba(60,0,40,.4)');c.fillStyle=tg;c.fillRect(P[0]-2*k,P[1]-2*k,4*k,4*k);
    c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=.07*k;c.beginPath();var m1=[lerp(S0[0],P0[0],.55),lerp(S0[1],P0[1],.55)],m2=[lerp(S1[0],P1[0],.55),lerp(S1[1],P1[1],.55)];c.moveTo(m1[0],m1[1]);c.lineTo(m2[0],m2[1]);c.stroke();c.restore();
    c.fillStyle='#ffd23a';c.beginPath();c.arc(S0[0]*.35+S1[0]*.65-pp[0]*.0,S0[1]*.35+S1[1]*.65+(P[1]-S[1])*.28,.05*k,0,7);c.fill();
    /* orqa qo'l, bo'yin, oldingi qo'l */
    for(i=0;i<2;i++){var s2=J(po.sh[i]),el=J(po.el[i]),hn=J(po.hn[i]);tube(s2,el,.095*k,.082*k,i?JD:JD,OL);tube(el,hn,.082*k,.07*k,JE,OL)}
    tube(S,[lerp(S[0],Hd[0],.8),lerp(S[1],Hd[1],.8)],.075*k,.07*k,'#e8b48a',OL*.8);
    for(i=0;i<2;i++)glove(J(po.hn[i]),J(po.el[i]),k,'#b6ff2e');
    /* bosh */
    c.save();c.translate(Hd[0],Hd[1]);c.rotate(po.th*.8);var R=.165*k;
    c.fillStyle='#0d1020';c.beginPath();c.arc(0,0,R+OL,0,7);c.fill();c.fillStyle='#e8b48a';c.beginPath();c.arc(0,0,R,0,7);c.fill();
    c.fillStyle='#d99d73';c.beginPath();c.arc(-R*.98,R*.1,R*.2,0,7);c.arc(R*.98,R*.1,R*.2,0,7);c.fill();
    c.fillStyle='#2a1a10';c.beginPath();c.arc(0,-R*.06,R*1.04,PI*1.03,PI*1.97);c.lineTo(R*.78,-R*.28);c.quadraticCurveTo(0,-R*.62,-R*.78,-R*.28);c.closePath();c.fill();
    var ex2=look?clamp(look[0],-1,1)*R*.07:0,ey2=look?clamp(look[1],-1,1)*R*.06:0;
    for(i=-1;i<=1;i+=2){c.fillStyle='#fff';c.beginPath();c.ellipse(i*R*.38,R*.08,R*.2,R*.24,0,0,7);c.fill();c.fillStyle='#1b2540';c.beginPath();c.arc(i*R*.38+ex2,R*.1+ey2,R*.115,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(i*R*.38+ex2-R*.04,R*.04+ey2,R*.04,0,7);c.fill();
      c.strokeStyle='#2a1a10';c.lineWidth=R*.12;c.lineCap='round';c.beginPath();c.moveTo(i*R*.62,-R*.2);c.lineTo(i*R*.18,-R*.1);c.stroke()}
    c.strokeStyle='#8a4b3a';c.lineWidth=R*.1;c.beginPath();c.arc(0,R*.5,R*.2,.15*PI,.85*PI);c.stroke();c.restore();c.restore()}
  function drawBall(bp,q,fast){var pr=proj(bp[0],bp[1],bp[2]),d=bp[2]-CZ,bs=1+.9*clamp((d-6)/10,0,1),r=Math.max(2,pr[2]*BR*bs),x=pr[0],y=pr[1];if(d<.6)return;
    if(fast>.5){c.fillStyle='rgba(255,255,255,.16)';c.beginPath();c.arc(x,y,r*1.55,0,7);c.fill()}
    c.fillStyle='#10131f';c.beginPath();c.arc(x,y,r+1.8,0,7);c.fill();
    c.save();c.beginPath();c.arc(x,y,r,0,7);c.clip();
    var g=c.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r*1.05);g.addColorStop(0,'#fff');g.addColorStop(.7,'#e6e9ef');g.addColorStop(1,'#a3a9b9');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
    if(r>2.5){var i,k;c.fillStyle='#16171d';c.strokeStyle='rgba(40,44,60,.8)';c.lineWidth=Math.max(.6,r*.07);
      for(i=0;i<12;i++){var pa=PATCH[i],cn=qrot(q,pa.n);if(cn[2]>.2)continue;var vs=pa.v.map(function(v){return qrot(q,v)}),es=pa.e.map(function(v){return qrot(q,v)});
        c.beginPath();for(k=0;k<5;k++){var X=x+vs[k][0]*r,Y=y-vs[k][1]*r;k?c.lineTo(X,Y):c.moveTo(X,Y)}c.closePath();c.fill();
        if(r>5)for(k=0;k<5;k++){if(vs[k][2]>.15||es[k][2]>.15)continue;c.beginPath();c.moveTo(x+vs[k][0]*r,y-vs[k][1]*r);c.lineTo(x+es[k][0]*r,y-es[k][1]*r);c.stroke()}}}
    var sh=c.createRadialGradient(x,y,r*.55,x,y,r*1.02);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,20,.42)');c.fillStyle=sh;c.fillRect(x-r,y-r,r*2,r*2);c.restore()}
  /* ---- to'r: aniq ko'rinadigan, urilganda botadi ---- */
  function netOff(x,y,z,tm){var dx=0,dy=0,dz=0;for(var i=0;i<sim.net.length;i++){var m=sim.net[i],dt=tm-m.t;if(dt<0||dt>3)continue;var d2=(x-m.x)*(x-m.x)+(y-m.y)*(y-m.y)+(z-m.z)*(z-m.z),am=m.a*1.05*Math.exp(-dt*2.2)*Math.cos(dt*14)*Math.exp(-d2/2.1);
      if(m.k===0)dz+=am;else if(m.k===1)dx+=am;else if(m.k===2)dx-=am;else dy+=am}
    return[dx,dy,dz]}
  function nv(x,y,z,tm,on){if(on){var d=netOff(x,y,z,tm);x+=d[0];y+=d[1];z+=d[2]}return proj(x,y,z)}
  function netSurf(f,nx,ny,tm,on){c.beginPath();var i,j,p,q;
    for(i=0;i<=nx;i++){for(j=0;j<=ny;j++){p=f(i/nx,j/ny);q=nv(p[0],p[1],p[2],tm,on);j?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1])}}
    for(j=0;j<=ny;j++){for(i=0;i<=nx;i++){p=f(i/nx,j/ny);q=nv(p[0],p[1],p[2],tm,on);i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1])}}c.stroke()}
  function ytop(z){return CB-(z-ZG)/(ZB-ZG)*.44}
  function netStyle(w){c.strokeStyle='rgba(255,255,255,'+(.5+.4*nf)+')';c.lineWidth=w*(1+nf*.4)}
  function drawNetBack(tm,on){var a=proj(-HW,0,ZB),b=proj(HW,ytop(ZB),ZB);c.fillStyle='rgba(0,6,22,.42)';c.fillRect(a[0],b[1],b[0]-a[0],a[1]-b[1]);
    var l=proj(-HW,CB,ZG),r2=proj(HW,CB,ZG),bl=proj(-HW,0,ZG),br=proj(HW,0,ZG);c.fillStyle='rgba(0,6,22,.28)';c.beginPath();c.moveTo(l[0],l[1]);c.lineTo(r2[0],r2[1]);c.lineTo(br[0],br[1]);c.lineTo(bl[0],bl[1]);c.closePath();c.fill();
    netStyle(1.25);netSurf(function(u,v){return[lerp(-HW,HW,u),v*ytop(ZB),ZB]},24,11,tm,on)}
  function drawNetSide(tm,on){netStyle(1.15);
    netSurf(function(u,v){var z=lerp(ZG,ZB,u);return[-HW,v*ytop(z),z]},8,9,tm,on);netSurf(function(u,v){var z=lerp(ZG,ZB,u);return[HW,v*ytop(z),z]},8,9,tm,on);
    netSurf(function(u,v){var z=lerp(ZG,ZB,v);return[lerp(-HW,HW,u),ytop(z),z]},24,8,tm,on)}
  function drawPosts(){var k=F/(ZG-CZ),a=proj(-HW-PR,0,ZG),b=proj(-HW-PR,CB+2*PR,ZG),c1=proj(HW+PR,0,ZG),d=proj(HW+PR,CB+2*PR,ZG),w=Math.max(7,2*PR*k*1.25),e=proj(-HW,ytop(ZB),ZB),f2=proj(HW,ytop(ZB),ZB),eb=proj(-HW,0,ZB),fb=proj(HW,0,ZB);
    c.lineCap='round';c.strokeStyle='rgba(150,160,185,.75)';c.lineWidth=2.4;c.beginPath();c.moveTo(b[0],b[1]);c.lineTo(e[0],e[1]);c.lineTo(eb[0],eb[1]);c.moveTo(d[0],d[1]);c.lineTo(f2[0],f2[1]);c.lineTo(fb[0],fb[1]);c.moveTo(e[0],e[1]);c.lineTo(f2[0],f2[1]);c.stroke();
    c.lineCap='butt';c.strokeStyle='#0d1020';c.lineWidth=w+3.5;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.moveTo(c1[0],c1[1]);c.lineTo(d[0],d[1]);c.moveTo(b[0]-w/2-1.7,b[1]);c.lineTo(d[0]+w/2+1.7,d[1]);c.stroke();
    c.strokeStyle='#fff';c.lineWidth=w;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.moveTo(c1[0],c1[1]);c.lineTo(d[0],d[1]);c.moveTo(b[0]-w/2,b[1]);c.lineTo(d[0]+w/2,d[1]);c.stroke();
    c.strokeStyle='rgba(120,135,170,.7)';c.lineWidth=w*.28;c.beginPath();c.moveTo(a[0]+w*.27,a[1]);c.lineTo(b[0]+w*.27,b[1]);c.moveTo(c1[0]+w*.27,c1[1]);c.lineTo(d[0]+w*.27,d[1]);c.moveTo(b[0],b[1]+w*.27);c.lineTo(d[0],d[1]+w*.27);c.stroke();
    c.fillStyle='rgba(255,255,255,.55)';c.fillRect(a[0]-w*.32,b[1]+w,w*.14,(a[1]-b[1])*.7)}
  var LED=['InterDars','CHAMPIONS','LIGA ⚽','InterDars','FINAL'];
  function drawBoards(){var a=proj(-30,.95,ZAD),b=proj(30,0,ZAD),h=b[1]-a[1],w=b[0]-a[0],n=18,sw=w/n,i,off=T*22;c.save();c.beginPath();c.rect(0,a[1]-3,W,h+6);c.clip();
    for(i=-1;i<n+1;i++){var x=a[0]+i*sw,cc=['#e8002a','#0a4bd1','#ffc400','#10101c','#19b36b'][((i%5)+5)%5];if(x>W+sw||x<-sw*2)continue;c.fillStyle=cc;c.fillRect(x,a[1],sw+1,h);
      c.fillStyle=cc==='#ffc400'?'#111':'rgba(255,255,255,.95)';c.font='900 '+Math.max(9,h*.5)+'px "Baloo 2",Nunito,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(LED[((i%5)+5)%5],x+sw/2,a[1]+h*.54)}
    var g=c.createLinearGradient(0,a[1],0,a[1]+h);g.addColorStop(0,'rgba(255,255,255,.32)');g.addColorStop(.4,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.5)');c.fillStyle=g;c.fillRect(0,a[1],W,h);
    c.fillStyle='rgba(255,255,255,.45)';c.fillRect(((off%W)+W)%W-40,a[1],9,h);c.restore();c.fillStyle='#e9edf8';c.fillRect(0,a[1]-3,W,3)}
  function drawMachines(){var act=spk.length>0;for(var i=0;i<4;i++){var b=proj(MX[i],0,MZ),t=proj(MX[i],.62,MZ),k=b[2];
      if(act){var gg=c.createLinearGradient(0,b[1]-k*6.5,0,b[1]);gg.addColorStop(0,'rgba(255,200,110,0)');gg.addColorStop(.55,'rgba(255,214,140,.2)');gg.addColorStop(1,'rgba(255,240,200,.55)');c.fillStyle=gg;c.fillRect(b[0]-.42*k,b[1]-k*6.5,.84*k,k*6.5)}
      c.fillStyle='#14151c';c.fillRect(b[0]-.3*k,t[1],.6*k,b[1]-t[1]);c.fillStyle='#343746';c.fillRect(b[0]-.36*k,t[1]-.07*k,.72*k,.12*k);c.fillStyle='#07070b';c.fillRect(b[0]-.08*k,t[1]-.2*k,.16*k,.15*k);
      if(act){c.fillStyle='rgba(255,215,130,.55)';c.beginPath();c.arc(b[0],t[1]-.12*k,.34*k,0,7);c.fill()}}}
  /* uchqunlar: cold spark machine (sparkular) */
  function emit(){for(var i=0;i<4;i++){for(var n=0;n<3;n++)spk.push({x:MX[i]+(Math.random()-.5)*.12,y:.65,z:MZ,vx:(Math.random()-.5)*(i<2?2.4:-2.4)+(i<2?.6:-.6),vy:7+Math.random()*3.8,vz:(Math.random()-.5)*.8,l:1.2+Math.random()*.9,m:2,s:1.3,ch:0})}}
  var sparkT=0;
  function updSpark(dt){if(sparkT>0){sparkT-=dt;if(sparkT<2.9)emit()}
    for(var i=spk.length-1;i>=0;i--){var s=spk[i];s.l-=dt;if(s.l<=0){spk.splice(i,1);continue}var pvy=s.vy;s.vy-=7*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;
      if(!s.ch&&pvy>0&&s.vy<=0){for(var q=0;q<3;q++)spk.push({x:s.x,y:s.y,z:s.z,vx:s.vx*.4+(Math.random()-.5)*3.6,vy:(Math.random()-.2)*2.4,vz:(Math.random()-.5)*1.4,l:.5+Math.random()*.7,m:1.1,s:.9,ch:1});s.l=0}
      if(s.y<0)s.l=0}
    if(spk.length>1100)spk.splice(0,spk.length-1100)}
  function drawSpark(){if(!spk.length)return;c.globalCompositeOperation='lighter';c.lineCap='round';
    for(var i=0;i<spk.length;i++){var s=spk[i],p=proj(s.x,s.y,s.z),p2=proj(s.x-s.vx*.05,s.y-s.vy*.05,s.z),al=clamp(s.l/(s.m||1),0,1);c.strokeStyle='rgba(255,'+(175+Math.round(al*70))+','+(70+Math.round(al*130))+','+al+')';c.lineWidth=Math.max(1,s.s*p[2]*.04);c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p2[0],p2[1]);c.stroke()}
    c.globalCompositeOperation='source-over'}
  function drawConf(dt){if(!conf.length)return;for(var i=conf.length-1;i>=0;i--){var f=conf[i];f.y+=f.vy*dt;f.x+=Math.sin(T*3+f.p)*30*dt;f.r+=f.vr*dt;if(f.y>H+10){conf.splice(i,1);continue}
      c.save();c.translate(f.x,f.y);c.rotate(f.r);c.fillStyle=f.c;c.fillRect(-4,-2,8,4);c.restore()}}
  function drawCrowd(){var bands=16,bh=(crowd.base-crowd.top)/bands,i,amp=1.4+ex*8.5;
    for(i=0;i<bands;i++){var y0=crowd.top+i*bh,ph=T*(4.5+ex*5)+i*1.1,dy=-Math.abs(Math.sin(ph))*amp*(.4+ex)*(.5+i/bands*.7);
      c.drawImage(crowd,0,Math.round(y0*sc),crowd.width,Math.max(1,Math.round(bh*sc)),0,y0+dy,W,bh)}
    for(i=0;i<flags.length;i++){var f=flags[i],w=Math.sin(T*6+f.p)*5*(.5+ex);c.strokeStyle='#ccc';c.lineWidth=1.3;c.beginPath();c.moveTo(f.x,f.y+18);c.lineTo(f.x,f.y-8);c.stroke();c.fillStyle=f.c;c.beginPath();c.moveTo(f.x,f.y-8);c.lineTo(f.x+15+w,f.y-4);c.lineTo(f.x,f.y);c.fill()}
    var fr=ex>.6?10:role==='s'?4:3;for(i=0;i<fr;i++)if(Math.random()<.4)flash.push({x:Math.random()*W,y:crowd.top+14+Math.random()*(crowd.base-crowd.top-20),l:.12});
    for(i=flash.length-1;i>=0;i--){var s=flash[i];s.l-=.016;if(s.l<=0){flash.splice(i,1);continue}c.fillStyle='rgba(255,255,255,'+(s.l/.12)+')';c.beginPath();c.arc(s.x,s.y,2.5+s.l*22,0,7);c.fill()}}
  /* ---- hisob paneli (rasmdagidek) ---- */
  function rr(x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  function fitTxt(t,w,px){c.font='900 '+px+'px "Baloo 2",Nunito,sans-serif';while(px>12&&c.measureText(t).width>w){px-=2;c.font='900 '+px+'px "Baloo 2",Nunito,sans-serif'}}
  function ticks(side,cx0,cy,wd){var N=hudD.N||3,rs=side.r||[],n=Math.max(N,rs.length),sd=rs.length>=N&&rs.length>=n,st=Math.min(30,wd/Math.max(n,3)),x0=cx0-(n-1)*st/2,i;
    for(i=0;i<n;i++){var x=x0+i*st,v=rs[i];c.beginPath();c.arc(x,cy,11,0,7);c.fillStyle=v===1?'#2bd06f':v?'#ff3b4e':'#3a3f55';c.fill();c.strokeStyle='#fff';c.lineWidth=2.6;c.lineCap='round';
      if(v===1){c.beginPath();c.moveTo(x-5,cy);c.lineTo(x-1.5,cy+4);c.lineTo(x+5.5,cy-4);c.stroke()}else if(v){c.beginPath();c.moveTo(x-4,cy-4);c.lineTo(x+4,cy+4);c.moveTo(x+4,cy-4);c.lineTo(x-4,cy+4);c.stroke()}}}
  function drawHud(){if(!hudD)return;var w=W*.9,x=(W-w)/2,y=44,h=64,mid=150,sw=(w-mid)/2,L=hudD.l||{},R=hudD.r||{},N=hudD.N||3;c.save();c.textBaseline='middle';
    var tw=130;c.fillStyle='#10131f';rr(W/2-tw/2,y-26,tw,34,10);c.fill();c.fillStyle='#fff';fitTxt(String(hudD.lab||'PENALTI').toUpperCase(),tw-18,20);c.textAlign='center';c.fillText(String(hudD.lab||'PENALTI').toUpperCase(),W/2,y-8);
    c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=14;c.fillStyle='#0b1030';rr(x,y,w,h+74,16);c.fill();c.shadowBlur=0;
    var gl=c.createLinearGradient(x,0,x+sw,0);gl.addColorStop(0,'#2f7df0');gl.addColorStop(1,'#1b3fa8');c.fillStyle=gl;c.beginPath();c.moveTo(x+16,y);c.arcTo(x,y,x,y+16,16);c.lineTo(x,y+h);c.lineTo(x+sw,y+h);c.lineTo(x+sw,y);c.closePath();c.fill();
    var gr2=c.createLinearGradient(x+w-sw,0,x+w,0);gr2.addColorStop(0,'#a4122a');gr2.addColorStop(1,'#e8344a');c.fillStyle=gr2;c.beginPath();c.moveTo(x+w-sw,y);c.lineTo(x+w-16,y);c.arcTo(x+w,y,x+w,y+16,16);c.lineTo(x+w,y+h);c.lineTo(x+w-sw,y+h);c.closePath();c.fill();
    c.fillStyle='#fff';c.fillRect(x+sw,y,mid,h);c.fillStyle='#10131f';c.font='900 50px "Baloo 2",Nunito,sans-serif';c.textAlign='center';c.fillText((L.g|0)+' - '+(R.g|0),W/2,y+h/2+3);
    c.fillStyle='#fff';c.textAlign='left';fitTxt(String(L.n||'').toUpperCase(),sw-26,30);c.fillText(String(L.n||'').toUpperCase(),x+16,y+h/2+2);c.textAlign='right';fitTxt(String(R.n||'').toUpperCase(),sw-26,30);c.fillText(String(R.n||'').toUpperCase(),x+w-16,y+h/2+2);
    var ty=y+h+30;ticks(L,x+sw/2+4,ty,sw-24);ticks(R,x+w-sw/2-4,ty,sw-24);c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=2;c.beginPath();c.moveTo(W/2,y+h+10);c.lineTo(W/2,y+h+64);c.stroke();
    var nl=(L.r||[]).length,sd=Math.max(nl,(R.r||[]).length)>=N;c.fillStyle='#fff';c.textAlign='left';c.font='800 21px "Baloo 2",Nunito,sans-serif';c.fillText(sd?'SUDDEN DEATH':'PENALTI '+Math.min(N,(hudD.k||0)+1)+' / '+N,x+18,y+h+56);c.textAlign='right';c.fillText(hudD.rn?String(hudD.rn).toUpperCase():'',x+w-18,y+h+56);c.restore()}
  /* ---- kadr ---- */
  function ballAt(tm){var F2=sim.frames,n=F2.length/8,i=tm*60,i0=Math.min(n-1,Math.floor(i)),i1=Math.min(n-1,i0+1),u=i-i0,a=i0*8,b=i1*8;if(u>1)u=1;
    var q=[lerp(F2[a+4],F2[b+4],u),lerp(F2[a+5],F2[b+5],u),lerp(F2[a+6],F2[b+6],u),lerp(F2[a+7],F2[b+7],u)],l=Math.sqrt(q[0]*q[0]+q[1]*q[1]+q[2]*q[2]+q[3]*q[3])||1;
    return{p:[lerp(F2[a+1],F2[b+1],u),lerp(F2[a+2],F2[b+2],u),lerp(F2[a+3],F2[b+3],u)],q:[q[0]/l,q[1]/l,q[2]/l,q[3]/l],v:(i1>i0?h3(F2[b+1]-F2[a+1],F2[b+2]-F2[a+2],F2[b+3]-F2[a+3])*60:0)}}
  var QID=[1,0,0,0],lastQ=QID;
  function ring(p,col){rings.push({p:p,c:col,t0:T})}
  function update(dt){T+=dt;ex+=(exT-ex)*Math.min(1,dt*2.2);exT+=(.15-exT)*Math.min(1,dt*.5);shake*=Math.pow(.02,dt);nf*=Math.pow(.25,dt);updSpark(dt);
    var tsc=1,zt=1;if(anim&&!anim.nk&&anim.t>=anim.s0&&anim.t<anim.s1){tsc=.55;zt=1.07}
    zm+=(zt-zm)*Math.min(1,dt*3.5);
    if(anim){anim.t+=dt*tsc;for(var i=trig.length-1;i>=0;i--)if(anim.t>=trig[i][0]){var f=trig[i][1];trig.splice(i,1);f()}
      if(anim.t>=anim.end&&cbEnd){var cb=cbEnd;cbEnd=null;busy=false;try{cb()}catch(e){}}}}
  function drawRings(){for(var i=rings.length-1;i>=0;i--){var g=rings[i],a=T-g.t0;if(a>1.3){rings.splice(i,1);continue}var p=proj(g.p[0],g.p[1],g.p[2]),r=14+a*70,al=1-a/1.3;
      c.strokeStyle=g.c.replace('A',al.toFixed(2));c.lineWidth=4*al+1;c.beginPath();c.arc(p[0],p[1],r,0,7);c.stroke();c.beginPath();c.arc(p[0],p[1],r*.55,0,7);c.stroke()}}
  function drawTrail(){if(path.length<2)return;c.lineCap='round';c.lineJoin='round';var n=path.length,i;
    for(i=1;i<n;i++){var a=path[i-1],b=path[i],u=i/n;c.strokeStyle='rgba(255,255,255,'+(.5*u*u)+')';c.lineWidth=Math.max(1.5,b.r*(.35+1.1*u));c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke()}}
  function draw(){c.setTransform(sc,0,0,sc,0,0);c.clearRect(0,0,W,H);
    c.save();if(shake>.05)c.translate((Math.random()-.5)*shake*9,(Math.random()-.5)*shake*9);
    if(zm>1.001){c.translate(CX,GYC);c.scale(zm,zm);c.translate(-CX,-GYC)}
    c.drawImage(bg,0,0,W,H);drawCrowd();c.drawImage(ovE,0,0,W,H);c.drawImage(gnd,0,gnd.y*sc,gnd.width,gnd.height-gnd.y*sc,0,gnd.y,W,H-gnd.y);drawBoards();drawMachines();drawSpark();
    var tm=anim?anim.t:0,on=!!(sim&&anim&&sim.net.length),bl,bp=[0,BR,0],bq=lastQ,fast=0;
    if(sim&&anim&&!anim.nk){bl=ballAt(Math.min(tm,sim.dur));bp=bl.p;bq=bl.q;lastQ=bq;fast=bl.v>12?1:0;var sp0=proj(bp[0],bp[1],bp[2]);if(!path.length||h2(path[path.length-1].x-sp0[0],path[path.length-1].y-sp0[1])>1.5){path.push({x:sp0[0],y:sp0[1],r:sp0[2]*BR*(1+.9*clamp((bp[2]-CZ-6)/10,0,1))});if(path.length>80)path.shift()}}
    var po=keeperPose(sim&&anim?sim.plan:{dive:false},tm+(anim?0:T)),bs=proj(bp[0],0,bp[2]),hh=Math.max(0,1-bp[1]/6),dd=bp[2]-CZ;
    c.fillStyle='rgba(0,0,0,'+(.4*hh)+')';c.beginPath();c.ellipse(bs[0],bs[1],bs[2]*BR*1.2,bs[2]*BR*.4,0,0,7);c.fill();
    drawNetBack(tm,on);drawTrail();
    if(bp[2]>ZG+.02)drawBall(bp,bq,fast);
    drawNetSide(tm,on);drawPosts();
    if(bp[2]<=ZG+.02&&bp[2]>ZK)drawBall(bp,bq,fast);
    var bpr=proj(bp[0],bp[1],bp[2]),kk=F/(ZK-CZ),kc=J([po.P[0],po.P[1]]);drawKeeper(po,kk*1.12,[(bpr[0]-kc[0])/60,(bpr[1]-kc[1])/60]);
    if(bp[2]<=ZK)drawBall(bp,bq,fast);
    if(role==='s'&&!anim){var pu=.5+.5*Math.sin(T*5),bb=proj(0,BR,0),br=bb[2]*BR*(1+.9*clamp((0-CZ-6)/10,0,1));c.strokeStyle='rgba(255,197,61,'+(.55+.4*pu)+')';c.lineWidth=3;c.beginPath();c.arc(bb[0],bb[1],br*1.7+pu*5,0,7);c.stroke()}
    drawRings();
    if(trail&&trail.length>1){c.strokeStyle='#FFC53D';c.lineWidth=7;c.lineCap='round';c.lineJoin='round';c.shadowColor='#FFC53D';c.shadowBlur=14;c.beginPath();trail.forEach(function(p,i){i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)});c.stroke();c.shadowBlur=0}
    if(dvp&&!anim){var rp=proj(dvp[0],dvp[1],ZG),rr2=34+Math.sin(T*7)*3;c.strokeStyle='#FFC53D';c.lineWidth=4;c.beginPath();c.arc(rp[0],rp[1],rr2,0,7);c.moveTo(rp[0]-rr2-12,rp[1]);c.lineTo(rp[0]+rr2+12,rp[1]);c.moveTo(rp[0],rp[1]-rr2-12);c.lineTo(rp[0],rp[1]+rr2+12);c.stroke()}
    drawConf(.016);c.restore();
    if(ban){var bt=T-ban.t0,sk=Math.min(1,bt*5),al=bt>ban.d-.4?clamp((ban.d-bt)/.4,0,1):1;if(bt<ban.d){c.save();c.globalAlpha=al;c.translate(W/2,H*.33);var s=.6+.4*(1-Math.pow(1-sk,3));c.scale(s,s);var fs=Math.round(W*.17);c.font='900 '+fs+'px "Baloo 2",Nunito,sans-serif';while(fs>30&&c.measureText(ban.t).width>W*.86){fs-=4;c.font='900 '+fs+'px "Baloo 2",Nunito,sans-serif'}
        c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=fs*.16;c.strokeStyle='rgba(10,10,30,.8)';c.strokeText(ban.t,0,0);c.fillStyle=ban.c;c.fillText(ban.t,0,0);c.restore()}else ban=null}
    drawHud()}
  function frame(now){if(dead)return;raf=requestAnimationFrame(frame);var dt=Math.min(.05,(now-last)/1000||.016);last=now;update(dt);draw()}
  function setBan(t,col,d){ban={t:t,c:col,t0:T,d:d||2.2}}
  /* ---- ochiq metodlar ---- */
  function reset(r){role=r||'v';sim=null;anim=null;trail=null;dvp=null;ban=null;trig=[];cbEnd=null;busy=false;lastQ=QID;exT=.2;path=[];rings=[];zm=1}
  function play(d,cb){if(dead)return false;unlock();ban=null;trig=[];spk.length=0;conf.length=0;sparkT=0;busy=true;path=[];rings=[];
    if(!d.k){sim={res:'miss',frames:[0,0,BR,0,1,0,0,0],net:[],ev:[],tg:0,tt:0,plan:keeperPlan(null),dur:0};anim={t:0,end:2.4,nk:1,s0:9,s1:9};trig.push([.1,function(){setBan('Zarba berilmadi ⏱','#FF3B5C',2)}]);sfx('groan');cbEnd=cb;exT=.4;return true}
    try{sim=simulate(d.k,d.d,d.seed)}catch(e){sim=null;busy=false;return false}
    var r=sim.res,pt=d.pt!==undefined?d.pt:sim.pt,tR=r==='goal'?sim.tg:r==='save'?sim.tt:Math.min(.9,sim.dur),n=sim.frames.length/8,s0=99,i;
    for(i=0;i<n;i++){if(sim.frames[i*8+3]>ZG-5){s0=i/60;break}}
    anim={t:0,end:Math.max(Math.min(sim.dur,3.6),r==='goal'?3.4:2.6)+.5,s0:s0,s1:tR+.55};lastQ=QID;exT=.3;sfx('hush');
    trig.push([.02,function(){sfx('kick');exT=.35}]);
    sim.ev.forEach(function(e){var tt=e.t;trig.push([tt,function(){
      if(e.k==='post'||e.k==='bar'){sfx(e.k);shake=Math.max(shake,.5);setBan(e.k==='post'?'USTUN! 😱':'TO‘SIN! 😱','#FFC53D',1.8);exT=.7;ring(ballAt(Math.min(tt,sim.dur)).p,'rgba(255,200,60,A)')}
      else if(e.k==='net'){sfx('net');shake=Math.max(shake,1);nf=1}
      else if(e.k==='parry'||e.k==='catch'){sfx(e.k);shake=Math.max(shake,.35);ring(ballAt(Math.min(tt,sim.dur)).p,'rgba(255,230,120,A)')}
      else if(e.k==='bounce'&&e.s>2)sfx('bounce')}])});
    trig.push([tR+.08,function(){if(r==='goal'){setBan(sim.net.length&&pt?'GOL! (ustundan)':'GOL!','#27C99A',3);sfx('goal');exT=1;ex=Math.max(ex,.7);sparkT=3.4;shake=Math.max(shake,1.2);nf=1;ring(ballAt(Math.min(sim.tg,sim.dur)).p,'rgba(60,255,170,A)');
        for(var i2=0;i2<160;i2++)conf.push({x:Math.random()*W,y:-Math.random()*H*.6,vy:90+Math.random()*130,vr:(Math.random()-.5)*9,r:Math.random()*6,p:Math.random()*6,c:['#ffc53d','#ff3b5c','#27c99a','#4b6bff','#fff'][i2%5]})}
      else if(r==='save'){setBan('SEYV! 🧤','#FFC53D',2.4);sfx('groan');exT=.55}
      else{if(!ban)setBan(pt==='post'||pt==='bar'?'URILDI, GOL EMAS':'AUT ❌','#FF3B5C',2.2);sfx('groan');exT=.4}}]);
    cbEnd=cb;return true}
  function pos(e){var r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height,t:performance.now()}}
  function toGoal(x,y){var d=ZG-CZ;return{x:(x-CX)*d/F,y:CY0-(y-CY)*d/F}}
  function onSpot(x,y){var b=proj(0,BR,0),r=b[2]*BR*2.4+40;return h2(x-b[0],y-b[1])<r}
  fit();raf=requestAnimationFrame(frame);
  var onR=function(){if(!dead)fit()};window.addEventListener('resize',onR);
  return{W:function(){return W},H:function(){return H},reset:reset,play:play,pos:pos,toGoal:toGoal,onSpot:onSpot,fit:fit,unlock:unlock,busy:function(){return busy},
    setTrail:function(t){trail=t},setDive:function(u,v){dvp=u==null?null:[(u-.5)*2*HW,v*2.6]},hud:function(d){hudD=d},
    banner:function(t,col,d){setBan(t,col,d)},
    destroy:function(){dead=true;cancelAnimationFrame(raf);window.removeEventListener('resize',onR);try{if(ax)ax.close()}catch(e){}ax=null}}}

window.PenaltyStage={v:2,simulate:simulate,resolve:resolve,create:create,_k:{keeperPlan:keeperPlan,keeperPose:keeperPose,launch:launch}};
})();
