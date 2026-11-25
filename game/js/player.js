// Paper Trail — the insider: movement, tiptoeing, hiding and noise.
// Walking is fast and audible; SHIFT tiptoes — slow, silent, and a little
// harder to spot. Standing in a shadow zone (or inside the planter shrubs)
// slows the guards' detection further.
'use strict';

// PT itself is declared once, in config.js - every file shares that object.

PT.Player = class Player {
  constructor(spawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.facing = -Math.PI / 2;
    this.moving = false;
    this.sneaking = false;
    this.stepTimer = 0;
  }

  inShadow(level) {
    for (const s of level.shadows) {
      if (PT.pointInRect(this.x, this.y, s)) return true;
    }
    return false;
  }

  // True while making noise a guard could hear: moving at full pace.
  get noisy() {
    return this.moving && !this.sneaking;
  }

  update(dt, level) {
    const [mx, my] = PT.Keys.moveVector();
    this.sneaking = PT.Keys.sneaking();
    this.moving = mx !== 0 || my !== 0;
    if (!this.moving) return;
    const speed = this.sneaking ? PT.PLAYER.sneakSpeed : PT.PLAYER.walkSpeed;
    const [nx, ny] = PT.moveCircle(
      this.x, this.y, PT.PLAYER.radius, mx * speed * dt, my * speed * dt, level.solids,
    );
    this.x = nx;
    this.y = ny;
    this.facing = Math.atan2(my, mx);
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      PT.Audio.ownStep();
      this.stepTimer = this.sneaking ? 0.42 : 0.3;
    }
  }
};
