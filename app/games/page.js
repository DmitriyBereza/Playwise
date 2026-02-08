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
    </main>
  );
}
