# perfumery — Belle Aire Atelier

A creative-instrument web app: a brand partner describes a feeling, and **M. Beaumont** (an OpenAI-driven master perfumer persona) composes a fragrance brief on a 64-vial perfume organ — partner-ready, IFRA-aware, with marketing copy and a concept safety profile drafted. Built on TanStack Start, deployed to Cloudflare Workers.

## Product overview

Three routes:

- **`/` (Composer)** — split layout: the perfume organ (3 tiers, 64 vials) on the left, the chat with M. Beaumont on the right. As the AI proposes compounds via a tool call, vials light up, the central flacon shifts colour to the weighted blend, and the composition table updates. CTA in the status strip generates a typeset brief.
- **`/brief/$ref`** — a saved brief, rendered like a printed R&D page (Fraunces display, IBM Plex Sans body, Plex Mono technical), with shareable `BAC-YYMMDD-XXXX` reference URLs.
- **`/library`** — list of every saved brief, oldest behind newest, with status (draft / transmitted) and direct links.

The "wow" is the **AI behaviour visible to the user**: streaming tokens, structured tool calls that mutate UI state in real time, streaming-structured brief assembly section-by-section, and a one-click **senior-perfumer self-critique** loop that re-reviews the brief with a separate prompt and surfaces 1–6 specific issues with severities.

## Stack (final)

- **Framework**: TanStack Start (React 19, file-based routing) — server-side rendering on Cloudflare Workers
- **Runtime**: Cloudflare Workers via `@cloudflare/vite-plugin`; bindings accessed via `import { env } from 'cloudflare:workers'`
- **Build/dev**: Vite 8 (`vite.config.ts`); plugin order `devtools → cloudflare → tailwindcss → tanstackStart → viteReact` (devtools must stay first)
- **Toolchain**: vite-plus (`vp lint`, `vp fmt`, `vp check`) wrapping oxlint + oxfmt + vitest
- **Styling**: Tailwind CSS 4 with custom design tokens in `src/styles.css` (`--color-ink/paper/amber/note-*`, `--font-display/sans/mono`, `--ease-quiet`)
- **Fonts**: Fraunces Variable (display), IBM Plex Sans 300/400 (body), IBM Plex Mono 400/500 (technical) — all loaded via `@fontsource(-variable)` packages
- **AI**: Vercel AI SDK (`ai` + `@ai-sdk/openai`) — `streamText` for chat with tool calls, `streamObject` for streaming structured brief, `generateObject` for one-shot critique; OpenAI `gpt-5-mini` for chat & critique, `gpt-5` for brief generation
- **Validation**: Zod 4 — schemas in `src/lib/brief-schema.ts` and `src/lib/tools.ts`
- **Server state**: TanStack Query 5 — route loaders use `queryClient.ensureQueryData`; non-stream surfaces (saved briefs list, brief detail) go through `useSuspenseQuery`
- **Client state**: Zustand 5 — single `useComposerStore` in `src/lib/store.ts` for composition + chat + brief draft + phase state machine (INITIAL → ENGAGED → COMPOSING → BRIEF_PENDING → BRIEF_OPEN)
- **DB**: Cloudflare D1 + Drizzle ORM. Single `briefs` table, schema in `src/db/schema.ts`. Local dev uses `wrangler dev --local` with persisted SQLite; migrations live in `drizzle/migrations/` (generated via `pnpm exec drizzle-kit generate`)
- **Package manager**: pnpm 10.x, Node 20+

## Project structure

