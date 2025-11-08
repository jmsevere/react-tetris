import { useReducer, useCallback, useRef, MutableRefObject } from 'react';
import {
  GAME_SIZE,
  TETROMINO_SHAPES,
  TETROMINO_COLORS,
  DELAYS,
  SCORE_RULES,
  GAME_STATES,
  ACTIONS,
  TetrominoShape,
} from '../constants';
import { getRandomInt, Tetromino } from '../utils';

type Block = TetrominoShape | null;
type BlockGrid = (Block | undefined)[][];

export interface GameLogic {
  gameState: GAME_STATES;
  blocks: BlockGrid;
  current: Tetromino | null;
  next: Tetromino | null;
  score: number;
  rows: number;
  delay: number;
  startContinue: () => void;
  pause: () => void;
  cancel: () => void;
  move: (direction: ACTIONS) => boolean;
  rotate: (left: boolean) => void;
  drop: (updateScore: boolean) => boolean;
  dropDown: () => void;
  handle: (action: ACTIONS) => void;
  autoDrop: () => void;
  reset: () => void;
  queueRef: MutableRefObject<ACTIONS[]>;
  durationRef: MutableRefObject<number>;
}

// Shallow clone for BlockGrid
function cloneBlockGrid(grid: BlockGrid): BlockGrid {
  const newGrid: BlockGrid = [];
  for (let x = 0; x < grid.length; x++) {
    if (grid[x]) {
      newGrid[x] = [...grid[x]];
    }
  }
  return newGrid;
}

// Reducer for batched state updates
type GameState = {
  gameState: GAME_STATES;
  blocks: BlockGrid;
  current: Tetromino | null;
  next: Tetromino | null;
  score: number;
  rows: number;
  delay: number;
};

type GameAction =
  | { type: 'SET_GAME_STATE'; payload: GAME_STATES }
  | { type: 'SET_CURRENT'; payload: Tetromino | null }
  | { type: 'SET_NEXT'; payload: Tetromino | null }
  | { type: 'ADD_SCORE'; payload: number }
  | { type: 'PLACE_TETROMINO'; payload: { tetromino: Tetromino; removedLines: number } }
  | { type: 'SPAWN_NEXT_PIECE'; payload: { current: Tetromino | null; next: Tetromino } }
  | { type: 'RESET'; payload: { current: Tetromino; next: Tetromino } };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };

    case 'SET_CURRENT':
      return { ...state, current: action.payload };

    case 'SET_NEXT':
      return { ...state, next: action.payload };

    case 'ADD_SCORE':
      return { ...state, score: state.score + action.payload };

    case 'PLACE_TETROMINO': {
      const { tetromino, removedLines } = action.payload;
      const newBlocks = cloneBlockGrid(state.blocks);

      tetromino.all((x: number, y: number) => {
        newBlocks[x] ||= [];
        newBlocks[x][y] = tetromino.shape;
      });

      const { newBlocks: processedBlocks, removedLines: actualRemoved } = removeCompletedLines(newBlocks);

      const newRows = state.rows + actualRemoved;
      const newDelay = Math.max(DELAYS.min, DELAYS.start - DELAYS.decrement * newRows);
      const lineScore = actualRemoved > 0 ? SCORE_RULES.addOnRemovedLines(actualRemoved) : 0;

      return {
        ...state,
        blocks: processedBlocks,
        rows: newRows,
        delay: newDelay,
        score: state.score + lineScore,
      };
    }

    case 'SPAWN_NEXT_PIECE':
      return {
        ...state,
        current: action.payload.current,
        next: action.payload.next,
      };

    case 'RESET':
      return {
        gameState: GAME_STATES.CANCELLED,
        blocks: [],
        current: action.payload.current,
        next: action.payload.next,
        score: 0,
        rows: 0,
        delay: DELAYS.start,
      };

    default:
      return state;
  }
}

