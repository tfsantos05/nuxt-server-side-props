export async function clientOnly(fn) {
  if (import.meta.client)
    return await fn();
}
