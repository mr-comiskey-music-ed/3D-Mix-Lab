export type AudioSourceType = 'none' | 'audio' | 'youtube';

export interface AudioSourceInfo {
  type: AudioSourceType;
  name: string | null;
  youtubeId: string | null;
  duration: number;
}

export type AudioSubscriber = (
  time: number,
  isPlaying: boolean,
  source: AudioSourceInfo
) => void;

export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

class VisualMixAudioEngine {
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private songDuration: number = 210; // Default 3:30 (210s)
  private intervalId: number | null = null;
  private listeners: Set<AudioSubscriber> = new Set();

  private sourceType: AudioSourceType = 'none';
  private sourceName: string | null = null;
  private youtubeId: string | null = null;

  // Local audio element (and the temporary URL for an uploaded file, freed on unload)
  private audioEl: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;

  // YouTube player instance from window.YT
  private ytPlayer: any = null;
  private ytPollingIntervalId: number | null = null;
  // Play was pressed before the YouTube player finished loading; start as soon as it's ready.
  private ytPlayWhenReady = false;

  constructor() {
    // Clean audio engine without procedural synthesizer
  }

  public subscribe(callback: AudioSubscriber): () => void {
    this.listeners.add(callback);
    callback(this.currentTime, this.isPlaying, this.getSourceInfo());
    return () => this.listeners.delete(callback);
  }

  private notify() {
    const info = this.getSourceInfo();
    this.listeners.forEach((cb) => cb(this.currentTime, this.isPlaying, info));
  }

  public getSourceInfo(): AudioSourceInfo {
    return {
      type: this.sourceType,
      name: this.sourceName,
      youtubeId: this.youtubeId,
      duration: this.songDuration,
    };
  }

  public setSongDuration(duration: number) {
    if (isNaN(duration) || duration <= 0) return;
    this.songDuration = Math.round(duration);
    if (this.currentTime > this.songDuration) {
      this.currentTime = this.songDuration;
    }
    this.notify();
  }

  public getSongDuration(): number {
    return this.songDuration;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // --- YouTube Player Attachment & Handlers ---
  public attachYouTubePlayer(player: any) {
    this.ytPlayer = player;

    try {
      const dur = player.getDuration?.();
      if (dur && !isNaN(dur) && dur > 0) {
        this.setSongDuration(dur);
      }
      const title = player.getVideoData?.()?.title;
      if (title && (!this.sourceName || this.sourceName.startsWith('YouTube:'))) {
        this.sourceName = `YouTube: ${title}`;
      }
      if (this.currentTime > 0) player.seekTo?.(this.currentTime, true);
      if (this.ytPlayWhenReady) {
        this.ytPlayWhenReady = false;
        player.playVideo?.();
        this.startYouTubePolling();
      }
    } catch {
      // Ignore if not yet available
    }
    this.notify();
  }

  public handleYouTubeStateChange(state: number) {
    // window.YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    if (state === 1) {
      // Playing
      this.isPlaying = true;
      this.startYouTubePolling();
      const dur = this.ytPlayer?.getDuration?.();
      if (dur && !isNaN(dur) && dur > 0 && Math.abs(dur - this.songDuration) > 1) {
        this.setSongDuration(dur);
      }
    } else if (state === 2) {
      // Paused
      this.isPlaying = false;
      this.stopYouTubePolling();
    } else if (state === 0) {
      // Ended
      this.isPlaying = false;
      this.stopYouTubePolling();
      this.currentTime = 0;
      try {
        this.ytPlayer?.seekTo(0, true);
      } catch {}
    }
    this.notify();
  }

  private startYouTubePolling() {
    this.stopYouTubePolling();
    this.ytPollingIntervalId = window.setInterval(() => {
      if (!this.ytPlayer) return;
      try {
        const curr = this.ytPlayer.getCurrentTime?.();
        const dur = this.ytPlayer.getDuration?.();
        const state = this.ytPlayer.getPlayerState?.();
        if (typeof curr === 'number' && !isNaN(curr)) {
          this.currentTime = curr;
        }
        // Trust the video: playing (1) or buffering (3) counts as playing; anything else doesn't.
        if (typeof state === 'number') {
          this.isPlaying = state === 1 || state === 3;
          if (state === 2 || state === 0) this.stopYouTubePolling();
        }
        if (typeof dur === 'number' && !isNaN(dur) && dur > 0 && Math.abs(dur - this.songDuration) > 1) {
          this.songDuration = Math.round(dur);
        }
        this.notify();
      } catch {}
    }, 100);
  }

  private stopYouTubePolling() {
    if (this.ytPollingIntervalId !== null) {
      clearInterval(this.ytPollingIntervalId);
      this.ytPollingIntervalId = null;
    }
  }

