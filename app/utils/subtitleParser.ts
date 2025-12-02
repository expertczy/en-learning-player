export interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

// Function to parse SRT content
export function parseSRT(content: string): Subtitle[] {
  const subtitles: Subtitle[] = [];
  const blocks = content.trim().split(/\r?\n\r?\n/);

  blocks.forEach((block) => {
    const lines = block.split(/\r?\n/);
    if (lines.length < 3) return;

    const id = parseInt(lines[0]);
    const timeParts = lines[1].split(' --> ');
    
    if (timeParts.length !== 2) return;
    
    const startTime = timeToSeconds(timeParts[0]);
    const endTime = timeToSeconds(timeParts[1]);
    const text = lines.slice(2).join('\n');

    subtitles.push({
      id,
      startTime,
      endTime,
      text,
    });
  });

  return subtitles;
}

// Function to parse ASS subtitle format
export function parseASS(content: string): Subtitle[] {
  const subtitles: Subtitle[] = [];
  const lines = content.split(/\r?\n/);
  
  let dialogueFormat: string[] = [];
  let inEvents = false;
  let nextId = 1;
  
  for (const line of lines) {
    // Check if we're in the [Events] section
    if (line.trim() === '[Events]') {
      inEvents = true;
      continue;
    }
    
    // If we're in Events section, check for Format line
    if (inEvents && line.startsWith('Format:')) {
      dialogueFormat = line
        .substring(7)
        .split(',')
        .map(item => item.trim());
      continue;
    }
    
    // Process Dialogue lines
    if (inEvents && line.startsWith('Dialogue:') && dialogueFormat.length > 0) {
      const parts = line
        .substring(9)
        .split(',');
      
      // Find indices for start, end, and text fields
      const startIndex = dialogueFormat.indexOf('Start');
      const endIndex = dialogueFormat.indexOf('End');
      const textIndex = dialogueFormat.indexOf('Text');
      
      if (startIndex !== -1 && endIndex !== -1 && textIndex !== -1 && parts.length >= Math.max(startIndex, endIndex, textIndex) + 1) {
        const startTime = assTimeToSeconds(parts[startIndex].trim());
        const endTime = assTimeToSeconds(parts[endIndex].trim());
        
        // Get the text part (which may contain commas)
        let text = '';
        if (textIndex < parts.length - 1) {
          // Text contains commas, so rejoin the remaining parts
          text = parts.slice(textIndex).join(',');
        } else {
          text = parts[textIndex];
        }
        
        // Clean up ASS formatting codes
        text = cleanAssText(text.trim());
        
        if (text) {
          subtitles.push({
            id: nextId++,
            startTime,
            endTime,
            text
          });
        }
      }
    }
  }
  
  return subtitles;
}

// Function to clean ASS text formatting codes
function cleanAssText(text: string): string {
  // Remove various ASS style codes
  return text
    .replace(/{\\[^}]*}/g, '') // Remove style overrides like {\\i1}, {\\b1}, etc.
    .replace(/\\N/g, '\n')      // Convert ASS line breaks to normal line breaks
    .trim();
}

// Function to convert ASS time format (H:MM:SS.CC) to seconds
function assTimeToSeconds(timeString: string): number {
  const match = timeString.trim().match(/(\d+):(\d{2}):(\d{2})\.(\d{2})/);
  if (!match) return 0;
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = parseInt(match[3]);
  const centiseconds = parseInt(match[4]);
  
  return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
}

// Function to separate Chinese and English subtitles
// Assumes Chinese and English are on separate lines or separated by a pattern
export function separateSubtitles(subtitles: Subtitle[]): { chinese: Subtitle[], english: Subtitle[] } {
  const chinese: Subtitle[] = [];
  const english: Subtitle[] = [];

  subtitles.forEach((subtitle) => {
    const lines = subtitle.text.split(/\r?\n/);
    
    // Check if we have multiple lines and they contain different languages
    if (lines.length >= 2) {
      // Assume first line is Chinese and second is English
      // This is a simplification - in real app, would need more robust detection
      chinese.push({
        ...subtitle,
        text: lines[0]
      });
      
      english.push({
        ...subtitle,
        text: lines[1]
      });
    } else {
      // If there's only one line, check if it's Chinese or English
      // Simple heuristic: if it contains Chinese characters, consider it Chinese
      const containsChinese = /[\u4e00-\u9fff]/.test(subtitle.text);
      if (containsChinese) {
        chinese.push(subtitle);
      } else {
        english.push(subtitle);
      }
    }
  });

  return { chinese, english };
}

