'use client';

import { useI18n } from '../lib/i18n/I18nProvider';
import styles from './localeSwitcher.module.css';

export default function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className={styles.wrap} role="group" aria-label="Language switcher">
      <button
        type="button"
        className={locale === 'uk' ? styles.active : ''}
        onClick={() => setLocale('uk')}
      >
        UA
      </button>
      <button
        type="button"
        className={locale === 'en' ? styles.active : ''}
        onClick={() => setLocale('en')}
      >
        EN
      </button>
    </div>
  );
}

