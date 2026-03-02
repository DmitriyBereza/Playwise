'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { useI18n } from '../../lib/i18n/I18nProvider';
import styles from './colorShapeSorter.module.css';

const HIGH_SCORE_KEY = 'colorShapeSorterHighScoreV1';
const ITEMS_PER_ROUND = 10;
const FEEDBACK_MS = 600;
const SCORE_CORRECT = 10;
const STREAK_BONUS = 5;

const SHAPES = ['circle', 'square', 'triangle', 'star'];
const COLORS = [
  { key: 'red', hex: '#ff6b6b' },
  { key: 'blue', hex: '#6bcBef' },
  { key: 'yellow', hex: '#ffd93d' },
  { key: 'green', hex: '#9cf196' },
];

const DIFFICULTIES = {
  easy: { sortBy: 'color' },
  medium: { sortBy: 'shape' },
  hard: { sortBy: 'both' },
};

/* ---- SVG shape renderers ---- */

function ShapeSvg({ shape, color, size = 64 }) {
  const half = size / 2;

  switch (shape) {
    case 'circle':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle cx={half} cy={half} r={half - 4} fill={color} stroke="#fff" strokeWidth={3} />
        </svg>
      );
    case 'square':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <rect x={4} y={4} width={size - 8} height={size - 8} rx={6} fill={color} stroke="#fff" strokeWidth={3} />
        </svg>
      );
    case 'triangle': {
      const pad = 5;
      const points = `${half},${pad} ${size - pad},${size - pad} ${pad},${size - pad}`;
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <polygon points={points} fill={color} stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
        </svg>
      );
    }
    case 'star': {
      const cx = half;
      const cy = half;
      const outer = half - 4;
      const inner = outer * 0.42;
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const angleOuter = (Math.PI / 180) * (i * 72 - 90);
        const angleInner = (Math.PI / 180) * (i * 72 + 36 - 90);
        pts.push(`${cx + outer * Math.cos(angleOuter)},${cy + outer * Math.sin(angleOuter)}`);
        pts.push(`${cx + inner * Math.cos(angleInner)},${cy + inner * Math.sin(angleInner)}`);
      }
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <polygon points={pts.join(' ')} fill={color} stroke="#fff" strokeWidth={3} strokeLinejoin="round" />
        </svg>
      );
    }
    default:
      return null;
  }
}

/* ---- Helpers ---- */

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildBins(difficulty) {
  const { sortBy } = DIFFICULTIES[difficulty];

  if (sortBy === 'color') {
    return COLORS.slice(0, 3).map((c) => ({
      key: c.key,
      colorKey: c.key,
      colorHex: c.hex,
      shapeKey: null,
      label: c.key,
    }));
  }

  if (sortBy === 'shape') {
    return SHAPES.map((s) => ({
      key: s,
      colorKey: null,
      colorHex: '#bbb',
      shapeKey: s,
      label: s,
    }));
  }

  /* sortBy === 'both' */
  const combos = [];
  const usedKeys = new Set();
  while (combos.length < 4) {
    const shape = randomPick(SHAPES);
    const color = randomPick(COLORS);
    const k = `${color.key}-${shape}`;
    if (!usedKeys.has(k)) {
      usedKeys.add(k);
      combos.push({
        key: k,
        colorKey: color.key,
        colorHex: color.hex,
        shapeKey: shape,
        label: `${color.key}-${shape}`,
      });
    }
  }
  return combos;
}

function generateItemForBins(bins, difficulty) {
  const { sortBy } = DIFFICULTIES[difficulty];
  const bin = randomPick(bins);

  if (sortBy === 'color') {
    const color = COLORS.find((c) => c.key === bin.colorKey);
    const shape = randomPick(SHAPES);
    return { shape, color, id: `${shape}-${color.key}-${Math.random().toString(36).slice(2, 8)}` };
  }

  if (sortBy === 'shape') {
    const color = randomPick(COLORS);
    return { shape: bin.shapeKey, color, id: `${bin.shapeKey}-${color.key}-${Math.random().toString(36).slice(2, 8)}` };
  }

  /* both */
  const color = COLORS.find((c) => c.key === bin.colorKey);
  return { shape: bin.shapeKey, color, id: `${bin.shapeKey}-${color.key}-${Math.random().toString(36).slice(2, 8)}` };
}

