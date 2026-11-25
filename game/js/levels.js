// Paper Trail — the three floors of the ministry tower, as data.
// solids block movement and sight; shadows hide the player (plants included);
// guards patrol waypoint loops; each floor hides one of the three ledgers.
'use strict';

// PT itself is declared once, in config.js - every file shares that object.

function wall(x, y, w, h) { return { x, y, w, h, kind: 'wall' }; }
function shelf(x, y, w, h) { return { x, y, w, h, kind: 'shelf' }; }
function desk(x, y, w, h) { return { x, y, w, h, kind: 'desk' }; }
function cabinet(x, y, w, h) { return { x, y, w, h, kind: 'cabinet' }; }
function sofa(x, y, w, h) { return { x, y, w, h, kind: 'sofa' }; }
function shade(x, y, w, h, plant) { return { x, y, w, h, plant: !!plant }; }

PT.LEDGER_NAMES = ['Procurement Ledger', 'Offshore Accounts File', "Minister's Black Book"];

PT.LEVELS = [
  {
    floor: 'Floor 12 — Records & Archives',
    intro: 'The procurement ledger is sealed in the archive vault, top left.',
    ledgerName: 'Procurement Ledger',
    ledgerNote: 'Every project marked up. Every signature bought.',
    exitLabel: 'SERVICE LIFT',
    spawn: { x: 92, y: 742 },
    ledger: { x: 118, y: 138 },
    exit: { x: 1152, y: 722, w: 104, h: 62 },
    solids: [
      // the archive vault (door gap in its bottom wall)
      wall(40, 90, 320, 16), wall(40, 90, 16, 210), wall(344, 90, 16, 210),
      wall(40, 284, 140, 16), wall(232, 284, 128, 16),
      shelf(76, 196, 110, 26), shelf(216, 196, 104, 26),
      // archive shelf rows with aisles between them
      shelf(90, 372, 300, 30), shelf(470, 372, 300, 30), shelf(850, 372, 300, 30),
      shelf(90, 528, 300, 30), shelf(470, 528, 300, 30), shelf(850, 528, 300, 30),
      shelf(210, 668, 250, 30), shelf(660, 668, 250, 30),
      // cabinets down the right-hand wall
      cabinet(1196, 140, 46, 120), cabinet(1196, 420, 46, 110),
    ],
    shadows: [shade(44, 566, 150, 170), shade(1080, 90, 150, 90), shade(1150, 636, 74, 74, true), shade(560, 90, 64, 64, true)],
    guards: [
      { waypoints: [[432, 330], [432, 724]], start: 0 },
      { waypoints: [[700, 128], [1150, 128], [1150, 452], [700, 452]], start: 0 },
    ],
    cameras: [],
  },
  {
    floor: 'Floor 13 — Open-Plan Office',
    intro: 'The offshore accounts file waits in the glass office, top right.',
    ledgerName: 'Offshore Accounts File',
    ledgerNote: 'Shell companies in four countries. All roads lead to one signature.',
    exitLabel: 'LIFT',
    spawn: { x: 622, y: 748 },
    ledger: { x: 1136, y: 150 },
    exit: { x: 44, y: 92, w: 104, h: 60 },
    solids: [
      // the glass office (door gap in its left wall)
      wall(880, 90, 360, 16), wall(1224, 90, 16, 220), wall(880, 294, 360, 16),
      wall(880, 90, 16, 84), wall(880, 226, 16, 84),
      desk(1150, 128, 74, 120),
      // open-plan desk clusters
      desk(140, 220, 128, 54), desk(420, 220, 128, 54), desk(700, 220, 128, 54),
      desk(140, 452, 128, 54), desk(420, 452, 128, 54), desk(700, 452, 128, 54),
      // meeting room, bottom left (door gap in its top wall)
      wall(40, 540, 130, 16), wall(238, 540, 130, 16), wall(40, 540, 16, 220), wall(352, 540, 16, 220), wall(40, 744, 328, 16),
      sofa(84, 660, 130, 44), cabinet(268, 660, 74, 40),
      cabinet(1080, 560, 150, 42), cabinet(1080, 640, 150, 42),
    ],
    shadows: [
      shade(56, 556, 296, 188), // the meeting room carpet is deep shadow
      shade(628, 596, 68, 68, true), shade(56, 108, 68, 68, true), shade(812, 636, 68, 68, true),
      shade(300, 330, 90, 60), shade(980, 380, 90, 60),
    ],
    guards: [
      { waypoints: [[120, 372], [1090, 372]], start: 0 },
      { waypoints: [[586, 140], [586, 700]], start: 0 },
      { waypoints: [[930, 380], [1180, 380], [1180, 700], [930, 700]], start: 0 },
    ],
    cameras: [],
  },
  {
    floor: "Floor 14 — The Minister's Suite",
    intro: 'His black book lies on the great desk. Take it, then the roof door.',
    ledgerName: "Minister's Black Book",
    ledgerNote: 'Names, dates, amounts — in his own hand. This is the one that ends him.',
    exitLabel: 'ROOF DOOR',
    spawn: { x: 84, y: 748 },
    ledger: { x: 830, y: 276 },
    exit: { x: 44, y: 92, w: 108, h: 60 },
    solids: [
      // the suite itself (door gap in its bottom wall, under the camera)
      wall(340, 90, 900, 16), wall(1224, 90, 16, 300), wall(340, 90, 16, 300),
      wall(340, 374, 280, 16), wall(716, 374, 524, 16),
      desk(700, 182, 264, 68), // the minister's great desk; the book rests at its edge
      sofa(420, 300, 150, 46), cabinet(1050, 120, 150, 40), shelf(372, 120, 30, 220),
      // the antechamber below: waiting sofas and filing cabinets
      sofa(140, 560, 170, 48), sofa(520, 560, 170, 48), sofa(900, 560, 170, 48),
      cabinet(140, 668, 130, 42), cabinet(520, 668, 130, 42), cabinet(900, 668, 130, 42),
      wall(340, 470, 16, 180),
    ],
    shadows: [
      shade(1080, 640, 76, 76, true), shade(60, 420, 68, 68, true), shade(1120, 420, 68, 68, true),
      shade(356, 106, 90, 268), // the book-lined wall of the suite is dim
    ],
    guards: [
      { waypoints: [[170, 500], [1110, 500]], start: 0 },
      { waypoints: [[470, 150], [1150, 150], [1150, 330], [470, 330]], start: 0 },
      { waypoints: [[248, 130], [248, 720]], start: 0 },
    ],
    cameras: [{ x: 668, y: 388, baseAngle: Math.PI / 2, sweep: 0.72, speed: 0.55, range: 196 }],
  },
];
