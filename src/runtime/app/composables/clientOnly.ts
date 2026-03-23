export async function clientOnly<T>(fn: () => T | Promise<T>): Promise<T | undefined> {

    // client only
    if (import.meta.client)
        return await fn()
}