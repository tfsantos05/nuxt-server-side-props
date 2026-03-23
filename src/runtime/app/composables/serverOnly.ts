export async function serverOnly<T>(fn: () => T | Promise<T>): Promise<T | undefined> {
    // server-only
    // no hydration. client gets nothing
    if (import.meta.server)
        return await fn()
}