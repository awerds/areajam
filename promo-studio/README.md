# AreaJam Promo Studio (`$0` Automated Video Generator)

Zero-cost, zero-watermark local video studio for generating YouTube Shorts (`9:16`) and horizontal YouTube walkthroughs (`16:9`) directly from your real screenshots in `../docs/screenshots/`.

- **Renderer:** [Remotion 4](https://www.remotion.dev/) (handles Chromium + FFmpeg automatically)
- **Default AI Voiceover ($0):** `edge-tts` neural voices with exact millisecond word timestamps for animated captions
- **Optional Pro Voiceover:** ElevenLabs (`with-timestamps` endpoint via `ELEVENLABS_API_KEY`) or offline macOS `say`
- **Backing Music:** Procedural 96 BPM warm electric-piano pocket groove (or pass `--music path/to/your-track.mp3`)

---

## 1. One-Time Setup

From inside `promo-studio/`:

```bash
cd promo-studio
npm install
npm run setup:tts
```

---

## 2. Quick Renders

Render the default 9:16 YouTube Short (`out/areajam-general-short.mp4`):

```bash
npm run render
```

Render a hyper-local city + instrument Short in one command:

```bash
node scripts/generate.mjs --city="Nashville" --role="Drummers"
node scripts/generate.mjs --city="Austin" --role="Guitarists"
node scripts/generate.mjs --city="Chicago" --role="Bassists"
```

Render the full `1920x1080` horizontal YouTube walkthrough (`out/areajam-youtube-walkthrough.mp4`):

```bash
npm run render:walkthrough
```

Open the interactive Remotion preview UI to scrub scenes live:

```bash
npm run studio
```

---

## 3. Custom Voices, Speed, Music & ElevenLabs

Pick a different `$0` Edge-TTS voice or speaking speed:

```bash
node scripts/generate.mjs --city="Portland" --role="Vocalists" --voice="en-US-AvaMultilingualNeural" --rate="+8%"
```

Popular Edge-TTS voices:
- `en-US-AndrewMultilingualNeural` (warm, natural male)
- `en-US-AvaMultilingualNeural` (warm, energetic female)
- `en-US-BrianMultilingualNeural` (crisp conversational male)
- `en-US-EmmaMultilingualNeural` (bright friendly female)

Use **ElevenLabs** instead of Edge-TTS:

```bash
export ELEVENLABS_API_KEY="your_key_here"
node scripts/generate.mjs --city="Nashville" --role="Drummers" --tts=elevenlabs
```

Use your own guitar/drum track behind the voiceover (or disable music with `--music=none`):

```bash
node scripts/generate.mjs --city="Austin" --role="Guitarists" --music="/path/to/your-riff.mp3"
```

Create your own custom multi-scene promo by duplicating `presets/general-short.json` and passing `--preset=presets/my-custom.json`.
