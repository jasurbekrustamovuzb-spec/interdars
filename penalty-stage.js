/* InterDars \u2014 Penalti sahnasi (3D, Three.js; faqat penalti boshlanganda yuklanadi). Faqat penalti seriyasi boshlanganda yuklanadi (league.js loadStage orqali).
   window.PenaltyStage = { simulate, resolve, create }.
   Dunyo (metr): x \u2014 darvoza bo'ylab, y \u2014 yuqoriga, z \u2014 penalti nuqtasidan darvoza tomon (darvoza chizig'i z=11). */
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
var ARM=1.02,TOR=.64;
function keeperPlan(dv){if(!dv||!(dv[0]>=0))return{dive:false};
  var tx=(clamp(dv[0],0,1)-.5)*2*HW,ty=clamp(dv[1],0,1)*2.6,dx=tx,dy=ty-1.4,d=h2(dx,dy),RM=4.35;
  if(d>RM){tx=dx*RM/d;ty=1.4+dy*RM/d}
  var th=clamp(Math.atan2(tx,Math.max(ty-.5,.35)),-1.45,1.45),u=[Math.sin(th),Math.cos(th)],d0=h2(tx,ty-1.4);
  return{dive:true,tx:tx,ty:ty,th:th,PT:[tx-u[0]*(TOR+ARM),Math.max(.3,ty-u[1]*(TOR+ARM))],Td:.26+.072*d0,t0:.07,lay:Math.abs(th)>.55,jump:.28+.20*ty/2.6}}
function ik2(ax,ay,tx,ty,l1,l2,side){var dx=tx-ax,dy=ty-ay,d=h2(dx,dy)||.001,dd=clamp(d,.05,l1+l2-.001),a=(l1*l1-l2*l2+dd*dd)/(2*dd),h=Math.sqrt(Math.max(0,l1*l1-a*a)),ux=dx/d,uy=dy/d;
  return{j:[ax+ux*a-uy*h*side,ay+uy*a+ux*h*side],e:[ax+ux*dd,ay+uy*dd]}}
function keeperPose(pl,t){var th=0,Px,Py,u,pp,s,e,f,k,hd=[[0,0],[0,0]],ft=[[0,0],[0,0]],bob=Math.sin(t*5.2)*.02,sway=Math.sin(t*2.3)*.05;
  if(!pl.dive){Px=sway;Py=.875+bob;th=sway*.25;u=[Math.sin(th),Math.cos(th)];pp=[Math.cos(th),-Math.sin(th)];
    hd=[[Px-.4+sway,.9+Math.sin(t*3.1)*.02],[Px+.4+sway,.9+Math.sin(t*3.1+1)*.02]];ft=[[Px-.27,0],[Px+.27,0]]}
  else{s=clamp((t-pl.t0)/pl.Td,0,1);e=1-Math.pow(1-s,2.2);f=clamp((t-pl.t0-pl.Td)/.42,0,1);k=clamp(t/pl.t0,0,1);
    th=pl.th*e;if(pl.lay)th=pl.th*(1+.25*f);th=clamp(th,-1.5,1.5);
    u=[Math.sin(th),Math.cos(th)];pp=[Math.cos(th),-Math.sin(th)];
    Px=lerp(0,pl.PT[0],e);Py=lerp(.9-.1*k,pl.PT[1],e)+pl.jump*Math.sin(PI*s)*(pl.lay?.7:1);
    if(f>0){if(pl.lay)Py=lerp(Py,.27,f);else Py=lerp(Py,.9,f*f)}
    var Sx=Px+u[0]*TOR,Sy=Py+u[1]*TOR,rdy=[[Px-.4,.9],[Px+.4,.9]];
    for(var i=0;i<2;i++){var sg=i?1:-1,fin=[Sx+u[0]*ARM+pp[0]*.12*sg,Sy+u[1]*ARM+pp[1]*.12*sg];hd[i]=[lerp(rdy[i][0],fin[0],e),lerp(rdy[i][1],fin[1],e)];
      var fs=[Px+pp[0]*.12*sg*2-u[0]*.92+(pl.lay?0:0),Py+pp[1]*.12*sg*2-u[1]*.92];if(!pl.lay)fs[1]=Math.max(fs[1],0);if(pl.lay&&f>0)fs[1]=Math.max(.05,fs[1]);
      ft[i]=[lerp(Px+(i?.27:-.27),fs[0],e),lerp(0,fs[1],e)]}}
  var S=[Px+u[0]*TOR,Py+u[1]*TOR],Hd=[Px+u[0]*(TOR+.27),Py+u[1]*(TOR+.27)],o={P:[Px,Py],S:S,Hd:Hd,th:th,sh:[],el:[],hn:[],hp:[],kn:[],ft:[]};
  for(var j=0;j<2;j++){var sd=j?1:-1,shd=[S[0]+pp[0]*.17*sd,S[1]+pp[1]*.17*sd],hip=[Px+pp[0]*.1*sd,Py+pp[1]*.1*sd],a1=ik2(shd[0],shd[1],hd[j][0],hd[j][1],.42,.44,sd),l1=ik2(hip[0],hip[1],ft[j][0],ft[j][1],.46,.46,sd);
    o.sh.push(shd);o.el.push(a1.j);o.hn.push(a1.e);o.hp.push(hip);o.kn.push(l1.j);o.ft.push(l1.e)}
  return o}
function segs(o){var r=[[o.P[0],o.P[1],o.S[0],o.S[1],.32,0,'body'],[o.S[0],o.S[1],o.Hd[0],o.Hd[1],.18,0,'head']];
  for(var j=0;j<2;j++){r.push([o.sh[j][0],o.sh[j][1],o.el[j][0],o.el[j][1],.12,1,'arm'],[o.el[j][0],o.el[j][1],o.hn[j][0],o.hn[j][1],.13,1,'arm'],[o.hn[j][0],o.hn[j][1],o.hn[j][0],o.hn[j][1],.28,2+j,'glove'],[o.hp[j][0],o.hp[j][1],o.kn[j][0],o.kn[j][1],.12,0,'leg'],[o.kn[j][0],o.kn[j][1],o.ft[j][0],o.ft[j][1],.1,0,'leg'])}
  return r}
function segHit(px,py,pz,sg){var ax=sg[0],ay=sg[1],bx=sg[2],by=sg[3],dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy,u=L>1e-9?clamp(((px-ax)*dx+(py-ay)*dy)/L,0,1):0,cx=ax+dx*u,cy=ay+dy*u,dz=Math.max(0,Math.abs(pz-ZK)-.12),d=h3(px-cx,py-cy,dz);
  return d<sg[4]+BR?{cx:cx,cy:cy,d:d}:null}

/* ---- asosiy simulyatsiya (deterministik; tashkilotchi va o'yinchilarda bir xil natija) ---- */
function simulate(shot,dive,seed){var rnd=rng(seed||1),Lc=launch(shot),v=Lc.v,w=Lc.w,p=[0,BR,0],q=[1,0,0,0],plan=keeperPlan(dive),H=1/240,t=0,F=[],ev=[],net=[],res='miss',pt='',touched=false,crossed=false,inNet=false,caught=null,rest=0,a=[0,0,0],n=0,tg=0,tt=0,first={};
  function evt(k,x,o2){var e={t:t,k:k,s:x||0};if(o2){e.part=o2.part;e.x=o2.x;e.y=o2.y;e.z=o2.z}ev.push(e)}
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
          if(vn<0){v[0]-=1.6*vn*nx;v[2]-=1.6*vn*nz;v[0]*=.92;v[2]*=.92;w[0]*=.5;w[1]=-w[1]*.4;if(!pt)pt='post';evt('post',-vn,{part:'post',x:p[0],y:p[1],z:p[2]})}
          p[0]=ps[pi]+nx*(PR+BR+.001);p[2]=ZG+nz*(PR+BR+.001)}}
      if(Math.abs(p[0])<=HW+PR+.02){var dy=p[1]-(CB+PR);dz=p[2]-ZG;d=h2(dy,dz);
        if(d<PR+BR){var ny=dy/(d||1);nz=dz/(d||1);vn=v[1]*ny+v[2]*nz;
          if(vn<0){v[1]-=1.6*vn*ny;v[2]-=1.6*vn*nz;v[1]*=.95;v[2]*=.92;w[0]*=-.5;if(!pt)pt='bar';evt('bar',-vn,{part:'bar',x:p[0],y:p[1],z:p[2]})}
          p[1]=CB+PR+ny*(PR+BR+.001);p[2]=ZG+nz*(PR+BR+.001)}}}
    /* darvozabon */
    if(!touched&&!crossed&&p[2]>ZK-.7&&p[2]<ZG+.25){var po2=keeperPose(plan,t),sl=segs(po2),si,best=null,bs=null;
      for(si=0;si<sl.length;si++){var hh2=segHit(p[0],p[1],p[2],sl[si]);if(hh2&&(!best||hh2.d<best.d)){best=hh2;bs=sl[si]}}
      if(best){touched=true;tt=t;res='save';var nx2=p[0]-best.cx,ny2=p[1]-best.cy,nz2=p[2]-ZK,nl=h3(nx2,ny2,nz2)||1;nx2/=nl;ny2/=nl;nz2/=nl;
        if(nz2>-.35){nz2=-.35;var l2=h3(nx2,ny2,nz2);nx2/=l2;ny2/=l2;nz2/=l2}
        var spd=h3(v[0],v[1],v[2]),hand=bs[5]>=1;
        if(bs[5]>=2&&spd<20.5&&rnd()<.46){caught={t:t,h:bs[5]-2};evt('catch',spd,{part:bs[6],x:p[0],y:p[1],z:p[2]})}
        else{var vn2=v[0]*nx2+v[1]*ny2+v[2]*nz2;v[0]-=1.38*vn2*nx2;v[1]-=1.38*vn2*ny2;v[2]-=1.38*vn2*nz2;
          var kf=hand?.62:.45;v[0]=v[0]*kf+(rnd()-.5)*3+(p[0]>po2.P[0]?1:-1)*rnd()*1.5;v[1]=v[1]*kf+1+rnd()*2.4;v[2]=Math.min(v[2]*kf,-1.8-rnd()*2.4);
          w[0]*=-.5;w[1]*=-.5;w[2]=(rnd()-.5)*30;evt('parry',spd,{part:bs[6],x:p[0],y:p[1],z:p[2]})}}}
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

