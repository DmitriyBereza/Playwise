import Image from 'next/image';
import Link from 'next/link';
import { gamesCatalog } from '../../games/catalog';
import styles from '../portal.module.css';

export default function GamesPage() {
  return (
    <main className={styles.portal}>
      <section className={styles.sectionHead}>
        <h1>All Games</h1>
        <Link href="/">Back to portal</Link>
      </section>
      <div className={styles.grid}>
        {gamesCatalog.map((game) => (
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
      </div>
    </main>
  );
}
