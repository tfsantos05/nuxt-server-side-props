export async function clientOnly<T>(fn:() => Promise<T>) {

    // client only
    if (import.meta.client)
        return await fn()
}