/**
 * Audita y, solo con --execute, fusiona albumes duplicados.
 *
 * Dry-run (predeterminado):
 *   npm run albums:merge-duplicates
 *
 * Ejecucion explicita:
 *   npm run albums:merge-duplicates -- --execute
 *
 * La escritura se delega a merge_duplicate_album_group(), de modo que cada
 * grupo se procesa dentro de una unica transaccion PostgreSQL.
 */
import 'dotenv/config';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';

const PAGE_SIZE = 1000;
const ID_CHUNK_SIZE = 100;
const HANDLED_ALBUM_FOREIGN_KEYS = [
  'public.album_comments.album_id',
  'public.album_genres.album_id',
  'public.reviews.album_id',
  'public.user_catalog.album_id',
] as const;

interface ArtistJoin {
  name?: string | null;
}

interface AlbumRow {
  id: string;
  artist_id: string;
  title: string;
  musicbrainz_id: string | null;
  release_group_id: string | null;
  created_at: string;
  artists?: ArtistJoin | null;
}

interface ReviewRow {
  id: string;
  album_id: string;
  user_id: string;
}

interface AlbumGenreRow {
  album_id: string;
  genre_id: string;
}

interface AlbumCommentRow {
  id: string;
  album_id: string;
}

interface UserCatalogRow {
  id: string;
  album_id: string;
  user_id: string;
  status: string;
}

interface AlbumReferences {
  reviews: ReviewRow[];
  albumGenres: AlbumGenreRow[];
  albumComments: AlbumCommentRow[];
  userCatalog: UserCatalogRow[];
}

interface MergeAnalysis {
  albums: AlbumRow[];
  canonical: AlbumRow;
  duplicates: AlbumRow[];
  referencesToMove: {
    reviews: number;
    albumGenres: number;
    albumComments: number;
    userCatalog: number;
  };
  genreLinksToCoalesce: number;
  reviewConflicts: number;
  catalogConflicts: number;
  reviewConflictDetails: Array<{ userId: string; rows: ReviewRow[] }>;
  catalogConflictDetails: Array<{ userId: string; rows: UserCatalogRow[] }>;
  releaseGroupIds: string[];
  reviewCountsByAlbum: Record<string, number>;
  blockers: string[];
}

interface PostgrestLikeError {
  code?: string;
  message?: string;
}

class UnionFind {
  private readonly parent = new Map<string, string>();

  add(id: string) {
    if (!this.parent.has(id)) this.parent.set(id, id);
  }

  find(id: string): string {
    const parent = this.parent.get(id);
    if (!parent) throw new Error(`Album desconocido en UnionFind: ${id}`);
    if (parent === id) return id;
    const root = this.find(parent);
    this.parent.set(id, root);
    return root;
  }

  union(left: string, right: string) {
    const leftRoot = this.find(left);
    const rightRoot = this.find(right);
    if (leftRoot !== rightRoot) this.parent.set(rightRoot, leftRoot);
  }
}

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null
    ? (error as PostgrestLikeError).code
    : undefined;
}

