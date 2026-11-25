// Paper Trail — the game itself: state machine, detection, level flow.
// Title → floor intro → play → (caught → retry) → floor clear → next floor → win.
// Also stages the deterministic scenes used for the entry screenshots (?shot=…).
'use strict';

// PT itself is declared once, in config.js - every file shares that object.

const Game = {
  state: 'title',
  levelIndex: 0,
  level: null,
  player: null,
  guards: [],
  cameras: [],
  detection: 0,
  ledgers: [false, false, false],
  floorLedgerTaken: false,
  time: 0,
  totalTime: 0,
  caughtCount: 0,
  alarmCount: 0,
  toast: '',
  toastTimer: 0,
  clearTimer: 0,
  cameraSees: false,
  frozen: false,

  loadLevel(index) {
    this.levelIndex = index;
    this.level = PT.LEVELS[index];
    this.player = new PT.Player(this.level.spawn);
    this.guards = this.level.guards.map((g) => new PT.Guard(g));
    this.cameras = this.level.cameras.map((c) => new PT.Camera(c));
    this.floorLedgerTaken = false;
    this.detection = 0;
    this.cameraSees = false;
  },

  startRun() {
    this.ledgers = [false, false, false];
    this.time = 0;
    this.caughtCount = 0;
    this.alarmCount = 0;
    this.loadLevel(0);
    this.state = 'intro';
  },

  setToast(text, seconds) {
    this.toast = text;
    this.toastTimer = seconds || 3.2;
  },

  // Can this eye (guard or camera) see the player right now?
  canSee(eye, range, halfAngle) {
    const p = this.player;
    const d = PT.distance(eye.x, eye.y, p.x, p.y);
    if (d > range) return 0;
    let diff = Math.atan2(p.y - eye.y, p.x - eye.x) - eye.facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > halfAngle) return 0;
    // Inside the planter shrubs you are foliage — unless he is right on top of you.
    const inPlant = this.level.shadows.some((s) => s.plant && PT.pointInRect(p.x, p.y, s));
    if (inPlant && d > 48) return 0;
    if (!PT.lineOfSight(eye.x, eye.y, p.x, p.y, this.level.solids)) return 0;
    return Math.max(0.22, 1.1 - d / range); // strength: closer = recognised faster
  },

  update(dt) {
    this.time += dt;
    if (this.toastTimer > 0) this.toastTimer -= dt;

    if (this.state === 'clear') {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        this.loadLevel(this.levelIndex + 1);
        this.state = 'intro';
      }
      return;
    }
    if (this.state !== 'play') return;

    this.player.update(dt, this.level);
    for (const cam of this.cameras) cam.update(dt);

    // --- who sees the player, and how clearly ---
    let strongest = 0;
    let seer = null;
    for (const g of this.guards) {
      const s = this.canSee(g, PT.GUARD.visionRange, PT.GUARD.visionHalfAngle);
      if (s > strongest) {
        strongest = s;
        seer = g;
      }
    }
    this.cameraSees = false;
    for (const cam of this.cameras) {
      const s = this.canSee(cam, cam.range, 0.5);
      if (s > 0) {
        this.cameraSees = true;
        if (s > strongest) {
          strongest = s;
          seer = null; // the camera raises the alarm but never chases
        }
      }
    }

    // --- the detection meter: fill on sight, drain in the dark ---
    const D = PT.DETECTION;
    if (strongest > 0) {
      let rate = D.baseRate * strongest;
      if (this.player.inShadow(this.level)) rate *= D.shadowFactor;
      if (this.player.sneaking) rate *= D.sneakFactor;
      this.detection = Math.min(D.max, this.detection + rate * dt);
    } else {
      const decay = this.player.inShadow(this.level) ? D.shadowDecay : D.decayRate;
      this.detection = Math.max(0, this.detection - decay * dt);
    }

    // --- guards react to the meter ---
    for (const g of this.guards) {
      const seesMe = this.canSee(g, PT.GUARD.visionRange, PT.GUARD.visionHalfAngle) > 0;
      let heard = null;
      if (this.player.noisy && PT.distance(g.x, g.y, this.player.x, this.player.y) < PT.PLAYER.noiseRadius + 10) {
        heard = { x: this.player.x, y: this.player.y };
      }
      if (seesMe) {
        g.lastSeen = { x: this.player.x, y: this.player.y };
        if (this.detection >= D.alertAt && g.state !== 'chase') {
          g.state = 'chase';
          this.alarmCount += 1;
          PT.Audio.alertSting();
        } else if (this.detection >= D.suspiciousAt && g.state === 'patrol') {
          g.state = 'suspicious';
        }
      } else if (g.state === 'suspicious' && this.detection < D.suspiciousAt - 12) {
        g.state = 'return';
      }
      g.update(dt, { player: this.player, solids: this.level.solids, seesPlayer: seesMe, heardNoiseAt: heard });
    }

    // --- caught? ---
    if (this.detection >= D.max && strongest > 0) return this.caught();
    for (const g of this.guards) {
      if (g.state === 'chase' && PT.distance(g.x, g.y, this.player.x, this.player.y) < PT.GUARD.catchDistance) {
        return this.caught();
      }
    }

    // --- the ledger ---
    if (!this.floorLedgerTaken) {
      const L = this.level.ledger;
      if (PT.distance(this.player.x, this.player.y, L.x, L.y) < 27) {
        this.floorLedgerTaken = true;
        this.ledgers[this.levelIndex] = true;
        PT.Audio.pickup();
        this.setToast('Secured: ' + this.level.ledgerName + ' — now reach the ' + this.level.exitLabel.toLowerCase());
      }
    }

    // --- the way out ---
    if (this.floorLedgerTaken && PT.pointInRect(this.player.x, this.player.y, this.level.exit)) {
      PT.Audio.floorClear();
      if (this.levelIndex === PT.LEVELS.length - 1) {
        this.state = 'win';
      } else {
        this.state = 'clear';
        this.clearTimer = 2.6;
      }
    }
  },

  caught() {
    this.state = 'caught';
    this.caughtCount += 1;
    PT.Audio.caught();
  },

  handlePresses() {
    const pressed = PT.Keys.consumePress();
    const any = Object.keys(pressed).length > 0;
    if (!any) return;
    if (this.state === 'title' && (pressed['enter'] || pressed['mouse'])) this.startRun();
    else if (this.state === 'intro') this.state = 'play';
    else if (this.state === 'caught' && pressed['r']) {
      this.loadLevel(this.levelIndex);
      this.state = 'intro';
    } else if (this.state === 'win' && pressed['enter']) this.startRun();
  },
};
PT.Game = Game;

