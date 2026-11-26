import React from 'react';
import { spring, useCurrentFrame } from 'remotion';
import type { WordTiming } from './types';

interface CaptionOverlayProps {
  words: WordTiming[];
  fps: number;
  isPortrait: boolean;
}

interface WordChunk {
  words: WordTiming[];
  startMs: number;
  endMs: number;
}

function buildChunks(words: WordTiming[], maxWordsPerChunk = 4): WordChunk[] {
  const chunks: WordChunk[] = [];
  for (let i = 0; i < words.length; i += maxWordsPerChunk) {
    const slice = words.slice(i, i + maxWordsPerChunk);
    if (slice.length === 0) continue;
    chunks.push({
      words: slice,
      startMs: slice[0].startMs,
      endMs: slice[slice.length - 1].endMs,
    });
  }
  return chunks;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({ words, fps, isPortrait }) => {
  const frame = useCurrentFrame();
  if (!words || words.length === 0) return null;

  const currentMs = (frame / fps) * 1000;
  const chunks = buildChunks(words, isPortrait ? 4 : 6);

  let activeChunk = chunks.find(
    (c, idx) =>
      currentMs >= c.startMs - 80 &&
      (currentMs <= c.endMs + 220 || idx === chunks.length - 1)
  );
  if (!activeChunk && currentMs < chunks[0].startMs) {
    activeChunk = chunks[0];
  }
  if (!activeChunk) return null;

  const popScale = spring({
    frame: Math.max(0, Math.round(((currentMs - activeChunk.startMs) / 1000) * fps)),
    fps,
    config: { damping: 16, stiffness: 220 },
    from: 0.94,
    to: 1,
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: isPortrait ? 132 : 52,
        display: 'flex',
        justifyContent: 'center',
        paddingInline: isPortrait ? 44 : 110,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <div
        style={{
          transform: `scale(${popScale})`,
          display: 'inline-flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: isPortrait ? '8px 10px' : '8px 12px',
          padding: isPortrait ? '14px 24px' : '12px 26px',
          borderRadius: 24,
          backgroundColor: 'rgba(10, 12, 20, 0.84)',
          border: '1px solid rgba(246, 244, 239, 0.16)',
          boxShadow: '0 18px 42px rgba(0, 0, 0, 0.52)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {(() => {
          let activeWordIdx = -1;
          for (let i = activeChunk.words.length - 1; i >= 0; i -= 1) {
            const w = activeChunk.words[i];
            if (currentMs >= w.startMs - 20 && currentMs <= w.endMs + 80) {
              activeWordIdx = i;
              break;
            }
          }
          return activeChunk.words.map((item, idx) => {
            const isActive = idx === activeWordIdx;
            const isSpoken = currentMs > item.endMs + 80 || idx < activeWordIdx;
            return (
              <span
                key={`${item.startMs}-${idx}`}
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Avenir Next', 'SF Pro Display', system-ui, sans-serif",
                  fontSize: isPortrait ? 42 : 34,
                  fontWeight: 800,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  padding: isActive ? '2px 10px' : '2px 2px',
                  borderRadius: 10,
                  backgroundColor: isActive ? '#d91b4c' : 'transparent',
                  color: isActive ? '#ffffff' : isSpoken ? '#f6f4ef' : 'rgba(246, 244, 239, 0.78)',
                  textShadow: isActive ? 'none' : '0 2px 12px rgba(0, 0, 0, 0.75)',
                }}
              >
                {item.word}
              </span>
            );
          });
        })()}
      </div>
    </div>
  );
};
