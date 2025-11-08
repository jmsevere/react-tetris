import { GAME_STATES } from '../constants';
import StatsDisplay from '@/components/StatsDisplay/StatsDisplay';

interface GameInfoProps {
  score: number;
  rows: number;
  gameState: GAME_STATES;
}

export function GameInfo({ score, rows, gameState }: GameInfoProps) {
  const isPaused = gameState === GAME_STATES.PAUSED;
  const isPlaying = gameState === GAME_STATES.PLAYING;

  return (
    <div className="game-info">
      <div>
        <p style={{ textAlign: 'center' }}>
          {!isPlaying && (
            <>
              Press <span id="statusKeyName">Enter</span>
              <br />
              to <span>{isPaused ? 'continue' : 'start'}</span>
            </>
          )}
        </p>
        <br />
        {isPaused && <p style={{ textAlign: 'center' }}>Paused</p>}
      </div>
      <StatsDisplay score={score} rows={rows} />
    </div>
  );
}
