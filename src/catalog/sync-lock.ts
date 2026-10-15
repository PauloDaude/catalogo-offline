export async function withSyncLock<T>(work: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!navigator.locks) throw new Error('Para salvar offline, use um navegador atualizado, como o Chrome.');
  return navigator.locks.request('catalog-sync', { mode: 'exclusive', signal }, async () => { signal?.throwIfAborted(); return work(); });
}
