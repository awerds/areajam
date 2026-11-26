import React from 'react';
import {
  Audio,
  Img,
  Loop,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { SceneSpec, WordTiming } from './types';

interface SwipeHandDemoProps {
  primaryMedia: string;
  chromeMedia?: string;
  secondaryMedia: string;
  midMedia?: string;
  primaryVideo?: string;
  midVideo?: string;
  secondaryVideo?: string;
  primaryAudio?: string;
  midAudio?: string;
  secondaryAudio?: string;
  words?: WordTiming[];
  durationFrames?: number;
  hasGlobalMusic?: boolean;
  bridgeToNext?: boolean;
  bridgeFromPrev?: boolean;
  bridgeStartFrom?: number;
  isPortrait: boolean;
  mode?: 'single-right' | 'full-demo';
}

const CARD_CLIP = 'inset(8.9% 3.1% 18.8% 3.1% round 24px)';

/** Ensure interpolation input knots stay strictly increasing even on tight TTS timings. */
function monotonicRange(knots: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < knots.length; i += 1) {
    out.push(i === 0 ? knots[i] : Math.max(out[i - 1] + 1, knots[i]));
  }
  return out;
}

/** Find the start frame of the first spoken word matching any target token. */
function findWordFrame(
  words: WordTiming[] | undefined,
  targets: string[],
  fallbackFrame: number,
  fps: number
): number {
  if (!words || words.length === 0) return fallbackFrame;
  const normTargets = targets.map((t) => t.toLowerCase());
  const hit = words.find((w) => {
    const clean = w.word.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normTargets.some((t) => clean === t || clean.includes(t));
  });
  return hit ? Math.max(0, Math.round((hit.startMs / 1000) * fps)) : fallbackFrame;
}

/** Frame within the opening hook scene where global rock music ducks into the revealed player clip. */
export function getHookClipEntryFrame(words: WordTiming[] | undefined, fps: number): number {
  const jamStart = Math.max(10, findWordFrame(words, ['tinder'], 18, fps) - 2);
  const jamEnd = jamStart + 44;
  const audioStart = findWordFrame(words, ['hearing', 'real', 'players', 'card'], 102, fps);
  return Math.max(jamEnd + 4, audioStart - 16);
}

/** Local frame inside the opening hook scene when Card 2 becomes visible (when Card 1 begins swiping right). */
export function getHookCard2VideoStart(words: WordTiming[] | undefined, fps: number): number {
  return Math.max(10, findWordFrame(words, ['tinder'], 18, fps) - 2);
}

/** Local frame inside the opening hook scene when Card 2 audio takes over cleanly from backing music. */
export function getHookCard2AudioStart(
  words: WordTiming[] | undefined,
  fps: number,
  hasGlobalMusic: boolean
): number {
  const jamStart = getHookCard2VideoStart(words, fps);
  return Math.max(0, hasGlobalMusic ? getHookClipEntryFrame(words, fps) - 2 : jamStart + 6);
}

/** Composition-global [startFrame, endFrame] during which card clip audio takes over from global music. */
export function getSwipeClipAudioWindow(
  scene: Pick<
    SceneSpec,
    'id' | 'mediaType' | 'startFrame' | 'durationFrames' | 'words' | 'primaryAudio' | 'midAudio' | 'secondaryAudio'
  >,
  fps: number,
  hasGlobalMusic: boolean
): [number, number] | null {
  if (
    scene.mediaType !== 'phone-swipe' ||
    !(scene.primaryAudio || scene.midAudio || scene.secondaryAudio)
  ) {
    return null;
  }
  if (scene.id === 'hook' && hasGlobalMusic) {
    return [scene.startFrame + getHookClipEntryFrame(scene.words, fps), scene.startFrame + scene.durationFrames];
  }
  return [scene.startFrame, scene.startFrame + scene.durationFrames];
}

interface CardContentProps {
  media: string;
  video?: string;
  videoStartFrom?: number;
  videoMountFrom?: number;
  progressPct: number;
  audioActive: boolean;
  isPortrait: boolean;
  frame: number;
}