```
src/
├── lib/
│   ├── compounds.ts          # 64 compounds with real CAS numbers, perfumer voice
│   ├── families.ts           # 10 olfactory families with palette colours
│   ├── prompts.ts            # M. Beaumont persona, brief & critique system prompts
│   ├── tools.ts              # AI SDK tool: propose_composition (Zod-validated)
│   ├── brief-schema.ts       # Zod schemas for Brief and Critique
│   ├── offline.ts            # 3 canned scenarios for offline demo mode
│   ├── ref.ts                # BAC-YYMMDD-XXXX generator (nanoid)
│   ├── store.ts              # Zustand composer store
│   └── types.ts              # ChatMessage, ChatStreamEvent, CompositionEntry
├── server/
│   ├── openai.ts             # cached AI SDK client + model constants + offline detection
│   ├── chat.ts               # chatStream (createServerFn, async generator, fullStream → ChatStreamEvent)
│   ├── brief.ts              # generateBrief (streamObject) + critiqueBrief (generateObject)
│   ├── briefs.ts             # saveBrief / getBrief / listBriefs / transmitBrief (D1 via Drizzle)
│   └── runtime.ts            # getRuntimeInfo — exposes hasOpenAI + demoMode to UI
├── db/
│   ├── schema.ts             # briefs table (sqlite-core)
│   └── client.ts             # drizzle(env.DB)
├── components/
│   ├── chat/                 # ChatPanel, ChatTurn (no bubbles), ChatInput
│   ├── palette/              # Organ (3 tiers), Vial, HoverCard, Flacon (blended liquid)
│   ├── chrome/               # TopBar (with offline scenario picker), StatusStrip
│   └── brief/                # BriefSheet (streaming structured assembly)
├── hooks/
│   ├── useChatStream.ts      # consumes async generator from chatStream server fn
│   └── useBriefStream.ts     # consumes async generator from generateBrief
└── routes/
    ├── __root.tsx
    ├── index.tsx             # Composer route
    ├── library.tsx
    └── brief.$ref.tsx        # Dynamic brief detail
```

## Environment variables

| Var              | Where                                              | Purpose                                                 |
| ---------------- | -------------------------------------------------- | ------------------------------------------------------- |
| `OPENAI_API_KEY` | `.dev.vars` (local) / `wrangler secret put` (prod) | Required for live chat + brief + critique               |
| `DEMO_MODE`      | `wrangler.jsonc` `vars`                            | `live` (default) or `offline` to force canned scenarios |

`getRuntimeInfo()` server function exposes `{ hasOpenAI, demoMode }` to the UI. If `OPENAI_API_KEY` is missing, the app **automatically** flips to offline demo mode and the TopBar reveals the scenario picker — the demo always works.

To run locally with live AI:

```bash
echo "OPENAI_API_KEY=sk-..." > .dev.vars
pnpm dev
```

## Deployment (Cloudflare Workers)

1. `pnpm dlx wrangler login` (one time, interactive)
2. `pnpm dlx wrangler d1 create perfumery` — copy the returned `database_id` into `wrangler.jsonc` (replacing `local-dev-placeholder`)
3. `pnpm dlx wrangler d1 migrations apply perfumery --remote` — apply the schema in production
4. `pnpm dlx wrangler secret put OPENAI_API_KEY`
5. `pnpm deploy` (alias for `pnpm build && wrangler deploy`)

For local dev, no Cloudflare login is required — `wrangler dev --local` (which `vite dev` invokes via the cloudflare plugin) creates an in-process D1 SQLite at `.wrangler/state/v3/d1/`. Migrations applied via `pnpm dlx wrangler d1 migrations apply perfumery --local`.

## Scripts

- `pnpm dev` — Vite dev server (port 3000) with SSR + Cloudflare runtime
- `pnpm build` — production build (client + SSR worker bundle to `dist/`)
- `pnpm preview` — preview built worker
- `pnpm test` — vitest run
- `pnpm lint` / `pnpm lint:fix` — oxlint via `vp lint`
- `pnpm format` / `pnpm format:check` — oxfmt via `vp fmt`
- `pnpm check` — full gate: format + lint + typecheck
- `pnpm deploy` — `pnpm build && wrangler deploy`

Drizzle:

- `pnpm exec drizzle-kit generate --name <name>` — generate a new migration from schema diff
- `pnpm dlx wrangler d1 migrations apply perfumery --local` — apply locally
- `pnpm dlx wrangler d1 migrations apply perfumery --remote` — apply in production

## Architectural decisions

