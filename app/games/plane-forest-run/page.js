'use client';

import Link from 'next/link';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import PlaneForestRunGame from '../../../games/plane-forest-run/PlaneForestRunGame';
import styles from '../../portal.module.css';

export default function PlaneForestRunPage() {
  const { t } = useI18n();

  return (
    <main className={styles.gamePage}>
      <div className={styles.gameBack}>
        <Link href="/">{t('common.backToPortal')}</Link>
      </div>
      <PlaneForestRunGame />
    </main>
  );
}
