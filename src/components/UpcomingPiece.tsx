import { useRef, useEffect } from 'react';
import { LAYOUT_METRICS, GAME_STATES } from '../constants';
import { Tetromino } from '../utils';

interface UpcomingPieceProps {
  next: Tetromino | null;
  gameState: GAME_STATES;
  blockSize: number;
}

// Make a canvas for the next piece preview.
// ToDo: should I abstract the building of the Tetromino for both this and the game board?
export function UpcomingPiece({ next, gameState, blockSize }: UpcomingPieceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !next || gameState !== GAME_STATES.PLAYING) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = LAYOUT_METRICS.upcomingPreviewSize;
    const padding = (size - next.shape.size) / 2;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.translate(0.5, 0.5);
    ctx.clearRect(-1, -1, size * blockSize + 1, size * blockSize + 1);

    const adjustBrightness = (color: string, amount: number): string => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
      return `rgb(${Math.min(255, Math.max(0, r + amount))}, ${Math.min(255, Math.max(0, g + amount))}, ${Math.min(
        255,
        Math.max(0, b + amount),
      )})`;
    };

    next.all((x: number, y: number) => {
      const drawX = (x + padding - next.x) * blockSize;
      const drawY = (y + padding - next.y) * blockSize;
      const bevel = blockSize * 0.1;
      const color = next.shape.color;

      ctx.fillStyle = color;
      ctx.fillRect(drawX, drawY, blockSize, blockSize);

      const lighterColor = adjustBrightness(color, 40);
      const darkerColor = adjustBrightness(color, -40);

      ctx.fillStyle = lighterColor;
      ctx.beginPath();
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX + blockSize, drawY);
      ctx.lineTo(drawX + blockSize - bevel, drawY + bevel);
      ctx.lineTo(drawX + bevel, drawY + bevel);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX + bevel, drawY + bevel);
      ctx.lineTo(drawX + bevel, drawY + blockSize - bevel);
      ctx.lineTo(drawX, drawY + blockSize);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = darkerColor;
      ctx.beginPath();
      ctx.moveTo(drawX + blockSize, drawY);
      ctx.lineTo(drawX + blockSize, drawY + blockSize);
      ctx.lineTo(drawX + blockSize - bevel, drawY + blockSize - bevel);
      ctx.lineTo(drawX + blockSize - bevel, drawY + bevel);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(drawX, drawY + blockSize);
      ctx.lineTo(drawX + blockSize, drawY + blockSize);
      ctx.lineTo(drawX + blockSize - bevel, drawY + blockSize - bevel);
      ctx.lineTo(drawX + bevel, drawY + blockSize - bevel);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#000';
      ctx.strokeRect(drawX, drawY, blockSize, blockSize);
    });

    ctx.restore();
  }, [next, gameState, blockSize]);

  const size = LAYOUT_METRICS.upcomingPreviewSize * blockSize;

  return <canvas ref={canvasRef} width={size} height={size} className="next-piece-canvas" title="Next tetromino" />;
}
