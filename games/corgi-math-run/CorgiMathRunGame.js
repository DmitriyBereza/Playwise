'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { DIFFICULTIES, buildEquation } from './mathLogic';
import { CORGI_SKINS, getCorgiColors } from './scene/skinThemes';
import styles from './corgiMathRun.module.css';

const RunnerScene = dynamic(() => import('./scene/RunnerScene'), { ssr: false });

const HIGH_SCORE_KEY = 'corgiMathRunHighScoreV1';
const SKIN_KEY = 'corgiMathRunSkinV1';
const MAX_WRONG_ATTEMPTS = 3;
const FEEDBACK_MS = 620;

const CONFETTI_COLORS = ['#FFB889', '#7BC5ED', '#8FD49A', '#FFD93D', '#FF8FAB', '#A78BFA'];

function heartsFor(wrongAttempts) {
  return Array.from({ length: MAX_WRONG_ATTEMPTS }, (_, index) => index < MAX_WRONG_ATTEMPTS - wrongAttempts);
}

export default function CorgiMathRunGame() {
  const { t } = useI18n();

  const [phase, setPhase] = useState('idle');
  const [difficulty, setDifficulty] = useState('easy');
  const [skin, setSkin] = useState('forest');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [targetCount, setTargetCount] = useState(DIFFICULTIES.easy.count);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [equation, setEquation] = useState(null);
  const [disabledOptions, setDisabledOptions] = useState([]);
  const [feedback, setFeedback] = useState('idle');
  const [feedbackSeq, setFeedbackSeq] = useState(0);
  const [questionId, setQuestionId] = useState(0);
  const [status, setStatus] = useState('');
  const [paused, setPaused] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const usedKeysRef = useRef(new Set());
  const timersRef = useRef([]);

  const colors = useMemo(() => getCorgiColors(skin), [skin]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn, delay) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    setStatus(t('corgiMathGame.status.selectAndStart'));
  }, [t]);

  useEffect(() => {
    try {
      const storedScore = Number(window.localStorage.getItem(HIGH_SCORE_KEY) || 0);
      if (Number.isFinite(storedScore) && storedScore > 0) {
        setHighScore(storedScore);
      }
      const storedSkin = window.localStorage.getItem(SKIN_KEY);
      if (storedSkin && CORGI_SKINS[storedSkin]) {
        setSkin(storedSkin);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const lives = Math.max(0, MAX_WRONG_ATTEMPTS - wrongAttempts);
  const progressPercent = targetCount ? Math.min(100, (score / targetCount) * 100) : 0;
  const stars = wrongAttempts === 0 ? 3 : wrongAttempts === 1 ? 2 : 1;

  const beginRun = useCallback(() => {
    clearTimers();
    const target = DIFFICULTIES[difficulty].count;
    const used = new Set();
    const first = buildEquation(used, difficulty, 0);
    used.add(first.key);
    usedKeysRef.current = used;

    setTargetCount(target);
    setScore(0);
    setWrongAttempts(0);
    setDisabledOptions([]);
    setEquation(first);
    setFeedback('idle');
    setPaused(false);
    setHintUsed(false);
    setCombo(0);
    setShowConfetti(false);
    setQuestionId((id) => id + 1);
    setPhase('playing');
    setStatus(t('corgiMathGame.status.ready'));
  }, [clearTimers, difficulty, t]);

  const advance = useCallback(
    (nextScore) => {
      if (nextScore >= targetCount) {
        setPhase('won');
        setStatus(t('corgiMathGame.status.won'));
        setShowConfetti(true);
        return;
      }

      const used = usedKeysRef.current;
      const next = buildEquation(used, difficulty, nextScore / targetCount);
      used.add(next.key);

      setEquation(next);
      setDisabledOptions([]);
      setHintUsed(false);
      setQuestionId((id) => id + 1);
      setStatus(t('corgiMathGame.status.correct'));
    },
    [difficulty, targetCount, t]
  );

  const handleAnswer = (value) => {
    if (phase !== 'playing' || !equation || feedback !== 'idle' || paused) {
      return;
    }
    if (disabledOptions.includes(value)) {
      return;
    }

    if (value === equation.answer) {
      const nextScore = score + 1;
      setScore(nextScore);
      setCombo((prev) => prev + 1);

      if (nextScore > highScore) {
        setHighScore(nextScore);
        try {
          window.localStorage.setItem(HIGH_SCORE_KEY, String(nextScore));
        } catch {
          /* ignore */
        }
      }

      setFeedback('correct');
      setFeedbackSeq((seq) => seq + 1);
      schedule(() => {
        setFeedback('idle');
        advance(nextScore);
      }, FEEDBACK_MS);
      return;
    }

    const nextWrong = wrongAttempts + 1;
    setWrongAttempts(nextWrong);
    setDisabledOptions((prev) => [...prev, value]);
    setCombo(0);
    setFeedback('wrong');
    setFeedbackSeq((seq) => seq + 1);
    setStatus(t('corgiMathGame.status.wrong'));

    if (nextWrong >= MAX_WRONG_ATTEMPTS) {
      schedule(() => {
        setFeedback('idle');
        setPhase('gameOver');
        setStatus(t('corgiMathGame.status.gameOver'));
      }, FEEDBACK_MS);
    } else {
      schedule(() => setFeedback('idle'), FEEDBACK_MS);
    }
  };

  const handleHint = () => {
    if (hintUsed || !equation || paused || feedback !== 'idle') {
      return;
    }

    const wrongOptions = equation.options.filter(
      (option) => option !== equation.answer && !disabledOptions.includes(option)
    );
    if (wrongOptions.length === 0) {
      return;
    }

    const removed = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    setDisabledOptions((prev) => [...prev, removed]);
    setHintUsed(true);
  };

  const togglePause = () => {
    if (phase !== 'playing') {
      return;
    }
    setPaused((prev) => !prev);
  };

  const resetToMenu = () => {
    clearTimers();
    setPhase('idle');
    setEquation(null);
    setDisabledOptions([]);
    setWrongAttempts(0);
    setScore(0);
    setFeedback('idle');
    setPaused(false);
    setHintUsed(false);
    setCombo(0);
    setShowConfetti(false);
    setStatus(t('corgiMathGame.status.selectAndStart'));
  };

  const handleSkinChange = (key) => {
    setSkin(key);
    try {
      window.localStorage.setItem(SKIN_KEY, key);
    } catch {
      /* ignore */
    }
  };

  const pageBackground = `linear-gradient(180deg, ${colors.skyTop} 0%, ${colors.skyBottom} 62%, ${colors.grass} 100%)`;

  if (phase === 'idle') {
    return (
      <div className={styles.page} style={{ background: pageBackground }}>
        <div className={styles.localeCorner}>
          <LocaleSwitcher />
        </div>

        <div className={styles.startScreen}>
          <div className={styles.startCard}>
            <h1 className={styles.startTitle}>{t('corgiMathGame.title')}</h1>
            <p className={styles.startDesc}>{t('corgiMathGame.lead')}</p>

            <div className={styles.optionGroup}>
              <span className={styles.optionLabel}>{t('corgiMathGame.difficultyLabel')}</span>
              <div className={styles.difficultyRow}>
                {Object.entries(DIFFICULTIES).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.difficultyBtn} ${difficulty === key ? styles.difficultyActive : ''}`}
                    onClick={() => setDifficulty(key)}
                    aria-pressed={difficulty === key}
                  >
                    <span className={styles.difficultyPaws} aria-hidden="true">
                      {'🐾'.repeat(Object.keys(DIFFICULTIES).indexOf(key) + 1)}
                    </span>
                    <span className={styles.difficultyName}>{t(`corgiMathGame.difficulty.${key}`)}</span>
                    <span className={styles.difficultyCount}>{value.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.optionGroup}>
              <span className={styles.optionLabel}>{t('corgiMathGame.skins.title')}</span>
              <div className={styles.skinRow}>
                {Object.entries(CORGI_SKINS).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.skinBtn} ${skin === key ? styles.skinActive : ''}`}
                    onClick={() => handleSkinChange(key)}
                    aria-pressed={skin === key}
                    style={{ background: `linear-gradient(180deg, ${value.skyTop}, ${value.grass})` }}
                    title={t(value.nameKey)}
                  >
                    <span className={styles.skinName}>{t(value.nameKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            {highScore > 0 && (
              <p className={styles.recordBadge}>
                {t('corgiMathGame.highScore')}: <strong>{highScore}</strong>
              </p>
            )}

            <button type="button" className={styles.btnStart} onClick={beginRun}>
              {t('corgiMathGame.startButton')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showSummary = phase === 'won' || phase === 'gameOver';

  return (
    <div className={styles.page} style={{ background: pageBackground }}>
      <div className={styles.canvasWrapper}>
        <RunnerScene
          skin={skin}
          phase={phase}
          paused={paused}
          questionId={questionId}
          feedback={feedback}
          feedbackSeq={feedbackSeq}
        />
      </div>

      <div className={styles.overlay}>
        <div className={styles.header}>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span>{t('corgiMathGame.score')}</span>
              <span className={styles.statValue}>{score}</span>
            </div>
            <div className={styles.stat}>
              <span>{t('corgiMathGame.highScore')}</span>
              <span className={styles.statValue}>{highScore}</span>
            </div>
            <div className={styles.stat}>
              <span>{t('corgiMathGame.attemptsLeft')}</span>
              <span className={styles.hearts} aria-hidden="true">
                {heartsFor(wrongAttempts).map((alive, index) => (
                  <span key={index} className={alive ? styles.heart : styles.heartLost}>
                    ❤
                  </span>
                ))}
              </span>
            </div>
          </div>
          <LocaleSwitcher />
        </div>

        <div className={styles.statusBar} aria-live="polite">
          {paused ? t('common.paused') : status}
        </div>

        <div className={styles.spacer} />

        {phase === 'playing' && (
          <div className={styles.questionPanel}>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </div>

            {!paused && equation && (
              <>
                <p className={styles.prompt}>{t('corgiMathGame.question')}</p>
                <div className={styles.equation} aria-live="polite">
                  {equation.text} = ?
                </div>
                <div className={styles.answers}>
                  {equation.options.map((option) => {
                    const disabled = disabledOptions.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`${styles.answerBtn} ${disabled ? styles.answerDisabled : ''}`}
                        onClick={() => handleAnswer(option)}
                        disabled={disabled}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                <div className={styles.quizActions}>
                  <button type="button" className={styles.btnGhost} onClick={handleHint} disabled={hintUsed}>
                    {t('corgiMathGame.hint')}
                  </button>
                  <button type="button" className={styles.btnGhost} onClick={togglePause}>
                    {t('common.pause')}
                  </button>
                </div>
              </>
            )}

            {paused && (
              <div className={styles.pauseBox}>
                <p>{t('common.paused')}</p>
                <button type="button" className={styles.btnStart} onClick={togglePause}>
                  {t('common.resume')}
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'playing' && combo > 1 && (
          <div className={styles.comboBadge}>{t('corgiMathGame.combo', { count: combo })}</div>
        )}
      </div>

      {showConfetti && (
        <div className={styles.confetti} aria-hidden="true">
          {Array.from({ length: 32 }).map((_, index) => (
            <span
              key={index}
              className={styles.confettiPiece}
              style={{
                left: `${Math.random() * 100}%`,
                background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.1 + Math.random() * 1}s`,
              }}
            />
          ))}
        </div>
      )}

      {showSummary && (
        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryEmoji} aria-hidden="true">
              {phase === 'won' ? '🐶🏁' : '🐾'}
            </div>
            <h2 className={styles.summaryTitle}>
              {phase === 'won' ? t('corgiMathGame.winTitle') : t('corgiMathGame.overTitle')}
            </h2>
            {phase === 'won' && (
              <div className={styles.stars} aria-label={t('corgiMathGame.starsLabel', { stars })}>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={n <= stars ? styles.starOn : styles.starOff}>
                    ★
                  </span>
                ))}
              </div>
            )}
            <p className={styles.summaryText}>
              {phase === 'won'
                ? t('corgiMathGame.winText', { score })
                : t('corgiMathGame.overText', { score })}
            </p>
            <div className={styles.summaryActions}>
              <button type="button" className={styles.btnStart} onClick={beginRun}>
                {t('corgiMathGame.playAgain')}
              </button>
              <button type="button" className={styles.btnGhost} onClick={resetToMenu}>
                {t('corgiMathGame.backToMenu')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
