import React from 'react';
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

interface ProfileScrollDemoProps {
  media: string;
  variant: 'phone' | 'desktop';
  scrollEndPct?: number;
  durationFrames: number;
  isPortrait: boolean;
}

export const ProfileScrollDemo: React.FC<ProfileScrollDemoProps> = ({
  media,
  variant,
  scrollEndPct,
  durationFrames,
  isPortrait,
}) => {
  const frame = useCurrentFrame();
  const totalSceneFrames = Math.max(30, durationFrames);

  const targetPct = scrollEndPct && scrollEndPct > 0 ? scrollEndPct : variant === 'phone' ? 68 : 45;
  const midPct = targetPct * 0.52;

  // Multi-beat showcase scroll within THIS scene's frames:
  //   0..10%  -> Hero pause (Dialtone Dottie synth badges + title)
  //  10..48%  -> Scroll smoothly through Live Stage Clip, Clips & What I'm looking for
  //  48..58%  -> Brief readable dwell
  //  58..90%  -> Glide down through What I'm looking for, Gear Locker & Scene Wall
  const f1 = Math.round(totalSceneFrames * 0.10);
  const f2 = Math.round(totalSceneFrames * 0.48);
  const f3 = Math.round(totalSceneFrames * 0.58);
  const f4 = Math.round(totalSceneFrames * 0.90);

  const scrollPct =
    frame <= f1
      ? 0
      : frame <= f2
        ? interpolate(frame, [f1, f2], [0, midPct], {
            easing: Easing.inOut(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        : frame <= f3
          ? interpolate(frame, [f2, f3], [midPct, midPct + 2.5], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          : interpolate(frame, [f3, f4], [midPct + 2.5, targetPct], {
              easing: Easing.inOut(Easing.cubic),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

  const scrollProgress = Math.min(1, Math.max(0, scrollPct / Math.max(1, targetPct)));

  // Brief upward thumb flick cue right as scrolling starts
  const flickStart = Math.max(4, f1 - 6);
  const flickEnd = Math.min(totalSceneFrames - 10, f1 + 44);
  const cueOpacity = interpolate(
    frame,
    [flickStart, flickStart + 8, flickEnd - 12, flickEnd],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const cueY = interpolate(frame, [flickStart, flickEnd], [60, -110], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isPhone = variant === 'phone';
  const handSize = isPortrait ? 190 : 132;

  return (
    <div
      style={{
        position: 'relative',
        ...(isPhone
          ? { height: '100%', aspectRatio: '390 / 844' }
          : { width: '100%', maxHeight: '100%', aspectRatio: '16 / 10' }),
        borderRadius: isPhone ? (isPortrait ? 52 : 34) : 28,
        padding: isPhone ? (isPortrait ? 12 : 8) : 10,
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
          borderRadius: isPhone ? (isPortrait ? 42 : 28) : 20,
          overflow: 'hidden',
          backgroundColor: '#10131d',
        }}
      >
        <Img
          src={staticFile(media)}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            transform: `translateY(-${scrollPct}%)`,
            willChange: 'transform',
          }}
        />

        {/* Animated Right-Edge Coral Scrollbar Indicator */}
        <div
          style={{
            position: 'absolute',
            top: '9%',
            bottom: '4%',
            right: isPhone ? 8 : 10,
            width: isPhone ? 5 : 6,
            borderRadius: 999,
            backgroundColor: 'rgba(246, 244, 239, 0.14)',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${scrollProgress * 72}%`,
              height: '28%',
              borderRadius: 999,
              backgroundColor: '#ff4d79',
              boxShadow: '0 0 12px rgba(255, 77, 121, 0.85)',
            }}
          />
        </div>

        {/* Brief Finger Scroll-Up Motion Cue */}
        {cueOpacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              right: isPhone ? '14%' : '8%',
              bottom: '18%',
              opacity: cueOpacity,
              transform: `translateY(${cueY}px)`,
              pointerEvents: 'none',
              zIndex: 25,
            }}
          >
            <svg
              width={handSize}
              height={handSize}
              viewBox="0 0 128 128"
              style={{
                filter: 'drop-shadow(0 14px 22px rgba(0, 0, 0, 0.75))',
              }}
            >
              <path
                d="M46 98 L90 98 L94 124 L42 124 Z"
                fill="#1f2436"
                stroke="#10131d"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />
              <line x1="56" y1="106" x2="78" y2="106" stroke="#d91b4c" strokeWidth="4" strokeLinecap="round" />
              <path
                d="M39 20 C39 13.5 44 9 50 9 C56 9 61 13.5 61 20 L61 48 C63.5 46.5 66.5 45.8 69.5 46 C74.5 46.2 78.8 49.4 80.5 54 C82.5 52.8 85 52.4 87.5 52.8 C92.5 53.5 96.5 57.5 97.5 62.5 C102 63.2 106 67.2 106 72.5 L106 83 C106 94 97.5 102 86.5 102 L50 102 C40 102 31.5 96.5 26 88 L15.5 72.5 C12.2 67.6 13.5 61 18.4 57.7 C23.2 54.4 29.8 55.6 33.2 60.3 L39 68 Z"
                fill="#fff4e8"
                stroke="#10131d"
                strokeWidth="4.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
