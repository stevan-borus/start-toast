# AI Discoverability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `react-start-toast` reliably discoverable by AI coding agents searching for toast / flash-message libraries for TanStack Start, via npm metadata, README lead block, `llms.txt`/`llms-full.txt`, and Context7 registration.

**Architecture:** Pure metadata + docs work — no source changes. Six files touched, all at the repo root or in `packages/*/package.json`. One changeset for the npm `description` change so it ships on the next publish. Two manual steps that the human runs (GitHub topics, Context7 submission) — the plan flags both clearly.

**Tech Stack:** pnpm workspace, changesets, npm, GitHub repo settings, Context7 MCP.

**Spec:** [`docs/superpowers/specs/2026-05-14-ai-discoverability-design.md`](../specs/2026-05-14-ai-discoverability-design.md)

---

## File Structure

| File | Status | Responsibility |
|------|--------|----------------|
| `packages/react-start-toast/package.json` | Modify | Expand npm keywords + sharpen description |
| `packages/start-toast-core/package.json` | Modify | Expand keywords (private pkg; helps in-repo search only) |
| `README.md` | Modify | Insert "When to use this" + keyword block under the title |
| `llms.txt` | Create | Root-level AI index per llmstxt.org spec |
| `llms-full.txt` | Create | Root-level inlined full docs for one-read agent ingestion |
| `context7.json` | Create | Context7 chunker hints (folders to index, folders to skip) |
| `.changeset/ai-discoverability.md` | Create | Patch bump for `react-start-toast` so npm picks up the new description |

Each file is independent; tasks below treat each as its own commit so the history reads cleanly.

