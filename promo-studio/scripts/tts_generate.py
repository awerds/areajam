#!/usr/bin/env python3
"""Generate per-scene voiceover audio and word-level timing manifest for Remotion."""

import argparse
import asyncio
import base64
import json
import math
import os
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
import wave
from pathlib import Path


def fallback_word_timings(text: str, duration_sec: float) -> list[dict]:
    tokens = [w.strip() for w in text.split() if w.strip()]
    if not tokens or duration_sec <= 0:
        return []
    total_ms = max(200, int(duration_sec * 1000))
    usable_ms = max(150, int(total_ms * 0.94))
    step = usable_ms / len(tokens)
    out = []
    for idx, tok in enumerate(tokens):
        start_ms = int(idx * step)
        end_ms = max(start_ms + 40, int((idx + 1) * step))
        out.append({"word": tok, "startMs": start_ms, "endMs": end_ms})
    return out


async def synthesize_edge(
    text: str, mp3_path: Path, voice: str, rate: str
) -> tuple[float, list[dict]]:
    import edge_tts
    from mutagen.mp3 import MP3

    communicate = edge_tts.Communicate(
        text, voice=voice, rate=rate, boundary="WordBoundary"
    )
    words: list[dict] = []
    audio_bytes = bytearray()

    async for chunk in communicate.stream():
        chunk_type = chunk.get("type")
        if chunk_type == "audio":
            data = chunk.get("data")
            if data:
                audio_bytes.extend(data)
        elif chunk_type == "WordBoundary":
            word_text = str(chunk.get("text", "")).strip()
            offset = chunk.get("offset")
            duration = chunk.get("duration")
            if word_text and isinstance(offset, (int, float)) and isinstance(duration, (int, float)):
                start_ms = int(offset / 10_000)
                end_ms = max(start_ms + 40, int((offset + duration) / 10_000))
                words.append({"word": word_text, "startMs": start_ms, "endMs": end_ms})

    mp3_path.write_bytes(bytes(audio_bytes))
    duration_sec = float(MP3(mp3_path).info.length)
    if not words:
        words = fallback_word_timings(text, duration_sec)
    return duration_sec, words


def synthesize_elevenlabs(text: str, mp3_path: Path, voice_id: str) -> tuple[float, list[dict]]:
    from mutagen.mp3 import MP3

    api_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "ELEVENLABS_API_KEY is not set. Export it in your shell or pass --provider=edge for $0 voiceover."
        )

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"
    payload = json.dumps(
        {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.48, "similarity_boost": 0.78},
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        method="POST",
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"ElevenLabs HTTP {exc.code}: {detail}") from exc

    audio_b64 = body.get("audio_base64")
    if not audio_b64:
        raise RuntimeError("ElevenLabs response did not include audio_base64.")
    mp3_path.write_bytes(base64.b64decode(audio_b64))
    duration_sec = float(MP3(mp3_path).info.length)

    alignment = body.get("alignment") or {}
    chars = alignment.get("characters") or []
    starts = alignment.get("character_start_times_seconds") or []
    ends = alignment.get("character_end_times_seconds") or []

    words: list[dict] = []
    if chars and len(chars) == len(starts) == len(ends):
        buf = ""
        word_start: float | None = None
        word_end: float | None = None
        for ch, st, en in zip(chars, starts, ends):
            if str(ch).isspace():
                if buf:
                    s_ms = int(float(word_start or 0) * 1000)
                    e_ms = max(s_ms + 40, int(float(word_end or st) * 1000))
                    words.append({"word": buf, "startMs": s_ms, "endMs": e_ms})
                    buf = ""
                    word_start = None
                    word_end = None
            else:
                if word_start is None:
                    word_start = float(st)
                word_end = float(en)
                buf += str(ch)
        if buf:
            s_ms = int(float(word_start or 0) * 1000)
            e_ms = max(s_ms + 40, int(float(word_end or duration_sec) * 1000))
            words.append({"word": buf, "startMs": s_ms, "endMs": e_ms})

    if not words:
        words = fallback_word_timings(text, duration_sec)
    return duration_sec, words


def synthesize_say(text: str, wav_path: Path, voice: str) -> tuple[float, list[dict]]:
    say_voice = voice if not voice.endswith("Neural") else "Samantha"
    with tempfile.NamedTemporaryFile(suffix=".aiff", delete=False) as tmp:
        aiff_path = Path(tmp.name)
    try:
        subprocess.run(
            ["/usr/bin/say", "-v", say_voice, "-o", str(aiff_path), text],
            check=True,
        )
        subprocess.run(
            [
                "/usr/bin/afconvert",
                "-f",
                "WAVE",
                "-d",
                "LEI16@44100",
                str(aiff_path),
                str(wav_path),
            ],
            check=True,
        )
    finally:
        aiff_path.unlink(missing_ok=True)

    with wave.open(str(wav_path), "rb") as wf:
        duration_sec = wf.getnframes() / float(wf.getframerate())
    return duration_sec, fallback_word_timings(text, duration_sec)


