'use client';

import { useEffect, useRef, useState } from 'react';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { useI18n } from '../../lib/i18n/I18nProvider';
import styles from './planeForestRun.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const CW = 560;
const CH = 300;
const PLANE_X      = 110;   // fixed screen x of plane center
const PLANE_Y_MID  = 150;   // default vertical start
const PLANE_Y_MIN  = 52;
const PLANE_Y_MAX  = 232;
const INITIAL_SPEED = 180;
const SPEED_INC     = 32;   // px/s added per wave
const WAVE_DIST     = 1600; // world px per wave
const MAX_SPEED     = 660;
const MAX_LIVES     = 5;
const INV_DUR       = 1.5;  // invincibility seconds after hit
const HIGH_SCORE_KEY = 'planeForestRunHighScoreV2';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t)    { return a + (b - a) * clamp(t, 0, 1); }
function randInt(lo, hi)  { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }
function randF(lo, hi)    { return lo + Math.random() * (hi - lo); }

/** Linearly interpolate between two [r,g,b] arrays, returns CSS rgb() string. */
function lerpRgb(c1, c2, t) {
  return `rgb(${Math.round(lerp(c1[0],c2[0],t))},${Math.round(lerp(c1[1],c2[1],t))},${Math.round(lerp(c1[2],c2[2],t))})`;
}

/** Forgiving AABB intersection (shrinks both rects by margin). */
function intersects(a, b, margin = 7) {
  return (
    a.x + margin < b.x + b.w - margin &&
    a.x + a.w - margin > b.x + margin &&
    a.y + margin < b.y + b.h - margin &&
    a.y + a.h - margin > b.y + margin
  );
}

// ─── Drawing: utilities ───────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y,         x + r, y);
  ctx.closePath();
}

// ─── Drawing: background ──────────────────────────────────────────────────────
/**
 * Rows of hill-arcs, scrolling at different parallax factors.
 * seedArr provides a variety of arc radii so it looks natural.
 */
function drawHillRow(ctx, color, scrollX, factor, groundY, radii, spacing) {
  const off   = (scrollX * factor) % spacing;
  const count = Math.ceil(CW / spacing) + 3;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let i = -1; i < count; i++) {
    const cx = i * spacing - off + spacing * 0.5;
    const r  = radii[((i + 200) % radii.length)];
    ctx.arc(cx, groundY, r, Math.PI, 0, false);
  }
  ctx.lineTo(CW, groundY);
  ctx.lineTo(CW, CH + 4);
  ctx.lineTo(0,  CH + 4);
  ctx.closePath();
  ctx.fill();
}

/** Pine/fir tree row (silhouette) scrolling at the given factor. */
function drawPineRow(ctx, color, scrollX, factor, groundY, treeH, spacing) {
  const off   = (scrollX * factor) % spacing;
  const count = Math.ceil(CW / spacing) + 3;
  ctx.fillStyle = color;
  for (let i = -1; i < count; i++) {
    const x = i * spacing - off;
    // Trunk
    ctx.fillRect(x - 3, groundY - treeH * 0.32, 6, treeH * 0.32 + 2);
    // Three tiers
    for (let tier = 0; tier < 3; tier++) {
      const ty = groundY - treeH + tier * treeH * 0.3;
      const hw = treeH * (0.52 - tier * 0.07);
      ctx.beginPath();
      ctx.moveTo(x - hw, ty + treeH * 0.36);
      ctx.lineTo(x, ty);
      ctx.lineTo(x + hw, ty + treeH * 0.36);
      ctx.closePath();
      ctx.fill();
    }
  }
}