/* ================= 3D SAHNA (Three.js) ================= */
var SMOOTH=function(a,b,x){x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x)};
function create(cv,o){o=o||{};var TH=window.THREE;if(!TH)throw new Error('three');
var W=720,H=1200,sc=1,dead=false,raf=0,last=0,T=0,role='v',sim=null,anim=null,trail=null,dvp=null,ban=null,shake=0,ex=.15,exT=.15,cbEnd=null,busy=false,hudD=null,hudDirty=true,conf=[],rings=[],nf=0,trig=[],path=[],focus=null,react=null,cap=null,hf=32,RU=1.0,BP=[0,BR,0],lastQ=[1,0,0,0],sparkT=0,tscNow=1;
var rd=new TH.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'low-power'});
rd.outputEncoding=TH.sRGBEncoding;rd.toneMapping=TH.ACESFilmicToneMapping;rd.toneMappingExposure=1.08;rd.shadowMap.enabled=false;rd.setClearColor(0x05070f,1);
var scene=new TH.Scene(),cam=new TH.PerspectiveCamera(40,.6,.1,400);scene.fog=new TH.Fog(0x080c1c,70,150);
var V3=function(x,y,z){return new TH.Vector3(x,y,z)},CP=V3(0,3,-11),CL=V3(0,1.25,ZG);
function unlock(){} function sfx(){}
/* ---- yordamchilar ---- */
function cvt(w,h,fn,rep,enc){var e=document.createElement('canvas');e.width=w;e.height=h;fn(e.getContext('2d'),w,h);var t=new TH.CanvasTexture(e);t.anisotropy=Math.min(8,rd.capabilities.getMaxAnisotropy());if(rep){t.wrapS=t.wrapT=TH.RepeatWrapping}if(enc!==false)t.encoding=TH.sRGBEncoding;return t}
var UP=V3(0,1,0),_a=V3(),_b=V3(),_c=V3();
var CYL=new TH.CylinderGeometry(1,1,1,14,1),SPH=new TH.SphereGeometry(1,20,14),BOX=new TH.BoxGeometry(1,1,1);
function mesh(g,m,sh){var x=new TH.Mesh(g,m);if(sh!==false){x.castShadow=true;x.receiveShadow=true}scene.add(x);return x}
var RS=1;function limb(m,a,b,rx,rz){_a.set(a[0],a[1],a[2]);_b.set(b[0],b[1],b[2]);_c.subVectors(_b,_a);var l=_c.length()||.001;m.position.addVectors(_a,_b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(UP,_c.multiplyScalar(1/l));m.scale.set(rx*RS,l,(rz==null?rx:rz)*RS)}
function ball3(m,p,r,sx,sy,sz){m.position.set(p[0],p[1],p[2]);m.scale.set((sx||r)*RS,(sy||r)*RS,(sz||r)*RS)}
function mat(col,r,mt,em){return new TH.MeshStandardMaterial({color:new TH.Color(col).convertSRGBToLinear(),roughness:r==null?.6:r,metalness:mt||0,emissive:new TH.Color(em||0).convertSRGBToLinear()})}
function glowTex(){return cvt(128,128,function(g,w,h){var r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.45)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128)},false)}
var GT=glowTex();

/* ---- yoritish ---- */
scene.add(new TH.HemisphereLight(0xaec4ff,0x1b3b1e,.78));
var sun=new TH.DirectionalLight(0xfff1d6,1.55);sun.position.set(-13,30,-6);sun.target.position.set(0,0,5);scene.add(sun,sun.target);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);var sh=sun.shadow.camera;sh.left=-14;sh.right=14;sh.top=14;sh.bottom=-14;sh.near=5;sh.far=70;sun.shadow.bias=-.0006;sun.shadow.normalBias=.02;
var fill=new TH.DirectionalLight(0x9fb8ff,.35);fill.position.set(10,14,-18);scene.add(fill);

/* ---- maydon ---- */
function grassTex(){return cvt(128,128,function(g,w,h){g.fillStyle='#319044';g.fillRect(0,0,w,h);for(var i=0;i<8;i++){g.fillStyle=i%2?'rgba(225,255,210,.035)':'rgba(0,35,10,.035)';g.fillRect(0,i*h/8,w,h/8)}},true)}
var gt=grassTex();gt.repeat.set(26,18);
var pitch=new TH.Mesh(new TH.PlaneGeometry(104,72),new TH.MeshStandardMaterial({map:gt,roughness:.95,color:0xffffff}));pitch.rotation.x=-PI/2;pitch.position.set(0,0,18);pitch.receiveShadow=true;scene.add(pitch);
for(var si=0;si<14;si++){var z0=-19+si*5.5,dark=si%2===0;var st=new TH.Mesh(new TH.PlaneGeometry(104,5.5),new TH.MeshBasicMaterial({color:dark?0x03160a:0xcff5a0,transparent:true,opacity:dark?.2:.09,depthWrite:false}));st.rotation.x=-PI/2;st.position.set(0,.004,z0+2.75);st.renderOrder=1;scene.add(st)}
var lineT=cvt(1760,880,function(g,w,h){var k=40,X=function(x){return(x+22)*k},Z=function(z){return(12-z)*k};g.strokeStyle='#fff';g.fillStyle='#fff';g.lineWidth=5;g.lineCap='square';
  function L(x1,z1,x2,z2){g.beginPath();g.moveTo(X(x1),Z(z1));g.lineTo(X(x2),Z(z2));g.stroke()}
  L(-22,ZG,22,ZG);L(-20.16,ZG,-20.16,ZG-16.5);L(20.16,ZG,20.16,ZG-16.5);L(-20.16,ZG-16.5,20.16,ZG-16.5);L(-9.16,ZG,-9.16,ZG-5.5);L(9.16,ZG,9.16,ZG-5.5);L(-9.16,ZG-5.5,9.16,ZG-5.5);
  g.beginPath();for(var a=PI+.645,f=1;a<=2*PI-.645+1e-6;a+=.02){var ax2=9.15*Math.cos(a),az=9.15*Math.sin(a);f?g.moveTo(X(ax2),Z(az)):g.lineTo(X(ax2),Z(az));f=0}g.stroke();g.beginPath();g.arc(X(0),Z(0),.13*k,0,7);g.fill()},false);
lineT.encoding=TH.sRGBEncoding;lineT.anisotropy=8;
var lp=new TH.Mesh(new TH.PlaneGeometry(44,22),new TH.MeshBasicMaterial({map:lineT,transparent:true,opacity:.9,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));lp.rotation.x=-PI/2;lp.position.set(0,.007,1);lp.renderOrder=2;scene.add(lp);
/* arc faqat jarima maydonidan tashqarida: ustiga yopish */
var lineT2=null;
/* penalti nuqtasi belgisi (qora kosa) */
(function(){var sp=new TH.Mesh(new TH.CircleGeometry(.14,16),new TH.MeshBasicMaterial({color:0xffffff}));sp.rotation.x=-PI/2;sp.position.set(0,.008,0);scene.add(sp)})();

/* ---- darvoza ---- */
var gm=new TH.MeshStandardMaterial({color:0xffffff,roughness:.3,metalness:.15,emissive:0x303844}),gm2=new TH.MeshStandardMaterial({color:0xb9c1d0,roughness:.35,metalness:.5,emissive:0x1a1d24});
function ytop(z){return CB-(z-ZG)/(ZB-ZG)*.44}
function tb(a,b,r,m){var x=mesh(CYL,m||gm2);limb(x,a,b,r,r);return x}
tb([-HW-PR,0,ZG],[-HW-PR,CB+2*PR,ZG],PR,gm);tb([HW+PR,0,ZG],[HW+PR,CB+2*PR,ZG],PR,gm);tb([-HW-PR,CB+PR,ZG],[HW+PR,CB+PR,ZG],PR,gm);
[-1,1].forEach(function(s){var xx=s*HW;tb([xx,CB+PR,ZG],[xx,ytop(ZB),ZB],.028);tb([xx,ytop(ZB),ZB],[xx,0,ZB],.028);tb([xx,0,ZB],[xx,0,ZG],.025);tb([xx,CB,ZG+.2],[xx,ytop(ZB),ZB],.02)});
tb([-HW,ytop(ZB),ZB],[HW,ytop(ZB),ZB],.028);tb([-HW,0,ZB],[HW,0,ZB],.025);
/* post/to'sin ostidagi to'q chiziq (sharpa) va yer ostidagi taglik */
var netTex=cvt(64,64,function(g,w,h){g.fillStyle='rgba(0,10,30,.16)';g.fillRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=3;g.beginPath();g.moveTo(0,0);g.lineTo(w,h);g.moveTo(w,0);g.lineTo(0,h);g.stroke();g.strokeStyle='rgba(230,235,245,.5)';g.lineWidth=1;g.strokeRect(0,0,w,h)},true);
var netMat=new TH.MeshBasicMaterial({map:netTex,transparent:true,side:TH.DoubleSide,depthWrite:false,opacity:.92});
var panels=[];
function Panel(nx,ny,fn,rx,ry){var n=(nx+1)*(ny+1),rest=new Float32Array(n*3),pos=new Float32Array(n*3),prev=new Float32Array(n*3),uv=new Float32Array(n*2),pin=new Uint8Array(n),idx=[],i,j,k;
  for(j=0;j<=ny;j++)for(i=0;i<=nx;i++){k=j*(nx+1)+i;var p=fn(i/nx,j/ny);rest.set(p,k*3);pos.set(p,k*3);prev.set(p,k*3);uv[k*2]=i/nx*rx;uv[k*2+1]=j/ny*ry;pin[k]=(i===0||j===0||i===nx||j===ny)?1:0}
  for(j=0;j<ny;j++)for(i=0;i<nx;i++){k=j*(nx+1)+i;idx.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1)}
  var g=new TH.BufferGeometry();g.setAttribute('position',new TH.BufferAttribute(pos,3));g.setAttribute('uv',new TH.BufferAttribute(uv,2));g.setIndex(idx);var m=new TH.Mesh(g,netMat);m.frustumCulled=false;m.renderOrder=5;scene.add(m);
  var sp=[];for(j=0;j<=ny;j++)for(i=0;i<=nx;i++){k=j*(nx+1)+i;if(i<nx)sp.push([k,k+1,Math.hypot(rest[k*3]-rest[k*3+3],rest[k*3+1]-rest[k*3+4],rest[k*3+2]-rest[k*3+5])]);if(j<ny){var k2=k+nx+1;sp.push([k,k2,Math.hypot(rest[k*3]-rest[k2*3],rest[k*3+1]-rest[k2*3+1],rest[k*3+2]-rest[k2*3+2])])}}
  var P={n:n,rest:rest,pos:pos,prev:prev,pin:pin,sp:sp,g:g,act:0};panels.push(P);return P}
