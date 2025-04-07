'use client';

import React, { useRef, useState } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Stack, 
  Divider,
  Button
} from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import { useAppContext } from '../context/AppContext';
import { handleFiles } from '../utils/fileHandler';

interface SubtitleDisplayProps {
  hideUploadButtons?: boolean;
}

export default function SubtitleDisplay({ hideUploadButtons = false }: SubtitleDisplayProps) {
  const {
    mediaData,
    activeSubs,
    showEnglish,
    showChinese,
    setShowEnglish,
    setShowChinese,
    setMediaData
  } = useAppContext();

  const videoInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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

  // Toggle visibility when clicking on subtitle areas
  const toggleEnglish = () => {
    setShowEnglish(!showEnglish);
  };

  const toggleChinese = () => {
    setShowChinese(!showChinese);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: 'auto',
        minHeight: '60px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#000000',
        border: 'none'
      }}
    >
      {/* File upload buttons and subtitles in horizontal layout */}
      <Box sx={{ 
        display: 'flex', 
        width: '100%',
        bgcolor: '#000000'
      }}>
        {/* File uploads on the left - conditionally rendered */}
        {!hideUploadButtons && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            gap: 1,
            width: '110px',
            p: 1,
            borderRight: '1px solid',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            bgcolor: '#000000'
          }}>
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
            
            <Button
              variant="outlined"
              startIcon={<MovieIcon />}
              onClick={triggerVideoInput}
              size="small"
            >
              Video
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<SubtitlesIcon />}
              onClick={triggerSubtitleInput}
              size="small"
              color="secondary"
            >
              Subtitle
            </Button>
          </Box>
        )}
        
        {/* Subtitles container - single line height */}
        <Box sx={{ flex: 1, display: 'flex', gap: 2, p: 1, bgcolor: '#000000' }}>
          {/* English subtitle - Clickable to toggle */}
          <Box 
            sx={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '50px',
              py: 0.5,
              px: 2,
              borderRadius: 1,
              bgcolor: '#000000',
              border: '1px solid',
              borderColor: showEnglish ? 'primary.main' : 'rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: showEnglish ? 'rgba(144, 202, 249, 0.12)' : 'rgba(255, 255, 255, 0.08)'
              },
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            onClick={toggleEnglish}
          >
            {showEnglish && activeSubs.english ? (
              <Typography 
                variant="subtitle1" 
                align="center"
                sx={{ 
                  width: '100%',
                  fontWeight: 'medium',
                  color: 'primary.main',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '1.25rem'
                }}
              >
                {activeSubs.english.text}
              </Typography>
            ) : (
              <Typography 
                variant="body1" 
                align="center" 
                color="text.secondary"
              >
                {showEnglish 
                  ? (mediaData.video 
                      ? 'English subtitle will appear here' 
                      : 'Please upload video and subtitle files') 
                  : 'Click to show English'}
              </Typography>
            )}
          </Box>
          
          {/* Chinese subtitle - Clickable to toggle */}
          <Box 
            sx={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '50px',
              py: 0.5,
              px: 2,
              borderRadius: 1,
              bgcolor: '#000000',
              border: '1px solid',
              borderColor: showChinese ? 'secondary.main' : 'rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: showChinese ? 'rgba(244, 143, 177, 0.12)' : 'rgba(255, 255, 255, 0.08)'
              },
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            onClick={toggleChinese}
          >
            {showChinese && activeSubs.chinese ? (
              <Typography 
                variant="subtitle1" 
                align="center"
                sx={{ 
                  width: '100%',
                  fontWeight: 'medium',
                  color: 'secondary.main',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '1.25rem'
                }}
              >
                {activeSubs.chinese.text}
              </Typography>
            ) : (
              <Typography 
                variant="body1" 
                align="center" 
                color="text.secondary"
              >
                {showChinese 
                  ? (mediaData.video 
                      ? 'Chinese subtitle will appear here' 
                      : hideUploadButtons ? 'Please wait for subtitles' : 'Press the buttons at left to upload files') 
                  : 'Click to show Chinese'}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
} 