/** Decorative background puff-cloud. */
function drawBgCloud(ctx, x, y, s) {
  ctx.save();
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(x,         y,       s * 0.50, 0, Math.PI * 2);
  ctx.arc(x + s*0.5, y - s*0.15, s * 0.36, 0, Math.PI * 2);
  ctx.arc(x + s*0.95,y,       s * 0.44, 0, Math.PI * 2);
  ctx.arc(x + s*0.48,y + s*0.18, s * 0.40, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── Drawing: obstacles ───────────────────────────────────────────────────────
function drawRock(ctx, x, y, w, h) {
  ctx.save();
  // Base boulder
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0,   '#c4a87a');
  g.addColorStop(0.5, '#a07848');
  g.addColorStop(1,   '#6a4828');
  ctx.fillStyle = g;
  roundRect(ctx, x, y + h * 0.28, w, h * 0.72, 9);
  ctx.fill();
  ctx.strokeStyle = '#5a3820';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Top bumps
  ctx.fillStyle = '#b89060';
  ctx.beginPath();
  ctx.arc(x + w * 0.27, y + h * 0.34, w * 0.26, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.66, y + h * 0.26, w * 0.23, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.arc(x + w * 0.28, y + h * 0.30, w * 0.14, 0, Math.PI * 2);
  ctx.fill();
  // Crack
  ctx.strokeStyle = '#7a5030';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.44, y + h * 0.42);
  ctx.lineTo(x + w * 0.56, y + h * 0.72);
  ctx.stroke();
  ctx.restore();
}

function drawStormCloud(ctx, x, y, w, h) {
  ctx.save();
  // Dark cloud body
  ctx.fillStyle = '#7070a8';
  ctx.beginPath();
  ctx.arc(x + w * 0.25, y + h * 0.55, w * 0.24, 0, Math.PI * 2);
  ctx.arc(x + w * 0.50, y + h * 0.40, w * 0.28, 0, Math.PI * 2);
  ctx.arc(x + w * 0.75, y + h * 0.55, w * 0.24, 0, Math.PI * 2);
  ctx.arc(x + w * 0.50, y + h * 0.65, w * 0.26, 0, Math.PI * 2);
  ctx.fill();
  // Darker shadow core
  ctx.fillStyle = '#4848808a';
  ctx.beginPath();
  ctx.arc(x + w * 0.50, y + h * 0.55, w * 0.22, 0, Math.PI * 2);
  ctx.fill();
  // Lightning bolt
  ctx.fillStyle = '#ffe44a';
  ctx.strokeStyle = '#e0c000';
  ctx.lineWidth = 1;
  const lx = x + w * 0.47;
  const ly = y + h * 0.68;
  ctx.beginPath();
  ctx.moveTo(lx + 5,  ly);
  ctx.lineTo(lx,      ly + h * 0.22);
  ctx.lineTo(lx + 5,  ly + h * 0.22);
  ctx.lineTo(lx - 2,  ly + h * 0.42);
  ctx.lineTo(lx + 8,  ly + h * 0.18);
  ctx.lineTo(lx + 3,  ly + h * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBirdFlock(ctx, x, y, w, h) {
  ctx.save();
  ctx.strokeStyle = '#223344';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  const birds = [
    [0,        0       ],
    [w * 0.22, h * 0.14],
    [w * 0.44, -h * 0.06],
    [w * 0.18, -h * 0.28],
    [w * 0.40, h * 0.32],
    [w * 0.62, h * 0.05],
  ];
  birds.forEach(([bx, by]) => {
    const cx = x + w * 0.12 + bx;
    const cy = y + h * 0.42 + by;
    ctx.beginPath();
    ctx.moveTo(cx - 8,  cy - 3);
    ctx.quadraticCurveTo(cx, cy + 5, cx + 8,  cy - 3);
    ctx.stroke();
  });
  ctx.restore();
}

// ─── Drawing: plane ───────────────────────────────────────────────────────────
/**
 * Draw the player's plane centered at (cx, cy).
 * Bounding box: roughly ±32 x, ±12 y.
 */
function drawPlane(ctx, cx, cy, propAngle, invTimer) {
  // Flicker when invincible
  if (invTimer > 0 && Math.floor(invTimer * 8) % 2 === 0) return;

  ctx.save();
  ctx.translate(cx, cy);

  // Drop shadow
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(2, 22, 30, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Tail vertical fin
  ctx.fillStyle = '#b01818';
  ctx.beginPath();
  ctx.moveTo(-24, -2);
  ctx.lineTo(-18, -18);
  ctx.lineTo(-8,  -2);
  ctx.closePath();
  ctx.fill();

  // Tail horizontal stabilizer
  ctx.fillStyle = '#c02020';
  ctx.beginPath();
  ctx.moveTo(-30,  4);
  ctx.lineTo(-30, 11);
  ctx.lineTo(-10, 11);
  ctx.lineTo(-10,  4);
  ctx.closePath();
  ctx.fill();

  // Main wing (wide swept)
  const wg = ctx.createLinearGradient(0, 2, 0, 16);
  wg.addColorStop(0, '#d42424');
  wg.addColorStop(1, '#801818');
  ctx.fillStyle = wg;
  ctx.beginPath();
  ctx.moveTo(-20,  2);
  ctx.lineTo( 24,  2);
  ctx.lineTo( 32, 16);
  ctx.lineTo(-28, 16);
  ctx.closePath();
  ctx.fill();

  // Fuselage body
  const fg = ctx.createLinearGradient(0, -12, 0, 12);
  fg.addColorStop(0,   '#ff7070');
  fg.addColorStop(0.45,'#e03030');
  fg.addColorStop(1,   '#b01818');
  ctx.fillStyle = fg;
  roundRect(ctx, -30, -12, 62, 22, 11);
  ctx.fill();

  // White racing stripe
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(-16, -5, 36, 5);

  // Nose cone (ivory/cream)
  ctx.fillStyle = '#ece8d0';
  ctx.beginPath();
  ctx.moveTo(32, -12);
  ctx.lineTo(44,  0);
  ctx.lineTo(32, 10);
  ctx.closePath();
  ctx.fill();

  // Cockpit glass
  ctx.fillStyle = '#90d8ff';
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(10, -1, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Glare
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(15, -4, 5, 3.5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Propeller hub
  ctx.fillStyle = '#606060';
  ctx.beginPath();
  ctx.arc(44, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  // Spinning propeller (3 blades)
  ctx.save();
  ctx.translate(44, 0);
  ctx.rotate(propAngle);
  ctx.fillStyle = 'rgba(50,50,50,0.82)';
  for (let b = 0; b < 3; b++) {
    ctx.save();
    ctx.rotate(b * (Math.PI * 2 / 3));
    ctx.beginPath();
    ctx.ellipse(0, -14, 3.5, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  ctx.restore();
}

// ─── Drawing: HUD heart ───────────────────────────────────────────────────────
function drawHeart(ctx, cx, cy, size, filled) {
  ctx.save();
  ctx.translate(cx, cy);
  const s = size / 20;
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.bezierCurveTo(-10, -18, -22, -8, -22, 2);
  ctx.bezierCurveTo(-22, 12,  -11, 20,   0, 28);
  ctx.bezierCurveTo( 11, 20,   22, 12,  22, 2);
  ctx.bezierCurveTo( 22, -8,   10, -18,  0, -5);
  ctx.closePath();
  ctx.fillStyle   = filled ? '#ff3c3c' : 'rgba(0,0,0,0.14)';
  ctx.fill();
  if (filled) {
    ctx.strokeStyle = '#b80000';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // White highlight
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-6, -2, 5, 4, -0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ─── Main scene draw ──────────────────────────────────────────────────────────
function drawScene(ctx, state) {
  const {
    distance, speed, plane,
    obstacles, lives, invTimer,
    waveNum, waveFlashTimer,
    propAngle, exhaustParticles,
  } = state;

  // Speed ratio 0 → 1 (for colour shifts)
  const t = (speed - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED);

  // ── Sky gradient ────────────────────────────────────────────────────────────
  const skyTop = lerpRgb([100, 180, 240], [240, 90, 30], t * 0.72);
  const skyMid = lerpRgb([180, 220, 255], [255, 165, 55], t * 0.72);
  const skyBot = lerpRgb([220, 245, 200], [200, 140, 55], t * 0.60);
  const skyGrd = ctx.createLinearGradient(0, 0, 0, CH);
  skyGrd.addColorStop(0,    skyTop);
  skyGrd.addColorStop(0.60, skyMid);
  skyGrd.addColorStop(1,    skyBot);
  ctx.fillStyle = skyGrd;
  ctx.fillRect(0, 0, CW, CH);

  // ── Background clouds ──────────────────────────────────────────────────────
  for (let i = 0; i < 6; i++) {
    const bx = ((i * 108 - distance * 0.055) % (CW + 120) + CW + 120) % (CW + 120) - 60;
    drawBgCloud(ctx, bx, 25 + (i % 3) * 22, 34 + (i % 2) * 8);
  }

  // ── Far mountains (parallelx 0.07) ─────────────────────────────────────────
  drawHillRow(
    ctx,
    lerpRgb([140, 175, 210], [170, 118, 88], t * 0.65),
    distance, 0.07,
    CH - 52,
    [90, 125, 100, 80, 115, 95, 130, 110, 85],
    165
  );

  // ── Mid hills (parallax 0.18) ───────────────────────────────────────────────
  drawHillRow(
    ctx,
    lerpRgb([80, 145, 70], [120, 82, 35], t * 0.55),
    distance, 0.18,
    CH - 52,
    [45, 60, 38, 52, 66, 42, 58, 50, 44],
    120
  );

  // ── Mid-ground pine row (parallax 0.30) ───────────────────────────────────
  drawPineRow(
    ctx,
    lerpRgb([38, 105, 38], [80, 52, 18], t * 0.45),
    distance, 0.30,
    CH - 50, 38, 62
  );

  // ── Foreground pine row (parallax 0.62) ───────────────────────────────────
  drawPineRow(
    ctx,
    lerpRgb([22, 80, 22], [55, 35, 10], t * 0.40),
    distance, 0.62,
    CH - 48, 58, 82
  );

  // ── Ground strip ───────────────────────────────────────────────────────────
  const groundCol = lerpRgb([100, 168, 65], [150, 108, 40], t * 0.55);
  ctx.fillStyle = groundCol;
  ctx.fillRect(0, CH - 52, CW, 52);
  // Dark edge
  ctx.fillStyle = lerpRgb([78, 138, 45], [120, 85, 28], t * 0.5);
  ctx.fillRect(0, CH - 52, CW, 7);

  // ── Obstacles ──────────────────────────────────────────────────────────────
  obstacles.forEach((o) => {
    const sx = o.worldX - distance + PLANE_X;
    if (sx < -110 || sx > CW + 50) return;
    if (o.type === 'rock')  drawRock(ctx, sx, o.y, o.w, o.h);
    else if (o.type === 'cloud') drawStormCloud(ctx, sx, o.y, o.w, o.h);
    else drawBirdFlock(ctx, sx, o.y, o.w, o.h);
  });

  // ── Exhaust smoke particles ────────────────────────────────────────────────
  exhaustParticles.forEach((p) => {
    const a = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = a * 0.65;
    ctx.fillStyle = lerpRgb([220, 200, 160], [160, 160, 160], 1 - a);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (2.2 - a * 1.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // ── Plane ──────────────────────────────────────────────────────────────────
  drawPlane(ctx, plane.x, plane.y, propAngle, invTimer);

  // ── HUD: lives (hearts in top-left) ────────────────────────────────────────
  for (let i = 0; i < MAX_LIVES; i++) {
    drawHeart(ctx, 18 + i * 26, 19, 20, i < lives);
  }

  // ── HUD: wave badge (top-right) ────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  roundRect(ctx, CW - 94, 7, 86, 28, 8);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Nunito, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Wave ${waveNum + 1}`, CW - 12, 26);
  ctx.restore();

  // ── HUD: speed bar (bottom edge) ───────────────────────────────────────────
  const barW  = CW - 28;
  const barH  = 6;
  const barY  = CH - 11;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  roundRect(ctx, 14, barY, barW, barH, 3);
  ctx.fill();
  const speedRatio = (speed - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED);
  ctx.fillStyle = lerpRgb([60, 200, 60], [255, 50, 50], speedRatio);
  if (barW * speedRatio > 0) {
    roundRect(ctx, 14, barY, barW * speedRatio, barH, 3);
    ctx.fill();
  }

  // ── Wave flash overlay ─────────────────────────────────────────────────────
  if (waveFlashTimer > 0) {
    const flashA = Math.min(1, waveFlashTimer * 2.8) * 0.6;
    ctx.save();
    ctx.globalAlpha = flashA;
    ctx.fillStyle = '#fff9c4';
    ctx.fillRect(0, 0, CW, CH);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = Math.min(1, waveFlashTimer * 3.5);
    ctx.fillStyle = '#cc4400';
    ctx.font = 'bold 30px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Wave ${waveNum + 1}! 🚀`, CW / 2, CH / 2 - 4);
    ctx.restore();
  }
}

// ─── Obstacle spawner ─────────────────────────────────────────────────────────
let _obId = 0;
function spawnObstacle(s) {
  const roll = Math.random();
  const type = roll < 0.45 ? 'rock' : roll < 0.75 ? 'cloud' : 'bird';
  let w, h, y;
  if (type === 'rock') {
    w = randInt(36, 58);  h = randInt(44, 72);
    y = randF(PLANE_Y_MIN + 8, PLANE_Y_MAX - h);
  } else if (type === 'cloud') {
    w = randInt(52, 85);  h = randInt(48, 68);
    y = randF(PLANE_Y_MIN + 4, PLANE_Y_MAX - h + 10);
  } else {
    w = randInt(65, 95);  h = randInt(55, 75);
    y = randF(PLANE_Y_MIN + 10, PLANE_Y_MAX - 35);
  }
  s.obstacles.push({ id: `ob-${_obId++}`, worldX: s.nextObstacleX, y, w, h, type });
  // Gap shrinks with waves but has a floor
  const minGap = Math.max(190, 400 - s.waveNum * 16);
  const maxGap = Math.max(260, 540 - s.waveNum * 14);
  s.nextObstacleX += randInt(minGap, maxGap);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PlaneForestRunGame() {
  const { t } = useI18n();
  const canvasRef    = useRef(null);
  const rafRef       = useRef(0);
  const lastTimeRef  = useRef(0);
  const pressedRef   = useRef({ up: false, down: false });

  const [mode,      setMode]      = useState('idle');
  const [score,     setScore]     = useState(0);
  const [highScore, setHighScore] = useState(0);
  const highScoreRef              = useRef(0);  // stable ref for RAF closure
  const [lives,     setLives]     = useState(MAX_LIVES);
  const [wave,      setWave]      = useState(0);
  const [status,    setStatus]    = useState('');

  const stateRef = useRef({
    distance:          0,
    speed:             INITIAL_SPEED,
    plane:             { x: PLANE_X, y: PLANE_Y_MID },
    obstacles:         [],
    lives:             MAX_LIVES,
    invTimer:          0,
    waveNum:           0,
    waveFlashTimer:    0,
    propAngle:         0,
    exhaustParticles:  [],
    score:             0,
    nextObstacleX:     520,
    mode:              'idle',
  });

  // Load high score on mount
  useEffect(() => {
    const saved = Number(window.localStorage.getItem(HIGH_SCORE_KEY) || 0);
    if (Number.isFinite(saved) && saved > 0) {
      setHighScore(saved);
      highScoreRef.current = saved;
    }
    setStatus(t('planeGame.status.idle'));
  }, [t]);

  const syncState = () => {
    const s = stateRef.current;
    setScore(s.score);
    setLives(s.lives);
    setWave(s.waveNum);
  };

  const endGame = () => {
    const s = stateRef.current;
    s.mode = 'gameOver';
    setMode('gameOver');
    syncState();
    if (s.score > highScoreRef.current) {
      highScoreRef.current = s.score;
      setHighScore(s.score);
      window.localStorage.setItem(HIGH_SCORE_KEY, String(s.score));
    }
  };

  const startRun = () => {
    stateRef.current = {
      distance:         0,
      speed:            INITIAL_SPEED,
      plane:            { x: PLANE_X, y: PLANE_Y_MID },
      obstacles:        [],
      lives:            MAX_LIVES,
      invTimer:         0,
      waveNum:          0,
      waveFlashTimer:   0,
      propAngle:        0,
      exhaustParticles: [],
      score:            0,
      nextObstacleX:    520,
      mode:             'playing',
    };
    setMode('playing');
    setScore(0);
    setLives(MAX_LIVES);
    setWave(0);
    setStatus(t('planeGame.status.start'));
    lastTimeRef.current = 0;
  };

  // Game update logic
  const update = (dt) => {
    const s = stateRef.current;
    if (s.mode !== 'playing') return;

    // Vertical movement
    const { up, down } = pressedRef.current;
    const moveY = (down ? 1 : 0) - (up ? 1 : 0);
    s.plane.y = clamp(s.plane.y + moveY * 228 * dt, PLANE_Y_MIN, PLANE_Y_MAX);

    // Advance world
    s.distance  += s.speed * dt;
    s.score      = Math.floor(s.distance / 20);

    // Wave / speed ramp
    const newWave = Math.floor(s.distance / WAVE_DIST);
    if (newWave > s.waveNum) {
      s.waveNum          = newWave;
      s.speed            = Math.min(MAX_SPEED, INITIAL_SPEED + newWave * SPEED_INC);
      s.waveFlashTimer   = 1.1;
    }
    s.waveFlashTimer = Math.max(0, s.waveFlashTimer - dt);
    s.invTimer       = Math.max(0, s.invTimer - dt);

    // Spawn obstacles ahead of visible area
    while (s.nextObstacleX < s.distance + CW + 320) {
      spawnObstacle(s);
    }
    // Cull obstacles far behind
    s.obstacles = s.obstacles.filter((o) => o.worldX > s.distance - 300);

    // Propeller spin (faster at higher speed)
    s.propAngle += (7 + s.speed / 48) * dt * Math.PI;

    // Exhaust particles from tail
    s.exhaustParticles.push({
      x:       s.plane.x - 30 + randF(-2, 2),
      y:       s.plane.y +  8 + randF(-4, 4),
      vx:      randF(-55, -20),
      vy:      randF(-14, 14),
      life:    0.55,
      maxLife: 0.55,
      r:       randF(2.5, 5.5),
    });
    s.exhaustParticles.forEach((p) => {
      p.x    += p.vx * dt;
      p.y    += p.vy * dt;
      p.life -= dt;
    });
    s.exhaustParticles = s.exhaustParticles.filter((p) => p.life > 0);

    // Collision detection
    if (s.invTimer <= 0) {
      // Tight hit box (inner portion of plane)
      const pr = { x: s.plane.x - 24, y: s.plane.y - 10, w: 52, h: 20 };
      for (const o of s.obstacles) {
        const sx = o.worldX - s.distance + PLANE_X;
        const or = { x: sx, y: o.y, w: o.w, h: o.h };
        if (intersects(pr, or)) {
          s.lives--;
          s.invTimer = INV_DUR;
          if (s.lives <= 0) {
            setStatus(t('planeGame.status.gameOver'));
            endGame();
            return;
          }
          setStatus(t('planeGame.status.hit', { lives: s.lives }));
          break;
        }
      }
    }
  };

  // Render loop
  useEffect(() => {
    const frame = (ts) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = Math.min(0.05, (ts - lastTimeRef.current) / 1000);
      lastTimeRef.current = ts;
      update(dt);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        drawScene(ctx, stateRef.current);
        syncState();
      }

      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard input
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'ArrowUp'   || e.key === 'w') { e.preventDefault(); pressedRef.current.up   = true; }
      if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); pressedRef.current.down = true; }
    };
    const up = (e) => {
      if (e.key === 'ArrowUp'   || e.key === 'w') { e.preventDefault(); pressedRef.current.up   = false; }
      if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); pressedRef.current.down = false; }
    };
    window.addEventListener('keydown', down, { passive: false });
    window.addEventListener('keyup',   up,   { passive: false });
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
    };
  }, []);

  const setBtn = (key, val) => { pressedRef.current[key] = val; };

  return (
    <main className={styles.page}>
      <section className={styles.card}>

        {/* Header */}
        <div className={styles.head}>
          <div>
            <h1>{t('planeGame.title')}</h1>
            <p>{t('planeGame.lead')}</p>
          </div>
          <LocaleSwitcher />
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t('planeGame.score')}</span>
            <strong className={styles.statValue}>{score}</strong>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t('planeGame.highScore')}</span>
            <strong className={styles.statValue}>{highScore}</strong>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{t('planeGame.wave')}</span>
            <strong className={styles.statValue}>{wave + 1}</strong>
          </div>
        </div>

        {/* Status */}
        <p className={styles.status}>{status}</p>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          className={styles.canvas}
          aria-label="Plane forest run game canvas"
        />

        {/* Controls */}
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.btnControl}
            onPointerDown={(e) => { e.preventDefault(); setBtn('up',   true);  }}
            onPointerUp={(e)   => { e.preventDefault(); setBtn('up',   false); }}
            onPointerLeave={()  =>                      setBtn('up',   false)  }
          >↑</button>
          <button
            type="button"
            className={styles.btnControl}
            onPointerDown={(e) => { e.preventDefault(); setBtn('down', true);  }}
            onPointerUp={(e)   => { e.preventDefault(); setBtn('down', false); }}
            onPointerLeave={()  =>                      setBtn('down', false)  }
          >↓</button>
        </div>

        {/* Start / Play Again */}
        {(mode === 'idle' || mode === 'gameOver') && (
          <div className={styles.actions}>
            <button type="button" className={styles.btnStart} onClick={startRun}>
              {mode === 'idle' ? t('planeGame.start') : t('planeGame.playAgain')}
            </button>
          </div>
        )}

      </section>
    </main>
  );
}
