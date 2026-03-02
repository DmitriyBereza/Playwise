'use client';

import Link from 'next/link';
import { useI18n } from '../lib/i18n/I18nProvider';
import styles from './not-found.module.css';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <span className={styles.emoji}>🗺️</span>
        <h1>404</h1>
        <p>{t('common.notFound')}</p>
        <Link href="/" className={styles.homeLink}>
          {t('common.backToPortal')}
        </Link>
      </div>
    </main>
  );
}
