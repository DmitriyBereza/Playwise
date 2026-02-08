'use client';

import { useMemo } from 'react';
import { useI18n } from '../lib/i18n/I18nProvider';
import styles from './kidWordInput.module.css';

const KEYBOARD_ROWS = {
  uk: [
    ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ґ', 'Ш', 'Щ', 'З', 'Х', 'Ї'],
    ['Ф', 'І', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Є'],
    ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю'],
  ],
  en: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ],
};

export default function KidWordInput({
  value,
  onChange,
  onSubmit,
  disabled,
  maxLength = 40,
}) {
  const { locale, t } = useI18n();
  const rows = useMemo(() => KEYBOARD_ROWS[locale] || KEYBOARD_ROWS.uk, [locale]);

  const appendChar = (char) => onChange(`${value}${char}`);
  const backspace = () => onChange(value.slice(0, -1));
  const addSpace = () => onChange(value.endsWith(' ') || value.length === 0 ? value : `${value} `);
  const clear = () => onChange('');

  return (
    <>
      <label htmlFor="kid-input">{t('kidInput.label')}</label>
      <div className={styles.inputRow}>
        <textarea
          id="kid-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('kidInput.placeholder')}
          rows={3}
          maxLength={maxLength}
          disabled={disabled}
        />
        <button type="button" className={styles.sendBtn} onClick={onSubmit} disabled={disabled}>
          {t('kidInput.send')}
        </button>
      </div>

      <div className={styles.keyboardWrap}>
        <p>{t('kidInput.keyboardTitle')}</p>
        {rows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className={styles.keyboardRow}>
            {row.map((key) => (
              <button
                type="button"
                key={key}
                className={styles.keyBtn}
                disabled={disabled}
                onClick={() => appendChar(key)}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
        <div className={`${styles.keyboardRow} ${styles.keyboardTools}`}>
          <button type="button" className={`${styles.keyBtn} ${styles.tool}`} disabled={disabled} onClick={addSpace}>
            {t('kidInput.space')}
          </button>
          <button
            type="button"
            className={`${styles.keyBtn} ${styles.tool}`}
            disabled={disabled}
            onClick={backspace}
          >
            {t('kidInput.erase')}
          </button>
          <button type="button" className={`${styles.keyBtn} ${styles.tool}`} disabled={disabled} onClick={clear}>
            {t('kidInput.clear')}
          </button>
        </div>
      </div>
    </>
  );
}