/** Renders a clipped AreaJam swipe card with an optional live looping performance clip & equalizer pill. */
const CardContent: React.FC<CardContentProps> = ({
  media,
  video,
  videoStartFrom = 0,
  videoMountFrom = 0,
  progressPct,
  audioActive,
  isPortrait,
  frame,
}) => {
  const barHeights = [0, 1, 2, 3].map((i) =>
    audioActive ? 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.38 + i * 1.15)) : 0.25
  );
  const safeStartFrom = Math.max(0, Math.round(videoStartFrom) % 236);
  const loopDuration = Math.max(48, 236 - safeStartFrom);

  const videoLayer = video ? (
    <div
      style={{
        position: 'absolute',
        top: '8.9%',
        bottom: '18.8%',
        left: '3.1%',
        right: '3.1%',
        overflow: 'hidden',
        borderRadius: 24,
        maskImage: 'linear-gradient(180deg, #000 0%, #000 60%, rgba(0,0,0,0.45) 71%, transparent 80%)',
        WebkitMaskImage:
          'linear-gradient(180deg, #000 0%, #000 60%, rgba(0,0,0,0.45) 71%, transparent 80%)',
      }}
    >
      <Loop durationInFrames={loopDuration}>
        <OffthreadVideo
          src={staticFile(video)}
          startFrom={safeStartFrom}
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 25%',
          }}
        />
      </Loop>
      {/* Subtle top vignette matching AreaJam player header readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(16,19,29,0.34) 0%, rgba(16,19,29,0) 14%, rgba(16,19,29,0) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ) : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', clipPath: CARD_CLIP }}>
      <Img
        src={staticFile(media)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {videoLayer
        ? videoMountFrom > 0
          ? (
            <Sequence from={Math.max(0, Math.round(videoMountFrom))} layout="none">
              {videoLayer}
            </Sequence>
          )
          : videoLayer
        : null}

      {/* Animated clip progress bar at top of live video cards */}
      {video ? (
        <div
          style={{
            position: 'absolute',
            top: '10.9%',
            left: '6.8%',
            right: '6.8%',
            height: isPortrait ? 4 : 3,
            borderRadius: 99,
            backgroundColor: 'rgba(255,255,255,0.22)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Math.max(8, progressPct))}%`,
              height: '100%',
              borderRadius: 99,
              background: 'linear-gradient(90deg, #d91b4c, #ff6b8b)',
            }}
          />
        </div>
      ) : null}

      {/* Live audio equalizer badge in top-right card corner when hearing clips */}
      {audioActive && (
        <div
          style={{
            position: 'absolute',
            top: '14.5%',
            right: '7.5%',
            display: 'inline-flex',
            alignItems: 'center',
            gap: isPortrait ? 8 : 5,
            padding: isPortrait ? '8px 14px' : '5px 10px',
            borderRadius: 999,
            backgroundColor: 'rgba(16, 19, 29, 0.86)',
            border: '1.5px solid rgba(255, 77, 121, 0.8)',
            boxShadow: '0 8px 22px rgba(217, 27, 76, 0.38)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: isPortrait ? 3 : 2,
              height: isPortrait ? 16 : 11,
            }}
          >
            {barHeights.map((h, idx) => (
              <div
                key={idx}
                style={{
                  width: isPortrait ? 3.5 : 2.5,
                  height: `${Math.round(h * 100)}%`,
                  borderRadius: 99,
                  backgroundColor: '#ff4d79',
                }}
              />
            ))}
          </div>
          <span
            style={{
              color: '#ffffff',
              fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
              fontSize: isPortrait ? 15 : 10,
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            Live audio
          </span>
        </div>
      )}
    </div>
  );
};

