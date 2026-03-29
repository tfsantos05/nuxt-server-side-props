# Nuxt Server Side Props

[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A Nuxt module that provides composables to run code exclusively on the server or client, with automatic payload hydration.

## Features

- 🖥️ &nbsp;`getServerSide` — run code on the server, result automatically hydrated to the client
- 🔒 &nbsp;`serverOnly` — run code on the server only, client gets nothing
- 💻 &nbsp;`clientOnly` — run code on the client only, server does nothing
- 🔑 &nbsp;Automatic stable key injection — overridable for loops and conditionals
- 🐛 &nbsp;Debug logging via `nuxt.config` `debug` flag

## Setup

Install the module:

```bash
# from GitHub
pnpm add github:tfsantos05/nuxt-server-side-props
```

Add it to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-server-side-props']
})
```

That's it! All composables are auto-imported. ✨

## When to Use Each

| Composable | Server | Client | Events | SSR Only |
|-----------|--------|--------|--------|----------|
| `getServerSide` | ✅ Runs | ✅ Gets result | ❌ No | ✅ Yes |
| `serverOnly` | ✅ Runs | ❌ Undefined | ❌ No | ✅ Yes |
| `clientOnly` | ❌ Undefined | ✅ Runs | ✅ Yes | ❌ No |

**Summary:**
- **Only onLoad / top-level:** `getServerSide`, `serverOnly` (SSR)
- **Event-ready:** `clientOnly` (browser)


## Usage

### `getServerSide(fn)`

Runs `fn` on the server only. The result is serialized into the Nuxt payload and hydrated on the client — no re-execution, no extra requests.

> 🔒 **Everything inside `getServerSide` runs exclusively on the server.** Your secrets, database clients, file system access and internal logic never reach the browser — not even in the bundle.

```vue
<script setup lang="ts">
const user = await getServerSide(async () => {
  // ✅ SERVER ONLY — never sent to the client
  // safe to use db clients, secrets, fs, env vars, etc.
  return await db.query('SELECT * FROM users WHERE id = 1')
})
</script>

<template>
  <div>{{ user }}</div>
</template>
```

- ‼️ <code>getServerSide()</code> should only be used **on load / top-level** cause it runs during **SSR**
- ❌ **NEVER USE** on **client-side events** like *@click* (it simply won't work)
- ⚠️ **Careful** when wrapping on functions! If calling more than once, **use manual and different keys each time**.


```vue
<script setup lang="ts">
function getSomething() {
  return await getServerSide(() => { return server_logic(); });
}
function manualGetSomething(key) {
  return await getServerSide(() => { return server_logic(); }, key);
}

getSomething(); // running it top-level works ✅

// ⚠️ CAREFUL !!!
// if calling more than once, use different keys !!
// (if you don't, each call will overwrite the previous).

getSomething(); // Nuxt Auto-Injects a key on the function call.
getSomething(); // ❌ The same auto key will be used. 💥 THIS WILL CAUSE OVERWRITE !

// if calling more than once, do this instead ✅
// (use manual keys) 

manualGetSomething("key1");
manualGetSomething("key2");

</script>

<template>
  {{ /* This will not work. 🚫 */ }}
  <button @click="submit()">Send</button>

  {{ /* This will work since it's called on load ✅ */}}
  <span>{{ getSomething() }}</span>
</template>
```

The client receives only the **result** via the Nuxt payload — the function body, imports, and any secrets inside never leave the server.

#### `async` vs sync functions

The callback can be sync or async — use `async` when you need to `await` something, skip it when you don't:

> The async vs sync callback function applies to <code>clientOnly</code> and <code>serverOnly</code> too.

```vue
<script setup lang="ts">
// ✅ sync — no async needed, result is immediate
const config = await getServerSide(() => {
  return process.env.APP_NAME
})

// ✅ async — needed when awaiting a promise (db, fetch, fs promises, etc.)
const user = await getServerSide(async () => {
  return await db.query('SELECT * FROM users LIMIT 1')
})
</script>
```

> Note: `getServerSide` itself always needs to be `await`ed regardless — that's what suspends the component until the server result is ready. The `async` on the inner function is only needed if you're awaiting something inside it.

#### Using Node.js built-ins

```vue
<script setup lang="ts">
const content = await getServerSide(async () => {
  const { readFileSync } = await import('node:fs')
  return readFileSync('/etc/config/app.json', 'utf-8')
})
</script>
```

#### Using `#server` utilities

You can import your own server utilities from `server/utils/` using the `#server` alias:

```ts
// server/utils/db.ts
export default async function getUser(id: number) {
  return await db.query('SELECT * FROM users WHERE id = ?', [id])
}
```

```vue
<script setup lang="ts">
const user = await getServerSide(async () => {
  const { default: getUser } = await import('#server/utils/db')
  return getUser(1)
})
</script>
```

<br>

