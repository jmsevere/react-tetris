export const VERSION = '5.0.1';

export interface Coordinate {
  x: number;
  y: number;
}

// Normall game size for this game.
export const GAME_SIZE: Coordinate = { x: 10, y: 20 };

export interface LayoutMetrics {
  upcomingPreviewSize: number;
  spacing: {
    outside: number;
    inside: number;
    border: number;
  };
  relativeVerticalInfoPanelPadding: number;
}

export const LAYOUT_METRICS: LayoutMetrics = {
  upcomingPreviewSize: 5,
  spacing: { outside: 20, inside: 24, border: 1 },
  relativeVerticalInfoPanelPadding: 1.6,
};

// for keyboard inputs
export const KEYS = {
  start: 'Enter',
  cancel: 'Escape',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  down: 'ArrowDown',
  space: ' ',
  dropDown: ' ',
  rotate: 'ArrowUp',
  help: 'F1',
} as const;

// set the delay for rerenders of block drops.

export interface Delays {
  start: number;
  decrement: number;
  min: number;
}

export const DELAYS: Delays = {
  start: 0.7,
  decrement: 0.003,
  min: 0.1,
};

export const SCORE_RULES = {
  addOnDrop: (): number => 10,
  addOnRemovedLines: (lineCount: number): number =>
    100 * Math.pow(2, lineCount - 1),
} as const;

// Tetromino --------------------------------------

export type TetrominoColorKey = 'I' | 'O' | 'T' | 'J' | 'L' | 'S' | 'Z';

export const TETROMINO_COLORS: Record<TetrominoColorKey, string> = {
  I: 'orange',
  O: 'red',
  T: 'yellow',
  J: 'orchid',
  L: 'blue',
  S: 'lightskyblue',
  Z: 'lawngreen',
};

export class TetrominoShape {
  size: number;
  blocks: number[];
  shiftsX: number[];
  shiftsY: number[];
  colorIndex: TetrominoColorKey;
  color: string;

  constructor(
    size: number,
    blocks: number[],
    shiftsX: number[],
    shiftsY: number[],
    colorIndex: TetrominoColorKey
  ) {
    this.size = size;
    this.blocks = blocks;
    this.shiftsX = shiftsX;
    this.shiftsY = shiftsY;
    this.colorIndex = colorIndex;
    this.color = TETROMINO_COLORS[colorIndex];
  }
}

export const TETROMINO_SHAPES: TetrominoShape[] = [
  new TetrominoShape(
    4,
    [0x0f00, 0x2222, 0x00f0, 0x4444],
    [0, 2, 0, 1],
    [0, 4, 0, 4],
    'I'
  ),
  new TetrominoShape(
    3,
    [0x0e20, 0x44c0, 0x8e00, 0x6440],
    [2, 1, 0, 1],
    [2, 2, 2, 2],
    'J'
  ),
  new TetrominoShape(
    3,
    [0x0e80, 0xc440, 0x2e00, 0x4460],
    [0, 1, 2, 1],
    [2, 2, 2, 2],
    'L'
  ),
  new TetrominoShape(
    2,
    [0xcc00, 0xcc00, 0xcc00, 0xcc00],
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    'O'
  ),
  new TetrominoShape(
    3,
    [0x06c0, 0x8c40, 0x6c00, 0x4620],
    [1, 1, 1, 2],
    [2, 2, 2, 2],
    'S'
  ),
  new TetrominoShape(
    3,
    [0x0e40, 0x4c40, 0x4e00, 0x4640],
    [1, 1, 1, 1],
    [2, 2, 2, 2],
    'T'
  ),
  new TetrominoShape(
    3,
    [0x0c60, 0x4c80, 0xc600, 0x2640],
    [1, 0, 1, 1],
    [2, 2, 2, 2],
    'Z'
  ),
];

export enum GAME_STATES {
  CANCELLED = 0,
  PAUSED = 1,
  PLAYING = 2,
}

export enum ACTIONS {
  ROTATE_RIGHT = 0,
  ROTATE_LEFT = 1,
  RIGHT = 2,
  DOWN = 3,
  LEFT = 4,
  BOTTOM = 5,
}
