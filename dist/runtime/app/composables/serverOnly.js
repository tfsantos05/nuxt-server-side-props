export async function serverOnly(fn) {
  if (import.meta.server)
    return await fn();
}
