'use client';

import {
  useCallback, useEffect, useRef, useState
} from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseWaveSurferOptions {
  url?: string
  onReady?: () => void
  onError?: (error: Error) => void
}

// interface UseWaveSurferReturn {
//   containerRef: React.RefObject<HTMLDivElement | null>
//   isPlaying: boolean
//   isReady: boolean
//   currentTime: number
//   duration: number
//   togglePlayPause: () => void
//   seekForward: (seconds?: number) => void
//   seekBackward: (seconds?: number) => void
// };

export function useWaveSurfer({
  url,
  onReady,
  onError,
}: UseWaveSurferOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const isMobile = useIsMobile();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    let destroyed = false;

    // Canvas can't resolve var(), so read the theme tokens at creation time.
    // ponytail: colors don't update on a live theme switch until the next remount
    const styles = getComputedStyle(containerRef.current);
    const primary = styles.getPropertyValue('--primary');

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: styles.getPropertyValue('--muted-foreground'),
      progressColor: primary,
      cursorColor: primary,
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      barMinHeight: 4,
      height: 'auto',
      normalize: true,
    });

    wavesurferRef.current = ws;

    ws.on('ready', () => {
      setIsReady(true);
      setDuration(ws.getDuration());
      onReady?.();
    });

    ws.on('play', () => {
      setIsPlaying(true);
    });
    ws.on('pause', () => {
      setIsPlaying(false);
    });
    ws.on('finish', () => {
      setIsPlaying(false);
    });
    ws.on('timeupdate', (time) => {
      setCurrentTime(time);
    });

    ws.on('error', (error) => {
      if (destroyed) return;
      console.error('WaveSurfer error:', error);
      onError?.(new Error(String(error)));
    });

    ws.load(url).catch((error: unknown) => {
      if (destroyed) return;
      console.error('WaveSurfer load error:', error);
      onError?.(new Error(String(error)));
    });

    return () => {
      destroyed = true;
      ws.destroy();
    };
  }, [url, onReady, onError, isMobile]);

  const togglePlayPause = useCallback(() => {
    void wavesurferRef.current?.playPause();
  }, []);

  const seekForward = useCallback((seconds = 5) => {
    const ws = wavesurferRef.current;
    if (!ws) return;

    const newTime = Math.min(ws.getCurrentTime() + seconds, ws.getDuration());
    ws.seekTo(newTime / ws.getDuration());
  }, []);

  const seekBackward = useCallback((seconds = 5) => {
    const ws = wavesurferRef.current;
    if (!ws) return;

    const newTime = Math.max(ws.getCurrentTime() - seconds, 0);
    ws.seekTo(newTime / ws.getDuration());
  }, []);


  return {
    containerRef,
    isPlaying,
    isReady,
    currentTime,
    duration,
    togglePlayPause,
    seekForward,
    seekBackward,
  };
};
