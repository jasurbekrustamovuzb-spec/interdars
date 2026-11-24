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
    hd=[[Px-.66+sway,1.16+Math.sin(t*4)*.03],[Px+.66+sway,1.16+Math.sin(t*4+1)*.03]];ft=[[Px-.34,0],[Px+.34,0]]}
  else{s=clamp((t-pl.t0)/pl.Td,0,1);e=1-Math.pow(1-s,2.2);f=clamp((t-pl.t0-pl.Td)/.42,0,1);k=clamp(t/pl.t0,0,1);
    th=pl.th*e;if(pl.lay)th=pl.th*(1+.25*f);th=clamp(th,-1.5,1.5);
    u=[Math.sin(th),Math.cos(th)];pp=[Math.cos(th),-Math.sin(th)];
    Px=lerp(0,pl.PT[0],e);Py=lerp(.9-.1*k,pl.PT[1],e)+pl.jump*Math.sin(PI*s)*(pl.lay?.7:1);
    if(f>0){if(pl.lay)Py=lerp(Py,.27,f);else Py=lerp(Py,.9,f*f)}
    var Sx=Px+u[0]*TOR,Sy=Py+u[1]*TOR,rdy=[[Px-.66,1.16],[Px+.66,1.16]];
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
function PN(i){return i===0?'tana':i===1?'bosh':['qo‘l','qo‘l','qo‘lqop','son','oyoq'][(i-2)%5]}
function simulate(shot,dive,seed){var rnd=rng(seed||1),Lc=launch(shot),v=Lc.v,w=Lc.w,p=[0,BR,0],q=[1,0,0,0],plan=keeperPlan(dive),H=1/240,t=0,F=[],ev=[],net=[],res='miss',pt='',touched=false,crossed=false,inNet=false,caught=null,rest=0,a=[0,0,0],n=0,tg=0,tt=0,first={};
  function evt(k,x,w){ev.push({t:t,k:k,s:x||0,w:w||''})}
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
    if(!touched&&!crossed&&p[2]>ZK-.7&&p[2]<ZG+.25){var po2=keeperPose(plan,t),sl=segs(po2),si,best=null,bs=null,bi=0;
      for(si=0;si<sl.length;si++){var hh2=segHit(p[0],p[1],p[2],sl[si]);if(hh2&&(!best||hh2.d<best.d)){best=hh2;bs=sl[si];bi=si}}
      if(best){touched=true;tt=t;res='save';var nx2=p[0]-best.cx,ny2=p[1]-best.cy,nz2=p[2]-ZK,nl=h3(nx2,ny2,nz2)||1;nx2/=nl;ny2/=nl;nz2/=nl;
        if(nz2>-.35){nz2=-.35;var l2=h3(nx2,ny2,nz2);nx2/=l2;ny2/=l2;nz2/=l2}
        var spd=h3(v[0],v[1],v[2]),hand=bs[5]>=1;
        if(bs[5]>=2&&spd<20.5&&rnd()<.46){caught={t:t,h:bs[5]-2};evt('catch',spd,PN(bi))}
        else{var vn2=v[0]*nx2+v[1]*ny2+v[2]*nz2;v[0]-=1.38*vn2*nx2;v[1]-=1.38*vn2*ny2;v[2]-=1.38*vn2*nz2;
          var kf=hand?.62:.45;v[0]=v[0]*kf+(rnd()-.5)*3+(p[0]>po2.P[0]?1:-1)*rnd()*1.5;v[1]=v[1]*kf+1+rnd()*2.4;v[2]=Math.min(v[2]*kf,-1.8-rnd()*2.4);
          w[0]*=-.5;w[1]*=-.5;w[2]=(rnd()-.5)*30;evt('parry',spd,PN(bi))}}}
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
function create(cv,o){let T,renderer,scene,camera,root,gk,pk,ball,ring,ready=false,dead=false,raf=0,tick=0,last=0,flight=null,cb=null,queued=null,role='v';o=o||{};
 const M=(c,r=.7,m=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m}),B=(w,h,d,m)=>new T.Mesh(new T.BoxGeometry(w,h,d),m);
 function player(k){const g=new T.Group(),skin=M(k?0x9b694e:0xb98360),hair=M(0x171411),shirt=M(k?0x139366:0xf2f2ed),short=M(k?0x087d57:0xf7f5ed),sock=M(k?0x07815a:0xf7f6ef),boot=M(k?0xf5f1e8:0xd4ae55),trim=M(k?0xf5f1df:0x287565),glove=M(0xf2f0e8);
 const torso=B(.58,.7,.32,shirt);torso.position.y=1.28;g.add(torso);
 const stripe=B(.055,.62,.335,trim);stripe.position.set(0,1.28,-.01);g.add(stripe);
 const shorts=B(.53,.25,.33,short);shorts.position.y=.83;g.add(shorts);
 const head=new T.Mesh(new T.SphereGeometry(.17,20,16),skin);head.position.y=1.91;g.add(head);
 const cap=new T.Mesh(new T.SphereGeometry(.177,18,10,0,Math.PI*2,0,Math.PI*.45),hair);cap.position.y=1.97;g.add(cap);
 for(const s of [-1,1]){
  const ear=new T.Mesh(new T.SphereGeometry(.04,10,8),skin);ear.position.set(s*.17,1.9,0);g.add(ear);
  const eye=new T.Mesh(new T.SphereGeometry(.017,8,8),M(0x111111));eye.position.set(s*.05,1.94,-.155);g.add(eye);
  const leg=new T.Group();leg.position.set(s*.17,.78,0);const thigh=B(.19,.43,.2,short);thigh.position.y=-.09;leg.add(thigh);const shin=B(.135,.47,.14,sock);shin.position.y=-.53;leg.add(shin);for(let j=0;j<3;j++){let st=B(.025,.35,.146,trim);st.position.set(-.04+j*.04,-.53,-.005);leg.add(st)}
  const shoe=B(.16,.11,.29,boot);shoe.position.set(0,-.8,-.07);leg.add(shoe);g.add(leg);g.userData.legs??=[];g.userData.legs.push(leg);
  const arm=new T.Group();arm.position.set(s*.34,1.53,0);const sleeve=B(.2,.37,.21,shirt);sleeve.position.y=-.14;arm.add(sleeve);const fore=B(.13,.38,.14,k?shirt:skin);fore.position.y=-.48;arm.add(fore);if(k){const mitt=B(.22,.15,.1,glove);mitt.position.y=-.68;arm.add(mitt)}g.add(arm);g.userData.arms??=[];g.userData.arms.push(arm)
 }
 const collar=new T.Mesh(new T.TorusGeometry(.12,.023,8,20),trim);collar.position.set(0,1.62,0);collar.rotation.x=Math.PI/2;g.add(collar);g.traverse(q=>{if(q.isMesh){q.castShadow=true;q.receiveShadow=true}});return g}
 function make(){
  scene=new T.Scene();scene.background=new T.Color(0x071222);scene.fog=new T.Fog(0x071222,34,100);
  camera=new T.PerspectiveCamera(39,(cv.clientWidth||960)/(cv.clientHeight||540),.1,130);camera.position.set(0,4.5,-18.5);camera.lookAt(0,2,9);
  renderer=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(1.7,devicePixelRatio||1));renderer.setSize(cv.clientWidth||960,cv.clientHeight||540,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  scene.add(new T.HemisphereLight(0xcbdcff,0x294021,2));let sun=new T.DirectionalLight(0xffefcf,3.4);sun.position.set(-8,18,-2);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);scene.add(sun);
  for(const x of [-16,16]){let l=new T.SpotLight(0xe1edff,100,65,.65,.4,1);l.position.set(x,19,8);l.target.position.set(0,1,10);scene.add(l,l.target)}
  root=new T.Group();scene.add(root);
  const grass=M(0x367f38,.98);let field=new T.Mesh(new T.PlaneGeometry(42,58),grass);field.rotation.x=-Math.PI/2;field.position.set(0,-.1,3);field.receiveShadow=true;root.add(field);
  for(let i=0;i<24;i++){let s=new T.Mesh(new T.PlaneGeometry(42,2.4),M(i%2?0x347b35:0x39853b));s.rotation.x=-Math.PI/2;s.position.set(0,-.085,-22+i*2.4);root.add(s)}
  const white=M(0xf1f2ed,.3),line=(x,z,X,Z)=>{let len=Math.hypot(X-x,Z-z),q=B(.045,.012,len,white);q.position.set((x+X)/2,-.04,(z+Z)/2);q.rotation.y=Math.atan2(X-x,Z-z);root.add(q)};
  line(-3.66,11,3.66,11);line(-3.66,11,-3.66,5.5);line(3.66,11,3.66,5.5);line(-3.66,5.5,3.66,5.5);line(-3.66,0,3.66,0);line(-3.66,0,-3.66,-6);line(3.66,0,3.66,-6);line(-3.66,-6,3.66,-6);
  for(const x of [-3.66,3.66]){let p=B(.13,2.48,.14,white);p.position.set(x,1.24,11);root.add(p)}let bar=B(7.42,.14,.14,white);bar.position.set(0,2.44,11);root.add(bar);
  let pts=[];for(let x=-3.62;x<=3.63;x+=.24)pts.push(new T.Vector3(x,.03,11.03),new T.Vector3(x,2.4,11.03));for(let y=.05;y<=2.4;y+=.2)pts.push(new T.Vector3(-3.62,y,11.03),new T.Vector3(3.62,y,11.03));root.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0xf0f4f5,transparent:true,opacity:.55})));
  for(const x of [-3.7,3.7]){let s=B(.08,2.3,2.3,white);s.position.set(x,1.15,12.1);root.add(s)}
  let crowd=[0xc5223b,0xf4f1e9,0x183a74,0x152139,0xe6af39,0x37987e,0x745190].map(x=>M(x));
  for(let tier=0;tier<6;tier++){let n=240,inst=new T.InstancedMesh(new T.CapsuleGeometry(.09,.32,3,5),crowd[0],n);let d=new T.Object3D();for(let i=0;i<n;i++){let side=i<n/2?-1:1,ix=i%(n/2);d.position.set(side*(4.1+(ix%24)*.42),3.3+tier*.82+Math.floor(ix/24)*.42,14+tier*1.55+(Math.random()-.5)*.25);d.rotation.z=(Math.random()-.5)*.16;d.scale.set(.85+Math.random()*.3,.8+Math.random()*.5,.85);d.updateMatrix();inst.setMatrixAt(i,d.matrix);inst.setColorAt(i,new T.Color(crowd[(Math.random()*crowd.length)|0].color))}root.add(inst)}
  for(let i=0;i<6;i++){let board=B(7.5,.7,.2,M([0x10194b,0x164080,0x6b1530][i%3],.4));board.position.set((i-2.5)*8,1.2,13.2);root.add(board)}
  const steel=M(0x28344a,.35,.55);for(let x=-21;x<=21;x+=7){let q=B(.15,8,.18,steel);q.position.set(x,8,23);root.add(q)}let roof=B(44,.35,2.5,steel);roof.position.set(0,12,24);root.add(roof);
  gk=player(true);gk.position.set(0,0,10.48);gk.rotation.y=Math.PI;gk.scale.setScalar(1.12);root.add(gk);
  pk=player(false);pk.position.set(-1.15,0,-1.5);pk.rotation.y=Math.PI;pk.scale.setScalar(1.07);root.add(pk);
  ball=new T.Mesh(new T.SphereGeometry(.11,32,24),M(0xf8f6ed,.3));ball.position.set(0,.115,0);ball.castShadow=true;root.add(ball);
  ring=new T.Mesh(new T.TorusGeometry(.95,.025,8,64),new T.MeshBasicMaterial({color:0xffa331}));ring.rotation.x=Math.PI/2;ring.position.set(0,.02,0);root.add(ring)
 }
 function resize(){if(renderer){let w=cv.clientWidth||960,h=cv.clientHeight||540;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}}
 function render(now){if(dead)return;raf=requestAnimationFrame(render);let dt=Math.min(.04,(now-last)/1000||.016);last=now;tick+=dt;
  if(!flight){gk.position.x=Math.sin(tick*1.6)*.08;gk.position.y=Math.abs(Math.sin(tick*3))*.025;pk.rotation.z=Math.sin(tick*1.5)*.012}
  if(flight){flight.t+=dt;let f=clamp(flight.t/flight.duration,0,1),e=f*f*(3-2*f);ball.position.set(lerp(0,flight.x,e),.115+4*flight.y*f*(1-f)+flight.y*f*f,lerp(0,11.1,f));ball.rotation.x+=dt*12;ball.rotation.z+=dt*flight.spin;
   gk.position.x=lerp(0,flight.save?flight.x*.72:flight.x*.2,e);gk.position.y=flight.save?Math.sin(Math.PI*f)*.82:0;gk.rotation.z=flight.save?Math.sign(flight.x)*e*.8:0;gk.rotation.x=flight.save?-.5*e:0;
   let legs=pk.userData.legs||[];if(legs[1])legs[1].rotation.x=-.85*clamp(f/.22,0,1)*(f<.55?1:1-(f-.55)/.45);if(f>=1){flight=null;setTimeout(()=>{if(cb&&!dead){let done=cb;cb=null;done()}},700)}
  }
  renderer.render(scene,camera)
 }
 function play(s,done){if(!ready){queued=[s,done];return true}cb=done;const shot=s.k||s,x=clamp(+shot.tx||0,-3.45,3.45),y=clamp(+shot.ty||1.2,.2,2.22),d=s.d||{};flight={t:0,duration:1.05,x,y,spin:(+shot.cu||0)*.7,save:!!d&&Math.abs(((+d.x||.5)-.5)*7.32-x)<.82&&y<2.05};return true}
 function reset(r){role=r||'v';flight=null;cb=null;if(gk){gk.position.set(0,0,10.48);gk.rotation.set(0,Math.PI,0)}if(pk){pk.position.set(-1.15,0,-1.5);pk.rotation.set(0,Math.PI,0)}if(ball)ball.position.set(0,.115,0)}
 function destroy(){dead=true;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);if(renderer){renderer.dispose();scene.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material){if(Array.isArray(x.material))x.material.forEach(m=>m.dispose());else x.material.dispose()}})}}
 import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js').then(mod=>{if(dead)return;T=mod;make();ready=true;resize();reset(role);if(pendingTrail)setTrail(pendingTrail);if(queued){let q=queued;queued=null;play(q[0],q[1])}raf=requestAnimationFrame(render)}).catch(e=>console.error('Three.js penalty scene failed to load',e));
 let preview=null,trailObj=null,pendingTrail=null;
 function pos(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left),y:(e.clientY-r.top),t:performance.now()}}
 function toGoal(x,y){if(!ready)return{x:(x/(cv.clientWidth||960)-.5)*7.32,y:clamp((1-y/(cv.clientHeight||540))*2.6,0,2.6)};camera.updateMatrixWorld();const v=new T.Vector3(2*x/(cv.clientWidth||960)-1,1-2*y/(cv.clientHeight||540),0.5).unproject(camera),dir=v.sub(camera.position).normalize(),d=(11-camera.position.z)/dir.z;return{x:camera.position.x+dir.x*d,y:camera.position.y+dir.y*d}}
 function onSpot(x,y){if(!ready)return Math.hypot(x-(cv.clientWidth||960)*.5,y-(cv.clientHeight||540)*.78)<54;const p=new T.Vector3(0,.12,0).project(camera),sx=(p.x+1)*.5*(cv.clientWidth||960),sy=(1-p.y)*.5*(cv.clientHeight||540);return Math.hypot(x-sx,y-sy)<46}
 function setTrail(points){pendingTrail=points;if(!ready)return;if(trailObj){root.remove(trailObj);trailObj.geometry.dispose()}if(!points||points.length<2)return;const verts=points.filter((_,i)=>i%Math.max(1,Math.floor(points.length/70))===0).map(p=>new T.Vector3(2*p.x/(cv.clientWidth||960)-1,1-2*p.y/(cv.clientHeight||540),.08).unproject(camera));if(verts.length>1){trailObj=new T.Line(new T.BufferGeometry().setFromPoints(verts),new T.LineBasicMaterial({color:0xffc53d,linewidth:3}));scene.add(trailObj)}}
 function setDive(u,v){preview={x:(u-.5)*7.32,y:v*2.5};if(ready){gk.position.x=preview.x*.2}}
 const api={reset,play,hud(x){},destroy,get ready(){return ready},pos,toGoal,onSpot,fit:resize,unlock(){},busy(){return !!flight},setTrail,setDive,banner(){},W(){return cv.clientWidth||960},H(){return cv.clientHeight||540}};return api
}
window.PenaltyStage={v:4,simulate:simulate,resolve:resolve,create:create,_k:{keeperPlan:keeperPlan,keeperPose:keeperPose,launch:launch}};
})();
