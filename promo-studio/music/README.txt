Default Studio Backing Track
----------------------------
- File: modern-rock-the-root.mp3 ("The Root" by Michael Ramir C.)
- License: Mixkit Stock Music Free License (https://mixkit.co/license/#musicFree)
  Cleared for YouTube, Shorts, social media promos, and commercial web videos
  with no attribution required.

Swapping or Customizing Tracks
------------------------------
Drop any studio backing track (.mp3, .wav, .m4a, .aac, or .ogg) into this
folder. On render, generate.mjs automatically picks the alphabetically first
audio file found here and auto-ducks it cleanly behind the live musician clip
cards during swipe scenes so it underscores non-swipe sections cleanly.

Or override for a single render:
  npm run render -- --music=/path/to/your-track.mp3
  npm run render -- --music=none
  npm run render -- --music=synth
