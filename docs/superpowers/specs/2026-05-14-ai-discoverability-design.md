# AI Discoverability for `react-start-toast`

**Date:** 2026-05-14
**Status:** Approved — ready for implementation plan
**Owner:** @stevan-borus

## Goal

Make `react-start-toast` easy for AI coding agents to find when a user asks
something like _"is there a toast lib for TanStack Start?"_ or _"flash
messages in TSS"_. Today the lib is on npm and GitHub but the metadata is
sparse, there is no AI-readable index file, and Context7 doesn't know about
the repo, so agents that consult Context7 first will silently miss it.

This is metadata-only work. No source changes, no API changes, no version
bump beyond what a changeset for the npm `description` requires.

## Non-goals

- Source code, public API, or behavior changes.
- New documentation pages beyond the AI-readable index files.
- Anything requiring infrastructure outside the repo (a docs site,
  separate marketing page, etc.).
- Optimizing for general SEO — humans already find the lib via TanStack's
  ecosystem channels; this work targets agent-mediated discovery.

## Why this matters

Agents discover libraries through a small set of channels:

1. **npm search** — keywords + description fields are the primary signal.
2. **GitHub search / grep** — topic tags and README first-screen content.
3. **Context7 (and similar AI doc indexers)** — used by Claude Code, Cursor,
   and others via MCP. If a library isn't registered, `resolve-library-id`
   returns nothing and the agent falls back to web search, which is noisier
   and less likely to surface a niche lib like this.
4. **`llms.txt` convention** — emerging standard from llmstxt.org. A root
   `llms.txt` tells an agent "here's the canonical index of this project"
   in machine-friendly markdown.

We're currently weak on (1), (2), (3), and absent on (4).

## Scope (the four prongs)

### A. npm + GitHub metadata

**`packages/react-start-toast/package.json`** — expand `keywords` to:

```
tanstack, tanstack-start, tss, tss-toast, tanstack-start-toast, start-toast,
react, toast, toaster, flash, flash-message, flash-toast, notification,
notifications, cookie, cookie-flash, server-toast, redirect-with-toast,
sonner, react-toastify, headless, headless-toast, remix-toast
```

Update `description` to:

> "Headless server-set toast notifications for TanStack Start (TSS). Flash
> toasts via h3 cookies and server fns — a 1:1 adaptation of remix-toast.
> Bring your own UI (sonner, react-toastify, etc.)."

**`packages/start-toast-core/package.json`** — same keyword expansion minus
React-only terms (`react`, `react-toastify`, `sonner`). Core is private and
not published, but the keywords still help in-repo and graph-based search.

**GitHub repo topics** — set in the repo Settings UI (not editable from a
PR). Use:

```
tanstack, tanstack-start, tss, toast, flash-messages, notifications, react,
cookie, server-functions, remix-toast, sonner, headless, typescript
```

This is a manual step documented in the implementation plan; the user
performs it via the GitHub web UI.

### B. README "When to use this" lead block

Insert immediately under the `# start-toast` heading, _before_ the existing
blockquote. Content:

```md
**Use this if:** you're building with **TanStack Start (TSS)** and need
**server-set flash toasts** — staging a toast from a server function and
having it surface after redirect. Equivalent to `remix-toast` for the
TSS server-fn / h3-cookie model. Headless: bring your own toast UI.

**Keywords:** TanStack Start, TSS, toast, flash message, notification,
server function, cookie flash, redirect-with-success, headless toast,
remix-toast-equivalent.
```

Rationale: agents pattern-match the first ~20 lines of a README the most.
"Use this if" is for humans skimming; the explicit keyword paragraph is
search-bait for agents grepping for partial matches (`TSS`, `flash`,
`redirect-with-toast`, etc.) that the title alone doesn't surface.

### C. `llms.txt` + `llms-full.txt` at repo root

**`llms.txt`** — short index following the llmstxt.org spec:

```md
# react-start-toast

> Server-set toast notifications for TanStack Start (TSS). Headless,
> typed, cookie-flash based. 1:1 adaptation of remix-toast for the
> TSS server-fn / h3-cookie model. npm: react-start-toast.

## Docs

- [README](https://github.com/stevan-borus/start-toast/blob/main/README.md): Full setup, API, and rationale
- [llms-full.txt](https://github.com/stevan-borus/start-toast/blob/main/llms-full.txt): Full docs inlined for LLM ingestion
- [Example app](https://github.com/stevan-borus/start-toast/tree/main/examples/react/basic): Runnable TSS + sonner example

## API surface

- `react-start-toast` (client): `ToastProvider`, `FlashToastEffect`, types
- `react-start-toast/server` (server-only): `setFlashToast`, `consumeFlashToast`, `setFlashCookieOptions`, `redirectWith{Success,Error,Info,Warning}`, `replaceWith{Success,Error,Info,Warning}`

## Optional

- [ADRs](https://github.com/stevan-borus/start-toast/tree/main/docs/adr)
- [CONTRIBUTING](https://github.com/stevan-borus/start-toast/blob/main/CONTRIBUTING.md)
```

