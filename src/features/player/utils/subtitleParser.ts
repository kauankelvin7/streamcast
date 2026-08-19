export interface SubtitleCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

/**
 * Robust Subtitle Parser for Streamcast
 * Supports: .vtt, .srt
 */
export function parseSubtitle(content: string, format: 'vtt' | 'srt'): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = content.split(/\r?\n/);
  let currentCue: Partial<SubtitleCue> | null = null;

  const timeRegex = format === 'vtt' 
    ? /(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/
    : /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/;

  const parseTime = (timeStr: string) => {
    const parts = timeStr.replace(',', '.').split(':');
    const seconds = parseFloat(parts[parts.length - 1]);
    const minutes = parseInt(parts[parts.length - 2] || '0');
    const hours = parseInt(parts[parts.length - 3] || '0');
    return hours * 3600 + minutes * 60 + seconds;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (currentCue && currentCue.startTime !== undefined) {
        cues.push(currentCue as SubtitleCue);
      }
      currentCue = null;
      continue;
    }

    const timeMatch = line.match(timeRegex);
    if (timeMatch) {
      currentCue = {
        id: (cues.length + 1).toString(),
        startTime: parseTime(timeMatch[1]),
        endTime: parseTime(timeMatch[2]),
        text: '',
      };
    } else if (currentCue) {
      // Append text (ignoring ID lines)
      if (line !== currentCue.id) {
        currentCue.text = currentCue.text ? `${currentCue.text}\n${line}` : line;
      }
    }
  }

  // Final cue push if it exists
  if (currentCue && currentCue.startTime !== undefined) {
    cues.push(currentCue as SubtitleCue);
  }

  return cues;
}
