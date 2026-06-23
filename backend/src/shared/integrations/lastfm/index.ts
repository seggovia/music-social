const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

interface LastFmTag {
  name?: string;
}

interface AlbumInfoResponse {
  album?: {
    tags?: {
      tag?: LastFmTag | LastFmTag[];
    };
  };
}

function getApiKey(): string {
  const key = process.env.LASTFM_API_KEY;
  if (!key) {
    throw new Error('LASTFM_API_KEY is not set in environment variables');
  }
  return key;
}

/**
 * Busca los tags (géneros) de un álbum en Last.fm por artista + título.
 * Devuelve un array de nombres de género, o [] si no encuentra nada.
 */
export async function getAlbumGenres(artist: string, album: string): Promise<string[]> {
  if (!artist.trim() || !album.trim()) return [];

  const params = new URLSearchParams({
    method: 'album.getinfo',
    api_key: getApiKey(),
    artist,
    album,
    format: 'json',
    autocorrect: '1',
  });

  try {
    const response = await fetch(`${LASTFM_BASE_URL}?${params.toString()}`);
    if (!response.ok) return [];

    const data = await response.json() as AlbumInfoResponse;
    const rawTags = data.album?.tags?.tag;

    if (!rawTags) return [];

    const tagsArray = Array.isArray(rawTags) ? rawTags : [rawTags];
    return tagsArray
      .map((t) => t.name?.trim())
      .filter((name): name is string => typeof name === 'string' && name.length > 0 && !/^\d{4}$/.test(name));
  } catch {
    // Si Last.fm falla, no rompemos el flujo de cacheo del álbum
    return [];
  }
}