**`llms-full.txt`** — a flat, single-file dump of the canonical docs that
an agent can ingest in one read. Initial content: the current README
verbatim, with a short header note explaining the file's purpose and
linking back to the repo. No new prose to maintain — the README stays the
single source of truth and `llms-full.txt` is regenerated from it.

A follow-up could automate regeneration via a script or CI step, but is
out of scope here. Manual copy on each meaningful README change is fine
for a 0.x library with low churn.

### D. Context7 registration

Context7 indexes public GitHub repos that have either (a) been submitted
through their web flow or (b) carry a `context7.json` manifest pointing
the chunker at the right files.

**Add `context7.json` at repo root:**

```json
{
  "$schema": "https://context7.com/schema/context7.json",
  "projectTitle": "react-start-toast",
  "description": "Server-set toast notifications for TanStack Start. Headless flash toasts via server fns and h3 cookies.",
  "folders": ["packages/react-start-toast/src", "docs/adr"],
  "excludeFolders": [
    "node_modules",
    "dist",
    ".nx",
    "examples/react/basic/.output"
  ],
  "excludeFiles": ["pnpm-lock.yaml"],
  "previousVersions": []
}
```

**Manual submission step** — documented in the plan, performed by the user:

1. Open `https://context7.com/add-library` in a browser.
2. Submit the repo URL: `https://github.com/stevan-borus/start-toast`.
3. Confirm indexing succeeded by running, in any agent that has the
   Context7 MCP, `resolve-library-id "react-start-toast"` and checking
   for a hit.

If Context7's submission flow has changed by the time we execute (the URL
or PR-based registry has moved before), fall back to opening an issue or
PR on their public registry repo with the same `context7.json` payload.

## Files touched

| File                                      | Change                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| `packages/react-start-toast/package.json` | Expand `keywords`, update `description`                                               |
| `packages/start-toast-core/package.json`  | Expand `keywords` (no React-only terms)                                               |
| `README.md`                               | Insert "When to use this" lead block under title                                      |
| `llms.txt` (new)                          | Repo root, AI index per llmstxt.org spec                                              |
| `llms-full.txt` (new)                     | Repo root, README inlined for one-read ingestion                                      |
| `context7.json` (new)                     | Repo root, Context7 indexing hints                                                    |
| `.changeset/<random>.md` (new)            | Patch bump for `react-start-toast` so the new npm `description` ships on next publish |

`start-toast-core` is private, so its keyword change does not need a
changeset.

## Risks / things to watch

- **`llms-full.txt` drift.** README and `llms-full.txt` will diverge over
  time if updates aren't mirrored. Mitigation: header note in
  `llms-full.txt` says "regenerated from README" and a follow-up issue
  tracks automating it.
- **Context7 schema URL.** The `$schema` URL in `context7.json` is what
  their published examples use today; if it 404s, agents and editors
  won't blow up — the schema is advisory — but it should be checked at
  implementation time.
- **Keyword spam concerns.** The npm keyword list is wide but every term
  is a phrase a human would plausibly search for. Avoid stuffing
  unrelated terms (e.g., do not add `next.js`, `remix`, etc. — only
  `remix-toast` is justified because the lib explicitly markets itself
  as the TSS equivalent).
- **GitHub topics are out-of-band.** They're set in the GitHub web UI, not
  in the repo. The plan must explicitly call out this manual step or it
  will be forgotten.

## Validation

After implementation:

1. `cat packages/react-start-toast/package.json | jq '.keywords, .description'` — sanity check.
2. `head -30 README.md` — confirm lead block renders cleanly.
3. `ls llms.txt llms-full.txt context7.json` — files exist at root.
4. Run `pnpm test` to make sure nothing accidentally broke.
5. Verify `llms.txt` renders well on GitHub (raw markdown view).
6. After Context7 submission, smoke-test by calling
   `mcp__plugin_context7_context7__resolve-library-id "react-start-toast"`
   in a fresh Claude Code session — it should return a hit.

## Out of scope (deliberately deferred)

- Automated `llms-full.txt` regeneration script / CI step.
- Submitting to other AI doc indexers (DeepWiki, etc.) — Context7 is the
  one Claude Code consults by default; others can come later.
- Re-tagging the package on npm beyond the natural release flow.
- Writing a marketing/launch post — that's a separate channel.