// Extract line removal logic to avoid duplication
function removeCompletedLines(blocks: BlockGrid): { newBlocks: BlockGrid; removedLines: number } {
  const newBlocks = blocks;
  let removedLines = 0;

  for (let y = GAME_SIZE.y - 1; y >= 0; --y) {
    let complete = true;
    for (let x = 0; x < GAME_SIZE.x; ++x) {
      if (!newBlocks[x]?.[y]) {
        complete = false;
        break;
      }
    }

    if (complete) {
      // Shift all lines down
      for (let yy = y; yy >= 0; --yy) {
        for (let x = 0; x < GAME_SIZE.x; ++x) {
          newBlocks[x] ||= [];
          newBlocks[x][yy] = yy === 0 ? null : newBlocks[x]?.[yy - 1] || null;
        }
      }
      y++; // Check this line again
      removedLines++;
    }
  }

  return { newBlocks, removedLines };
}

export function useGameLogic(): GameLogic {
  const [state, dispatch] = useReducer(gameReducer, {
    gameState: GAME_STATES.CANCELLED,
    blocks: [],
    current: null,
    next: null,
    score: 0,
    rows: 0,
    delay: DELAYS.start,
  });

  const queueRef = useRef<ACTIONS[]>([]);
  const durationRef = useRef<number>(0);

  const randomTetromino = useCallback((): Tetromino => {
    const chosen = TETROMINO_SHAPES[getRandomInt(0, TETROMINO_SHAPES.length - 1)];
    const color = TETROMINO_COLORS[chosen.colorIndex];
    return new Tetromino(chosen, getRandomInt(0, GAME_SIZE.x - chosen.size), 0, 0, color);
  }, []);

  const getBlock = useCallback(
    (x: number, y: number, blockArray: BlockGrid = state.blocks): Block => {
      return blockArray?.[x]?.[y] || null;
    },
    [state.blocks],
  );

  const willHitObstacle = useCallback(
    (tetromino: Tetromino, x0: number, y0: number, orientation: number): boolean => {
      return tetromino.first(
        x0,
        y0,
        orientation,
        (x: number, y: number) => {
          return x < 0 || x >= GAME_SIZE.x || y < 0 || y >= GAME_SIZE.y || !!getBlock(x, y);
        },
        true,
      );
    },
    [getBlock],
  );

  const move = useCallback(
    (direction: ACTIONS): boolean => {
      if (!state.current) return false;

      let x = state.current.x,
        y = state.current.y;
      switch (direction) {
        case ACTIONS.RIGHT:
          x++;
          break;
        case ACTIONS.LEFT:
          x--;
          break;
        case ACTIONS.DOWN:
          y++;
          break;
      }

      if (!willHitObstacle(state.current, x, y, state.current.orientation)) {
        const updated = new Tetromino(state.current.shape, x, y, state.current.orientation, state.current.shape.color);
        dispatch({ type: 'SET_CURRENT', payload: updated });
        return true;
      }
      return false;
    },
    [state.current, willHitObstacle],
  );

  const rotate = useCallback(
    (left: boolean): void => {
      if (!state.current) return;

      const newOrientation = left
        ? state.current.orientation === 0
          ? 3
          : state.current.orientation - 1
        : state.current.orientation === 3
        ? 0
        : state.current.orientation + 1;

      if (willHitObstacle(state.current, state.current.x, state.current.y, newOrientation)) return;

      const updated = new Tetromino(
        state.current.shape,
        state.current.x,
        state.current.y,
        newOrientation,
        state.current.shape.color,
      );
      dispatch({ type: 'SET_CURRENT', payload: updated });
    },
    [state.current, willHitObstacle],
  );

  const dropTetrominoAndRemoveLines = useCallback((): void => {
    if (!state.current) return;
    dispatch({ type: 'PLACE_TETROMINO', payload: { tetromino: state.current, removedLines: 0 } });
  }, [state.current]);

  const drop = useCallback(
    (updateScore: boolean): boolean => {
      if (!move(ACTIONS.DOWN)) {
        if (updateScore) {
          dispatch({ type: 'ADD_SCORE', payload: SCORE_RULES.addOnDrop() });
        }
        dropTetrominoAndRemoveLines();

        const newCurrent = state.next;
        const newNext = randomTetromino();

        dispatch({ type: 'SPAWN_NEXT_PIECE', payload: { current: newCurrent, next: newNext } });
        queueRef.current = [];

        if (newCurrent && willHitObstacle(newCurrent, newCurrent.x, newCurrent.y, newCurrent.orientation)) {
          dispatch({ type: 'SET_GAME_STATE', payload: GAME_STATES.CANCELLED });
          return false;
        }
        return true;
      }
      return false;
    },
    [move, dropTetrominoAndRemoveLines, state.next, randomTetromino, willHitObstacle],
  );

  const dropDown = useCallback((): void => {
    if (!state.current) return;

    // Memoize willHitObstacle results during calculation
    let newY = state.current.y;
    let canMove = true;
    while (canMove) {
      canMove = !willHitObstacle(state.current, state.current.x, newY + 1, state.current.orientation);
      if (canMove) newY++;
    }

    const droppedTetromino = new Tetromino(
      state.current.shape,
      state.current.x,
      newY,
      state.current.orientation,
      state.current.shape.color,
    );

    dispatch({ type: 'ADD_SCORE', payload: SCORE_RULES.addOnDrop() });
    dispatch({ type: 'PLACE_TETROMINO', payload: { tetromino: droppedTetromino, removedLines: 0 } });

    const newCurrent = state.next;
    const newNext = randomTetromino();

    dispatch({ type: 'SPAWN_NEXT_PIECE', payload: { current: newCurrent, next: newNext } });
    queueRef.current = [];

    if (newCurrent && willHitObstacle(newCurrent, newCurrent.x, newCurrent.y, newCurrent.orientation)) {
      dispatch({ type: 'SET_GAME_STATE', payload: GAME_STATES.CANCELLED });
    }
  }, [state.current, state.next, willHitObstacle, randomTetromino]);

  const reset = useCallback((): void => {
    durationRef.current = 0;
    queueRef.current = [];
    dispatch({
      type: 'RESET',
      payload: {
        current: randomTetromino(),
        next: randomTetromino(),
      },
    });
  }, [randomTetromino]);

  const startContinue = useCallback((): void => {
    if (state.gameState === GAME_STATES.CANCELLED) {
      reset();
    }
    dispatch({ type: 'SET_GAME_STATE', payload: GAME_STATES.PLAYING });
  }, [state.gameState, reset]);

  const pause = useCallback((): void => {
    dispatch({ type: 'SET_GAME_STATE', payload: GAME_STATES.PAUSED });
  }, []);

  const cancel = useCallback((): void => {
    dispatch({ type: 'SET_GAME_STATE', payload: GAME_STATES.CANCELLED });
  }, []);

  const handle = useCallback(
    (action: ACTIONS): void => {
      switch (action) {
        case ACTIONS.LEFT:
        case ACTIONS.RIGHT:
        case ACTIONS.DOWN:
          move(action);
          break;
        case ACTIONS.ROTATE_RIGHT:
          rotate(false);
          break;
        case ACTIONS.ROTATE_LEFT:
          rotate(true);
          break;
        case ACTIONS.BOTTOM:
          dropDown();
          break;
      }
    },
    [move, rotate, dropDown],
  );

  const autoDrop = useCallback((): void => {
    drop(true);
  }, [drop]);

  return {
    gameState: state.gameState,
    blocks: state.blocks,
    current: state.current,
    next: state.next,
    score: state.score,
    rows: state.rows,
    delay: state.delay,
    startContinue,
    pause,
    cancel,
    move,
    rotate,
    drop,
    dropDown,
    handle,
    autoDrop,
    reset,
    queueRef,
    durationRef,
  };
}