- **No API routes — server functions only.** Per the project mandate. All AI calls and DB access run through `createServerFn` handlers in `src/server/`. Streaming uses async generators (`async function*` + `for await` on the client). This is the TanStack Start native pattern; clean type inference end-to-end.
- **Vercel AI SDK over raw OpenAI SDK.** Gives us framework-agnostic `streamText` / `streamObject` / `generateObject` with native Zod tool schemas. The provider is OpenAI but the same code would swap to Anthropic with one line.
- **AI SDK `tool()` for `propose_composition`.** When M. Beaumont names compounds, the model emits a structured tool call with compound IDs, percents, roles. The server function validates the input against the static palette and rejects unknown IDs _before_ it reaches the client. This is what makes the "vials light up as the perfumer narrates" effect deterministic — bottle highlights are driven by validated server events, not text parsing.
- **`streamObject` for the brief.** Lets the brief assemble section-by-section in the UI rather than appearing as a single payload. Genuinely different feel from a "loading…" spinner.
- **Self-critique as a second-pass model call.** `critiqueBrief` runs `generateObject` with a separate "senior perfumer reviewing a junior's brief" prompt. The output is a structured `Critique` (overall + 1–6 issues with severity). One-click affordance in the BriefSheet.
- **Composition is client state, brief is server state.** Composition lives in Zustand and only persists when the user clicks "Send to Belle Aire" (which writes to D1 and flips status to `transmitted`). This keeps the demo predictable — refresh and you start over.
- **Zustand without persistence middleware.** Intentional — refresh = fresh demo. The BriefSheet write to D1 _is_ the persistence layer. Library route reads from D1.
- **Offline mode is automatic, not a feature flag.** If `OPENAI_API_KEY` is missing, `getRuntimeInfo()` returns `demoMode: 'offline'` and the TopBar shows the scenario picker. The same chat/brief code paths handle offline by checking `isOfflineMode()` at the top of each server function and yielding canned events from `lib/offline.ts`. Three scenarios are pre-scripted: Storm over Provence, First library card, Belle Aire's own brief (luxury hotel candle).
- **64 compounds with real CAS numbers.** Spec required real-world data so a perfumer can verify on sight. The `classicPairings` field references compound IDs that may not exist in our 64-compound subset — that's intentional metadata for future expansion, not a bug.
- **Design system in `src/styles.css` `@theme`.** Tailwind 4 reads CSS variables as theme tokens, so `text-[var(--color-amber-2)]` and `bg-[var(--color-ink)]` work without configuring Tailwind. Custom motion easing `--ease-quiet: cubic-bezier(0.32, 0.72, 0, 1)` per the design hints.
- **No 3D scene.** Per direction, replaced with a 2D vial grid that respects the editorial-apothecary aesthetic. Vials are procedural HTML/CSS — family-coloured liquid, brass cap, hairline meniscus. When a compound is in the composition, its liquid level rises proportional to percent.
- **Devtools plugin stays first** in `vite.config.ts` (required by `@tanstack/devtools-vite`).

## Known gotchas

- **Vials reference compound IDs in `classicPairings` that may not be in the 64-compound palette** (e.g. `mousse-de-chêne`, `lavande`, `patchouli`). These appear in the UI through the hover card. The AI is instructed to only use IDs that exist in the live palette — but the data file's `classicPairings` is illustrative metadata, not strictly validated.
- **The compose tool input goes through Zod twice** — once via the AI SDK's tool schema, once again via `validateProposal` in `src/lib/tools.ts`. This is intentional: the AI SDK validates shape, our function validates compound IDs against the static palette and catches duplicates. Small overhead for a real safety net against model hallucinations.
- **Two oxlint/oxfmt version sources.** vite-plus 0.1.20 bundles oxlint 1.61 + oxfmt 0.46; standalone deps are 1.63 + 0.48. `pnpm lint` uses the bundled versions. Cosmetic.
- **Local D1 migrations re-run only if the SQL file is new.** If you edit `drizzle/migrations/0000_init.sql` after first apply, you need to drop the local DB at `.wrangler/state/v3/d1/` to force re-apply.
- **`worker-configuration.d.ts` must be regenerated when `wrangler.jsonc` changes** — run `pnpm dlx wrangler types --env-interface CloudflareEnv worker-configuration.d.ts` after adding bindings or vars.
- **`@cloudflare/workers-types` was removed** in favour of the wrangler-generated `worker-configuration.d.ts`. Don't add it back.
- **Intent skill description for `@tanstack/devtools-vite` says "Vite ^6 || ^7 only"** — stale, Vite 8 builds cleanly. Ignore.
- **The `--agent` flag on `@tanstack/cli` is internal.** Use `--intent` (used during scaffold).
- **`--tailwind` is deprecated** — Tailwind is always on.

