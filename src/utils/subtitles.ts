// src/utils/subtitles.ts

export interface Subtitle {
  SubFileName: string;
  SubDownloadLink: string;
  ZipDownloadLink: string;
  LanguageName: string;
  SubFormat: string;
  Score: number;
  SubtitlesLink: string;
  IDSubtitleFile: string;
}

// This function searches for subtitles on a public OpenSubtitles proxy.
// NOTE: Using a public proxy is not recommended for production.
// A proper implementation would involve a backend service with an official API key.
export async function findSubtitles(
  imdbId: string,
  season?: number,
  episode?: number
): Promise<Subtitle[] | null> {
  // Using a public CORS proxy for opensubtitles REST API
  let query = `imdbid-${imdbId}`;
  if (season && episode) {
    query += `/season-${season}/episode-${episode}`;
  }
  
  const url = `https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${imdbId.replace('tt', '')}&languages=pb,pt,en`;

  try {
    // IMPORTANT: This API requires a valid API key in a real application.
    // This is for demonstration purposes only.
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // 'Api-Key': 'YOUR_API_KEY_HERE' // A real API key would be needed
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenSubtitles API Error:', errorText);
      throw new Error(`OpenSubtitles API returned status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.data || result.data.length === 0) {
      return null;
    }

    const subtitles: Subtitle[] = result.data.map((item: any) => ({
      SubFileName: item.attributes.files[0]?.file_name || 'Unknown',
      SubDownloadLink: item.attributes.files[0]?.file_id ? `https://api.opensubtitles.com/api/v1/download` : '',
      ZipDownloadLink: '', // This API version uses a different download flow
      LanguageName: item.attributes.language,
      SubFormat: item.attributes.files[0]?.file_name.split('.').pop() || 'srt',
      Score: item.attributes.ratings,
      SubtitlesLink: item.attributes.url,
      IDSubtitleFile: item.attributes.files[0]?.file_id,
    }));

    // Sort by score/rating
    return subtitles.sort((a, b) => b.Score - a.Score);

  } catch (error) {
    console.error('Error fetching subtitles:', error);
    return null;
  }
}

// This function will get the download URL for a specific subtitle file.
export async function getSubtitleDownloadUrl(fileId: string): Promise<string | null> {
  const url = 'https://api.opensubtitles.com/api/v1/download';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // 'Api-Key': 'YOUR_API_KEY_HERE',
      },
      body: JSON.stringify({
        file_id: fileId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenSubtitles Download API Error:', errorText);
      return null;
    }

    const result = await response.json();
    // The 'link' property contains the direct, temporary download URL for the .srt/.vtt file
    return result.link || null;

  } catch (error) {
    console.error('Error getting subtitle download link:', error);
    return null;
  }
}
