const IMG="/img/portrait.webp";
history.scrollRestoration="manual";scrollTo(0,0);
const $=s=>document.querySelector(s);
/* ---- springs (react-spring solver) ---- */
const sps=[];let lt=performance.now();
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
function spring(fn,k,c,delay){if(RM){fn(1);return}sps.push({x:0,v:0,k,c,fn,st:performance.now()+delay,done:false})}
function stepSprings(now){const dt=Math.min(64,now-lt);lt=now;for(const s of sps){if(s.done||now<s.st)continue;for(let i=0;i<dt;i++){const a=-s.k*(s.x-1)-s.c*s.v;s.v+=a/1000;s.x+=s.v/1000}s.fn(s.x);if(Math.abs(s.v)<.01&&Math.abs(1-s.x)<.01){s.fn(1);s.done=true}}}
function rise(el,delay,y="0.75rem",k=90,c=26){el.style.opacity=0;spring(x=>{el.style.opacity=Math.min(1,x);el.style.transform=`translateY(calc(${y} * ${1-x}))`},k,c,delay)}
function split(el){const t=el.textContent.trim().split(/\s+/);el.setAttribute("aria-label",t.join(" "));el.innerHTML=t.map(w=>`<span class="w" aria-hidden="true">${w}</span>`).join("");return[...el.children]}
const ws=split($("#h1"));ws.forEach(w=>w.style.opacity=0);
const w2=split($("#h2"));w2.forEach(w=>w.style.opacity=0);
const vf=$("#vf"),vm=$("#vm"),vn=$("#vn"),SL=[...document.querySelectorAll(".sl i")];let prog=0,ready=false,loadErr=null;
spring(x=>vn.style.opacity=x,110,26,260);
const banner=m=>{const b=document.createElement("div");b.textContent=m;b.style.cssText="position:fixed;top:0;left:0;right:0;z-index:99;background:#ff6b00;color:#fff;padding:8px;font-size:12px";document.body.append(b)};

/* ================= THREE scene ================= */
const hero=$("#hero"),cv=$("#cv"),N=36,DEG=Math.PI/180;
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:false,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.setClearColor(0xf7fafb);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,50);camera.position.set(0,.1,6.5);
/* studio environment (PMREM) */
{const es=new THREE.Scene();es.add(new THREE.Mesh(new THREE.SphereGeometry(10,32,16),new THREE.MeshBasicMaterial({side:THREE.BackSide,color:0x2a2d36})));
 [[0,6,3,6,3],[-6,1,4,2,6],[6,0,-2,2,6],[0,-2,6,5,1.5]].forEach(([x,y,z,w,h],i)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(i?6:10),side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);es.add(m)});
 const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(es).texture;pm.dispose()}

/* shared reveal uniforms */
const trail=Array.from({length:N},()=>new THREE.Vector2(9,9));
const U={uTrail:{value:trail},uPace:{value:0},uAsp:{value:1},uTime:{value:0},uIntro:{value:0},uRad:{value:.46},uBurn:{value:new THREE.Color(0x02d2e3)}};
const NOISE=`float hsh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hsh(i),hsh(i+vec2(1,0)),f.x),mix(hsh(i+vec2(0,1)),hsh(i+vec2(1,1)),f.x),f.y);}`;
const REVEAL=`uniform vec2 uTrail[${N}];uniform float uPace,uAsp,uTime,uIntro,uRad;uniform vec3 uBurn;varying vec4 vClip;${NOISE}
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-6),0.,1.);return length(pa-ba*h);}
float reveal(vec2 ndc){float gate=smoothstep(.06,.21,uPace);if(gate<=0.)return 0.;
 vec2 p=vec2(ndc.x*uAsp,ndc.y);p+=(vec2(vn(ndc*2.9+uTime*.07),vn(ndc*4.1-uTime*.09))-.5)*.28;
 float rad=uRad*mix(.28,1.,uPace);float taper=1.9*mix(1.6,1.25,uPace);float span=.64*float(${N-1});float tr=0.;
 for(int i=0;i<${N-1};i++){if(float(i)>=span)break;float w=pow(1.-float(i)/span,taper);if(w<=tr)break;
  vec2 a=vec2(uTrail[i].x*uAsp,uTrail[i].y),b=vec2(uTrail[i+1].x*uAsp,uTrail[i+1].y);float r=rad*w;tr=max(tr,w*smoothstep(r,r*.35,seg(p,a,b)));}
 return smoothstep(.075,.085,tr)*gate;}`;