  // --- Transport Controls ---
  public play() {
    if (this.isPlaying) return;

    if (this.sourceType === 'youtube') {
      if (!this.ytPlayer) {
        // Video still loading: never fall back to the silent clock (that's what made the
        // playhead run while the video sat still). Start once the player is ready.
        this.ytPlayWhenReady = true;
        this.notify();
        return;
      }
      try {
        this.ytPlayer.playVideo();
      } catch (err) {
        console.warn('Could not play YouTube video:', err);
      }
      // "Playing" is set by the video itself (state change / polling), so if the browser
      // blocks playback the playhead doesn't run on its own.
      this.startYouTubePolling();
      this.notify();
      return;
    }

    if (this.sourceType === 'audio' && this.audioEl) {
      this.audioEl.play().catch((err) => {
        console.warn('Audio playback interrupted:', err);
      });
      this.isPlaying = true;
      this.startLocalAudioPolling();
      this.notify();
      return;
    }

    // Default timer mode (silent clock, no synth)
    this.isPlaying = true;
    const startRealTime = Date.now() - this.currentTime * 1000;
    this.intervalId = window.setInterval(() => {
      this.currentTime = (Date.now() - startRealTime) / 1000;
      if (this.currentTime >= this.songDuration) {
        this.currentTime = 0;
        this.pause();
        return;
      }
      this.notify();
    }, 50);

    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    this.ytPlayWhenReady = false;

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.sourceType === 'youtube' && this.ytPlayer) {
      try {
        this.ytPlayer.pauseVideo();
      } catch {}
      this.stopYouTubePolling();
    }

    if (this.sourceType === 'audio' && this.audioEl) {
      this.audioEl.pause();
      this.stopLocalAudioPolling();
    }

    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying || this.ytPlayWhenReady) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(seconds: number) {
    const target = Math.max(0, Math.min(this.songDuration, seconds));
    this.currentTime = target;

    if (this.sourceType === 'youtube' && this.ytPlayer) {
      try {
        this.ytPlayer.seekTo(target, true);
      } catch {}
    }

    if (this.sourceType === 'audio' && this.audioEl) {
      this.audioEl.currentTime = target;
    }

    if (this.sourceType === 'none' && this.isPlaying) {
      // Re-anchor start time for silent clock
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
      }
      const startRealTime = Date.now() - this.currentTime * 1000;
      this.intervalId = window.setInterval(() => {
        this.currentTime = (Date.now() - startRealTime) / 1000;
        if (this.currentTime >= this.songDuration) {
          this.currentTime = 0;
          this.pause();
          return;
        }
        this.notify();
      }, 50);
    }

    this.notify();
  }

  public jump(delta: number) {
    this.seek(this.currentTime + delta);
  }

  // --- Audio File Upload & Remote URL ---
  public loadAudioUrl(url: string, name?: string) {
    this.unloadCurrentMedia();

    const audio = new Audio(url);
    this.audioEl = audio;
    this.sourceType = 'audio';
    this.sourceName = name || url.split('/').pop() || 'Remote Audio Track';
    this.currentTime = 0;

    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && !isNaN(audio.duration)) {
        this.setSongDuration(audio.duration);
      }
    });

    audio.addEventListener('ended', () => {
      this.pause();
      this.seek(0);
    });

    this.notify();
  }

  public loadAudioFile(file: File) {
    this.unloadCurrentMedia();

    const url = URL.createObjectURL(file);
    this.objectUrl = url;
    const audio = new Audio(url);
    this.audioEl = audio;
    this.sourceType = 'audio';
    this.sourceName = file.name;
    this.currentTime = 0;

    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && !isNaN(audio.duration)) {
        this.setSongDuration(audio.duration);
      }
    });

    audio.addEventListener('ended', () => {
      this.pause();
      this.seek(0);
    });

    this.notify();
  }

  private startLocalAudioPolling() {
    this.stopLocalAudioPolling();
    this.intervalId = window.setInterval(() => {
      if (this.audioEl) {
        this.currentTime = this.audioEl.currentTime;
        if (this.audioEl.duration && !isNaN(this.audioEl.duration)) {
          this.songDuration = Math.round(this.audioEl.duration);
        }
        this.notify();
      }
    }, 60);
  }

  private stopLocalAudioPolling() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // --- YouTube Loading ---
  public loadYouTubeVideo(urlOrId: string): string | null {
    const id = extractYouTubeId(urlOrId);
    if (!id) return null;

    this.unloadCurrentMedia();

    this.sourceType = 'youtube';
    this.youtubeId = id;
    this.sourceName = `YouTube: ${id}`;
    this.currentTime = 0;
    this.isPlaying = false;

    this.notify();
    return id;
  }

  public unloadCurrentMedia() {
    this.pause();

    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = '';
      this.audioEl = null;
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.ytPlayWhenReady = false;

    this.stopYouTubePolling();
    this.stopLocalAudioPolling();

    this.sourceType = 'none';
    this.sourceName = null;
    this.youtubeId = null;
    this.ytPlayer = null;
    this.currentTime = 0;
    this.songDuration = 210; // Reset to standard 3:30

    this.notify();
  }
}

export const audioEngine = new VisualMixAudioEngine();
