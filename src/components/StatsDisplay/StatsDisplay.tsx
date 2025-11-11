import React from 'react';
import styles from './StatsDisplay.module.css';

interface StatsDisplayProps {
  score: number | string;
  rows: number | string;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ score, rows }) => {
  // let calculatedValue = (delay as number) * 100;
  // let displayDelay = parseFloat(calculatedValue.toFixed(1));
  return (
    <div className={styles.statsContainer}>
      <p className={styles.textCenter}>
        Score: <em className={`${styles.valueHighlight} ${styles.valueRed}`}>{score}</em>
      </p>

      <p className={styles.textCenter}>
        Lines: <em className={`${styles.valueHighlight} ${styles.valueGreen}`}>{rows}</em>
      </p>
    </div>
  );
};

export default StatsDisplay;
