import { k, P, slab, cylinder, sphere, cuff, screws, slotted, line, BENCH } from "./parts.mjs";

export function bench() {
  k.corners(BENCH, 22).forEach(([x,y], i) => cylinder("bench", `stand.foot-${i}`, x, y, 7, -17, 7));
  slab("bench", "stand.deck", BENCH, -10, 10, { tone: "lo" }, line(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: "faint" }));
  screws("bench", "stand.screw", k.insetPlan(BENCH, 7), 0);
}

export function station() {
  const x = -116, y = -22;
  slab("station", "station.foot", { x:x-24,y:y-22,w:48,d:44,r:5 }, 0, 4);
  screws("station", "station.mount", { x:x-24,y:y-22,w:48,d:44,r:5 }, 4);
  cylinder("station", "station.flange", x, y, 9, 4, 4);
  cylinder("station", "station.mast", x, y, 3.2, 8, 46);
  cylinder("station", "station.upper-mast", x, y, 3.2, 63, 20);
  cylinder("station", "station.collar", x, y, 5, 58, 5);
  cylinder("station", "station.globe-stem", x, y, 2, 83, 5);
  sphere("station", "station.globe", [x,y,105], 17, { className: "iot-globe", tone: "hi" });
  // The radiation shield's plates are supported by the same central sensor core.
  slab("station", "station.arm", {x:x-3,y:y+2,w:30,d:6,r:1}, 54, 4);
  for(let i=0;i<6;i++) cylinder("station", `station.shield-core-${i}`, x+25,y+5,3,60.2+i*5,2.8);
  for(let i=0;i<6;i++) cylinder("station", `station.louver-${i}`, x+25,y+5,10,58+i*5,2.2);
  cylinder("station", "station.shield-cap", x+25,y+5,11,88,3);
  const control = {x:x-20,y:y+10,w:35,d:19,r:3};
  slab("station", "station.controller", control, 4, 21);
  slab("station", "station.controller-lid", control, 25, 1.5);
  slab("station", "station.display", {x:x-15,y:y+14,w:23,d:8,r:1}, 26.5, .4, {className:"iot-display"});
  for(let i=0;i<2;i++) cylinder("station", `station.button-${i}`,x-12+i*10,y+25,1.7,26.5,1);
  cylinder("station", "station.led", x+10,y+25,1.3,26.5,1, {className:"iot-led iot-station-led",lit:true});
  slab("station", "station.solar-bracket", {x:x-20,y:y-29,w:4,d:10,r:1},4,38);
  const panel={x:x-33,y:y-48,w:52,d:27,r:2};
  slab("station", "station.solar-frame",panel,42,2);
  for(let i=0;i<6;i++) slab("station",`station.solar-cell-${i}`,{x:panel.x+3+(i%3)*16,y:panel.y+3+Math.floor(i/3)*11,w:14,d:9,r:.3},44,.3,{className:"iot-solar"});
}

export function water() {
  const x=-24,y=24,body={x:x-18,y:y-18,w:36,d:36,r:4};
  slab("water","water.plinth",{x:x-22,y:y-22,w:44,d:46,r:5},0,4);
  slab("water","water.cabinet",body,4,55,{},line(k.sideSeam(body,14,P,5),{tone:"faint"}));
  slab("water","water.lid",body,59,2);
  cylinder("water","water.reservoir-seat",x,y,12,61,3);
  cylinder("water","water.reservoir",x,y,12,64,24,{className:"iot-reservoir"});
  cylinder("water","water.reservoir-cap",x,y,10,88,2);
  slab("water","water.nozzle-seat",{x:x-3,y:y+18,w:6,d:6,r:1},36,5);
  cylinder("water","water.nozzle",x,y+21,1.5,32,4);
  slab("water","water.drip-support",{x:x-14,y:y+18,w:28,d:14,r:2},4,8);
  slab("water","water.drip-tray",{x:x-14,y:y+18,w:28,d:14,r:2},12,1);
  slotted("water","water.drip-slot",{x:x-9,y:y+20,w:1,d:9},13,5);
  const reader={x:x+25,y:y-8,w:24,d:34,r:3};
  slab("water","water.reader-base",reader,0,7);
  slab("water","water.reader-face",k.insetPlan(reader,2),7,1,{className:"iot-display"});
  cylinder("water","water.reader-led",x+37,y+21,1.4,7,1,{className:"iot-led iot-water-led",lit:true});
  const card={x:x+29,y:y-2,w:16,d:22,r:1.5};
  slab("water","water.card",card,8,.7,{tone:"hi"});
  slab("water","water.card-chip",{x:card.x+3,y:card.y+3,w:5,d:4,r:.4},8.7,.2,{className:"iot-solar"});
  slab("water","water.card-print",{x:card.x+3,y:card.y+13,w:10,d:1.5,r:.3},8.7,.2);
}

export function band() {
  const x=104,y=34;
  slab("band","band.dock",{x:x-24,y:y-28,w:48,d:56,r:8},0,3);
  cuff("band","band.cuff",[x,y,28]);
  const body={x:x-15,y:y-10,w:30,d:20,r:5};
  slab("band","band.housing",body,53,6);
  slab("band","band.bezel",k.insetPlan(body,2),59,1);
  slab("band","band.optical-window",{x:x-10,y:y-6,w:20,d:11,r:3},60,.4,{className:"iot-display"});
  cylinder("band","band.led",x,y+8.5,1.1,60,.5,{className:"iot-led iot-band-led",lit:true});
  slab("band","band.button",{x:x+15,y:y-4,w:2,d:8,r:1},54,3);
  for(let i=0;i<3;i++) cylinder("band",`band.contact-${i}`,x-12,y-5+i*5,1,60,.4);
}

export function gateway() {
  const body={x:67,y:-71,w:68,d:40,r:5};
  k.corners(body,5).forEach(([x,y],i)=>cylinder("gateway",`gateway.foot-${i}`,x,y,2,0,2));
  slab("gateway","gateway.body",body,2,15);
  slab("gateway","gateway.lid",body,17,2);
  screws("gateway","gateway.screw",body,19);
  slotted("gateway","gateway.vent",{x:82,y:-62,w:1,d:15},19,7);
  for(let i=0;i<2;i++) {
    cylinder("gateway",`gateway.antenna-base-${i}`,74+i*53,-64,2.5,19,3);
    cylinder("gateway",`gateway.antenna-${i}`,74+i*53,-64,1,22,28);
  }
  for(let i=0;i<3;i++) cylinder("gateway",`gateway.led-${i}`,86+i*10,-35,1,19,1,{className:"iot-led iot-gateway-led",lit:true});
}
