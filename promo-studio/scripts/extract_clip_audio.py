#!/usr/bin/env python3
"""Extract audio from a musician MP4 clip and normalize RMS/peak loudness into a seamless stereo WAV."""

import argparse
import array
import math
import os
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path


def resolve_ffmpeg() -> tuple[str, dict[str, str]]:
    studio_root = Path(__file__).resolve().parent.parent
    compositor_dir = studio_root / "node_modules" / "@remotion" / "compositor-darwin-arm64"
    bundled = compositor_dir / "ffmpeg"
    env = os.environ.copy()
    if bundled.exists():
        env["DYLD_LIBRARY_PATH"] = str(compositor_dir)
        return str(bundled), env
    on_path = shutil.which("ffmpeg")
    if not on_path:
        raise RuntimeError("Could not find bundled Remotion ffmpeg or ffmpeg on PATH")
    return on_path, env


def extract_and_normalize(in_path: Path, out_path: Path, target_rms_db: float = -18.0) -> None:
    ffmpeg_bin, env = resolve_ffmpeg()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp_dir:
        raw_wav = Path(tmp_dir) / "extracted.wav"
        subprocess.run(
            [
                ffmpeg_bin,
                "-y",
                "-v",
                "error",
                "-i",
                str(in_path),
                "-vn",
                "-ac",
                "2",
                "-ar",
                "44100",
                "-c:a",
                "pcm_s16le",
                str(raw_wav),
            ],
            env=env,
            check=True,
        )

        with wave.open(str(raw_wav), "rb") as wf:
            channels = wf.getnchannels()
            sr = wf.getframerate()
            raw_frames = wf.readframes(wf.getnframes())

    samples = array.array("h")
    samples.frombytes(raw_frames)
    if not samples:
        raise RuntimeError(f"No audio samples decoded from {in_path}")

    floats = [s / 32768.0 for s in samples]
    rms = math.sqrt(sum(v * v for v in floats) / len(floats))
    target_linear = 10.0 ** (target_rms_db / 20.0)
    gain = min(4.0, target_linear / max(rms, 1e-6))

    # 15ms linear boundary fades so seamless <Loop> never clicks
    fade_samples = min(int(sr * 0.015) * channels, len(floats) // 4)
    total_len = len(floats)

    pcm_out = array.array("h")
    for idx, val in enumerate(floats):
        x = val * gain
        # Smooth soft-knee limiter keeping peaks <= ~ -1.0 dB (0.891)
        if abs(x) > 0.72:
            x = 0.89 * math.tanh(x / 0.89)
        if fade_samples > 0:
            if idx < fade_samples:
                x *= idx / fade_samples
            elif idx >= total_len - fade_samples:
                x *= (total_len - 1 - idx) / fade_samples
        pcm_out.append(max(-32767, min(32767, int(round(x * 32767.0)))))

    with wave.open(str(out_path), "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm_out.tobytes())


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract and loudness-normalize clip audio to stereo WAV.")
    parser.add_argument("--in", dest="in_path", required=True, help="Input MP4 clip path")
    parser.add_argument("--out", required=True, help="Output WAV path")
    parser.add_argument("--target-rms-db", type=float, default=-18.0, help="Target RMS level in dBFS")
    args = parser.parse_args()

    extract_and_normalize(Path(args.in_path), Path(args.out), args.target_rms_db)
    print(f"[clip-audio] normalized {Path(args.in_path).name} -> {args.out}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
