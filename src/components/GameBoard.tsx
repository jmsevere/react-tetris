import { useRef, useEffect } from 'react';
import { GAME_SIZE, GAME_STATES } from '../constants';
import { Tetromino } from '../utils';

type Block = { color: string } | null;
type BlockGrid = (Block | undefined)[][];

interface GameBoardProps {
  blocks: BlockGrid;
  current: Tetromino | null;
  gameState: GAME_STATES;
  blockSize: number;
}

export function GameBoard({
  blocks,
  current,
  gameState,
  blockSize,
}: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.translate(0.5, 0.5);
    ctx.clearRect(-1, -1, canvas.width + 1, canvas.height + 1);

    const drawBlock = (x: number, y: number, color: string) => {
      const px = x * blockSize;
      const py = y * blockSize;
      const bevel = blockSize * 0.1;

      ctx.fillStyle = color;
      ctx.fillRect(px, py, blockSize, blockSize);

      // Kind of over kill but I wanted to have a beveled edge for a retro look.
      const lighterColor = adjustBrightness(color, 40);
      const darkerColor = adjustBrightness(color, -40);

      ctx.fillStyle = lighterColor;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + blockSize, py);
      ctx.lineTo(px + blockSize - bevel, py + bevel);
      ctx.lineTo(px + bevel, py + bevel);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + bevel, py + bevel);
      ctx.lineTo(px + bevel, py + blockSize - bevel);
      ctx.lineTo(px, py + blockSize);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = darkerColor;
      ctx.beginPath();
      ctx.moveTo(px + blockSize, py);
      ctx.lineTo(px + blockSize, py + blockSize);
      ctx.lineTo(px + blockSize - bevel, py + blockSize - bevel);
      ctx.lineTo(px + blockSize - bevel, py + bevel);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(px, py + blockSize);
      ctx.lineTo(px + blockSize, py + blockSize);
      ctx.lineTo(px + blockSize - bevel, py + blockSize - bevel);
      ctx.lineTo(px + bevel, py + blockSize - bevel);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#000';
      ctx.strokeRect(px, py, blockSize, blockSize);
    };

    const adjustBrightness = (color: string, amount: number): string => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
      return `rgb(${Math.min(255, Math.max(0, r + amount))}, ${Math.min(
        255,
        Math.max(0, g + amount)
      )}, ${Math.min(255, Math.max(0, b + amount))})`;
    };

    if (current && gameState === GAME_STATES.PLAYING) {
      current.all((x: number, y: number) => {
        drawBlock(x, y, current.shape.color);
      });
    }

    for (let y = 0; y < GAME_SIZE.y; y++) {
      for (let x = 0; x < GAME_SIZE.x; x++) {
        const block = blocks?.[x]?.[y];
        if (block) {
          drawBlock(x, y, block.color);
        }
      }
    }

    ctx.strokeRect(0, 0, canvas.width - 1, canvas.height - 1);
    ctx.restore();
  }, [blocks, current, gameState, blockSize]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_SIZE.x * blockSize}
      height={GAME_SIZE.y * blockSize}
      className="game-board"
    />
  );
}
