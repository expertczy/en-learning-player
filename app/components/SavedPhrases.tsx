'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Card,
  CardContent,
  Button,
  Stack,
  Tabs,
  Tab
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import { useAppContext } from '../context/AppContext';

type FlashcardState = 'question' | 'answer';

export default function SavedPhrases() {
  const { savedPhrases, removePhrase, setCurrentTime, setIsPlaying } = useAppContext();
  const [mode, setMode] = useState<'list' | 'quiz'>('list');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardState, setCardState] = useState<FlashcardState>('question');
  const [isEnglishFirst, setIsEnglishFirst] = useState(true);

  // Play from a specific timestamp
  const handlePlayFrom = (timestamp: number) => {
    setCurrentTime(timestamp);
    setIsPlaying(true);
  };

  // Remove a phrase from saved list
  const handleRemove = (timestamp: number) => {
    removePhrase(timestamp);
  };

  // Shuffle the order for quiz mode
  const handleShuffle = () => {
    setCurrentCardIndex(0);
    setCardState('question');
    // Shuffling happens via random selection in the rendering
  };

  // Switch between viewing modes
  const handleModeChange = (_: React.SyntheticEvent, newValue: 'list' | 'quiz') => {
    setMode(newValue);
    setCurrentCardIndex(0);
    setCardState('question');
  };

  // Toggle flashcard display
  const handleCardClick = () => {
    setCardState(cardState === 'question' ? 'answer' : 'question');
  };

  // Move to next card
  const handleNextCard = () => {
    if (currentCardIndex < savedPhrases.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setCardState('question');
    }
  };

  // Move to previous card
  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setCardState('question');
    }
  };

  // Toggle between showing English or Chinese first
  const toggleLanguageOrder = () => {
    setIsEnglishFirst(!isEnglishFirst);
    setCardState('question');
  };

  if (savedPhrases.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center', mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Saved Phrases
        </Typography>
        <Typography variant="body1" color="text.secondary">
          No phrases saved yet. Use the bookmark button while watching to save phrases for learning.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Saved Phrases
      </Typography>

      <Tabs
        value={mode}
        onChange={handleModeChange}
        centered
        sx={{ mb: 3 }}
      >
        <Tab value="list" label="List View" />
        <Tab value="quiz" label="Flash Cards" />
      </Tabs>

      {mode === 'list' ? (
        <List>
          {savedPhrases.map((phrase, index) => (
            <React.Fragment key={phrase.timestamp}>
              {index > 0 && <Divider />}
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="play"
                      onClick={() => handlePlayFrom(phrase.timestamp)}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleRemove(phrase.timestamp)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={phrase.english}
                  secondary={phrase.chinese}
                  primaryTypographyProps={{
                    fontWeight: 'medium'
                  }}
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button 
              startIcon={<ShuffleIcon />} 
              onClick={handleShuffle}
              variant="outlined"
              size="small"
            >
              Shuffle
            </Button>
            <Button
              onClick={toggleLanguageOrder}
              variant="outlined"
              size="small"
            >
              {isEnglishFirst ? 'English → Chinese' : 'Chinese → English'}
            </Button>
          </Box>
          
          {savedPhrases.length > 0 && (
            <>
              <Card
                sx={{
                  minHeight: 200,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 2,
                  cursor: 'pointer',
                  backgroundColor: cardState === 'question' ? '#f5f5f5' : '#e3f2fd'
                }}
                onClick={handleCardClick}
              >
                <CardContent>
                  <Typography variant="h5" component="div" textAlign="center">
                    {cardState === 'question'
                      ? (isEnglishFirst ? savedPhrases[currentCardIndex].english : savedPhrases[currentCardIndex].chinese)
                      : (isEnglishFirst ? savedPhrases[currentCardIndex].chinese : savedPhrases[currentCardIndex].english)}
                  </Typography>
                  
                  {cardState === 'answer' && (
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                      <Button
                        size="small"
                        startIcon={<PlayArrowIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayFrom(savedPhrases[currentCardIndex].timestamp);
                        }}
                      >
                        Play in video
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
              
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button 
                  onClick={handlePrevCard} 
                  disabled={currentCardIndex === 0}
                  variant="outlined"
                >
                  Previous
                </Button>
                <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                  {currentCardIndex + 1} / {savedPhrases.length}
                </Typography>
                <Button 
                  onClick={handleNextCard} 
                  disabled={currentCardIndex === savedPhrases.length - 1}
                  variant="outlined"
                >
                  Next
                </Button>
              </Stack>
            </>
          )}
        </Box>
      )}
    </Paper>
  );
} 