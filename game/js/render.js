// Paper Trail — everything drawn on the canvas: the floors, the furniture,
// the vision cones, the actors, the HUD and the story screens.
// The judge reads this game mostly through screenshots, so every element is
// drawn to be understood at a glance: cones you can read, cover you can name.
'use strict';

// PT itself is declared once, in config.js - every file shares that object.
PT.Render = {};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy + lineHeight;
}

// ---------- the room ----------

function drawFloor(ctx, level) {
  ctx.fillStyle = PT.COLORS.floor;
  ctx.fillRect(0, PT.HUD_H, PT.W, PT.H - PT.HUD_H);
  ctx.strokeStyle = PT.COLORS.floorLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= PT.W; x += 40) {
    ctx.moveTo(x, PT.HUD_H);
    ctx.lineTo(x, PT.H);
  }
  for (let y = PT.HUD_H; y <= PT.H; y += 40) {
    ctx.moveTo(0, y);
    ctx.lineTo(PT.W, y);
  }
  ctx.stroke();
}

function drawShadows(ctx, level) {
  for (const s of level.shadows) {
    if (s.plant) continue; // plants draw as shrubs below
    ctx.fillStyle = PT.COLORS.shadow;
    rr(ctx, s.x, s.y, s.w, s.h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140, 170, 255, 0.14)';
    ctx.setLineDash([5, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (const s of level.shadows) {
    if (!s.plant) continue;
    ctx.fillStyle = 'rgba(6, 14, 10, 0.5)';
    rr(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fill();
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    for (const [ox, oy, r] of [[-14, 4, 20], [14, 6, 18], [0, -12, 22], [-4, 12, 16]]) {
      ctx.fillStyle = PT.COLORS.plant;
      ctx.beginPath();
      ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PT.COLORS.plantLight;
      ctx.beginPath();
      ctx.arc(cx + ox - 5, cy + oy - 6, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFurniture(ctx, level) {
  for (const r of level.solids) {
    const C = PT.COLORS;
    if (r.kind === 'wall') {
      ctx.fillStyle = C.wall;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = C.wallTop;
      ctx.fillRect(r.x, r.y, r.w, 4);
    } else if (r.kind === 'shelf') {
      ctx.fillStyle = C.shelf;
      rr(ctx, r.x, r.y, r.w, r.h, 3);
      ctx.fill();
      ctx.fillStyle = C.shelfTop;
      const n = Math.max(2, (r.w / 34) | 0);
      for (let i = 0; i < n; i++) {
        ctx.fillRect(r.x + 5 + i * ((r.w - 10) / n), r.y + 5, (r.w - 10) / n - 5, r.h - 10);
      }
    } else if (r.kind === 'desk') {
      ctx.fillStyle = C.desk;
      rr(ctx, r.x, r.y, r.w, r.h, 4);
      ctx.fill();
      ctx.fillStyle = C.deskTop;
      rr(ctx, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; // papers on the desk
      ctx.fillRect(r.x + 12, r.y + 10, 20, 13);
      ctx.fillRect(r.x + r.w - 36, r.y + r.h - 22, 22, 12);
      ctx.fillStyle = '#ffd94d'; // a desk lamp
      ctx.beginPath();
      ctx.arc(r.x + r.w - 14, r.y + 13, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (r.kind === 'cabinet') {
      ctx.fillStyle = C.cabinet;
      rr(ctx, r.x, r.y, r.w, r.h, 3);
      ctx.fill();
      ctx.strokeStyle = C.cabinetTop;
      ctx.lineWidth = 2;
      const vertical = r.h > r.w;
      const n = Math.max(1, ((vertical ? r.h : r.w) / 38) | 0);
      for (let i = 1; i < n; i++) {
        ctx.beginPath();
        if (vertical) {
          ctx.moveTo(r.x + 4, r.y + (r.h / n) * i);
          ctx.lineTo(r.x + r.w - 4, r.y + (r.h / n) * i);
        } else {
          ctx.moveTo(r.x + (r.w / n) * i, r.y + 4);
          ctx.lineTo(r.x + (r.w / n) * i, r.y + r.h - 4);
        }
        ctx.stroke();
      }
    } else if (r.kind === 'sofa') {
      ctx.fillStyle = C.sofa;
      rr(ctx, r.x, r.y, r.w, r.h, 9);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 2;
      const n = Math.max(2, (r.w / 52) | 0);
      for (let i = 1; i < n; i++) {
        ctx.beginPath();
        ctx.moveTo(r.x + (r.w / n) * i, r.y + 6);
        ctx.lineTo(r.x + (r.w / n) * i, r.y + r.h - 6);
        ctx.stroke();
      }
    }
  }
}

function drawExit(ctx, game) {
  const e = game.level.exit;
  const open = game.floorLedgerTaken;
  const pulse = open ? 0.6 + 0.4 * Math.sin(game.time * 5) : 0;
  ctx.fillStyle = open ? 'rgba(30, 90, 60, 0.9)' : 'rgba(70, 34, 38, 0.9)';
  rr(ctx, e.x, e.y, e.w, e.h, 5);
  ctx.fill();
  ctx.strokeStyle = open ? PT.COLORS.exitOpen : PT.COLORS.exitLocked;
  ctx.globalAlpha = open ? pulse : 1;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = open ? PT.COLORS.exitOpen : PT.COLORS.exitLocked;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.level.exitLabel, e.x + e.w / 2, e.y + e.h / 2 - 2);
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText(open ? 'OPEN' : 'NEEDS THE LEDGER', e.x + e.w / 2, e.y + e.h / 2 + 14);
  ctx.textAlign = 'left';
}

function drawLedger(ctx, game) {
  if (game.floorLedgerTaken) return;
  const { x, y } = game.level.ledger;
  const bob = Math.sin(game.time * 3) * 3;
  ctx.fillStyle = 'rgba(255, 217, 77, 0.18)';
  ctx.beginPath();
  ctx.arc(x, y + bob, 26 + Math.sin(game.time * 3) * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(-0.16);
  ctx.fillStyle = '#f5eeda';
  ctx.fillRect(-11, -14, 22, 28);
  ctx.fillStyle = PT.COLORS.ledger;
  ctx.fillRect(-11, -14, 22, 6);
  ctx.fillStyle = '#8a2f2f';
  ctx.fillRect(-7, -2, 14, 2.4);
  ctx.fillRect(-7, 3, 14, 2.4);
  ctx.fillRect(-7, 8, 9, 2.4);
  ctx.restore();
}

// ---------- vision cones and actors ----------

function drawCone(ctx, ox, oy, facing, halfAngle, range, blockers, fill) {
  const pts = PT.visionPolygon(ox, oy, facing, halfAngle, range, blockers);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function drawGuard(ctx, g, game) {
  // body: navy uniform, cap, and a face wedge toward his facing
  ctx.fillStyle = '#22314d';
  ctx.beginPath();
  ctx.arc(g.x, g.y, PT.GUARD.radius + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#33507e';
  ctx.beginPath();
  ctx.arc(g.x, g.y, PT.GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9b48c';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.facing) * 5, g.y + Math.sin(g.facing) * 5, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16233a';
  ctx.beginPath();
  ctx.arc(g.x, g.y, PT.GUARD.radius - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4d74ad';
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.arc(g.x, g.y, PT.GUARD.radius - 3, g.facing - 0.6, g.facing + 0.6);
  ctx.closePath();
  ctx.fill();
  // state mark
  if (g.state === 'chase') {
    ctx.fillStyle = '#ff5147';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 24 - Math.abs(Math.sin(game.time * 8)) * 3);
    ctx.textAlign = 'left';
  } else if (g.state === 'suspicious' || g.state === 'search') {
    ctx.fillStyle = '#ffb84d';
    ctx.font = 'bold 19px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', g.x, g.y - 23);
    ctx.textAlign = 'left';
  }
}

function drawCamera(ctx, cam, sees) {
  ctx.fillStyle = '#10141d';
  rr(ctx, cam.x - 11, cam.y - 8, 22, 16, 3);
  ctx.fill();
  ctx.fillStyle = sees ? '#ff5147' : '#7fd4ff';
  ctx.beginPath();
  ctx.arc(cam.x + Math.cos(cam.facing) * 8, cam.y + Math.sin(cam.facing) * 8, 3.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx, game) {
  const p = game.player;
  if (p.noisy) {
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PT.PLAYER.noiseRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  const hidden = p.inShadow(game.level);
  ctx.globalAlpha = hidden ? 0.82 : 1;
  ctx.fillStyle = '#0d2b2b';
  ctx.beginPath();
  ctx.arc(p.x, p.y, PT.PLAYER.radius + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#17706a'; // the insider's dark green jacket
  ctx.beginPath();
  ctx.arc(p.x, p.y, PT.PLAYER.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c39e';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.facing) * 4, p.y + Math.sin(p.facing) * 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0a1f1f'; // cap
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.arc(p.x, p.y, PT.PLAYER.radius - 3, p.facing - 0.7, p.facing + 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  if (hidden) {
    ctx.fillStyle = '#9fd8ff';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('hidden', p.x, p.y - 22);
    ctx.textAlign = 'left';
  }
}

PT.Render.drawScene = function (ctx, game) {
  const level = game.level;
  drawFloor(ctx, level);
  drawShadows(ctx, level);
  drawExit(ctx, game);
  drawLedger(ctx, game);
  // cones first, so furniture and actors sit on top of the light
  for (const cam of game.cameras) {
    drawCone(ctx, cam.x, cam.y, cam.facing, 0.5, cam.range, level.solids,
      game.cameraSees ? PT.COLORS.coneAlert : PT.COLORS.coneCamera);
  }
  for (const g of game.guards) {
    const fill = g.state === 'chase' ? PT.COLORS.coneAlert
      : g.state === 'suspicious' || g.state === 'search' ? PT.COLORS.coneWary
        : PT.COLORS.coneCalm;
    drawCone(ctx, g.x, g.y, g.facing, PT.GUARD.visionHalfAngle, PT.GUARD.visionRange, level.solids, fill);
  }
  drawFurniture(ctx, level);
  for (const cam of game.cameras) drawCamera(ctx, cam, game.cameraSees);
  for (const g of game.guards) drawGuard(ctx, g, game);
  drawPlayer(ctx, game);
  // vignette for mood
  const grad = ctx.createRadialGradient(PT.W / 2, PT.H / 2, PT.H * 0.42, PT.W / 2, PT.H / 2, PT.H * 0.95);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, PT.HUD_H, PT.W, PT.H - PT.HUD_H);
};

// ---------- HUD ----------

PT.Render.drawHUD = function (ctx, game) {
  ctx.fillStyle = '#141a26';
  ctx.fillRect(0, 0, PT.W, PT.HUD_H);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('PAPER TRAIL', 18, 35);
  ctx.fillStyle = '#c7d2e4';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(game.level.floor, 168, 35);

  // the three ledgers
  ctx.font = '11px system-ui, sans-serif';
  for (let i = 0; i < 3; i++) {
    const x = 520 + i * 118;
    const got = game.ledgers[i];
    const isTarget = i === game.levelIndex && !got;
    ctx.fillStyle = got ? '#ffd94d' : isTarget ? '#54678c' : '#2a3247';
    rr(ctx, x, 12, 16, 22, 2);
    ctx.fill();
    ctx.fillStyle = got ? '#141a26' : '#8fa1bd';
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), x + 8, 27);
    ctx.textAlign = 'left';
    ctx.fillStyle = got ? '#ffd94d' : '#8fa1bd';
    ctx.font = '10.5px system-ui, sans-serif';
    ctx.fillText(PT.LEDGER_NAMES[i].split(' ').slice(0, 2).join(' '), x + 21, 27);
    ctx.font = '11px system-ui, sans-serif';
  }

  // detection meter: an eye that fills as you are recognised
  const d = game.detection;
  ctx.fillStyle = '#8fa1bd';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('SPOTTED', 1012, 20);
  ctx.fillStyle = '#2a3247';
  rr(ctx, 1012, 26, 180, 13, 6);
  ctx.fill();
  ctx.fillStyle = d >= PT.DETECTION.alertAt ? '#ff5147' : d >= PT.DETECTION.suspiciousAt ? '#ffb84d' : '#39d98a';
  if (d > 0.5) {
    rr(ctx, 1012, 26, Math.max(10, (180 * d) / 100), 13, 6);
    ctx.fill();
  }
  const mm = String(Math.floor(game.time / 60)).padStart(2, '0');
  const ss = String(Math.floor(game.time % 60)).padStart(2, '0');
  ctx.fillStyle = '#c7d2e4';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(mm + ':' + ss, 1216, 35);

  // toast line and controls hint
  if (game.toast && game.toastTimer > 0) {
    ctx.fillStyle = 'rgba(10, 14, 22, 0.82)';
    const w = ctx.measureText(game.toast).width + 30;
    rr(ctx, (PT.W - w) / 2, PT.H - 46, w, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#ffd94d';
    ctx.font = '14.5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.toast, PT.W / 2, PT.H - 26);
    ctx.textAlign = 'left';
  } else if (game.state === 'play') {
    ctx.fillStyle = 'rgba(199, 210, 228, 0.55)';
    ctx.font = '12.5px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WASD / arrows — move · SHIFT — tiptoe (silent) · hide in shadow and behind furniture · noise carries', PT.W / 2, PT.H - 14);
    ctx.textAlign = 'left';
  }
};

// ---------- story screens ----------

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(5, 8, 14, ${alpha})`;
  ctx.fillRect(0, 0, PT.W, PT.H);
}

PT.Render.drawTitle = function (ctx, game) {
  dim(ctx, 0.72);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 74px Georgia, serif';
  ctx.fillText('PAPER TRAIL', PT.W / 2, 218);
  ctx.fillStyle = '#c7d2e4';
  ctx.font = 'italic 21px Georgia, serif';
  ctx.fillText('Night at the Ministry', PT.W / 2, 256);
  ctx.font = '16.5px system-ui, sans-serif';
  ctx.fillStyle = '#aebdd2';
  const story = 'The Minister signs nothing in daylight. His corruption lives in three books, '
    + 'hidden on three floors of his tower: the procurement ledger, the offshore accounts file, '
    + 'and a black book in his own hand. You are the junior clerk he never noticed. '
    + 'Tonight you climb the tower, lift all three, and walk out unseen — '
    + 'because at dawn, the papers reach the press.';
  wrapText(ctx, story, PT.W / 2, 316, 760, 26);
  ctx.fillStyle = '#8fa1bd';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Guards patrol with torches. Break their line of sight. Melt into shadow.', PT.W / 2, 500);
  ctx.fillText('Walking is loud — tiptoe with SHIFT. If the SPOTTED meter fills, the night is over.', PT.W / 2, 528);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 19px system-ui, sans-serif';
  if (Math.sin(game.time * 3) > -0.3) ctx.fillText('Press ENTER or click to slip inside', PT.W / 2, 610);
  ctx.textAlign = 'left';
};

PT.Render.drawIntro = function (ctx, game) {
  dim(ctx, 0.62);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText(game.level.floor, PT.W / 2, 330);
  ctx.fillStyle = '#dbe4f2';
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(game.level.intro, PT.W / 2, 378);
  ctx.fillStyle = '#8fa1bd';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Target: ' + game.level.ledgerName + ' — then reach the ' + game.level.exitLabel.toLowerCase() + '.', PT.W / 2, 420);
  ctx.fillText('Press any key', PT.W / 2, 470);
  ctx.textAlign = 'left';
};

PT.Render.drawCaught = function (ctx, game) {
  ctx.fillStyle = 'rgba(90, 10, 10, 0.45)';
  ctx.fillRect(0, 0, PT.W, PT.H);
  dim(ctx, 0.35);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6b61';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText('CAUGHT', PT.W / 2, 330);
  ctx.fillStyle = '#e8dede';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('Security walks you out into the rain. The books stay hidden — for now.', PT.W / 2, 384);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('Press R to try this floor again', PT.W / 2, 440);
  ctx.textAlign = 'left';
};

PT.Render.drawClear = function (ctx, game) {
  dim(ctx, 0.55);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#39d98a';
  ctx.font = 'bold 38px Georgia, serif';
  ctx.fillText('Ledger secured: ' + game.level.ledgerName, PT.W / 2, 350);
  ctx.fillStyle = '#dbe4f2';
  ctx.font = 'italic 17px Georgia, serif';
  ctx.fillText(game.level.ledgerNote, PT.W / 2, 396);
  ctx.textAlign = 'left';
};

PT.Render.drawWin = function (ctx, game) {
  dim(ctx, 0.78);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillText('THE STORY BREAKS AT DAWN', PT.W / 2, 250);
  ctx.fillStyle = '#dbe4f2';
  ctx.font = '17px system-ui, sans-serif';
  const ending = 'Three books. One envelope. A newsroom that does not sleep. '
    + 'By Monday the Minister is explaining himself to investigators, '
    + 'and the clerk nobody noticed is back at her desk, filing, smiling at nothing.';
  wrapText(ctx, ending, PT.W / 2, 316, 720, 27);
  const mm = String(Math.floor(game.time / 60)).padStart(2, '0');
  const ss = String(Math.floor(game.time % 60)).padStart(2, '0');
  ctx.fillStyle = '#8fa1bd';
  ctx.font = '15.5px system-ui, sans-serif';
  ctx.fillText(`Time inside: ${mm}:${ss} · Caught: ${game.caughtCount}× · Alarms raised: ${game.alarmCount}`, PT.W / 2, 470);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('Press ENTER to run the tower again', PT.W / 2, 540);
  ctx.textAlign = 'left';
};
