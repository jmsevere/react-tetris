import { TetrominoShape } from './constants';

// Random function
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class Tetromino {
  shape: TetrominoShape;
  x: number;
  y: number;
  orientation: number;

  constructor(
    shape: TetrominoShape,
    x: number,
    y: number,
    orientation: number,
    color: string
  ) {
    this.shape = shape;
    this.shape.color = color;
    this.x = x;
    this.y = y;
    this.orientation = orientation;
  }

  first(
    x0: number,
    y0: number,
    orientation: number,
    fn: (x: number, y: number) => boolean | void,
    doBreak: boolean
  ): boolean {
    const blocks = this.shape.blocks[orientation];
    let bit = 0x8000;
    let row = 0;
    let col = 0;

    // Unroll the loop logic - process all 16 bits
    while (bit > 0) {
      if (blocks & bit) {
        if (fn(x0 + col, y0 + row) && doBreak) {
          return true;
        }
      }
      bit >>= 1;
      if (++col === 4) {
        col = 0;
        ++row;
      }
    }
    return false;
  }

  all(fn: (x: number, y: number) => void): void {
    this.first(this.x, this.y, this.orientation, fn, false);
  }
}
