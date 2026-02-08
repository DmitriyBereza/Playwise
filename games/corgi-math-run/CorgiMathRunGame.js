'use client';

import { useEffect, useMemo, useState } from 'react';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { useI18n } from '../../lib/i18n/I18nProvider';
import styles from './corgiMathRun.module.css';

const HIGH_SCORE_KEY = 'corgiMathRunHighScoreV1';
const MAX_WRONG_ATTEMPTS = 3;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createEquation() {
  const operation = Math.random() > 0.35 ? '+' : '-';
  let a = randomInt(1, 9);
  let b = randomInt(0, 9);

  if (operation === '-' && b > a) {
    [a, b] = [b, a];
  }

  const answer = operation === '+' ? a + b : a - b;
  const wrongA = Math.max(0, answer + (Math.random() > 0.5 ? 1 : -1) * randomInt(1, 3));
  const wrongB = Math.max(0, answer + (Math.random() > 0.5 ? 1 : -1) * randomInt(2, 4));
  const unique = Array.from(new Set([answer, wrongA, wrongB]));

  while (unique.length < 3) {
    unique.push(Math.max(0, answer + randomInt(-4, 4)));
  }

  const options = unique.slice(0, 3).sort(() => Math.random() - 0.5);

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    text: `${a} ${operation} ${b}`,
    answer,
    options,
  };
}

export default function CorgiMathRunGame() {
  const { t } = useI18n();
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [equation, setEquation] = useState(() => createEquation());
  const [status, setStatus] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);

  const attemptsLeft = MAX_WRONG_ATTEMPTS - wrongAttempts;
  const progressPercent = Math.min(100, score * 5);
  const corgiX = Math.min(84, 8 + score * 3.5);

  useEffect(() => {
    setStatus(t('corgiMathGame.status.ready'));
  }, [t]);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(HIGH_SCORE_KEY) || 0);
    if (Number.isFinite(stored) && stored > 0) {
      setHighScore(stored);
    }
  }, []);

  const handleAnswer = (value) => {
    if (isGameOver) {
      return;
    }

    if (value === equation.answer) {
      const nextScore = score + 1;
      setScore(nextScore);
      setEquation(createEquation());
      setStatus(t('corgiMathGame.status.correct'));

      if (nextScore > highScore) {
        setHighScore(nextScore);
        window.localStorage.setItem(HIGH_SCORE_KEY, String(nextScore));
      }
      return;
    }

    const nextWrong = wrongAttempts + 1;
    setWrongAttempts(nextWrong);

    if (nextWrong >= MAX_WRONG_ATTEMPTS) {
      setIsGameOver(true);
      setStatus(t('corgiMathGame.status.gameOver'));
      return;
    }

    setStatus(t('corgiMathGame.status.wrong'));
  };

  const restart = () => {
    setScore(0);
    setWrongAttempts(0);
    setEquation(createEquation());
    setIsGameOver(false);
    setStatus(t('corgiMathGame.status.ready'));
  };

  const hearts = useMemo(
    () =>
      Array.from({ length: MAX_WRONG_ATTEMPTS }, (_, index) => (
        <span key={index} className={index < wrongAttempts ? styles.heartLost : styles.heart}>
          ❤
        </span>
      )),
    [wrongAttempts]
  );

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
        </div>

        <div className={styles.hearts}>{hearts}</div>
        <p className={styles.status}>{status}</p>

        <div className={styles.track}>
          <div className={styles.trees} />
          <div className={styles.road} />
          <div className={styles.progressLine}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
          <div className={styles.corgi} style={{ left: `${corgiX}%` }}>
            🐶
          </div>
          <div className={styles.obstacle}>🪵</div>
        </div>

        {!isGameOver && (
          <section className={styles.quiz}>
            <p>{t('corgiMathGame.question')}</p>
            <h2>{equation.text} = ?</h2>
            <div className={styles.options}>
              {equation.options.map((option) => (
                <button key={option} type="button" onClick={() => handleAnswer(option)}>
                  {option}
                </button>
              ))}
            </div>
          </section>
        )}

        {isGameOver && (
          <section className={styles.gameOver}>
            <h2>{t('corgiMathGame.overTitle')}</h2>
            <p>{t('corgiMathGame.overText', { score })}</p>
            <button type="button" onClick={restart}>
              {t('corgiMathGame.playAgain')}
            </button>
          </section>
        )}
      </section>
    </main>
  );
}

