// Paper Trail — tiny WebAudio synth: footsteps, page rustles and alarm stings.
// No audio files; every sound is an oscillator or a burst of filtered noise,
// created lazily on the first user gesture so the browser allows it.
'use strict';

// PT itself is declared once, in config.js - every file shares that object.

PT.Audio = {
  ctx: null,

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  tone(freq, seconds, type, volume, slideTo) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + seconds);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + seconds);
  },

  noise(seconds, volume, freq) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const len = Math.max(1, (this.ctx.sampleRate * seconds) | 0);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq || 800;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t);
  },

  // A footstep: a short soft thud. Volume is set by whoever calls — the game
  // passes a smaller volume for a distant guard, which is how you hear them coming.
  step(volume) {
    this.noise(0.07, volume, 420);
  },

  // The player's own step on carpet: quieter and higher.
  ownStep() {
    this.noise(0.05, 0.05, 900);
  },

  pickup() {
    this.noise(0.16, 0.12, 2400); // paper rustle
    this.tone(660, 0.12, 'sine', 0.08);
    setTimeout(() => this.tone(880, 0.16, 'sine', 0.08), 70);
  },

  alertSting() {
    this.tone(220, 0.22, 'square', 0.07, 160);
  },

  caught() {
    this.tone(392, 0.18, 'square', 0.09);
    setTimeout(() => this.tone(311, 0.18, 'square', 0.09), 160);
    setTimeout(() => this.tone(233, 0.34, 'square', 0.09), 320);
  },

  floorClear() {
    this.tone(523, 0.12, 'sine', 0.08);
    setTimeout(() => this.tone(659, 0.12, 'sine', 0.08), 100);
    setTimeout(() => this.tone(784, 0.22, 'sine', 0.08), 200);
  },
};
