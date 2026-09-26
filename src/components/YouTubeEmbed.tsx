import React, { useEffect, useRef } from 'react';
import {
  Youtube,
  X,
  Minimize2,
  ExternalLink,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubeEmbedProps {
  youtubeId: string | null;
  videoTitle: string | null;
  isPlaying: boolean;
  onUnload: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  youtubeId,
  videoTitle,
  isPlaying,
  onUnload,
  isExpanded,
  onToggleExpand,
}) => {
  const [isApiReady, setIsApiReady] = React.useState(false);
  const playerRef = useRef<any>(null);
  const containerId = 'youtube-iframe-mount';

  // 1. Ensure YouTube Iframe API is loaded
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        setIsApiReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    const existingScript = document.getElementById('youtube-iframe-script');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      setIsApiReady(true);
    };

    return () => clearInterval(checkInterval);
  }, []);

  // 2. Initialize or re-cue player when youtubeId or isApiReady changes
  useEffect(() => {
    if (!isApiReady || !youtubeId) {
      if (playerRef.current) {
        try {
          playerRef.current.destroy?.();
        } catch {}
        playerRef.current = null;
      }
      return;
    }

    // Initialize YouTube Player
    try {
      if (playerRef.current) {
        // Just load the new video
        playerRef.current.loadVideoById?.(youtubeId);
      } else {
        const player = new window.YT.Player(containerId, {
          videoId: youtubeId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              playerRef.current = event.target;
              audioEngine.attachYouTubePlayer(event.target);
            },
            onStateChange: (event: any) => {
              audioEngine.handleYouTubeStateChange(event.data);
            },
            onError: (err: any) => {
              console.warn('YouTube Player Event Error:', err);
            },
          },
        });
        playerRef.current = player;
      }
    } catch (err) {
      console.warn('Error setting up YouTube player:', err);
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy?.();
        } catch {}
        playerRef.current = null;
      }
    };
  }, [isApiReady, youtubeId]);

  if (!youtubeId) return null;

  const displayTitle = videoTitle
    ? videoTitle.replace(/^YouTube:\s*/, '')
    : `Video ID: ${youtubeId}`;

  return (
    <div
      id="docked-youtube-container"
      className={`fixed right-4 z-[100] bg-slate-950/98 border border-rose-500/50 rounded-t-xl shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300 flex flex-col ${
        isExpanded
          ? 'bottom-12 w-72 sm:w-80 h-52 sm:h-56 opacity-100 pointer-events-auto'
          : 'bottom-0 pointer-events-none opacity-0 w-1 h-1'
      }`}
    >
      {/* Title / Header Bar */}
      <div className="h-9 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-4 h-4 rounded bg-rose-600/20 border border-rose-500/40 flex items-center justify-center shrink-0">
            <Youtube className="w-3 h-3 text-rose-500" />
          </div>
          <span
            className="text-[11px] font-semibold text-white truncate max-w-[140px] sm:max-w-[170px]"
            title={displayTitle}
          >
            {displayTitle}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <a
            href={`https://www.youtube.com/watch?v=${youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in YouTube"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onToggleExpand}
            title="Collapse to lower bar"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Minimize2 className="w-3 h-3" />
          </button>
          <button
            onClick={onUnload}
            title="Eject YouTube Track"
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Video Iframe Container */}
      <div className="w-full flex-1 bg-black relative">
        <div id={containerId} className="w-full h-full" />
      </div>
    </div>
  );
};
