import { defineConfig, type Plugin } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

// Stub `cloudflare:workers` in the client bundle so that server-only files
// (openai.ts, API route handlers) can be statically imported without breaking
// the client build. The actual `env` is only accessed inside server.handlers
// which TanStack Start excludes from the client bundle.
const cloudflareWorkersClientStub: Plugin = {
  name: "cloudflare-workers-client-stub",
  enforce: "pre",
  resolveId(id, _importer, options) {
    if (id === "cloudflare:workers" && !options?.ssr) {
      return "\0cloudflare:workers-stub";
    }
  },
  load(id) {
    if (id === "\0cloudflare:workers-stub") {
      return "export const env = {};";
    }
  },
};

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflareWorkersClientStub,
    devtools(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
