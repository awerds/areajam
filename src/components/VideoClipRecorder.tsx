import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, Check, Film, Mic, RefreshCw, Square, Trash2, Upload, Video } from 'lucide-react';
import { deleteMediaBlob, getMediaObjectUrl, saveMediaBlob } from '../lib/mediaStorage';
import type { MediaClip } from '../types';

interface VideoClipRecorderProps {
  clips: MediaClip[];
  onAddClip: (clip: MediaClip) => void;
  onRemoveClip: (clipId: string) => void;
  maxClips?: number;
}

const MAX_SECONDS = 30;
const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

function chooseMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function measureFileDuration(url: string, isVideo: boolean): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement(isVideo ? 'video' : 'audio');
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      const sec = Number.isFinite(el.duration) ? Math.max(1, Math.round(el.duration)) : 10;
      resolve(Math.min(60, sec));
    };
    el.onerror = () => resolve(10);
    el.src = url;
  });
}

export function VideoClipRecorder({
  clips,
  onAddClip,
  onRemoveClip,
  maxClips = 4,
}: VideoClipRecorderProps) {
  const [studioTab, setStudioTab] = useState<'webcam' | 'upload'>('webcam');
  const [clipTitle, setClipTitle] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null);
  const [uploadBlob, setUploadBlob] = useState<{ blob: Blob; kind: 'video' | 'audio'; duration: number; name: string } | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [clipUrls, setClipUrls] = useState<Record<string, string>>({});

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | undefined>(undefined);
  const meterCtxRef = useRef<AudioContext | null>(null);
  const meterRafRef = useRef<number | undefined>(undefined);

  const stopStreamAndMeter = () => {
    window.clearInterval(timerRef.current);
    if (meterRafRef.current) window.cancelAnimationFrame(meterRafRef.current);
    if (meterCtxRef.current) {
      meterCtxRef.current.close().catch(() => {});
      meterCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setRecording(false);
    setMicLevel(0);
  };

  useEffect(() => {
    return () => {
      stopStreamAndMeter();
      if (recordedPreviewUrl) URL.revokeObjectURL(recordedPreviewUrl);
      if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    };
  }, []);

  // Load preview thumbnails for attached clips
  useEffect(() => {
    let active = true;
    const created: string[] = [];

    (async () => {
      const next: Record<string, string> = {};
      for (const clip of clips) {
        if (!clip.mediaId) continue;
        const url = await getMediaObjectUrl(clip.mediaId);
        if (url) {
          created.push(url);
          next[clip.id] = url;
        }
      }
      if (active) {
        setClipUrls(next);
      } else {
        created.forEach((u) => URL.revokeObjectURL(u));
      }
    })();

    return () => {
      active = false;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [clips]);

  const startCamera = async () => {
    setErrorMsg(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Camera recording is unavailable in this browser. Try uploading a clip instead.');
      return;
    }

    try {
      stopStreamAndMeter();
      if (recordedPreviewUrl) {
        URL.revokeObjectURL(recordedPreviewUrl);
        setRecordedPreviewUrl(null);
      }
      setRecordedBlob(null);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', aspectRatio: { ideal: 9 / 16 } },
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }

      streamRef.current = stream;
      setCameraActive(true);

      requestAnimationFrame(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play().catch(() => {});
        }
      });

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx && stream.getAudioTracks().length > 0) {
        const ctx = new AudioCtx();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        src.connect(analyser);
        meterCtxRef.current = ctx;
        const data = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (!meterCtxRef.current) return;
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          setMicLevel(Math.min(100, Math.round((sum / data.length / 160) * 100)));
          meterRafRef.current = window.requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }
    } catch {
      setErrorMsg('Camera or microphone permission was blocked. Allow access or upload a clip file.');
    }
  };

  const stopRecording = () => {
    window.clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setRecording(false);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    setErrorMsg(null);
    chunksRef.current = [];
    setSeconds(0);

    try {
      const mimeType = chooseMimeType();
      const recorder = mimeType
        ? new MediaRecorder(streamRef.current, { mimeType })
        : new MediaRecorder(streamRef.current);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedPreviewUrl(url);
        stopStreamAndMeter();
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);

      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch {
      setErrorMsg('Unable to start webcam recording on this device. Try uploading a clip.');
    }
  };

  const saveRecordedClip = async () => {
    if (!recordedBlob) return;
    const id = `clip-${Date.now()}`;
    const mediaId = `media-${id}`;
    await saveMediaBlob(mediaId, recordedBlob);

    onAddClip({
      id,
      mediaId,
      title: clipTitle.trim() || `Intro clip ${clips.length + 1}`,
      kind: 'video',
      durationSec: Math.max(2, seconds || 6),
    });

    if (recordedPreviewUrl) URL.revokeObjectURL(recordedPreviewUrl);
    setRecordedBlob(null);
    setRecordedPreviewUrl(null);
    setClipTitle('');
    setSeconds(0);
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      setErrorMsg('Choose a clip under 40 MB so it loads quickly for local players.');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    if (!isVideo && !isAudio) {
      setErrorMsg('Please select a video or audio clip file (MP4, WebM, MOV, MP3, WAV).');
      return;
    }

    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    const url = URL.createObjectURL(file);
    const duration = await measureFileDuration(url, isVideo);
    setUploadPreviewUrl(url);
    setUploadBlob({
      blob: file,
      kind: isVideo ? 'video' : 'audio',
      duration,
      name: file.name.replace(/\.[^.]+$/, ''),
    });
    if (!clipTitle.trim()) {
      setClipTitle(file.name.replace(/\.[^.]+$/, '').slice(0, 32));
    }
  };

  const saveUploadedClip = async () => {
    if (!uploadBlob) return;
    const id = `clip-${Date.now()}`;
    const mediaId = `media-${id}`;
    await saveMediaBlob(mediaId, uploadBlob.blob);

    onAddClip({
      id,
      mediaId,
      title: clipTitle.trim() || uploadBlob.name || `Clip ${clips.length + 1}`,
      kind: uploadBlob.kind,
      durationSec: uploadBlob.duration,
    });

    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    setUploadBlob(null);
    setUploadPreviewUrl(null);
    setClipTitle('');
  };

  const handleDeleteSavedClip = async (clip: MediaClip) => {
    if (clip.mediaId) {
      await deleteMediaBlob(clip.mediaId);
    }
    onRemoveClip(clip.id);
  };

  const atLimit = clips.length >= maxClips;

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-bold">
            Intro video and performance clips ({clips.length}/{maxClips})
          </h3>
          <p className="text-xs text-[var(--muted)]">
            Cards auto-play your first clip in the feed so local players hear your vibe immediately
          </p>
        </div>

        <div className="inline-flex rounded-full border border-[var(--border)] bg-black/30 p-0.5">
          <button
            type="button"
            onClick={() => setStudioTab('webcam')}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition"
            style={
              studioTab === 'webcam'
                ? { backgroundColor: 'var(--ink)', color: 'var(--bg)' }
                : { color: 'var(--muted)' }
            }
          >
            <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Record webcam</span>
          </button>
          <button
            type="button"
            onClick={() => {
              stopStreamAndMeter();
              setStudioTab('upload');
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition"
            style={
              studioTab === 'upload'
                ? { backgroundColor: 'var(--ink)', color: 'var(--bg)' }
                : { color: 'var(--muted)' }
            }
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Upload file</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-[var(--err)] bg-[var(--err-bg)] px-3 py-2.5 text-xs text-[var(--err)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!atLimit && (
        <div className="space-y-3">
          <div>
            <label htmlFor="clip-title-input" className="mb-1 block text-xs font-semibold">
              Clip label (optional)
            </label>
            <input
              id="clip-title-input"
              type="text"
              maxLength={36}
              value={clipTitle}
              onChange={(e) => setClipTitle(e.target.value)}
              placeholder="e.g. Intro & pedalboard demo"
              className="field-control"
            />
          </div>

          {studioTab === 'webcam' && (
            <div className="space-y-3">
              {!cameraActive && !recordedPreviewUrl && (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border-strong)] bg-white/5 px-4 py-6 text-sm font-semibold transition hover:bg-white/10"
                >
                  <Video className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                  <span>Open camera to record 30s intro</span>
                </button>
              )}

              {cameraActive && (
                <div className="space-y-3">
                  <div className="reel-aspect relative mx-auto max-w-[15rem] overflow-hidden rounded-2xl border border-white/15 bg-black">
                    <video
                      ref={liveVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full -scale-x-100 object-cover"
                    />
                    <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-full bg-black/65 px-3 py-1.5 text-xs text-white backdrop-blur-md">
                      <span className="inline-flex items-center gap-1.5">
                        <Mic className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                        <span className="inline-block h-1.5 w-14 overflow-hidden rounded-full bg-white/20">
                          <span
                            className="block h-full bg-[var(--ok)] transition-[width] duration-75"
                            style={{ width: `${micLevel}%` }}
                          />
                        </span>
                      </span>
                      <span className="font-semibold">
                        {seconds}s / {MAX_SECONDS}s
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2.5">
                    {!recording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--jam)] px-5 py-2.5 text-xs font-bold text-white"
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-white" />
                        <span>Start recording</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--err)] px-5 py-2.5 text-xs font-bold text-white"
                      >
                        <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        <span>Stop ({seconds}s)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={stopStreamAndMeter}
                      className="rounded-full border border-[var(--border)] bg-white/5 px-4 py-2.5 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {recordedPreviewUrl && recordedBlob && (
                <div className="space-y-3">
                  <div className="reel-aspect mx-auto max-w-[15rem] overflow-hidden rounded-2xl border border-white/15 bg-black">
                    <video
                      src={recordedPreviewUrl}
                      controls
                      playsInline
                      loop
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => void startCamera()}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white/5 px-4 py-2 text-xs font-semibold"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Retake</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveRecordedClip()}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ok)] px-5 py-2 text-xs font-bold text-[#041d12]"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Add to profile</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {studioTab === 'upload' && (
            <div className="space-y-3">
              <label
                htmlFor="clip-upload-input"
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[var(--border-strong)] bg-white/5 px-4 py-5 text-center text-xs transition hover:bg-white/10"
              >
                <Film className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
                <span className="font-semibold text-[var(--ink)]">
                  Choose video or audio file (MP4, WebM, MOV, MP3, WAV)
                </span>
                <span className="text-[var(--muted)]">Stored locally in your browser up to 40 MB</span>
                <input
                  id="clip-upload-input"
                  type="file"
                  accept="video/*,audio/*"
                  onChange={(e) => void handleFilePick(e)}
                  className="sr-only"
                />
              </label>

              {uploadPreviewUrl && uploadBlob && (
                <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-black/30 p-3">
                  {uploadBlob.kind === 'video' ? (
                    <video
                      src={uploadPreviewUrl}
                      controls
                      playsInline
                      className="mx-auto max-h-56 rounded-xl"
                    />
                  ) : (
                    <audio src={uploadPreviewUrl} controls className="w-full" />
                  )}
                  <button
                    type="button"
                    onClick={() => void saveUploadedClip()}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--ok)] px-4 py-2.5 text-xs font-bold text-[#041d12]"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>Attach uploaded clip ({uploadBlob.duration}s)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {clips.length > 0 && (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {clips.map((clip, idx) => (
            <li
              key={clip.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-black/30 p-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {clip.kind === 'video' && clipUrls[clip.id] ? (
                  <video
                    src={clipUrls[clip.id]}
                    muted
                    playsInline
                    className="h-12 w-9 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="inline-flex h-12 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[var(--accent)]">
                    <Film className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[var(--ink)]">{clip.title}</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    Clip {idx + 1}, {clip.kind}, {clip.durationSec}s
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleDeleteSavedClip(clip)}
                aria-label={`Remove ${clip.title}`}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-white/5 text-[var(--err)] hover:bg-white/10"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