## Next steps

- [ ] `pnpm dlx wrangler login` + create a real D1 in Cloudflare and update `wrangler.jsonc database_id` before any production deploy
- [ ] Add `OPENAI_API_KEY` to `.dev.vars` for local live testing of the AI flow
- [ ] Run a manual end-to-end with a real key: type "I want something that feels like the morning after rain in a cedar forest," observe vials lighting up, generate brief, run senior critique, hit "Send to Belle Aire," verify the brief appears in `/library` with `transmitted` status
- [ ] When Claude Design replaces the UI: keep the AGENTS.md design tokens stable (`--color-amber`, `--font-display`, `--ease-quiet`) so the AI logic doesn't need to move — only the components in `src/components/` should be replaced
- [ ] Add `prefers-reduced-motion` honour to vial pour animation (CSS already does this globally; verify amber-ping is also gated)
- [ ] Optional: PDF export via `@react-pdf/renderer` (deferred — JSON download already works)
- [ ] Optional: parallel "give me 3 directions" mode that fans out three brief variants for side-by-side comparison
- [ ] Decide whether to drop the redundant standalone `oxlint` / `oxfmt` devDeps and rely solely on `vite-plus` bundled versions

## Demo script

For a 60-second demo with no internet:

1. Start the app, no `OPENAI_API_KEY` set — it auto-falls into offline mode
2. Pick "Belle Aire's own brief — luxury hotel lobby" from the demo selector in the top-right
3. Paste the canned prompt: _"A premium home candle for a luxury hotel. Lobby scent. Should feel expensive but not perfumed-room expensive."_
4. Watch M. Beaumont compose — eight specific vials light up, the flacon turns honey-amber, the composition table fills
5. Click **Generate Brief** in the status strip — watch the brief assemble section by section in front of you
6. Click **Request senior critique** — three structured issues appear with severities
7. Click **Send to Belle Aire** — the brief is persisted to D1 with status `transmitted`
8. Navigate to `/library` to see it on the shelf, then `/brief/<ref>` to see the shareable URL

## Working with skills

Before substantial work, run `pnpm dlx @tanstack/intent@latest list` to see the 30 skills shipped with the libraries below, and `pnpm dlx @tanstack/intent@latest load <package>#<skill>` to load a specific one. The map below is the source of truth — it's regenerated by `intent install`, so do not edit it by hand.

<!-- intent-skills:start -->

# Skill mappings - load `use` with `npx @tanstack/intent@latest load <use>`.

skills:

- when: "Install TanStack Devtools, pick framework adapter (React/Vue/Solid/Preact), register plugins via plugins prop, configure shell (position, hotkeys, theme, hideUntilHover, requireUrlFlag, eventBusConfig). TanStackDevtools component, defaultOpen, localStorage persistence."
  use: "@tanstack/devtools#devtools-app-setup"
- when: "Publish plugin to npm and submit to TanStack Devtools Marketplace. PluginMetadata registry format, plugin-registry.ts, pluginImport (importName, type), requires (packageName, minVersion), framework tagging, multi-framework submissions, featured plugins."
  use: "@tanstack/devtools#devtools-marketplace"
- when: "Build devtools panel components that display emitted event data. Listen via EventClient.on(), handle theme (light/dark), use @tanstack/devtools-ui components. Plugin registration (name, render, id, defaultOpen), lifecycle (mount, activate, destroy), max 3 active plugins. Two paths: Solid.js core with devtools-ui for multi-framework support, or framework-specific panels."
  use: "@tanstack/devtools#devtools-plugin-panel"
- when: "Handle devtools in production vs development. removeDevtoolsOnBuild, devDependency vs regular dependency, conditional imports, NoOp plugin variants for tree-shaking, non-Vite production exclusion patterns."
  use: "@tanstack/devtools#devtools-production"
- when: "Two-way event patterns between devtools panel and application. App-to-devtools observation, devtools-to-app commands, time-travel debugging with snapshots and revert. structuredClone for snapshot safety, distinct event suffixes for observation vs commands, serializable payloads only."
  use: "@tanstack/devtools-event-client#devtools-bidirectional"
