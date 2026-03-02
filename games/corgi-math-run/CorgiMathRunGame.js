'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { useI18n } from '../../lib/i18n/I18nProvider';
import styles from './corgiMathRun.module.css';

const HIGH_SCORE_KEY = 'corgiMathRunHighScoreV1';
const MAX_WRONG_ATTEMPTS = 3;
const FEEDBACK_MS = 560;

/* --- Named constants (fix #7) --- */
const EQUATION_GENERATION_MAX_ATTEMPTS = 220;
const SUBTRACTION_PROBABILITY = 0.32;
const FALLBACK_EXTRA_RANGE = 2;
const FALLBACK_RETRIES = 3;
const HIGH_PROGRESS_THRESHOLD = 0.8;
const MID_PROGRESS_THRESHOLD = 0.45;
const OPTIONS_COUNT_HIGH = 5;
const OPTIONS_COUNT_MID = 4;
const OPTIONS_COUNT_LOW = 3;
const OPTION_SPREAD_MULTIPLIER = 1.8;
const MIN_OPTION_SPREAD = 2;
const HINTS_PER_QUESTION = 1;

const DIFFICULTIES = {
  easy: { count: 10, maxNumber: 6 },
  middle: { count: 15, maxNumber: 9 },
  complex: { count: 20, maxNumber: 12 },
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* --- Improved equation generation with graceful fallback (fix #8) --- */
function buildEquation(usedKeys, difficulty, progressRatio) {
  const { maxNumber } = DIFFICULTIES[difficulty];
  let candidate = null;

  for (let i = 0; i < EQUATION_GENERATION_MAX_ATTEMPTS; i += 1) {
    const operation = Math.random() > SUBTRACTION_PROBABILITY ? '+' : '-';
    let a = randomInt(1, maxNumber);
    let b = randomInt(0, maxNumber);

    if (operation === '-' && b > a) {
      [a, b] = [b, a];
    }

    const key = `${a}${operation}${b}`;
    if (!usedKeys.has(key)) {
      const answer = operation === '+' ? a + b : a - b;
      candidate = { key, text: `${a} ${operation} ${b}`, answer };
      break;
    }
  }

  /* Graceful fallback: widen the range incrementally before giving up */
  if (!candidate) {
    for (let extra = 1; extra <= FALLBACK_RETRIES; extra += 1) {
      const bump = FALLBACK_EXTRA_RANGE * extra;
      const operation = Math.random() > SUBTRACTION_PROBABILITY ? '+' : '-';
      let a = randomInt(1, maxNumber + bump);
      let b = randomInt(0, maxNumber + bump);

      if (operation === '-' && b > a) {
        [a, b] = [b, a];
      }

      const key = `${a}${operation}${b}`;
      if (!usedKeys.has(key)) {
        const answer = operation === '+' ? a + b : a - b;
        candidate = { key, text: `${a} ${operation} ${b}`, answer };
        break;
      }
    }
  }

  /* Last-resort: guaranteed unique addition */
  if (!candidate) {
    const a = randomInt(1, maxNumber + FALLBACK_EXTRA_RANGE * (FALLBACK_RETRIES + 1));
    const b = randomInt(0, maxNumber + FALLBACK_EXTRA_RANGE * (FALLBACK_RETRIES + 1));
    candidate = { key: `${a}+${b}`, text: `${a} + ${b}`, answer: a + b };
  }

  const optionCount =
    progressRatio >= HIGH_PROGRESS_THRESHOLD
      ? OPTIONS_COUNT_HIGH
      : progressRatio >= MID_PROGRESS_THRESHOLD
        ? OPTIONS_COUNT_MID
        : OPTIONS_COUNT_LOW;

  const optionsSet = new Set([candidate.answer]);
  const spread = Math.max(MIN_OPTION_SPREAD, Math.ceil(optionCount * OPTION_SPREAD_MULTIPLIER));

  while (optionsSet.size < optionCount) {
    const delta = randomInt(-spread, spread);
    if (delta === 0) {
      continue;
    }
    optionsSet.add(Math.max(0, candidate.answer + delta));
  }

  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
  return { ...candidate, options };
}

export default function CorgiMathRunGame() {
  const { t } = useI18n();
  const [difficulty, setDifficulty] = useState('easy');
  const [phase, setPhase] = useState('idle');
  const [score, setScore] = useState(0);
  const [targetCount, setTargetCount] = useState(DIFFICULTIES.easy.count);
  const [highScore, setHighScore] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [equation, setEquation] = useState(null);
  const [usedEquationKeys, setUsedEquationKeys] = useState(new Set());
  const [disabledOptions, setDisabledOptions] = useState([]);
  const [status, setStatus] = useState('');
  const [feedback, setFeedback] = useState('idle');

  /* --- New state: pause (fix #1) --- */
  const [paused, setPaused] = useState(false);

  /* --- New state: hint system (fix #3) --- */
  const [hintUsed, setHintUsed] = useState(false);

  /* --- New state: combo counter (fix #6) --- */
  const [combo, setCombo] = useState(0);

  const attemptsLeft = MAX_WRONG_ATTEMPTS - wrongAttempts;
  const progressPercent = targetCount ? Math.min(100, (score / targetCount) * 100) : 0;
  const finishX = 90;
  const baseCorgiX = Math.min(76, 8 + progressPercent * 0.68);
  const corgiX = phase === 'won' ? 84 : baseCorgiX;
  const nextTargetRatio = Math.min(1, (score + 1) / Math.max(1, targetCount));
  const obstacleX = phase === 'playing' ? Math.min(finishX - 9, 14 + nextTargetRatio * (finishX - 28)) : finishX - 8;
  const farShift = Math.round(progressPercent * 0.35);
  const midShift = Math.round(progressPercent * 0.65);
  const frontShift = Math.round(progressPercent * 0.95);
  const midDecorPositions = [0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120];
  const frontBushPositions = [2, 12, 22, 32, 42, 52, 62, 72, 82, 92, 102, 112];
  const flowerPositions = [6, 18, 30, 44, 58, 70, 84, 98, 114];

  useEffect(() => {
    setStatus(t('corgiMathGame.status.selectAndStart'));
  }, [t]);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(HIGH_SCORE_KEY) || 0);
    if (Number.isFinite(stored) && stored > 0) {
      setHighScore(stored);
    }
  }, []);

  const hearts = useMemo(
    () =>
      Array.from({ length: MAX_WRONG_ATTEMPTS }, (_, index) => (
        <span key={index} className={index < wrongAttempts ? styles.heartLost : styles.heart}>
          ❤
        </span>
      )),
    [wrongAttempts]
  );

  const startGame = () => {
    const target = DIFFICULTIES[difficulty].count;
    const freshUsed = new Set();
    const first = buildEquation(freshUsed, difficulty, 0);
    freshUsed.add(first.key);

    setTargetCount(target);
    setScore(0);
    setWrongAttempts(0);
    setDisabledOptions([]);
    setUsedEquationKeys(freshUsed);
    setEquation(first);
    setPhase('playing');
    setFeedback('idle');
    setPaused(false);
    setHintUsed(false);
    setCombo(0);
    setStatus(t('corgiMathGame.status.ready'));
  };

  /* --- Pause / resume toggle (fix #1) --- */
  const togglePause = () => {
    setPaused((prev) => !prev);
  };

  /* --- Hint handler (fix #3) --- */
  const handleHint = () => {
    if (hintUsed || !equation || paused) {
      return;
    }

    const wrongOptions = equation.options.filter(
      (opt) => opt !== equation.answer && !disabledOptions.includes(opt)
    );

    if (wrongOptions.length === 0) {
      return;
    }

    const toEliminate = wrongOptions[randomInt(0, wrongOptions.length - 1)];
    setDisabledOptions((prev) => [...prev, toEliminate]);
    setHintUsed(true);
  };

  const handleCorrect = (nextScore) => {
    if (nextScore > highScore) {
      setHighScore(nextScore);
      window.localStorage.setItem(HIGH_SCORE_KEY, String(nextScore));
    }

    if (nextScore >= targetCount) {
      setPhase('won');
      setStatus(t('corgiMathGame.status.won'));
      return;
    }

    const nextUsed = new Set(usedEquationKeys);
    const nextEquation = buildEquation(nextUsed, difficulty, nextScore / targetCount);
    nextUsed.add(nextEquation.key);

    setUsedEquationKeys(nextUsed);
    setEquation(nextEquation);
    setDisabledOptions([]);
    setHintUsed(false);
    setStatus(t('corgiMathGame.status.correct'));
  };

  const handleAnswer = (value) => {
    if (phase !== 'playing' || !equation || feedback === 'correct' || paused) {
      return;
    }

    if (value === equation.answer) {
      setFeedback('correct');
      const nextScore = score + 1;
      const nextCombo = combo + 1;
      setScore(nextScore);
      setCombo(nextCombo);
      window.setTimeout(() => {
        setFeedback('idle');
        handleCorrect(nextScore);
      }, FEEDBACK_MS);
      return;
    }

    if (disabledOptions.includes(value)) {
      return;
    }

    const nextWrong = wrongAttempts + 1;
    setWrongAttempts(nextWrong);
    setDisabledOptions((prev) => [...prev, value]);
    setFeedback('wrong');
    setCombo(0);
    setStatus(t('corgiMathGame.status.wrong'));

    window.setTimeout(() => {
      setFeedback('idle');
    }, FEEDBACK_MS);

    if (nextWrong >= MAX_WRONG_ATTEMPTS) {
      window.setTimeout(() => {
        setPhase('gameOver');
        setStatus(t('corgiMathGame.status.gameOver'));
      }, FEEDBACK_MS);
    }
  };

  const resetToMenu = () => {
    setPhase('idle');
    setEquation(null);
    setDisabledOptions([]);
    setWrongAttempts(0);
    setScore(0);
    setFeedback('idle');
    setPaused(false);
    setHintUsed(false);
    setCombo(0);
    setStatus(t('corgiMathGame.status.selectAndStart'));
  };

  const showQuiz = phase === 'playing' && Boolean(equation);
  const showSummary = phase === 'won' || phase === 'gameOver';

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.head}>
          <div>
            <h1>{t('corgiMathGame.title')}</h1>
            <p>{t('corgiMathGame.lead')}</p>
          </div>
          <LocaleSwitcher />
        </div>

        <div className={styles.stats}>
          <p>
            {t('corgiMathGame.score')}: <strong>{score}</strong>
          </p>
          <p>
            {t('corgiMathGame.highScore')}: <strong>{highScore}</strong>
          </p>
          <p>
            {t('corgiMathGame.attemptsLeft')}: <strong>{attemptsLeft}</strong>
          </p>
          {/* --- Combo counter (fix #6) --- */}
          {combo > 1 && (
            <p>
              <strong>{t('corgiMathGame.combo', { count: combo })}</strong>
            </p>
          )}
        </div>

        <div className={styles.hearts}>{hearts}</div>

        {/* --- aria-live region for status (fix #4) --- */}
        <p className={styles.status} aria-live="polite">
          {paused ? t('common.paused') : status}
        </p>

        <div className={`${styles.track} ${feedback === 'correct' ? styles.trackCorrect : ''} ${feedback === 'wrong' ? styles.trackWrong : ''}`}>
          <div className={`${styles.parallaxLayer} ${styles.farLayer}`} style={{ backgroundPositionX: `-${farShift}px` }} aria-hidden="true" />
          <div className={`${styles.parallaxLayer} ${styles.midLayer}`} style={{ transform: `translateX(-${midShift}px)` }} aria-hidden="true">
            {midDecorPositions.map((left, idx) => (
              <Image
                key={`mid-tree-${left}`}
                src={idx % 2 === 0 ? '/games/corgi-math-run/cartoon-tree.svg' : '/games/corgi-math-run/pine-tree.svg'}
                alt=""
                width={idx % 2 === 0 ? 108 : 98}
                height={idx % 2 === 0 ? 154 : 160}
                className={`${styles.decor} ${styles.midTree}`}
                style={{ left: `${left}%` }}
              />
            ))}
          </div>
          <div className={`${styles.parallaxLayer} ${styles.frontLayer}`} style={{ transform: `translateX(-${frontShift}px)` }} aria-hidden="true">
            {frontBushPositions.map((left, idx) => (
              <Image
                key={`front-bush-${left}`}
                src="/games/corgi-math-run/simple-bush.svg"
                alt=""
                width={idx % 2 === 0 ? 136 : 126}
                height={idx % 2 === 0 ? 78 : 72}
                className={`${styles.decor} ${styles.frontBush}`}
                style={{ left: `${left}%` }}
              />
            ))}
            {flowerPositions.map((left, idx) => (
              <Image
                key={`front-flowers-${left}`}
                src="/games/corgi-math-run/decorative-flowers.svg"
                alt=""
                width={idx % 2 === 0 ? 98 : 90}
                height={idx % 2 === 0 ? 62 : 56}
                className={`${styles.decor} ${styles.frontFlowers}`}
                style={{ left: `${left}%` }}
              />
            ))}
          </div>
          <div className={styles.groundLayer} aria-hidden="true" />
          <div className={styles.progressLine}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
          <div className={styles.finishSpot} aria-hidden="true" style={{ left: `${finishX - 3}%` }}>
            <Image src="/games/corgi-math-run/pile-of-bones.svg" alt="" width={82} height={74} className={styles.finishBones} />
          </div>
          <div className={styles.finishLine} aria-hidden="true" style={{ left: `${finishX}%` }}>
            <Image src="/games/corgi-math-run/race-finish-line.svg" alt="" width={58} height={132} className={styles.finishFlag} />
          </div>
          <div className={`${styles.corgiWrap} ${feedback === 'correct' ? styles.corgiCelebrate : ''}`} style={{ left: `${corgiX}%` }}>
            <Image src="/games/corgi-math-run/corgi-shadow.svg" alt="" width={86} height={20} className={styles.corgiShadow} />
            <Image src="/games/corgi-math-run/corgi-character.svg" alt="Corgi" width={108} height={82} priority />
          </div>
          <div className={styles.obstacle} style={{ left: `${obstacleX}%` }}>
            <Image
              src="/games/corgi-math-run/wooden-log.svg"
              alt=""
              width={100}
              height={54}
              className={styles.obstacleBase}
            />
            <Image
              src="/games/corgi-math-run/mushroom-obstacle.svg"
              alt="Obstacle"
              width={74}
              height={74}
              className={styles.obstacleImage}
            />
          </div>
        </div>

        {phase === 'idle' && (
          <section className={styles.menu}>
            <h2>{t('corgiMathGame.startTitle')}</h2>
            <p>{t('corgiMathGame.difficultyLabel')}</p>
            <div className={styles.difficultyRow}>
              {Object.keys(DIFFICULTIES).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.difficultyBtn} ${difficulty === key ? styles.difficultyActive : ''}`}
                  onClick={() => setDifficulty(key)}
                >
                  {t(`corgiMathGame.difficulty.${key}`)}
                  <span>{DIFFICULTIES[key].count}</span>
                </button>
              ))}
            </div>
            <button type="button" className={styles.startBtn} onClick={startGame}>
              {t('corgiMathGame.startButton')}
            </button>
          </section>
        )}

        {showQuiz && (
          <section className={`${styles.quiz} ${feedback === 'wrong' ? styles.quizWrong : ''} ${feedback === 'correct' ? styles.quizCorrect : ''}`}>
            {/* --- Pause button (fix #1) --- */}
            <button type="button" className={styles.secondaryBtn} onClick={togglePause}>
              {paused ? t('common.resume') : t('common.pause')}
            </button>

            {!paused && (
              <>
                <p>{t('corgiMathGame.question')}</p>
                <h2>{equation.text} = ?</h2>
                <div className={styles.options}>
                  {equation.options.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleAnswer(option)}
                      disabled={disabledOptions.includes(option)}
                      className={disabledOptions.includes(option) ? styles.optionDisabled : ''}
                      aria-label={`${t('corgiMathGame.question')} ${index + 1}: ${option}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {/* --- Hint button (fix #3) --- */}
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handleHint}
                  disabled={hintUsed}
                >
                  {t('corgiMathGame.hint')}
                </button>
              </>
            )}
          </section>
        )}

        {showSummary && (
          <section className={styles.gameOver}>
            <h2>{phase === 'won' ? t('corgiMathGame.winTitle') : t('corgiMathGame.overTitle')}</h2>
            <p>{phase === 'won' ? t('corgiMathGame.winText', { score }) : t('corgiMathGame.overText', { score })}</p>
            <div className={styles.summaryActions}>
              <button type="button" onClick={startGame}>
                {t('corgiMathGame.playAgain')}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={resetToMenu}>
                {t('corgiMathGame.backToMenu')}
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
