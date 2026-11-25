// Paper Trail — geometry helpers: line of sight, vision-cone polygons and
// circle-versus-furniture collision. Pure functions, no game state in here.
'use strict';

// PT itself is declared once, in config.js - every file shares that object.

// Does segment (x1,y1)-(x2,y2) cross segment (x3,y3)-(x4,y4)?
function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (d === 0) return false;
  const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
  const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
  return t > 0.001 && t < 0.999 && u > 0.001 && u < 0.999;
}

// A rect blocks sight when its kind is solid furniture or a wall. Plants are
// stored as shadow zones instead, so they never appear in the blocker list.
function rectBlocksSight(rect) {
  return rect.kind !== 'plant';
}

// True when nothing sight-blocking stands between two points.
PT.lineOfSight = function (x1, y1, x2, y2, blockers) {
  for (const r of blockers) {
    if (!rectBlocksSight(r)) continue;
    const l = r.x, t = r.y, rr = r.x + r.w, bb = r.y + r.h;
    if (segmentsCross(x1, y1, x2, y2, l, t, rr, t)) return false;
    if (segmentsCross(x1, y1, x2, y2, rr, t, rr, bb)) return false;
    if (segmentsCross(x1, y1, x2, y2, rr, bb, l, bb)) return false;
    if (segmentsCross(x1, y1, x2, y2, l, bb, l, t)) return false;
  }
  return true;
};

// Distance from point (ox,oy) along direction (dx,dy) to a rect, or Infinity.
function rayRectDistance(ox, oy, dx, dy, r) {
  let tmin = 0;
  let tmax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (ox < r.x || ox > r.x + r.w) return Infinity;
  } else {
    let t1 = (r.x - ox) / dx;
    let t2 = (r.x + r.w - ox) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return Infinity;
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < r.y || oy > r.y + r.h) return Infinity;
  } else {
    let t1 = (r.y - oy) / dy;
    let t2 = (r.y + r.h - oy) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return Infinity;
  }
  return tmin;
}

// The visible polygon of a vision cone: cast a fan of rays, each stopped by
// the first blocker it meets, and join the endpoints.
PT.visionPolygon = function (ox, oy, facing, halfAngle, range, blockers) {
  const steps = 30;
  const points = [[ox, oy]];
  for (let i = 0; i <= steps; i++) {
    const a = facing - halfAngle + (2 * halfAngle * i) / steps;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let best = range;
    for (const r of blockers) {
      if (!rectBlocksSight(r)) continue;
      const d = rayRectDistance(ox, oy, dx, dy, r);
      if (d < best) best = d;
    }
    points.push([ox + dx * best, oy + dy * best]);
  }
  return points;
};

// Move a circle by (dx,dy), sliding along solid rects; returns the new centre.
// Movement is resolved one axis at a time so corners feel forgiving.
PT.moveCircle = function (x, y, radius, dx, dy, solids) {
  let nx = x + dx;
  for (const r of solids) {
    if (nx + radius > r.x && nx - radius < r.x + r.w && y + radius > r.y && y - radius < r.y + r.h) {
      nx = dx > 0 ? r.x - radius : r.x + r.w + radius;
    }
  }
  let ny = y + dy;
  for (const r of solids) {
    if (nx + radius > r.x && nx - radius < r.x + r.w && ny + radius > r.y && ny - radius < r.y + r.h) {
      ny = dy > 0 ? r.y - radius : r.y + r.h + radius;
    }
  }
  nx = Math.max(radius, Math.min(PT.W - radius, nx));
  ny = Math.max(PT.HUD_H + radius, Math.min(PT.H - radius, ny));
  return [nx, ny];
};

PT.pointInRect = function (x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
};

PT.distance = function (x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
};
