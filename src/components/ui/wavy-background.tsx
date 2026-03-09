'use client';

import { cn } from '@/lib/utils';
import React, {
  useEffect, useMemo, useRef
} from 'react';
import { createNoise3D } from 'simplex-noise';

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = 'fast',
  waveOpacity = 0.5,
  waveYOffset = 0.5,
  ...props
}: {
  children?: React.ReactNode
  className?: string
  containerClassName?: string
  colors?: string[]
  waveWidth?: number
  backgroundFill?: string
  blur?: number
  speed?: 'slow' | 'fast'
  waveOpacity?: number
  waveYOffset?: number
  [key: string]: unknown
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const speedValue = speed === 'fast' ? 0.002 : 0.001;

  const waveColors = useMemo(
    () => colors ?? [
      '#38bdf8',
      '#818cf8',
      '#c084fc',
      '#e879f9',
      '#22d3ee',
    ],
    [colors]
  );
  useEffect(() => {
    const noise = createNoise3D();
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const context = canvasEl.getContext('2d');
    if (!context) return;

    let width = context.canvas.width = window.innerWidth;
    let height = context.canvas.height = window.innerHeight;
    let noiseTime = 0;
    let animationId = 0;

    const resolveBackgroundFill = () => {
      if (!backgroundFill) {
        return 'black';
      }

      const cssVariableMatch = /^var\((--[^)]+)\)$/.exec(backgroundFill);
      if (!cssVariableMatch) {
        return backgroundFill;
      }

      const cssVariableValue = getComputedStyle(document.documentElement)
        .getPropertyValue(cssVariableMatch[1])
        .trim();

      return cssVariableValue || 'black';
    };

    const handleResize = () => {
      width = context.canvas.width = window.innerWidth;
      height = context.canvas.height = window.innerHeight;
      context.filter = `blur(${blur}px)`;
    };

    const drawWave = (waveCount: number) => {
      noiseTime += speedValue;
      for (let waveIndex = 0; waveIndex < waveCount; waveIndex++) {
        context.beginPath();
        context.lineWidth = waveWidth || 50;
        context.strokeStyle = waveColors[waveIndex % waveColors.length];
        for (let x = 0; x < width; x += 5) {
          const y = noise(x / 800, 0.3 * waveIndex, noiseTime) * 100;
          context.lineTo(x, y + waveYOffset);
        }
        context.stroke();
        context.closePath();
      }
    };

    const render = () => {
      context.fillStyle = resolveBackgroundFill();
      context.globalAlpha = waveOpacity || 0.5;
      context.fillRect(0, 0, width, height);
      drawWave(5);
      animationId = requestAnimationFrame(render);
    };

    context.filter = `blur(${blur}px)`;
    window.addEventListener('resize', handleResize);
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [backgroundFill, blur, speedValue, waveColors, waveOpacity, waveWidth, waveYOffset]);

  const isSafari = typeof navigator !== 'undefined'
    && navigator.userAgent.includes('Safari')
    && !navigator.userAgent.includes('Chrome');

  return (
    <div
      className={cn(
        'flex h-screen flex-col items-center justify-center',
        containerClassName,
      )}
    >
      <canvas
        className="absolute inset-0 z-0"
        ref={canvasRef}
        id="canvas"
        style={{
          ...(isSafari ? { filter: `blur(${blur}px)` } : {}),
        }}
      >
      </canvas>
      <div className={cn('relative z-10', className)} {...props}>
        {children}
      </div>
    </div>
  );
};
