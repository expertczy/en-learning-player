'use client';

import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Tooltip } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useAppContext } from '../context/AppContext';

export default function Header() {
  const { learnMode, setLearnMode } = useAppContext();
  
  return (
    <AppBar position="static" color="primary" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          English Learning App
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Watch and Learn">
            <IconButton 
              color={learnMode === 'watch' ? 'secondary' : 'inherit'} 
              onClick={() => setLearnMode('watch')}
            >
              <LanguageIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
} 