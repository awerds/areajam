import React from 'react';
import { Composition } from 'remotion';
import { AreaJamPromo } from './AreaJamPromo';
import type { TimelineManifest } from './types';

const DEFAULT_TIMELINE: TimelineManifest = {
  title: 'AreaJam Preview',
  width: 1080,
  height: 1920,
  fps: 30,
  totalFrames: 180,
  musicFile: '',
  ctaUrl: 'areajam.com',
  ctaTagline: 'Find your tribe. Match with musicians today.',
  scenes: [
    {
      id: 'preview-endcard',
      badge: 'Preview Mode',
      headline: 'Find your tribe. Match with musicians today.',
      subline: 'Run npm run render to generate AI voiceover + screenshots',
      media: '',
      mediaType: 'endcard',
      motion: 'pulse',
      narration: '',
      audioFile: '',
      startFrame: 0,
      durationFrames: 180,
      durationSec: 6,
      words: [],
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AreaJamPromo"
      component={AreaJamPromo as unknown as React.ComponentType<Record<string, unknown>>}
      durationInFrames={DEFAULT_TIMELINE.totalFrames}
      fps={DEFAULT_TIMELINE.fps}
      width={DEFAULT_TIMELINE.width}
      height={DEFAULT_TIMELINE.height}
      defaultProps={DEFAULT_TIMELINE as unknown as Record<string, unknown>}
      calculateMetadata={({ props }) => {
        const manifest = props as unknown as TimelineManifest;
        return {
          durationInFrames: Math.max(30, manifest.totalFrames || DEFAULT_TIMELINE.totalFrames),
          fps: manifest.fps || 30,
          width: manifest.width || 1080,
          height: manifest.height || 1920,
        };
      }}
    />
  );
};
