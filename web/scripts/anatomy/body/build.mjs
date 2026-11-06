import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import * as k from "../vendor/iso-kit.mjs";
import * as G from "../vendor/lathe.mjs";
import * as A from "../vendor/audit.mjs";

// Figure concept: a cutaway anatomical teaching mannequin on a foot plate.
// 70+ solid pieces: plinth/feet/screws, limb castings/joints, rear torso and side rails,
// eight vertebrae, six paired ribs, lungs/heart/renal system, neck/skull/face and cuff.
// The shell is a joined casting; organs are mounted to its rear wall. No decorative floating solids.
const views={};
for(const [view,azimuth] of [["front",55],["back",235]]) {
 const P=k.fitProjection([...k.boxCorners({x:-54,y:-27,w:108,d:66},-4,12),[-44,-12,290],[44,16,290]],480,610,{pad:32,azimuth,elevation:25});
 const R=A.recorder(P);
 const at=p=>k.iso(p,P);
 let count=0;
 function put(name,paths,shape,point,region="shell",style={}) {
  count++;
  const svg=`<g data-body-part="${name}" data-region="${region}">${k.solidSvg(paths,{tone:"mid",crease:"none",...style})}</g>`;
  R.put({name,at:point,svg,shapes:[R.solid(shape)]});
 }
 function slab(name,plan,z,h,region="shell",style={}) {put(name,k.slabOf(plan,z,h,P,8,.35),A.slab(plan,z,h,{name,owner:region==="base"?"plinth":"mannequin"},8),[plan.x+plan.w/2,plan.y+plan.d/2,z+h/2],region,style)}
 function ball(name,p,r,region="shell") {put(name,G.sphereOf(p,r,P,{steps:40}),A.ball(p,r,{name,owner:"mannequin"}),p,region)}
 function turned(name,origin,axis,profile,region="shell") {const F=G.frameAlong(origin,axis);put(name,G.lathe(profile,F,P,{steps:40,smooth:true}),A.lathe(F,profile,{name,owner:"mannequin"}),G.add3(origin,G.mul3(axis,(profile[0][0]+profile.at(-1)[0])/2)),region)}
 function rod(name,from,to,r0,r1,region="shell") {const d=G.sub3(to,from),length=G.len3(d);turned(name,from,G.unit3(d),[[0,0],[0,r0],[length,r1],[length,0]],region)}
 function prism(name,poly,y0,y1,region="shell") {
  const F={o:[0,0,0],a:[0,1,0],u:[1,0,0],v:[0,0,1]};
  const paths=G.prismOf(F,poly,y0,y1,P);
  const point=[poly.reduce((s,p)=>s+p[0],0)/poly.length,(y0+y1)/2,poly.reduce((s,p)=>s+p[1],0)/poly.length];
  put(name,paths,A.prism(F,poly,y0,y1,{name,owner:"mannequin"}),point,region);
 }
 slab("stand.plinth",{x:-51,y:-23,w:102,d:61,r:13},0,7,"base");
 for(const [i,[x,y]] of k.corners({x:-42,y:-15,w:84,d:44,r:5},4).entries()) {
  turned(`stand.foot-${i}`,[x,y,-4],[0,0,1],[[0,0],[0,3],[4,3],[4,0]],"base");
  turned(`plinth-screw-${i}`,[x,y,7],[0,0,1],[[0,0],[0,1.4],[.4,1.4],[.4,0]],"base");
 }
 for(const side of [-1,1]) {
  const x=side*10;
  slab(`foot-${side}`,{x:x-5.5,y:-7,w:11,d:25,r:4.5},7,7);
  turned(`ankle-calf-${side}`,[x,0,14],[0,0,1],[[0,0],[0,4],[10,4.8],[24,6],[45,7.6],[62,5.5],[67,5.5],[67,0]]);
  turned(`knee-${side}`,[x,0,81],[0,0,1],[[0,0],[0,5.5],[5,6.7],[12,6],[12,0]]);
  turned(`thigh-${side}`,[x,0,93],[0,0,1],[[0,0],[0,6],[16,7.5],[40,9],[58,9],[58,0]]);
 }
 prism("pelvis",[[-18,171],[-20,161],[-17,151],[17,151],[20,161],[18,171]],-8,-3);
 const torso=[[-18,171],[-16,188],[-18,212],[-20,237],[-18,246],[-7,246],[7,246],[18,246],[20,237],[18,212],[16,188],[18,171]];
 prism("rear-torso-casting",torso,-8,-3);
 for(const side of [-1,1]) prism(`torso-side-${side}`,[[side*16,173],[side*18,174],[side*19,211],[side*20,237],[side*20,241],[side*15,211]],-3,9);
 for(let i=0;i<8;i++) slab(`vertebra-${i}`,{x:-2.4,y:-3,w:4.8,d:5,r:1.6},174+i*8,6.3,"exposure");
 for(const side of [-1,1]) {
  for(let i=0;i<3;i++) {
   const z=217+i*8;
   rod(`rib-outer-${side}-${i}`,[side*19.4,9.95,z+4],[side*11,11.2,z],1.15,1.1);
   rod(`rib-inner-${side}-${i}`,[side*11,11.2,z],[side*.8,11.2,z-2],1.1,1.05);
  }
  prism(`lung-${side}`,Array.from({length:32},(_,j)=>[side*9+6*Math.cos(j/32*Math.PI*2),225+15*Math.sin(j/32*Math.PI*2)]),-3,5,"heat");
  // Bean-shaped renal teaching inserts; medial indentation faces the spine.
  const bean=[[-2,-11],[-6,-10],[-8,-5],[-8,3],[-5,10],[0,12],[5,9],[6,4],[3,1],[2,-2],[5,-5],[4,-9],[0,-11]];
  const poly=bean.map(([x,z])=>[side*(10+x*.64),185+z]);
  prism(`kidney-${side}`,poly,-3,4,"kidneys");
  rod(`renal-vessel-${side}`,[side*1.25,4.8,187],[side*7,4.8,187],.8,.8,"kidneys");
  rod(`ureter-${side}`,[side*8.7,0,174],[side*4.8,0,164],.8,.8,"kidneys");
 }
 prism("heart",[[-2,216],[-6,222],[-5,229],[-1,231],[3,228],[3,223]],5,9,"band");
 rod("aorta-upper",[0,4.8,216],[0,4.8,187.8],1.2,1.2,"hydration");
 rod("aorta-lower",[0,4.8,186.2],[0,4.8,176],1.2,1.2,"hydration");
 rod("sternum",[0,11.2,213],[0,11.2,237],.8,.8);
 prism("bladder",Array.from({length:24},(_,j)=>[4*Math.cos(j/24*Math.PI*2),164+4*Math.sin(j/24*Math.PI*2)]),-3,3,"hydration");
 turned("neck",[0,0,246],[0,0,1],[[0,0],[0,6],[11,5.5],[11,0]]);
 turned("head",[0,0,257],[0,0,1],[[0,0],[0,5.5],[5,9],[13,12],[23,11.5],[31,7],[33,0]],"heat");
 ball("nose",[0,13.8,275],2,"heat");
 for(const side of [-1,1]) {
  ball(`ear-${side}`,[side*13.7,0,276],2);
  turned(`shoulder-${side}`,[side*20,0,236],[side,0,0],[[0,0],[0,3],[6,5],[11,5],[11,0]]);
  turned(`upper-arm-${side}`,[side*29,0,198],[0,0,1],[[0,0],[0,4.9],[12,5.31],[20,5.31],[33,6.1],[33,0]]);
  turned(`elbow-${side}`,[side*29,0,191],[0,0,1],[[0,0],[0,4.7],[4,5.4],[7,4.9],[7,0]]);
  rod(`forearm-${side}`,[side*29,0,191],[side*29,0,162],4.7,3.1);
  turned(`hand-${side}`,[side*29,0,147],[0,0,1],[[0,0],[0,2.5],[5,4],[12,3.3],[15,3.1],[15,0]]);
 }
 for(let i=0;i<8;i++) {
  const a=i/8*Math.PI*2,b=(i+1)/8*Math.PI*2;
  const polygon=[[5.75,a],[6.7,a],[6.7,b],[5.75,b]].map(([r,t])=>[29+r*Math.cos(t),r*Math.sin(t)]);
  put(`band-strap-${i}`,k.extrude(polygon,210,8,P),A.extruded(polygon,210,8,{name:`band-strap-${i}`,owner:"mannequin"}),[29+6.2*Math.cos((a+b)/2),6.2*Math.sin((a+b)/2),214],"band");
 }
 slab("band-bezel",{x:24,y:6.7,w:10,d:4.5,r:1.8},210,7,"band");
 slab("band-screen",{x:25,y:7.3,w:8,d:3.7,r:1},217,0.6,"band",{lit:true});
 A.settle(R,P);
 const art=R.items.toSorted((a,b)=>a.key-b.key).map(item=>item.svg).join("");
 const anchors={heat:at([-2,10,281]),hydration:at([-10,12,202]),band:at([29,10,214]),kidneys:at([9,6,185]),exposure:at([-12,7,115])};
 views[view]={art,anchors,parts:count};
 console.log(`${view}: ${count} physical solids; ${(art.length/1024).toFixed(0)}KiB`);
 A.auditOrExit(R,P);
}
mkdirSync("src/components/figures/worker-body",{recursive:true});
writeFileSync("src/components/figures/worker-body/generated.ts",`// Generated locally by scripts/anatomy/body/build.mjs using the MIT Anatomy kit.\nexport const BODY_VIEWS=${JSON.stringify(views)} as const\n`);

if(process.argv.includes("--review")) {
 const css=readFileSync("src/app/globals.css","utf8").replace(/^@import.*$/gm,"")+readFileSync("src/app/styles/anatomy-kit.css","utf8")+readFileSync("src/app/styles/body-monitor.css","utf8");
 mkdirSync("output/anatomy-body",{recursive:true});
 for(const theme of ["light","dark"]) for(const [view,data] of Object.entries(views)) writeFileSync(`output/anatomy-body/${view}-${theme}.html`,`<!doctype html><html class="${theme}"><head><meta charset="utf-8"><style>${css}body{margin:0;padding:24px;background:var(--background);color:var(--foreground)}.body-map-card{width:480px;margin:auto}.body-svg{max-height:none}</style></head><body><div class="body-map-card iso" data-selected-region="kidneys"><svg class="iso-svg body-svg" viewBox="0 0 480 610">${data.art}</svg></div></body></html>`);
}