function isCorrectBin(item, bin, difficulty) {
  const { sortBy } = DIFFICULTIES[difficulty];

  if (sortBy === 'color') {
    return item.color.key === bin.colorKey;
  }
  if (sortBy === 'shape') {
    return item.shape === bin.shapeKey;
  }
  /* both */
  return item.color.key === bin.colorKey && item.shape === bin.shapeKey;
}

export default function ColorShapeSorterGame() {
  const { t } = useI18n();

  const [difficulty, setDifficulty] = useState('easy');
  const [phase, setPhase] = useState('idle'); /* idle | playing | won */
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [itemsLeft, setItemsLeft] = useState(ITEMS_PER_ROUND);
  const [currentItem, setCurrentItem] = useState(null);
  const [bins, setBins] = useState([]);
  const [feedback, setFeedback] = useState('idle'); /* idle | correct | wrong */
  const [status, setStatus] = useState('');

  /* Load high score */
  useEffect(() => {
    const stored = Number(window.localStorage.getItem(HIGH_SCORE_KEY) || 0);
    if (Number.isFinite(stored) && stored > 0) {
      setHighScore(stored);
    }
  }, []);

  /* Initial status */
  useEffect(() => {
    if (phase === 'idle') {
      setStatus('');
    }
  }, [phase, t]);

  const sortByLabel = useMemo(() => {
    const { sortBy } = DIFFICULTIES[difficulty];
    if (sortBy === 'color') return t('colorShapeSorterGame.sortByColor');
    if (sortBy === 'shape') return t('colorShapeSorterGame.sortByShape');
    return t('colorShapeSorterGame.sortByBoth');
  }, [difficulty, t]);

  const startGame = useCallback(() => {
    const newBins = buildBins(difficulty);
    const firstItem = generateItemForBins(newBins, difficulty);
    setBins(newBins);
    setCurrentItem(firstItem);
    setScore(0);
    setStreak(0);
    setItemsLeft(ITEMS_PER_ROUND);
    setPhase('playing');
    setFeedback('idle');
    setStatus(`${t('colorShapeSorterGame.sortBy')}: ${sortByLabel}`);
  }, [difficulty, sortByLabel, t]);

  const saveHighScore = useCallback(
    (newScore) => {
      if (newScore > highScore) {
        setHighScore(newScore);
        window.localStorage.setItem(HIGH_SCORE_KEY, String(newScore));
      }
    },
    [highScore]
  );

  const advanceOrFinish = useCallback(
    (newScore, newStreak, remaining) => {
      saveHighScore(newScore);

      if (remaining <= 0) {
        setPhase('won');
        setStatus(t('colorShapeSorterGame.roundComplete'));
        return;
      }

      const nextItem = generateItemForBins(bins, difficulty);
      setCurrentItem(nextItem);
      setItemsLeft(remaining);
    },
    [bins, difficulty, saveHighScore, t]
  );

  const handleBinClick = useCallback(
    (bin) => {
      if (phase !== 'playing' || !currentItem || feedback !== 'idle') {
        return;
      }

      if (isCorrectBin(currentItem, bin, difficulty)) {
        const newStreak = streak + 1;
        const bonus = newStreak > 1 ? STREAK_BONUS * (newStreak - 1) : 0;
        const gained = SCORE_CORRECT + bonus;
        const newScore = score + gained;
        const remaining = itemsLeft - 1;

        setScore(newScore);
        setStreak(newStreak);
        setFeedback('correct');
        setStatus(
          newStreak > 1
            ? `${t('colorShapeSorterGame.correct')} ${t('colorShapeSorterGame.streak', { count: newStreak })}`
            : t('colorShapeSorterGame.correct')
        );

        setTimeout(() => {
          setFeedback('idle');
          advanceOrFinish(newScore, newStreak, remaining);
        }, FEEDBACK_MS);
      } else {
        setStreak(0);
        setFeedback('wrong');
        setStatus(t('colorShapeSorterGame.tryAgain'));

        setTimeout(() => {
          setFeedback('idle');
        }, FEEDBACK_MS);
      }
    },
    [phase, currentItem, feedback, difficulty, streak, score, itemsLeft, advanceOrFinish, t]
  );

  const resetToMenu = () => {
    setPhase('idle');
    setCurrentItem(null);
    setBins([]);
    setScore(0);
    setStreak(0);
    setItemsLeft(ITEMS_PER_ROUND);
    setFeedback('idle');
    setStatus('');
  };

  const progressPercent = ITEMS_PER_ROUND
    ? Math.round(((ITEMS_PER_ROUND - itemsLeft) / ITEMS_PER_ROUND) * 100)
    : 0;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        {/* Header */}
        <div className={styles.head}>
          <div>
            <h1>{t('colorShapeSorterGame.title')}</h1>
            <p>{t('colorShapeSorterGame.lead')}</p>
          </div>
          <LocaleSwitcher />
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <p>
            {t('colorShapeSorterGame.score')}: <strong>{score}</strong>
          </p>
          <p>
            {t('colorShapeSorterGame.highScore')}: <strong>{highScore}</strong>
          </p>
          <p>
            {t('colorShapeSorterGame.itemsLeft', { count: itemsLeft })}
          </p>
          {streak > 1 && (
            <p className={styles.streakBadge}>
              <strong>{t('colorShapeSorterGame.streak', { count: streak })}</strong>
            </p>
          )}
        </div>

        {/* Progress bar */}
        {phase === 'playing' && (
          <div className={styles.progressBar} role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
        )}

        {/* Status */}
        <p className={styles.status} aria-live="polite">
          {status}
        </p>

        {/* Idle: difficulty selector */}
        {phase === 'idle' && (
          <section className={styles.menu}>
            <h2>{t('colorShapeSorterGame.sortBy')}</h2>
            <div className={styles.difficultyRow}>
              {Object.keys(DIFFICULTIES).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.difficultyBtn} ${difficulty === key ? styles.difficultyActive : ''}`}
                  onClick={() => setDifficulty(key)}
                >
                  {t(`colorShapeSorterGame.difficulty.${key}`)}
                  <span>
                    {key === 'easy' && t('colorShapeSorterGame.sortByColor')}
                    {key === 'medium' && t('colorShapeSorterGame.sortByShape')}
                    {key === 'hard' && t('colorShapeSorterGame.sortByBoth')}
                  </span>
                </button>
              ))}
            </div>
            <button type="button" className={styles.startBtn} onClick={startGame}>
              {t('colorShapeSorterGame.startButton')}
            </button>
          </section>
        )}

        {/* Playing: shape + bins */}
        {phase === 'playing' && currentItem && (
          <section className={styles.arena}>
            {/* Current shape */}
            <div
              className={`${styles.shapeDisplay} ${feedback === 'correct' ? styles.shapeCorrect : ''} ${feedback === 'wrong' ? styles.shapeWrong : ''}`}
              aria-label={`${t(`colorShapeSorterGame.colors.${currentItem.color.key}`)} ${t(`colorShapeSorterGame.shapes.${currentItem.shape}`)}`}
            >
              <ShapeSvg shape={currentItem.shape} color={currentItem.color.hex} size={96} />
              <span className={styles.shapeLabel}>
                {t(`colorShapeSorterGame.colors.${currentItem.color.key}`)}{' '}
                {t(`colorShapeSorterGame.shapes.${currentItem.shape}`)}
              </span>
            </div>

            {/* Bins */}
            <div className={styles.bins}>
              {bins.map((bin) => {
                const binShape = bin.shapeKey || 'circle';
                const binColor = bin.colorHex || '#ccc';
                return (
                  <button
                    key={bin.key}
                    type="button"
                    className={styles.bin}
                    onClick={() => handleBinClick(bin)}
                    aria-label={
                      bin.shapeKey && bin.colorKey
                        ? `${t(`colorShapeSorterGame.colors.${bin.colorKey}`)} ${t(`colorShapeSorterGame.shapes.${bin.shapeKey}`)}`
                        : bin.colorKey
                          ? t(`colorShapeSorterGame.colors.${bin.colorKey}`)
                          : t(`colorShapeSorterGame.shapes.${bin.shapeKey}`)
                    }
                  >
                    <ShapeSvg shape={binShape} color={binColor} size={48} />
                    <span className={styles.binLabel}>
                      {bin.colorKey && t(`colorShapeSorterGame.colors.${bin.colorKey}`)}
                      {bin.colorKey && bin.shapeKey && ' '}
                      {bin.shapeKey && t(`colorShapeSorterGame.shapes.${bin.shapeKey}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Won / summary */}
        {phase === 'won' && (
          <section className={styles.summary}>
            <h2>{t('colorShapeSorterGame.roundComplete')}</h2>
            <p>
              {t('colorShapeSorterGame.score')}: <strong>{score}</strong>
            </p>
            <div className={styles.summaryActions}>
              <button type="button" className={styles.startBtn} onClick={startGame}>
                {t('colorShapeSorterGame.playAgain')}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={resetToMenu}>
                {t('colorShapeSorterGame.backToMenu')}
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
