import { slab, line, k, P } from "./parts.mjs";

// The front section is removed from both vessel and water so the immersed wick is visible.
// These are the actual sectioned volumes, rather than transparent walls or hidden edges.
export function wetBulb() {
  const x = -116, y = 25;
  slab("station", "wetbulb.arm", {x:x-3,y:-14,w:6,d:42,r:1},54,4);
  slab("station", "wetbulb.collar", {x:x-3,y:y-3,w:6,d:6,r:.7},52,2);
  const wick = {x:x-2,y:y-2,w:4,d:4,r:0};
  const weave = Array.from({length:9},(_,i)=>line(k.sideSeam(wick,19+i*3.7,P,1),{tone:"faint"})).join("");
  slab("station", "wetbulb.wick-exposed",wick,17,35,{className:"iot-wick"},weave);
  slab("station", "wetbulb.wick-immersed", {x:x-2,y:y-2,w:4,d:4,r:0},3,14,{className:"iot-wick iot-wick-immersed"});
  const tank = {x:x-16,y:10,w:32,d:30,r:0};
  slab("station", "wetbulb.reservoir-floor",tank,0,3);
  slab("station", "wetbulb.reservoir-back",{x:tank.x,y:10,w:32,d:2,r:0},3,20);
  slab("station", "wetbulb.reservoir-left",{x:tank.x,y:12,w:2,d:28,r:0},3,20);
  slab("station", "wetbulb.reservoir-right-back",{x:x+14,y:12,w:2,d:11,r:0},3,20);
  slab("station", "wetbulb.reservoir-right-lip",{x:x+14,y:23,w:2,d:17,r:0},3,4);
  slab("station", "wetbulb.reservoir-front-lip",{x:x-14,y:38,w:28,d:2,r:0},3,4);
  // The front/right quadrant is cut through the water and vessel together.
  slab("station", "wetbulb.water-back",{x:x-14,y:12,w:28,d:11,r:0},3,14,{className:"iot-wet-water"});
  slab("station", "wetbulb.water-left",{x:x-14,y:23,w:12,d:15,r:0},3,14,{className:"iot-wet-water"});
  // Graduations terminate at the real front edge of the remaining side wall.
  for (const z of [10,17,21]) {
    const path = k.pathOf([[x+16,19,z],[x+16,23,z]].map(point=>k.iso(point,P)));
    slab("station", `wetbulb.level-${z}`,{x:x+16,y:19,w:.25,d:4,r:0},z,.25,{},line(path,{tone:"hi"}));
  }
}