Panel(26,12,function(u,v){return[lerp(-HW,HW,u),v*ytop(ZB),ZB]},7.32/.13,ytop(ZB)/.13);
Panel(10,10,function(u,v){var z=lerp(ZG,ZB,u);return[-HW,v*ytop(z),z]},2.2/.13,2.2/.13);
Panel(10,10,function(u,v){var z=lerp(ZG,ZB,u);return[HW,v*ytop(z),z]},2.2/.13,2.2/.13);
Panel(26,10,function(u,v){var z=lerp(ZG,ZB,v);return[lerp(-HW,HW,u),ytop(z),z]},7.32/.13,2.2/.13);
function netImpulse(){}
function netStep(){}

/* ================= O'YINCHILAR ================= */
function ik3(a,b,l1,l2,pl){var dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],d=Math.sqrt(dx*dx+dy*dy+dz*dz)||1e-4,dd=clamp(d,.05,l1+l2-.002),ux=dx/d,uy=dy/d,uz=dz/d,x=(l1*l1-l2*l2+dd*dd)/(2*dd),h=Math.sqrt(Math.max(0,l1*l1-x*x)),
  pd=pl[0]*ux+pl[1]*uy+pl[2]*uz,wx=pl[0]-pd*ux,wy=pl[1]-pd*uy,wz=pl[2]-pd*uz,wl=Math.sqrt(wx*wx+wy*wy+wz*wz)||1;
  return{j:[a[0]+ux*x+wx/wl*h,a[1]+uy*x+wy/wl*h,a[2]+uz*x+wz/wl*h],e:[a[0]+ux*dd,a[1]+uy*dd,a[2]+uz*dd]}}
function headTex(k){return cvt(256,128,function(g,w,h){g.fillStyle=k.skinC;g.fillRect(0,0,w,h);g.fillStyle=k.hairC;
  if(k.face){g.fillRect(0,0,w,h*.33);g.fillRect(w*.75-52,h*.3,104,h*.07);var cx=w*.75;g.fillStyle='#fff';[-15,15].forEach(function(d){g.beginPath();g.ellipse(cx+d,h*.55,8,6,0,0,7);g.fill()});g.fillStyle='#2a1a10';[-15,15].forEach(function(d){g.beginPath();g.arc(cx+d,h*.55,3.6,0,7);g.fill()});
    g.strokeStyle=k.hairC;g.lineWidth=3.5;g.beginPath();g.moveTo(cx-24,h*.43);g.lineTo(cx-8,h*.45);g.moveTo(cx+24,h*.43);g.lineTo(cx+8,h*.45);g.stroke();g.strokeStyle='#8a4b3a';g.lineWidth=2.6;g.beginPath();g.arc(cx,h*.7,9,.15*PI,.85*PI);g.stroke();g.fillStyle='rgba(180,100,80,.35)';g.beginPath();g.ellipse(cx,h*.62,4,6,0,0,7);g.fill();if(k.stubble){var sg=g.createRadialGradient(cx,h*.8,2,cx,h*.8,36);sg.addColorStop(0,'rgba(35,24,18,.55)');sg.addColorStop(1,'rgba(35,24,18,0)');g.fillStyle=sg;g.fillRect(cx-40,h*.55,80,h*.45);g.fillStyle='rgba(35,24,18,.45)';g.fillRect(cx-9,h*.66,18,3)}}
  else{g.fillRect(0,0,w,h*.44);g.fillRect(w*.52,0,w*.48,h*.86);g.fillRect(0,h*.3,w*.12,h*.2)}},false,true)}
var TPC={};
function TP(r0,r1,bl){var key=r0+'_'+r1+'_'+bl;if(TPC[key])return TPC[key];var m=(r0+r1)/2*(1+(bl||0)),pr=[[0,0],[.012,r0*.62],[.04,r0*.96],[.5,m],[.96,r1*.97],[.988,r1*.62],[1,0]].map(function(p){return new TH.Vector2(p[1],p[0])});var gg=new TH.LatheGeometry(pr,18);gg.translate(0,-.5,0);return TPC[key]=gg}
var TORSO=(function(){var pr=[[0,0],[.01,.5],[.06,.8],[.22,.72],[.42,.74],[.62,.92],[.82,1],[.94,.8],[.99,.5],[1,0]].map(function(p){return new TH.Vector2(p[1],p[0])});var gg=new TH.LatheGeometry(pr,24);gg.translate(0,-.5,0);return gg})();
function jerseyTex(k){return cvt(256,128,function(g,w,h){g.fillStyle=k.jc;g.fillRect(0,0,w,h);for(var i=0;i<1400;i++){g.fillStyle='rgba('+(Math.random()<.5?'255,255,255':'0,0,0')+','+Math.random()*.06+')';g.fillRect(Math.random()*w,Math.random()*h,2,2)}
  if(k.pat==='gk'){g.fillStyle='rgba(0,70,30,.28)';for(var x=-h;x<w+h;x+=34){g.beginPath();g.moveTo(x,0);g.lineTo(x+16,0);g.lineTo(x+16-h*.5,h);g.lineTo(x-h*.5,h);g.fill()}}
  else{g.fillStyle='rgba(20,30,80,.9)';g.fillRect(0,h*.9,w,h*.1);g.fillStyle='rgba(180,40,60,.9)';g.fillRect(0,h*.86,w,h*.03)}
  g.fillStyle='rgba(20,30,80,.10)';[0,.5].forEach(function(u){g.fillRect(w*(u-.035),h*.12,w*.07,h*.78)});if(k.hero){var vg=g.createLinearGradient(0,0,0,h);vg.addColorStop(0,'rgba(255,255,255,.07)');vg.addColorStop(.55,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.08)');g.fillStyle=vg;g.fillRect(0,0,w,h)}
  g.fillStyle=k.trimC||'rgba(0,0,0,.25)';g.fillRect(0,0,w,h*.05)},true)}
/* ---- v4: realistik material va teksturalar (keshlanadi) ---- */
var TXC={};
function tx(key,w,h,fn,rep,enc){return TXC[key]||(TXC[key]=cvt(w,h,fn,rep,enc))}
function fabricBump(){return tx('fb',256,128,function(g,w,h){g.fillStyle='#808080';g.fillRect(0,0,w,h);var r=rng(7),i,y,x;
  for(y=0;y<h;y+=2){g.fillStyle='rgba(255,255,255,.10)';g.fillRect(0,y,w,1)}
  for(x=0;x<w;x+=2){g.fillStyle='rgba(0,0,0,.07)';g.fillRect(x,0,1,h)}
  for(i=0;i<16;i++){var x0=r()*w,y0=r()*h*.8,ln=h*(.25+r()*.45),a=.16+r()*.14,gr=g.createLinearGradient(x0-9,0,x0+9,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.5,r()<.5?'rgba(255,255,255,'+a+')':'rgba(0,0,0,'+a+')');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x0-9,y0,18,ln)}},true,false)}
