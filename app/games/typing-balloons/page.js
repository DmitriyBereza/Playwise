import Link from 'next/link';
import TypingBalloonsGame from '../../../games/typing-balloons/TypingBalloonsGame';
import styles from '../../portal.module.css';

export default function TypingBalloonsPage() {
  return (
    <main className={styles.gamePage}>
      <div className={styles.gameBack}>
        <Link href="/">Back to Playwise</Link>
      </div>
      <TypingBalloonsGame />
    </main>
  );
}
