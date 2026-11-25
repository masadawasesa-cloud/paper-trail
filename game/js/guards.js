// Paper Trail — the night guards and the suite camera.
// A guard patrols a waypoint loop, pauses to scan, investigates noises and
// glimpses, chases when the alarm is real, then searches and gives up —
// the detection meter in game.js decides which state he belongs in.
'use strict';

// PT itself is declared once, in config.js - every file shares that object.

PT.Guard = class Guard {
  constructor(spec) {
    this.waypoints = spec.waypoints;
    this.wpIndex = spec.start || 0;
    const [sx, sy] = this.waypoints[this.wpIndex];
    this.x = sx;
    this.y = sy;
    const [tx, ty] = this.waypoints[(this.wpIndex + 1) % this.waypoints.length];
    this.facing = Math.atan2(ty - sy, tx - sx);
    this.state = 'patrol'; // patrol | suspicious | chase | search | return
    this.pauseTimer = 0;
    this.scanPhase = Math.random() * Math.PI * 2;
    this.lastSeen = null;
    this.searchTimer = 0;
    this.stepTimer = Math.random() * PT.GUARD.stepEvery;
    this.moving = false;
  }

  // Walk toward a point; returns true on arrival. Facing follows the walk.
  walkTo(x, y, speed, dt, solids) {
    const dx = x - this.x;
    const dy = y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      this.moving = false;
      return true;
    }
    const step = Math.min(dist, speed * dt);
    const [nx, ny] = PT.moveCircle(this.x, this.y, PT.GUARD.radius, (dx / dist) * step, (dy / dist) * step, solids);
    this.x = nx;
    this.y = ny;
    const target = Math.atan2(dy, dx);
    this.facing = turnToward(this.facing, target, 7.5 * dt);
    this.moving = true;
    return false;
  }

  // Stand still and sweep the head slowly, the way a bored guard scans a room.
  scan(dt, centre) {
    this.moving = false;
    this.scanPhase += dt * 1.6;
    const target = centre + Math.sin(this.scanPhase) * 0.65;
    this.facing = turnToward(this.facing, target, 3.2 * dt);
  }

  update(dt, view) {
    // view: { player, solids, seesPlayer, heardNoiseAt }
    const p = view.player;
    this.stepTimer -= dt;

    if (this.state === 'chase') {
      if (view.seesPlayer) this.lastSeen = { x: p.x, y: p.y };
      if (this.lastSeen) {
        if (this.walkTo(this.lastSeen.x, this.lastSeen.y, PT.GUARD.chaseSpeed, dt, view.solids) && !view.seesPlayer) {
          this.state = 'search';
          this.searchTimer = 2.6;
        }
      }
    } else if (this.state === 'search') {
      // Walk to the last place he saw or heard something, then look around.
      if (this.lastSeen && PT.distance(this.x, this.y, this.lastSeen.x, this.lastSeen.y) > 30) {
        this.walkTo(this.lastSeen.x, this.lastSeen.y, PT.GUARD.investigateSpeed, dt, view.solids);
      } else {
        this.searchTimer -= dt;
        this.scan(dt, this.facing);
        if (this.searchTimer <= 0) this.state = 'return';
      }
    } else if (this.state === 'suspicious') {
      // Freeze and stare at whatever moved. game.js promotes or releases him.
      this.moving = false;
      if (this.lastSeen) {
        const target = Math.atan2(this.lastSeen.y - this.y, this.lastSeen.x - this.x);
        this.facing = turnToward(this.facing, target, 6 * dt);
      }
    } else if (this.state === 'return') {
      const [tx, ty] = this.waypoints[this.wpIndex];
      if (this.walkTo(tx, ty, PT.GUARD.investigateSpeed, dt, view.solids)) {
        this.state = 'patrol';
        this.pauseTimer = 0.4;
      }
    } else {
      // patrol
      if (view.heardNoiseAt) {
        this.lastSeen = view.heardNoiseAt;
        this.state = 'search';
        this.searchTimer = 1.6;
      } else if (this.pauseTimer > 0) {
        this.pauseTimer -= dt;
        this.scan(dt, this.scanCentre ?? this.facing);
      } else {
        const [tx, ty] = this.waypoints[this.wpIndex];
        if (this.walkTo(tx, ty, PT.GUARD.patrolSpeed, dt, view.solids)) {
          this.scanCentre = this.facing;
          this.pauseTimer = 1.1;
          this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
        }
      }
    }

    // Footsteps the player can hear — louder the closer the guard is.
    if (this.moving && this.stepTimer <= 0) {
      const d = PT.distance(this.x, this.y, p.x, p.y);
      const volume = Math.max(0, 0.16 * (1 - d / 460));
      if (volume > 0.01) PT.Audio.step(volume);
      this.stepTimer = PT.GUARD.stepEvery * (PT.GUARD.patrolSpeed / (this.state === 'chase' ? PT.GUARD.chaseSpeed : PT.GUARD.patrolSpeed));
    }
  }
};

// A wall camera: it never moves, but its cone sweeps and it feeds the same
// detection meter. It cannot chase — it can only watch you be caught.
PT.Camera = class Camera {
  constructor(spec) {
    this.x = spec.x;
    this.y = spec.y;
    this.baseAngle = spec.baseAngle;
    this.sweep = spec.sweep;
    this.speed = spec.speed;
    this.range = spec.range;
    this.phase = 0;
    this.facing = spec.baseAngle;
  }

  update(dt) {
    this.phase += dt * this.speed;
    this.facing = this.baseAngle + Math.sin(this.phase) * this.sweep;
  }
};

// Rotate `angle` toward `target` by at most `maxStep`, along the short way.
function turnToward(angle, target, maxStep) {
  let diff = target - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) <= maxStep) return target;
  return angle + Math.sign(diff) * maxStep;
}
PT.turnToward = turnToward;
