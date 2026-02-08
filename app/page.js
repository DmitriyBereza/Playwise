'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { gamesCatalog } from '../games/catalog';
import styles from './portal.module.css';

export default function HomePage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedAges, setSelectedAges] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const allAges = useMemo(
    () => Array.from(new Set(gamesCatalog.map((game) => game.ageGroup))),
    []
  );
  const allTags = useMemo(
    () => Array.from(new Set(gamesCatalog.flatMap((game) => game.skills))),
    []
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
            <p className={styles.kicker}>Playwise</p>
            <h1>Kid Games Portal</h1>
            <p>
              Calm online games for ages 3+ focused on general development and early computer
              skills.
            </p>
          </div>
        </div>
        <div className={styles.heroNote}>
          <p>Soft pastel UI, simple interactions, steady learning rhythm.</p>
        </div>
      </section>

      <section>
        <div className={styles.sectionHead}>
          <h2>Games</h2>
          <div className={styles.filterWrap}>
            <button type="button" className={styles.filterToggle} onClick={() => setIsFilterOpen((prev) => !prev)}>
              Filter
            </button>
            {isFilterOpen && (
              <div className={styles.filterPanel}>
                <p>Age</p>
                <div className={styles.filterOptions}>
                  {allAges.map((age) => (
                    <label key={age}>
                      <input
                        type="checkbox"
                        checked={selectedAges.includes(age)}
                        onChange={() => toggleListItem(age, setSelectedAges)}
                      />
                      <span>{age}</span>
                    </label>
                  ))}
                </div>
                <p>Tags</p>
                <div className={styles.filterOptions}>
                  {allTags.map((tag) => (
                    <label key={tag}>
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleListItem(tag, setSelectedTags)}
                      />
                      <span>{tag}</span>
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
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
        <div className={styles.grid}>
          {filteredGames.map((game) => (
            <article key={game.slug} className={styles.card}>
              <div className={styles.cardPreview}>
                <Image src={game.image} alt={`${game.title} preview`} fill sizes="(max-width: 700px) 100vw, 32vw" />
              </div>
              <div className={styles.cardBody}>
                <span className={styles.badge}>{game.age}</span>
                <div className={styles.tagsTopRight}>
                  {game.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
                <h3>{game.title}</h3>
                <p>{game.description}</p>
                <Link href={game.path} className={styles.playLink}>
                  Open game
                </Link>
              </div>
            </article>
          ))}
          {filteredGames.length === 0 && <p className={styles.empty}>No games match selected filters.</p>}
        </div>
      </section>
    </main>
  );
}
