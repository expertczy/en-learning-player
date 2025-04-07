'use client';

import { Box, CssBaseline, ThemeProvider, createTheme, Paper, Typography, Button, Stack, IconButton } from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import RefreshIcon from '@mui/icons-material/Refresh';
import VideoPlayer from './components/VideoPlayer';
import SubtitleDisplay from './components/SubtitleDisplay';
import { useAppContext } from './context/AppContext';
import { useRef, useState } from 'react';
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
  const videoInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'video' | 'subtitle') => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    try {
      const newFiles = Array.from(e.target.files);
      
      // Combine with existing files if needed
      let filesToProcess = newFiles;
      
      if (fileType === 'subtitle' && mediaData.video) {
        // Keep the existing video and add the new subtitle
        const videoBlob = await fetch(mediaData.video.url).then(r => r.blob());
        const videoFile = new File([videoBlob], mediaData.video.name, { type: mediaData.video.type });
        filesToProcess = [...newFiles, videoFile];
      }
      
      const processed = await handleFiles(filesToProcess);
      setMediaData(processed);
    } catch (error) {
      console.error('Error processing files:', error);
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
  
  const hasRequiredFiles = mediaData.video && mediaData.subtitles;
  
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
            
            {/* Only show file names when files are uploaded */}
            {(mediaData.video || mediaData.subtitles) && (
              <Typography variant="body2" color="text.secondary">
                {mediaData.video && `Video: ${mediaData.video.name}`}
                {mediaData.video && mediaData.subtitles && <br />}
                {mediaData.subtitles && 'Subtitle file loaded'}
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
