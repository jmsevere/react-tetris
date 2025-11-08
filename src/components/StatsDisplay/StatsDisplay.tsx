import React from 'react';
import styles from './StatsDisplay.module.css';

interface StatsDisplayProps {
  score: number | string;
  rows: number | string;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ score, rows }) => {
  return (
    <div className={styles.statsContainer}>
      <p className={styles.textCenter}>
        Score:{' '}
        <em className={`${styles.valueHighlight} ${styles.valueRed}`}>
          {score}
        </em>
      </p>

      <p className={styles.textCenter}>
        Lines:{' '}
        <em className={`${styles.valueHighlight} ${styles.valueGreen}`}>
          {rows}
        </em>
      </p>
    </div>
  );
};

export default StatsDisplay;