- when: "Create typed EventClient for a library. Define event maps with typed payloads, pluginId auto-prepend namespacing, emit()/on()/onAll()/onAllPluginEvents() API. Connection lifecycle (5 retries, 300ms), event queuing, enabled/disabled state, SSR fallbacks, singleton pattern. Unique pluginId requirement to avoid event collisions."
  use: "@tanstack/devtools-event-client#devtools-event-client"
- when: "Analyze library codebase for critical architecture and debugging points, add strategic event emissions. Identify middleware boundaries, state transitions, lifecycle hooks. Consolidate events (1 not 15), debounce high-frequency updates, DRY shared payload fields, guard emit() for production. Transparent server/client event bridging."
  use: "@tanstack/devtools-event-client#devtools-instrumentation"
- when: "Configure @tanstack/devtools-vite for source inspection (data-tsd-source, inspectHotkey, ignore patterns), console piping (client-to-server, server-to-client, levels), enhanced logging, server event bus (port, host, HTTPS), production stripping (removeDevtoolsOnBuild), editor integration (launch-editor, custom editor.open). Must be FIRST plugin in Vite config. Vite ^6 || ^7 only."
  use: "@tanstack/devtools-vite#devtools-vite-plugin"
- when: "Step-by-step migration from Next.js App Router to TanStack Start: route definition conversion, API mapping, server function conversion from Server Actions, middleware conversion, data fetching pattern changes."
  use: "@tanstack/react-start#lifecycle/migrate-from-nextjs"
- when: "React bindings for TanStack Start: createStart, StartClient, StartServer, React-specific imports, re-exports from @tanstack/react-router, full project setup with React, useServerFn hook."
  use: "@tanstack/react-start#react-start"
- when: "Implement, review, debug, and refactor TanStack Start React Server Components in React 19 apps. Use when tasks mention @tanstack/react-start/rsc, renderServerComponent, createCompositeComponent, CompositeComponent, renderToReadableStream, createFromReadableStream, createFromFetch, Composite Components, React Flight streams, loader or query owned RSC caching, router.invalidate, structuralSharing: false, selective SSR, stale names like renderRsc or .validator, or migration from Next App Router RSC patterns. Do not use for generic SSR or non-TanStack RSC frameworks except brief comparison."
  use: "@tanstack/react-start#react-start/server-components"
- when: "Framework-agnostic core concepts for TanStack Router: route trees, createRouter, createRoute, createRootRoute, createRootRouteWithContext, addChildren, Register type declaration, route matching, route sorting, file naming conventions. Entry point for all router skills."
  use: "@tanstack/router-core#router-core"
- when: "Route protection with beforeLoad, redirect()/throw redirect(), isRedirect helper, authenticated layout routes (\_authenticated), non-redirect auth (inline login), RBAC with roles and permissions, auth provider integration (Auth0, Clerk, Supabase), router context for auth state."
  use: "@tanstack/router-core#router-core/auth-and-guards"
- when: "Automatic code splitting (autoCodeSplitting), .lazy.tsx convention, createLazyFileRoute, createLazyRoute, lazyRouteComponent, getRouteApi for typed hooks in split files, codeSplitGroupings per-route override, splitBehavior programmatic config, critical vs non-critical properties."
  use: "@tanstack/router-core#router-core/code-splitting"
- when: "Route loader option, loaderDeps for cache keys, staleTime/gcTime/ defaultPreloadStaleTime SWR caching, pendingComponent/pendingMs/ pendingMinMs, errorComponent/onError/onCatch, beforeLoad, router context and createRootRouteWithContext DI pattern, router.invalidate, Await component, deferred data loading with unawaited promises."
  use: "@tanstack/router-core#router-core/data-loading"
- when: "Link component, useNavigate, Navigate component, router.navigate, ToOptions/NavigateOptions/LinkOptions, from/to relative navigation, activeOptions/activeProps, preloading (intent/viewport/render), preloadDelay, navigation blocking (useBlocker, Block), createLink, linkOptions helper, scroll restoration, MatchRoute."
  use: "@tanstack/router-core#router-core/navigation"
- when: "notFound() function, notFoundComponent, defaultNotFoundComponent, notFoundMode (fuzzy/root), errorComponent, CatchBoundary, CatchNotFound, isNotFound, NotFoundRoute (deprecated), route masking (mask option, createRouteMask, unmaskOnReload)."
  use: "@tanstack/router-core#router-core/not-found-and-errors"