async function discoverAlbumForeignKeys(): Promise<string[]> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Accept: 'application/openapi+json',
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo inspeccionar el schema REST de Supabase (${response.status}).`);
  }

  const schema = await response.json() as {
    definitions?: Record<string, { properties?: Record<string, unknown> }>;
  };
  const definitions = schema.definitions ?? {};
  const discovered = Object.entries(definitions).flatMap(([table, definition]) =>
    Object.entries(definition.properties ?? {})
      .filter(([column, property]) => column === 'album_id' && JSON.stringify(property).includes('albums'))
      .map(([column]) => `public.${table}.${column}`),
  ).sort();

  const handled = new Set<string>(HANDLED_ALBUM_FOREIGN_KEYS);
  const unknown = discovered.filter((reference) => !handled.has(reference));
  const missing = HANDLED_ALBUM_FOREIGN_KEYS.filter((reference) => !discovered.includes(reference));
  if (unknown.length > 0 || missing.length > 0) {
    throw new Error([
      unknown.length > 0 ? `FK hacia albums.id no soportadas: ${unknown.join(', ')}` : null,
      missing.length > 0 ? `FK esperadas no detectadas: ${missing.join(', ')}` : null,
    ].filter(Boolean).join('. '));
  }

  return discovered;
}

async function fetchAlbums(includeReleaseGroup: boolean): Promise<AlbumRow[]> {
  const rows: AlbumRow[] = [];
  const columns = includeReleaseGroup
    ? 'id, artist_id, title, musicbrainz_id, release_group_id, created_at, artists(name)'
    : 'id, artist_id, title, musicbrainz_id, created_at, artists(name)';

  for (let rangeStart = 0; ; rangeStart += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('albums')
      .select(columns)
      .order('id', { ascending: true })
      .range(rangeStart, rangeStart + PAGE_SIZE - 1);

    if (error) throw error;

    const rawRows = (data ?? []) as unknown as Record<string, unknown>[];
    const batch = rawRows.map((row) => ({
      id: String(row.id),
      artist_id: String(row.artist_id),
      title: String(row.title),
      musicbrainz_id: typeof row.musicbrainz_id === 'string' ? row.musicbrainz_id : null,
      release_group_id: includeReleaseGroup && typeof row.release_group_id === 'string'
        ? row.release_group_id
        : null,
      created_at: String(row.created_at),
      artists: row.artists as ArtistJoin | null,
    }));
    rows.push(...batch);

    if (batch.length < PAGE_SIZE) break;
  }

  return rows;
}

async function fetchRowsForAlbums<T>(
  table: string,
  columns: string,
  orderColumn: string,
  albumIds: string[],
): Promise<T[]> {
  if (albumIds.length === 0) return [];

  const rows: T[] = [];
  for (const idChunk of chunks(albumIds, ID_CHUNK_SIZE)) {
    for (let rangeStart = 0; ; rangeStart += PAGE_SIZE) {
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .in('album_id', idChunk)
        .order('album_id', { ascending: true })
        .order(orderColumn, { ascending: true })
        .range(rangeStart, rangeStart + PAGE_SIZE - 1);

      if (error) throw error;
      const batch = (data ?? []) as T[];
      rows.push(...batch);
      if (batch.length < PAGE_SIZE) break;
    }
  }

  return rows;
}

function findDuplicateGroups(albums: AlbumRow[]): AlbumRow[][] {
  const unionFind = new UnionFind();
  const firstByTitleAndArtist = new Map<string, string>();
  const firstByReleaseGroup = new Map<string, string>();

  for (const album of albums) {
    unionFind.add(album.id);

    const titleKey = `${album.artist_id}\u0000${normalizeTitle(album.title)}`;
    const titleMatch = firstByTitleAndArtist.get(titleKey);
    if (titleMatch) unionFind.union(titleMatch, album.id);
    else firstByTitleAndArtist.set(titleKey, album.id);

    if (album.release_group_id) {
      const releaseGroupMatch = firstByReleaseGroup.get(album.release_group_id);
      if (releaseGroupMatch) unionFind.union(releaseGroupMatch, album.id);
      else firstByReleaseGroup.set(album.release_group_id, album.id);
    }
  }

  const groups = new Map<string, AlbumRow[]>();
  for (const album of albums) {
    const root = unionFind.find(album.id);
    const group = groups.get(root) ?? [];
    group.push(album);
    groups.set(root, group);
  }

  return [...groups.values()].filter((group) => group.length > 1);
}

function countByAlbum(rows: Array<{ album_id: string }>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.album_id, (counts.get(row.album_id) ?? 0) + 1);
  return counts;
}

function findDuplicateKeyGroups<T>(rows: T[], getKey: (row: T) => string): Array<{ key: string; rows: T[] }> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = getKey(row);
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .filter(([, groupedRows]) => groupedRows.length > 1)
    .map(([key, groupedRows]) => ({ key, rows: groupedRows }));
}

function analyzeGroups(groups: AlbumRow[][], references: AlbumReferences): MergeAnalysis[] {
  const reviewCountByAlbum = countByAlbum(references.reviews);

  return groups.map((albums) => {
    const sorted = [...albums].sort((left, right) => {
      const reviewDifference = (reviewCountByAlbum.get(right.id) ?? 0) - (reviewCountByAlbum.get(left.id) ?? 0);
      if (reviewDifference !== 0) return reviewDifference;
      const dateDifference = left.created_at.localeCompare(right.created_at);
      return dateDifference !== 0 ? dateDifference : left.id.localeCompare(right.id);
    });

    const canonical = sorted[0];
    const duplicates = sorted.slice(1);
    const duplicateIds = new Set(duplicates.map((album) => album.id));
    const groupIds = new Set(albums.map((album) => album.id));

    const groupReviews = references.reviews.filter((row) => groupIds.has(row.album_id));
    const groupCatalog = references.userCatalog.filter((row) => groupIds.has(row.album_id));
    const groupGenres = references.albumGenres.filter((row) => groupIds.has(row.album_id));
    const releaseGroupIds = [...new Set(
      albums.map((album) => album.release_group_id).filter((id): id is string => Boolean(id)),
    )].sort();
    const reviewConflictDetails = findDuplicateKeyGroups(groupReviews, (row) => row.user_id)
      .map(({ key, rows }) => ({ userId: key, rows }));
    const catalogConflictDetails = findDuplicateKeyGroups(groupCatalog, (row) => row.user_id)
      .map(({ key, rows }) => ({ userId: key, rows }));
    const reviewConflicts = reviewConflictDetails.length;
    const catalogConflicts = catalogConflictDetails.length;
    const genreLinksToCoalesce = groupGenres.length - new Set(groupGenres.map((row) => row.genre_id)).size;
    const blockers: string[] = [];

    if (releaseGroupIds.length > 1) {
      blockers.push(`${releaseGroupIds.length} release_group_id distintos`);
    }
    if (reviewConflicts > 0) {
      blockers.push(`${reviewConflicts} usuario(s) con mas de una review en el grupo`);
    }
    if (catalogConflicts > 0) {
      blockers.push(`${catalogConflicts} usuario(s) con mas de una entrada de catalogo en el grupo`);
    }

    return {
      albums,
      canonical,
      duplicates,
      referencesToMove: {
        reviews: references.reviews.filter((row) => duplicateIds.has(row.album_id)).length,
        albumGenres: references.albumGenres.filter((row) => duplicateIds.has(row.album_id)).length,
        albumComments: references.albumComments.filter((row) => duplicateIds.has(row.album_id)).length,
        userCatalog: references.userCatalog.filter((row) => duplicateIds.has(row.album_id)).length,
      },
      genreLinksToCoalesce,
      reviewConflicts,
      catalogConflicts,
      reviewConflictDetails,
      catalogConflictDetails,
      releaseGroupIds,
      reviewCountsByAlbum: Object.fromEntries(
        albums.map((album) => [album.id, reviewCountByAlbum.get(album.id) ?? 0]),
      ),
      blockers,
    };
  }).sort((left, right) => {
    const artistDifference = (left.canonical.artists?.name ?? '').localeCompare(right.canonical.artists?.name ?? '');
    return artistDifference !== 0
      ? artistDifference
      : normalizeTitle(left.canonical.title).localeCompare(normalizeTitle(right.canonical.title));
  });
}

function printAnalysis(
  analyses: MergeAnalysis[],
  releaseGroupColumnAvailable: boolean,
  execute: boolean,
  albumForeignKeys: string[],
) {
  console.log('============================================================');
  console.log(`MERGE DE ALBUMES DUPLICADOS - ${execute ? 'EJECUCION' : 'DRY-RUN'}`);
  console.log('============================================================');
  console.log('Criterios: titulo normalizado + artista, o release_group_id.');
  console.log('Canonica: mas reviews; empate -> created_at mas antiguo; empate -> UUID.');
  console.log(`FK auditadas en el schema real: ${albumForeignKeys.join(', ')}.`);
  if (!releaseGroupColumnAvailable) {
    console.log('ADVERTENCIA: release_group_id aun no existe; este dry-run solo puede usar titulo + artista.');
  }
  console.log(`Grupos duplicados encontrados: ${analyses.length}\n`);

  const totals = {
    albums: 0,
    reviews: 0,
    albumGenres: 0,
    albumComments: 0,
    userCatalog: 0,
    genreLinksToCoalesce: 0,
  };

  analyses.forEach((analysis, index) => {
    const artist = analysis.canonical.artists?.name ?? 'Unknown Artist';
    const refs = analysis.referencesToMove;
    totals.albums += analysis.duplicates.length;
    totals.reviews += refs.reviews;
    totals.albumGenres += refs.albumGenres;
    totals.albumComments += refs.albumComments;
    totals.userCatalog += refs.userCatalog;
    totals.genreLinksToCoalesce += analysis.genreLinksToCoalesce;

    console.log(`[${index + 1}/${analyses.length}] "${analysis.canonical.title}" - ${artist}`);
    console.log(`  Canonica: ${analysis.canonical.id}`);
    console.log(`    release MBID: ${analysis.canonical.musicbrainz_id ?? 'NULL'}`);
    console.log(`    release-group: ${analysis.canonical.release_group_id ?? 'NULL'}`);
    console.log(`    created_at: ${analysis.canonical.created_at}`);
    console.log(`    reviews: ${analysis.reviewCountsByAlbum[analysis.canonical.id] ?? 0}`);
    console.log('  Filas que se fusionarian:');
    for (const duplicate of analysis.duplicates) {
      console.log(`    - ${duplicate.id}`);
      console.log(`      release MBID: ${duplicate.musicbrainz_id ?? 'NULL'}`);
      console.log(`      release-group: ${duplicate.release_group_id ?? 'NULL'}`);
      console.log(`      created_at: ${duplicate.created_at}`);
      console.log(`      reviews: ${analysis.reviewCountsByAlbum[duplicate.id] ?? 0}`);
    }
    console.log('  Referencias que se re-apuntarian desde las filas duplicadas:');
    console.log(`    reviews: ${refs.reviews}`);
    console.log(`    album_genres: ${refs.albumGenres} (${analysis.genreLinksToCoalesce} enlace(s) redundante(s) se consolidarian)`);
    console.log(`    album_comments: ${refs.albumComments}`);
    console.log(`    user_catalog: ${refs.userCatalog}`);
    console.log(`  release_group_id detectados: ${analysis.releaseGroupIds.join(', ') || 'ninguno'}`);
    console.log(`  Estado: ${analysis.blockers.length === 0 ? 'LISTO PARA FUSION' : 'BLOQUEADO'}`);
    for (const blocker of analysis.blockers) console.log(`    - ${blocker}`);
    for (const conflict of analysis.reviewConflictDetails) {
      console.log(`    Reviews en conflicto para user ${conflict.userId}:`);
      for (const row of conflict.rows) console.log(`      - review ${row.id} -> album ${row.album_id}`);
    }
    for (const conflict of analysis.catalogConflictDetails) {
      console.log(`    Catalogo en conflicto para user ${conflict.userId}:`);
      for (const row of conflict.rows) console.log(`      - catalog ${row.id} (${row.status}) -> album ${row.album_id}`);
    }
    console.log('');
  });

  const blocked = analyses.filter((analysis) => analysis.blockers.length > 0).length;
  console.log('------------------------------------------------------------');
  console.log('RESUMEN');
  console.log(`Grupos: ${analyses.length} (${analyses.length - blocked} ejecutables, ${blocked} bloqueados)`);
  console.log(`Filas de albums que se eliminarian: ${totals.albums}`);
  console.log(`Reviews que se re-apuntarian: ${totals.reviews}`);
  console.log(`Album genres que se trasladarian: ${totals.albumGenres}`);
  console.log(`Album comments que se re-apuntarian: ${totals.albumComments}`);
  console.log(`User catalog que se re-apuntarian: ${totals.userCatalog}`);
  console.log(`Enlaces de genero redundantes que se consolidarian: ${totals.genreLinksToCoalesce}`);
  console.log('============================================================');
}

async function main() {
  const args = process.argv.slice(2);
  const unknownArgs = args.filter((arg) => arg !== '--execute');
  if (unknownArgs.length > 0) {
    throw new Error(`Argumentos desconocidos: ${unknownArgs.join(', ')}`);
  }
  const execute = args.includes('--execute');
  const albumForeignKeys = await discoverAlbumForeignKeys();

  let releaseGroupColumnAvailable = true;
  let albums: AlbumRow[];
  try {
    albums = await fetchAlbums(true);
  } catch (error) {
    if (errorCode(error) !== '42703') throw error;
    releaseGroupColumnAvailable = false;
    albums = await fetchAlbums(false);
  }

  const duplicateGroups = findDuplicateGroups(albums);
  const candidateAlbumIds = duplicateGroups.flatMap((group) => group.map((album) => album.id));
  const [reviews, albumGenres, albumComments, userCatalog] = await Promise.all([
    fetchRowsForAlbums<ReviewRow>('reviews', 'id, album_id, user_id', 'id', candidateAlbumIds),
    fetchRowsForAlbums<AlbumGenreRow>('album_genres', 'album_id, genre_id', 'genre_id', candidateAlbumIds),
    fetchRowsForAlbums<AlbumCommentRow>('album_comments', 'id, album_id', 'id', candidateAlbumIds),
    fetchRowsForAlbums<UserCatalogRow>('user_catalog', 'id, album_id, user_id, status', 'id', candidateAlbumIds),
  ]);
  const analyses = analyzeGroups(duplicateGroups, { reviews, albumGenres, albumComments, userCatalog });

  printAnalysis(analyses, releaseGroupColumnAvailable, execute, albumForeignKeys);

  if (!execute) {
    console.log('\nDRY-RUN finalizado. No se modifico ninguna fila.');
    return;
  }

  if (!releaseGroupColumnAvailable) {
    throw new Error('No se puede ejecutar: aplica primero 006_album_release_group_id.sql.');
  }

  let merged = 0;
  let skipped = 0;
  let failed = 0;
  for (const [index, analysis] of analyses.entries()) {
    if (analysis.blockers.length > 0) {
      skipped++;
      console.log(`[${index + 1}/${analyses.length}] OMITIDO ${analysis.canonical.id}: ${analysis.blockers.join('; ')}`);
      continue;
    }

    console.log(`[${index + 1}/${analyses.length}] Fusionando ${analysis.duplicates.length} fila(s) en ${analysis.canonical.id}...`);
    const { error } = await supabase.rpc('merge_duplicate_album_group', {
      p_canonical_id: analysis.canonical.id,
      p_duplicate_ids: analysis.duplicates.map((album) => album.id),
    });
    if (error) {
      failed++;
      console.error(`  ERROR: ${error.message}. Se detiene el lote; la transaccion de este grupo fue revertida.`);
      break;
    }
    merged++;
    console.log('  OK');
  }

  const notAttempted = analyses.length - merged - skipped - failed;
  console.log(`\nFusion finalizada. Exitosos: ${merged}. Omitidos por seguridad: ${skipped}. Fallidos: ${failed}. No intentados: ${notAttempted}. Total analizado: ${analyses.length}.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error('\nError fatal. No se continuara con la fusion:', error);
  process.exitCode = 1;
});
