'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { useI18n } from '../../lib/i18n/I18nProvider';
import styles from './memoryCards.module.css';

const HIGH_SCORE_KEY = 'memoryCardsHighScoreV1';
const BASE_SCORE = 100;
const MOVE_PENALTY = 5;
const MIN_SCORE = 10;
const FLIP_BACK_DELAY = 1000;
const MATCH_FEEDBACK_DELAY = 600;

const ALL_EMOJIS = [
  '\uD83D\uDC31', '\uD83D\uDC36', '\uD83E\uDD8A', '\uD83D\uDC38', '\uD83C\uDF3B',
  '\uD83C\uDF08', '\uD83C\uDF4E', '\uD83D\uDE80', '\u2B50', '\uD83C\uDFB5',
];

const DIFFICULTIES = {
  easy: { pairs: 3, cols: 3, rows: 2 },
  medium: { pairs: 6, cols: 4, rows: 3 },
  hard: { pairs: 10, cols: 5, rows: 4 },
};

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildCards(pairCount) {
  const emojis = shuffle(ALL_EMOJIS).slice(0, pairCount);
  const cards = [];
  emojis.forEach((emoji, index) => {
    cards.push({ id: `${index}-a`, emoji, matched: false });
    cards.push({ id: `${index}-b`, emoji, matched: false });
  });
  return shuffle(cards);
}

function calculateScore(moves) {
  return Math.max(MIN_SCORE, BASE_SCORE - moves * MOVE_PENALTY);
}

