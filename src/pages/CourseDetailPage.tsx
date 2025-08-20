import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize, Settings, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  playlist: Array<{
    title: string;
    src: string;
    duration?: string;
    order: number;
  }>;
  createdBy: { username: string };
}

const CourseDetailPage = () => {
  const { id } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hls, setHls] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
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
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:3001/api/courses/${id}`);
      setCourse(response.data);
      setIsEnrolled(true);
      
      // Load first video if playlist exists
      if (response.data.playlist && response.data.playlist.length > 0) {
        loadVideo(0);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        setError('You need to enroll in this course to access the content.');
      } else {
        setError('Error loading course');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const enrollInCourse = async () => {
    try {
      await axios.post(`http://localhost:3001/api/courses/${id}/enroll`);
      setIsEnrolled(true);
      loadCourse();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error enrolling in course');
    }
  };

  const loadVideo = (index: number) => {
    if (!course?.playlist[index] || !videoRef.current) return;

    const video = videoRef.current;
    const src = `http://localhost:3001${course.playlist[index].src}`;

    // Destroy existing HLS instance
    if (hls) {
      hls.destroy();
    }

    // Check if HLS.js is supported
    if ((window as any).Hls && (window as any).Hls.isSupported()) {
      const newHls = new (window as any).Hls();
      newHls.loadSource(src);
      newHls.attachMedia(video);
      
      newHls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
        setCurrentVideoIndex(index);
        video.play();
        setIsPlaying(true);
      });

      setHls(newHls);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setCurrentVideoIndex(index);
        video.play();
        setIsPlaying(true);
      });
    }
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleEnded = () => {
      if (course && currentVideoIndex < course.playlist.length - 1) {
        loadVideo(currentVideoIndex + 1);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentVideoIndex, course]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
  };

  const skipTime = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
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
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      v.requestFullscreen();
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading course...</div>
      </div>
    );
  }

  if (error && !isEnrolled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={enrollInCourse}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all"
          >
            Enroll in Course
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Course not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {course.title}
          </h1>
          <p className="text-gray-300 mb-4">{course.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span className="bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">
              {course.category}
            </span>
            <span>{course.difficulty}</span>
            <span>{course.duration}</span>
            <span>By {course.createdBy.username}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <div className="relative bg-black rounded-xl overflow-hidden group" style={{ aspectRatio: '16/9' }}>
              <video
                ref={videoRef}
                className="w-full h-full bg-black object-contain"
                poster="https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg"
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
                {/* Timeline */}
                <div className="mb-4">
                  <div 
                    className="relative h-2 bg-white/20 rounded-full cursor-pointer"
                    onClick={handleSeek}
                  >
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={togglePlay}
                      className="text-white hover:text-cyan-300 transition-colors"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
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
                    <button className="text-white hover:text-cyan-300 transition-colors">
                      <Settings className="h-5 w-5" />
                    </button>
                    <button className="text-white hover:text-cyan-300 transition-colors">
                      <Maximize className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Video Info */}
            {course.playlist[currentVideoIndex] && (
              <div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-2">
                  {course.playlist[currentVideoIndex].title}
                </h2>
                <p className="text-gray-300">
                  Video {currentVideoIndex + 1} of {course.playlist.length}
                </p>

              </div>
            )}
          </div>

          {/* Playlist Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">Course Content</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {course.playlist.map((video, index) => (
                  <div
                    key={index}
                    onClick={() => loadVideo(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      index === currentVideoIndex 
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30' 
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded ${
                        index === currentVideoIndex ? 'bg-cyan-500' : 'bg-white/10'
                      }`}>
                        {index < currentVideoIndex ? (
                          <CheckCircle className="h-4 w-4 text-white" />
                        ) : (
                          <Play className={`h-4 w-4 ${
                            index === currentVideoIndex ? 'text-white' : 'text-gray-400'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          index === currentVideoIndex ? 'text-white' : 'text-gray-300'
                        }`}>
                          {video.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {video.duration || 'Video'} • Lesson {index + 1}
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

export default CourseDetailPage;