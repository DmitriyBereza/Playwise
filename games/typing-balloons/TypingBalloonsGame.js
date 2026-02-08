'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './typingBalloons.module.css';

const HIGH_SCORES_KEY = 'kidsTyperHighScoresV1';
const UKRAINIAN_KEYBOARD_ROWS = [
  ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ґ', 'Ш', 'Щ', 'З', 'Х', 'Ї'],
  ['Ф', 'І', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Є'],
  ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю'],
];

function randomColor() {
  const colors = ['#ff6b6b', '#ffd93d', '#6bcBef', '#9cf196', '#ff99c8', '#b09fff'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createBalloons(word) {
  return word
    .split('')
    .filter((ch) => ch.trim().length > 0)
    .map((char, index) => ({
      id: `${char}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      char: char.toLocaleUpperCase('uk-UA'),
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
  const [text, setText] = useState('');
  const [roundWord, setRoundWord] = useState('');
  const [balloons, setBalloons] = useState([]);
  const [nextIndex, setNextIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState([]);
  const [roundSaved, setRoundSaved] = useState(false);
  const [speed, setSpeed] = useState(2.2);
  const [strictOrder, setStrictOrder] = useState(true);
  const [status, setStatus] = useState('Напиши слово або коротке речення.');
  const isRoundActive = Boolean(roundWord);

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
                word: item.word.toLocaleUpperCase('uk-UA'),
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
  }, []);

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
    setStatus('Молодець! Результат додано в таблицю рекордів.');
  }, [isWin, roundSaved, score, roundWord]);

  const handleSend = () => {
    const cleaned = text.trim().toLocaleUpperCase('uk-UA');

    if (!cleaned) {
      setStatus('Введи, будь ласка, хоча б одну літеру.');
      return;
    }

    const freshBalloons = createBalloons(cleaned);

    if (freshBalloons.length === 0) {
      setStatus('Спробуй слово з літерами.');
      return;
    }

    setRoundWord(cleaned);
    setBalloons(freshBalloons);
    setNextIndex(0);
    setScore(0);
    setRoundSaved(false);
    setStatus('Супер! Лопай кульки тільки по порядку літер.');
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
    setStatus('Почнемо нову гру. Напиши слово.');
  };

  const setQuickWord = (word) => {
    setText(word.toLocaleUpperCase('uk-UA'));
    setStatus('Натисни "Надіслати", щоб почати гру.');
  };

  const playAgain = () => {
    setText('');
    setRoundWord('');
    setBalloons([]);
    setNextIndex(0);
    setScore(0);
    setRoundSaved(false);
    setStatus('Чудово! Введи нове слово для наступної гри.');
  };

  const addKey = (key) => {
    setText((prev) => `${prev}${key}`);
  };

  const removeLastKey = () => {
    setText((prev) => prev.slice(0, -1));
  };

  const addSpace = () => {
    setText((prev) => (prev.endsWith(' ') || prev.length === 0 ? prev : `${prev} `));
  };

  const clearText = () => {
    setText('');
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Моя весела друкарка</h1>
        <p className={styles.lead}>Друкуй слова і лопай кульки за правильною чергою.</p>

        <label htmlFor="kid-input">Твоє повідомлення</label>
        <div className={styles.inputRow}>
          <textarea
            id="kid-input"
            value={text}
            onChange={(e) => setText(e.target.value.toLocaleUpperCase('uk-UA'))}
            placeholder="Наприклад: киця"
            rows={3}
            maxLength={40}
            disabled={isRoundActive}
          />
          <button type="button" className={styles.sendBtn} onClick={handleSend} disabled={isRoundActive}>
            Надіслати
          </button>
        </div>

        <div className={styles.keyboardWrap}>
          <p>Дитяча клавіатура</p>
          {UKRAINIAN_KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className={styles.keyboardRow}>
              {row.map((key) => (
                <button
                  type="button"
                  key={key}
                  className={styles.keyBtn}
                  disabled={isRoundActive}
                  onClick={() => addKey(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
          <div className={`${styles.keyboardRow} ${styles.keyboardTools}`}>
            <button type="button" className={`${styles.keyBtn} ${styles.tool}`} disabled={isRoundActive} onClick={addSpace}>
              Пробіл
            </button>
            <button
              type="button"
              className={`${styles.keyBtn} ${styles.tool}`}
              disabled={isRoundActive}
              onClick={removeLastKey}
            >
              Стерти
            </button>
            <button type="button" className={`${styles.keyBtn} ${styles.tool}`} disabled={isRoundActive} onClick={clearText}>
              Очистити
            </button>
          </div>
        </div>

        <div className={styles.speedControl}>
          <label htmlFor="speed">Швидкість кульок: {speed.toFixed(1)}x повільніше</label>
          <input
            id="speed"
            type="range"
            min="1"
            max="4"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          <p>Лівіше швидше, правіше повільніше.</p>
        </div>

        <div className={styles.quickWords}>
          <button type="button" className={styles.chip} onClick={() => setQuickWord('котик')}>
            КОТИК
          </button>
          <button type="button" className={styles.chip} onClick={() => setQuickWord('сонце')}>
            СОНЦЕ
          </button>
          <button type="button" className={styles.chip} onClick={() => setQuickWord('мама')}>
            МАМА
          </button>
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.secondary} onClick={resetRound}>
            Нова гра
          </button>
        </div>

        <p className={styles.status}>{status}</p>
      </section>

      <section className={styles.game} aria-live="polite">
        <div className={styles.gameTop}>
          <h2>Міні-гра</h2>
          <div className={`${styles.orderSwitch} ${styles.orderSwitchInline}`}>
            <label htmlFor="strict-order">Суворий порядок літер</label>
            <input
              id="strict-order"
              type="checkbox"
              checked={strictOrder}
              onChange={(e) => setStrictOrder(e.target.checked)}
              disabled={isRoundActive}
            />
          </div>
        </div>
        {roundWord ? <p>Чарівне слово: {roundWord}</p> : <p>Після надсилання тут з&apos;явиться гра.</p>}
        {roundWord && (
          <p className={styles.hint}>
            {strictOrder ? (
              <>
                Наступна літера: <strong>{sortedBalloons[0]?.char || '✓'}</strong>
              </>
            ) : (
              <>
                Режим вільної гри: <strong>лопай будь-яку кульку</strong>
              </>
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
                <p className={styles.winnerTitle}>Ура! Перемога!</p>
                <p className={styles.winnerText}>Ти луснув усі кульки. Молодець!</p>
                <p className={styles.winnerPoints}>Рахунок: {score}</p>
                <button type="button" className={styles.playAgainBtn} onClick={playAgain}>
                  Грати ще
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.scoreboard} aria-live="polite">
          <p>
            Рахунок: <strong>{score}</strong>
          </p>
          <p>
            Рекорд: <strong>{highScores[0]?.score || 0}</strong>
          </p>
        </div>
        <div className={styles.highscoreBoard}>
          <p>Таблиця рекордів:</p>
          <ol>
            {highScores.length === 0 && <li>Поки немає рекордів</li>}
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
