import { defineNuxtModule, createResolver, addImports } from '@nuxt/kit'

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'server-side-props',
    configKey: 'serverSideProps',
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Register composables for auto-import
    addImports([{
      name: 'getServerSide',
      from: resolver.resolve('./runtime/app/composables/getServerSide'),
    },
    {
      name: 'clientOnly',
      from: resolver.resolve('./runtime/app/composables/clientOnly')
    },
    {
      name: 'serverOnly',
      from: resolver.resolve('./runtime/app/composables/serverOnly')
    }])

    // Expose nuxt.config debug flag to runtime
    nuxt.options.runtimeConfig.public.debug = nuxt.options.debug

    // Auto-inject a stable key when called without one
    nuxt.options.optimization.keyedComposables.push({
      name: 'getServerSide',
      source: resolver.resolve('./runtime/app/composables/getServerSide'),
      argumentLength: 2, // key + fn, so calling with just fn triggers key injection
    })
  },
})
