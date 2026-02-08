'use client';

import Link from 'next/link';
import TypingBalloonsGame from '../../../games/typing-balloons/TypingBalloonsGame';
import { useI18n } from '../../../lib/i18n/I18nProvider';
import styles from '../../portal.module.css';

export default function TypingBalloonsPage() {
  const { t } = useI18n();

  return (
    <main className={styles.gamePage}>
      <div className={styles.gameBack}>
        <Link href="/">{t('common.backToPortal')}</Link>
      </div>
      <TypingBalloonsGame />
    </main>
  );
}
