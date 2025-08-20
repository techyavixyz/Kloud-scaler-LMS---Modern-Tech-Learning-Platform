import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize, Settings, Clock, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

interface Playlist {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  videos: PlaylistVideo[];
  createdBy: { username: string };
}

interface PlaylistVideo {
  title: string;
  src: string;
  duration?: string;
  order: number;
  fileId?: string;
}

type LevelInfo = {
  index: number;
  height: number | null;
  bitrate: number | null;
  label: string; // e.g., "1080p (3.2 Mbps)"
};

const toMbps = (bps?: number | null) =>
  bps && bps > 0 ? `${(bps / 1_000_000).toFixed(1)} Mbps` : '';

const PlaylistPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { id } = useParams();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  const [hls, setHls] = useState<any>(null);
  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number>(-1); // -1 = Auto
  const [usesNativeHls, setUsesNativeHls] = useState(false);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      // Prevent default behavior when video is focused or when target is body
      if (e.target === document.body || videoRef.current.contains(e.target as Node)) {
        switch (e.code) {
          case 'Space':
            e.preventDefault();
            togglePlay();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            skipTime(-10);
            break;
          case 'ArrowRight':
            e.preventDefault();
            skipTime(10);
            break;
          case 'ArrowUp':
            e.preventDefault();
            adjustVolume(0.1);
            break;
          case 'ArrowDown':
            e.preventDefault();
            adjustVolume(-0.1);
            break;
          case 'KeyM':
            e.preventDefault();
            toggleMute();
            break;
          case 'KeyF':
            e.preventDefault();
            toggleFullscreen();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (id) {
      loadSinglePlaylist(id);
    } else {
      loadPlaylists();
    }
    return () => {
      if (hls) hls.destroy();
    };
  }, [id]);

  const loadPlaylists = async () => {
    try {
      setIsLoading(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await axios.get(`${backendUrl}/api/playlists`);
      setPlaylists(response.data || []);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSinglePlaylist = async (playlistId: string) => {
    try {
      setIsLoading(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await axios.get(`${backendUrl}/api/playlists/${playlistId}`);
      setSelectedPlaylist(response.data);
      if (response.data?.videos?.length) {
        loadVideo(0);
      } else {
        setVideoError('No videos found in this playlist');
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
      setVideoError('Failed to load playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const buildLevelList = (rawLevels: any[]): LevelInfo[] => {
    const map = new Map<number | 'audioOnly', { index: number; height: number | null; bitrate: number | null }>();
    rawLevels.forEach((lvl, idx) => {
      const h = typeof lvl.height === 'number' && lvl.height > 0 ? lvl.height : null;
      const key = h ?? 'audioOnly';
      const prev = map.get(key);
      if (!prev || (lvl.bitrate ?? 0) > (prev.bitrate ?? 0)) {
        map.set(key, { index: idx, height: h, bitrate: lvl.bitrate ?? null });
      }
    });

    const list: LevelInfo[] = Array.from(map.values())
      .sort((a, b) => {
        if (a.height === null && b.height !== null) return 1;
        if (b.height === null && a.height !== null) return -1;
        if (a.height !== null && b.height !== null) return b.height - a.height;
        return (b.bitrate ?? 0) - (a.bitrate ?? 0);
      })
      .map(({ index, height, bitrate }) => ({
        index,
        height,
        bitrate,
        label:
          height
            ? `${height}p${bitrate ? ` (${toMbps(bitrate)})` : ''}`
            : `Audio Only${bitrate ? ` (${toMbps(bitrate)})` : ''}`,
      }));

    return list;
  };

  const attachHls = (src: string) => {
    const video = videoRef.current!;
    const HlsLib: any = (window as any).Hls;

    if (!HlsLib) {
      setVideoError('HLS.js not loaded. Please refresh the page.');
      return;
    }

    const newHls = new HlsLib({
      enableWorker: true,
      capLevelToPlayerSize: true,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      startLevel: -1,
      debug: false
    });

    newHls.attachMedia(video);
    newHls.loadSource(src);

    newHls.on(HlsLib.Events.MANIFEST_PARSED, (_e: any, data: any) => {
      const list = buildLevelList(newHls.levels ?? data.levels ?? []);
      setLevels(list);
      newHls.currentLevel = -1;
      setSelectedLevel(-1);
      setVideoError(null);
      setIsPlaying(false); // keep paused until user clicks Play
      console.log(`✅ HLS manifest loaded with ${list.length} quality levels`);
    });

    newHls.on(HlsLib.Events.LEVEL_SWITCHED, (_e: any, data: any) => {
      if (newHls.autoLevelEnabled) {
        setSelectedLevel(-1);
      } else {
        setSelectedLevel(data.level);
      }
    });

    newHls.on(HlsLib.Events.ERROR, (_e: any, data: any) => {
      console.error('HLS Error:', data);
      if (data?.fatal) {
        switch (data.type) {
          case HlsLib.ErrorTypes.NETWORK_ERROR:
            newHls.startLoad();
            break;
          case HlsLib.ErrorTypes.MEDIA_ERROR:
            newHls.recoverMediaError();
            break;
          default:
            setVideoError('Video playback error. Please try refreshing.');
            newHls.destroy();
            break;
        }
      }
    });

    setHls(newHls);
  };

  const loadVideo = (index: number) => {
    if (!selectedPlaylist?.videos) return;
    const item = selectedPlaylist.videos[index];
    if (!item || !videoRef.current) return;

    const video = videoRef.current;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const src = `${backendUrl}${item.src}`;

    console.log(`Loading video ${index + 1}: ${item.title}`);

    if (hls) {
      hls.destroy();
      setHls(null);
    }
    setLevels([]);
    setSelectedLevel(-1);
    setShowQualityMenu(false);
    setVideoError(null);

    const HlsLib = (window as any).Hls;
    if (HlsLib && HlsLib.isSupported()) {
      setUsesNativeHls(false);
      attachHls(src);
      setCurrentIndex(index);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      setUsesNativeHls(true);
      video.src = src;
      const onLoaded = () => {
        setCurrentIndex(index);
        setVideoError(null);
        setIsPlaying(false); // paused until user clicks Play
        console.log('✅ Native HLS video loaded');
      };
      video.addEventListener('loadedmetadata', onLoaded, { once: true });
    } else {
      setVideoError('HLS video playback is not supported in this browser.');
    }
  };

  // Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleEnded = () => {
      if (selectedPlaylist && currentIndex < selectedPlaylist.videos.length - 1) {
        loadVideo(currentIndex + 1);
      }
    };
    const handleError = () => {
      setVideoError('Video playback error occurred');
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [currentIndex, selectedPlaylist?.videos.length]);

  // Controls
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
    } else {
      v.pause();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    v.currentTime = pos * duration;
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, pos));
    v.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const adjustVolume = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    const newVolume = Math.max(0, Math.min(1, v.volume + delta));
    v.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isMuted) {
      v.volume = volume;
      setIsMuted(false);
    } else {
      v.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else v.requestFullscreen();
  };

  const skipTime = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime += seconds;
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const selectAuto = () => {
    if (!hls) return;
    hls.currentLevel = -1;
    setSelectedLevel(-1);
    setShowQualityMenu(false);
  };

  const selectLevel = (levelIndex: number) => {
    if (!hls) return;
    hls.currentLevel = levelIndex;
    setSelectedLevel(levelIndex);
    setShowQualityMenu(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading playlists...</div>
      </div>
    );
  }

  if (!id) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Live Class Recordings</h1>
            <p className="text-gray-300">Choose from our collection of recorded live classes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {playlists.map((playlist) => (
              <Link
                key={playlist._id}
                to={`/live-class-recording/${playlist._id}`}
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-cyan-500/50"
              >
                <div className="relative">
                  <img
                    src={playlist.thumbnail}
                    alt={playlist.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {playlist.videos?.length || 0} videos
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {playlist.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {playlist.description}
                  </p>
                  <div className="text-xs text-gray-400">
                    By {playlist.createdBy.username}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {playlists.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-4">No playlists available</div>
              <p className="text-gray-500">Check back later for new content</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!selectedPlaylist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Playlist not found</div>
          <Link
            to="/live-class-recording"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Back to Playlists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          to="/live-class-recording"
          className="inline-flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Playlists</span>
        </Link>

        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{selectedPlaylist.title}</h1>
          <p className="text-gray-300">{selectedPlaylist.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-3 xl:col-span-3">
            <div className="relative bg-black rounded-xl overflow-hidden group" style={{ aspectRatio: '16/9' }}>
              {videoError && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                  <div className="text-center text-white">
                    <div className="text-xl mb-4">⚠️ {videoError}</div>
                    <button
                      onClick={() => {
                        setVideoError(null);
                        if (selectedPlaylist?.videos?.length) {
                          loadVideo(currentIndex);
                        }
                      }}
                      className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
              
              <video
                ref={videoRef}
                className="w-full h-full bg-black object-contain"
                poster={selectedPlaylist.thumbnail}   
                playsInline
                controls={false}
                tabIndex={0}
              />

              {/* Center Play/Pause Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <button
                  onClick={togglePlay}
                  className="bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-all pointer-events-auto"
                >
                  {isPlaying ? <Pause className="h-12 w-12" /> : <Play className="h-12 w-12" />}
                </button>
              </div>

              {/* Custom Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="mb-4">
                  <div className="relative h-2 bg-white/20 rounded-full cursor-pointer" onClick={handleSeek}>
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button onClick={togglePlay} className="text-white hover:text-cyan-300 transition-colors">
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </button>

                    <button onClick={() => skipTime(-10)} className="text-white hover:text-cyan-300 transition-colors">
                      <SkipBack className="h-5 w-5" />
                    </button>

                    <button onClick={() => skipTime(10)} className="text-white hover:text-cyan-300 transition-colors">
                      <SkipForward className="h-5 w-5" />
                    </button>

                    <div className="flex items-center space-x-2 text-white text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button onClick={toggleMute} className="text-white hover:text-cyan-300 transition-colors">
                        {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </button>
                      <div className="w-20 h-1 bg-white/20 rounded-full cursor-pointer" onClick={handleVolumeChange}>
                        <div className="h-full bg-white rounded-full" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
                      </div>
                      <span className="text-xs text-white/70 min-w-[3ch]">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                    </div>

                    {!usesNativeHls && (
                      <div className="relative">
                        <button onClick={() => setShowQualityMenu((v) => !v)} className="text-white hover:text-cyan-300 transition-colors">
                          <Settings className="h-5 w-5" />
                        </button>
                        {showQualityMenu && (
                          <div className="absolute bottom-12 right-0 bg-gray-900 border border-white/10 rounded-lg shadow-lg z-50 min-w-[160px] p-2">
                            <div className="text-white text-sm font-medium mb-2">Quality</div>
                            <button
                              onClick={selectAuto}
                              className={`block w-full text-left px-2 py-1 text-sm rounded ${selectedLevel === -1 ? 'bg-white/20 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                            >
                              Auto
                            </button>
                            {levels.map((lvl) => (
                              <button
                                key={lvl.index}
                                onClick={() => selectLevel(lvl.index)}
                                className={`block w-full text-left px-2 py-1 text-sm rounded ${selectedLevel === lvl.index ? 'bg-white/20 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                              >
                                {lvl.label}
                              </button>
                            ))}
                            {levels.length === 0 && (
                              <div className="px-2 py-1 text-xs text-gray-400">No variants found</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <button onClick={toggleFullscreen} className="text-white hover:text-cyan-300 transition-colors">
                      <Maximize className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {selectedPlaylist.videos[currentIndex] && (
              <div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-2">
                  {selectedPlaylist.videos[currentIndex].title}
                </h2>
                <p className="text-gray-300">
                  Video {currentIndex + 1} of {selectedPlaylist.videos.length}
                </p>
                <div className="mt-4 text-sm text-gray-400">
                  <p><strong>Keyboard shortcuts:</strong></p>
                  <p>Space: Play/Pause • ←/→: Skip 10s • ↑/↓: Volume • M: Mute • F: Fullscreen</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 xl:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">Playlist Content</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {selectedPlaylist.videos.map((video, index) => (
                  <div
                    key={index}
                    onClick={() => loadVideo(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      index === currentIndex
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded ${index === currentIndex ? 'bg-cyan-500' : 'bg-white/10'}`}>
                        <Play className={`h-4 w-4 ${index === currentIndex ? 'text-white' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${index === currentIndex ? 'text-white' : 'text-gray-300'}`}>
                          {video.title || `Video ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {video.duration || 'Video'} • {index + 1} of {selectedPlaylist.videos.length}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistPage;