async def build_timeline(args: argparse.Namespace) -> dict:
    script_data = json.loads(Path(args.script).read_text(encoding="utf-8"))
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    for stale in out_dir.glob("scene-*.*"):
        stale.unlink()

    fps = int(args.fps)
    scenes_in = script_data.get("scenes", [])
    scenes_out = []
    cursor_frame = 0

    for idx, scene in enumerate(scenes_in):
        narration = str(scene.get("narration", "")).strip()
        is_endcard = scene.get("mediaType") == "endcard"
        pad_sec = 0.75 if is_endcard else 0.32

        if not narration:
            duration_sec = float(scene.get("durationSec", 3.0))
            audio_rel = ""
            words: list[dict] = []
        elif args.provider == "say":
            audio_name = f"scene-{idx}.wav"
            duration_sec, words = synthesize_say(narration, out_dir / audio_name, args.voice)
            audio_rel = f"generated/{audio_name}"
        elif args.provider == "elevenlabs":
            audio_name = f"scene-{idx}.mp3"
            voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "").strip() or (
                args.voice if not args.voice.startswith("en-") else "21m00Tcm4TlvDq8ikWAM"
            )
            duration_sec, words = synthesize_elevenlabs(narration, out_dir / audio_name, voice_id)
            audio_rel = f"generated/{audio_name}"
        else:
            audio_name = f"scene-{idx}.mp3"
            duration_sec, words = await synthesize_edge(
                narration, out_dir / audio_name, args.voice, args.rate
            )
            audio_rel = f"generated/{audio_name}"

        duration_frames = max(int(fps * 1.6), math.ceil((duration_sec + pad_sec) * fps))
        scenes_out.append(
            {
                "id": scene.get("id", f"scene-{idx}"),
                "badge": scene.get("badge", "AreaJam"),
                "headline": scene.get("headline", ""),
                "subline": scene.get("subline", ""),
                "media": scene.get("media", ""),
                "chromeMedia": scene.get("chromeMedia", ""),
                "secondaryMedia": scene.get("secondaryMedia", ""),
                "midMedia": scene.get("midMedia", ""),
                "primaryVideo": scene.get("primaryVideo", ""),
                "midVideo": scene.get("midVideo", ""),
                "secondaryVideo": scene.get("secondaryVideo", ""),
                "primaryAudio": scene.get("primaryAudio", ""),
                "midAudio": scene.get("midAudio", ""),
                "secondaryAudio": scene.get("secondaryAudio", ""),
                "clipAudio": scene.get("clipAudio", ""),
                "scrollEndPct": scene.get("scrollEndPct", 0),
                "mediaType": scene.get("mediaType", "phone"),
                "motion": scene.get("motion", "zoom-in"),
                "narration": narration,
                "audioFile": audio_rel,
                "startFrame": cursor_frame,
                "durationFrames": duration_frames,
                "durationSec": round(duration_sec, 3),
                "words": words,
            }
        )
        cursor_frame += duration_frames
        print(
            f"[tts] scene {idx + 1}/{len(scenes_in)} ({scene.get('id')}): {duration_sec:.2f}s, {len(words)} words",
            flush=True,
        )

    manifest = {
        "title": script_data.get("title", "AreaJam Promo"),
        "width": int(script_data.get("width", 1080)),
        "height": int(script_data.get("height", 1920)),
        "fps": fps,
        "totalFrames": max(fps * 3, cursor_frame),
        "musicFile": "",
        "ctaUrl": script_data.get("ctaUrl", "areajam.com"),
        "ctaTagline": script_data.get("ctaTagline", "Find your tribe. Match with musicians today."),
        "scenes": scenes_out,
    }
    manifest_path = out_dir / "timeline.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate TTS audio and timeline manifest.")
    parser.add_argument("--script", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--provider", choices=["edge", "elevenlabs", "say"], default="edge")
    parser.add_argument("--voice", default="en-US-AndrewMultilingualNeural")
    parser.add_argument("--rate", default="+6%")
    parser.add_argument("--fps", type=int, default=30)
    args = parser.parse_args()

    try:
        asyncio.run(build_timeline(args))
    except Exception as exc:
        print(f"Error synthesizing voiceover: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
