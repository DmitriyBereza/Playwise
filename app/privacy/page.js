'use client';

import Link from 'next/link';
import { useI18n } from '../../lib/i18n/I18nProvider';
import styles from './privacy.module.css';

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <main className={styles.container}>
      <div className={styles.back}>
        <Link href="/">{t('common.backToPortal')}</Link>
      </div>
      <article className={styles.card}>
        <h1>{t('privacy.heading')}</h1>
        <ul>
          <li>{t('privacy.noData')}</li>
          <li>{t('privacy.noTracking')}</li>
          <li>{t('privacy.localStorage')}</li>
          <li>{t('privacy.kids')}</li>
        </ul>
        <p>{t('privacy.contact')}</p>
      </article>
    </main>
  );
}
