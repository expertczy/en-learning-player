import { parseSRT, parseASS, separateSubtitles, Subtitle, detectSubtitleLanguage, SubtitleLanguage } from './subtitleParser';

export interface FileData {
  name: string;
  url: string;
  type: string;
  file: File;
}

export interface SubtitleData {
  raw: Subtitle[];
  chinese: Subtitle[];
  english: Subtitle[];
  detectedLanguage: SubtitleLanguage;
  missingLanguage: 'chinese' | 'english' | null;
}

export interface ProcessedData {
  video: FileData | null;
  subtitles: SubtitleData | null;
}

// Function to parse a subtitle file
async function parseSubtitleFile(file: File): Promise<Subtitle[]> {
  const content = await file.text();
  if (file.name.toLowerCase().endsWith('.ass')) {
    return parseASS(content);
  } else {
    return parseSRT(content);
  }
}

// Function to handle file upload and create object URLs
export async function handleFiles(files: File[], existingData?: ProcessedData): Promise<ProcessedData> {
  console.log('[handleFiles] Start processing files:', files.map(f => f.name));
  console.log('[handleFiles] Existing data:', existingData);
  
  const result: ProcessedData = {
    video: existingData?.video || null,
    subtitles: existingData?.subtitles || null
  };

  for (const file of files) {
    const url = URL.createObjectURL(file);
    const fileData: FileData = {
      name: file.name,
      url,
      type: file.type,
      file: file
    };

    const fileNameLower = file.name.toLowerCase();
    
    if (fileNameLower.endsWith('.mkv') || file.type.startsWith('video/')) {
      console.log('[handleFiles] Processing video file:', file.name);
      result.video = fileData;
    } else if (fileNameLower.endsWith('.srt') || fileNameLower.endsWith('.ass')) {
      console.log('[handleFiles] Processing subtitle file:', file.name);
      const parsedSubtitles = await parseSubtitleFile(file);
      console.log('[handleFiles] Parsed subtitles count:', parsedSubtitles.length);
      console.log('[handleFiles] Sample subtitle:', parsedSubtitles[0]);
      const detectedLanguage = detectSubtitleLanguage(parsedSubtitles);
      console.log('[handleFiles] Detected language:', detectedLanguage);
      
      // Check if we already have subtitles and need to merge
      console.log('[handleFiles] Existing subtitles?', !!result.subtitles);
      console.log('[handleFiles] Missing language?', result.subtitles?.missingLanguage);
      
      if (result.subtitles && result.subtitles.missingLanguage) {
        // We have existing subtitles with a missing language
        const existingLang = result.subtitles.missingLanguage === 'chinese' ? 'english' : 'chinese';
        const newLang = detectedLanguage;
        console.log('[handleFiles] Merging: existingLang=', existingLang, 'newLang=', newLang);
        
        // Check if the new subtitle fills the missing language
        if (newLang === result.subtitles.missingLanguage || newLang === 'bilingual') {
          // Merge the subtitles
          let chinese = result.subtitles.chinese;
          let english = result.subtitles.english;
          
          if (newLang === 'chinese') {
            chinese = parsedSubtitles;
          } else if (newLang === 'english') {
            english = parsedSubtitles;
          } else if (newLang === 'bilingual') {
            const separated = separateSubtitles(parsedSubtitles);
            if (result.subtitles.missingLanguage === 'chinese') {
              chinese = separated.chinese;
            } else {
              english = separated.english;
            }
          }
          
          result.subtitles = {
            raw: [...result.subtitles.raw, ...parsedSubtitles],
            chinese,
            english,
            detectedLanguage: 'bilingual',
            missingLanguage: null
          };
        } else {
          // New subtitle is same language as existing, replace
          if (newLang === 'chinese') {
            result.subtitles = {
              raw: parsedSubtitles,
              chinese: parsedSubtitles,
              english: [],
              detectedLanguage: 'chinese',
              missingLanguage: 'english'
            };
          } else if (newLang === 'english') {
            result.subtitles = {
              raw: parsedSubtitles,
              chinese: [],
              english: parsedSubtitles,
              detectedLanguage: 'english',
              missingLanguage: 'chinese'
            };
          }
        }
      } else {
        // Fresh subtitle upload
        console.log('[handleFiles] Fresh subtitle upload, detectedLanguage:', detectedLanguage);
        
        if (detectedLanguage === 'bilingual') {
          const { chinese, english } = separateSubtitles(parsedSubtitles);
          console.log('[handleFiles] Bilingual - chinese count:', chinese.length, 'english count:', english.length);
          result.subtitles = {
            raw: parsedSubtitles,
            chinese,
            english,
            detectedLanguage: 'bilingual',
            missingLanguage: null
          };
        } else if (detectedLanguage === 'chinese') {
          console.log('[handleFiles] Chinese only subtitle');
          result.subtitles = {
            raw: parsedSubtitles,
            chinese: parsedSubtitles,
            english: [],
            detectedLanguage: 'chinese',
            missingLanguage: 'english'
          };
        } else if (detectedLanguage === 'english') {
          console.log('[handleFiles] English only subtitle');
          result.subtitles = {
            raw: parsedSubtitles,
            chinese: [],
            english: parsedSubtitles,
            detectedLanguage: 'english',
            missingLanguage: 'chinese'
          };
        } else {
          // Unknown language, treat as bilingual and try to separate
          console.log('[handleFiles] Unknown language, trying to separate');
          const { chinese, english } = separateSubtitles(parsedSubtitles);
          console.log('[handleFiles] Separated - chinese count:', chinese.length, 'english count:', english.length);
          result.subtitles = {
            raw: parsedSubtitles,
            chinese,
            english,
            detectedLanguage: 'unknown',
            missingLanguage: chinese.length === 0 ? 'chinese' : (english.length === 0 ? 'english' : null)
          };
        }
      }
      
      console.log('[handleFiles] Final subtitles result:', {
        detectedLanguage: result.subtitles?.detectedLanguage,
        missingLanguage: result.subtitles?.missingLanguage,
        chineseCount: result.subtitles?.chinese.length,
        englishCount: result.subtitles?.english.length
      });
    }
  }

  return result;
}

// Function to clean up object URLs when no longer needed
export function releaseFiles(data: ProcessedData): void {
  if (data.video) {
    URL.revokeObjectURL(data.video.url);
  }
} 