function mask(mat){mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
 sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec4 vClip;").replace("#include <project_vertex>","#include <project_vertex>\nvClip=gl_Position;");
 sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\n"+REVEAL).replace("#include <alphamap_fragment>",`#include <alphamap_fragment>
 vec2 rn=vClip.xy/vClip.w;float front=smoothstep(.14,1.,uIntro);
 float at=mix(1.-(rn.y*.5+.5),vn(rn*5.+3.),.45);float intact=smoothstep(front-.02,front+.02,at);
 diffuseColor.a*=max(reveal(rn),intact);diffuseColor.rgb+=uBurn*16.*intact*(1.-intact);`)};
 mat.transparent=true;mat.depthWrite=false;mat.side=THREE.FrontSide}

/* backdrop: analytic contours */
const bd=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShaderMaterial({extensions:{derivatives:true},uniforms:{uAsp:U.uAsp,uTime:U.uTime,uBg:{value:new THREE.Vector3(.9686,.9804,.9843)},uLn:{value:new THREE.Vector3(.8745,.898,.9137)}},
 vertexShader:"varying vec4 vC;void main(){vec4 c=projectionMatrix*modelViewMatrix*vec4(position,1.);vC=c;gl_Position=c;}",
 fragmentShader:`varying vec4 vC;uniform float uAsp,uTime;uniform vec3 uBg,uLn;
 float F(vec2 p,float t){float f=sin(p.x+t*.6)*.5;f+=sin(p.y*.85-t*.45)*.45;f+=sin((p.x+p.y)*.65+t*.35)*.35;f+=sin((p.x-p.y)*.95-t*.55)*.25;return f*.5+.5;}
 void main(){vec2 n=vC.xy/vC.w;vec2 p=vec2(n.x*uAsp,n.y)*3.8;float t=uTime*1.66;vec2 q=p;q.x+=sin(p.y*.8+t*.7)*.37;q.y+=cos(p.x*.7-t*.6)*.37;
 float s=F(q,t)*2.5;float w=max(fwidth(s)*1.4,1e-5);float l=1.-smoothstep(0.,w,abs(fract(s)-.5));
 gl_FragColor=vec4(mix(uBg,uLn,l*.85),1.);}`}));
bd.position.z=-3;bd.renderOrder=-1;scene.add(bd);

const cc=document.createElement("canvas");cc.width=1280;cc.height=720;function paintCir(dark){const g=cc.getContext("2d");g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,1280,720);g.translate(33,0);g.scale(.5,.5);g.lineJoin=g.lineCap="round";const p=new Path2D("M813.87 936.41L803.19 936.95L794.47 942.82L576.98 1105.84L561.86 1106.02L553.67 1093.21L563.46 1063.13L641.23 905.8L680.74 855.61L755.85 779.8L801.76 714.66L827.57 687.79L841.09 679.42L896.62 660.91L919.94 648.1L958.56 619.62L1031.17 556.8L1075.48 527.26L1197.39 474.22L1296.52 411.93L1710.49 202.81L1720.63 199.97L1736.12 202.64L1745.73 215.27L1747.51 230.93L1738.07 249.8L1703.9 275.25L1689.66 291.09L1683.97 311.38L1687.71 326.86L1702.12 342.34L1741.63 358.18L1754.62 367.08L1774.73 415.67L1837.38 464.43L1874.58 535.09L1875.29 545.59L1868.53 560L1856.96 570.86L1847.17 574.95L1825.99 574.24L1812.29 566.05L1801.61 554.31L1775.45 520.85L1754.98 503.59L1730.6 493.44L1699.27 491.66L1613.85 520.32L1445.49 568.55L1428.94 581.89L1417.55 599.87L1404.73 656.46L1406.51 677.64L1413.81 697.58L1423.6 710.03L1440.86 722.67L1484.64 741.89L1621.32 786.38L1664.75 806.67L1684.86 823.94L1694.47 848.32L1694.11 864.34L1682.37 910.43L1683.08 926.27L1690.02 940.68L1709.42 958.48L1776.87 990.87L1804.1 1007.6L1819.94 1021.66L1829.02 1040.88L1829.19 1051.38L1822.25 1065.62L1782.92 1122.75L1762.81 1147.49L1748.75 1155.14L1711.91 1157.63L1680.94 1150.51L1620.97 1129.33L1579.14 1106.02L1549.78 1082.88L1523.44 1056.54L1403.66 906.69L1375.19 882.49L1343.51 862.91L1288.34 843.69L1246.51 837.82L1194.37 846.36L1067.47 901.53L991.48 925.38L914.24 943.89L903.74 943.53L890.39 934.99L883.81 904.2L876.69 896.37L866.37 894.59L838.07 910.61L813.87 936.41");g.strokeStyle=dark?"rgba(52,58,70,.75)":"rgba(176,188,198,.6)";g.lineWidth=34;g.stroke(p);g.strokeStyle=dark?"rgba(10,11,14,.95)":"rgba(247,250,251,.95)";g.lineWidth=12;g.stroke(p)}paintCir(false);
const ctex=new THREE.CanvasTexture(cc);ctex.encoding=THREE.sRGBEncoding;
const cir=new THREE.Mesh(new THREE.PlaneGeometry(16,9),new THREE.MeshBasicMaterial({map:ctex,transparent:true,depthWrite:false}));cir.position.z=-2;cir.renderOrder=-.5;scene.add(cir);
/* subject = portrait plane + helmet */
const subj=new THREE.Group();scene.add(subj);
const PW=5.9,PH=PW*717/834,HX=0,HY=(.5-.324)*PH;
const tex=new THREE.TextureLoader().load(IMG,()=>checkReady(),undefined,()=>{loadErr="portrait";checkReady()});
tex.minFilter=THREE.LinearMipmapLinearFilter;
const headMat=new THREE.ShaderMaterial({transparent:true,uniforms:{uTex:{value:tex},uPar:{value:new THREE.Vector2()}},
 vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
 fragmentShader:`uniform sampler2D uTex;uniform vec2 uPar;varying vec2 vUv;
 void main(){float d=exp(-pow(length((vUv-vec2(.5,.676))*vec2(1.,1.5))*2.8,2.));vec2 uv=vUv+uPar*(d-.35)*.01;
 vec4 c=texture2D(uTex,uv);float lt=1.+(d-.3)*uPar.x*.35+(d-.3)*(-uPar.y)*.2;float sf=smoothstep(0.,.06,uv.x)*smoothstep(0.,.06,1.-uv.x);gl_FragColor=vec4(c.rgb*lt,c.a*sf);}`});
const head=new THREE.Mesh(new THREE.PlaneGeometry(PW,PH),headMat);subj.add(head);

const hg=new THREE.Group(),pivot=new THREE.Group();hg.position.set(HX,HY,.35);hg.add(pivot);subj.add(hg);
const RY=235/717*PH;let helmetReady=false;
const wireMat=new THREE.ShaderMaterial({wireframe:true,transparent:true,depthWrite:false,uniforms:{uT:{value:0},uMix:{value:0},uC:{value:0},uH:{value:1}},
 vertexShader:"varying float vH;uniform float uC,uH;void main(){vec4 wp=modelMatrix*vec4(position,1.);vH=(wp.y-uC)/(2.*uH)+.5;gl_Position=projectionMatrix*viewMatrix*wp;}",
 fragmentShader:`varying float vH;uniform float uT,uMix;void main(){float w=.15,P=3.1,S=1.2,st=1.+w*3.,tv=1.+w*6.,wave=0.;
 for(int i=0;i<4;i++){float age=mod(uT,S)+float(i)*S;if(age>P)break;float c=st-(age/P)*tv;float d=(vH-c)/w;wave=max(wave,exp(-d*d));}
 gl_FragColor=vec4(vec3(.36,.38,.4),wave*.14*uMix);}`});
new THREE.GLTFLoader().load("/models/helmet.glb",g=>{const r=g.scene;let m0=null;
 r.traverse(o=>{if(o.isMesh){mask(o.material);o.material.envMapIntensity=1.4;o.renderOrder=1;m0=o}});
 const bb=new THREE.Box3().setFromObject(r),sz=bb.getSize(new THREE.Vector3());r.scale.setScalar(RY*2.2/sz.y);
 bb.setFromObject(r);r.position.sub(bb.getCenter(new THREE.Vector3()));
 if(m0){const w=new THREE.Mesh(m0.geometry,wireMat);w.renderOrder=3;m0.add(w)}
 pivot.add(r);helmetReady=true;checkReady()},undefined,()=>{loadErr="casque 3D";checkReady()});
/* ---- sizing ---- */
let W=1,H=1,visH=4.1,S=1;
function resize(){W=hero.clientWidth;H=hero.clientHeight;renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix();
 visH=2*6.5*Math.tan(17.5*DEG);U.uAsp.value=W/H;const bh=visH*1.06;bd.scale.set(bh*W/H,bh*1.33,1);const ch=2*8.5*Math.tan(17.5*DEG)*.98;cir.scale.set(ch/9,ch/9,1);
 S=visH/PH*(W<700?.64:W<900?.92:1.02);wireMat.visible=!(coarse||W<700);subj.scale.setScalar(S)}
const ptr={x:0,y:0},sm={x:0,y:0},last={x:0,y:0};let seen=false,tilt=0,yaw=0,pace=0;
const coarse=matchMedia("(hover:none)").matches;
addEventListener("pointermove",e=>{if(coarse)return;const r=hero.getBoundingClientRect();ptr.x=(e.clientX-r.left)/W*2-1;ptr.y=(e.clientY-r.top)/H*2-1;if(!seen){seen=true;sm.x=last.x=ptr.x;sm.y=last.y=ptr.y}});
const TV=new THREE.Vector3();let t0=null,riseAt=null,introAt=null;
function render(now){
 const t=now/1000;U.uTime.value=t*1.25;
 if(introAt!==null)U.uIntro.value=RM?1:Math.min(1,(now-introAt)/4000);
 const eased=(a,b)=>a;sm.x+=(ptr.x-sm.x)*.17;sm.y+=(ptr.y-sm.y)*.17;
 const step=Math.hypot(sm.x-last.x,sm.y-last.y);const tg=Math.min(1,step/.029);pace+=(tg-pace)*(tg>pace?.09:.205);last.x=sm.x;last.y=sm.y;
 U.uPace.value=coarse?0:pace;
 const o=trail.pop();o.set(sm.x,-sm.y);trail.unshift(o);
 tilt+=(sm.y*2.5*DEG-tilt)*.17;yaw+=(sm.x*2.1*DEG-yaw)*.17;pivot.rotation.x=tilt;pivot.rotation.y=yaw;
 let rm=1;if(riseAt!==null){const u=Math.min(1,(now-riseAt)/2000);rm=(1-u)*(1-u)}
 subj.position.x=-HX*S;subj.position.y=-visH/2+PH*S/2-rm*200*(visH/H);
 cir.position.x=-sm.x*.14;cir.position.y=.15-sm.y*.08;
 wireMat.uniforms.uT.value=t;pivot.getWorldPosition(TV);wireMat.uniforms.uC.value=TV.y;wireMat.uniforms.uH.value=RY*S*1.1;const f=U.uIntro.value,bp=Math.min(1,Math.max(0,(f-.14)/.86));wireMat.uniforms.uMix.value=bp*bp*(3-2*bp);
 renderer.render(scene,camera)}

/* ---- stack recede ---- */
const L=$("#L0"),inner=L.querySelector(".in"),shade=L.querySelector(".shade"),nxt=$("#projets");
function recede(){const v=innerHeight,p=Math.min(1,Math.max(0,1-nxt.getBoundingClientRect().top/v)),ph=matchMedia("(max-width:639px)").matches;
 inner.style.transform=p>0&&!ph?`scale(${1-.1*p})`:"";shade.style.opacity=.55*p;inner.style.visibility=p>=1?"hidden":"visible"}
let tk=0;addEventListener("scroll",()=>{if(!tk)tk=requestAnimationFrame(()=>{tk=0;recede()})},{passive:true});
/* ---- page entrance ---- */
function begin(){
 riseAt=performance.now();document.body.classList.add("go");
 document.querySelectorAll("[data-r]").forEach(el=>rise(el,+el.dataset.r,el.id==="pn"?"1.25rem":"0.75rem"));
 ws.forEach((w,i)=>spring(x=>{w.style.opacity=Math.min(1,x);w.style.transform=`translateY(${.35*(1-x)}em)`},90,26,180+i*110));
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;io.disconnect();
  w2.forEach((w,i)=>spring(x=>{w.style.opacity=Math.min(1,x);w.style.transform=`translateY(${.35*(1-x)}em)`},90,26,i*130));
  const r=$(".rule");spring(x=>r.style.transform=`scaleX(${x})`,90,26,260);rise($(".lead"),340);
  document.querySelectorAll(".item").forEach((it,i)=>rise(it,480+i*110,"1rem",170,24))}),{threshold:.2});io.observe($("#projets"))}
/* ---- loader ---- */
let target=.7,done=false;
function checkReady(){if(done)return;if(!loadErr&&(!tex.image||!helmetReady))return;done=true;
 if(loadErr){banner("Échec du chargement : "+loadErr)}
 resize();renderer.compile(scene,camera);U.uPace.value=0;renderer.render(scene,camera);ready=true;target=1;introAt=performance.now()}
let lifted=false;
function loop(now){
 stepSprings(now);prog+=(target-prog)*(ready?.2:.03);vf.style.setProperty("--p",prog*100+"%");vm.style.transform=`scaleX(${prog})`;SL.forEach((d,i)=>d.classList.toggle("on",!lifted&&prog>(i+.6)/5));
 if(ready&&!lifted&&prog>.995){lifted=true;prog=1;const v=$("#veil");
  spring(a=>{vf.parentElement.style.opacity=1-a;vn.style.opacity=1-a;vf.parentElement.style.transform=`translateY(${-.75*a}rem)`},140,26,0);
  setTimeout(()=>{spring(a=>{v.style.opacity=1-a;if(a>=.996)v.remove()},70,24,0);v.style.pointerEvents="none";begin()},670)}
 if(done&&scrollY<=innerHeight*1.15&&!document.hidden)render(now);
 requestAnimationFrame(loop)}
requestAnimationFrame(loop);
addEventListener("resize",()=>{if(done)resize();recede()});
const gp=$("#gp"),pa=$("#gpa"),pb=$("#gpb"),dot=$("#gpm"),gcs=$("#gpc"),GL=pb.getTotalLength(),stops=[...document.querySelectorAll(".stop")];
pa.style.strokeDasharray=GL;pa.style.strokeDashoffset=GL;
const cps=stops.map(st=>{const f=+st.dataset.at,pt=pb.getPointAtLength(Math.min(f,.999)*GL),r=document.createElementNS("http://www.w3.org/2000/svg","rect");r.setAttribute("x",pt.x-17);r.setAttribute("y",pt.y-17);r.setAttribute("width",34);r.setAttribute("height",34);r.setAttribute("transform",`rotate(45 ${pt.x} ${pt.y})`);gcs.appendChild(r);return r});
function gpp(){const r=gp.getBoundingClientRect(),v=innerHeight,s=r.top-v*.35,e=r.bottom-v*.65,len=Math.abs(s-e)||1,p=Math.min(1,Math.max(0,1-(s+len)/len));
 pa.style.strokeDashoffset=GL*(1-p);const pt=pb.getPointAtLength(Math.min(p,.999)*GL);dot.setAttribute("transform",`translate(${pt.x} ${pt.y})`);
 stops.forEach((st,i)=>{const on=p>=+st.dataset.at-.2;st.classList.toggle("on",on);cps[i].classList.toggle("hit",p>=+st.dataset.at-.01)})}
addEventListener("scroll",gpp,{passive:true});addEventListener("resize",gpp);gpp();
const mn=$("#mn"),bgb=$(".bg");function tgl(o){mn.hidden=!o;bgb.setAttribute("aria-expanded",o);document.body.style.overflow=o?"hidden":""}bgb.onclick=()=>tgl(true);mn.addEventListener("click",e=>{if(e.target.closest("a,.x"))tgl(false)});addEventListener("keydown",e=>{if(e.key==="Escape")tgl(false)});
/* ===== theme ===== */
let DARK=document.documentElement.dataset.theme==="dark";
function setTheme(d){DARK=d;document.documentElement.dataset.theme=d?"dark":"light";try{localStorage.setItem("theme",d?"dark":"light")}catch(e){}
 const u=bd.material.uniforms;u.uBg.value.set(...(d?[.039,.043,.059]:[.9686,.9804,.9843]));u.uLn.value.set(...(d?[.13,.145,.18]:[.8745,.898,.9137]));
 renderer.setClearColor(d?0x0a0b0e:0xf7fafb);paintCir(d);ctex.needsUpdate=true;
 document.querySelectorAll(".tg2").forEach(b=>{b.setAttribute("aria-pressed",d);b.textContent=d?"☀":"☾"})}
document.querySelectorAll(".tg2").forEach(b=>b.addEventListener("click",()=>setTheme(!DARK)));setTheme(DARK);
/* ===== lap progress + chip ===== */
const secs=[["#hero","DÉPART"],["#projets","PROJETS"],["#competences","COMPÉTENCES"],["#parcours","PARCOURS"],["#stages","STAGES"],["#github","GITHUB"],["#actualites","ACTUALITÉS"],["#contact","ARRIVÉE"]].map(([s,n])=>[document.querySelector(s),n]);
const lapEl=$(".lap"),barEl=$(".lapbar i");
function lapUpd(){const mx=document.documentElement.scrollHeight-innerHeight,p=mx>0?scrollY/mx:0;barEl.style.transform=`scaleX(${p})`;
 let k=0;secs.forEach(([e,n],i)=>{if(e.getBoundingClientRect().top<innerHeight*.5)k=i});
 lapEl.innerHTML=`<b>LAP ${k+1}/${secs.length}</b>${i18nTr(secs[k][1])}`;lapEl.classList.toggle("on",scrollY>innerHeight*.6)}
addEventListener("scroll",lapUpd,{passive:true});lapUpd();
/* ===== cursor ring ===== */
if(matchMedia("(hover:hover) and (pointer:fine)").matches&&!RM){const cur=$(".cur");let x=-99,y=-99,tx=-99,ty=-99,s=1,ts=1;
 addEventListener("pointermove",e=>{tx=e.clientX;ty=e.clientY;cur.style.opacity=1;ts=e.target.closest&&e.target.closest("a,button,.card,.plate,.item,.pit article")?1.9:1});
 document.addEventListener("pointerleave",()=>cur.style.opacity=0);
 (function f(){x+=(tx-x)*.18;y+=(ty-y)*.18;s+=(ts-s)*.2;cur.style.transform=`translate(${x-17}px,${y-17}px) scale(${s})`;requestAnimationFrame(f)})()}
/* ===== heading scramble ===== */
function scramble(el){if(RM)return;const t=el.textContent,ch="01ABCDEF#/<>_",t0=performance.now();(function f(n){const p=Math.min(1,(n-t0)/800);el.textContent=[...t].map((c,i)=>c===" "||i<p*t.length?c:ch[Math.random()*ch.length|0]).join("");if(p<1)requestAnimationFrame(f);else el.textContent=t})(t0)}
/* ===== github counters ===== */
document.querySelectorAll(".gh b").forEach(b=>{b.dataset.v=+b.textContent;b.textContent="0"});
const gio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;gio.unobserve(e.target);e.target.querySelectorAll("b").forEach(b=>{const v=+b.dataset.v,t0=performance.now();(function f(n){const p=Math.min(1,(n-t0)/1400);b.textContent=Math.round(v*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(t0)})}),{threshold:.3});if($(".gh"))gio.observe($(".gh"));
/* ===== spotlight + magnetic ===== */
document.querySelectorAll(".card,.pit article,.gh div,.sk>div").forEach(el=>el.addEventListener("pointermove",e=>{const r=el.getBoundingClientRect();el.style.setProperty("--mx",e.clientX-r.left+"px");el.style.setProperty("--my",e.clientY-r.top+"px")}));
document.querySelectorAll(".cta,.pan nav a").forEach(el=>{el.addEventListener("pointermove",e=>{const r=el.getBoundingClientRect();el.style.translate=`${(e.clientX-r.left-r.width/2)*.18}px ${(e.clientY-r.top-r.height/2)*.3}px`});el.addEventListener("pointerleave",()=>{el.style.translate=""})});

document.querySelectorAll(".rv").forEach(el=>{el.style.opacity=0;const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();rise(el,+(el.dataset.d||0),"1rem",110,26);if(el.tagName==="H2")scramble(el)}},{rootMargin:"0px 0px -12% 0px"});io.observe(el)});
if(!renderer.getContext()){banner("WebGL indisponible");}
