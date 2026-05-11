# ADR 0001: Roadmap and design target

Date: 2026-05-07 (originally drafted as ADR 0002 in vylit-ui; relocated here on lib extraction)

## Status

Accepted. The lib was extracted from `vylit-ui`'s in-app implementation on 2026-05-07. Slices 1–3 ship the design target's "direct equivalents" + "easy additions" lists. Remaining items (sonner adapter, Solid mirror, etc.) are tracked here as `TODO`.

## Context

This lib is a 1:1 adaptation of [`remix-toast`](https://github.com/code-forge-io/remix-toast) for Tanstack Start. As of extraction (2026-05-07) there is no published TSS toast library; remix-toast's author (`alemtuzlak`, a TanStack maintainer) has not ported it. This is a real ecosystem gap.

This doc maps every public export of `remix-toast` to its TSS equivalent — what we have, what's still on the easy-additions list, and what we deliberately don't port. When adding new features, design them lib-first: server-only, generic where possible, no consumer-specific assumptions baked in.

## remix-toast → tanstack-start-toast export map

remix-toast exports four families: `setToast`/`getToast` (middleware mode), `redirectWith*`, `replaceWith*`, `dataWith*`, plus configuration helpers. Total: 23 public exports across `index.ts` + `middleware/index.ts`.

### Direct equivalents — already have ✅

| remix-toast                                                     | tanstack-start-toast                                                                | Notes                                                                                                                                         |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `setToast(context, toast)` (middleware)                         | `setFlashToast(input, defaultType?)`                                                | Same semantics. TSS lacks RR's `RouterContextProvider`, so we take the raw toast input + use AsyncLocalStorage-backed cookie writers.         |
| `getToast(request)` (legacy) / `getToast(context)` (middleware) | `consumeFlashToast()` (direct) + `consumeFlashToastFn` (server fn for root loaders) | Always returns `FlashToast \| null`, always clears. Caller doesn't manage headers — the cookie clear is staged on the response automatically. |
| `redirectWithToast(url, toast)`                                 | `redirectWithToast(href, input)`                                                    | Returns `Promise<never>` — TSS's throw-based redirect model.                                                                                  |
| `redirectWithSuccess(url, msg)`                                 | `redirectWithSuccess(href, input)`                                                  | Same.                                                                                                                                         |
| `redirectWithError(url, msg)`                                   | `redirectWithError(href, input)`                                                    | Same.                                                                                                                                         |
| `redirectWithInfo(url, msg)`                                    | `redirectWithInfo(href, input)`                                                     | Same.                                                                                                                                         |
| `redirectWithWarning(url, msg)`                                 | `redirectWithWarning(href, input)`                                                  | Same.                                                                                                                                         |

**Currently exported (8):** `setFlashToast`, `consumeFlashToast`, `consumeFlashToastFn`, `redirectWithToast`, `redirectWithSuccess`, `redirectWithError`, `redirectWithInfo`, `redirectWithWarning`. Plus the `flashToastSchema` zod schema and `FlashToast`/`FlashToastInput`/`FlashToastType` types.

### Easy additions — can ship before extraction 🟡

| remix-toast                                             | tanstack-start-toast             | Effort                | Notes                                                                                                                                                           |
| ------------------------------------------------------- | -------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `replaceWithToast(url, toast)`                          | `replaceWithToast(href, input)`  | ~5 LOC                | Mirrors `redirectWith*` but uses `redirect({ replace: true })` so it doesn't add a history entry.                                                               |
| `replaceWithSuccess`/`Error`/`Info`/`Warning`(url, msg) | Same names                       | ~5 LOC each (factory) | Trivial wrapping of `replaceWithToast`.                                                                                                                         |
| `setToastCookieOptions(options)`                        | `setFlashCookieOptions(options)` | ~20 LOC               | Today the lib hardcodes cookie name + maxAge + httpOnly. Ship a `setFlashCookieOptions({ name?, maxAge?, secure?, sameSite? })` for users who want to override. |

These are mechanical wrappers — adding them costs little and brings the export count to 14. We should add them when they have a real consumer in this codebase OR when we extract the lib, whichever comes first.

### Conceptual mismatches — needs design work 🟠

| remix-toast                                                                        | TSS gap                                                                                                                                                                                                                                   | Current thinking                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dataWithToast(data, toast)` `dataWithSuccess`/`Error`/`Info`/`Warning`(data, msg) | RR's `data()` returns a `Response` carrying both data + headers (cookie). TSS server fns return JSON; the cookie write is via `setCookie` on the underlying h3 event, which already happens automatically when `setFlashToast` is called. | **`dataWithToast` becomes unnecessary in TSS.** A user who wants "stage toast + return data" just calls `setFlashToast` (cookie staged) then returns whatever data. The cookie write isn't tied to the response object the way it is in RR. We can choose to ship sugar: `dataWithToast = (data, toast) => { setFlashToast(toast); return data; }` — but it's strictly less useful in TSS. **Don't ship until a real consumer asks.** |
| `createToastUtilsWithCustomSession(session)`                                       | Returns a bound version of every helper using a user-supplied SessionStorage. RR-specific.                                                                                                                                                | **Replace with `setFlashCookieOptions`.** TSS users don't need a separate "custom session storage" concept — they configure cookie options once at app boot. The use case (e.g. "I want my flash cookie to use a different secret than my auth session") is satisfied by `setFlashCookieOptions({ ... })`.                                                                                                                            |
| `unstable_toastMiddleware`                                                         | RR's middleware exports `toastMiddleware()` for users wiring it into `root.tsx`'s `middleware` array. TSS doesn't have request-level middleware in the same sense.                                                                        | **Don't port.** TSS's equivalent is calling `consumeFlashToastFn` from `__root.tsx`'s loader. That's already the documented pattern in the lib's setup section.                                                                                                                                                                                                                                                                       |

### TSS-specific additions — no remix-toast equivalent 🆕

These are features remix-toast doesn't have but TSS users might want:

| Proposed export                                         | Use case                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<ToastBridgeRenderer toast={...} />` (React component) | A drop-in renderer that takes the loaderData toast + fires it through any toast lib (sonner, react-toastify, sonner-react, custom). Saves users from writing the `useEffect` + sessionStorage dedupe pattern. Configurable via prop: `notify={(t) => sonner[t.type](t.message, t)}`. |
| `useFlashToast()` hook                                  | If the user prefers reading the toast via context rather than threading it through loaderData. Niche; defer.                                                                                                                                                                         |

The renderer component is the highest-value TSS-native addition. It would absorb ~30 LOC of boilerplate from every consumer.

## Final lib export shape (target)

After all "easy additions" land:

```ts
// tanstack-start-toast/src/index.server.ts

// === Wire format ===
export type FlashToast        // {message, type, description?, duration?, _id}
export type FlashToastInput   // string | {message, type?, description?, duration?}
export type FlashToastType    // 'info' | 'success' | 'error' | 'warning'
export const flashToastSchema // z.object(...)

// === Configuration ===
export function setFlashCookieOptions(opts: FlashCookieOptions): void

// === Primitives ===
export async function setFlashToast(input, defaultType?)
export async function consumeFlashToast(): Promise<FlashToast | null>
export const consumeFlashToastFn  // server-fn — for root-loader use

// === Redirect helpers (push history) ===
export async function redirectWithToast(href, input)        // Promise<never>
export async function redirectWithSuccess(href, input)
export async function redirectWithError(href, input)
export async function redirectWithInfo(href, input)
export async function redirectWithWarning(href, input)

// === Replace helpers (no history entry) ===
export async function replaceWithToast(href, input)
export async function replaceWithSuccess(href, input)
export async function replaceWithError(href, input)
export async function replaceWithInfo(href, input)
export async function replaceWithWarning(href, input)
```

That's **17 exports** + 4 types/schema. remix-toast has 23 (counting the data-family which we deliberately drop). Functionally equivalent for every redirect-and-toast use case.

## The renderer source-order constraint (#1 footgun)

**This must be flagged prominently when publishing the lib.** It's the single highest-risk bit of integration knowledge a user needs.

The renderer fires its toast inside a `useEffect`. Sonner's `<Toaster>` subscribes inside its own `useEffect`. **React commits sibling effects in source order**, so if the renderer is rendered BEFORE `<Toaster>` in the JSX tree, the renderer's `notify(...)` fires before any subscriber exists. Sonner stores the toast in its internal `ToastState.toasts` array but **does not replay it** when `<Toaster>` later subscribes. Symptom: the cookie is read correctly, the renderer fires, but no toast appears in the DOM. Tracked in sonner #168 / #341 / #723 and shadcn-ui #2175. The constraint is identical for any toast lib whose renderer subscribes lazily — react-toastify, sonner-react, custom — so it isn't a sonner-specific gotcha.

The fix is one rule for users: **"render `<Toaster>` (or your toast lib's renderer) BEFORE `<ToastBridgeRenderer />` in your JSX tree."** Reverse order works; same order breaks silently.

When the lib publishes:

- **README example** — first non-install code block must show the correct ordering with a comment explaining why.
- **`<ToastBridgeRenderer>` JSDoc** — the constraint goes in the component's TSDoc summary, not buried at line 50.
- **dev-mode runtime warning** — on first render, if no `<Toaster>`-equivalent has subscribed yet, log a console.warn with a link to the docs section. False positives are acceptable; missing the warning is not.
- **Type-level helper** — consider `<ToastProvider>` that wraps both Toaster + bridge with the right ordering baked in. Users opt in for safety; opt out for control.
- **Codemod (stretch)** — when scanning a user's `__root.tsx` (or equivalent), detect the inverted-order pattern and offer to swap.

The lib's own E2E test suite must include a regression test for this exact pattern: render bridge before Toaster, assert the toast does NOT appear; render Toaster before bridge, assert it does. Catches accidental refactors that flip the order.

## Why server-only enforcement matches remix-toast's

Both libs are "all exports are server-only — the framework rejects misuse at build time." The mechanism differs:

- **remix-toast:** RR enforces it via the file-level `loader`/`action` server-only guarantee. You CAN call `setToast(...)` from anywhere; if you try from a client component, `context` is undefined and you get a runtime error.
- **tanstack-start-toast:** TSS's `**/*.server.*` import-protection plugin enforces it at the file-extension level. The lib is published as `index.server.ts` (or with explicit server-only exports). Importing it from a client-bundled file fails at build time.

Both achieve the same end. Both require users to wrap server-only logic in their framework's server-fn equivalent before calling from a route loader. **The user mental model is identical.**

## What this lib ships today

As of 2026-05-07 (slice 3 merge):

- `start-toast-core` — schema, types, `sealToast`/`unsealToast`, `normalizeFlashInput`, `makeFlashToastId` (15 vitest)
- `react-start-toast`:
  - `setFlashCookieOptions` (config setter)
  - `setFlashToast`, `consumeFlashToast`, `consumeFlashToastFn`
  - 5× `redirectWith*` family
  - 5× `replaceWith*` family
  - `<FlashToastEffect />` renderer (the TSS-native addition formerly called `<ToastBridgeRenderer>` in this doc)
  - 18 vitest covering every helper

That's **15 of the 17 target exports** (5 redirect + 5 replace + 3 primitives + 1 config + 1 server fn). The remaining 2 (the schema `flashToastSchema` is exported from core, accessible via `start-toast-core`; `FlashToast`/`FlashToastInput`/`FlashToastType` types re-export from the React adapter) plus the renderer.

Missing from the target:

- Sonner adapter / styled `<ToastBridgeRenderer>` variant — current renderer is headless (you provide `notify`).
- Solid mirror (`@tanstack/solid-start-toast`) — wait for first consumer.

## Extraction checklist (done)

Extraction to this repo (2026-05-07):

1. ✅ **Move source files** — split into `packages/start-toast-core/src/` (framework-agnostic) and `packages/react-start-toast/src/` (React + TSS adapter).
2. ✅ **Add `replaceWith*` family** — slice 3.
3. ✅ **Add `setFlashCookieOptions`** — slice 1. Replaces vylit's hardcoded `process.env.SESSION_SECRET` coupling.
4. ✅ **Pull in `<FlashToastEffect />`** — slice 2. Headless: takes `notify` prop, no styling.
5. ✅ **Document the source-order constraint** — root README has a dedicated section + tables.
6. ✅ **README structure** — mirrors remix-toast's: install, server setup (root loader), recipes, troubleshooting, migration, API.
7. ✅ **Peer deps** — `@tanstack/react-router`, `@tanstack/react-start`, `react`, `react-dom`. Sonner is NOT a peer dep — the renderer accepts a `notify` prop so users pick their own toast lib.
8. ⏳ **Versioning** — currently `0.0.1` placeholder. Bump to `0.1.0` on first npm publish (after Tanner's go-ahead).

## Match TanStack's house style

Before publishing, **research the existing TanStack libraries' positioning, docs structure, and naming conventions, and match them as closely as possible.** TanStack is a recognised brand with a coherent identity across Router, Query, Start, Form, Table, Pacer, etc. — fitting in tells users this is a peer to those tools, not a one-off.

TanStack's [own tagline](https://tanstack.com): _"Headless, type-safe, composable tools for building modern web applications that work naturally for developers and reliably for agents."_ Our lib should embody those four properties:

- **Headless** — already true. The renderer accepts a `notify` prop; users plug in sonner / react-toastify / their own UI. We don't ship a styled component.
- **Type-safe** — already true via the zod schema and TypeScript inference on `FlashToast` / `FlashToastInput`. When extracting, ensure all public exports are fully typed; don't lose type info at the package boundary.
- **Composable** — already true. The lib is a set of orthogonal helpers (`setFlashToast`, `redirectWithError`, etc.), not a single God object. Users compose them inside their own server fns.
- **Reliable for agents** — agents reading our code should be able to derive correct usage from types + docstrings without trial-and-error. Concretely: every export needs a TSDoc summary, every parameter named for what-it-is not what-it-does, and the source-order constraint must be discoverable from the JSDoc on `<ToastBridgeRenderer>` (not just the README).

Specific things to study before publishing — landing pages and docs structure for Router, Start, Pacer, Form (the closest cousins in shape):

- **Headline format** — `TANSTACK <PRODUCT>` with a one-line tagline that names exactly what it is. Our line: probably _"Server-set toast notifications for TanStack Start"_ or _"Cookie-bridged flash toasts for TanStack Start"_. Short and literal — no marketing fluff.
- **Body paragraph** — 2-3 sentences. Name the technical surface (cookie bridge, RPC seam, sonner-or-anything renderer) and the ecosystem fit (TanStack Start, server fn-friendly, peer to Router).
- **Get-Started CTA + builder** — a "blank starter / full-stack app / migrate from remix-toast" multi-button picker, similar to Router's "blank starter / full-stack app / auth + database" row. Stretch goal; not blocking.
- **Below the fold pillars** — Pacer's site has three: "FLEXIBLE & TYPE-SAFE / OPTIMIZE PERFORMANCE / ASYNC OR SYNC". Ours could be: "TYPE-SAFE / SERVER-ONLY / RENDERER-AGNOSTIC". Pick three properties that survive headline-skimming.
- **Docs sidebar** — TanStack libs use the same left-nav structure: Menu → Frameworks / Contributors / NPM Stats / GitHub / Discord / TS-Chat → Getting Started → Guides → API Reference → Examples → FAQ. We should match this; users navigating across TanStack libs already know where to look.
- **Naming consistency** — TanStack's helpers are verb-noun: `redirect`, `notFound`, `useNavigate`, `createServerFn`. Our exports follow this: `setFlashToast`, `consumeFlashToast`, `redirectWithToast`. Keep matching the cadence; don't introduce snake_case or BEMy compound names.

**Compatibility surface — React-only at first, Solid mirrors later if there's demand.**

TanStack Router and TanStack Start are React-and-Solid only (Vue/Svelte are not on the roadmap as of this writing). Our lib is React-only by transitivity: it imports from `@tanstack/react-router` (`redirect()`) and `@tanstack/react-start/server` (`getCookie`/`setCookie`/`createServerFn`).

This is the same pattern TanStack uses for Query — `@tanstack/react-query`, `@tanstack/solid-query`, `@tanstack/vue-query` are separate packages, each pinned to its framework's APIs, with a shared `@tanstack/query-core` underneath. For toast we don't need a shared core (the cookie sealing logic is the only framework-agnostic bit, and it's small enough to inline in each package).

**Decision:** publish as `@tanstack-start-toast/react` (or `tanstack-start-toast`-with-implicit-react) as v1. If a Solid consumer asks, fork to `@tanstack-start-toast/solid` mirroring the Solid Start primitive names — same architecture, swapped framework imports. Don't pre-build the Solid version; YAGNI until there's a real consumer.

Naming check — TanStack's prefix convention is `@tanstack/<thing>` (Router, Query, Form, Pacer, etc.). If this lands inside TanStack, it'd be `@tanstack/start-toast`. Final naming and publishing path are TBD until we contact Tanner.

**Why "Start" is in the name and not just `tanstack-toast`:** considered the shorter version. Three reasons we kept `start` qualified:

1. **It IS Start-specific.** The lib uses `createServerFn`, `getCookie`/`setCookie` from `@tanstack/react-start/server`, and `redirect()` from `@tanstack/react-router`. Take Start away and it doesn't function. The name should be honest about the coupling.
2. **TanStack's own framework-qualifier convention.** React-tied libraries are explicitly named: `@tanstack/react-router`, `@tanstack/react-query`, `@tanstack/react-start`, `@tanstack/react-form`. Ours follows the same cadence — `@tanstack/start-toast` is Start-qualified the way the others are React-qualified.
3. **Avoids misleading users.** "tanstack-toast" sounds like a framework-agnostic toast UI library — a peer of `react-toastify`, `sonner`, `react-hot-toast`. Ours isn't a toast UI library at all; it's a server-flash-message bridge that USES one of those as the renderer. The "start" qualifier signals "this is integration plumbing for TanStack Start," not "this is TanStack's toast UI."

If we ever generalise the lib (a hypothetical v3 with framework-agnostic core + adapters for Start, plain React, Solid Start, etc.), `tanstack-toast` would be the right umbrella name. Not v1.

## Expected size

The lib is small by design. Source-of-truth count as of 2026-05-07:

- `flash-toast.server.ts` — 245 LOC (all helpers, schema, seal/unseal)
- `flash-toast.functions.ts` — 21 LOC (`consumeFlashToastFn` server fn)
- `flash-toast.test.ts` — 242 LOC (17 vitest covering every direct helper)
- **Source + tests total — ~510 LOC**

Adding everything on the "easy additions" list (5 `replaceWith*` helpers + `setFlashCookieOptions` + `<ToastBridgeRenderer>`) brings source to **~350-400 LOC**. Plus comprehensive TSDoc on every export, the test additions for the new helpers, and an example app, the full publishable repo lands somewhere around **800-1200 LOC of substantive code + config**.

For reference: [remix-toast's source folder](https://github.com/code-forge-io/remix-toast/tree/main/src) is 4 files at ~280 LOC. We're slightly bigger because we ship the renderer (remix-toast leaves that to the user). Pacer is bigger because it bundles five utilities (debounce / throttle / rate-limit / queue / batch); Hotkeys is in our ballpark — single-concern utility lib focused on one integration point.

Maintenance burden: low. Single-maintainer feasible. Genuinely "small library" in the TanStack sense.

## What v1 deliberately does NOT include

Some features remix-toast (or general flash-message libs) have, with a documented decision NOT to ship them in v1:

- **Pluggable storage backends (Redis / KV store / memory).** No TSS analogue to RR's `SessionStorage` interface — h3 sessions are cookie-backed by design, there's nothing to plug into. The cookie IS the storage. Adding a pluggable storage layer would be ~50-80 LOC of refactor and an interface to design / document / test / version, with zero current consumers asking for it. Easier to add in a v2 if a real use case surfaces; harder to remove if shipped speculatively.

- **Cross-device toasts** (user gets a toast on phone for an action triggered on desktop). That's a real-time-notifications problem, not a flash-toast problem. Different feature. Out of scope. Users wanting this should use TSS's websocket / SSE patterns directly.

- **Cross-tab consistency** (action in tab 1 toasts in tabs 2/3). Same category — needs server-side state + push channel. Not a flash-toast concern.

- **Multi-toast queues** (call `setFlashToast` twice in one response, both deliver). remix-toast doesn't support this either (last-write-wins on the same cookie). Could be added in v2 by changing cookie shape to `{toasts: [{...}, {...}]}`, but no current consumer needs it.

- **`dataWith*` family** (covered earlier in §"conceptual mismatches"). Not needed in TSS — server fns return JSON; cookie writes happen via `setCookie` independently. A user who wants "stage toast + return data" just calls `setFlashToast(...)` then `return data`. The fused helper that remix-toast ships is a no-op in TSS shape.

- **`createToastUtilsWithCustomSession(session)`** (covered earlier). Replaced by `setFlashCookieOptions(...)` because TSS doesn't have an equivalent multi-implementation `SessionStorage` interface.

The principle: **v1 ships the flash-cookie pattern done well, not every speculative extension.** Every excluded feature has a clear escape hatch (the user can build it themselves on top of the primitives) or a clear "this is a different feature" story. Re-evaluate each on real consumer demand for v2.

## Documentation quality bar

The lib's docs are how users learn it. remix-toast set a high bar for one-page README clarity (install → server setup → client setup → recipes → advanced); we should match it. Specifically:

- **Every public export documented** — TSDoc on every function, including the `redirectWith*`/`replaceWith*` factories that are mechanically generated. Hover-docs in editors are users' primary discovery surface.
- **Each example is copy-paste runnable** — full file contents, not snippets. Imports included. Don't make the user fill in blanks.
- **The "why" section** — short ADR-style summary in the README explaining the cookie-bridge model, why it's server-only, and how the source-order constraint works. Users coming from remix-toast already understand 80% of this; users new to flash-toast patterns need the framing.
- **Migration guide** — if a user is moving from remix-toast (RR) to TSS, they need a concrete diff of `setToast(context, ...)` → `await setFlashToast(...)` from inside their server fn. One example per export family.
- **Recipes for the common flows** — auth (verify-email, OAuth state-mismatch), form-mutation success/error, sign-out toast, post-checkout success. Real shapes users can adapt.
- **Troubleshooting section** — toast not appearing (source-order check), toast firing twice (sessionStorage dedupe explanation), cookie not clearing (response-side write timing). Each with a one-line diagnosis + one-line fix.
- **Live demo / playground** — codesandbox or stackblitz example. Lowers the activation barrier from "read the README" to "click play."
- **Changelog** — every release notes API additions, bug fixes, and any change to the source-order rule (which is API-shaped even though it's behavioural).

The bar to hit: "a TSS dev who knows remix-toast can be productive in 10 minutes; a TSS dev who's never used a flash-toast pattern can be productive in 30." If the docs miss that, no amount of API polish makes up for it.

## Decision

Proceed with extraction whenever the maintenance burden of keeping both copies in sync (this codebase + a hypothetical lib) outweighs the cost of publishing. Until then: when adding new flash-toast features, design them lib-first — server-only, generic where possible, no codebase-specific assumptions baked in. Update this doc when something on the "easy additions" list ships, when something new is added to remix-toast that we should match, or when a TSS-specific feature crystallises.

## References

- [`remix-toast` source](https://github.com/code-forge-io/remix-toast)
- [TSS import-protection plugin source](https://github.com/TanStack/router/blob/main/packages/start-plugin-core/src/import-protection)
- Original "ADR 0001 — Flash toast bridge" (in `vylit-ui/apps/vylit-app-tss/docs/adr/0001-flash-toast-bridge.md`) — explains the in-app implementation that this lib was extracted from.
