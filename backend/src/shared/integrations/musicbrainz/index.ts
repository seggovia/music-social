import { scheduleMusicBrainzRequest } from './requestThrottle.js';

const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2';
const MUSICBRAINZ_USER_AGENT = 'music-social/1.0 (https://github.com/your-org/music-social)';

async function fetchJson<T>(path: string): Promise<T> {
  return scheduleMusicBrainzRequest(async () => {
    const response = await fetch(`${MUSICBRAINZ_BASE_URL}${path}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': MUSICBRAINZ_USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  });
}

export async function searchAlbums(query: string, options: { limit?: number; offset?: number } = {}) {
  const params = new URLSearchParams({
    query: `release:${query.trim()}`,
    fmt: 'json',
    limit: String(options.limit ?? 25),
    offset: String(options.offset ?? 0),
  });

  return fetchJson<{ count?: number; releases?: Array<Record<string, unknown>> }>(`/release?${params.toString()}`);
}

export async function searchArtists(query: string, options: { limit?: number; offset?: number } = {}) {
  const params = new URLSearchParams({
    query: `artist:${query.trim()}`,
    fmt: 'json',
    limit: String(options.limit ?? 25),
    offset: String(options.offset ?? 0),
  });

  return fetchJson<{ count?: number; artists?: Array<Record<string, unknown>> }>(`/artist?${params.toString()}`);
}

export async function getAlbum(mbid: string) {
  return fetchJson<Record<string, unknown>>(`/release/${mbid}?fmt=json&inc=tags+genres+artist-credits`);
}

export async function getArtist(mbid: string) {
  return fetchJson<Record<string, unknown>>(`/artist/${mbid}?fmt=json&inc=tags+genres`);
}
