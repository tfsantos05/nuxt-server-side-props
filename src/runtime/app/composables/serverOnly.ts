export async function serverOnly<T>(fn:() => Promise<T>) {
    // server-only
    // no hydration. client gets nothing
    if (import.meta.server)
        return await fn()
}