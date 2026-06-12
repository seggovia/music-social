const COVER_ART_BASE_URL = 'https://coverartarchive.org';

export async function getCoverArt(mbid: string): Promise<string | null> {
  const response = await fetch(`${COVER_ART_BASE_URL}/release/${mbid}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { images?: Array<{ front?: boolean; image?: string }> };
  const frontImage = data.images?.find((image) => image.front);

  return frontImage?.image ?? null;
}
