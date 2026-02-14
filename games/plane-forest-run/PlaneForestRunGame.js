'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { useI18n } from '../../lib/i18n/I18nProvider';
import styles from './planeForestRun.module.css';

const HIGH_SCORE_KEY = 'planeForestRunHighScoreV1';
const MAP_LENGTH = 6200;
const CHECKPOINTS = [0.25, 0.5, 0.75];

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMap() {
  const obstacles = [];
  let worldX = 520;
  let id = 0;

  while (worldX < MAP_LENGTH - 300) {
    const lane = randomInt(0, 4);
    const width = randomInt(30, 52);
    const height = randomInt(30, 60);
    obstacles.push({
      id: `ob-${id++}`,
      worldX,
      y: 58 + lane * 52 + randomInt(-10, 10),
      w: width,
      h: height,
      passed: false,
    });
    worldX += randomInt(180, 260);
  }

  return obstacles;
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function drawScene(ctx, width, height, state) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#dff4ff');
  sky.addColorStop(0.6, '#f0ffe8');
  sky.addColorStop(1, '#fff4df');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#b8e5b7';
  for (let i = 0; i < 10; i += 1) {
    const x = ((i * 130 - (state.distance * 0.15) % 130) + width) % (width + 120) - 60;
    ctx.beginPath();
    ctx.arc(x, height - 24, 38, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#7ccf85';
  for (let i = 0; i < 12; i += 1) {
    const x = ((i * 95 - (state.distance * 0.36) % 95) + width) % (width + 100) - 40;
    ctx.fillRect(x, height - 66, 8, 30);
    ctx.beginPath();
    ctx.arc(x + 4, height - 72, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#f4dfc4';
  ctx.fillRect(0, height - 52, width, 52);
  ctx.strokeStyle = '#dcc29f';
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(0, height - 26);
  ctx.lineTo(width, height - 26);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#7ec5ed';
  ctx.fillRect(12, 12, width - 24, 10);
  ctx.fillStyle = '#5fb07d';
  ctx.fillRect(12, 12, (width - 24) * (state.distance / MAP_LENGTH), 10);

  const checkpointXs = CHECKPOINTS.map((ratio) => ratio * MAP_LENGTH);
  checkpointXs.forEach((worldX, idx) => {
    const screenX = worldX - state.distance + state.plane.x;
    if (screenX > -30 && screenX < width + 30) {
      ctx.strokeStyle = '#8b73b7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(screenX, 26);
      ctx.lineTo(screenX, height - 54);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Nunito';
      ctx.fillText(`CP${idx + 1}`, screenX - 16, 46);
    }
  });

  state.obstacles.forEach((o) => {
    const x = o.worldX - state.distance + state.plane.x;
    if (x < -80 || x > width + 40) {
      return;
    }
    ctx.fillStyle = '#9a6c44';
    ctx.fillRect(x, o.y, o.w, o.h);
    ctx.fillStyle = '#7e4f2d';
    ctx.fillRect(x + 4, o.y + 4, o.w - 8, o.h - 8);
  });

  const p = state.plane;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = '#f2d6b2';
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.lineTo(40, 0);
  ctx.lineTo(40, 32);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8fc7f6';
  ctx.fillRect(10, 10, 16, 12);
  ctx.fillStyle = '#f4978e';
  ctx.fillRect(34, 13, 8, 6);
  ctx.restore();
}

export default function PlaneForestRunGame() {
  const { t } = useI18n();
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const pressedRef = useRef({ up: false, down: false });
  const [mode, setMode] = useState('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [checkpointsPassed, setCheckpointsPassed] = useState(0);
  const [status, setStatus] = useState('');

  const stateRef = useRef({
    distance: 0,
    speed: 220,
    plane: { x: 120, y: 124, w: 40, h: 32 },
    obstacles: [],
    checkpointsDone: [false, false, false],
    lastCheckpointDistance: 0,
    respawnTimer: 0,
    mode: 'idle',
    score: 0,
  });

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(HIGH_SCORE_KEY) || 0);
    if (Number.isFinite(saved) && saved > 0) {
      setHighScore(saved);
    }
    setStatus(t('planeGame.status.idle'));
  }, [t]);

  const checkpointText = useMemo(
    () => `${checkpointsPassed}/3`,
    [checkpointsPassed]
  );

  const syncPublicState = () => {
    const s = stateRef.current;
    setScore(s.score);
    setCheckpointsPassed(s.checkpointsDone.filter(Boolean).length);
  };

  const finishGame = (nextMode) => {
    stateRef.current.mode = nextMode;
    setMode(nextMode);
    syncPublicState();
    if (stateRef.current.score > highScore) {
      setHighScore(stateRef.current.score);
      window.localStorage.setItem(HIGH_SCORE_KEY, String(stateRef.current.score));
    }
  };

  const resetRun = () => {
    stateRef.current = {
      distance: 0,
      speed: 220,
      plane: { x: 120, y: 124, w: 40, h: 32 },
      obstacles: generateMap(),
      checkpointsDone: [false, false, false],
      lastCheckpointDistance: 0,
      respawnTimer: 0,
      mode: 'playing',
      score: 0,
    };
    setMode('playing');
    setScore(0);
    setCheckpointsPassed(0);
    setStatus(t('planeGame.status.start'));
  };

  const update = (dt) => {
    const s = stateRef.current;
    if (s.mode !== 'playing') {
      return;
    }

    const input = pressedRef.current;
    const moveY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    s.plane.y = clamp(s.plane.y + moveY * 210 * dt, 36, 184);
    s.plane.x = 120;
    s.distance += s.speed * dt;
    s.respawnTimer = Math.max(0, s.respawnTimer - dt);
    s.score = Math.floor(s.distance / 30);

    s.obstacles.forEach((o) => {
      if (!o.passed && o.worldX + o.w < s.distance - s.plane.x) {
        o.passed = true;
        s.score += 4;
      }
    });

    CHECKPOINTS.forEach((ratio, idx) => {
      const cpX = ratio * MAP_LENGTH;
      if (!s.checkpointsDone[idx] && s.distance >= cpX) {
        s.checkpointsDone[idx] = true;
        s.lastCheckpointDistance = cpX;
        s.score += 25;
        setStatus(t('planeGame.status.checkpoint', { index: idx + 1 }));
      }
    });

    const planeRect = { x: s.plane.x, y: s.plane.y, w: s.plane.w, h: s.plane.h };
    for (const o of s.obstacles) {
      const x = o.worldX - s.distance + s.plane.x;
      if (x < -120 || x > 420) {
        continue;
      }
      const obsRect = { x, y: o.y, w: o.w, h: o.h };
      if (intersects(planeRect, obsRect) && s.respawnTimer <= 0) {
        if (s.lastCheckpointDistance > 0) {
          s.distance = s.lastCheckpointDistance;
          s.plane.y = 124;
          s.respawnTimer = 1.25;
          setStatus(t('planeGame.status.respawn'));
          return;
        }

        setStatus(t('planeGame.status.crash'));
        finishGame('gameOver');
        return;
      }
    }

    if (s.distance >= MAP_LENGTH) {
      setStatus(t('planeGame.status.finish'));
      finishGame('won');
    }
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    drawScene(ctx, canvas.width, canvas.height, stateRef.current);
    syncPublicState();
  };

  useEffect(() => {
    const frame = (ts) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = ts;
      }
      const dt = Math.min(0.033, (ts - lastTimeRef.current) / 1000);
      lastTimeRef.current = ts;
      update(dt);
      render();
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    window.render_game_to_text = () => {
      const s = stateRef.current;
      const nextObstacle = s.obstacles
        .map((o) => ({
          distance: Math.round(o.worldX - s.distance),
          y: o.y,
          w: o.w,
          h: o.h,
        }))
        .filter((o) => o.distance > -60)
        .sort((a, b) => a.distance - b.distance)[0];

      return JSON.stringify({
        coordinate_system: 'origin top-left, x right, y down',
        mode: s.mode,
        distance: Math.round(s.distance),
        score: s.score,
        plane: { x: Math.round(s.plane.x), y: Math.round(s.plane.y), w: s.plane.w, h: s.plane.h },
        checkpoints: s.checkpointsDone,
        respawn_timer: Number(s.respawnTimer.toFixed(2)),
        next_obstacle: nextObstacle || null,
      });
    };

    window.advanceTime = (ms) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let i = 0; i < steps; i += 1) {
        update(1 / 60);
      }
      render();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        pressedRef.current.up = true;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        pressedRef.current.down = true;
      }
    };
    const onKeyUp = (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        pressedRef.current.up = false;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        pressedRef.current.down = false;
      }
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const setButton = (key, value) => {
    pressedRef.current[key] = value;
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.head}>
          <div>
            <h1>{t('planeGame.title')}</h1>
            <p>{t('planeGame.lead')}</p>
          </div>
          <LocaleSwitcher />
        </div>

        <div className={styles.stats}>
          <p>{t('planeGame.score')}: <strong>{score}</strong></p>
          <p>{t('planeGame.highScore')}: <strong>{highScore}</strong></p>
          <p>{t('planeGame.checkpoints')}: <strong>{checkpointText}</strong></p>
        </div>

        <p className={styles.status}>{status}</p>

        <canvas
          ref={canvasRef}
          width={360}
          height={236}
          className={styles.canvas}
          aria-label="Plane forest run game canvas"
        />

        <div className={styles.controls}>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setButton('up', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              setButton('up', false);
            }}
            onPointerLeave={() => setButton('up', false)}
            onTouchStart={(e) => e.preventDefault()}
            onTouchEnd={(e) => e.preventDefault()}
          >
            ↑
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setButton('down', true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              setButton('down', false);
            }}
            onPointerLeave={() => setButton('down', false)}
            onTouchStart={(e) => e.preventDefault()}
            onTouchEnd={(e) => e.preventDefault()}
          >
            ↓
          </button>
        </div>

        <div className={styles.actions}>
          {(mode === 'idle' || mode === 'gameOver' || mode === 'won') && (
            <button type="button" onClick={resetRun}>
              {mode === 'idle' ? t('planeGame.start') : t('planeGame.playAgain')}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
