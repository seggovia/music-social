const MUSICBRAINZ_MIN_INTERVAL_MS = 1000;

let queueTail: Promise<void> = Promise.resolve();
let lastRequestStartedAt = 0;

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Serializes every MusicBrainz request in this backend process and guarantees
 * at least one second between request start times. A rejected task does not
 * break the queue for requests waiting behind it.
 */
export function scheduleMusicBrainzRequest<T>(task: () => Promise<T>): Promise<T> {
  const scheduled = queueTail.then(async () => {
    const remainingDelay = Math.max(
      0,
      lastRequestStartedAt + MUSICBRAINZ_MIN_INTERVAL_MS - Date.now(),
    );
    if (remainingDelay > 0) await wait(remainingDelay);

    lastRequestStartedAt = Date.now();
    return task();
  });

  queueTail = scheduled.then(
    () => undefined,
    () => undefined,
  );

  return scheduled;
}
