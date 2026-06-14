'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { buildOrder } from './orderLogic';
import { WALK_DURATION } from './scene/animations';
import styles from './storeCashier.module.css';

const StoreScene = dynamic(() => import('./scene/StoreScene'), { ssr: false });

const HIGH_SCORE_KEY = 'storeCashierHighScoreV1';
const CUSTOMERS_PER_SESSION = 12;
const MAX_WRONG_ATTEMPTS = 2;
const FEEDBACK_MS = 560;
const ORDER_REVEAL_MS = 900;
const PAYMENT_REVEAL_MS = 700;

export default function StoreCashierGame() {
  const { t } = useI18n();

  const [phase, setPhase] = useState('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [customerIndex, setCustomerIndex] = useState(0);
  const [order, setOrder] = useState(null);
  const [usedOrderKeys, setUsedOrderKeys] = useState(new Set());
  const [walkProgress, setWalkProgress] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [disabledOptions, setDisabledOptions] = useState([]);
  const [feedback, setFeedback] = useState('idle');
  const [step, setStep] = useState('total');
  const [status, setStatus] = useState('');
  const [servedCorrectly, setServedCorrectly] = useState(true);

  const walkStartRef = useRef(0);
  const walkRafRef = useRef(null);

  useEffect(() => {
    setStatus(t('storeCashierGame.status.idle'));
  }, [t]);

  useEffect(() => {
    try {
      const stored = Number(window.localStorage.getItem(HIGH_SCORE_KEY) || 0);
      if (Number.isFinite(stored) && stored > 0) {
        setHighScore(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const stopWalkAnimation = useCallback(() => {
    if (walkRafRef.current) {
      cancelAnimationFrame(walkRafRef.current);
      walkRafRef.current = null;
    }
  }, []);

  const startWalkAnimation = useCallback(
    (targetPhase, onComplete) => {
      stopWalkAnimation();
      walkStartRef.current = performance.now();
      setWalkProgress(0);

      const tick = (now) => {
        const elapsed = (now - walkStartRef.current) / 1000;
        const progress = Math.min(1, elapsed / WALK_DURATION);
        setWalkProgress(progress);

        if (progress < 1) {
          walkRafRef.current = requestAnimationFrame(tick);
          return;
        }

        walkRafRef.current = null;
        onComplete();
      };

      setPhase(targetPhase);
      walkRafRef.current = requestAnimationFrame(tick);
    },
    [stopWalkAnimation],
  );

  useEffect(() => () => stopWalkAnimation(), [stopWalkAnimation]);

  const beginCustomer = useCallback(
    (index, usedKeys) => {
      const nextOrder = buildOrder(usedKeys);
      const nextUsed = new Set(usedKeys);
      nextUsed.add(nextOrder.key);

      setOrder(nextOrder);
      setUsedOrderKeys(nextUsed);
      setCustomerIndex(index);
      setWrongAttempts(0);
      setDisabledOptions([]);
      setFeedback('idle');
      setStep('total');
      setServedCorrectly(true);
      setStatus(t('storeCashierGame.status.customerArriving'));

      startWalkAnimation('customerEntering', () => {
        setPhase('showOrder');
        setStatus(t('storeCashierGame.status.orderReady'));
        window.setTimeout(() => {
          setPhase('pickTotal');
          setStatus(t('storeCashierGame.promptTotal'));
        }, ORDER_REVEAL_MS);
      });
    },
    [startWalkAnimation, t],
  );

  const startGame = () => {
    setScore(0);
    setUsedOrderKeys(new Set());
    beginCustomer(1, new Set());
  };

  const finishCustomer = useCallback(
    (currentScore, wasCorrect) => {
      const nextScore = wasCorrect ? currentScore + 1 : currentScore;
      if (wasCorrect) {
        setScore(nextScore);
        if (nextScore > highScore) {
          setHighScore(nextScore);
          try {
            window.localStorage.setItem(HIGH_SCORE_KEY, String(nextScore));
          } catch {
            /* ignore */
          }
        }
      }

      setStatus(t('storeCashierGame.status.customerLeaving'));
      startWalkAnimation('customerLeaving', () => {
        if (customerIndex >= CUSTOMERS_PER_SESSION) {
          setPhase('gameOver');
          setStatus(t('storeCashierGame.status.sessionComplete'));
          return;
        }
        beginCustomer(customerIndex + 1, usedOrderKeys);
      });
    },
    [beginCustomer, customerIndex, highScore, startWalkAnimation, t, usedOrderKeys],
  );

  const formatPrice = useCallback((amount) => t('storeCashierGame.price', { amount }), [t]);

  const advanceToPayment = useCallback(() => {
    setStep('change');
    setWrongAttempts(0);
    setDisabledOptions([]);
    setFeedback('idle');
    setPhase('showPayment');
    setStatus(t('storeCashierGame.customerPaid', { amount: formatPrice(order.payment) }));
    window.setTimeout(() => {
      setPhase('pickChange');
      setStatus(t('storeCashierGame.promptChange'));
    }, PAYMENT_REVEAL_MS);
  }, [formatPrice, order, t]);

  const handleTotalAnswer = (value) => {
    if (phase !== 'pickTotal' || !order || feedback !== 'idle') {
      return;
    }

    if (value === order.total) {
      setFeedback('correct');
      setStatus(t('storeCashierGame.status.totalCorrect'));
      window.setTimeout(() => {
        setFeedback('idle');
        advanceToPayment();
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
    setServedCorrectly(false);
    setStatus(t('storeCashierGame.status.wrong'));

    window.setTimeout(() => {
      setFeedback('idle');
      if (nextWrong >= MAX_WRONG_ATTEMPTS) {
        setStatus(t('storeCashierGame.status.totalReveal', { amount: formatPrice(order.total) }));
        window.setTimeout(advanceToPayment, FEEDBACK_MS);
      }
    }, FEEDBACK_MS);
  };

  const handleChangeAnswer = (value) => {
    if (phase !== 'pickChange' || !order || feedback !== 'idle') {
      return;
    }

    if (value === order.change) {
      setFeedback('correct');
      setStatus(t('storeCashierGame.status.changeCorrect'));
      window.setTimeout(() => {
        setFeedback('idle');
        finishCustomer(score, servedCorrectly);
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
    setServedCorrectly(false);
    setStatus(t('storeCashierGame.status.wrong'));

    window.setTimeout(() => {
      setFeedback('idle');
      if (nextWrong >= MAX_WRONG_ATTEMPTS) {
        setStatus(t('storeCashierGame.status.changeReveal', { amount: formatPrice(order.change) }));
        window.setTimeout(() => finishCustomer(score, false), FEEDBACK_MS);
      }
    }, FEEDBACK_MS);
  };

  const resetToMenu = () => {
    stopWalkAnimation();
    setPhase('idle');
    setOrder(null);
    setScore(0);
    setCustomerIndex(0);
    setWalkProgress(0);
    setWrongAttempts(0);
    setDisabledOptions([]);
    setFeedback('idle');
    setStatus(t('storeCashierGame.status.idle'));
  };

  const attemptsLeft = MAX_WRONG_ATTEMPTS - wrongAttempts;
  const showOrderPanel = order && (phase === 'showOrder' || phase === 'pickTotal' || phase === 'totalFeedback');
  const showPaymentPanel = order && (phase === 'showPayment' || phase === 'pickChange' || phase === 'changeFeedback');
  const showTotalQuiz = phase === 'pickTotal' && order;
  const showChangeQuiz = phase === 'pickChange' && order;
  const showSummary = phase === 'gameOver';

  const hearts = useMemo(
    () =>
      Array.from({ length: MAX_WRONG_ATTEMPTS }, (_, index) => (
        <span key={index} className={index < wrongAttempts ? styles.heartLost : styles.heart}>
          ❤
        </span>
      )),
    [wrongAttempts],
  );

  if (phase === 'idle') {
    return (
      <div className={styles.page}>
        <div className={styles.canvasWrapper}>
          <StoreScene phase="idle" walkProgress={0} orderItems={[]} customerIndex={0} />
        </div>

        <div className={styles.overlay}>
          <LocaleSwitcher />
          <div className={styles.spacer} />
          <div className={styles.startScreen}>
            <h1 className={styles.startTitle}>{t('storeCashierGame.title')}</h1>
            <p className={styles.startDesc}>{t('storeCashierGame.lead')}</p>
            {highScore > 0 && (
              <p className={styles.recordBadge}>
                {t('storeCashierGame.highScore')}: {highScore}
              </p>
            )}
            <button type="button" className={styles.btnStart} onClick={startGame}>
              {t('storeCashierGame.startButton')}
            </button>
          </div>
          <div className={styles.spacer} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.canvasWrapper}>
        <StoreScene
          phase={phase}
          walkProgress={walkProgress}
          orderItems={order?.items || []}
          customerIndex={customerIndex}
        />
      </div>

      <div className={styles.overlay}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>{t('storeCashierGame.title')}</h1>
            <span className={styles.levelBadge}>
              {t('storeCashierGame.round', { current: customerIndex, total: CUSTOMERS_PER_SESSION })}
            </span>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span>{t('storeCashierGame.score')}</span>
              <span className={styles.statValue}>{score}</span>
            </div>
            <div className={styles.stat}>
              <span>{t('storeCashierGame.highScore')}</span>
              <span className={styles.statValue}>{highScore}</span>
            </div>
          </div>
          <LocaleSwitcher />
        </div>

        <p className={styles.statusBar} aria-live="polite">
          {status}
        </p>

        {(showTotalQuiz || showChangeQuiz) && (
          <div className={styles.heartsRow}>
            <span className={styles.heartsLabel}>{t('storeCashierGame.attemptsLeft')}: {attemptsLeft}</span>
            <div className={styles.hearts}>{hearts}</div>
          </div>
        )}

        {showOrderPanel && (
          <section className={styles.orderPanel}>
            <h2>{t('storeCashierGame.orderTitle')}</h2>
            <ul className={styles.orderList}>
              {order.items.map((item) => (
                <li key={item.id}>
                  <span>{t(`storeCashierGame.items.${item.id}`)}</span>
                  <span>{formatPrice(item.price)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {showPaymentPanel && (
          <section className={styles.paymentPanel}>
            <p>{t('storeCashierGame.totalLabel', { amount: formatPrice(order.total) })}</p>
            <p>{t('storeCashierGame.paidLabel', { amount: formatPrice(order.payment) })}</p>
          </section>
        )}

        <div className={styles.spacer} />

        {showTotalQuiz && (
          <section
            className={`${styles.quiz} ${feedback === 'wrong' ? styles.quizWrong : ''} ${feedback === 'correct' ? styles.quizCorrect : ''}`}
          >
            <h2>{t('storeCashierGame.promptTotal')}</h2>
            <div className={styles.options}>
              {order.totalOptions.map((option) => (
                <button
                  key={`total-${option}`}
                  type="button"
                  onClick={() => handleTotalAnswer(option)}
                  disabled={disabledOptions.includes(option)}
                  className={disabledOptions.includes(option) ? styles.optionDisabled : ''}
                >
                  {formatPrice(option)}
                </button>
              ))}
            </div>
          </section>
        )}

        {showChangeQuiz && (
          <section
            className={`${styles.quiz} ${feedback === 'wrong' ? styles.quizWrong : ''} ${feedback === 'correct' ? styles.quizCorrect : ''}`}
          >
            <h2>{t('storeCashierGame.promptChange')}</h2>
            <div className={styles.options}>
              {order.changeOptions.map((option) => (
                <button
                  key={`change-${option}`}
                  type="button"
                  onClick={() => handleChangeAnswer(option)}
                  disabled={disabledOptions.includes(option)}
                  className={disabledOptions.includes(option) ? styles.optionDisabled : ''}
                >
                  {formatPrice(option)}
                </button>
              ))}
            </div>
          </section>
        )}

        {showSummary && (
          <section className={styles.summary}>
            <h2>{t('storeCashierGame.overTitle')}</h2>
            <p>{t('storeCashierGame.overText', { score })}</p>
            <div className={styles.summaryActions}>
              <button type="button" onClick={startGame}>
                {t('storeCashierGame.playAgain')}
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={resetToMenu}>
                {t('storeCashierGame.backToMenu')}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
