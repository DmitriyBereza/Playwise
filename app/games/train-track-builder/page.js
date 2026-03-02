'use client';

import Link from 'next/link';
import ErrorBoundary from '../../../components/ErrorBoundary';
import TrainTrackBuilderGame from '../../../games/train-track-builder/TrainTrackBuilderGame';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import styles from '../../portal.module.css';

export default function TrainTrackBuilderPage() {
  const { t } = useI18n();

  return (
    <main className={styles.gamePage}>
      <div className={styles.gameBack}>
        <Link href="/">{t('common.backToPortal')}</Link>
      </div>
      <ErrorBoundary fallbackTitle={t('common.errorTitle')} retryLabel={t('common.tryAgain')}>
        <TrainTrackBuilderGame />
      </ErrorBoundary>
    </main>
  );
}