- when: "Dynamic path segments ($paramName), splat routes ($ / \_splat), optional params ({-$paramName}), prefix/suffix patterns ({$param}.ext), useParams, params.parse/stringify, pathParamsAllowedCharacters, i18n locale patterns."
  use: "@tanstack/router-core#router-core/path-params"
- when: "validateSearch, search param validation with Zod/Valibot/ArkType adapters, fallback(), search middlewares (retainSearchParams, stripSearchParams), custom serialization (parseSearch, stringifySearch), search param inheritance, loaderDeps for cache keys, reading and writing search params."
  use: "@tanstack/router-core#router-core/search-params"
- when: "Non-streaming and streaming SSR, RouterClient/RouterServer, renderRouterToString/renderRouterToStream, createRequestHandler, defaultRenderHandler/defaultStreamHandler, HeadContent/Scripts components, head route option (meta/links/styles/scripts), ScriptOnce, automatic loader dehydration/hydration, memory history on server, data serialization, document head management."
  use: "@tanstack/router-core#router-core/ssr"
- when: "Full type inference philosophy (never cast, never annotate inferred values), Register module declaration, from narrowing on hooks and Link, strict:false for shared components, getRouteApi for code-split typed access, addChildren with object syntax for TS perf, LinkProps and ValidateLinkOptions type utilities, as const satisfies pattern."
  use: "@tanstack/router-core#router-core/type-safety"
- when: "TanStack Router bundler plugin for route generation and automatic code splitting. Supports Vite, Webpack, Rspack, and esbuild. Configures autoCodeSplitting, routesDirectory, target framework, and code split groupings."
  use: "@tanstack/router-plugin#router-plugin"
- when: "Core overview for TanStack Start: tanstackStart() Vite plugin, getRouter() factory, root route document shell (HeadContent, Scripts, Outlet), client/server entry points, routeTree.gen.ts, tsconfig configuration. Entry point for all Start skills."
  use: "@tanstack/start-client-core#start-core"
- when: "Deploy to Cloudflare Workers, Netlify, Vercel, Node.js/Docker, Bun, Railway. Selective SSR (ssr option per route), SPA mode, static prerendering, ISR with Cache-Control headers, SEO and head management."
  use: "@tanstack/start-client-core#start-core/deployment"
- when: "Isomorphic-by-default principle, environment boundary functions (createServerFn, createServerOnlyFn, createClientOnlyFn, createIsomorphicFn), ClientOnly component, useHydrated hook, import protection, dead code elimination, environment variable safety (VITE\_ prefix, process.env)."
  use: "@tanstack/start-client-core#start-core/execution-model"
- when: "createMiddleware, request middleware (.server only), server function middleware (.client + .server), context passing via next({ context }), sendContext for client-server transfer, global middleware via createStart in src/start.ts, middleware factories, method order enforcement, fetch override precedence."
  use: "@tanstack/start-client-core#start-core/middleware"
- when: "createServerFn (GET/POST), inputValidator (Zod or function), useServerFn hook, server context utilities (getRequest, getRequestHeader, setResponseHeader, setResponseStatus), error handling (throw errors, redirect, notFound), streaming, FormData handling, file organization (.functions.ts, .server.ts)."
  use: "@tanstack/start-client-core#start-core/server-functions"
- when: "Server-side API endpoints using the server property on createFileRoute, HTTP method handlers (GET, POST, PUT, DELETE), createHandlers for per-handler middleware, handler context (request, params, context), request body parsing, response helpers, file naming for API routes."
  use: "@tanstack/start-client-core#start-core/server-routes"
- when: "Server-side runtime for TanStack Start: createStartHandler, request/response utilities (getRequest, setResponseHeader, setCookie, getCookie, useSession), three-phase request handling, AsyncLocalStorage context."
  use: "@tanstack/start-server-core#start-server-core"
- when: "Programmatic route tree building as an alternative to filesystem conventions: rootRoute, index, route, layout, physical, defineVirtualSubtreeConfig. Use with TanStack Router plugin's virtualRouteConfig option."
use: "@tanstack/virtual-file-routes#virtual-file-routes"
<!-- intent-skills:end -->
