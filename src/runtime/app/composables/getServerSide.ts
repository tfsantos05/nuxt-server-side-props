import { useNuxtApp, useRuntimeConfig } from 'nuxt/app'


export async function getServerSide<T>(fn: () => T | Promise<T>, key?: string): Promise<T | undefined> {
  if (!key) throw new Error('[getServerSide] missing key — make sure keyedComposables is configured in the module')

  const { public: { debug } } = useRuntimeConfig()
  const app = useNuxtApp()

  debug && console.log(`[getServerSide:${key}] called on`, import.meta.server ? 'SERVER' : 'CLIENT')

  if (import.meta.server) {
    const result = await fn()
    app.payload[key] = result
    debug && console.log(`[getServerSide:${key}] fn() ran on server, result=`, result)
    return result
  }

  if (import.meta.client) {
    const result = app.payload[key] as T
    debug && console.log(`[getServerSide:${key}] read from payload on client, result=`, result)
    return result
  }
}
