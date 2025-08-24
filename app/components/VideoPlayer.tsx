'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { 
  Box, 
  Paper, 
  IconButton, 
  Slider, 
  Typography, 
  Stack,
  Fade,
  Switch,
  FormControlLabel
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import Forward5Icon from '@mui/icons-material/Forward5';
import Replay5Icon from '@mui/icons-material/Replay5';

import LoopIcon from '@mui/icons-material/Loop';
import RefreshIcon from '@mui/icons-material/Refresh';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { useAppContext } from '../context/AppContext';
import { Subtitle } from '../utils/subtitleParser';

interface VideoPlayerProps {
  onReset?: () => void;
}

export default function VideoPlayer({ onReset }: VideoPlayerProps) {
  const {
    mediaData,
    currentTime,
    isPlaying,
    activeSubs,
    setCurrentTime,
    setIsPlaying,
    setActiveSubs
  } = useAppContext();
  
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [localTime, setLocalTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [mouseMoving, setMouseMoving] = useState(false);
  const mouseMoveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [stopAtSentenceEnd, setStopAtSentenceEnd] = useState(false);
  const currentSubtitleIdRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update active subtitles based on current time - with simplified subtitle stopping logic
  useEffect(() => {
    if (!mediaData.subtitles || seeking) return;

    // Find active English subtitle
    const currentSubtitle = mediaData.subtitles.english.find(
      (sub: Subtitle) => currentTime >= sub.startTime && currentTime <= sub.endTime
    );

    // Find active Chinese subtitle
    const chineseSub = mediaData.subtitles.chinese.find(
      (sub: Subtitle) => currentTime >= sub.startTime && currentTime <= sub.endTime
    );

    // Update active subtitles
    setActiveSubs({ 
      english: currentSubtitle || null, 
      chinese: chineseSub || null 
    });
    
    // Very simple and reliable "Stop at sentence end" logic:
    if (stopAtSentenceEnd && isPlaying) {
      const currentId = currentSubtitle?.id || null;
      const previousId = currentSubtitleIdRef.current;
      
      // If the subtitle ID has changed (either to a new ID or to null)
      if (previousId !== null && previousId !== currentId) {
        // We've moved to a new subtitle or to a gap - stop playback
        setIsPlaying(false);
        setShowControls(true);
        console.log('Subtitle changed, stopping at:', previousId, '->', currentId);
      }
    }
    
    // Always update the current subtitle ID reference
    currentSubtitleIdRef.current = currentSubtitle?.id || null;
    
  }, [currentTime, mediaData.subtitles, seeking, setActiveSubs, stopAtSentenceEnd, isPlaying, setIsPlaying]);

  // Handle mouse movement to show controls
  useEffect(() => {
    if (mouseMoving) {
      setShowControls(true);
      
      if (mouseMoveTimerRef.current) {
        clearTimeout(mouseMoveTimerRef.current);
      }
      
      if (isPlaying) {
        mouseMoveTimerRef.current = setTimeout(() => {
          setShowControls(false);
          setMouseMoving(false);
        }, 2500);
      }
    }
    
    return () => {
      if (mouseMoveTimerRef.current) {
        clearTimeout(mouseMoveTimerRef.current);
      }
    };
  }, [mouseMoving, isPlaying]);

  // Show controls when paused
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      // Clear any existing timeout that might hide controls
      if (mouseMoveTimerRef.current) {
        clearTimeout(mouseMoveTimerRef.current);
      }
    }
  }, [isPlaying]);

  // Handle player progress
  const handleProgress = (state: { playedSeconds: number }) => {
    if (!seeking) {
      setCurrentTime(state.playedSeconds);
      setLocalTime(state.playedSeconds);
    }
  };

  // Handle seeking on slider
  const handleSeekStart = () => {
    setSeeking(true);
  };

  const handleSeekChange = (_: Event | React.SyntheticEvent, newValue: number | number[]) => {
    setLocalTime(newValue as number);
  };

  const handleSeekEnd = (_: Event | React.SyntheticEvent, newValue: number | number[]) => {
    setSeeking(false);
    const seekTime = newValue as number;
    setCurrentTime(seekTime);
    if (playerRef.current) {
      playerRef.current.seekTo(seekTime);
    }
  };

  // Control buttons - simplified play/pause handler
  const handlePlayPause = () => {
    // If we're about to play and stop-at-sentence is on, update the subtitle reference
    if (!isPlaying && stopAtSentenceEnd && mediaData.subtitles) {
      const currentSubtitle = mediaData.subtitles.english.find(
        (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
      );
      
      // Update the reference with the current subtitle
      currentSubtitleIdRef.current = currentSubtitle?.id || null;
      console.log('Updated subtitle reference on play:', currentSubtitleIdRef.current);
    }
    
    // Toggle play state
    setIsPlaying(!isPlaying);
  };

  const handleSkipForward = () => {
    if (playerRef.current) {
      const newTime = currentTime + 5 > duration ? duration : currentTime + 5;
      playerRef.current.seekTo(newTime);
      setCurrentTime(newTime);
      setLocalTime(newTime);
    }
  };

  const handleSkipBackward = () => {
    if (playerRef.current) {
      const newTime = currentTime - 5 < 0 ? 0 : currentTime - 5;
      playerRef.current.seekTo(newTime);
      setCurrentTime(newTime);
      setLocalTime(newTime);
    }
  };

  const handleReplay = () => {
    if (activeSubs.english && playerRef.current) {
      playerRef.current.seekTo(activeSubs.english.startTime);
      setCurrentTime(activeSubs.english.startTime);
      setLocalTime(activeSubs.english.startTime);
      setIsPlaying(true);
    }
  };

  // Fix replay sentence button logic
  const handleReplaySentence = () => {
    // Check for active subtitle first
    if (activeSubs.english && playerRef.current) {
      // If we have an active subtitle, replay that
      playerRef.current.seekTo(activeSubs.english.startTime);
      setCurrentTime(activeSubs.english.startTime);
      setLocalTime(activeSubs.english.startTime);
      
      // Start playing
      setIsPlaying(true);
      return;
    }
    
    // If no active subtitle, find the most recent one to replay
    if (mediaData.subtitles?.english && playerRef.current) {
      // Find the most recent subtitle that ended before current time
      const mostRecentSubtitle = [...mediaData.subtitles.english]
        .sort((a, b) => b.endTime - a.endTime)
        .find(sub => sub.endTime < currentTime);
        
      if (mostRecentSubtitle) {
        // Replay the most recent subtitle
        playerRef.current.seekTo(mostRecentSubtitle.startTime);
        setCurrentTime(mostRecentSubtitle.startTime);
        setLocalTime(mostRecentSubtitle.startTime);
        
        // Start playing
        setIsPlaying(true);
        console.log('Replaying last subtitle:', mostRecentSubtitle.text);
      }
    }
  };

  const handleMouseMove = () => {
    setMouseMoving(true);
  };

  // Simplify click handling to immediately toggle play/pause with no delay
  const handleContainerClick = (e: React.MouseEvent) => {
    // Prevent double-click selection
    e.preventDefault();
    
    // Toggle play/pause immediately on click
    handlePlayPause();
  };

  // Handle double-click separately for fullscreen
  const handleContainerDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleFullscreen();
  };

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen - use document.documentElement for the entire page
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => console.error(`Error attempting to enable fullscreen: ${err.message}`));
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(err => console.error(`Error attempting to exit fullscreen: ${err.message}`));
      }
    }
  };

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Add keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keyboard events if we're in a text input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ': // Space bar
          e.preventDefault(); // Prevent scroll
          handlePlayPause();
          break;
        case 'ArrowLeft': // Left arrow
          e.preventDefault();
          handleSkipBackward();
          break;
        case 'ArrowRight': // Right arrow
          e.preventDefault();
          handleSkipForward();
          break;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, currentTime]); // Re-attach when these change



  // Simple toggle for stop at sentence end
  const toggleSentenceStop = () => {
    // When toggling, update the current subtitle reference
    if (mediaData.subtitles) {
      const currentSubtitle = mediaData.subtitles.english.find(
        (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
      );
      currentSubtitleIdRef.current = currentSubtitle?.id || null;
    }
    
    setStopAtSentenceEnd(!stopAtSentenceEnd);
  };

  const handleResetClick = () => {
    if (onReset) {
      onReset();
    }
  };

  if (!mediaData.video) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          textAlign: 'center', 
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center' 
        }}
      >
        <Typography variant="h6">
          Use the buttons in the subtitle panel to upload a video
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        overflow: 'hidden', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: '#000000',
        width: '100%',
        position: 'relative',
        cursor: showControls ? 'default' : 'none',
        border: 'none'
      }}
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {/* Video container - full width */}
      <Box 
        ref={videoContainerRef}
        sx={{ 
          flex: 1,
          position: 'relative',
          width: '100%',
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#000000'
        }}
        onClick={handleContainerClick}
        onDoubleClick={handleContainerDoubleClick}
      >
        <ReactPlayer
          ref={playerRef}
          url={mediaData.video.url}
          width="100%"
          height="100%"
          playing={isPlaying}
          onDuration={setDuration}
          onProgress={handleProgress}
          progressInterval={100}
          style={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          config={{
            file: {
              attributes: {
                style: {
                  objectFit: 'contain'
                }
              }
            }
          }}
        />
      </Box>

      {/* Controls - with fade effect */}
      <Fade in={showControls}>
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: 'rgba(0, 0, 0, 0.8)', 
            color: 'white',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10
          }}
        >
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ minWidth: '40px', color: 'white' }}>
                {formatTime(localTime)}
              </Typography>
              
              <Slider
                value={localTime}
                min={0}
                max={duration}
                onChange={handleSeekChange}
                onMouseDown={handleSeekStart}
                onChangeCommitted={handleSeekEnd}
                aria-label="Video progress"
                size="small"
                sx={{
                  color: 'primary.main',
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12,
                    transition: '0.3s',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0px 0px 0px 8px rgba(25, 118, 210, 0.16)'
                    }
                  }
                }}
              />
              
              <Typography variant="body2" sx={{ minWidth: '40px', color: 'white' }}>
                {formatTime(duration)}
              </Typography>
            </Box>
            
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton onClick={handleSkipBackward} size="small" sx={{ color: 'white' }}>
                  <Replay5Icon />
                </IconButton>
                
                <IconButton onClick={handlePlayPause} color="primary" size="medium">
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                
                <IconButton onClick={handleSkipForward} size="small" sx={{ color: 'white' }}>
                  <Forward5Icon />
                </IconButton>
                
                {/* Stop at sentence end switch - moved here */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={stopAtSentenceEnd}
                      onChange={toggleSentenceStop}
                      size="small"
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: 'white', fontSize: '0.75rem' }}>
                      Stop at sentence end
                    </Typography>
                  }
                  sx={{ ml: 1 }}
                />
                
                {/* Replay current sentence button */}
                <IconButton 
                  onClick={handleReplaySentence} 
                  size="small" 
                  disabled={!activeSubs.english && !mediaData.subtitles?.english?.length}
                  sx={{ 
                    color: activeSubs.english || mediaData.subtitles?.english?.length ? 'white' : 'rgba(255,255,255,0.3)',
                    bgcolor: activeSubs.english ? 'rgba(25, 118, 210, 0.2)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.3)'
                    },
                  }}
                  title="Replay current or last sentence"
                >
                  <LoopIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Fullscreen button */}
                <IconButton 
                  onClick={toggleFullscreen} 
                  size="small"
                  sx={{ 
                    color: 'white',
                  }}
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
                
                {/* Reset button */}
                {onReset && (
                  <IconButton 
                    onClick={handleResetClick} 
                    size="small"
                    sx={{ 
                      color: 'white',
                      bgcolor: 'rgba(244, 67, 54, 0.2)',
                      '&:hover': {
                        bgcolor: 'rgba(244, 67, 54, 0.3)'
                      }
                    }}
                    title="Return to upload screen"
                  >
                    <UploadFileIcon />
                  </IconButton>
                )}
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Fade>
    </Paper>
  );
} 