export const SwipeHandDemo: React.FC<SwipeHandDemoProps> = ({
  primaryMedia,
  chromeMedia,
  secondaryMedia,
  midMedia,
  primaryVideo,
  midVideo,
  secondaryVideo,
  primaryAudio,
  midAudio,
  secondaryAudio,
  words,
  durationFrames,
  hasGlobalMusic = false,
  bridgeToNext = false,
  bridgeFromPrev = false,
  bridgeStartFrom = 0,
  isPortrait,
  mode = 'full-demo',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isSingle = mode === 'single-right';
  const sceneLen = durationFrames || (isSingle ? 192 : 254);

  // -----------------------------
  // Word-Synced Swipe Timing (derived from Edge-TTS word timestamps)
  // -----------------------------
  const hookJamStart = getHookCard2VideoStart(words, fps);
  const hookJamEnd = hookJamStart + 44;
  const hookClipEntry = getHookClipEntryFrame(words, fps);
  const hookAudioSeqFrom = getHookCard2AudioStart(words, fps, hasGlobalMusic);

  const passWordFrame = findWordFrame(words, ['left', 'pass'], 12, fps);
  const passStart = Math.max(6, passWordFrame - 4);
  const passEnd = passStart + 36;

  const jamWordFrame = findWordFrame(words, ['right', 'jam'], 65, fps);
  const fullJamStart = Math.max(passEnd + 8, jamWordFrame - 8);
  const fullJamEnd = fullJamStart + 44;
  const fullAudioStart = findWordFrame(words, ['hear', 'youtube', 'instagram', 'clips'], fullJamEnd - 2, fps);

  // Mid card screenshot for 3 distinct performers in full-demo (Bubble -> Icehouse Inez -> Dialtone Dottie)
  const midCardMedia = midMedia || 'screenshots/mobile-swipe-light.png';

  // -----------------------------
  // Card Choreography
  // -----------------------------
  const c1X = isSingle
    ? interpolate(frame, [hookJamStart, hookJamEnd], [0, 560], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : interpolate(frame, [passStart, passEnd], [0, -560], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  const c1Rot = isSingle
    ? interpolate(frame, [hookJamStart, hookJamEnd], [0, 18], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : interpolate(frame, [passStart, passEnd], [0, -17], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  const c1Opacity = isSingle
    ? interpolate(frame, [hookJamEnd - 16, hookJamEnd], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : interpolate(frame, [passEnd - 14, passEnd], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  const c1StampOpacity = isSingle
    ? interpolate(frame, [hookJamStart + 4, hookJamStart + 14, hookJamEnd - 12, hookJamEnd], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : interpolate(frame, [passStart + 3, passStart + 11, passEnd - 10, passEnd], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  // Card 2 (Secondary in single-right, Icehouse Inez in full-demo)
  const c2EnterStart = isSingle ? hookJamStart + 4 : passStart + 4;
  const c2EnterEnd = isSingle ? hookJamEnd - 2 : passEnd - 2;
  const c2Scale = interpolate(frame, [c2EnterStart, c2EnterEnd], [0.93, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const c2Y = interpolate(frame, [c2EnterStart, c2EnterEnd], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const c2X = isSingle
    ? 0
    : interpolate(frame, [fullJamStart, fullJamEnd], [0, 560], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  const c2Rot = isSingle
    ? 0
    : interpolate(frame, [fullJamStart, fullJamEnd], [0, 18], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  const c2Opacity = isSingle
    ? 1
    : interpolate(frame, [fullJamEnd - 16, fullJamEnd], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  const c2JamOpacity = isSingle
    ? 0
    : interpolate(frame, [fullJamStart + 4, fullJamStart + 14, fullJamEnd - 12, fullJamEnd], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  // Card 3 (Dialtone Dottie revealed in full-demo for live clips finale)
  const c3Scale = isSingle
    ? 0.93
    : interpolate(frame, [fullJamStart + 4, fullJamEnd - 2], [0.93, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  const c3Y = isSingle
    ? 16
    : interpolate(frame, [fullJamStart + 4, fullJamEnd - 2], [16, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  // -----------------------------
  // Hand Choreography Synced to Spoken Beats
  // -----------------------------
  const hookHandOutStart = hookJamEnd + 4;
  const hookHandOutEnd = Math.min(sceneLen - 4, hookHandOutStart + 32);

  const fullHandOutStart = fullJamEnd + 4;
  const fullHandOutEnd = Math.min(sceneLen - 6, fullHandOutStart + 28);

  const handX = isSingle
    ? interpolate(
        frame,
        [0, Math.max(4, hookJamStart - 4), hookJamStart, hookJamEnd - 4, hookHandOutStart, hookHandOutEnd],
        [240, -10, -10, 255, 290, 340],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : interpolate(
        frame,
        [
          0,
          Math.max(3, passStart - 3),
          passStart,
          passEnd - 3,
          fullJamStart - 5,
          fullJamStart,
          fullJamEnd - 4,
          fullHandOutStart,
          fullHandOutEnd,
        ],
        [230, 10, 10, -240, -8, -8, 250, 285, 340],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );

  const handY = isSingle
    ? interpolate(
        frame,
        [0, Math.max(4, hookJamStart - 4), hookJamStart, hookJamEnd - 4, hookHandOutStart, hookHandOutEnd],
        [280, 40, 40, 12, 130, 280],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : interpolate(
        frame,
        [
          0,
          Math.max(3, passStart - 3),
          passStart,
          passEnd - 3,
          fullJamStart - 5,
          fullJamStart,
          fullJamEnd - 4,
          fullHandOutStart,
          fullHandOutEnd,
        ],
        [270, 36, 36, 12, 76, 36, 12, 135, 275],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );

  const handRot = isSingle
    ? interpolate(
        frame,
        [Math.max(4, hookJamStart - 4), hookJamStart, hookJamEnd - 4, hookHandOutEnd],
        [-12, -8, 16, 20],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : interpolate(
        frame,
        [Math.max(3, passStart - 3), passStart, passEnd - 3, fullJamStart - 5, fullJamStart, fullJamEnd - 4],
        [-8, -8, -22, -6, -8, 16],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );

  const handOpacity = isSingle
    ? interpolate(frame, [2, 10, hookHandOutStart, hookHandOutEnd], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : interpolate(frame, [2, 8, fullHandOutStart, fullHandOutEnd], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  const handPress = isSingle
    ? interpolate(frame, [hookJamStart - 6, hookJamStart, hookJamEnd - 8, hookJamEnd], [1, 0.87, 0.87, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : frame < passEnd + 4
      ? interpolate(frame, [passStart - 5, passStart, passEnd - 8, passEnd], [1, 0.87, 0.87, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : interpolate(
          frame,
          [fullJamStart - 5, fullJamStart, fullJamEnd - 8, fullJamEnd],
          [1, 0.87, 0.87, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

  // Directional Swipe Trails + Orb Highlights
  const passTrailOpacity = isSingle
    ? 0
    : interpolate(frame, [passStart + 2, passStart + 12, passEnd - 10, passEnd + 2], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
  const passTrailDraw = isSingle
    ? 1
    : interpolate(frame, [passStart + 2, passEnd - 6], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  const rightTrailOpacity = isSingle
    ? interpolate(
        frame,
        [hookJamStart + 2, hookJamStart + 12, hookJamEnd - 12, hookJamEnd + 2],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : interpolate(
        frame,
        [fullJamStart + 2, fullJamStart + 12, fullJamEnd - 12, fullJamEnd + 2],
        [0, 1, 1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );
  const rightTrailDraw = isSingle
    ? interpolate(frame, [hookJamStart + 2, hookJamEnd - 8], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : interpolate(frame, [fullJamStart + 2, fullJamEnd - 8], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  // Touch ripple synced with finger touchdown
  const rippleProgress = isSingle
    ? interpolate(frame, [hookJamStart - 4, hookJamStart + 20], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : frame < passEnd + 4
      ? interpolate(frame, [passStart - 4, passStart + 18], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : interpolate(frame, [fullJamStart - 4, fullJamStart + 20], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
  const rippleScale = interpolate(rippleProgress, [0, 1], [0.35, 2.0]);
  const rippleOpacity = interpolate(rippleProgress, [0, 0.2, 1], [0, 0.9, 0]);

  // Card video progress bars & live audio badge states
  const c1Progress = isSingle
    ? interpolate(frame, [0, hookJamEnd], [12, 58], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : bridgeFromPrev
      ? interpolate(frame, [0, passEnd], [56, 78], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
      : interpolate(frame, [0, passEnd], [14, 46], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const c2Progress = isSingle
    ? interpolate(
        frame,
        monotonicRange([hookJamStart, Math.max(hookJamStart + 12, sceneLen)]),
        bridgeToNext ? [10, 56] : [10, 94],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : interpolate(frame, [passStart, fullJamEnd], [16, 62], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  const c3Progress = interpolate(frame, [fullJamStart, sceneLen], [10, 96], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const stampSize = isPortrait ? 44 : 30;
  const handSize = isPortrait ? 245 : 168;

  // Clamped integer SFX triggers & frame-synced audio offsets relative to each card's reveal
  const hookJamSfxFrom = Math.max(0, Math.round(hookJamStart + 4));
  const passSfxFrom = Math.max(0, Math.round(passStart + 2));
  const fullJamSfxFrom = Math.max(0, Math.round(fullJamStart + 4));
  const hookSeqDur = Math.max(20, sceneLen - hookAudioSeqFrom);
  const hookAudioStartFrom = Math.max(0, Math.round(hookAudioSeqFrom - hookJamStart) % 236);
  const midAudioSeqFrom = Math.max(0, Math.round(passStart + 6));
  const midSeqDur = Math.max(16, Math.round(fullJamEnd - midAudioSeqFrom));
  const midAudioStartFrom = Math.max(0, Math.round(midAudioSeqFrom - passStart) % 236);
  const fullAudioSeqFrom = Math.max(0, Math.round(fullJamStart + 6));
  const fullSeqDur = Math.max(20, sceneLen - fullAudioSeqFrom);
  const fullAudioStartFrom = Math.max(0, Math.round(fullAudioSeqFrom - fullJamStart) % 236);
  const fullRelAudioStart = Math.max(0, fullAudioStart - fullAudioSeqFrom);

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        aspectRatio: '390 / 844',
        overflow: 'visible',
      }}
    >
      {/* Real Musician Performance Clip Audio synced to foreground card */}
      {isSingle ? (
        <>
          {primaryAudio && !hasGlobalMusic ? (
            <Audio
              src={staticFile(primaryAudio)}
              loop
              volume={(f) =>
                interpolate(
                  f,
                  monotonicRange([0, 6, Math.max(8, hookJamStart + 4), Math.max(12, hookJamEnd - 2)]),
                  [0, 0.4, 0.4, 0],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                )
              }
            />
          ) : null}
          {secondaryAudio ? (
            <Sequence from={hookAudioSeqFrom} durationInFrames={hookSeqDur}>
              <Audio
                src={staticFile(secondaryAudio)}
                startFrom={hookAudioStartFrom}
                loop
                volume={(f) =>
                  bridgeToNext
                    ? interpolate(f, monotonicRange([0, 12]), [0, 0.52], {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                      })
                    : interpolate(
                        f,
                        monotonicRange([0, 12, Math.max(14, hookSeqDur - 12), Math.max(15, hookSeqDur)]),
                        [0, 0.52, 0.52, 0],
                        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                      )
                }
              />
            </Sequence>
          ) : null}
        </>
      ) : (
        <>
          {primaryAudio ? (
            <Audio
              src={staticFile(primaryAudio)}
              startFrom={bridgeFromPrev ? Math.max(0, Math.round(bridgeStartFrom) % 236) : 0}
              loop
              volume={(f) =>
                bridgeFromPrev
                  ? interpolate(
                      f,
                      monotonicRange([0, Math.max(4, passStart + 4), Math.max(8, passEnd - 2)]),
                      [0.52, 0.52, 0],
                      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    )
                  : interpolate(
                      f,
                      monotonicRange([0, 5, Math.max(7, passStart + 4), Math.max(10, passEnd - 2)]),
                      [0, 0.4, 0.4, 0],
                      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    )
              }
            />
          ) : null}
          {midAudio ? (
            <Sequence from={midAudioSeqFrom} durationInFrames={midSeqDur}>
              <Audio
                src={staticFile(midAudio)}
                startFrom={midAudioStartFrom}
                loop
                volume={(f) =>
                  interpolate(
                    f,
                    monotonicRange([
                      0,
                      Math.max(4, passEnd - midAudioSeqFrom),
                      Math.max(8, fullJamStart + 4 - midAudioSeqFrom),
                      Math.max(12, midSeqDur - 2),
                    ]),
                    [0, 0.44, 0.44, 0],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                  )
                }
              />
            </Sequence>
          ) : null}
          {secondaryAudio ? (
            <Sequence from={fullAudioSeqFrom} durationInFrames={fullSeqDur}>
              <Audio
                src={staticFile(secondaryAudio)}
                startFrom={fullAudioStartFrom}
                loop
                volume={(f) =>
                  interpolate(
                    f,
                    monotonicRange([
                      0,
                      Math.max(6, fullJamEnd - fullAudioSeqFrom),
                      Math.max(8, fullRelAudioStart - 4),
                      Math.max(10, fullRelAudioStart + 6),
                      Math.max(14, fullSeqDur - 12),
                      Math.max(15, fullSeqDur),
                    ]),
                    [0, 0.42, 0.42, 0.52, 0.52, 0],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                  )
                }
              />
            </Sequence>
          ) : null}
        </>
      )}

      {/* Beat-Synced Swipe SFX */}
      {isSingle ? (
        <Sequence from={hookJamSfxFrom} durationInFrames={18}>
          <Audio src={staticFile('generated/sfx-jam.wav')} volume={0.62} />
        </Sequence>
      ) : (
        <>
          <Sequence from={passSfxFrom} durationInFrames={14}>
            <Audio src={staticFile('generated/sfx-pass.wav')} volume={0.58} />
          </Sequence>
          <Sequence from={fullJamSfxFrom} durationInFrames={18}>
            <Audio src={staticFile('generated/sfx-jam.wav')} volume={0.62} />
          </Sequence>
        </>
      )}

      {/* Titanium Phone Bezel + Inner Clipped App Screen */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: isPortrait ? 52 : 34,
          padding: isPortrait ? 12 : 8,
          background: 'linear-gradient(155deg, rgba(255,255,255,0.22), rgba(255,255,255,0.05))',
          boxShadow: '0 34px 90px rgba(0, 0, 0, 0.65), 0 0 80px rgba(217, 27, 76, 0.22)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: isPortrait ? 42 : 28,
            overflow: 'hidden',
            backgroundColor: '#10131d',
          }}
        >
          {/* Base Chrome (Single top header + 5 orbs + bottom dock) */}
          <Img
            src={staticFile(chromeMedia || primaryMedia)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Clean Dark Deck Backing */}
          <div
            style={{
              position: 'absolute',
              top: '8.0%',
              left: '2.2%',
              right: '2.2%',
              bottom: '18.2%',
              borderRadius: 24,
              backgroundColor: '#10131d',
            }}
          />

          {/* Orb Highlight Pulses (Pass X left & Flame Jam right) */}
          <div
            style={{
              position: 'absolute',
              left: '34.2%',
              top: '86.6%',
              width: isPortrait ? 72 : 48,
              height: isPortrait ? 72 : 48,
              transform: `translate(-50%, -50%) scale(${1 + passTrailOpacity * 0.25})`,
              borderRadius: 999,
              border: '3px solid #f43f5e',
              boxShadow: '0 0 28px rgba(244, 63, 94, 0.9)',
              opacity: passTrailOpacity,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '65.8%',
              top: '86.6%',
              width: isPortrait ? 72 : 48,
              height: isPortrait ? 72 : 48,
              transform: `translate(-50%, -50%) scale(${1 + rightTrailOpacity * 0.25})`,
              borderRadius: 999,
              border: '3px solid #ff4d79',
              boxShadow: '0 0 28px rgba(255, 77, 121, 0.95)',
              opacity: rightTrailOpacity,
              pointerEvents: 'none',
            }}
          />

          {/* Card 3 (full-demo final reveal: live clip while voiceover discusses clips) */}
          {!isSingle && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translateY(${c3Y}px) scale(${c3Scale})`,
                transformOrigin: '50% 45%',
              }}
            >
              <CardContent
                media={secondaryMedia}
                video={secondaryVideo}
                videoMountFrom={fullJamStart}
                progressPct={c3Progress}
                audioActive={frame >= fullAudioSeqFrom}
                isPortrait={isPortrait}
                frame={frame}
              />
            </div>
          )}

          {/* Card 2 (Drummer/Secondary in single-right, Mid performer in full-demo) */}
          {frame <= (isSingle ? sceneLen : fullJamEnd + 2) && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: c2Opacity,
                transform: `translate(${c2X}px, ${c2Y}px) rotate(${c2Rot}deg) scale(${c2Scale})`,
                transformOrigin: '50% 60%',
              }}
            >
              <CardContent
                media={isSingle ? secondaryMedia : midCardMedia}
                video={isSingle ? secondaryVideo : midVideo}
                videoMountFrom={isSingle ? hookJamStart : passStart}
                progressPct={c2Progress}
                audioActive={
                  isSingle
                    ? frame >= hookAudioSeqFrom
                    : frame >= midAudioSeqFrom
                }
                isPortrait={isPortrait}
                frame={frame}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '13.5%',
                  left: '8%',
                  opacity: c2JamOpacity,
                  transform: 'rotate(-14deg)',
                  padding: isPortrait ? '8px 20px' : '5px 12px',
                  borderRadius: 14,
                  border: '4px solid #ff4d79',
                  backgroundColor: 'rgba(16, 19, 29, 0.88)',
                  color: '#ff4d79',
                  fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                  fontSize: stampSize,
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  boxShadow: '0 8px 28px rgba(217, 27, 76, 0.5)',
                }}
              >
                JAM!
              </div>
            </div>
          )}

          {/* Card 1 (Top starting card) */}
          {frame <= (isSingle ? hookJamEnd + 2 : passEnd + 2) && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: c1Opacity,
                transform: `translateX(${c1X}px) rotate(${c1Rot}deg)`,
                transformOrigin: '50% 65%',
              }}
            >
              <CardContent
                media={primaryMedia}
                video={primaryVideo}
                videoStartFrom={!isSingle && bridgeFromPrev ? bridgeStartFrom : 0}
                progressPct={c1Progress}
                audioActive={!isSingle || !hasGlobalMusic}
                isPortrait={isPortrait}
                frame={frame}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '13.5%',
                  left: isSingle ? '8%' : undefined,
                  right: isSingle ? undefined : '8%',
                  opacity: c1StampOpacity,
                  transform: isSingle ? 'rotate(-14deg)' : 'rotate(14deg)',
                  padding: isPortrait ? '8px 20px' : '5px 12px',
                  borderRadius: 14,
                  border: isSingle ? '4px solid #ff4d79' : '4px solid #f43f5e',
                  backgroundColor: 'rgba(16, 19, 29, 0.88)',
                  color: isSingle ? '#ff4d79' : '#fb7185',
                  fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                  fontSize: stampSize,
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  boxShadow: '0 8px 28px rgba(0, 0, 0, 0.45)',
                }}
              >
                {isSingle ? 'JAM!' : 'PASS'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UNCLIPPED OVERLAY: Curved Directional Motion Trails & Large Swiping Hand */}
      <svg
        viewBox="0 0 390 844"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: 35,
        }}
      >
        {/* Left Pass Arc + Arrowhead */}
        {passTrailOpacity > 0.01 && (
          <g
            style={{
              opacity: passTrailOpacity,
              filter: 'drop-shadow(0 6px 14px rgba(244, 63, 94, 0.85))',
            }}
          >
            <path
              d="M 215 470 Q 115 442 28 456"
              fill="none"
              stroke="#fb7185"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="210"
              strokeDashoffset={210 * (1 - passTrailDraw)}
            />
            <polygon
              points="18,458 46,440 44,474"
              fill="#fb7185"
              opacity={passTrailDraw > 0.4 ? 1 : 0}
            />
          </g>
        )}

        {/* Right Jam Arc + Arrowhead */}
        {rightTrailOpacity > 0.01 && (
          <g
            style={{
              opacity: rightTrailOpacity,
              filter: 'drop-shadow(0 6px 14px rgba(255, 77, 121, 0.9))',
            }}
          >
            <path
              d="M 175 470 Q 275 442 362 456"
              fill="none"
              stroke="#ff4d79"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="210"
              strokeDashoffset={210 * (1 - rightTrailDraw)}
            />
            <polygon
              points="372,458 344,440 346,474"
              fill="#ff4d79"
              opacity={rightTrailDraw > 0.4 ? 1 : 0}
            />
          </g>
        )}
      </svg>

      {/* Large Unclipped Illustrated Hand Cursor + Touch Ripple */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '56%',
          opacity: handOpacity,
          transform: `translate(-34%, -14%) translate(${handX}px, ${handY}px)`,
          pointerEvents: 'none',
          zIndex: 40,
        }}
      >
        {/* Expanding Touch Ripple at Index Fingertip */}
        <div
          style={{
            position: 'absolute',
            left: handSize * 0.34,
            top: handSize * 0.12,
            width: handSize * 0.56,
            height: handSize * 0.56,
            marginLeft: -(handSize * 0.28),
            marginTop: -(handSize * 0.28),
            borderRadius: 999,
            border: '5px solid #ff4d79',
            backgroundColor: 'rgba(217, 27, 76, 0.28)',
            transform: `scale(${rippleScale})`,
            opacity: rippleOpacity,
          }}
        />

        {/* Large Illustrated Hand with Detailed Silhouette + Sleeve Cuff */}
        <svg
          width={handSize}
          height={handSize}
          viewBox="0 0 128 128"
          style={{
            transform: `rotate(${handRot}deg) scale(${handPress})`,
            transformOrigin: '34% 12%',
            filter: 'drop-shadow(0 18px 28px rgba(0, 0, 0, 0.78))',
          }}
        >
          {/* Wrist cuff */}
          <path
            d="M46 98 L90 98 L94 124 L42 124 Z"
            fill="#1f2436"
            stroke="#10131d"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          <line x1="56" y1="106" x2="78" y2="106" stroke="#d91b4c" strokeWidth="4" strokeLinecap="round" />

          {/* Hand + pointing index finger */}
          <path
            d="M39 20 C39 13.5 44 9 50 9 C56 9 61 13.5 61 20 L61 48 C63.5 46.5 66.5 45.8 69.5 46 C74.5 46.2 78.8 49.4 80.5 54 C82.5 52.8 85 52.4 87.5 52.8 C92.5 53.5 96.5 57.5 97.5 62.5 C102 63.2 106 67.2 106 72.5 L106 83 C106 94 97.5 102 86.5 102 L50 102 C40 102 31.5 96.5 26 88 L15.5 72.5 C12.2 67.6 13.5 61 18.4 57.7 C23.2 54.4 29.8 55.6 33.2 60.3 L39 68 Z"
            fill="#fff4e8"
            stroke="#10131d"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* Subtle finger knuckle creases for 3D depth */}
          <line x1="61" y1="48" x2="61" y2="66" stroke="#c8b39e" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="80" y1="53" x2="80" y2="68" stroke="#c8b39e" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="97" y1="62" x2="97" y2="74" stroke="#c8b39e" strokeWidth="3" strokeLinecap="round" />
          <line x1="45" y1="22" x2="55" y2="22" stroke="#e8cbb0" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};