function poreBump(){return tx('pb',128,128,function(g,w,h){g.fillStyle='#808080';g.fillRect(0,0,w,h);var r=rng(11),i;for(i=0;i<1400;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.18)':'rgba(0,0,0,.18)';g.fillRect(r()*w,r()*h,1.5,1.5)}},true,false)}
function skinTex(c){return tx('sk'+c,128,128,function(g,w,h){g.fillStyle=c;g.fillRect(0,0,w,h);var r=rng(c.charCodeAt(2)*31+c.charCodeAt(4)),i;
  for(i=0;i<260;i++){g.fillStyle=r()<.5?'rgba(255,225,200,'+(.03+r()*.05)+')':'rgba(120,50,30,'+(.03+r()*.05)+')';g.beginPath();g.arc(r()*w,r()*h,3+r()*9,0,7);g.fill()}
  for(i=0;i<700;i++){g.fillStyle='rgba(60,25,15,'+(.05+r()*.08)+')';g.fillRect(r()*w,r()*h,1,1)}},true)}
function hairTex(c){return tx('hr'+c,128,128,function(g,w,h){g.fillStyle=c;g.fillRect(0,0,w,h);var r=rng(5),i;
  for(i=0;i<240;i++){var x=r()*w,l=h*(.4+r()*.6);g.strokeStyle=r()<.5?'rgba(255,235,210,'+(.05+r()*.09)+')':'rgba(0,0,0,'+(.12+r()*.16)+')';g.lineWidth=1+r()*1.5;g.beginPath();g.moveTo(x,0);g.lineTo(x+(r()-.5)*6,l);g.stroke()}},true)}
function hairBump(){return tx('hb',128,128,function(g,w,h){g.fillStyle='#808080';g.fillRect(0,0,w,h);var r=rng(9),i;for(i=0;i<260;i++){var x=r()*w;g.strokeStyle=r()<.5?'rgba(255,255,255,.35)':'rgba(0,0,0,.35)';g.lineWidth=1+r()*1.2;g.beginPath();g.moveTo(x,0);g.lineTo(x+(r()-.5)*5,h*(.4+r()*.6));g.stroke()}},true,false)}
function skinMat(k){return new TH.MeshStandardMaterial({color:new TH.Color(k.skin).convertSRGBToLinear(),roughness:.6,metalness:0,emissive:new TH.Color(k.skin).convertSRGBToLinear().multiplyScalar(.14)})}
function hairMat(k){return new TH.MeshStandardMaterial({color:new TH.Color(k.hairHex||0x1a120c).convertSRGBToLinear().multiplyScalar(1.5),roughness:.5,metalness:0})}
var HCAP=new TH.SphereGeometry(1,22,12,0,6.2832,0,1.72);
function Hand(gl,sg,big,skm){var g=new TH.Group(),s=big?1.3:1,m=gl?mat(0xf4f6ff,.5):(skm||mat(sg,.55)),acc=gl?mat(0x20c25c,.5):m,ad=function(geo,mm,x,y,z,sx,sy,sz,rz){var q=new TH.Mesh(geo,mm);q.position.set(x,y,z);q.scale.set(sx,sy,sz);q.rotation.z=rz||0;q.castShadow=true;g.add(q);return q};
  ad(SPH,m,0,.05*s,0,.04*s,.055*s,.018*s);ad(SPH,acc,0,.05*s,.014*s*(gl?1:0),.03*s,.04*s,.006*s*(gl?1:0));
  [[-.027,.042],[-.009,.052],[.009,.05],[.027,.038]].forEach(function(f,i){var sp=(i-1.5)*(gl?.2:.07);ad(CYL,m,f[0]*s*(1+(gl?.5:0)),.1*s+f[1]*s/2+(gl?.006:0),0,.0105*s,f[1]*s*.5*2/2*1.0,.0105*s,sp);if(gl)ad(SPH,acc,f[0]*s*1.5,.1*s+f[1]*s+.004,0,.011*s,.008*s,.011*s,sp)});
  ad(CYL,m,.042*s,.07*s,0,.012*s,.032*s,.012*s,-.8);scene.add(g);return g}
function orient(g,p,q,fz){var y=V3(q[0]-p[0],q[1]-p[1],q[2]-p[2]).normalize(),z=V3(0,0,fz),d=z.dot(y);z.addScaledVector(y,-d);if(z.lengthSq()<1e-4)z.set(1,0,0);z.normalize();var x=V3().crossVectors(y,z);g.quaternion.setFromRotationMatrix(new TH.Matrix4().makeBasis(x,y,z))}
function Boot(bc,dir,hero){var g=new TH.Group(),m=hero?new TH.MeshPhysicalMaterial({color:new TH.Color(bc).convertSRGBToLinear(),roughness:.32,metalness:.1,clearcoat:.7,clearcoatRoughness:.25}):mat(bc,.3,.25),so=mat(0x15171d,.6),wh=mat(0xf4f4f6,.5),ad=function(geo,mm,x,y,z,sx,sy,sz,rx){var q=new TH.Mesh(geo,mm);q.position.set(x,y,z*dir);q.scale.set(sx,sy,sz);if(rx)q.rotation.x=rx*dir;q.castShadow=true;g.add(q)};
  ad(SPH,m,0,.062,.03,.05,.055,.075);ad(SPH,m,0,.048,.115,.05,.042,.1);ad(SPH,m,0,.036,.185,.046,.032,.07);ad(BOX,so,0,.006,.09,.085,.012,.27);
  if(hero){ad(SPH,so,0,.097,.012,.044,.03,.05);ad(BOX,wh,0,.077,.105,.03,.006,.09,-.25);
    [-1,1].forEach(function(sd){ad(BOX,wh,sd*.047,.052,.08,.004,.022,.08);[.015,.1,.18].forEach(function(zz){ad(CYL,so,sd*.03,.002,zz,.007,.012,.007)})})}
  scene.add(g);return g}
function Rig(k,dir){var R={},hero=!!k.hero,fz=dir,m=function(c,r,mt){return mat(c,r==null?.6:r,mt||0)},jm=new TH.MeshStandardMaterial({map:jerseyTex(k),roughness:.74,metalness:0}),sl=m(k.sleeve||k.jersey,.74),mh=m(k.shorts,.7),mk=m(k.socks,.78),tm=m(k.trim||0x22283a,.65),
    msk=hero?skinMat(k):m(k.skin,.55),mhr=hero?hairMat(k):m(k.hairHex||0x1a120c,.55),i;
  
  var hm=new TH.MeshStandardMaterial({map:headTex(k),roughness:.55});
  R.torso=mesh(TORSO,jm);R.pelv=mesh(SPH,mh);R.neck=mesh(CYL,msk);R.collar=mesh(new TH.TorusGeometry(1,.16,8,18),tm);R.collar.rotation.x=PI/2;
  R.tr=[mesh(CYL,sl),mesh(CYL,sl)];R.band=hero?mesh(CYL,tm):null;
  var hg=new TH.Group();scene.add(hg);R.hg=hg;function hp_(geo,mm,x,y,z,sx,sy,sz,rx,rz){var q=new TH.Mesh(geo,mm);q.position.set(x,y,z);q.scale.set(sx,sy,sz);if(rx)q.rotation.x=rx;if(rz)q.rotation.z=rz;q.castShadow=true;hg.add(q);return q}
  /* bosh: bosh suyagi, jag', iyak, yonoq, burun, quloq, qosh usti (old tomon = fz) */
  hp_(SPH,hm,0,0,0,.098,.118,.105);
  hp_(SPH,msk,0,-.07,fz*.024,.072,.066,.08);hp_(SPH,msk,0,-.108,fz*.05,.034,.026,.034);
  hp_(SPH,msk,0,-.012,fz*.104,.016,.026,.022);
  [-1,1].forEach(function(sd){hp_(SPH,msk,sd*.1,-.025,-fz*.004,.014,.032,.02,0,sd*.12);if(hero)hp_(SPH,msk,sd*.052,-.045,fz*.05,.034,.038,.04)});
  if(hero)hp_(SPH,msk,0,.027,fz*.094,.074,.013,.022);
  /* soch: qatlamli \u2014 qalpoq + hajm + chakka + ensa (kallaga yopishgan shlem emas) */
  var hc=new TH.Mesh(HCAP,mhr);hc.position.set(0,.016,-fz*.008);hc.scale.set(.106,.122,.114);hc.rotation.x=-fz*(hero?(k.face?.45:.2):.1);hc.castShadow=true;hg.add(hc);
  hp_(SPH,mhr,0,.078,-fz*.012,.09,.045,.098);
  if(hero)hp_(SPH,mhr,0,-.04,-fz*.08,.07,.05,.034);
  if(k.face){hp_(SPH,mhr,0,.088,fz*.05,.075,.03,.05,fz*.32);if(hero)[-1,1].forEach(function(sd){hp_(SPH,mhr,sd*.093,-.01,fz*.02,.011,.04,.02)})}
  R.ua=[];R.fa=[];R.sj=[];R.ej=[];R.hd=[];R.th=[];R.th2=[];R.kj=[];R.sn=[];R.bt=[];R.cf=[];R.us=[];R.cu=[];R.hem=[];R.sr=[];R.ak=[];
  for(i=0;i<2;i++){R.sj.push(mesh(SPH,sl));R.ua.push(mesh(TP(.06,.05,.12),sl));R.us.push(k.longSleeve?null:mesh(TP(.048,.041,.1),msk));R.fa.push(mesh(TP(.049,.037,.18),k.longSleeve?sl:msk));R.ej.push(mesh(SPH,k.longSleeve?sl:msk));R.hd.push(Hand(!!k.glove,k.skin,!!k.glove,hero?msk:null));R.cf.push(k.glove?mesh(TP(.046,.05,0),m(k.cuff||0x20c25c,.5)):null);
    R.th.push(mesh(TP(.114,.1,.03),mh));R.th2.push(mesh(TP(.092,.07,hero?.1:0),msk));R.kj.push(mesh(SPH,msk));R.sn.push(mesh(TP(.07,.044,.3),mk));R.bt.push(Boot(k.boot,dir,hero));
    R.cu.push(hero&&!k.longSleeve?mesh(CYL,tm):null);R.hem.push(hero?mesh(CYL,tm):null);R.sr.push(hero?mesh(CYL,tm):null);R.ak.push(hero?mesh(SPH,mk):null)}
  if(k.num){R.num=new TH.Mesh(new TH.PlaneGeometry(.3,.34),new TH.MeshBasicMaterial({map:cvt(256,256,function(g,w,h){g.font='900 200px Arial Black,Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.lineWidth=10;g.strokeStyle='rgba(212,170,70,.9)';g.strokeText(k.num,w/2,h/2+12);g.fillStyle=k.numC||'#1a1a1a';g.fillText(k.num,w/2,h/2+12)},false),transparent:true,depthWrite:false}));R.num.rotation.y=PI;R.num.renderOrder=3;scene.add(R.num)}
  if(k.crest){R.crest=new TH.Mesh(new TH.CircleGeometry(.035,16),new TH.MeshBasicMaterial({color:0xf2c14e}));R.crest.renderOrder=3;scene.add(R.crest)}
  var P=function(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]},AK=.085;
  R.update=function(p){var tw=p.tw||0,hw=p.hw||0;
    limb(R.torso,p.pel,p.sho,.215,.125);R.torso.scale.set(.215*RS,R.torso.scale.y,.125*RS);R.torso.rotateY(tw);
    ball3(R.pelv,[p.pel[0],p.pel[1]-.03,p.pel[2]],0,.172,.1,.115);R.pelv.rotation.y=hw;
    if(R.band){R.band.position.set(p.pel[0],p.pel[1]+.012,p.pel[2]);R.band.scale.set(.178*RS,.03*RS,.122*RS);R.band.rotation.y=hw*.5}
    limb(R.neck,[p.sho[0],p.sho[1]+.03,p.sho[2]],[p.head[0],p.head[1]-.09,p.head[2]],.062,.058);R.collar.position.set(p.sho[0],p.sho[1]+.022,p.sho[2]);R.collar.scale.set(.082*RS,.07*RS,.076*RS);R.collar.rotation.z=tw;
    hg.position.set(p.head[0],p.head[1],p.head[2]);hg.rotation.z=p.hr||0;hg.scale.set(RS,RS,RS);
    for(var j=0;j<2;j++){ball3(R.sj[j],p.sh[j],0,.07,.074,.066);limb(R.tr[j],[p.sho[0],p.sho[1]+.038,p.sho[2]],[p.sh[j][0],p.sh[j][1]+.012,p.sh[j][2]],.046,.07);var ua=R.ua[j],e=p.el[j];
      if(R.us[j]){var md=P(p.sh[j],e,.5);limb(ua,p.sh[j],md,1,1);ua.scale.set(1,ua.scale.y,1);limb(R.us[j],md,e,1,1);if(R.cu[j])limb(R.cu[j],P(p.sh[j],e,.45),P(p.sh[j],e,.5),.054,.054)}else{limb(ua,p.sh[j],e,1,1)}
      ball3(R.ej[j],e,.05);limb(R.fa[j],e,p.hn[j],1,1);var hd=R.hd[j];hd.position.set(p.hn[j][0],p.hn[j][1],p.hn[j][2]);orient(hd,e,p.hn[j],k.glove?-1:dir);hd.scale.set(j?-RS:RS,RS,RS);
      if(R.cf[j])limb(R.cf[j],P(e,p.hn[j],.74),P(e,p.hn[j],1),1,1);
      var md2=P(p.hp[j],p.kn[j],.6),an=[p.ft[j][0],p.ft[j][1]+AK,p.ft[j][2]],sk=P(p.kn[j],an,.14);
      limb(R.th[j],p.hp[j],md2,1,1);limb(R.th2[j],md2,p.kn[j],1,1);ball3(R.kj[j],p.kn[j],.07);limb(R.sn[j],sk,an,1,1);
      if(R.hem[j])limb(R.hem[j],P(p.hp[j],p.kn[j],.55),P(p.hp[j],p.kn[j],.6),.1,.1);
      if(R.sr[j])limb(R.sr[j],P(sk,an,.02),P(sk,an,.1),.071,.071);
      if(R.ak[j])ball3(R.ak[j],an,.046);
      var bt=R.bt[j];bt.position.set(p.ft[j][0],p.ft[j][1],p.ft[j][2]);bt.rotation.set(dir*clamp((p.ft[j][1]/RS)*1.15,0,1.15),0,0);bt.scale.set(RS,RS,RS)}
    if(R.num){R.num.position.set((p.pel[0]+p.sho[0])/2,(p.pel[1]*.35+p.sho[1]*.65),(p.pel[2]+p.sho[2])/2-.13*RS);R.num.rotation.y=PI+tw;R.num.scale.set(RS,RS,1)}
    if(R.crest){R.crest.rotation.y=dir<0?PI:0;R.crest.position.set((p.pel[0]+p.sho[0])/2-.085,(p.pel[1]*.28+p.sho[1]*.72),(p.pel[2]+p.sho[2])/2+dir*.128*RS);R.crest.scale.set(RS,RS,1)}};
  var U0=R.update;R.update=function(p){RS=k.sc||1;try{U0(p)}finally{RS=1}};
  return R}
var KS={skin:0xe0a982,skinC:'#e0a982',hairC:'#2a1a10',face:true};
var _kn0=scene.children.length;var keeper=Rig({hero:true,sc:1.1,jc:'#1fb857',pat:'gk',trimC:'rgba(10,40,25,.7)',crest:true,hairHex:0x1c130d,jersey:0x20c25c,sleeve:0x20c25c,shorts:0x0f1418,socks:0x20c25c,skin:0xe6bb9c,skinC:'#e6bb9c',hairC:'#241810',boot:0xd4ff2e,glove:0xf4f6ff,cuff:0x20c25c,longSleeve:true,face:true,stubble:true},-1);
var _kobjs=scene.children.slice(_kn0);var shooter=Rig({hero:true,jc:'#eef1f8',trimC:'rgba(20,30,80,.8)',hairHex:0x120d0a,jersey:0xf3f5fb,sleeve:0xf3f5fb,shorts:0xf3f5fb,socks:0xf3f5fb,skin:0xc99466,skinC:'#c99466',hairC:'#15100c',boot:0xd8b04a,num:'10',numC:'#16213a',face:false},1);
function P3(a){return[-a[0],a[1],a[2]]}
function ik3p(a,b,l1,l2,pl){return ik3(a,b,l1,l2,pl)}
/* darvozabon: 2D skelet -> 3D (x ko'zgusi) */
var KF=1.1;function PK(a){a=P3(a);return[a[0]*KF,a[1]*KF,ZK+(a[2]-ZK)*KF]}
function keeperRender(po){var z=ZK,zf=-.1,j;var p={pel:[po.P[0],po.P[1],z],sho:[po.S[0],po.S[1],z-.05],head:[po.Hd[0],po.Hd[1],z-.08],hr:po.th*.28,sh:[],el:[],hn:[],hp:[],kn:[],ft:[]};
  for(var j=0;j<2;j++){p.sh.push([po.sh[j][0],po.sh[j][1],z-.05]);p.el.push([po.el[j][0],po.el[j][1],z-.07]);p.hn.push([po.hn[j][0],po.hn[j][1],z+zf]);p.hp.push([po.hp[j][0],po.hp[j][1],z]);p.kn.push([po.kn[j][0],po.kn[j][1],z-.1]);p.ft.push([po.ft[j][0],po.ft[j][1],z])}
  for(j=0;j<2;j++){var sd=j?1:-1;p.el[j]=ik3(p.sh[j],p.hn[j],.36,.38,[sd*.5,-1,-.35]).j}
  var hx=po.Hd[0]-po.S[0],hy=po.Hd[1]-po.S[1],hL=Math.hypot(hx,hy)||1,bx=hx/hL*.62,by=hy/hL*.62+.38,bL=Math.hypot(bx,by)||1;p.head=[p.sho[0]+bx/bL*hL*.86,p.sho[1]+by/bL*hL*.86,z-.08];
  var q={pel:PK(p.pel),sho:PK(p.sho),head:PK(p.head),hr:-p.hr,sh:p.sh.map(PK),el:p.el.map(PK),hn:p.hn.map(PK),hp:p.hp.map(PK),kn:p.kn.map(PK),ft:p.ft.map(PK)};return q}
/* zarba beruvchi: kinematik animatsiya (phys koordinatalarida, keyin ko'zgu) */
var SA=[-1.5,-3.3],SB=[-.4,-.66],SC=[-.16,.34],MV=(function(){var dx=SB[0]-SA[0],dz=SB[1]-SA[1],l=Math.hypot(dx,dz);return[dx/l,dz/l]})();
function shooterPose(t,rc,idle){var run,x,z,u,e,i;
  if(t<0){u=clamp((t+RU)/RU,0,1);e=.65*u+.35*u*(2-u);x=lerp(SA[0],SB[0],e);z=lerp(SA[1],SB[1],e)}else{u=clamp(t/.6,0,1);e=1-Math.pow(1-u,2);x=lerp(SB[0],SC[0],e);z=lerp(SB[1],SC[1],e)}
  run=idle?0:t<0?1-SMOOTH(-.34,-.06,t):0;var ph=idle?0:t*13.6,pw=SMOOTH(-.34,-.1,t)*(t<0?1:1-SMOOTH(.3,.7,t));
  var by=.93+.03*Math.abs(Math.sin(ph))*run-.035*pw+(t>0?.07*Math.sin(PI*clamp(t/.55,0,1)):0);
  var rw=rc?SMOOTH(0,.35,rc.t):0,jmp=rc&&rc.k==='goal'?Math.abs(Math.sin(rc.t*7))*.28*SMOOTH(.1,.4,rc.t)*(1-SMOOTH(1.7,2.1,rc.t)):0;by+=jmp;
  var pel=[x,by,z],lean=t<0?.1*run-.07*SMOOTH(-.16,-.05,t)*(1-run):0;if(t>=0)lean=-.07+.2*SMOOTH(0,.3,t);if(rc&&rc.k!=='goal')lean=lerp(lean,.12,rw);
  var sho=[x-.04*pw,by+.55,z+lean],head=[sho[0],sho[1]+.228,sho[2]+.025+lean*.2];
  var gait=function(s){var p=ph+(s>0?0:PI);return[x+s*.1+MV[0]*Math.sin(p)*.44*(.4+.6*run),Math.max(0,Math.cos(p))*.26*run,z+MV[1]*Math.sin(p)*.44*(.4+.6*run)]};
  var gL=gait(-1),gR=gait(1),fL,fR,plantL=[-.31,0,-.06],bsw=[.05,.4,-.98],con=[.02,.14,-.22],fol=[.12,.92,.86],lnd=[SC[0]+.14,0,SC[1]+.45];
  function mix(a,b,w){return[lerp(a[0],b[0],w),lerp(a[1],b[1],w),lerp(a[2],b[2],w)]}
  if(t<-.34)fL=gL;else if(t<.5)fL=mix(gL,plantL,SMOOTH(-.34,-.1,t));else fL=mix(plantL,[SC[0]-.12,0,SC[1]],SMOOTH(.5,1.1,t));
  if(t<-.42)fR=gR;else if(t<-.12)fR=mix(gR,bsw,SMOOTH(-.42,-.12,t));else if(t<0){var q=(t+.12)/.12;fR=mix(bsw,con,q*q)}else if(t<.22)fR=mix(con,fol,1-Math.pow(1-t/.22,2));else if(t<.6)fR=mix(fol,lnd,SMOOTH(.22,.6,t));else fR=[lnd[0],0,lnd[2]];
  if(t>=.6){var wk=SMOOTH(.6,1.4,t);fR=[lnd[0],0,lnd[2]]}
  var hp=[[x-.1,by-.02,z],[x+.1,by-.02,z]],ft=[fL,fR],kn=[],sh=[[sho[0]-.19,sho[1]-.04,sho[2]],[sho[0]+.19,sho[1]-.04,sho[2]]],hn=[],el=[];
  var tws=Math.sin(ph)*.2*run,hk=Math.sin(ph)*.25*run;sh[0][2]+=.19*tws;sh[1][2]-=.19*tws;hp[0][2]-=.1*hk;hp[1][2]+=.1*hk;
  var sw=-Math.sin(ph)*.3*run,aw=SMOOTH(-.3,-.06,t)*(1-SMOOTH(.15,.6,t));
  var hL=[sh[0][0]-.12-.35*aw,sh[0][1]-.5+.3*aw,sh[0][2]+.1-sw+.35*aw],hR=[sh[1][0]+.12+.4*aw,sh[1][1]-.5+.3*aw,sh[1][2]+.02+sw-.35*aw];
  if(rc){var up=rc.k==='goal';var tL=up?[sh[0][0]-.28,sho[1]+.62,sho[2]+.1]:[head[0]-.1,head[1]+.02,head[2]+.05],tR=up?[sh[1][0]+.28,sho[1]+.62,sho[2]+.1]:[head[0]+.1,head[1]+.02,head[2]+.05];hL=mix(hL,tL,rw);hR=mix(hR,tR,rw)}
  hn=[hL,hR];
  for(i=0;i<2;i++){var s=i?1:-1,lg=ik3(hp[i],ft[i],.46,.46,[s*.2,0,1]);kn.push(lg.j);ft[i]=lg.e;var ar=ik3(sh[i],hn[i],.31,.3,[s*.5,-1,-.35]);el.push(ar.j);hn[i]=ar.e}
  return{pel:pel,sho:sho,head:head,hr:0,sh:sh,el:el,hn:hn,hp:hp,kn:kn,ft:ft,tw:tws,hw:-hk}}
function shooterRender(p){var q={tw:-(p.tw||0),hw:-(p.hw||0),pel:P3(p.pel),sho:P3(p.sho),head:P3(p.head),hr:p.hr,sh:p.sh.map(P3),el:p.el.map(P3),hn:p.hn.map(P3),hp:p.hp.map(P3),kn:p.kn.map(P3),ft:p.ft.map(P3)};return q}
/* chekka xodimlari: qo'riqchilar va fotograflar */
var staff=[];
(function(){var vest=function(){return Rig({jc:'#d9f52a',pat:'gk',jersey:0xe8ff2a,sleeve:0x1b2030,shorts:0x1b2030,socks:0x1b2030,skin:0xd9a47c,skinC:'#d9a47c',hairC:'#2a1a10',boot:0x111111,face:true,longSleeve:true},-1)};
  [[-14,20.9],[-5,20.9],[6,20.9],[15,20.9],[-9.5,20.9],[10.5,20.9]].forEach(function(s,i){var R=vest(),x=s[0],z=s[1],py=.95;var p={pel:[x,py,z],sho:[x,py+.55,z],head:[x,py+.83,z],hr:0,sh:[[x-.19,py+.5,z],[x+.19,py+.5,z]],hp:[[x-.1,py-.02,z],[x+.1,py-.02,z]],ft:[[x-.2,0,z],[x+.2,0,z]],kn:[],el:[],hn:[]};
    for(var j=0;j<2;j++){var sd=j?1:-1;p.kn.push(ik3(p.hp[j],p.ft[j],.46,.46,[0,0,-1]).j);var hh=[x+sd*.28,py+.05,z-.12];var a=ik3(p.sh[j],hh,.31,.3,[sd*.6,-.4,.5]);p.el.push(a.j);p.hn.push(a.e)}
    R.update(shooterRenderRaw(p));staff.push(R)});
  /* fotograflar (cho'kkalab) */
  [[-6.3,19.7],[7.2,19.7],[-12,19.6]].forEach(function(s){var R=Rig({jc:'#1a1d28',jersey:0x1a1d28,sleeve:0x1a1d28,shorts:0x14161e,socks:0x14161e,skin:0xc99466,skinC:'#c99466',hairC:'#15100c',boot:0x111111,face:true,longSleeve:true},-1),x=s[0],z=s[1],py=.55;
    var p={pel:[x,py,z],sho:[x,py+.52,z-.1],head:[x,py+.8,z-.16],hr:0,sh:[[x-.19,py+.47,z-.1],[x+.19,py+.47,z-.1]],hp:[[x-.1,py,z],[x+.1,py,z]],ft:[[x-.2,0,z-.3],[x+.2,0,z+.1]],kn:[],el:[],hn:[]};
    for(var j=0;j<2;j++){var sd=j?1:-1;p.kn.push(ik3(p.hp[j],p.ft[j],.46,.46,[0,.3,-1]).j);var hh=[x+sd*.1,py+.78,z-.42];var a=ik3(p.sh[j],hh,.31,.3,[sd*.6,-.5,.2]);p.el.push(a.j);p.hn.push(a.e)}
    R.update(shooterRenderRaw(p));staff.push(R);var cm=mesh(BOX,mat(0x15171f,.5));cm.scale.set(.2,.14,.16);cm.position.set(-x,py+.78,z-.5);var ln=mesh(CYL,mat(0x050608,.3));ln.scale.set(.06,.22,.06);ln.rotation.x=PI/2;ln.position.set(-x,py+.78,z-.66)})})();
function shooterRenderRaw(p){return shooterRender(p)}
/* ================= TO'P ================= */
var ico=new TH.IcosahedronGeometry(1,0),icoP=ico.attributes.position,icoV=[],icoF=[],seen={};
(function(){for(var i=0;i<icoP.count;i++){var k=[icoP.getX(i),icoP.getY(i),icoP.getZ(i)].map(function(v){return v.toFixed(3)}).join();if(!seen[k]){seen[k]=1;icoV.push(V3(icoP.getX(i),icoP.getY(i),icoP.getZ(i)).normalize())}}
  for(i=0;i<icoP.count;i+=3){icoF.push(V3(icoP.getX(i)+icoP.getX(i+1)+icoP.getX(i+2),icoP.getY(i)+icoP.getY(i+1)+icoP.getY(i+2),icoP.getZ(i)+icoP.getZ(i+1)+icoP.getZ(i+2)).normalize())}})();
var ballMat=new TH.ShaderMaterial({uniforms:{uV:{value:icoV},uF:{value:icoF},uL:{value:V3(-.45,.8,-.4).normalize()}},
  vertexShader:'varying vec3 vO;varying vec3 vN;void main(){vO=normalize(position);vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 uV[12];uniform vec3 uF[20];uniform vec3 uL;varying vec3 vO;varying vec3 vN;void main(){vec3 d=normalize(vO);float pv=-1.;for(int i=0;i<12;i++)pv=max(pv,dot(d,uV[i]));float f1=-1.,f2=-1.;for(int i=0;i<20;i++){float t=dot(d,uF[i]);if(t>f1){f2=f1;f1=t;}else if(t>f2)f2=t;}'+
  'float pent=smoothstep(.935,.945,pv);float seam=1.-smoothstep(.0,.012,f1-f2);vec3 base=vec3(.95,.96,.98);base=mix(base,vec3(.55,.58,.66),seam*.55*(1.-pent));base=mix(base,vec3(.06,.07,.09),pent);'+
  'vec3 n=normalize(vN);float df=.42+.58*max(dot(n,uL),0.);float rim=pow(1.-max(n.z*-1.,0.),3.)*.05;vec3 col=base*df+rim;col+=pow(max(dot(reflect(-uL,n),vec3(0.,0.,-1.)),0.),24.)*.25;gl_FragColor=vec4(col,1.);}'});
var ballM=new TH.Mesh(new TH.SphereGeometry(BR,32,24),ballMat);ballM.castShadow=true;scene.add(ballM);
/* to'p izi */
var TN=48,tP=new Float32Array(TN*3),tC=new Float32Array(TN*3),tG=new TH.BufferGeometry();tG.setAttribute('position',new TH.BufferAttribute(tP,3));tG.setAttribute('color',new TH.BufferAttribute(tC,3));
var tL=new TH.Line(tG,new TH.LineBasicMaterial({vertexColors:true,transparent:true,blending:TH.AdditiveBlending,depthWrite:false}));tL.frustumCulled=false;scene.add(tL);var tHist=[];
function updTrail(bp,spd,on){if(on&&spd>8){tHist.push([-bp[0],bp[1],bp[2]]);if(tHist.length>TN)tHist.shift()}else if(tHist.length)tHist.shift();
  for(var i=0;i<TN;i++){var h=tHist[Math.max(0,tHist.length-TN+i)]||tHist[tHist.length-1];if(!h||i<TN-tHist.length){tP[i*3]=tP[i*3+1]=tP[i*3+2]=0;tP[i*3+1]=-50;tC[i*3]=tC[i*3+1]=tC[i*3+2]=0;continue}var u=(i-(TN-tHist.length))/Math.max(1,tHist.length-1);tP[i*3]=h[0];tP[i*3+1]=h[1];tP[i*3+2]=h[2];var a=.45*u*u;tC[i*3]=tC[i*3+1]=tC[i*3+2]=a}
  tG.attributes.position.needsUpdate=true;tG.attributes.color.needsUpdate=true}

/* ================= OVERLAY (HUD, yozuvlar, iz) ================= */
var ovc=document.createElement('canvas'),c=ovc.getContext('2d'),ovT=new TH.CanvasTexture(ovc);ovT.minFilter=TH.LinearFilter;ovT.generateMipmaps=false;ovT.encoding=TH.sRGBEncoding;
var ovS=new TH.Scene(),ovC=new TH.OrthographicCamera(-1,1,1,-1,0,1),ovMat=new TH.MeshBasicMaterial({map:ovT,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});ovS.add(new TH.Mesh(new TH.PlaneGeometry(2,2),ovMat));var ovClear=true;
var _v=V3();
function sp(x,y,z){_v.set(-x,y,z).project(cam);var d=cam.position.distanceTo(_v.set(-x,y,z)),ppm=H/(2*Math.tan(cam.fov*PI/360)*Math.max(.1,d));_v.set(-x,y,z).project(cam);return[(_v.x+1)/2*W,(1-_v.y)/2*H,ppm]}
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

function drawConf(dt){for(var i=conf.length-1;i>=0;i--){var f=conf[i];f.y+=f.vy*dt;f.x+=Math.sin(T*3+f.p)*30*dt;f.r+=f.vr*dt;if(f.y>H+10){conf.splice(i,1);continue}c.save();c.translate(f.x,f.y);c.rotate(f.r);c.fillStyle=f.c;c.fillRect(-4,-2,8,4);c.restore()}}
function drawBan(){if(!ban)return;var bt=T-ban.t0,sk=Math.min(1,bt*5),al=bt>ban.d-.4?clamp((ban.d-bt)/.4,0,1):1;if(bt>=ban.d){ban=null;return}
  c.save();c.globalAlpha=al;c.translate(W/2,H*.33);var s=.6+.4*(1-Math.pow(1-sk,3));c.scale(s,s);var fs=Math.round(W*.17);c.font='900 '+fs+'px "Baloo 2",Nunito,sans-serif';while(fs>30&&c.measureText(ban.t).width>W*.86){fs-=4;c.font='900 '+fs+'px "Baloo 2",Nunito,sans-serif'}
  c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.lineWidth=fs*.16;c.strokeStyle='rgba(10,10,30,.8)';c.strokeText(ban.t,0,0);c.fillStyle=ban.c;c.fillText(ban.t,0,0);c.restore()}
function drawCap(){if(!cap)return;var bt=T-cap.t0;if(bt>cap.d){cap=null;return}var al=clamp(Math.min(bt*5,(cap.d-bt)*4),0,1);c.save();c.globalAlpha=al;c.font='900 30px "Baloo 2",Nunito,sans-serif';var w=c.measureText(cap.t).width+56,x=(W-w)/2,y=H*.5+20;c.fillStyle='rgba(8,12,34,.82)';rr(x,y,w,52,26);c.fill();c.strokeStyle=cap.c;c.lineWidth=3;c.stroke();c.fillStyle='#fff';c.textAlign='center';c.textBaseline='middle';c.fillText(cap.t,W/2,y+27);c.restore()}
function drawOv(dt){c.setTransform(sc,0,0,sc,0,0);c.clearRect(0,0,W,H);
  for(var i=rings.length-1;i>=0;i--){var g=rings[i],a=T-g.t0;if(a>1.3){rings.splice(i,1);continue}var p=sp(g.p[0],g.p[1],g.p[2]),r=14+a*70,al=1-a/1.3;c.strokeStyle=g.c.replace('A',al.toFixed(2));c.lineWidth=4*al+1;c.beginPath();c.arc(p[0],p[1],r,0,7);c.stroke();c.beginPath();c.arc(p[0],p[1],r*.55,0,7);c.stroke()}
  if(trail&&trail.length>1){c.strokeStyle='#FFC53D';c.lineWidth=7;c.lineCap='round';c.lineJoin='round';c.shadowColor='#FFC53D';c.shadowBlur=14;c.beginPath();trail.forEach(function(p,i){i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y)});c.stroke();c.shadowBlur=0}
  if(dvp&&!anim){var rp=sp(dvp[0],dvp[1],ZG),rr2=34+Math.sin(T*7)*3;c.strokeStyle='#FFC53D';c.lineWidth=4;c.beginPath();c.arc(rp[0],rp[1],rr2,0,7);c.moveTo(rp[0]-rr2-12,rp[1]);c.lineTo(rp[0]+rr2+12,rp[1]);c.moveTo(rp[0],rp[1]-rr2-12);c.lineTo(rp[0],rp[1]+rr2+12);c.stroke()}
  if(role==='s'&&!anim&&!trail){var pu=.5+.5*Math.sin(T*5),bb=sp(0,BR,0),br=bb[2]*BR;c.strokeStyle='rgba(255,197,61,'+(.55+.4*pu)+')';c.lineWidth=3;c.beginPath();c.arc(bb[0],bb[1],br*1.9+pu*5+6,0,7);c.stroke()}
  drawConf(dt);drawCap();drawBan();drawHud();ovT.needsUpdate=true}


/* ================= KAMERA ================= */
var C={px:0,py:3,pz:-11,lx:0,ly:1.15,lz:ZG,h:24.6},CK=0;
function camTarget(){var g={px:0,py:3,pz:-11,lx:0,ly:1.15,lz:ZG,h:24.6,k:6};if(!anim||anim.nk)return g;var t=anim.t,i;
  if(t<0){var u=SMOOTH(-RU,0,t),sx=shooterPose(t).pel[0];g.pz=-11+1.0*u;g.py=3-.15*u;g.h=24.6-1.4*u;g.px=-sx*.12;g.lx=-sx*.08;g.k=3}
  else{var bp=[-BP[0],BP[1],BP[2]],kk=clamp(BP[2]/ZG,0,1),w=.18+.5*kk;g.pz=-10+1.4*kk;g.py=2.85-.3*kk;g.px=bp[0]*.15*kk;g.h=23.2-2*kk;g.lx=lerp(0,bp[0],w);g.ly=lerp(1.15,bp[1],w*.8);g.lz=lerp(ZG,bp[2],w*.5);g.k=5;
    if(sim&&sim.res==='goal'&&sim.tg&&t>sim.tg-.05){var ng=SMOOTH(sim.tg-.05,sim.tg+.5,t);g.lx=lerp(g.lx,bp[0]*.5,ng);g.ly=lerp(g.ly,1.15,ng);g.lz=lerp(g.lz,ZB-1,ng);g.h=lerp(g.h,18,ng);g.pz=lerp(g.pz,-7.6,ng);g.py=lerp(g.py,2.3,ng);g.px=lerp(g.px,0,ng);g.k=3}
    if(focus){var f=focus,fw=SMOOTH(0,.18,t-f.t0)*(1-SMOOTH(f.d-.35,f.d,t-f.t0));g.lx=lerp(g.lx,f.p[0],fw);g.ly=lerp(g.ly,f.p[1],fw);g.lz=lerp(g.lz,f.p[2],fw);g.h=lerp(g.h,13,fw);g.py=lerp(g.py,1.7,fw);g.pz=lerp(g.pz,Math.min(g.pz+2,f.p[2]-6.5),fw);g.px=lerp(g.px,f.p[0]*.5,fw);g.k=8}}
  return g}
function applyCam(){if(o.cam)o.cam(C);var sx=shake>.05?(Math.random()-.5)*shake*.06:0,sy=shake>.05?(Math.random()-.5)*shake*.06:0;cam.position.set(C.px+sx,C.py+sy,C.pz);cam.lookAt(C.lx,C.ly,C.lz);var asp=W/H;cam.aspect=asp;cam.fov=2*Math.atan(Math.tan(C.h*PI/360)/asp)*180/PI;cam.updateProjectionMatrix();cam.updateMatrixWorld(true)}
function snapCam(){var g=camTarget();for(var k in C)C[k]=g[k];applyCam()}
function stepCam(dt){var g=camTarget(),a=1-Math.exp(-dt*g.k);for(var k in C)C[k]+=(g[k]-C[k])*a;applyCam()}
function fit(){var par=cv.parentNode,vh=window.innerHeight||800,vw=window.innerWidth||400,pa=Math.min((par&&par.clientWidth)||vw,o.maxW||640),avH=Math.max(380,vh-(o.pad||130)),ar=clamp(avH/pa,1.2,1.95),pw=Math.min(pa,avH/ar),dpr=Math.min(1,window.devicePixelRatio||1);
  W=720;H=Math.round(W*ar);rd.setPixelRatio(dpr);rd.setSize(Math.round(pw),Math.round(pw*ar));sc=cv.width/W;ovc.width=cv.width;ovc.height=cv.height;hudDirty=true;snapCam()}

/* ================= KADR ================= */
function ballAt(tm){var F2=sim.frames,n=F2.length/8,i=tm*60,i0=Math.min(n-1,Math.floor(i)),i1=Math.min(n-1,i0+1),u=i-i0,a=i0*8,b=i1*8;if(u>1)u=1;
  var q=[lerp(F2[a+4],F2[b+4],u),lerp(F2[a+5],F2[b+5],u),lerp(F2[a+6],F2[b+6],u),lerp(F2[a+7],F2[b+7],u)],l=Math.sqrt(q[0]*q[0]+q[1]*q[1]+q[2]*q[2]+q[3]*q[3])||1;
  return{p:[lerp(F2[a+1],F2[b+1],u),lerp(F2[a+2],F2[b+2],u),lerp(F2[a+3],F2[b+3],u)],q:[q[0]/l,q[1]/l,q[2]/l,q[3]/l],v:(i1>i0?h3(F2[b+1]-F2[a+1],F2[b+2]-F2[a+2],F2[b+3]-F2[a+3])*60:0)}}
function ring(p,col){rings.push({p:p,c:col,t0:T})}
function setBan(t,col,d){ban={t:t,c:col,t0:T,d:d||2.2}}
function setCap(t,col){cap={t:t,c:col||'#FFC53D',t0:T,d:2.6}}
var PARTS={glove:'Qo\u2018lqop bilan qaytardi \ud83e\udde4',arm:'Qo\u2018li bilan qaytardi',body:'Tanasi bilan qaytardi',head:'Boshi bilan qaytardi',leg:'Oyog\u2018i bilan qaytardi'};
function updSpark(){} // stadion uchqun animatsiyasi o‘chirildi
function update(dt){T+=dt;ex+=(exT-ex)*Math.min(1,dt*2.2);exT+=(.15-exT)*Math.min(1,dt*.5);shake*=Math.pow(.02,dt);nf*=Math.pow(.25,dt);updSpark(dt);if(react)react.t+=dt;
  var tsc=1;if(anim&&!anim.nk&&anim.slow&&anim.t>=anim.s0&&anim.t<anim.s1)tsc=.55;if(focus&&anim&&anim.t-focus.t0<focus.d)tsc=.38;tscNow=tsc;
  if(anim){anim.t+=dt*tsc;for(var i=trig.length-1;i>=0;i--)if(anim.t>=trig[i][0]){var f=trig[i][1];trig.splice(i,1);try{f()}catch(e){}}
    if(anim.t>=anim.end&&cbEnd){var cb=cbEnd;cbEnd=null;busy=false;try{cb()}catch(e){}}}
  }
function draw(dt){var tm=anim?anim.t:0,playing=sim&&anim&&!anim.nk,bq=lastQ,fast=0,bpR=null;
  if(playing&&tm>=0){var bl=ballAt(Math.min(tm,sim.dur));BP=bl.p;bq=bl.q;lastQ=bq;fast=bl.v}else if(!playing||tm<0){BP=[0,BR,0];if(!playing)bq=lastQ}
  ballM.position.set(-BP[0],BP[1],BP[2]);ballM.quaternion.set(bq[1],-bq[2],-bq[3],bq[0]);
  if(BP[2]>ZG-.3&&BP[2]<ZB+.3)bpR=[-BP[0],BP[1],BP[2]];netStep(dt,bpR);updTrail(BP,fast,playing&&tm>=0);
  var po;if(playing&&tm>=0)po=keeperPose(sim.plan,tm);else po=keeperPose({dive:false},T);keeper.update(keeperRender(po));
  var sp0;if(playing)sp0=shooterPose(tm,react);else if(anim&&anim.nk)sp0=shooterPose(-RU,null,true);else sp0=shooterPose(-RU,react,true);
  if(!playing&&!anim){sp0.sho[2]-=.0;sp0.pel[1]+=Math.sin(T*2)*.004}shooter.update(shooterRender(sp0));
  stepCam(dt);
  var need=hudDirty||ban||cap||trail||rings.length||conf.length||dvp||(role==='s'&&!anim);
  rd.autoClear=false;rd.clear();rd.render(scene,cam);
  if(need){drawOv(dt);hudDirty=false;ovClear=false}else if(!ovClear){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,ovc.width,ovc.height);c.setTransform(sc,0,0,sc,0,0);drawHud();ovT.needsUpdate=true;ovClear=true;if(!hudD){}}
  rd.render(ovS,ovC)}
var frameDue=0;function frame(now){if(dead||document.hidden){raf=0;return}raf=requestAnimationFrame(frame);if(now-frameDue<50)return;frameDue=now;var dt=Math.min(.05,(now-last)/1000||.033);last=now;update(dt);draw(dt)}
function onVisibility(){if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0}else{last=0;frameDue=0;if(!dead&&!raf)raf=requestAnimationFrame(frame)}}
document.addEventListener('visibilitychange',onVisibility);

/* ================= OCHIQ METODLAR ================= */
function reset(r){role=r||'v';sim=null;anim=null;trail=null;dvp=null;ban=null;cap=null;trig=[];cbEnd=null;busy=false;lastQ=[1,0,0,0];exT=.2;path=[];rings=[];focus=null;react=null;tHist.length=0;BP=[0,BR,0];hudDirty=true;snapCam()}
function play(d,cb){if(dead)return false;unlock();ban=null;cap=null;trig=[];spk.length=0;conf.length=0;sparkT=0;busy=true;path=[];rings=[];focus=null;react=null;tHist.length=0;
  if(!d.k){sim={res:'miss',frames:[0,0,BR,0,1,0,0,0],net:[],ev:[],tg:0,tt:0,plan:keeperPlan(null),dur:0};anim={t:0,end:2.4,nk:1,s0:9,s1:9};trig.push([.1,function(){setBan('Zarba berilmadi \u23f1','#FF3B5C',2);react={k:'sad',t:0}}]);sfx('groan');cbEnd=cb;exT=.4;return true}
  try{sim=simulate(d.k,d.d,d.seed)}catch(e){sim=null;busy=false;return false}
  var r=sim.res,pt=d.pt!==undefined?d.pt:sim.pt,tR=r==='goal'?sim.tg:r==='save'?sim.tt:Math.min(.9,sim.dur),n=sim.frames.length/8,s0=99,i;
  for(i=0;i<n;i++){if(sim.frames[i*8+3]>ZG-5){s0=i/60;break}}
  anim={t:-RU,end:Math.max(Math.min(sim.dur,3.6),r==='goal'?3.4:2.6)+.5,s0:s0,s1:tR+.55,slow:true};lastQ=[1,0,0,0];exT=.3;sfx('hush');
  trig.push([-RU+.05,function(){exT=.4}]);
  trig.push([0,function(){sfx('kick');exT=.4;shake=Math.max(shake,.25)}]);
  sim.net.forEach(function(m){trig.push([m.t,function(){netImpulse(m)}])});
  sim.ev.forEach(function(e){var tt=e.t;trig.push([tt,function(){
    var bp3=[e.x!=null?e.x:ballAt(Math.min(tt,sim.dur)).p[0],e.y!=null?e.y:ballAt(Math.min(tt,sim.dur)).p[1],e.z!=null?e.z:ZK];
    if(e.k==='post'||e.k==='bar'){sfx(e.k);shake=Math.max(shake,.9);setBan(e.k==='post'?'USTUN! \ud83d\ude31':'TO\u2018SIN! \ud83d\ude31','#FFC53D',1.8);exT=.7;ring(bp3,'rgba(255,200,60,A)');focus={p:[-bp3[0],bp3[1],bp3[2]],t0:anim.t,d:1.0};setCap(e.k==='post'?'Ustunga tegdi':'To\u2018singa tegdi')}
    else if(e.k==='net'){sfx('net');shake=Math.max(shake,1);nf=1}
    else if(e.k==='parry'||e.k==='catch'){sfx(e.k);shake=Math.max(shake,.5);ring(bp3,'rgba(255,230,120,A)');focus={p:[-bp3[0],bp3[1],bp3[2]],t0:anim.t,d:1.0};setCap(e.k==='catch'?'Ushlab oldi! \ud83e\udde4':(PARTS[e.part]||PARTS.glove))}
    else if(e.k==='bounce'&&e.s>2)sfx('bounce')}])});
  trig.push([tR+.08,function(){if(r==='goal'){setBan(sim.net.length&&pt?'GOL! (ustundan)':'GOL!','#27C99A',3);sfx('goal');exT=1;ex=Math.max(ex,.7);sparkT=3.4;shake=Math.max(shake,1.2);nf=1;react={k:'goal',t:0};ring(ballAt(Math.min(sim.tg,sim.dur)).p,'rgba(60,255,170,A)');
      for(var i2=0;i2<160;i2++)conf.push({x:Math.random()*W,y:-Math.random()*H*.6,vy:90+Math.random()*130,vr:(Math.random()-.5)*9,r:Math.random()*6,p:Math.random()*6,c:['#ffc53d','#ff3b5c','#27c99a','#4b6bff','#fff'][i2%5]})}
    else if(r==='save'){setBan('SEYV! \ud83e\udde4','#FFC53D',2.4);sfx('groan');exT=.55;react={k:'sad',t:0}}
    else{if(!ban)setBan(pt==='post'||pt==='bar'?'URILDI, GOL EMAS':'AUT \u274c','#FF3B5C',2.2);sfx('groan');exT=.4;react={k:'sad',t:0}}}]);
  cbEnd=cb;return true}
function pos(e){var r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height,t:performance.now()}}
function toGoal(x,y){applyCam();var v=V3(x/W*2-1,1-y/H*2,.5).unproject(cam).sub(cam.position).normalize(),k=(ZG-cam.position.z)/v.z;return{x:-(cam.position.x+v.x*k),y:cam.position.y+v.y*k}}
function onSpot(x,y){var b=sp(0,BR,0),r=b[2]*BR*2.6+44;return h2(x-b[0],y-b[1])<r}
fit();raf=requestAnimationFrame(frame);
var onR=function(){if(!dead)fit()};window.addEventListener('resize',onR);
return{W:function(){return W},H:function(){return H},reset:reset,play:play,pos:pos,toGoal:toGoal,onSpot:onSpot,fit:fit,unlock:unlock,busy:function(){return busy},
  setTrail:function(t){trail=t},setDive:function(u,v){dvp=u==null?null:[(u-.5)*2*HW,v*2.6]},hud:function(d){hudD=d;hudDirty=true},
  banner:function(t,col,d){setBan(t,col,d)},_dbg:function(){return{cam:cam,scene:scene,rd:rd,C:C,sim:function(){return sim},anim:function(){return anim}}},
  destroy:function(){dead=true;cancelAnimationFrame(raf);window.removeEventListener('resize',onR);document.removeEventListener('visibilitychange',onVisibility);try{scene.traverse(function(m){if(m.geometry)m.geometry.dispose();if(m.material){(m.material.length?m.material:[m.material]).forEach(function(q){if(q.map)q.map.dispose();q.dispose()})}});rd.dispose()}catch(e){}}}}

var THP=null;
function load(){if(window.THREE)return Promise.resolve(true);if(THP)return THP;
  var U=['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'];
  THP=new Promise(function(res){var i=0;(function next(){if(window.THREE)return res(true);if(i>=U.length){THP=null;return res(false)}var s=document.createElement('script');s.src=U[i++];s.async=true;s.onload=function(){if(window.THREE)res(true);else next()};s.onerror=function(){try{s.remove()}catch(e){}next()};document.head.appendChild(s)})()});return THP}
window.PenaltyStage={v:5,simulate:simulate,resolve:resolve,create:create,load:load,_k:{keeperPlan:keeperPlan,keeperPose:keeperPose,launch:launch}};
})();
