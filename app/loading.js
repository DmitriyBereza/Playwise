import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.loader}>
      <div className={styles.dots}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
