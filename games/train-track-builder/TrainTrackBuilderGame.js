'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useI18n } from '../../lib/i18n/I18nProvider';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { generateLevel, validatePath } from './gridLogic';
import { rotateClockwise } from './pieces';
import styles from './trainTrackBuilder.module.css';

// Dynamic import — Three.js needs window/document
const TrackScene = dynamic(() => import('./scene/TrackScene'), { ssr: false });

const HIGH_SCORE_KEY = 'trainTrackBuilderHighScoreV1';
const MAX_LEVEL_KEY = 'trainTrackBuilderMaxLevelV1';
const SKIN_KEY = 'trainTrackBuilderSkinV1';

const CONFETTI_COLORS = ['#D94040', '#FFD93D', '#4AAF5A', '#5BC0EB', '#FF8FAB', '#A78BFA'];

const SKIN_OPTIONS = [
  { key: 'countryside', label: 'Countryside' },
  { key: 'industrial', label: 'Industrial' },
  { key: 'desert', label: 'Desert' },
];

export default function TrainTrackBuilderGame() {
  const { t } = useI18n();

  // Game state
  const [phase, setPhase] = useState('idle'); // idle | building | running | celebrating
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState([]);
  const [pool, setPool] = useState([]);
  const [cols, setCols] = useState(4);
  const [rows, setRows] = useState(3);
  const [stationA, setStationA] = useState(null);
  const [stationB, setStationB] = useState(null);
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [validPathResult, setValidPathResult] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [maxLevel, setMaxLevel] = useState(1);
  const [levelScore, setLevelScore] = useState(0);
  const [skin, setSkin] = useState('countryside');
  const [showConfetti, setShowConfetti] = useState(false);

  const lastTapRef = useRef({ id: null, time: 0 });

  // Load persisted data
  useEffect(() => {
    try {
      const hs = window.localStorage.getItem(HIGH_SCORE_KEY);
      if (hs) setHighScore(parseInt(hs, 10) || 0);
      const ml = window.localStorage.getItem(MAX_LEVEL_KEY);
      if (ml) setMaxLevel(parseInt(ml, 10) || 1);
      const sk = window.localStorage.getItem(SKIN_KEY);
      if (sk) setSkin(sk);
    } catch { /* ignore */ }
  }, []);

  // Persist high score / max level
  const persistStats = useCallback((newScore, newMaxLevel) => {
    try {
      if (newScore > highScore) {
        setHighScore(newScore);
        window.localStorage.setItem(HIGH_SCORE_KEY, String(newScore));
      }
      if (newMaxLevel > maxLevel) {
        setMaxLevel(newMaxLevel);
        window.localStorage.setItem(MAX_LEVEL_KEY, String(newMaxLevel));
      }
    } catch { /* ignore */ }
  }, [highScore, maxLevel]);

  // Handle skin change
  const handleSkinChange = useCallback((newSkin) => {
    setSkin(newSkin);
    try { window.localStorage.setItem(SKIN_KEY, newSkin); } catch { /* ignore */ }
  }, []);

  // Start a level
  const startLevel = useCallback((lvl) => {
    const data = generateLevel(lvl);
    setGrid(data.grid);
    setPool(data.pool);
    setCols(data.cols);
    setRows(data.rows);
    setStationA(data.stationA);
    setStationB(data.stationB);
    setSelectedPieceId(null);
    setValidPathResult(null);
    setPhase('building');
  }, []);

  // Handle start button
  const handleStart = useCallback(() => {
    setScore(0);
    setLevel(1);
    startLevel(1);
  }, [startLevel]);

  // Revalidate path whenever grid changes
  const revalidate = useCallback((g) => {
    if (!stationA || !stationB) return;
    const result = validatePath(g, stationA, stationB, rows, cols);
    setValidPathResult(result);
  }, [stationA, stationB, rows, cols]);

  // Select a piece from pool
  const handlePoolClick = useCallback((pieceId) => {
    if (phase !== 'building') return;
    const piece = pool.find((p) => p.id === pieceId);
    if (!piece || piece.used) return;
    setSelectedPieceId((prev) => (prev === pieceId ? null : pieceId));
  }, [phase, pool]);

  // Place a piece on the grid (called from 3D scene click)
  const handleCellClick = useCallback((r, c) => {
    if (phase !== 'building') return;
    const cell = grid[r][c];

    // If cell has a placed piece, handle rotation or removal
    if (cell.piece) {
      const now = Date.now();
      const cellKey = `${r},${c}`;
      // Double-tap detection for removal
      if (lastTapRef.current.id === cellKey && now - lastTapRef.current.time < 400) {
        // Remove piece — return to pool
        const newGrid = grid.map((row) => row.map((cl) => ({ ...cl })));
        const removedPiece = newGrid[r][c].piece;
        newGrid[r][c].piece = null;
        newGrid[r][c].rotation = 0;
        setGrid(newGrid);
        setPool((prev) =>
          prev.map((p) =>
            p.used && p.pieceType === removedPiece ? { ...p, used: false } : p
          )
        );
        revalidate(newGrid);
        lastTapRef.current = { id: null, time: 0 };
        return;
      }

      // Single tap — rotate
      lastTapRef.current = { id: cellKey, time: now };
      const newGrid = grid.map((row) => row.map((cl) => ({ ...cl })));
      newGrid[r][c].rotation = rotateClockwise(newGrid[r][c].rotation);
      setGrid(newGrid);
      revalidate(newGrid);
      return;
    }

    // If cell is empty/buildable and a piece is selected, place it
    if (cell.type === 'empty' && !cell.obstacle && selectedPieceId) {
      const pieceIdx = pool.findIndex((p) => p.id === selectedPieceId);
      if (pieceIdx === -1 || pool[pieceIdx].used) return;

      const newGrid = grid.map((row) => row.map((cl) => ({ ...cl })));
      newGrid[r][c].piece = pool[pieceIdx].pieceType;
      newGrid[r][c].rotation = 0;
      setGrid(newGrid);

      setPool((prev) =>
        prev.map((p) => (p.id === selectedPieceId ? { ...p, used: true } : p))
      );
      setSelectedPieceId(null);
      revalidate(newGrid);
    }

    lastTapRef.current = { id: null, time: 0 };
  }, [phase, grid, selectedPieceId, pool, revalidate]);

  // "Go!" button — start train animation in 3D
  const handleGo = useCallback(() => {
    if (!validPathResult?.valid || phase !== 'building') return;
    setPhase('running');
    setSelectedPieceId(null);
  }, [validPathResult, phase]);

  // Called when the 3D train arrives at station B
  const handleTrainArrived = useCallback(() => {
    const unusedPieces = pool.filter((p) => !p.used).length;
    const ls = 10 + unusedPieces * 2 + level * 5;
    setLevelScore(ls);
    const newTotal = score + ls;
    setScore(newTotal);
    persistStats(newTotal, level);

    setShowConfetti(true);
    setPhase('celebrating');
  }, [pool, level, score, persistStats]);

  // Next level
  const handleNextLevel = useCallback(() => {
    setShowConfetti(false);
    const next = level + 1;
    setLevel(next);
    startLevel(next);
  }, [level, startLevel]);

  // Reset level
  const handleResetLevel = useCallback(() => {
    startLevel(level);
  }, [level, startLevel]);

  // Count placed pieces on the grid
  const placedCount = useMemo(() => {
    return grid.reduce((acc, row) => acc + row.filter((cell) => cell.piece).length, 0);
  }, [grid]);

  // Get status message
  const statusMessage = useMemo(() => {
    if (phase === 'idle') return t('trainGame.status.idle');
    if (phase === 'running') return t('trainGame.status.running');
    if (phase === 'celebrating') return t('trainGame.status.celebrating');
    if (selectedPieceId) return t('trainGame.placePiece');
    if (validPathResult?.valid) return t('trainGame.pathComplete');
    if (placedCount > 0) return t('trainGame.status.rotateHint');
    return t('trainGame.selectPiece');
  }, [phase, selectedPieceId, validPathResult, placedCount, t]);

  // --- RENDER ---

  if (phase === 'idle') {
    return (
      <div className={styles.page}>
        <div className={styles.canvasWrapper}>
          <TrackScene
            grid={[]}
            cols={4}
            rows={3}
            phase="idle"
            skin={skin}
            selectedPieceId={null}
            validPathResult={null}
            stationA={null}
            stationB={null}
            onCellClick={() => {}}
            onTrainArrived={() => {}}
          />
        </div>

        <div className={styles.overlay}>
          <LocaleSwitcher />
          <div className={styles.spacer} />
          <div className={styles.startScreen}>
            <h1 className={styles.startTitle}>{t('trainGame.title')}</h1>
            <p className={styles.startDesc}>{t('trainGame.status.idle')}</p>

            <div className={styles.skinSection}>
              <span className={styles.skinLabel}>Theme</span>
              <div className={styles.skinOptions}>
                {SKIN_OPTIONS.map((s) => (
                  <button
                    key={s.key}
                    className={`${styles.skinOption} ${skin === s.key ? styles.skinOptionActive : ''}`}
                    onClick={() => handleSkinChange(s.key)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {maxLevel > 1 && (
              <p className={styles.levelBadge}>
                {t('trainGame.maxLevel')}: {maxLevel} | {t('trainGame.record')}: {highScore}
              </p>
            )}
            <button className={styles.btnStart} onClick={handleStart}>
              {t('trainGame.start')}
            </button>
          </div>
          <div className={styles.spacer} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* 3D Canvas — background layer */}
      <div className={styles.canvasWrapper}>
        <TrackScene
          grid={grid}
          cols={cols}
          rows={rows}
          phase={phase}
          skin={skin}
          selectedPieceId={selectedPieceId}
          validPathResult={validPathResult}
          stationA={stationA}
          stationB={stationB}
          onCellClick={handleCellClick}
          onTrainArrived={handleTrainArrived}
        />
      </div>

      {/* HTML overlay */}
      <div className={styles.overlay}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>{t('trainGame.title')}</h1>
            <span className={styles.levelBadge}>{t('trainGame.level', { level })}</span>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span>{t('trainGame.score')}</span>
              <span className={styles.statValue}>{score}</span>
            </div>
            <div className={styles.stat}>
              <span>{t('trainGame.record')}</span>
              <span className={styles.statValue}>{highScore}</span>
            </div>
          </div>
          <LocaleSwitcher />
        </div>

        {/* Status */}
        <div className={styles.statusBar}>{statusMessage}</div>

        <div className={styles.spacer} />

        {/* Pool */}
        {phase === 'building' && (
          <div className={styles.poolSection}>
            <div className={styles.poolLabel}>{t('trainGame.pieces')}</div>
            <div className={styles.pool}>
              {pool.map((piece) => {
                let cls = styles.poolPiece;
                if (piece.used) cls += ` ${styles.poolPieceUsed}`;
                if (selectedPieceId === piece.id) cls += ` ${styles.poolPieceSelected}`;

                return (
                  <button
                    key={piece.id}
                    className={cls}
                    onClick={() => handlePoolClick(piece.id)}
                    aria-label={t(`trainGame.pool.${piece.pieceType}`)}
                    disabled={piece.used}
                  >
                    <span className={styles.poolPieceEmoji}>
                      {piece.pieceType === 'straight' ? '━' : '╮'}
                    </span>
                    <span className={styles.poolPieceLabel}>
                      {t(`trainGame.pool.${piece.pieceType}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className={styles.actions}>
          {phase === 'building' && (
            <>
              <button
                className={`${styles.btnGo} ${validPathResult?.valid ? styles.btnGoReady : ''}`}
                disabled={!validPathResult?.valid}
                onClick={handleGo}
              >
                {t('trainGame.go')}
              </button>
              <button className={styles.btnSecondary} onClick={handleResetLevel}>
                {t('trainGame.resetLevel')}
              </button>
            </>
          )}
          <button
            className={styles.btnSecondary}
            onClick={() => {
              setPhase('idle');
              setShowConfetti(false);
            }}
          >
            {t('trainGame.backToMenu')}
          </button>
        </div>
      </div>

      {/* Confetti */}
      {showConfetti && (
        <div className={styles.confetti}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className={styles.confettiPiece}
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random() * 1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Celebration overlay */}
      {phase === 'celebrating' && (
        <div className={styles.celebration}>
          <div className={styles.celebrationCard}>
            <div className={styles.celebEmoji}>🚂</div>
            <h2 className={styles.celebTitle}>
              {t('trainGame.levelComplete', { level })}
            </h2>
            <p className={styles.celebScore}>
              {t('trainGame.celebrate')} +{levelScore} {t('trainGame.score').toLowerCase()}
            </p>
            <button className={styles.celebBtn} onClick={handleNextLevel}>
              {t('trainGame.nextLevel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
