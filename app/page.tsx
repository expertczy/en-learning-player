'use client';

import { Box, CssBaseline, ThemeProvider, createTheme, Paper, Typography, Button, Stack, IconButton } from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VideoPlayer from './components/VideoPlayer';
import SubtitleDisplay from './components/SubtitleDisplay';
import { useAppContext } from './context/AppContext';
import { useRef, useState, useEffect } from 'react';
import { handleFiles } from './utils/fileHandler';

// Create a theme with dark mode and true black background
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      paper: '#000000',
      default: '#000000'
    }
  },
});

export default function Home() {
  const { mediaData, setMediaData } = useAppContext();
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  
  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'video' | 'subtitle') => {
    console.log('[page] handleFileChange called, fileType:', fileType);
    const inputEl = e.target;
    const selectedFiles = inputEl.files ? Array.from(inputEl.files) : [];
    // Clear the input so the same file can be uploaded again in either order
    inputEl.value = '';

    if (selectedFiles.length === 0) {
      console.log('[page] No files selected');
      return;
    }
    
    setUploading(true);
    try {
      const newFiles = selectedFiles;
      console.log('[page] Files to process:', newFiles.map(f => f.name));
      console.log('[page] Current mediaData:', mediaData);
      
      // Pass existing mediaData to support merging subtitles
      const processed = await handleFiles(newFiles, mediaData);
      console.log('[page] Processed result:', processed);
      console.log('[page] Setting mediaData...');
      setMediaData(processed);
      console.log('[page] mediaData set complete');
    } catch (error) {
      console.error('[page] Error processing files:', error);
    } finally {
      setUploading(false);
    }
  };

  const triggerVideoInput = () => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  };

  const triggerSubtitleInput = () => {
    if (subtitleInputRef.current) {
      subtitleInputRef.current.click();
    }
  };
  
  const resetApp = () => {
    // Reset the app state to go back to upload screen
    setMediaData({
      video: null,
      subtitles: null
    });
  };
  
  // Only proceed to player when we have video AND complete bilingual subtitles
  const hasRequiredFiles = mediaData.video && mediaData.subtitles && !mediaData.subtitles.missingLanguage;
  const hasSubtitlesOnly = mediaData.subtitles && !mediaData.video;
  const hasVideoOnly = mediaData.video && (!mediaData.subtitles || mediaData.subtitles.missingLanguage);
  
  // Prevent hydration mismatch - show nothing until client-side mount
  if (!mounted) {
    return (
      <div style={{ 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: '#000000' 
      }} />
    );
  }
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {!hasRequiredFiles ? (
        // Upload Interface - shown first
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100vh', 
          width: '100vw', 
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#000000'
        }}>
          <Paper 
            elevation={4}
            sx={{
              p: 6,
              pb: 3,
              maxWidth: '600px',
              width: '90%',
              textAlign: 'center',
              bgcolor: '#000000',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <input
              type="file"
              ref={videoInputRef}
              onChange={(e) => handleFileChange(e, 'video')}
              accept=".mkv,.mp4,.webm,.avi"
              style={{ display: 'none' }}
            />
            <input
              type="file"
              ref={subtitleInputRef}
              onChange={(e) => handleFileChange(e, 'subtitle')}
              accept=".srt,.ass"
              style={{ display: 'none' }}
            />
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={3}
              justifyContent="center"
              sx={{ mb: 3 }}
            >
              <Button
                variant="contained"
                startIcon={<MovieIcon />}
                onClick={triggerVideoInput}
                disabled={uploading}
                size="large"
                fullWidth
                sx={{ 
                  py: 1.5,
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                Upload Video
              </Button>
              
              <Button
                variant="contained"
                startIcon={<SubtitlesIcon />}
                onClick={triggerSubtitleInput}
                disabled={uploading}
                size="large"
                color="secondary"
                fullWidth
                sx={{ 
                  py: 1.5,
                  bgcolor: 'secondary.main',
                  '&:hover': { bgcolor: 'secondary.dark' }
                }}
              >
                Upload Subtitle
              </Button>
            </Stack>
            
            {/* Upload status display */}
            <Stack spacing={1} sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                {mediaData.video ? (
                  <>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body2" color="success.main">
                      视频已上传: {mediaData.video.name}
                    </Typography>
                  </>
                ) : (
                  <>
                    <CancelIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      视频未上传
                    </Typography>
                  </>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                {mediaData.subtitles && (mediaData.subtitles.chinese.length > 0 || mediaData.subtitles.english.length > 0) ? (
                  <>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body2" color="success.main" sx={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      字幕已上传{mediaData.subtitles.fileName ? `: ${mediaData.subtitles.fileName}` : ''}
                      {mediaData.subtitles.missingLanguage && (
                        <span style={{ marginLeft: '8px', color: 'warning.main' }}>
                          {mediaData.subtitles.missingLanguage === 'chinese' ? '(仅英文)' : '(仅中文)'}
                        </span>
                      )}
                    </Typography>
                  </>
                ) : (
                  <>
                    <CancelIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">
                      字幕未上传
                    </Typography>
                  </>
                )}
              </Box>
            </Stack>
            
            {/* Show missing language prompt */}
            {mediaData.subtitles?.missingLanguage && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 2, 
                  color: 'warning.main',
                  fontWeight: 'medium'
                }}
              >
                ⚠️ {mediaData.subtitles.missingLanguage === 'chinese' 
                  ? '检测到纯英文字幕，请再次点击 Upload Subtitle 上传中文字幕' 
                  : '检测到纯中文字幕，请再次点击 Upload Subtitle 上传英文字幕'}
              </Typography>
            )}
          </Paper>
        </Box>
      ) : (
        // Main Interface - shown after files are uploaded
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100vh', 
          width: '100vw', 
          m: 0, 
          p: 0, 
          overflow: 'hidden',
          bgcolor: '#000000' // Pure black background
        }}>
          {/* Video player at top - full width */}
          <Box sx={{ 
            flex: '1',
            width: '100%',
            position: 'relative',
            mb: 0,
            bgcolor: '#000000'
          }}>
            <VideoPlayer onReset={resetApp} />
          </Box>
          
          {/* Subtitle display at bottom - compact height */}
          <Box sx={{ 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            height: 'auto',
            minHeight: '60px',
            maxHeight: '70px',
            padding: 0,
            bgcolor: '#000000'
          }}>
            <SubtitleDisplay hideUploadButtons={true} />
          </Box>
        </Box>
      )}
    </ThemeProvider>
  );
}
