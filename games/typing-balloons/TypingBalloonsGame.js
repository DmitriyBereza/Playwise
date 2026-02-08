'use client';

import { useEffect, useMemo, useState } from 'react';
import KidWordInput from '../../components/KidWordInput';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { useI18n } from '../../lib/i18n/I18nProvider';
import styles from './typingBalloons.module.css';

const HIGH_SCORES_KEY = 'kidsTyperHighScoresV1';

function toLocaleTag(locale) {
  return locale === 'en' ? 'en-US' : 'uk-UA';
}

function randomColor() {
  const colors = ['#ff6b6b', '#ffd93d', '#6bcBef', '#9cf196', '#ff99c8', '#b09fff'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createBalloons(word, locale) {
  const localeTag = toLocaleTag(locale);
  return word
    .split('')
    .filter((ch) => ch.trim().length > 0)
    .map((char, index) => ({
      id: `${char}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      char: char.toLocaleUpperCase(localeTag),
      index,
      left: 8 + Math.random() * 84,
      delay: Math.random() * 1.4,
      baseDuration: 2.2 + Math.random() * 1.8,
      driftX: -140 + Math.random() * 280,
      tiltStart: -9 + Math.random() * 8,
      tiltEnd: 2 + Math.random() * 10,
      color: randomColor(),
    }));
}

export default function TypingBalloonsGame() {
  const { locale, t } = useI18n();
  const [text, setText] = useState('');
  const [roundWord, setRoundWord] = useState('');
  const [balloons, setBalloons] = useState([]);
  const [nextIndex, setNextIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState([]);
  const [roundSaved, setRoundSaved] = useState(false);
  const [speed, setSpeed] = useState(2.2);
  const [strictOrder, setStrictOrder] = useState(true);
  const [status, setStatus] = useState('');
  const isRoundActive = Boolean(roundWord);
  const localeTag = toLocaleTag(locale);
  const quickWords = t('typingGame.quickWords') || [];

  useEffect(() => {
    if (!roundWord) {
      setStatus(t('typingGame.status.start'));
    }
  }, [roundWord, t]);

  const sortedBalloons = useMemo(
    () => [...balloons].sort((a, b) => a.index - b.index),
    [balloons]
  );
  const totalLetters = nextIndex + sortedBalloons.length;
  const poppedCount = totalLetters - sortedBalloons.length;
  const isWin = useMemo(
    () => Boolean(roundWord) && sortedBalloons.length === 0,
    [roundWord, sortedBalloons.length]
  );
  const activeBalloonId = strictOrder ? sortedBalloons[0]?.id : null;
  const progressPercent = totalLetters ? Math.round((poppedCount / totalLetters) * 100) : 0;

  useEffect(() => {
    const raw = window.localStorage.getItem(HIGH_SCORES_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .map((item) => {
            if (typeof item === 'number' && Number.isFinite(item)) {
              return { score: item, word: 'БЕЗ СЛОВА' };
            }
            if (
              item &&
              typeof item === 'object' &&
              Number.isFinite(item.score) &&
              typeof item.word === 'string'
            ) {
              return {
                score: item.score,
                word: item.word.toLocaleUpperCase(localeTag),
              };
            }
            return null;
          })
          .filter(Boolean)
          .slice(0, 5);
        setHighScores(normalized);
      }
    } catch {
      window.localStorage.removeItem(HIGH_SCORES_KEY);
    }
  }, [localeTag]);

  useEffect(() => {
    if (!isWin || roundSaved) {
      return;
    }

    setRoundSaved(true);
    setHighScores((prev) => {
      const updated = [...prev, { score, word: roundWord.toLocaleUpperCase('uk-UA') }]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      window.localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(updated));
      return updated;
    });
    setStatus(t('typingGame.status.resultSaved'));
  }, [isWin, roundSaved, score, roundWord, t]);

  const handleSend = () => {
    const cleaned = text.trim().toLocaleUpperCase(localeTag);

    if (!cleaned) {
      setStatus(t('typingGame.status.empty'));
      return;
    }

    const freshBalloons = createBalloons(cleaned, locale);

    if (freshBalloons.length === 0) {
      setStatus(t('typingGame.status.lettersOnly'));
      return;
    }

    setRoundWord(cleaned);
    setBalloons(freshBalloons);
    setNextIndex(0);
    setScore(0);
    setRoundSaved(false);
    setStatus(t('typingGame.status.orderMode'));
  };

  const popBalloon = (balloon) => {
    if (strictOrder && balloon.index !== nextIndex) {
      return;
    }

    setBalloons((prev) => prev.filter((item) => item.id !== balloon.id));
    setNextIndex((prev) => prev + 1);
    setScore((prev) => prev + 10);
  };

  const resetRound = () => {
    setRoundWord('');
    setBalloons([]);
    setNextIndex(0);
    setScore(0);
    setRoundSaved(false);
    setStatus(t('typingGame.status.newRound'));
  };

  const setQuickWord = (word) => {
    setText(word.toLocaleUpperCase(localeTag));
    setStatus(t('typingGame.status.quickStart'));
  };

  const playAgain = () => {
    setText('');
    setRoundWord('');
    setBalloons([]);
    setNextIndex(0);
    setScore(0);
    setRoundSaved(false);
    setStatus(t('typingGame.status.playAgain'));
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.gameTitleRow}>
          <h1>{t('typingGame.title')}</h1>
          <LocaleSwitcher />
        </div>
        <p className={styles.lead}>{t('typingGame.lead')}</p>

        <KidWordInput
          value={text}
          onChange={(nextValue) => setText(nextValue.toLocaleUpperCase(localeTag))}
          onSubmit={handleSend}
          disabled={isRoundActive}
          maxLength={40}
        />

        <div className={styles.speedControl}>
          <label htmlFor="speed">{t('typingGame.speedLabel', { value: speed.toFixed(1) })}</label>
          <input
            id="speed"
            type="range"
            min="1"
            max="4"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <p>{t('typingGame.speedHint')}</p>
        </div>

        <div className={styles.quickWords}>
          {quickWords.map((word) => (
            <button key={word} type="button" className={styles.chip} onClick={() => setQuickWord(word)}>
              {word}
            </button>
          ))}
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.secondary} onClick={resetRound}>
            {t('typingGame.newGame')}
          </button>
        </div>

        <p className={styles.status}>{status}</p>
      </section>

      <section className={styles.game} aria-live="polite">
        <div className={styles.gameTop}>
          <h2>{t('portal.games')}</h2>
          <div className={`${styles.orderSwitch} ${styles.orderSwitchInline}`}>
            <label htmlFor="strict-order">{t('typingGame.strictOrder')}</label>
            <input
              id="strict-order"
              type="checkbox"
              checked={strictOrder}
              onChange={(e) => setStrictOrder(e.target.checked)}
            />
          </div>
        </div>
        {roundWord ? (
          <p>{t('typingGame.magicWord', { word: roundWord })}</p>
        ) : (
          <p>{t('typingGame.gameAppears')}</p>
        )}
        {roundWord && (
          <p className={styles.hint}>
            {strictOrder ? (
              <>{t('typingGame.nextLetter', { letter: sortedBalloons[0]?.char || '✓' })}</>
            ) : (
              <>{t('typingGame.freeMode')}</>
            )}
          </p>
        )}

        <div className={styles.progress} aria-label="Прогрес">
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </div>

        <div className={styles.playfield}>
          {sortedBalloons.map((balloon) => {
            const isActive = !strictOrder || balloon.id === activeBalloonId;
            return (
              <button
                key={balloon.id}
                className={`${styles.balloon} ${isActive ? styles.active : styles.locked}`}
                onClick={() => popBalloon(balloon)}
                disabled={!isActive}
                style={{
                  left: `${balloon.left}%`,
                  animationDelay: `${balloon.delay}s`,
                  animationDuration: `${balloon.baseDuration * speed}s`,
                  background: balloon.color,
                  '--drift-x': `${balloon.driftX}px`,
                  '--tilt-start': `${balloon.tiltStart}deg`,
                  '--tilt-end': `${balloon.tiltEnd}deg`,
                }}
                aria-label={`Кулька з літерою ${balloon.char}`}
              >
                {balloon.char}
              </button>
            );
          })}

          {isWin && (
            <div className={styles.winnerScreen}>
              <div className={`${styles.spark} ${styles.spark1}`} />
              <div className={`${styles.spark} ${styles.spark2}`} />
              <div className={`${styles.spark} ${styles.spark3}`} />
              <div className={`${styles.spark} ${styles.spark4}`} />
              <div className={styles.winnerCard}>
                <p className={styles.winnerTitle}>{t('typingGame.winnerTitle')}</p>
                <p className={styles.winnerText}>{t('typingGame.winnerText')}</p>
                <p className={styles.winnerPoints}>
                  {t('typingGame.score')}: {score}
                </p>
                <button type="button" className={styles.playAgainBtn} onClick={playAgain}>
                  {t('typingGame.playAgain')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.scoreboard} aria-live="polite">
          <p>
            {t('typingGame.score')}: <strong>{score}</strong>
          </p>
          <p>
            {t('typingGame.record')}: <strong>{highScores[0]?.score || 0}</strong>
          </p>
        </div>
        <div className={styles.highscoreBoard}>
          <p>{t('typingGame.board')}:</p>
          <ol>
            {highScores.length === 0 && <li>{t('typingGame.noScores')}</li>}
            {highScores.map((item, idx) => (
              <li key={`${item.score}-${item.word}-${idx}`}>
                {item.score} - {item.word}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
