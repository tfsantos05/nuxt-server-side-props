import { defineNuxtModule, createResolver, addImports } from '@nuxt/kit';

const module$1 = defineNuxtModule({
  meta: {
    name: "server-side-props",
    configKey: "serverSideProps"
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url);
    addImports([
      {
        name: "getServerSide",
        from: resolver.resolve("./runtime/app/composables/getServerSide")
      },
      {
        name: "clientOnly",
        from: resolver.resolve("./runtime/app/composables/clientOnly")
      },
      {
        name: "serverOnly",
        from: resolver.resolve("./runtime/app/composables/serverOnly")
      }
    ]);
    nuxt.options.runtimeConfig.public.debug = nuxt.options.debug;
    nuxt.options.optimization.keyedComposables.push({
      name: "getServerSide",
      source: resolver.resolve("./runtime/app/composables/getServerSide"),
      argumentLength: 2
      // key + fn, so calling with just fn triggers key injection
    });
  }
});

export { module$1 as default };
