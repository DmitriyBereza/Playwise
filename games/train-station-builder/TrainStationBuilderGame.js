'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useI18n } from '../../lib/i18n/I18nProvider';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { generateLevel, validateStation } from './gridLogic';
import { PIECE_DEFS, SKINS, getSeatCount, canPlacePiece, isFinalPiece } from './pieces';
import styles from './trainStationBuilder.module.css';

// Dynamic import — Three.js needs window/document
const StationScene = dynamic(() => import('./scene/StationScene'), { ssr: false });

const HIGH_SCORE_KEY = 'trainStationBuilderHighScoreV1';
const MAX_LEVEL_KEY = 'trainStationBuilderMaxLevelV1';
const SKIN_KEY = 'trainStationBuilderSkinV1';

const CONFETTI_COLORS = ['#D94040', '#FFD93D', '#4AAF5A', '#5BC0EB', '#FF8FAB', '#A78BFA'];

export default function TrainStationBuilderGame() {
  const { t } = useI18n();

  // Game state
  const [phase, setPhase] = useState('idle'); // idle | building | arriving | celebrating
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState([]);
  const [pool, setPool] = useState([]);
  const [cols, setCols] = useState(5);
  const [rows, setRows] = useState(3);
  const [seatTarget, setSeatTarget] = useState(4);
  const [passengerCount, setPassengerCount] = useState(4);
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [maxLevel, setMaxLevel] = useState(1);
  const [levelScore, setLevelScore] = useState(0);
  const [skin, setSkin] = useState('default');
  const [boardAnim, setBoardAnim] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [hintMessage, setHintMessage] = useState(null);
  const [trainArrived, setTrainArrived] = useState(false);
  const [passengersSeated, setPassengersSeated] = useState(false);

  const lastTapRef = useRef({ id: null, time: 0 });
  const hintTimerRef = useRef(null);
  const arrivalTimerRef = useRef(null);

  // Load persisted data
  useEffect(() => {
    try {
      const hs = window.localStorage.getItem(HIGH_SCORE_KEY);
      if (hs) setHighScore(parseInt(hs, 10) || 0);
      const ml = window.localStorage.getItem(MAX_LEVEL_KEY);
      if (ml) setMaxLevel(parseInt(ml, 10) || 1);
      const sk = window.localStorage.getItem(SKIN_KEY);
      if (sk && SKINS[sk]) setSkin(sk);
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

  // Show hint toast
  const showHint = useCallback((msg) => {
    setHintMessage(msg);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHintMessage(null), 2500);
  }, []);

  // Start a level
  const startLevel = useCallback((lvl) => {
    const data = generateLevel(lvl);
    setGrid(data.grid);
    setPool(data.pool);
    setCols(data.cols);
    setRows(data.rows);
    setSeatTarget(data.seatTarget);
    setPassengerCount(data.passengerCount);
    setSelectedPieceId(null);
    setValidationResult(null);
    setTrainArrived(false);
    setPassengersSeated(false);
    setPhase('building');
    setBoardAnim('fadeIn');
  }, []);

  // Handle start button
  const handleStart = useCallback(() => {
    setScore(0);
    setLevel(1);
    startLevel(1);
  }, [startLevel]);

  // Revalidate station whenever grid changes
  const revalidate = useCallback((g) => {
    const result = validateStation(g, rows, cols, seatTarget);
    setValidationResult(result);

    // Auto-trigger arrival when station is complete
    if (result.isComplete) {
      startArrivalSequence(result);
    }
  }, [rows, cols, seatTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  // Arrival sequence
  const startArrivalSequence = useCallback((result) => {
    setPhase('arriving');
    setSelectedPieceId(null);

    // Passengers walk to seats after short delay
    arrivalTimerRef.current = setTimeout(() => {
      setPassengersSeated(true);
    }, 800);

    // Train arrives
    const trainDelay = 800 + passengerCount * 100 + 500;
    setTimeout(() => {
      setTrainArrived(true);
    }, trainDelay);

    // Celebrate
    const celebDelay = trainDelay + 2800;
    setTimeout(() => {
      const unusedPieces = pool.filter((p) => !p.used).length;
      const ls = 10 + unusedPieces * 3 + level * 5;
      setLevelScore(ls);
      const newTotal = score + ls;
      setScore(newTotal);
      persistStats(newTotal, level);
      setShowConfetti(true);
      setPhase('celebrating');
    }, celebDelay);
  }, [passengerCount, pool, level, score, persistStats]);

  // Select a piece from pool
  const handlePoolClick = useCallback((pieceId) => {
    if (phase !== 'building') return;
    const piece = pool.find((p) => p.id === pieceId);
    if (!piece || piece.used) return;
    setSelectedPieceId((prev) => (prev === pieceId ? null : pieceId));
  }, [phase, pool]);

  // Place or remove a piece on the grid
  const handleCellClick = useCallback((r, c) => {
    if (phase !== 'building') return;
    const cell = grid[r][c];

    // Can't interact with blocked or decoration cells
    if (cell.type === 'blocked' || cell.type === 'decoration') return;

    // If cell has a placed piece, handle removal (double-tap)
    if (cell.piece) {
      const now = Date.now();
      const cellKey = `${r},${c}`;

      if (lastTapRef.current.id === cellKey && now - lastTapRef.current.time < 400) {
        // Double-tap — remove piece
        const newGrid = grid.map((row) => row.map((cl) => ({ ...cl })));
        const removedPiece = newGrid[r][c].piece;
        newGrid[r][c].piece = null;
        setGrid(newGrid);
        // Return piece to pool
        setPool((prev) => {
          let found = false;
          return prev.map((p) => {
            if (!found && p.used && p.pieceType === removedPiece) {
              found = true;
              return { ...p, used: false };
            }
            return p;
          });
        });
        revalidate(newGrid);
        lastTapRef.current = { id: null, time: 0 };
        return;
      }

      // Single tap on placed piece — record for double-tap detection
      lastTapRef.current = { id: cellKey, time: now };
      return;
    }

    // If cell is open and a piece is selected, place it
    if (cell.type === 'open' && selectedPieceId) {
      const pieceIdx = pool.findIndex((p) => p.id === selectedPieceId);
      if (pieceIdx === -1 || pool[pieceIdx].used) return;

      const pieceType = pool[pieceIdx].pieceType;

      if (!canPlacePiece(pieceType, cell.type)) {
        showHint(t('stationGame.cantPlaceHere'));
        return;
      }

      // If placing the screen, check prerequisites
      if (isFinalPiece(pieceType)) {
        const currentResult = validateStation(grid, rows, cols, seatTarget);
        if (!currentResult.seatsReached) {
          showHint(t('stationGame.needMoreSeats', {
            current: currentResult.totalSeats,
            target: seatTarget,
          }));
          return;
        }
        if (!currentResult.hasElevator) {
          showHint(t('stationGame.needElevator'));
          return;
        }
      }

      const newGrid = grid.map((row) => row.map((cl) => ({ ...cl })));
      newGrid[r][c].piece = pieceType;
      setGrid(newGrid);

      setPool((prev) =>
        prev.map((p) => (p.id === selectedPieceId ? { ...p, used: true } : p))
      );
      setSelectedPieceId(null);
      revalidate(newGrid);
    }

    lastTapRef.current = { id: null, time: 0 };
  }, [phase, grid, selectedPieceId, pool, revalidate, rows, cols, seatTarget, showHint, t]);

  // Skin change
  const handleSkinChange = useCallback((skinKey) => {
    setSkin(skinKey);
    try {
      window.localStorage.setItem(SKIN_KEY, skinKey);
    } catch { /* ignore */ }
  }, []);

  // Next level
  const handleNextLevel = useCallback(() => {
    setShowConfetti(false);
    setTrainArrived(false);
    setPassengersSeated(false);
    const next = level + 1;
    setLevel(next);
    setBoardAnim('fadeOut');
    setTimeout(() => {
      startLevel(next);
    }, 400);
  }, [level, startLevel]);

  // Reset level
  const handleResetLevel = useCallback(() => {
    startLevel(level);
  }, [level, startLevel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
    };
  }, []);

  // Derived values
  const seatedCount = useMemo(() => {
    if (!validationResult) return 0;
    return Math.min(validationResult.totalSeats, passengerCount);
  }, [validationResult, passengerCount]);

  const statusMessage = useMemo(() => {
    if (phase === 'idle') return t('stationGame.status.idle');
    if (phase === 'arriving') return t('stationGame.status.arriving');
    if (phase === 'celebrating') return t('stationGame.status.celebrating');
    if (!validationResult) return t('stationGame.status.building');
    if (validationResult.readyForScreen) return t('stationGame.placeScreen');
    if (selectedPieceId) return t('stationGame.placePiece');
    if (!validationResult.seatsReached) {
      return t('stationGame.needMoreSeats', {
        current: validationResult.totalSeats,
        target: seatTarget,
      });
    }
    if (!validationResult.hasElevator) return t('stationGame.needElevator');
    return t('stationGame.selectPiece');
  }, [phase, validationResult, selectedPieceId, seatTarget, t]);

  const selectedPieceType = selectedPieceId
    ? pool.find((p) => p.id === selectedPieceId)?.pieceType
    : null;

  const screenBlocked = useMemo(() => {
    if (selectedPieceType !== 'screen') return false;
    if (!validationResult) return true;
    return !validationResult.seatsReached || !validationResult.hasElevator;
  }, [selectedPieceType, validationResult]);

  // --- RENDER ---

  if (phase === 'idle') {
    return (
      <div className={styles.page}>
        <LocaleSwitcher />
        <div className={styles.startScreen}>
          <h1 className={styles.startTitle}>{t('stationGame.title')}</h1>
          <p className={styles.startDesc}>{t('stationGame.status.idle')}</p>

          <div className={styles.skinSection}>
            <span className={styles.skinLabel}>{t('stationGame.skins.title')}</span>
            <div className={styles.skinOptions}>
              {Object.entries(SKINS).map(([key, skinDef]) => (
                <button
                  key={key}
                  className={`${styles.skinOption} ${skin === key ? styles.skinOptionActive : ''}`}
                  onClick={() => handleSkinChange(key)}
                >
                  {t(skinDef.nameKey)}
                </button>
              ))}
            </div>
          </div>

          {maxLevel > 1 && (
            <p className={styles.levelBadge}>
              {t('stationGame.maxLevel')}: {maxLevel} | {t('stationGame.record')}: {highScore}
            </p>
          )}
          <button className={styles.btnStart} onClick={handleStart}>
            {t('stationGame.start')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* 3D Canvas — background layer */}
      <div className={styles.canvasWrapper}>
        <StationScene
          grid={grid}
          cols={cols}
          rows={rows}
          selectedPieceId={selectedPieceId}
          selectedPieceType={selectedPieceType}
          screenBlocked={screenBlocked}
          phase={phase}
          skin={skin}
          onCellClick={handleCellClick}
          passengerCount={passengerCount}
          seatedCount={seatedCount}
          passengersSeated={passengersSeated}
          trainArrived={trainArrived}
        />
      </div>

      {/* HTML overlay */}
      <div className={styles.overlay}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>{t('stationGame.title')}</h1>
            <span className={styles.levelBadge}>{t('stationGame.level', { level })}</span>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span>{t('stationGame.score')}</span>
              <span className={styles.statValue}>{score}</span>
            </div>
            <div className={styles.stat}>
              <span>{t('stationGame.record')}</span>
              <span className={styles.statValue}>{highScore}</span>
            </div>
          </div>
          <LocaleSwitcher />
        </div>

        <div className={styles.statusBar} aria-live="polite">{statusMessage}</div>

        {phase === 'building' && validationResult && (
          <div className={styles.progressRow}>
            <div className={`${styles.progressItem} ${validationResult.seatsReached ? styles.progressItemDone : ''}`}>
              <span className={styles.progressIcon}>
                {validationResult.seatsReached ? '\u2705' : '\u{1FA91}'}
              </span>
              <span>{t('stationGame.seats', { current: validationResult.totalSeats, target: seatTarget })}</span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${Math.min(100, (validationResult.totalSeats / seatTarget) * 100)}%` }}
                />
              </div>
            </div>
            <div className={`${styles.progressItem} ${validationResult.hasElevator ? styles.progressItemDone : ''}`}>
              <span className={styles.progressIcon}>
                {validationResult.hasElevator ? '\u2705' : '\u{1F6D7}'}
              </span>
              <span>{t('stationGame.elevator')}</span>
            </div>
            <div className={`${styles.progressItem} ${validationResult.hasScreen ? styles.progressItemDone : ''}`}>
              <span className={styles.progressIcon}>
                {validationResult.hasScreen ? '\u2705' : '\u{1F4FA}'}
              </span>
              <span>{t('stationGame.screen')}</span>
            </div>
          </div>
        )}

        <div className={styles.spacer} />

        {phase === 'building' && (
          <div className={styles.poolSection}>
            <div className={styles.poolLabel}>{t('stationGame.pieces')}</div>
            <div className={styles.pool}>
              {pool.map((piece) => {
                const def = PIECE_DEFS[piece.pieceType];
                let cls = styles.poolPiece;
                if (piece.used) cls += ` ${styles.poolPieceUsed}`;
                if (selectedPieceId === piece.id) cls += ` ${styles.poolPieceSelected}`;

                return (
                  <button
                    key={piece.id}
                    className={cls}
                    onClick={() => handlePoolClick(piece.id)}
                    aria-label={t(def?.labelKey || 'stationGame.pool.bench')}
                    disabled={piece.used}
                  >
                    <span className={styles.poolPieceEmoji} aria-hidden="true">
                      {def?.emoji || '?'}
                    </span>
                    <span className={styles.poolPieceLabel}>
                      {t(def?.labelKey || 'stationGame.pool.bench')}
                    </span>
                    {def?.seats > 0 && (
                      <span className={styles.poolPieceSeats}>+{def.seats}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {phase === 'building' && (
            <button className={styles.btnSecondary} onClick={handleResetLevel}>
              {t('stationGame.resetLevel')}
            </button>
          )}
          <button
            className={styles.btnSecondary}
            onClick={() => {
              setPhase('idle');
              setTrainArrived(false);
              setPassengersSeated(false);
              setShowConfetti(false);
            }}
          >
            {t('stationGame.backToMenu')}
          </button>
        </div>
      </div>

      {/* Hint toast */}
      {hintMessage && (
        <div className={styles.hintToast} key={hintMessage}>
          {hintMessage}
        </div>
      )}

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
            <div className={styles.celebEmoji}>{'\u{1F689}'}</div>
            <h2 className={styles.celebTitle}>
              {t('stationGame.levelComplete', { level })}
            </h2>
            <p className={styles.celebScore}>
              {t('stationGame.celebrate')} +{levelScore} {t('stationGame.score').toLowerCase()}
            </p>
            <button className={styles.celebBtn} onClick={handleNextLevel}>
              {t('stationGame.nextLevel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
