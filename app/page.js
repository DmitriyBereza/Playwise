import Image from 'next/image';
import Link from 'next/link';
import { gamesCatalog } from '../games/catalog';
import styles from './portal.module.css';

export default function HomePage() {
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
          <Link href="/games">See all</Link>
        </div>
        <div className={styles.grid}>
          {gamesCatalog.map((game) => (
            <article key={game.slug} className={styles.card}>
              <span className={styles.badge}>{game.age}</span>
              <h3>{game.title}</h3>
              <p>{game.description}</p>
              <div className={styles.tags}>
                {game.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              <Link href={game.path} className={styles.playLink}>
                Open game
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