// Helper function to convert SRT time format to seconds
function timeToSeconds(timeString: string): number {
  const match = timeString.trim().match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  if (!match) return 0;
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const seconds = parseInt(match[3]);
  const milliseconds = parseInt(match[4]);
  
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

// Helper function to convert seconds to SRT time format
export function secondsToTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(milliseconds, 3)}`;
}

// Helper function for padding numbers with leading zeros
function pad(num: number, length = 2): string {
  return num.toString().padStart(length, '0');
}

// Type for subtitle language detection result
export type SubtitleLanguage = 'chinese' | 'english' | 'bilingual' | 'unknown';

// Function to detect the language of subtitles
export function detectSubtitleLanguage(subtitles: Subtitle[]): SubtitleLanguage {
  console.log('[detectSubtitleLanguage] Total subtitles:', subtitles.length);
  if (subtitles.length === 0) return 'unknown';
  
  let hasChineseOnly = 0;
  let hasEnglishOnly = 0;
  let hasBilingual = 0;
  
  const chineseRegex = /[\u4e00-\u9fff]/;
  const englishRegex = /[a-zA-Z]/;
  
  for (const subtitle of subtitles) {
    const lines = subtitle.text.split(/\r?\n/);
    const text = subtitle.text;
    
    const containsChinese = chineseRegex.test(text);
    const containsEnglish = englishRegex.test(text);
    
    // Check if this subtitle has multiple lines (potential bilingual)
    if (lines.length >= 2) {
      const firstLineHasChinese = chineseRegex.test(lines[0]);
      const secondLineHasEnglish = englishRegex.test(lines[1]) && !chineseRegex.test(lines[1]);
      
      if (firstLineHasChinese && secondLineHasEnglish) {
        hasBilingual++;
        continue;
      }
    }
    
    if (containsChinese && !containsEnglish) {
      hasChineseOnly++;
    } else if (containsEnglish && !containsChinese) {
      hasEnglishOnly++;
    } else if (containsChinese && containsEnglish) {
      // Single line with both - likely bilingual or mixed
      hasBilingual++;
    }
  }
  
  const total = subtitles.length;
  const bilingualRatio = hasBilingual / total;
  const chineseRatio = hasChineseOnly / total;
  const englishRatio = hasEnglishOnly / total;
  
  console.log('[detectSubtitleLanguage] Stats:', {
    total,
    hasChineseOnly,
    hasEnglishOnly,
    hasBilingual,
    chineseRatio: chineseRatio.toFixed(2),
    englishRatio: englishRatio.toFixed(2),
    bilingualRatio: bilingualRatio.toFixed(2)
  });
  
  // If more than 50% are bilingual format, consider it bilingual
  if (bilingualRatio > 0.5) {
    console.log('[detectSubtitleLanguage] Result: bilingual (>50% bilingual)');
    return 'bilingual';
  }
  
  // If predominantly one language (>70%)
  if (chineseRatio > 0.7) {
    console.log('[detectSubtitleLanguage] Result: chinese (>70%)');
    return 'chinese';
  }
  if (englishRatio > 0.7) {
    console.log('[detectSubtitleLanguage] Result: english (>70%)');
    return 'english';
  }
  
  // If mixed but not in bilingual format, still try to treat as bilingual
  if (chineseRatio > 0.3 && englishRatio > 0.3) {
    console.log('[detectSubtitleLanguage] Result: bilingual (mixed 30%+)');
    return 'bilingual';
  }
  
  // Default cases
  if (chineseRatio > englishRatio) {
    console.log('[detectSubtitleLanguage] Result: chinese (default)');
    return 'chinese';
  }
  if (englishRatio > chineseRatio) {
    console.log('[detectSubtitleLanguage] Result: english (default)');
    return 'english';
  }
  
  console.log('[detectSubtitleLanguage] Result: unknown');
  return 'unknown';
}

// Function to extract single language subtitles
export function extractSingleLanguage(subtitles: Subtitle[], language: 'chinese' | 'english'): Subtitle[] {
  const chineseRegex = /[\u4e00-\u9fff]/;
  
  return subtitles.map(subtitle => {
    const lines = subtitle.text.split(/\r?\n/);
    
    if (lines.length >= 2) {
      // Multi-line: first line is usually Chinese, second is English
      const text = language === 'chinese' ? lines[0] : lines[1];
      return { ...subtitle, text };
    }
    
    // Single line: return as is if it matches the language
    const containsChinese = chineseRegex.test(subtitle.text);
    if (language === 'chinese' && containsChinese) {
      return subtitle;
    }
    if (language === 'english' && !containsChinese) {
      return subtitle;
    }
    
    return subtitle;
  });
} 