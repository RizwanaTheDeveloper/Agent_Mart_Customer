// For public, read-only data. Account/session requests must not use this cache.
export function createReadCache<T>(ttlMs: number, limit = 100) {
  type Task = { controller: AbortController; promise: Promise<T>; subscribers: number };
  const cached = new Map<string, { value: T; expires: number }>();
  const pending = new Map<string, Task>();
  const cancelled = () => Object.assign(Error('Cancelled'), { name: 'AbortError' });
  return (key: string, load: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> => {
    if (signal?.aborted) return Promise.reject(cancelled());
    const saved = cached.get(key);
    if (saved && saved.expires > Date.now()) return Promise.resolve(saved.value);
    cached.delete(key);
    let task = pending.get(key);
    if (!task) {
      const controller = new AbortController();
      const next: Task = { controller, subscribers: 0, promise: Promise.resolve().then(() => load(controller.signal)) };
      next.promise = next.promise.then(value => {
        if (!controller.signal.aborted) {
          cached.set(key, { value, expires: Date.now() + ttlMs });
          if (cached.size > limit) cached.delete(cached.keys().next().value!);
        }
        return value;
      }).finally(() => { if (pending.get(key) === next) pending.delete(key); });
      task = next; pending.set(key, next);
    }
    const active = task; active.subscribers++;
    return new Promise<T>((resolve, reject) => {
      let finished = false;
      const release = () => {
        finished = true; signal?.removeEventListener('abort', abort); active.subscribers--;
        if (!active.subscribers && pending.get(key) === active) { pending.delete(key); active.controller.abort(); }
      };
      const abort = () => { if (!finished) { release(); reject(cancelled()); } };
      signal?.addEventListener('abort', abort, { once: true });
      active.promise.then(value => { if (!finished) { release(); resolve(value); } }, error => { if (!finished) { release(); reject(error); } });
    });
  };
}