The client receives only the returned value — `#server` imports are never bundled into the client.

### `serverOnly(fn)`

Runs `fn` on the server only. Unlike `getServerSide`, the result is **not** hydrated to the client. Useful for server-side side effects like logging, auditing, or seeding.

> 🔒 **Code inside `serverOnly` never reaches the client** — not the result, not the function body, nothing.

```vue
<script setup lang="ts">
await serverOnly(async () => {
  // ✅ SERVER ONLY — client gets undefined back
  await auditLog.write('page visited', { user: req.user })
})
</script>
```

> Returns `undefined` on the client — don't rely on the return value in client-side code.

- ❌ Like <code>getServerSide()</code>, <code>serverSide()</code> can only be called **top-level / on load**, cause it also runs during **SSR**.
- 💧 There is no hydration. No need to inject keys at all.

```vue
<script setup lang="ts">

function serverLogging() {
  return await serverOnly(() => { return runSomething(); });
}

const s = serverLogging(); // You can call this top-level ✅
// 's' will have value during SSR. ✅
// but will be "undefined" for the client. ❌
// so 's' is safe to use 👍🏼

</script>
<template>
{{ /* Again, this won't work 🚫 */ }}
<button @click="serverLogging()"></button>
</template>
```

### `clientOnly(fn)`

Runs `fn` on the client only. Server does nothing and returns `undefined` during SSR.

> 💻 **Code inside `clientOnly` only runs in the browser** — safe to use `window`, `localStorage`, browser APIs, etc.

```vue
<script setup lang="ts">
const analytics = await clientOnly(async () => {
  // ✅ CLIENT ONLY — server gets undefined back
  return await loadAnalytics()
})
</script>
```

> Returns `undefined` on the server — guard against it if you use the value during SSR.

> Run it anywhere you want. Top-level, client-side events (like @click), functions.
```vue
<script setup lang="ts">
  function getBody() {
    return clientOnly(() => { return document.body.getHTML(); }); // safe to run bnowser API
  }

  getBody(); // this works ✅

</script>

<template>
{{ /* This works too ✅ */ }}
<button @click="getBody()"></button>

{{ /* This also works ✅ */ }}
<span> {{ getBody() }}</span>
</template>

```

## Debug Logging

Enable debug logs by setting `debug: true` in your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-server-side-props'],
  debug: true
})
```

This will log each composable call, when `fn` runs, and what gets read from the payload.

## How it works

- `getServerSide` uses `import.meta.server` to run `fn` and write the result directly to `nuxtApp.payload`. On the client, it reads from the payload — no fetch, no re-run.
- `serverOnly` and `clientOnly` use compile-time `import.meta.server` / `import.meta.client` flags. Vite strips the dead branch entirely at build time — the server code never reaches the client bundle.
- Keys are auto-injected by Nuxt's `keyedComposables` — each call site gets a stable hash based on file path and line number, same mechanism as `useState` and `useAsyncData`.

## Limitations

- **`getServerSide` cannot be called conditionally or inside loops.** The key is injected at the call site at build time, so the call must always be reachable and at a stable location — same restriction as `useState` and `useAsyncData`.

```ts
// ❌ wrong — conditional call, unstable key
if (user.isAdmin) {
  const data = await getServerSide(() => getAdminData())
}

// ✅ correct — always called, filter inside
const data = await getServerSide(() => {
  if (user.isAdmin) return getAdminData()
  return null
})
```

**Need to call inside a loop or conditional?** Pass a manual key as the second argument to bypass auto-injection:

```ts
// ✅ manual key — safe inside loops
for (const id of ids) {
  const item = await getServerSide(() => fetchItem(id), `item-${id}`)
}

// ✅ manual key — safe inside conditionals
if (isAdmin) {
  const data = await getServerSide(() => getAdminData(), 'admin-data')
}
```

Manual keys must be unique per call site — collisions will cause one call to overwrite another's payload entry.

- **Return values must be serializable.** The result is stored in `nuxtApp.payload` as JSON, so functions, class instances, and circular references won't survive the transfer. Stick to plain objects, arrays, strings, numbers, and buffers.

- **`serverOnly` and `clientOnly` return `undefined` on the opposite side** — always handle that case if you use the return value.

## Contribution

<details>
  <summary>Local development</summary>

  ```bash
  # Install dependencies
  pnpm install

  # Generate type stubs
  pnpm run dev:prepare

  # Develop with the playground
  pnpm run dev

  # Build the playground
  pnpm run dev:build

  # Run ESLint
  pnpm run lint

  # Run Vitest
  pnpm run test
  pnpm run test:watch
  ```

</details>

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-server-side-props/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-server-side-props

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-server-side-props.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-server-side-props

[license-src]: https://img.shields.io/npm/l/nuxt-server-side-props.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-server-side-props

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt
[nuxt-href]: https://nuxt.com
