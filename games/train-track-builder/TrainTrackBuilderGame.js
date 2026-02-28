'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n/I18nProvider';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { generateLevel, validatePath } from './gridLogic';
import { rotateClockwise, getConnections, OPPOSITE, DIR_DELTA } from './pieces';
import styles from './trainTrackBuilder.module.css';

const HIGH_SCORE_KEY = 'trainTrackBuilderHighScoreV1';
const MAX_LEVEL_KEY = 'trainTrackBuilderMaxLevelV1';

const CONFETTI_COLORS = ['#D94040', '#FFD93D', '#4AAF5A', '#5BC0EB', '#FF8FAB', '#A78BFA'];

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
  const [boardAnim, setBoardAnim] = useState('');

  // Train animation state
  const [trainPos, setTrainPos] = useState(null); // { x, y, angle }
  const [steamPuffs, setSteamPuffs] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const boardRef = useRef(null);
  const trainTimerRef = useRef(null);
  const lastTapRef = useRef({ id: null, time: 0 });

  // Load persisted data
  useEffect(() => {
    try {
      const hs = window.localStorage.getItem(HIGH_SCORE_KEY);
      if (hs) setHighScore(parseInt(hs, 10) || 0);
      const ml = window.localStorage.getItem(MAX_LEVEL_KEY);
      if (ml) setMaxLevel(parseInt(ml, 10) || 1);
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
    setTrainPos(null);
    setSteamPuffs([]);
    setPhase('building');
    setBoardAnim('fadeIn');
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

  // Place a piece on the grid
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
        // Find pool piece to un-use
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

  // "Go!" button — animate train
  const handleGo = useCallback(() => {
    if (!validPathResult?.valid || phase !== 'building') return;
    setPhase('running');
    setSelectedPieceId(null);

    const path = validPathResult.path;
    if (!boardRef.current || path.length < 2) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const cellWidth = boardRect.width / cols;
    const cellHeight = boardRect.height / rows;

    // Build animation waypoints
    const waypoints = path.map((cell, i) => {
      const x = cell.col * cellWidth + cellWidth / 2 - 20; // center train (40px wide)
      const y = cell.row * cellHeight + cellHeight / 2 - 15; // center train (30px tall)
      // Calculate angle based on direction to next cell
      let angle = 0;
      if (i < path.length - 1) {
        const next = path[i + 1];
        const dx = next.col - cell.col;
        const dy = next.row - cell.row;
        if (dx > 0) angle = 0;      // right
        else if (dx < 0) angle = 180; // left
        else if (dy > 0) angle = 90;  // down
        else angle = -90;             // up
      } else if (i > 0) {
        // Last cell: keep previous angle
        const prev = path[i - 1];
        const dx = cell.col - prev.col;
        const dy = cell.row - prev.row;
        if (dx > 0) angle = 0;
        else if (dx < 0) angle = 180;
        else if (dy > 0) angle = 90;
        else angle = -90;
      }
      return { x, y, angle };
    });

    // Animate step by step
    let step = 0;
    setTrainPos(waypoints[0]);

    const steamId = { current: 0 };

    const advance = () => {
      step++;
      if (step >= waypoints.length) {
        // Train arrived!
        clearInterval(trainTimerRef.current);
        trainTimerRef.current = null;

        // Calculate score
        const unusedPieces = pool.filter((p) => !p.used).length;
        const ls = 10 + unusedPieces * 2 + level * 5;
        setLevelScore(ls);
        const newTotal = score + ls;
        setScore(newTotal);
        persistStats(newTotal, level);

        // Celebrate
        setShowConfetti(true);
        setPhase('celebrating');
        return;
      }
      setTrainPos(waypoints[step]);

      // Spawn steam puff every other step
      if (step % 2 === 0) {
        const wp = waypoints[step];
        setSteamPuffs((prev) => [
          ...prev.slice(-6),
          { id: steamId.current++, x: wp.x + 5, y: wp.y - 10 },
        ]);
      }
    };

    trainTimerRef.current = setInterval(advance, 500);

    return () => {
      if (trainTimerRef.current) clearInterval(trainTimerRef.current);
    };
  }, [validPathResult, phase, cols, rows, pool, level, score, persistStats]);

  // Next level
  const handleNextLevel = useCallback(() => {
    setShowConfetti(false);
    setTrainPos(null);
    setSteamPuffs([]);
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
      if (trainTimerRef.current) clearInterval(trainTimerRef.current);
    };
  }, []);

  // Count placed pieces on the grid
  const placedCount = useMemo(() => {
    return grid.reduce((acc, row) => acc + row.filter((cell) => cell.piece).length, 0);
  }, [grid]);

  // Map of "row,col" → path index for staggered glow animation
  const pathIndexMap = useMemo(() => {
    if (!validPathResult?.valid || !validPathResult.path) return {};
    const map = {};
    validPathResult.path.forEach((cell, i) => {
      map[`${cell.row},${cell.col}`] = i;
    });
    return map;
  }, [validPathResult]);

  // Get status message
  const statusMessage = useMemo(() => {
    if (phase === 'idle') return t('trainGame.status.idle');
    if (phase === 'running') return t('trainGame.status.running');
    if (phase === 'celebrating') return t('trainGame.status.celebrating');
    // building phase
    if (selectedPieceId) return t('trainGame.placePiece');
    if (validPathResult?.valid) return t('trainGame.pathComplete');
    if (placedCount > 0) return t('trainGame.status.rotateHint');
    return t('trainGame.selectPiece');
  }, [phase, selectedPieceId, validPathResult, placedCount, t]);

  // Should highlight empty cells when piece selected
  const shouldHighlight = phase === 'building' && selectedPieceId;

  // --- RENDER ---

  if (phase === 'idle') {
    return (
      <div className={styles.page}>
        <img
          className={styles.backgroundHills}
          src="/games/train-track-builder/background-hills.svg"
          alt=""
          aria-hidden="true"
        />
        <LocaleSwitcher />
        <div className={styles.startScreen}>
          <h1 className={styles.startTitle}>{t('trainGame.title')}</h1>
          <p className={styles.startDesc}>{t('trainGame.status.idle')}</p>
          {maxLevel > 1 && (
            <p className={styles.levelBadge}>
              {t('trainGame.maxLevel')}: {maxLevel} | {t('trainGame.record')}: {highScore}
            </p>
          )}
          <button className={styles.btnStart} onClick={handleStart}>
            {t('trainGame.start')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <img
        className={styles.backgroundHills}
        src="/games/train-track-builder/background-hills.svg"
        alt=""
        aria-hidden="true"
      />

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

      {/* Board */}
      <div
        className={`${styles.boardWrapper} ${boardAnim === 'fadeOut' ? styles.boardFadeOut : ''} ${boardAnim === 'fadeIn' ? styles.boardFadeIn : ''}`}
        onAnimationEnd={() => setBoardAnim('')}
      >
        <div
          ref={boardRef}
          className={styles.board}
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${rows}, 1fr)`,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isStation = cell.type === 'stationA' || cell.type === 'stationB';
              const hasObstacle = !!cell.obstacle;
              const hasPiece = !!cell.piece;
              const canPlace = !isStation && !hasObstacle && !hasPiece && cell.type === 'empty';
              const highlight = shouldHighlight && canPlace;
              const pathIdx = pathIndexMap[`${r},${c}`];

              // Fork dots: show on placed pieces (building phase only)
              const connDots = [];
              if (hasPiece && phase === 'building') {
                const exitDirs = getConnections(cell.piece, cell.rotation);
                for (const dir of exitDirs) {
                  const { dr, dc } = DIR_DELTA[dir];
                  const nr2 = r + dr;
                  const nc2 = c + dc;
                  let connected = false;
                  if (nr2 >= 0 && nr2 < rows && nc2 >= 0 && nc2 < cols) {
                    const nb = grid[nr2][nc2];
                    const opp = OPPOSITE[dir];
                    if (nb.type === 'stationA') connected = opp === 'right';
                    else if (nb.type === 'stationB') connected = opp === 'left';
                    else if (nb.piece) connected = getConnections(nb.piece, nb.rotation).includes(opp);
                  }
                  connDots.push({ dir, connected });
                }
              }

              let cellClass = styles.cell;
              if (isStation) cellClass += ` ${styles.cellStation}`;
              else if (hasObstacle) cellClass += ` ${styles.cellGrass} ${styles.cellObstacle}`;
              else if (hasPiece) cellClass += ` ${styles.cellEmpty}`;
              else if (canPlace) cellClass += ` ${styles.cellEmpty}`;
              else cellClass += ` ${styles.cellGrass}`;

              if (highlight) cellClass += ` ${styles.cellHighlight}`;

              return (
                <div
                  key={`${r}-${c}`}
                  className={cellClass}
                  onClick={() => handleCellClick(r, c)}
                  role="button"
                  tabIndex={phase === 'building' ? 0 : -1}
                  aria-label={getCellLabel(cell, r, c, t)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCellClick(r, c);
                    }
                  }}
                >
                  {/* Station image */}
                  {cell.type === 'stationA' && (
                    <img
                      className={styles.stationImg}
                      src="/games/train-track-builder/station-a.svg"
                      alt="Station A"
                    />
                  )}
                  {cell.type === 'stationB' && (
                    <img
                      className={styles.stationImg}
                      src="/games/train-track-builder/station-b.svg"
                      alt="Station B"
                    />
                  )}

                  {/* Obstacle image */}
                  {hasObstacle && (
                    <img
                      className={styles.obstacleImg}
                      src={`/games/train-track-builder/obstacle-${cell.obstacle}.svg`}
                      alt={cell.obstacle}
                    />
                  )}

                  {/* Rail piece */}
                  {hasPiece && (
                    <img
                      className={`${styles.railPiece} ${styles.railPieceEnter}`}
                      src={`/games/train-track-builder/rail-${cell.piece}.svg`}
                      alt={cell.piece}
                      style={{ transform: `rotate(${cell.rotation}deg)` }}
                    />
                  )}

                  {/* Fork / connection dots at rail exit edges */}
                  {connDots.map(({ dir, connected }) => {
                    const capDir = dir[0].toUpperCase() + dir.slice(1);
                    return (
                      <div
                        key={`dot-${dir}`}
                        className={`${styles.connDot} ${styles[`connDot${capDir}`]} ${connected ? styles.connDotConnected : styles.connDotOpen}`}
                      />
                    );
                  })}

                  {/* Connected path glow overlay */}
                  {pathIdx !== undefined && (
                    <div
                      key={`glow-${validPathResult?.valid}`}
                      className={styles.trackGlow}
                      style={{ animationDelay: `${pathIdx * 80}ms` }}
                    />
                  )}
                </div>
              );
            })
          )}

          {/* Train overlay */}
          {trainPos && (
            <div className={styles.trainContainer}>
              <div
                className={styles.train}
                style={{
                  transform: `translate(${trainPos.x}px, ${trainPos.y}px) rotate(${trainPos.angle}deg)`,
                  transition: 'transform 0.45s ease-in-out',
                }}
              >
                <img
                  className={styles.trainImg}
                  src="/games/train-track-builder/train-locomotive.svg"
                  alt="Train"
                />
              </div>
              {/* Steam puffs */}
              {steamPuffs.map((puff) => (
                <img
                  key={puff.id}
                  className={styles.steamPuff}
                  src="/games/train-track-builder/steam-puff.svg"
                  alt=""
                  aria-hidden="true"
                  style={{ left: puff.x, top: puff.y }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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
                  <img
                    className={styles.poolPieceImg}
                    src={`/games/train-track-builder/rail-${piece.pieceType}.svg`}
                    alt=""
                    aria-hidden="true"
                  />
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
            setTrainPos(null);
            setSteamPuffs([]);
            setShowConfetti(false);
            if (trainTimerRef.current) {
              clearInterval(trainTimerRef.current);
              trainTimerRef.current = null;
            }
          }}
        >
          {t('trainGame.backToMenu')}
        </button>
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

function getCellLabel(cell, r, c, t) {
  if (cell.type === 'stationA') return 'Station A';
  if (cell.type === 'stationB') return 'Station B';
  if (cell.obstacle) return cell.obstacle;
  if (cell.piece) return `${t(`trainGame.pool.${cell.piece}`)} — ${t('trainGame.tapToRotate')}`;
  return `Row ${r + 1}, Column ${c + 1}`;
}