This work has no tests in the conventional sense (it's metadata/docs), but each task ends with a concrete verification command so we never claim "done" without evidence.

---

## Task 1: Expand `react-start-toast` package metadata

**Files:**
- Modify: `packages/react-start-toast/package.json` (keywords array + description string)

- [ ] **Step 1: Read current state**

Run: `cat packages/react-start-toast/package.json | jq '.keywords, .description'`

Expected output (current):
```
[
  "tanstack",
  "tanstack-start",
  "react",
  "toast",
  "flash",
  "cookie",
  "remix-toast"
]
"Server-set toast notifications for TanStack Start. A 1:1 adaptation of remix-toast for TSS server fns and h3 cookies."
```

- [ ] **Step 2: Update description**

In `packages/react-start-toast/package.json`, replace the `description` value with:

```
Headless server-set toast notifications for TanStack Start (TSS). Flash toasts via h3 cookies and server fns — a 1:1 adaptation of remix-toast. Bring your own UI (sonner, react-toastify, etc.).
```

- [ ] **Step 3: Update keywords**

In the same file, replace the `keywords` array with:

```json
"keywords": [
  "tanstack",
  "tanstack-start",
  "tss",
  "tss-toast",
  "tanstack-start-toast",
  "start-toast",
  "react",
  "toast",
  "toaster",
  "flash",
  "flash-message",
  "flash-toast",
  "notification",
  "notifications",
  "cookie",
  "cookie-flash",
  "server-toast",
  "redirect-with-toast",
  "sonner",
  "react-toastify",
  "headless",
  "headless-toast",
  "remix-toast"
],
```

- [ ] **Step 4: Verify JSON parses and shape matches**

Run: `cat packages/react-start-toast/package.json | jq '.keywords | length, .description'`

Expected: first line prints `23`, second line prints the new description string.

- [ ] **Step 5: Run the workspace publint to confirm nothing about the package shape regressed**

Run: `pnpm --filter react-start-toast test:publint`

Expected: PASS (no errors).

- [ ] **Step 6: Commit**

```bash
git add packages/react-start-toast/package.json
git commit -m "$(cat <<'EOF'
chore(react-start-toast): expand npm keywords and sharpen description

AI coding agents discover libraries primarily through npm keyword
matches and description content. The previous keyword list missed
common search phrases ("tss", "flash-message", "notification",
"sonner") and the description didn't lead with "headless" or "TSS",
so partial-match queries from agents weren't reliably surfacing the
package.
EOF
)"
```

---

## Task 2: Expand `start-toast-core` package metadata

**Files:**
- Modify: `packages/start-toast-core/package.json` (keywords array only — description is fine and the package is private)

- [ ] **Step 1: Update keywords**

In `packages/start-toast-core/package.json`, replace the `keywords` array with:

```json
"keywords": [
  "tanstack",
  "tanstack-start",
  "tss",
  "tss-toast",
  "tanstack-start-toast",
  "start-toast",
  "toast",
  "toaster",
  "flash",
  "flash-message",
  "flash-toast",
  "notification",
  "notifications",
  "cookie",
  "cookie-flash",
  "server-toast",
  "headless",
  "headless-toast",
  "remix-toast"
],
```

(No React-specific terms — this package is framework-agnostic by design.)

- [ ] **Step 2: Verify**

Run: `cat packages/start-toast-core/package.json | jq '.keywords | length'`

Expected: `19`.

- [ ] **Step 3: Commit**

```bash
git add packages/start-toast-core/package.json
git commit -m "$(cat <<'EOF'
chore(start-toast-core): expand keywords for in-repo searchability

The core package is private and not published, so npm search doesn't
apply, but grep/graph-based tooling (graphify, code search) uses the
same keyword field as a signal. Keeping it consistent with the React
adapter avoids the case where one package surfaces in a search and
the other doesn't.
EOF
)"
```

---

## Task 3: Add "When to use this" lead block to README

**Files:**
- Modify: `README.md` (insert between line 1 `# start-toast` and line 3 blockquote)

- [ ] **Step 1: Insert the lead block**

In `README.md`, immediately after the `# start-toast` heading (line 1), and *before* the existing `> Server-set toast notifications...` blockquote, insert:

```markdown
**Use this if:** you're building with **TanStack Start (TSS)** and need
**server-set flash toasts** — staging a toast from a server function and
having it surface after redirect. Equivalent to `remix-toast` for the
TSS server-fn / h3-cookie model. Headless: bring your own toast UI.

**Keywords:** TanStack Start, TSS, toast, flash message, notification,
server function, cookie flash, redirect-with-success, headless toast,
remix-toast-equivalent.

```

(Note the blank line before the existing blockquote — leave one blank line of separation so markdown renders cleanly.)

- [ ] **Step 2: Verify the rendered output**

Run: `head -15 README.md`

Expected: `# start-toast` on line 1, the new lead block starting on line 3, original blockquote still present below it.

- [ ] **Step 3: Run prettier on the README to catch any formatting drift**

Run: `pnpm format`

Expected: file is reformatted if needed; no errors.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs(readme): add 'When to use this' lead block for AI discoverability

Agents pattern-match the first ~20 lines of a README the hardest. The
existing top-of-file copy buried the "TSS" abbreviation, "flash
message", and "headless" terms behind a longer paragraph, so partial
queries from agents (e.g. "flash toast for TSS") were less likely to
hit. The new block puts both human-skimmable framing and an explicit
keyword paragraph above the fold.
EOF
)"
```

---

## Task 4: Add `llms.txt` at repo root

**Files:**
- Create: `llms.txt`

- [ ] **Step 1: Create the file with the following content**

```markdown
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
- `react-start-toast/server` (server-only): `setFlashToast`, `consumeFlashToast`, `setFlashCookieOptions`, `redirectWithSuccess`, `redirectWithError`, `redirectWithInfo`, `redirectWithWarning`, `replaceWithSuccess`, `replaceWithError`, `replaceWithInfo`, `replaceWithWarning`

## Optional

