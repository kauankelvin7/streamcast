import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { createLiveHlsConfig } from '../../../utils/hlsConfig';

interface LiveTvPlayerProps {
  url: string;
  autoPlay?: boolean;
  muted?: boolean;
}

export default function LiveTvPlayer({ url, autoPlay = true, muted = false }: LiveTvPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    let hls: InstanceType<typeof Hls> | null = null;

    if (Hls.isSupported() && (url.includes('.m3u8') || url.includes('master') || url.includes('smil'))) {
      hls = new Hls({
        ...createLiveHlsConfig(),
        startLevel: -1,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch((err) => {
            console.warn('Live playback autoplay blocked:', err);
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_event: string, data: { fatal?: boolean; type?: string }) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('HLS Network Error, attempting recovery...');
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('HLS Media Error, attempting recovery...');
              hls?.recoverMediaError();
              break;
            default:
              console.error('HLS Unrecoverable Error:', data);
              hls?.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        if (autoPlay) video.play().catch(() => {});
      });
    } else {
      video.src = url;
      if (autoPlay) video.play().catch(() => {});
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [url, autoPlay]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden transform-gpu"
    >
      <video
        ref={videoRef}
        autoPlay={autoPlay}
        muted={muted}
        controls
        playsInline
        className="w-full h-full object-contain"
        crossOrigin="anonymous"
      />
    </div>
  );
}
