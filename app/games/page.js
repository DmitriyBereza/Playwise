'use client';

import Image from 'next/image';
import Link from 'next/link';
import LocaleSwitcher from '../../components/LocaleSwitcher';
import { gamesCatalog } from '../../games/catalog';
import { useI18n } from '../../lib/i18n/I18nProvider';
import styles from '../portal.module.css';

export default function GamesPage() {
  const { t } = useI18n();

  return (
    <main className={styles.portal}>
      <section className={styles.sectionHead}>
        <h1>{t('common.allGames')}</h1>
        <div className={styles.headActions}>
          <LocaleSwitcher />
          <Link href="/">{t('common.backToPortal')}</Link>
        </div>
      </section>
      <div className={styles.grid}>
        {gamesCatalog.map((game) => (
          <article key={game.slug} className={styles.card}>
            <div className={styles.cardPreview}>
              <Image
                src={game.image}
                alt={`${t(game.titleKey)} preview`}
                fill
                className={styles.previewImage}
                sizes="220px"
              />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.metaRow}>
                <span className={styles.badge}>{t(game.ageKey)}</span>
                <div className={styles.tagsTopRight}>
                  {game.skills.map((skill) => (
                    <span key={skill}>{t(skill)}</span>
                  ))}
                </div>
              </div>
              <h3>{t(game.titleKey)}</h3>
              <p>{t(game.descriptionKey)}</p>
              <Link href={game.path} className={styles.playLink}>
                {t('common.openGame')}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
