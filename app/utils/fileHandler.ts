import { parseSRT, parseASS, separateSubtitles, Subtitle } from './subtitleParser';

export interface FileData {
  name: string;
  url: string;
  type: string;
}

export interface ProcessedData {
  video: FileData | null;
  subtitles: {
    raw: Subtitle[];
    chinese: Subtitle[];
    english: Subtitle[];
  } | null;
}

// Function to handle file upload and create object URLs
export async function handleFiles(files: File[]): Promise<ProcessedData> {
  const result: ProcessedData = {
    video: null,
    subtitles: null
  };

  for (const file of files) {
    const url = URL.createObjectURL(file);
    const fileData: FileData = {
      name: file.name,
      url,
      type: file.type
    };

    if (file.name.endsWith('.mkv') || file.type.startsWith('video/')) {
      result.video = fileData;
    } else if (file.name.endsWith('.srt') || file.name.endsWith('.ass')) {
      const content = await file.text();
      let parsedSubtitles: Subtitle[];
      
      // Choose parser based on file extension
      if (file.name.endsWith('.ass')) {
        parsedSubtitles = parseASS(content);
      } else {
        parsedSubtitles = parseSRT(content);
      }
      
      const { chinese, english } = separateSubtitles(parsedSubtitles);
      
      result.subtitles = {
        raw: parsedSubtitles,
        chinese,
        english
      };
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