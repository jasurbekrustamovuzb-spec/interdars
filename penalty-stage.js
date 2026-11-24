/* Lazy WebGL penalty stage for InterDars */
(function(){
'use strict'; if(window.PenaltyStage)return;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t;
function resolve(s,d){const x=+s.tx||0,y=+s.ty||1.2,save=!!d&&Math.abs((d.x||0)-x)<.9&&y<2.05;return{res:save?'save':(Math.abs(x)>3.66||y>2.44?'miss':'goal'),pt:'',tg:1.1,tt:1.05,frames:[],ev:[],net:[]}}
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
window.PenaltyStage={v:4,resolve,simulate(s,d,seed){return resolve(s,d)},create};
})();