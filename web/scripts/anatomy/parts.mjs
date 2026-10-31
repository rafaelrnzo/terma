import * as k from "./vendor/iso-kit.mjs";
import * as G from "./vendor/lathe.mjs";
import * as A from "./vendor/audit.mjs";

export const BENCH = { x: -174, y: -91, w: 348, d: 190, r: 12 };
export const P = k.fitProjection([...k.boxCorners(BENCH, -17, 0), [-133,-39,122], [-99,-5,122], ...k.boxCorners({x:-46,y:2,w:66,d:56,r:0},0,90), ...k.boxCorners({x:80,y:6,w:48,d:56,r:0},0,61), ...k.boxCorners({x:67,y:-71,w:68,d:40,r:0},0,50)], 900, 540, { pad: 35, azimuth: 42, elevation: 32 });
export const R = A.recorder(P);
export const at = point => k.iso(point, P);
export const line = (path, options) => k.lineSvg(path, options);
let count = 0;
function put(device, name, paths, shape, point, style = {}, detail = "") {
  count++;
  const svg = `<g data-device="${device}" data-part="${name}">${k.solidSvg(paths, { tone: "mid", ...style, inner: detail })}</g>`;
  R.put({ piece: device, at: point, name, svg, shapes: [R.solid(shape)] });
}
export function slab(device, name, plan, z, height, style = {}, detail = "") {
  const meta = { name, owner: name };
  put(device, name, k.slabOf(plan, z, height, P, 5, Math.min(.6, height / 3)), A.slab(plan, z, height, meta, 5), [plan.x + plan.w / 2, plan.y + plan.d / 2, z + height / 2], style, detail);
}
export function cylinder(device, name, x, y, radius, z, height, style = {}, detail = "") {
  put(device, name, k.cylinder(x, y, radius, z, height, P, 32, .2), A.cylinder(x, y, radius, z, height, { name, owner: name }), [x, y, z + height / 2], style, detail);
}
export function sphere(device, name, point, radius, style = {}) {
  put(device, name, G.sphereOf(point, radius, P, { steps: 48 }), A.ball(point, radius, { name, owner: name }), point, style);
}
export function cuff(device, name, centre) {
  const F = G.frameAlong(centre, [1, 0, 0]);
  const profile = [[-20, 18], [-20, 25], [20, 25], [20, 18], [-20, 18]];
  put(device, name, G.lathe(profile, F, P, { steps: 64 }), A.ring(F, -20, 20, 18, 25, { name, owner: name }), centre, { className: "iot-rubber" });
}
export function screws(device, prefix, plan, z) {
  k.corners(plan, 3).forEach(([x, y], i) => cylinder(device, `${prefix}-${i}`, x, y, 1.1, z, .35, {}, line(k.ring(x, y, .65, z + .35, P, 12), { tone: "lo" })));
}
export function slotted(device, prefix, plan, z, count, along = "x") {
  for (let i = 0; i < count; i++) {
    const slot = along === "x" ? { x: plan.x + i * 4, y: plan.y, w: 1.4, d: plan.d, r: .6 } : { x: plan.x, y: plan.y + i * 4, w: plan.w, d: 1.4, r: .6 };
    slab(device, `${prefix}-${i}`, slot, z, .25, { className: "iot-recess" });
  }
}
export const partsCount = () => count;
export { k, G, A };