- [ADRs](https://github.com/stevan-borus/start-toast/tree/main/docs/adr): architecture decisions and rationale
- [CONTRIBUTING](https://github.com/stevan-borus/start-toast/blob/main/CONTRIBUTING.md): contribution guide
```

- [ ] **Step 2: Verify**

Run: `head -5 llms.txt && wc -l llms.txt`

Expected: starts with `# react-start-toast`; line count is roughly 18-22.

- [ ] **Step 3: Commit**

```bash
git add llms.txt
git commit -m "$(cat <<'EOF'
docs: add llms.txt index per llmstxt.org spec

llms.txt is the emerging convention for an AI-readable repo index —
a single root-level markdown file that tells an agent what the
project is and where to find canonical docs. Adding it costs nothing
and is picked up by Context7, Cursor, and a growing set of MCP-based
agents that look for it before falling back to web search.
EOF
)"
```

---

## Task 5: Add `llms-full.txt` at repo root

**Files:**
- Create: `llms-full.txt`

- [ ] **Step 1: Create the file by inlining the README with a header note**

The file's content is a 3-line header followed by the full current README. Write it with this exact layout:

```text
# react-start-toast — full documentation

> This file mirrors README.md verbatim, presented as a single
> markdown document for LLM ingestion. Source of truth is README.md;
> regenerate this file whenever the README meaningfully changes.

---

<full contents of README.md, copied verbatim>
```

Concretely: read the current `README.md` and write everything below the `---` line of `llms-full.txt` as its exact contents.

The shell can do this in one step:

```bash
{
  printf '# react-start-toast — full documentation\n\n'
  printf '> This file mirrors README.md verbatim, presented as a single\n'
  printf '> markdown document for LLM ingestion. Source of truth is\n'
  printf '> README.md; regenerate this file whenever the README\n'
  printf '> meaningfully changes.\n\n---\n\n'
  cat README.md
} > llms-full.txt
```

- [ ] **Step 2: Verify**

Run: `head -10 llms-full.txt && wc -l llms-full.txt README.md`

Expected: header block visible at the top; `llms-full.txt` line count = `README.md` line count + 7 (the header).

- [ ] **Step 3: Commit**

```bash
git add llms-full.txt
git commit -m "$(cat <<'EOF'
docs: add llms-full.txt with inlined README for agent ingestion

Agents (especially via Context7) work better when the full canonical
docs are in a single readable file rather than spread across nested
markdown. This is README.md verbatim with a short header noting
README is the source of truth — keeps the maintenance contract clear
(update README, regenerate this).
EOF
)"
```

---

## Task 6: Add `context7.json` at repo root

**Files:**
- Create: `context7.json`

- [ ] **Step 1: Create the file**

```json
{
  "$schema": "https://context7.com/schema/context7.json",
  "projectTitle": "react-start-toast",
  "description": "Server-set toast notifications for TanStack Start. Headless flash toasts via server fns and h3 cookies.",
  "folders": [
    "packages/react-start-toast/src",
    "docs/adr"
  ],
  "excludeFolders": [
    "node_modules",
    "dist",
    ".nx",
    "examples/react/basic/.output"
  ],
  "excludeFiles": [
    "pnpm-lock.yaml"
  ],
  "previousVersions": []
}
```

- [ ] **Step 2: Verify JSON parses**

Run: `cat context7.json | jq '.projectTitle, (.folders | length), (.excludeFolders | length)'`

Expected:
```
"react-start-toast"
2
4
```

- [ ] **Step 3: Commit**

```bash
git add context7.json
git commit -m "$(cat <<'EOF'
docs: add context7.json so the repo indexes cleanly on Context7

Context7's chunker uses this manifest to decide which folders to read
and which to skip. Without it, the indexer falls back to defaults
which would include dist/, .nx/, the example app's build output, and
the lockfile — noise that degrades query relevance. This points it
at the React adapter source and the ADRs (the two places with
real signal).
EOF
)"
```

---

## Task 7: Add a changeset for the npm description change

**Files:**
- Create: `.changeset/ai-discoverability.md`

- [ ] **Step 1: Create the changeset file**

```markdown
---
'react-start-toast': patch
---

Expand npm keywords and sharpen the package description for AI-agent
discoverability. No runtime or API changes.
```

(Only `react-start-toast` gets a bump — `start-toast-core` is private.)

- [ ] **Step 2: Verify changesets sees it**

Run: `pnpm changeset status --since=HEAD~10`

Expected: lists `react-start-toast` with a `patch` change. (If your changeset CLI errors on `--since`, just `pnpm changeset status` is fine.)

- [ ] **Step 3: Commit**

```bash
git add .changeset/ai-discoverability.md
git commit -m "$(cat <<'EOF'
chore: changeset for npm metadata change

Patch bump so the next release picks up the new keywords and
description on the npm registry. Pure metadata — no consumer impact.
EOF
)"
```

---

## Task 8: Run the full test suite as a regression check

**Files:** none (verification only)

- [ ] **Step 1: Run the workspace test suite**

Run: `pnpm test`

Expected: all tasks pass — `test:eslint`, `test:lib`, `test:types`, `build`, `test:publint` for both packages.

- [ ] **Step 2: If anything fails, investigate before continuing**

The previous tasks should not have touched any code paths that affect linting, types, builds, or publint. If something fails:
- `test:eslint` failure → likely a prettier/eslint disagreement in README.md; run `pnpm format` and re-run.
- `test:publint` failure → likely a malformed `package.json` from Task 1 or 2; re-check JSON with `jq`.
- Anything else → stop and surface the failure rather than working around it.

- [ ] **Step 3: No commit needed if step 1 passes**

---

## Task 9: Manual GitHub topics (human step — surface clearly)

**Files:** none (out-of-band action)

This step cannot be performed by an agent from the repo. Present these instructions to the user verbatim:

```text
GitHub repo topics need to be set in the repo Settings UI — they
aren't editable from a PR. Please:

1. Open https://github.com/stevan-borus/start-toast
2. Click the gear/settings icon next to "About" on the right sidebar
3. In the "Topics" field, add these tags (space- or comma-separated):

   tanstack tanstack-start tss toast flash-messages notifications
   react cookie server-functions remix-toast sonner headless typescript

4. Save.

Once done, GitHub topic search will surface the repo for queries like
"tanstack-start toast" or "tss flash-messages".
```

- [ ] **Step 1: Print these instructions to the user and ask them to confirm completion before moving to Task 10**

---

## Task 10: Submit the repo to Context7 (human step — surface clearly)

**Files:** none (out-of-band action)

Present these instructions to the user verbatim:

```text
Context7 indexes public GitHub repos. With context7.json now committed,
submission is straightforward. Please:

1. Open https://context7.com/add-library in a browser.
2. Submit the repo URL: https://github.com/stevan-borus/start-toast
3. Wait for the indexer to confirm (typically a few minutes; some libs
   show up immediately, others take an hour).
4. Smoke-test by asking any agent with the Context7 MCP:

   "Resolve library id for react-start-toast"

   You should get a Context7-style id back (something like
   `/stevan-borus/start-toast`). If you get "not found", give it a
   bit longer or check Context7's status page.

If the submission URL has moved (it has changed before), the fallback
is to open an issue or PR on Context7's public repo with the URL and
this repo's context7.json contents.
```

- [ ] **Step 1: Print these instructions to the user and confirm submission was attempted before declaring the plan complete**

---

## Verification (final pass)

After all tasks complete, run these to confirm the end state:

- [ ] **Step 1: All files present**

Run: `ls -la llms.txt llms-full.txt context7.json .changeset/ai-discoverability.md`

Expected: all four files exist.

- [ ] **Step 2: npm metadata correct**

Run: `cat packages/react-start-toast/package.json | jq '.keywords | length, .description'`

Expected: `23` and the new description string.

- [ ] **Step 3: README lead block in place**

Run: `head -15 README.md | grep -c "TSS"`

Expected: at least `1` (a line containing "TSS" in the new lead block).

- [ ] **Step 4: Full test suite still green**

Run: `pnpm test`

Expected: PASS.

- [ ] **Step 5: Commit log is clean**

Run: `git log --oneline -10`

Expected: 7 new commits on top of the spec commit, each with a meaningful body (not just a one-liner).

- [ ] **Step 6: Push and confirm GitHub topics + Context7 submission**

Push the branch (or merge to main per the user's normal flow), then verify the two manual steps from Tasks 9 and 10 are completed.

---

## Out of scope

- Automating `llms-full.txt` regeneration from README (file watcher / CI / script).
- Submitting to other AI doc indexers (DeepWiki, etc.).
- Re-tagging the npm package outside of the natural release flow — the changeset handles this.
- Writing a launch/marketing post — separate channel, separate plan.
