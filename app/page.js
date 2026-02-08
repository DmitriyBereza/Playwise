'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import LocaleSwitcher from '../components/LocaleSwitcher';
import { gamesCatalog } from '../games/catalog';
import { useI18n } from '../lib/i18n/I18nProvider';
import styles from './portal.module.css';

export default function HomePage() {
  const { t } = useI18n();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedAges, setSelectedAges] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const allAges = useMemo(
    () => Array.from(new Set(gamesCatalog.map((game) => game.ageGroup))),
    [t]
  );
  const allTags = useMemo(
    () => Array.from(new Set(gamesCatalog.flatMap((game) => game.skills))),
    [t]
  );

  const filteredGames = useMemo(() => {
    return gamesCatalog.filter((game) => {
      const ageMatch = selectedAges.length === 0 || selectedAges.includes(game.ageGroup);
      const tagMatch =
        selectedTags.length === 0 || selectedTags.some((tag) => game.skills.includes(tag));
      return ageMatch && tagMatch;
    });
  }, [selectedAges, selectedTags]);

  const toggleListItem = (item, setter) => {
    setter((prev) => (prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item]));
  };

  return (
    <main className={styles.portal}>
      <section className={styles.hero}>
        <div className={styles.brand}>
          <Image
            src="/playwise-logo.svg"
            alt="Playwise logo"
            width={104}
            height={104}
            priority
          />
          <div>
            <p className={styles.kicker}>{t('portal.kicker')}</p>
            <h1>{t('portal.title')}</h1>
            <p>{t('portal.subtitle')}</p>
          </div>
        </div>
        <LocaleSwitcher />
        <div className={styles.heroNote}>
          <p>{t('portal.note')}</p>
        </div>
      </section>

      <section>
        <div className={styles.sectionHead}>
          <h2>{t('portal.games')}</h2>
          <div className={styles.filterWrap}>
            <button type="button" className={styles.filterToggle} onClick={() => setIsFilterOpen((prev) => !prev)}>
              {t('portal.filter')}
            </button>
            {isFilterOpen && (
              <div className={styles.filterPanel}>
                <p>{t('portal.age')}</p>
                <div className={styles.filterOptions}>
                  {allAges.map((age) => (
                    <label key={age}>
                      <input
                        type="checkbox"
                        checked={selectedAges.includes(age)}
                        onChange={() => toggleListItem(age, setSelectedAges)}
                      />
                      <span>{t(`ages.${age}`)}</span>
                    </label>
                  ))}
                </div>
                <p>{t('portal.tags')}</p>
                <div className={styles.filterOptions}>
                  {allTags.map((tag) => (
                    <label key={tag}>
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleListItem(tag, setSelectedTags)}
                      />
                      <span>{t(tag)}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.clearFilters}
                  onClick={() => {
                    setSelectedAges([]);
                    setSelectedTags([]);
                  }}
                >
                  {t('common.clearFilters')}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className={styles.grid}>
          {filteredGames.map((game) => (
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
                <span className={styles.badge}>{t(game.ageKey)}</span>
                <div className={styles.tagsTopRight}>
                  {game.skills.map((skill) => (
                    <span key={skill}>{t(skill)}</span>
                  ))}
                </div>
                <h3>{t(game.titleKey)}</h3>
                <p>{t(game.descriptionKey)}</p>
                <Link href={game.path} className={styles.playLink}>
                  {t('common.openGame')}
                </Link>
              </div>
            </article>
          ))}
          {filteredGames.length === 0 && <p className={styles.empty}>{t('common.noGamesMatch')}</p>}
        </div>
      </section>
    </main>
  );
}
