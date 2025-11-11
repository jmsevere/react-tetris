import { useEffect, useRef, useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { UpcomingPiece } from './components/UpcomingPiece';
import { GameInfo } from './components/GameInfo';
import { KEYS, ACTIONS, GAME_STATES } from './constants';
import { useGameLogic } from './hooks/useGameLogic';

import './App.css';

function App() {
  const [blockSize, setBlockSize] = useState<number>(30);
  const {
    gameState,
    blocks,
    current,
    next,
    score,
    rows,
    delay,
    startContinue,
    pause,
    cancel,
    handle,
    autoDrop,
    queueRef,
    durationRef,
  } = useGameLogic();

  const prevTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const verticalSize = window.innerHeight - 160;
      const newBlockSize = Math.floor(verticalSize / 20);
      setBlockSize(newBlockSize);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameState === GAME_STATES.PLAYING) {
        let handled = false;

        switch (event.key) {
          case KEYS.left:
            queueRef.current.push(ACTIONS.LEFT);
            handled = true;
            break;
          case KEYS.right:
            queueRef.current.push(ACTIONS.RIGHT);
            handled = true;
            break;
          case KEYS.rotate:
            queueRef.current.push(event.ctrlKey ? ACTIONS.ROTATE_LEFT : ACTIONS.ROTATE_RIGHT);
            handled = true;
            break;
          case KEYS.down:
            queueRef.current.push(ACTIONS.DOWN);
            handled = true;
            break;
          case KEYS.dropDown:
            event.preventDefault();
            queueRef.current.push(ACTIONS.BOTTOM);
            handled = true;
            break;
          case KEYS.cancel:
            cancel();
            handled = true;
            break;
          case KEYS.start:
            pause();
            handled = true;
            break;
        }
        if (handled) event.preventDefault();
      } else if (event.key === KEYS.start) {
        startContinue();
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, startContinue, pause, queueRef]);

  // Defines and manages an animation/game loop (the tick)
  // Using requestAnimationFrame.

  useEffect(() => {
    let animationId: number;
    prevTimeRef.current = null; // ← CRITICAL: Reset on every effect restart

    const frame = (timestamp: number) => {
      if (gameState === GAME_STATES.PLAYING) {
        if (prevTimeRef.current !== null) {
          const deltaTime = (timestamp - prevTimeRef.current) / 1000;

          const action = queueRef.current.shift();
          if (action !== undefined) {
            try {
              handle(action);
            } catch (error) {
              console.error('Error handling action:', error);
            }
          }

          durationRef.current += deltaTime;
          if (durationRef.current > delay) {
            durationRef.current -= delay;
            try {
              autoDrop();
            } catch (error) {
              console.error('Error handling auto-drop:', error);
            }
          }
        }
        prevTimeRef.current = timestamp;
        animationId = requestAnimationFrame(frame);
      }
    };

    if (gameState === GAME_STATES.PLAYING) {
      animationId = requestAnimationFrame(frame);
    }

    return () => cancelAnimationFrame(animationId);
  }, [gameState, delay, autoDrop]);
  // took these out to help solve bug using useEffect with these dependencies
  // }, [gameState, delay, handle, autoDrop, queueRef, durationRef]);

  const handleClick = () => {
    if (gameState === GAME_STATES.PLAYING) {
      pause();
    } else {
      startContinue();
    }
  };
  return (
    <div className="app">
      <div className="room237">
        <main>
          <div className="game" onClick={handleClick}>
            <div className="left">
              <div className="next-piece">
                <UpcomingPiece next={next} gameState={gameState} blockSize={blockSize} />
              </div>
              <GameInfo score={score} rows={rows} gameState={gameState} />
            </div>
            <div className="right">
              <GameBoard blocks={blocks} current={current} gameState={gameState} blockSize={blockSize} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
