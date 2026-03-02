'use client';

import Link from 'next/link';
import ErrorBoundary from '../../../components/ErrorBoundary';
import MemoryCardsGame from '../../../games/memory-cards/MemoryCardsGame';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import styles from '../../portal.module.css';

export default function MemoryCardsPage() {
  const { t } = useI18n();

  return (
    <main className={styles.gamePage}>
      <div className={styles.gameBack}>
        <Link href="/">{t('common.backToPortal')}</Link>
      </div>
      <ErrorBoundary fallbackTitle={t('common.errorTitle')} retryLabel={t('common.tryAgain')}>
        <MemoryCardsGame />
      </ErrorBoundary>
    </main>
  );
}
