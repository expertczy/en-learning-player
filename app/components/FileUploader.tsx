'use client';

import React, { useState, useRef } from 'react';
import { Button, Box, Typography, Paper, Stack, CircularProgress } from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import { useAppContext } from '../context/AppContext';
import { handleFiles } from '../utils/fileHandler';

export default function FileUploader() {
  const { mediaData, setMediaData } = useAppContext();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    video: string | null;
    subtitle: string | null;
  }>({
    video: null,
    subtitle: null
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'video' | 'subtitle') => {
    const inputEl = e.target;
    const files = inputEl.files ? Array.from(inputEl.files) : [];
    inputEl.value = '';
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      // Update UI with file name based on the type
      if (fileType === 'video') {
        setUploadedFiles(prev => ({
          ...prev,
          video: files[0].name
        }));
      } else {
        setUploadedFiles(prev => ({
          ...prev,
          subtitle: files[0].name
        }));
      }
      
      // Pass existing mediaData to support merging subtitles
      const processed = await handleFiles(files, mediaData);
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

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, maxWidth: '100%', overflow: 'hidden' }}>
      <Stack spacing={3}>
        <Typography variant="h5" component="h2" gutterBottom>
          Upload Files
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: ['column', 'row'], gap: 3, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <input
              type="file"
              ref={videoInputRef}
              onChange={(e) => handleFileChange(e, 'video')}
              accept=".mkv,.mp4,.webm,.avi"
              style={{ display: 'none' }}
            />
            
            <Button
              variant="contained"
              startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <MovieIcon />}
              onClick={triggerVideoInput}
              disabled={uploading}
              sx={{ mb: 2, width: '80%' }}
              color="primary"
            >
              Select Video File
            </Button>
            
            {uploadedFiles.video ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <MovieIcon color="primary" fontSize="small" />
                <Typography variant="body2" noWrap sx={{ maxWidth: '250px' }}>
                  {uploadedFiles.video}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                MKV, MP4, WebM, or AVI video file
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <input
              type="file"
              ref={subtitleInputRef}
              onChange={(e) => handleFileChange(e, 'subtitle')}
              accept=".srt,.ass"
              style={{ display: 'none' }}
            />
            
            <Button
              variant="contained"
              startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <SubtitlesIcon />}
              onClick={triggerSubtitleInput}
              disabled={uploading}
              sx={{ mb: 2, width: '80%' }}
              color="secondary"
            >
              Select Subtitle File
            </Button>
            
            {uploadedFiles.subtitle ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <SubtitlesIcon color="secondary" fontSize="small" />
                <Typography variant="body2" noWrap sx={{ maxWidth: '250px' }}>
                  {uploadedFiles.subtitle}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                SRT or ASS subtitle file (with Chinese and English)
              </Typography>
            )}
          </Box>
        </Box>
        
        {(uploadedFiles.video || uploadedFiles.subtitle) && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {uploadedFiles.video && uploadedFiles.subtitle 
                ? "Both video and subtitle files are ready for learning!" 
                : "Please upload both video and subtitle files to get started."}
            </Typography>
            
            {/* Show missing language prompt */}
            {mediaData.subtitles?.missingLanguage && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 1, 
                  color: 'warning.main',
                  fontWeight: 'medium'
                }}
              >
                ⚠️ {mediaData.subtitles.missingLanguage === 'chinese' 
                  ? '检测到纯英文字幕，请再次点击上方按钮上传中文字幕' 
                  : '检测到纯中文字幕，请再次点击上方按钮上传英文字幕'}
              </Typography>
            )}
          </Box>
        )}
      </Stack>
    </Paper>
  );
} 