export default function MemoryCardsGame() {
  const { t } = useI18n();
  const [difficulty, setDifficulty] = useState('easy');
  const [phase, setPhase] = useState('idle');
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [moves, setMoves] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [status, setStatus] = useState('');
  const [matchFeedback, setMatchFeedback] = useState(false);
  const [checking, setChecking] = useState(false);

  const totalPairs = DIFFICULTIES[difficulty].pairs;
  const score = calculateScore(moves);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(HIGH_SCORE_KEY) || 0);
    if (Number.isFinite(stored) && stored > 0) {
      setHighScore(stored);
    }
  }, []);

  useEffect(() => {
    if (phase === 'idle') {
      setStatus(t('memoryCardsGame.lead'));
    }
  }, [phase, t]);

  const startGame = useCallback(() => {
    const config = DIFFICULTIES[difficulty];
    const freshCards = buildCards(config.pairs);
    setCards(freshCards);
    setFlipped([]);
    setMoves(0);
    setPairsFound(0);
    setMatchFeedback(false);
    setChecking(false);
    setPhase('playing');
    setStatus(t('memoryCardsGame.lead'));
  }, [difficulty, t]);

  const handleWin = useCallback(
    (finalMoves) => {
      const finalScore = calculateScore(finalMoves);
      setPhase('won');
      setStatus(t('memoryCardsGame.youWin'));
      if (finalScore > highScore) {
        setHighScore(finalScore);
        window.localStorage.setItem(HIGH_SCORE_KEY, String(finalScore));
      }
    },
    [highScore, t]
  );

  const handleCardClick = useCallback(
    (cardId) => {
      if (phase !== 'playing' || checking) return;

      const card = cards.find((c) => c.id === cardId);
      if (!card || card.matched) return;
      if (flipped.includes(cardId)) return;
      if (flipped.length >= 2) return;

      const nextFlipped = [...flipped, cardId];
      setFlipped(nextFlipped);

      if (nextFlipped.length === 2) {
        const nextMoves = moves + 1;
        setMoves(nextMoves);
        setChecking(true);

        const [firstId, secondId] = nextFlipped;
        const first = cards.find((c) => c.id === firstId);
        const second = cards.find((c) => c.id === secondId);

        if (first.emoji === second.emoji) {
          setMatchFeedback(true);
          setStatus(t('memoryCardsGame.matched'));

          window.setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, matched: true }
                  : c
              )
            );
            const nextPairs = pairsFound + 1;
            setPairsFound(nextPairs);
            setFlipped([]);
            setMatchFeedback(false);
            setChecking(false);

            if (nextPairs >= totalPairs) {
              handleWin(nextMoves);
            } else {
              setStatus(
                t('memoryCardsGame.pairsFound', {
                  found: nextPairs,
                  total: totalPairs,
                })
              );
            }
          }, MATCH_FEEDBACK_DELAY);
        } else {
          setStatus(t('memoryCardsGame.noMatch'));

          window.setTimeout(() => {
            setFlipped([]);
            setChecking(false);
            setStatus(
              t('memoryCardsGame.pairsFound', {
                found: pairsFound,
                total: totalPairs,
              })
            );
          }, FLIP_BACK_DELAY);
        }
      }
    },
    [phase, checking, cards, flipped, moves, pairsFound, totalPairs, handleWin, t]
  );

  const resetToMenu = () => {
    setPhase('idle');
    setCards([]);
    setFlipped([]);
    setMoves(0);
    setPairsFound(0);
    setMatchFeedback(false);
    setChecking(false);
    setStatus(t('memoryCardsGame.lead'));
  };

  const gridStyle = useMemo(() => {
    const config = DIFFICULTIES[difficulty];
    return {
      '--grid-cols': config.cols,
      '--grid-rows': config.rows,
    };
  }, [difficulty]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.head}>
          <div>
            <h1>{t('memoryCardsGame.title')}</h1>
            <p className={styles.lead}>{t('memoryCardsGame.lead')}</p>
          </div>
          <LocaleSwitcher />
        </div>

        {phase === 'idle' && (
          <section className={styles.menu}>
            <p className={styles.menuLabel}>
              {t('memoryCardsGame.difficulty.easy').split('(')[0].trim()}
            </p>
            <div className={styles.difficultyRow}>
              {Object.keys(DIFFICULTIES).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.difficultyBtn} ${difficulty === key ? styles.difficultyActive : ''}`}
                  onClick={() => setDifficulty(key)}
                >
                  {t(`memoryCardsGame.difficulty.${key}`)}
                </button>
              ))}
            </div>
            <button type="button" className={styles.startBtn} onClick={startGame}>
              {t('memoryCardsGame.startButton')}
            </button>
          </section>
        )}

        {(phase === 'playing' || phase === 'won') && (
          <>
            <div className={styles.stats}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>{t('memoryCardsGame.moves')}</span>
                <strong>{moves}</strong>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>{t('memoryCardsGame.pairs')}</span>
                <strong>
                  {pairsFound}/{totalPairs}
                </strong>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>{t('memoryCardsGame.score')}</span>
                <strong>{score}</strong>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>{t('memoryCardsGame.highScore')}</span>
                <strong>{highScore}</strong>
              </div>
            </div>

            <p className={styles.status} aria-live="polite">
              {matchFeedback ? t('memoryCardsGame.matched') : status}
            </p>

            <div className={styles.grid} style={gridStyle}>
              {cards.map((card) => {
                const isFlipped = flipped.includes(card.id) || card.matched;
                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`${styles.memoryCard} ${isFlipped ? styles.flipped : ''} ${card.matched ? styles.matched : ''} ${matchFeedback && flipped.includes(card.id) ? styles.matchPulse : ''}`}
                    onClick={() => handleCardClick(card.id)}
                    disabled={card.matched || checking || phase === 'won'}
                    aria-label={
                      isFlipped
                        ? card.emoji
                        : `${t('memoryCardsGame.title')} - ?`
                    }
                  >
                    <span className={styles.cardInner}>
                      <span className={styles.cardFront}>{card.emoji}</span>
                      <span className={styles.cardBack}>?</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {phase === 'won' && (
              <div className={styles.winOverlay}>
                <div className={styles.winCard}>
                  <p className={styles.winTitle}>{t('memoryCardsGame.youWin')}</p>
                  <p className={styles.winText}>
                    {t('memoryCardsGame.winText', { moves })}
                  </p>
                  <p className={styles.winScore}>
                    {t('memoryCardsGame.score')}: {calculateScore(moves)}
                  </p>
                  <div className={styles.winActions}>
                    <button type="button" className={styles.startBtn} onClick={startGame}>
                      {t('memoryCardsGame.playAgain')}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={resetToMenu}
                    >
                      {t('memoryCardsGame.backToMenu')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {phase === 'playing' && (
              <div className={styles.controls}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={resetToMenu}
                >
                  {t('memoryCardsGame.backToMenu')}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
