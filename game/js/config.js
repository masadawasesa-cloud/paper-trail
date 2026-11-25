// Paper Trail — shared constants: canvas size, speeds, vision and colours.
// Every other file reads its tuning from here so the game's feel lives in one place.
'use strict';

const PT = (window.PT = window.PT || {});

PT.W = 1280; // canvas width in pixels
PT.H = 800; // canvas height in pixels
PT.HUD_H = 56; // top bar height; the play field starts below it

PT.PLAYER = {
  radius: 13,
  walkSpeed: 178, // px per second on foot — loud
  sneakSpeed: 96, // px per second while tiptoeing (SHIFT) — silent
  noiseRadius: 92, // guards inside this ring hear normal footsteps
};

PT.GUARD = {
  radius: 14,
  patrolSpeed: 72,
  investigateSpeed: 108,
  chaseSpeed: 158,
  visionRange: 216,
  visionHalfAngle: 0.62, // radians, ~35.5 degrees either side of facing
  catchDistance: 30,
  stepEvery: 0.34, // seconds between audible footsteps at patrol speed
};

PT.DETECTION = {
  max: 100,
  baseRate: 62, // per second at point blank in the open
  shadowFactor: 0.42, // detection fills this slowly while the player hides in shadow
  sneakFactor: 0.7, // and this slowly while tiptoeing
  decayRate: 15, // per second while nobody sees the player
  shadowDecay: 30, // hiding in shadow calms things down faster
  suspiciousAt: 34, // guard shows "?" and pauses
  alertAt: 72, // guard shows "!" and gives chase
};

PT.COLORS = {
  floor: '#232a38',
  floorLine: '#2b3345',
  shadow: 'rgba(8, 12, 22, 0.55)',
  wall: '#4d5a75',
  wallTop: '#67769a',
  shelf: '#5d4a2f',
  shelfTop: '#7a6238',
  desk: '#6b4e2e',
  deskTop: '#8a673d',
  cabinet: '#3f4c63',
  cabinetTop: '#55678a',
  plant: '#2e6b3e',
  plantLight: '#3f8a52',
  sofa: '#5b3a52',
  ledger: '#ffd94d',
  exitOpen: '#39d98a',
  exitLocked: '#e05252',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneWary: 'rgba(255, 150, 60, 0.30)',
  coneAlert: 'rgba(255, 70, 60, 0.38)',
  coneCamera: 'rgba(120, 200, 255, 0.20)',
};
