// Paper Trail — keyboard state. The game polls `PT.Keys` each frame and uses
// one-shot presses (confirm / restart) through `PT.Keys.pressed`.
'use strict';

// PT itself is declared once, in config.js - every file shares that object.

PT.Keys = {
  down: {},
  pressed: {},

  init(onAnyKey) {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (!this.down[k]) this.pressed[k] = true;
      this.down[k] = true;
      PT.Audio.ensure();
      if (onAnyKey) onAnyKey(k);
    });
    window.addEventListener('keyup', (e) => {
      this.down[e.key.toLowerCase()] = false;
    });
    window.addEventListener('mousedown', () => {
      PT.Audio.ensure();
      this.pressed['mouse'] = true;
    });
  },

  // Movement vector from WASD or arrow keys, normalised. When no key is
  // held, the touch joystick (touch.js) gets its turn.
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.down['a'] || this.down['arrowleft']) x -= 1;
    if (this.down['d'] || this.down['arrowright']) x += 1;
    if (this.down['w'] || this.down['arrowup']) y -= 1;
    if (this.down['s'] || this.down['arrowdown']) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    if (x === 0 && y === 0 && PT.Touch) return PT.Touch.vector;
    return [x, y];
  },

  sneaking() {
    return !!this.down['shift'] || !!(PT.Touch && PT.Touch.sneak);
  },

  consumePress() {
    const was = this.pressed;
    this.pressed = {};
    return was;
  },
};
