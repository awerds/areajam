import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ShortFirstFrameCoverLogo, WatermarkLogo } from './BrandLogoOverlay';
import { CaptionOverlay } from './CaptionOverlay';
import { ProfileScrollDemo } from './ProfileScrollDemo';
import { SwipeHandDemo, getHookCard2VideoStart, getSwipeClipAudioWindow } from './SwipeHandDemo';
import type { SceneSpec, TimelineManifest } from './types';

const SceneStage: React.FC<{
  scene: SceneSpec;
  isPortrait: boolean;
  ctaUrl: string;
  hasGlobalMusic: boolean;
  bridgeToNext?: boolean;
  bridgeFromPrev?: boolean;
  bridgeStartFrom?: number;
}> = ({
  scene,
  isPortrait,
  ctaUrl,
  hasGlobalMusic,
  bridgeToNext = false,
  bridgeFromPrev = false,
  bridgeStartFrom = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = bridgeFromPrev
    ? 1
    : spring({
        frame,
        fps,
        config: { damping: 18, stiffness: 130 },
      });

  const fadeOut = bridgeToNext
    ? 1
    : interpolate(
        frame,
        [Math.max(0, scene.durationFrames - 10), scene.durationFrames],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      );

  const driftProgress = frame / Math.max(1, scene.durationFrames);
  const scaleStart = scene.motion === 'zoom-out' ? 1.07 : 1.0;
  const scaleEnd = scene.motion === 'zoom-out' ? 1.0 : 1.06;
  const mediaScale = interpolate(driftProgress, [0, 1], [scaleStart, scaleEnd]);
  const rotateY =
    scene.motion === 'tilt-left'
      ? interpolate(driftProgress, [0, 1], [-5, 2])
      : scene.motion === 'tilt-right'
        ? interpolate(driftProgress, [0, 1], [5, -2])
        : 0;

  const translateY = interpolate(enter, [0, 1], [34, 0]);
  const mediaOpacity = Math.min(enter, fadeOut);

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {scene.audioFile ? <Audio src={staticFile(scene.audioFile)} volume={1} /> : null}
      {scene.clipAudio && !hasGlobalMusic ? (
        <Audio
          src={staticFile(scene.clipAudio)}
          loop
          volume={(f) =>
            interpolate(
              f,
              [0, 12, Math.max(13, scene.durationFrames - 16), scene.durationFrames],
              [0, 0.34, 0.34, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            )
          }
        />
      ) : null}

      {/* Main Visual Subject */}
      {scene.mediaType === 'phone' && scene.media && (
        <div
          style={{
            position: 'absolute',
            top: isPortrait ? 82 : 58,
            bottom: isPortrait ? 245 : 135,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: 1400,
            opacity: mediaOpacity,
          }}
        >
          <div
            style={{
              height: '100%',
              aspectRatio: '390 / 844',
              borderRadius: isPortrait ? 52 : 34,
              padding: isPortrait ? 12 : 8,
              background: 'linear-gradient(155deg, rgba(255,255,255,0.22), rgba(255,255,255,0.05))',
              boxShadow: '0 34px 90px rgba(0, 0, 0, 0.65), 0 0 80px rgba(217, 27, 76, 0.2)',
              transform: `translateY(${translateY}px) rotateY(${rotateY}deg)`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: isPortrait ? 42 : 28,
                overflow: 'hidden',
                backgroundColor: '#10131d',
              }}
            >
              <Img
                src={staticFile(scene.media)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `scale(${mediaScale})`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {scene.mediaType === 'phone-swipe' && scene.media && (
        <div
          style={{
            position: 'absolute',
            top: isPortrait ? 82 : 58,
            bottom: isPortrait ? 245 : 135,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: mediaOpacity,
            transform: `translateY(${translateY}px)`,
            overflow: 'visible',
          }}
        >
          <SwipeHandDemo
            primaryMedia={scene.media}
            chromeMedia={scene.chromeMedia}
            midMedia={scene.midMedia}
            secondaryMedia={scene.secondaryMedia || 'screenshots/mobile-swipe-light.png'}
            primaryVideo={scene.primaryVideo}
            midVideo={scene.midVideo}
            secondaryVideo={scene.secondaryVideo}
            primaryAudio={scene.primaryAudio}
            midAudio={scene.midAudio}
            secondaryAudio={scene.secondaryAudio}
            words={scene.words}
            durationFrames={scene.durationFrames}
            hasGlobalMusic={hasGlobalMusic}
            bridgeToNext={bridgeToNext}
            bridgeFromPrev={bridgeFromPrev}
            bridgeStartFrom={bridgeStartFrom}
            isPortrait={isPortrait}
            mode={scene.id === 'hook' ? 'single-right' : 'full-demo'}
          />
        </div>
      )}

      {scene.mediaType === 'phone-scroll' && scene.media && (
        <div
          style={{
            position: 'absolute',
            top: isPortrait ? 82 : 58,
            bottom: isPortrait ? 245 : 135,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: mediaOpacity,
            transform: `translateY(${translateY}px)`,
          }}
        >
          <ProfileScrollDemo
            media={scene.media}
            variant="phone"
            scrollEndPct={scene.scrollEndPct}
            durationFrames={scene.durationFrames}
            isPortrait={isPortrait}
          />
        </div>
      )}

      {scene.mediaType === 'desktop-scroll' && scene.media && (
        <div
          style={{
            position: 'absolute',
            top: isPortrait ? 220 : 58,
            bottom: isPortrait ? 260 : 135,
            left: isPortrait ? 40 : 110,
            right: isPortrait ? 40 : 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: mediaOpacity,
            transform: `translateY(${translateY}px)`,
          }}
        >
          <ProfileScrollDemo
            media={scene.media}
            variant="desktop"
            scrollEndPct={scene.scrollEndPct}
            durationFrames={scene.durationFrames}
            isPortrait={isPortrait}
          />
        </div>
      )}

      {scene.mediaType === 'desktop' && scene.media && (
        <div
          style={{
            position: 'absolute',
            top: isPortrait ? 220 : 58,
            bottom: isPortrait ? 260 : 135,
            left: isPortrait ? 40 : 110,
            right: isPortrait ? 40 : 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: 1400,
            opacity: mediaOpacity,
          }}
        >
          <div
            style={{
              width: '100%',
              maxHeight: '100%',
              aspectRatio: '16 / 10',
              borderRadius: 28,
              padding: 10,
              background: 'linear-gradient(145deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
              boxShadow: '0 32px 84px rgba(0, 0, 0, 0.62), 0 0 70px rgba(217, 27, 76, 0.18)',
              transform: `translateY(${translateY}px) rotateY(${rotateY * 0.7}deg)`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: '#10131d',
              }}
            >
              <Img
                src={staticFile(scene.media)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: '50% 0%',
                  transform: `scale(${mediaScale})`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {scene.mediaType === 'endcard' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingInline: isPortrait ? 64 : 180,
            textAlign: 'center',
            transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])})`,
            opacity: mediaOpacity,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 20px',
              borderRadius: 999,
              backgroundColor: 'rgba(217, 27, 76, 0.16)',
              border: '1px solid rgba(255, 77, 121, 0.45)',
              color: '#ff7fa0',
              fontFamily: "'Plus Jakarta Sans', 'Avenir Next', system-ui, sans-serif",
              fontSize: isPortrait ? 24 : 20,
              fontWeight: 700,
              letterSpacing: '0.01em',
              marginBottom: isPortrait ? 24 : 18,
            }}
          >
            {scene.badge}
          </div>

          <h1
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', 'Avenir Next', 'SF Pro Display', system-ui, sans-serif",
              fontSize: isPortrait ? 78 : 74,
              fontWeight: 800,
              lineHeight: 1.06,
              letterSpacing: '-0.03em',
              color: '#f6f4ef',
              marginBottom: 32,
            }}
          >
            {scene.headline}
          </h1>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isPortrait ? '24px 52px' : '22px 54px',
              borderRadius: 999,
              backgroundColor: '#d91b4c',
              color: '#ffffff',
              fontFamily: "'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: isPortrait ? 52 : 46,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              boxShadow: '0 20px 56px rgba(217, 27, 76, 0.55)',
            }}
          >
            {ctaUrl}
          </div>

          <p
            style={{
              marginTop: 28,
              fontFamily: "'Plus Jakarta Sans', 'Avenir Next', system-ui, sans-serif",
              fontSize: isPortrait ? 30 : 26,
              fontWeight: 600,
              color: '#a3adc2',
            }}
          >
            {scene.subline}
          </p>
        </div>
      )}

      <CaptionOverlay words={scene.words} fps={fps} isPortrait={isPortrait} />
    </AbsoluteFill>
  );
};

export const AreaJamPromo: React.FC<TimelineManifest> = (props) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const isPortrait = height > width;
  const progressPct = Math.min(100, Math.max(0, (frame / Math.max(1, durationInFrames - 1)) * 100));

  return (
    <AbsoluteFill style={{ backgroundColor: '#10131d', overflow: 'hidden' }}>
      {/* Ambient Stage Glow & Acoustic Rings */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 22% 18%, rgba(217, 27, 76, 0.24), transparent 52%), radial-gradient(circle at 80% 82%, rgba(21, 128, 102, 0.16), transparent 54%)',
        }}
      />

      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.42,
          transform: `rotate(${interpolate(frame, [0, durationInFrames], [0, 8])}deg) scale(1.1)`,
        }}
      >
        <g fill="none" stroke="rgba(217, 27, 76, 0.26)" strokeWidth="2">
          {[180, 290, 410, 540, 680].map((r) => (
            <circle key={r} cx="860" cy="840" r={r} />
          ))}
        </g>
      </svg>

      {/* Top Progress Track */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          backgroundColor: 'rgba(246, 244, 239, 0.1)',
          zIndex: 40,
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            backgroundColor: '#d91b4c',
          }}
        />
      </div>

      {/* Backing Studio Music (opens on modern rock, auto-ducks cleanly during live card clips) */}
      {props.musicFile ? (
        <Audio
          src={staticFile(props.musicFile)}
          loop
          volume={(f) => {
            const base = interpolate(
              f,
              [
                0,
                6,
                Math.max(13, durationInFrames - 30),
                Math.max(14, durationInFrames - 14),
                Math.max(15, durationInFrames),
              ],
              [0.16, 0.28, 0.28, 0.36, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );
            const clipWindows: Array<[number, number]> = [];
            for (const sc of props.scenes) {
              const win = getSwipeClipAudioWindow(sc, props.fps, true);
              if (win) {
                const [winStart, winEnd] = win;
                const prev = clipWindows[clipWindows.length - 1];
                if (prev && winStart <= prev[1] + 12) {
                  prev[1] = Math.max(prev[1], winEnd);
                } else {
                  clipWindows.push([winStart, winEnd]);
                }
              }
            }
            let duck = 1;
            for (const [winStart, winEnd] of clipWindows) {
              if (winStart <= 0) {
                duck = Math.min(
                  duck,
                  interpolate(f, [Math.max(0, winEnd - 6), winEnd + 10], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  })
                );
              } else {
                duck = Math.min(
                  duck,
                  interpolate(
                    f,
                    [winStart - 8, winStart + 6, winEnd - 6, winEnd + 10],
                    [1, 0, 0, 1],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                  )
                );
              }
            }
            return base * duck;
          }}
        />
      ) : null}

      {/* Sequenced Scenes */}
      {props.scenes.map((scene, idx) => {
        const prevScene = idx > 0 ? props.scenes[idx - 1] : null;
        const nextScene = idx + 1 < props.scenes.length ? props.scenes[idx + 1] : null;
        const hasGlobalMusic = Boolean(props.musicFile);
        const bridgeToNext =
          scene.mediaType === 'phone-swipe' &&
          nextScene?.mediaType === 'phone-swipe' &&
          Boolean(scene.secondaryMedia) &&
          scene.secondaryMedia === nextScene.media;
        const bridgeFromPrev =
          scene.mediaType === 'phone-swipe' &&
          prevScene?.mediaType === 'phone-swipe' &&
          Boolean(prevScene.secondaryMedia) &&
          prevScene.secondaryMedia === scene.media;
        const bridgeStartFrom =
          bridgeFromPrev && prevScene
            ? Math.max(0, prevScene.durationFrames - getHookCard2VideoStart(prevScene.words, props.fps))
            : 0;

        return (
          <Sequence
            key={scene.id}
            from={scene.startFrame}
            durationInFrames={scene.durationFrames}
          >
            <SceneStage
              scene={scene}
              isPortrait={isPortrait}
              ctaUrl={props.ctaUrl}
              hasGlobalMusic={hasGlobalMusic}
              bridgeToNext={bridgeToNext}
              bridgeFromPrev={bridgeFromPrev}
              bridgeStartFrom={bridgeStartFrom}
            />
          </Sequence>
        );
      })}

      {/* Centered AreaJam logo on Frame 0 of vertical shorts (for frozen first-frame embeds) */}
      {isPortrait && frame === 0 ? <ShortFirstFrameCoverLogo /> : null}

      {/* Persistent corner watermark across all videos (hidden on Frame 0 of portrait shorts to avoid double logo) */}
      {(!isPortrait || frame >= 1) ? <WatermarkLogo isPortrait={isPortrait} /> : null}
    </AbsoluteFill>
  );
};
