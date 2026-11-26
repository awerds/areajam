#!/usr/bin/env python3
"""Generate a seamless ~62-second 124 BPM live indie/garage rock backing track (WAV)."""

import argparse
import array
import math
import random
import wave
from pathlib import Path


def midi_to_hz(midi: float) -> float:
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


def generate_groove(out_path: Path, bpm: float = 124.0) -> None:
    sr = 44100
    beat_sec = 60.0 / bpm
    # 128 beats = 32 bars (8 repeats of a 4-bar rock progression) -> exact loop boundary
    total_beats = 128
    total_samples = int(round((total_beats * beat_sec) * sr))
    tau = 2.0 * math.pi

    # E5 -> G5 -> A5 -> C5/B5 power-chord riff (bass MIDI, chord fifths/octaves MIDI)
    bars = [
        (40, [52, 59, 64]),  # E5
        (43, [55, 62, 67]),  # G5
        (45, [57, 64, 69]),  # A5
        (48, [60, 67, 72]),  # C5 (first half bar 4), shifts to B5 on beat 2
    ]
    b5_chord = (47, [59, 66, 71])

    # Precompute phase steps for guitar notes for fast clean synthesis
    rng = random.Random(1337)
    left_buf = [0.0] * total_samples
    right_buf = [0.0] * total_samples

    crash_env = 0.0
    snare_lp = 0.0
    hat_hp_prev = 0.0
    hat_hp_out = 0.0

    for i in range(total_samples):
        t = i / sr
        beat_pos = t / beat_sec
        bar_idx = int(beat_pos // 4) % 4
        beat_in_bar = beat_pos % 4.0
        eighth_pos = (beat_pos * 2.0) % 1.0
        eighth_t = eighth_pos * (beat_sec * 0.5)
        eighth_step = int(beat_pos * 2.0) % 8
        beat_sub = beat_pos % 1.0
        beat_t = beat_sub * beat_sec

        bass_midi, chord_notes = bars[bar_idx]
        if bar_idx == 3 and beat_in_bar >= 2.0:
            bass_midi, chord_notes = b5_chord

        # 1) Live overdriven rhythm guitar (driving 8th notes with accented downbeats)
        is_accent = eighth_step in (0, 3, 6)
        decay_rate = 5.5 if is_accent else 12.0
        gtr_env = min(1.0, eighth_t / 0.008) * math.exp(-eighth_t * decay_rate)

        gtr_raw_l = 0.0
        gtr_raw_r = 0.0
        for n_idx, midi in enumerate(chord_notes):
            hz_l = midi_to_hz(midi)
            hz_r = hz_l * 1.0035  # double-tracked stereo chorus spread
            # Band-limited warm rock harmonics (f, 2f, 3f, 4f)
            sig_l = (
                0.55 * math.sin(tau * hz_l * t)
                + 0.30 * math.sin(tau * hz_l * 2.0 * t)
                + 0.14 * math.sin(tau * hz_l * 3.0 * t)
                + 0.07 * math.sin(tau * hz_l * 4.0 * t)
            )
            sig_r = (
                0.55 * math.sin(tau * hz_r * (t + 0.006))
                + 0.30 * math.sin(tau * hz_r * 2.0 * (t + 0.006))
                + 0.14 * math.sin(tau * hz_r * 3.0 * (t + 0.006))
                + 0.07 * math.sin(tau * hz_r * 4.0 * (t + 0.006))
            )
            gain = 0.42 if n_idx == 0 else 0.34
            gtr_raw_l += sig_l * gain
            gtr_raw_r += sig_r * gain

        # Tube amp soft-clip saturation
        gtr_l = math.tanh(gtr_raw_l * gtr_env * 2.6) * 0.34
        gtr_r = math.tanh(gtr_raw_r * gtr_env * 2.6) * 0.34

        # 2) Driving pick-style rock bass
        bass_hz = midi_to_hz(bass_midi)
        bass_env = min(1.0, eighth_t / 0.01) * math.exp(-eighth_t * 4.2)
        bass_sig = math.tanh(
            (0.75 * math.sin(tau * bass_hz * t) + 0.35 * math.sin(tau * bass_hz * 2.0 * t)) * 1.6
        ) * 0.28 * bass_env

        # 3) Punchy rock drum kit
        # Kick on beats 0, 2, and syncopated 2.5 (steps 0, 4, 5 in eighths)
        if eighth_step in (0, 4, 5):
            k_t = eighth_t
        elif eighth_step == 1 and eighth_t < 0.05:
            k_t = eighth_t + beat_sec * 0.5
        else:
            k_t = 1.0
        kick_freq = 48.0 + 95.0 * math.exp(-k_t * 36.0)
        kick = math.tanh(math.sin(tau * kick_freq * k_t) * 1.8) * math.exp(-k_t * 15.0) * 0.46

        # Cracking snare on beats 1 and 3 (steps 2 and 6)
        white = rng.uniform(-1.0, 1.0)
        snare = 0.0
        if int(beat_in_bar) in (1, 3):
            s_t = beat_t
            snare_body = math.sin(tau * (182.0 + 45.0 * math.exp(-s_t * 40.0)) * s_t) * math.exp(-s_t * 18.0)
            snare_lp = 0.65 * snare_lp + 0.35 * white
            snare_snap = (white - snare_lp * 0.35) * math.exp(-s_t * 22.0)
            snare = math.tanh((snare_body * 0.55 + snare_snap * 0.85) * 1.6) * 0.36

        # Crisp driving 8th-note hi-hat + bar-1 open crash accent
        hat_hp_out = 0.82 * (hat_hp_out + white - hat_hp_prev)
        hat_hp_prev = white
        hat_decay = 28.0 if eighth_step % 2 == 0 else 44.0
        hihat = hat_hp_out * math.exp(-eighth_t * hat_decay) * 0.09

        if bar_idx == 0 and beat_in_bar < 0.02 and i % 10 == 0:
            crash_env = max(crash_env, 1.0)
        crash_env *= 0.999935
        crash = hat_hp_out * crash_env * 0.065

        left_buf[i] = gtr_l + bass_sig + kick + snare + hihat * 0.85 + crash * 1.15
        right_buf[i] = gtr_r + bass_sig + kick + snare + hihat * 1.15 + crash * 0.85

    peak = max(max(abs(x) for x in left_buf), max(abs(x) for x in right_buf), 1e-6)
    scale = 0.86 / peak

    pcm = array.array("h")
    for l_val, r_val in zip(left_buf, right_buf):
        l_int = max(-32767, min(32767, int(l_val * scale * 32767)))
        r_int = max(-32767, min(32767, int(r_val * scale * 32767)))
        pcm.append(l_int)
        pcm.append(r_int)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


def write_stereo_wav(out_path: Path, left_buf: list[float], right_buf: list[float], sr: int = 44100) -> None:
    """Write normalized stereo float buffers (-1..1) to a 16-bit PCM WAV file."""
    pcm = array.array("h")
    for l_val, r_val in zip(left_buf, right_buf):
        pcm.append(max(-32767, min(32767, int(l_val * 32767))))
        pcm.append(max(-32767, min(32767, int(r_val * 32767))))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out_path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


def generate_pass_sfx(out_path: Path) -> None:
    """Generate a 0.32s downward air whoosh + damped thud for swipe-left PASS."""
    sr = 44100
    dur = 0.32
    n = int(sr * dur)
    tau = 2.0 * math.pi
    rng = random.Random(404)
    left_buf = [0.0] * n
    right_buf = [0.0] * n
    lp = 0.0
    phase_thump = 0.0

    for i in range(n):
        t = i / sr
        p = t / dur
        # Attack/decay envelope
        env = min(1.0, t / 0.018) * math.exp(-p * 4.4)
        # Low-pass noise sweep (~1100 Hz down to ~180 Hz)
        cutoff_hz = 1100.0 * (0.16 ** p)
        alpha = min(0.85, (tau * cutoff_hz / sr))
        lp = lp + alpha * (rng.uniform(-1.0, 1.0) - lp)
        whoosh = lp * env * 0.58

        # Soft downward damped card flick thud (155 Hz -> 62 Hz)
        freq = 155.0 - 93.0 * p
        phase_thump += tau * freq / sr
        thud = math.sin(phase_thump) * math.exp(-t * 22.0) * 0.36

        val = math.tanh(whoosh + thud)
        left_buf[i] = val * 0.92
        right_buf[i] = val * 0.78  # Slight left-biased stereo image

    write_stereo_wav(out_path, left_buf, right_buf, sr)


def generate_jam_sfx(out_path: Path) -> None:
    """Generate a 0.45s upward air whoosh + bright E-major shimmer chime for swipe-right JAM."""
    sr = 44100
    dur = 0.45
    n = int(sr * dur)
    tau = 2.0 * math.pi
    rng = random.Random(808)
    left_buf = [0.0] * n
    right_buf = [0.0] * n
    lp = 0.0
    hp_prev = 0.0

    # E major fifth + octave sparkle aligned with E5 track key
    chimes = [
        (659.25, 0.015, 0.28),   # E5
        (830.61, 0.045, 0.24),   # G#5
        (987.77, 0.075, 0.26),   # B5
        (1318.51, 0.105, 0.20),  # E6
    ]

    for i in range(n):
        t = i / sr
        p = t / dur
        # Upward breezy swoosh
        env_w = min(1.0, t / 0.02) * math.exp(-((t - 0.07) ** 2) / 0.008)
        raw = rng.uniform(-1.0, 1.0)
        alpha = min(0.88, tau * (350.0 + 1800.0 * p) / sr)
        lp = lp + alpha * (raw - lp)
        hp = lp - hp_prev
        hp_prev = lp * 0.75
        whoosh = hp * env_w * 0.32

        # Warm pop impulse on release
        pop = math.sin(tau * (220.0 + 260.0 * p) * t) * math.exp(-t * 30.0) * 0.25

        # Shimmer triad
        chime_l = 0.0
        chime_r = 0.0
        for idx, (freq, onset, amp) in enumerate(chimes):
            if t >= onset:
                dt = t - onset
                c_env = min(1.0, dt / 0.006) * math.exp(-dt * 8.2)
                tone = (math.sin(tau * freq * dt) + 0.22 * math.sin(tau * freq * 2.0 * dt)) * c_env * amp
                pan = 0.35 + 0.65 * (idx / max(1, len(chimes) - 1))
                chime_l += tone * (1.0 - 0.35 * pan)
                chime_r += tone * (0.65 + 0.35 * pan)

        left_buf[i] = math.tanh(whoosh + pop + chime_l)
        right_buf[i] = math.tanh(whoosh + pop + chime_r)

    write_stereo_wav(out_path, left_buf, right_buf, sr)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate driving 124 BPM indie rock groove WAV and swipe SFX.")
    parser.add_argument("--out", default="", help="Output path for groove WAV")
    parser.add_argument("--sfx-dir", default="", help="Optional directory to write sfx-pass.wav and sfx-jam.wav")
    parser.add_argument("--skip-groove", action="store_true", help="Only generate SFX without regenerating groove.wav")
    args = parser.parse_args()

    if not args.skip_groove:
        if not args.out:
            parser.error("--out is required unless --skip-groove is set")
        generate_groove(Path(args.out))
        print(f"[music] wrote live rock track -> {args.out}", flush=True)

    if args.sfx_dir:
        sfx_root = Path(args.sfx_dir)
        generate_pass_sfx(sfx_root / "sfx-pass.wav")
        generate_jam_sfx(sfx_root / "sfx-jam.wav")
        print(f"[sfx] wrote sfx-pass.wav & sfx-jam.wav -> {sfx_root}", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
