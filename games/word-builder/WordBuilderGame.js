'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { useI18n } from '../../lib/i18n/I18nProvider';
import styles from './wordBuilder.module.css';
import { getDisplayWord, getLetters, wordLists } from './words';

const HIGH_SCORE_KEY = 'wordBuilderHighScoreV1';
const WORDS_PER_ROUND = 8;
const MAX_HINTS = 3;
const POINTS_CORRECT = 10;
const POINTS_NO_HINTS = 5;
const POINTS_FAST = 3;
const FAST_THRESHOLD_MS = 12000;
const FEEDBACK_MS = 900;

const TILE_COLORS = [
  '#ff6b6b',
  '#ffd93d',
  '#6bcbef',
  '#9cf196',
  '#ff99c8',
  '#b09fff',
  '#ffb889',
  '#7dd3c0',
  '#f0a0d0',
  '#a0d0f0',
];

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickWords(locale, difficulty) {
  const list = wordLists[locale]?.[difficulty] || wordLists.en[difficulty] || [];
  const shuffled = shuffleArray(list);
  return shuffled.slice(0, WORDS_PER_ROUND);
}

function buildScrambledTiles(entry, locale) {
  const letters = getLetters(entry, locale);
  const tiles = letters.map((letter, idx) => ({
    id: `${letter}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
    letter,
    originalIndex: idx,
    color: TILE_COLORS[idx % TILE_COLORS.length],
  }));
  return shuffleArray(tiles);
}

export default function WordBuilderGame() {
  const { locale, t } = useI18n();

  /* --- game state --- */
  const [difficulty, setDifficulty] = useState('easy');
  const [phase, setPhase] = useState('idle'); // idle | playing | complete
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [words, setWords] = useState([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [hintsUsedThisWord, setHintsUsedThisWord] = useState(0);
  const [status, setStatus] = useState('');
  const [feedback, setFeedback] = useState('idle'); // idle | correct | wrong
  const [wordStartTime, setWordStartTime] = useState(0);

  /* --- tile state --- */
  const [scrambledTiles, setScrambledTiles] = useState([]);
  const [slots, setSlots] = useState([]); // array of (tile | null), length = word length
  const [hintedIndices, setHintedIndices] = useState(new Set()); // slot indices locked by hint

  const currentEntry = words[wordIndex] || null;
  const displayWord = currentEntry ? getDisplayWord(currentEntry, locale) : '';
  const progressPercent = words.length
    ? Math.round((wordIndex / words.length) * 100)
    : 0;

  /* --- load high score on mount --- */
  useEffect(() => {
    const stored = Number(window.localStorage.getItem(HIGH_SCORE_KEY) || 0);
    if (Number.isFinite(stored) && stored > 0) {
      setHighScore(stored);
    }
  }, []);

  /* --- initial status text --- */
  useEffect(() => {
    if (phase === 'idle') {
      setStatus(t('wordBuilderGame.tapToPlace'));
    }
  }, [phase, t]);

  /* --- setup a new word --- */
  const setupWord = useCallback(
    (entry) => {
      const letters = getLetters(entry, locale);
      setScrambledTiles(buildScrambledTiles(entry, locale));
      setSlots(new Array(letters.length).fill(null));
      setHintedIndices(new Set());
      setHintsUsedThisWord(0);
      setFeedback('idle');
      setWordStartTime(Date.now());
      setStatus(t('wordBuilderGame.tapToPlace'));
    },
    [locale, t]
  );

  /* --- start game --- */
  const startGame = () => {
    const picked = pickWords(locale, difficulty);
    setWords(picked);
    setWordIndex(0);
    setScore(0);
    setHintsLeft(MAX_HINTS);
    setPhase('playing');
    if (picked.length > 0) {
      setupWord(picked[0]);
    }
  };

  /* --- tap a scrambled tile to place it in next empty slot --- */
  const placeTile = useCallback(
    (tileId) => {
      if (phase !== 'playing' || feedback !== 'idle') return;

      setSlots((prevSlots) => {
        const emptyIdx = prevSlots.findIndex(
          (s, i) => s === null && !hintedIndices.has(i)
        );
        // If no non-hinted slot is empty, try any empty slot
        const targetIdx =
          emptyIdx !== -1 ? emptyIdx : prevSlots.findIndex((s) => s === null);
        if (targetIdx === -1) return prevSlots;

        const tile = scrambledTiles.find((t) => t.id === tileId);
        if (!tile) return prevSlots;

        const next = [...prevSlots];
        next[targetIdx] = tile;
        return next;
      });
    },
    [phase, feedback, scrambledTiles, hintedIndices]
  );

  /* --- tap a placed tile to remove it --- */
  const removeTile = useCallback(
    (slotIdx) => {
      if (phase !== 'playing' || feedback !== 'idle') return;
      if (hintedIndices.has(slotIdx)) return; // cannot remove hinted letters

      setSlots((prevSlots) => {
        if (!prevSlots[slotIdx]) return prevSlots;
        const next = [...prevSlots];
        next[slotIdx] = null;
        return next;
      });
    },
    [phase, feedback, hintedIndices]
  );

  /* --- used tile IDs (for hiding from scrambled pool) --- */
  const usedTileIds = useMemo(() => {
    const ids = new Set();
    for (const s of slots) {
      if (s) ids.add(s.id);
    }
    return ids;
  }, [slots]);

  /* --- auto-check when all slots filled --- */
  useEffect(() => {
    if (phase !== 'playing' || feedback !== 'idle') return;
    if (slots.length === 0) return;
    if (slots.some((s) => s === null)) return;

    const built = slots.map((s) => s.letter).join('');
    if (built === displayWord) {
      // Correct!
      setFeedback('correct');
      const elapsed = Date.now() - wordStartTime;
      let points = POINTS_CORRECT;
      if (hintsUsedThisWord === 0) points += POINTS_NO_HINTS;
      if (elapsed < FAST_THRESHOLD_MS) points += POINTS_FAST;

      const nextScore = score + points;
      setScore(nextScore);
      setStatus(t('wordBuilderGame.correct'));

      if (nextScore > highScore) {
        setHighScore(nextScore);
        window.localStorage.setItem(HIGH_SCORE_KEY, String(nextScore));
      }

      setTimeout(() => {
        const nextIdx = wordIndex + 1;
        if (nextIdx >= words.length) {
          setPhase('complete');
          setStatus(t('wordBuilderGame.complete'));
        } else {
          setWordIndex(nextIdx);
          setupWord(words[nextIdx]);
        }
      }, FEEDBACK_MS);
    } else {
      // Wrong
      setFeedback('wrong');
      setStatus(t('wordBuilderGame.tryAgain'));

      setTimeout(() => {
        setFeedback('idle');
        setStatus(t('wordBuilderGame.tapToPlace'));
      }, FEEDBACK_MS);
    }
  }, [
    slots,
    displayWord,
    phase,
    feedback,
    wordStartTime,
    hintsUsedThisWord,
    score,
    highScore,
    wordIndex,
    words,
    setupWord,
    t,
  ]);

  /* --- hint: reveal one correct letter --- */
  const useHint = () => {
    if (hintsLeft <= 0 || phase !== 'playing' || feedback !== 'idle') return;

    const letters = getLetters(currentEntry, locale);

    // Find a slot that is not yet correctly filled and not already hinted
    let targetIdx = -1;
    for (let i = 0; i < letters.length; i += 1) {
      if (!hintedIndices.has(i) && (!slots[i] || slots[i].letter !== letters[i])) {
        targetIdx = i;
        break;
      }
    }

    if (targetIdx === -1) return;

    // If a wrong tile is in this slot, remove it first
    const correctLetter = letters[targetIdx];

    // Find a tile with the correct letter from the scrambled pool or from another slot
    let sourceTile = scrambledTiles.find(
      (t) => t.letter === correctLetter && !usedTileIds.has(t.id)
    );

    setSlots((prevSlots) => {
      const next = [...prevSlots];

      // If this slot has a wrong tile, free it
      if (next[targetIdx] && next[targetIdx].letter !== correctLetter) {
        next[targetIdx] = null;
      }

      if (!sourceTile) {
        // Try to find the tile from another filled slot that has the wrong position
        for (let i = 0; i < next.length; i += 1) {
          if (
            i !== targetIdx &&
            next[i] &&
            next[i].letter === correctLetter &&
            !hintedIndices.has(i)
          ) {
            sourceTile = next[i];
            next[i] = null;
            break;
          }
        }
      }

      if (sourceTile) {
        next[targetIdx] = sourceTile;
      }

      return next;
    });

    setHintedIndices((prev) => new Set([...prev, targetIdx]));
    setHintsLeft((prev) => prev - 1);
    setHintsUsedThisWord((prev) => prev + 1);
  };

  /* --- reset to menu --- */
  const resetToMenu = () => {
    setPhase('idle');
    setWords([]);
    setWordIndex(0);
    setScore(0);
    setHintsLeft(MAX_HINTS);
    setScrambledTiles([]);
    setSlots([]);
    setHintedIndices(new Set());
    setFeedback('idle');
  };

  const showMenu = phase === 'idle';
  const showGame = phase === 'playing';
  const showComplete = phase === 'complete';

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.head}>
          <h1>{t('wordBuilderGame.title')}</h1>
          <LocaleSwitcher />
        </div>
        <p className={styles.lead}>{t('wordBuilderGame.lead')}</p>

        <div className={styles.stats}>
          <p>
            {t('wordBuilderGame.score')}: <strong>{score}</strong>
          </p>
          <p>
            {t('wordBuilderGame.highScore')}: <strong>{highScore}</strong>
          </p>
          {showGame && (
            <>
              <p>
                {t('wordBuilderGame.wordsLeft', {
                  current: wordIndex + 1,
                  total: words.length,
                })}
              </p>
              <p>{t('wordBuilderGame.hintsLeft', { count: hintsLeft })}</p>
            </>
          )}
        </div>

        <div className={styles.progress} role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>

        <p className={styles.status} aria-live="polite">
          {status}
        </p>

        {/* --- Difficulty menu --- */}
        {showMenu && (
          <section className={styles.menu}>
            <h2>{t('wordBuilderGame.title')}</h2>
            <p>{t('wordBuilderGame.lead')}</p>
            <div className={styles.difficultyRow}>
              {['easy', 'medium', 'hard'].map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.difficultyBtn} ${difficulty === key ? styles.difficultyActive : ''}`}
                  onClick={() => setDifficulty(key)}
                >
                  {t(`wordBuilderGame.difficulty.${key}`)}
                </button>
              ))}
            </div>
            <button type="button" className={styles.startBtn} onClick={startGame}>
              {t('wordBuilderGame.startButton')}
            </button>
          </section>
        )}

        {/* --- Active game --- */}
        {showGame && currentEntry && (
          <section
            className={`${styles.gameArea} ${feedback === 'correct' ? styles.feedbackCorrect : ''}`}
          >
            {/* Emoji hint */}
            <p className={styles.emojiHint} aria-label="hint">
              {currentEntry.emoji}
            </p>

            {/* Slots */}
            <div className={`${styles.slotsRow} ${feedback === 'wrong' ? styles.slotsShake : ''}`} aria-label={t('wordBuilderGame.tapToRemove')}>
              {slots.map((slot, idx) => {
                const isHinted = hintedIndices.has(idx);
                const isFilled = slot !== null;
                let cls = styles.slot;
                if (isHinted) cls += ` ${styles.slotHinted}`;
                else if (isFilled) cls += ` ${styles.slotFilled}`;

                return (
                  <button
                    key={idx}
                    type="button"
                    className={cls}
                    onClick={() => removeTile(idx)}
                    disabled={!isFilled || isHinted || feedback !== 'idle'}
                    aria-label={
                      isFilled
                        ? `${t('wordBuilderGame.tapToRemove')}: ${slot.letter}`
                        : `Slot ${idx + 1}`
                    }
                  >
                    {slot ? slot.letter : ''}
                  </button>
                );
              })}
            </div>

            {/* Scrambled tiles */}
            <div className={styles.tilesRow} aria-label={t('wordBuilderGame.tapToPlace')}>
              {scrambledTiles.map((tile) => {
                const used = usedTileIds.has(tile.id);
                return (
                  <button
                    key={tile.id}
                    type="button"
                    className={`${styles.tile} ${used ? styles.tileUsed : ''}`}
                    style={{ background: tile.color }}
                    onClick={() => placeTile(tile.id)}
                    disabled={used || feedback !== 'idle'}
                    aria-label={tile.letter}
                    aria-hidden={used}
                  >
                    {tile.letter}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.hintBtn}
                onClick={useHint}
                disabled={hintsLeft <= 0 || feedback !== 'idle'}
              >
                {t('wordBuilderGame.hint')} ({hintsLeft})
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={resetToMenu}>
                {t('wordBuilderGame.backToMenu')}
              </button>
            </div>
          </section>
        )}

        {/* --- Completion screen --- */}
        {showComplete && (
          <section className={styles.completeScreen} style={{ position: 'relative' }}>
            <div className={`${styles.spark} ${styles.spark1}`} />
            <div className={`${styles.spark} ${styles.spark2}`} />
            <div className={`${styles.spark} ${styles.spark3}`} />
            <div className={`${styles.spark} ${styles.spark4}`} />
            <h2>{t('wordBuilderGame.complete')}</h2>
            <p>
              {t('wordBuilderGame.score')}: <strong>{score}</strong>
            </p>
            <div className={styles.summaryActions}>
              <button type="button" className={styles.startBtn} onClick={startGame}>
                {t('wordBuilderGame.playAgain')}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={resetToMenu}>
                {t('wordBuilderGame.backToMenu')}
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