// ---------- screenshot staging ----------
// ?shot=cover|archives|suite|title freezes a real, playable scene at a
// photogenic moment so the entry screenshots are honest renders of the game.
function stageShot(name) {
  Game.frozen = true;
  if (name === 'title') {
    Game.loadLevel(0);
    Game.state = 'title';
    return;
  }
  if (name === 'archives') {
    Game.loadLevel(0);
    Game.state = 'play';
    Game.player.x = 700;
    Game.player.y = 614;
    Game.player.facing = 0.3;
    Game.guards[0].x = 432;
    Game.guards[0].y = 452;
    Game.guards[0].facing = Math.PI / 2;
    Game.guards[1].x = 905;
    Game.guards[1].y = 128;
    Game.guards[1].facing = 0;
    Game.detection = 16;
    Game.time = 74;
    return;
  }
  if (name === 'suite') {
    Game.loadLevel(2);
    Game.state = 'play';
    Game.ledgers = [true, true, false];
    Game.floorLedgerTaken = true;
    Game.ledgers[2] = true;
    Game.player.x = 838;
    Game.player.y = 336;
    Game.player.facing = -0.5;
    Game.guards[0].x = 980;
    Game.guards[0].y = 500;
    Game.guards[0].facing = Math.PI;
    Game.guards[1].x = 520;
    Game.guards[1].y = 168;
    Game.guards[1].facing = 0.4;
    Game.guards[2].x = 248;
    Game.guards[2].y = 430;
    Game.guards[2].facing = Math.PI / 2;
    Game.cameras[0].phase = 0.9;
    Game.cameras[0].update(0);
    Game.detection = 10;
    Game.time = 402;
    Game.setToast('All three books are in the bag — the roof door is open', 999);
    return;
  }
  // cover: the open-plan office, a guard's cone sweeping past your shadow
  Game.loadLevel(1);
  Game.state = 'play';
  Game.ledgers = [true, false, false];
  Game.player.x = 344;
  Game.player.y = 356;
  Game.player.facing = 2.6;
  Game.player.sneaking = true;
  Game.guards[0].x = 512;
  Game.guards[0].y = 372;
  Game.guards[0].facing = Math.PI;
  Game.guards[0].state = 'suspicious';
  Game.guards[0].lastSeen = { x: 344, y: 356 };
  Game.guards[1].x = 586;
  Game.guards[1].y = 268;
  Game.guards[1].facing = Math.PI / 2;
  Game.guards[2].x = 1050;
  Game.guards[2].y = 560;
  Game.guards[2].facing = -Math.PI / 2;
  Game.detection = 57;
  Game.time = 187;
}

// ---------- boot ----------

window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  PT.Keys.init();
  PT.Touch.init(canvas, Game);
  Game.loadLevel(0);
  const shot = new URLSearchParams(window.location.search).get('shot');
  if (shot) stageShot(shot);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    if (!Game.frozen) {
      Game.handlePresses();
      Game.update(dt);
    }
    PT.Render.drawScene(ctx, Game);
    PT.Render.drawHUD(ctx, Game);
    PT.Touch.draw(ctx);
    if (Game.state === 'title') PT.Render.drawTitle(ctx, Game);
    else if (Game.state === 'intro') PT.Render.drawIntro(ctx, Game);
    else if (Game.state === 'caught') PT.Render.drawCaught(ctx, Game);
    else if (Game.state === 'clear') PT.Render.drawClear(ctx, Game);
    else if (Game.state === 'win') PT.Render.drawWin(ctx, Game);
    if (shot) window.__shotReady = true;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
});
