'use client';

import Link from 'next/link';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import CorgiMathRunGame from '../../../games/corgi-math-run/CorgiMathRunGame';
import styles from '../../portal.module.css';

export default function CorgiMathRunPage() {
  const { t } = useI18n();

  return (
    <main className={styles.gamePage}>
      <div className={styles.gameBack}>
        <Link href="/">{t('common.backToPortal')}</Link>
      </div>
      <CorgiMathRunGame />
    </main>
  );
}
