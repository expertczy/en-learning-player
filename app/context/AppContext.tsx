'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Subtitle } from '../utils/subtitleParser';

// Define the interfaces needed for ProcessedData
interface FileData {
  name: string;
  url: string;
  type: string;
}

interface ProcessedData {
  video: FileData | null;
  subtitles: {
    raw: Subtitle[];
    chinese: Subtitle[];
    english: Subtitle[];
  } | null;
}

interface AppContextType {
  mediaData: ProcessedData;
  currentTime: number;
  isPlaying: boolean;
  activeSubs: {
    english: Subtitle | null;
    chinese: Subtitle | null;
  };
  showEnglish: boolean;
  showChinese: boolean;
  setMediaData: (data: ProcessedData) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setActiveSubs: (subs: { english: Subtitle | null; chinese: Subtitle | null }) => void;
  setShowEnglish: (show: boolean) => void;
  setShowChinese: (show: boolean) => void;
}

const defaultContext: AppContextType = {
  mediaData: { video: null, subtitles: null },
  currentTime: 0,
  isPlaying: false,
  activeSubs: { english: null, chinese: null },
  showEnglish: true,
  showChinese: true,
  setMediaData: () => {},
  setCurrentTime: () => {},
  setIsPlaying: () => {},
  setActiveSubs: () => {},
  setShowEnglish: () => {},
  setShowChinese: () => {},
};

const AppContext = createContext<AppContextType>(defaultContext);

export function useAppContext() {
  return useContext(AppContext);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [mediaData, setMediaData] = useState<ProcessedData>({ video: null, subtitles: null });
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSubs, setActiveSubs] = useState<{ english: Subtitle | null; chinese: Subtitle | null }>({
    english: null,
    chinese: null,
  });
  const [showEnglish, setShowEnglish] = useState(true);
  const [showChinese, setShowChinese] = useState(true);

  return (
    <AppContext.Provider
      value={{
        mediaData,
        currentTime,
        isPlaying,
        activeSubs,
        showEnglish,
        showChinese,
        setMediaData,
        setCurrentTime,
        setIsPlaying,
        setActiveSubs,
        setShowEnglish,
        setShowChinese,
      }}
    >
      {children}
    </AppContext.Provider>
  );
} 