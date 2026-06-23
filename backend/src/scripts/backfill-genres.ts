/**
 * Script de una sola vez: recorre todos los álbumes sin géneros asignados
 * y trata de poblarlos usando Last.fm.
 *
 * Uso: npx tsx src/scripts/backfill-genres.ts
 */
import 'dotenv/config';
import { supabase } from '../config/supabase.js';
import { getAlbumGenres } from '../shared/integrations/lastfm/index.js';
import { albumsRepository } from '../features/albums/albums.repository.js';

interface AlbumRow {
  id: string;
  title: string;
  artists: { name: string } | null;
}

async function findAlbumsWithoutGenres(): Promise<AlbumRow[]> {
  const { data: allAlbums, error: albumsError } = await supabase
    .from('albums')
    .select('id, title, artists(name)');

  if (albumsError) throw albumsError;

  const { data: genreLinks, error: genresError } = await supabase
    .from('album_genres')
    .select('album_id');

  if (genresError) throw genresError;

  const albumIdsWithGenres = new Set((genreLinks ?? []).map((g: { album_id: string }) => g.album_id));

  return (allAlbums ?? [])
    .filter((row: Record<string, unknown>) => !albumIdsWithGenres.has(row.id as string))
    .map((row: Record<string, unknown>) => ({
      id: row.id as string,
      title: row.title as string,
      artists: row.artists as { name: string } | null,
    }));
}

async function main() {
  console.log('Buscando álbumes sin géneros...');
  const albums = await findAlbumsWithoutGenres();
  console.log(`Encontrados ${albums.length} álbumes sin géneros.\n`);

  let updated = 0;
  let skipped = 0;

  for (const album of albums) {
    const artistName = album.artists?.name ?? '';
    if (!artistName || artistName === 'Unknown Artist') {
      console.log(`⏭  Saltando "${album.title}" (sin artista válido)`);
      skipped++;
      continue;
    }

    try {
      const genres = await getAlbumGenres(artistName, album.title);

      if (genres.length === 0) {
        console.log(`⏭  "${album.title}" — ${artistName}: Last.fm no tiene tags`);
        skipped++;
        continue;
      }

      await albumsRepository.attachGenres(album.id, genres);
      console.log(`✅ "${album.title}" — ${artistName}: ${genres.join(', ')}`);
      updated++;

      // Pausa breve para no saturar la API de Last.fm
      await new Promise((resolve) => setTimeout(resolve, 250));
    } catch (err) {
      console.error(`❌ Error con "${album.title}":`, err);
      skipped++;
    }
  }

  console.log(`\nListo. Actualizados: ${updated}. Sin cambios: ${skipped}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error fatal en el script:', err);
    process.exit(1);
  });