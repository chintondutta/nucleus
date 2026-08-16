# Contributing to Nucleus

Thanks for your interest in contributing! This document covers how to get set up, the conventions we use, and what to expect from the PR process.

## Getting set up

See the [README](./README.md#getting-started) for prerequisites and local setup. In short:

```bash
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL
npm run dev
```

You'll need a deployed Modal backend to actually run an analysis end to end (see the README's [Backend](./README.md#backend) section). If you're only working on frontend UI that doesn't touch the analyze flow, you can develop without one.

## Project layout

- `src/app` — Next.js App Router pages
- `src/components` — UI components (gene viewer, variant analysis, DNA helix, etc.)
- `src/utils` — external API calls (`genome-api.ts`) and sequence coloring
- `backend/main.py` — the FastAPI + Modal app that actually runs Evo2 inference
- `backend/evo2` — the Evo2 model itself, vendored as plain files (not a git submodule — see the note in `backend/evo2` if you're looking for one)

## Deployment

The frontend and backend deploy through **two separate paths** — worth understanding before you touch anything backend-related.

**Frontend: automatic.** Vercel builds and deploys on every push/PR (Preview) and merge to `main` (Production).

**Backend: manual, and not free.** Changes under `backend/` need someone to run this by hand:

```bash
cd backend
modal deploy main.py
```

This runs on an H100 GPU via Modal — every deploy and every analysis request afterward costs real GPU time on whoever's Modal account it's deployed under. There's currently one shared deployment; there's no per-PR or per-branch isolated backend. If your PR touches `backend/main.py` or `backend/requirements.txt`, say so in the PR description and coordinate the redeploy with whoever holds the Modal account — don't deploy speculatively just to test something small.

**Unlike a setup with per-environment auth (e.g. a service needing separate dev/prod instances because production auth rejects preview origins), there's no equivalent split to maintain here.** Modal's `@modal.fastapi_endpoint` reflects whatever `Origin` header a request sends (verified: `access-control-allow-origin` echoes back the caller's origin, `access-control-allow-credentials: true`). So Vercel Preview deployments (random `*.vercel.app` origins) and Production both call the one Modal backend with zero CORS configuration needed — nothing to keep in sync across environments there.

**Environment variable:** set `NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL` in Vercel's dashboard (Project Settings → Environment Variables) for both the Preview and Production scopes, pointing at the same Modal URL. If it's missing, the build itself fails — `src/env.js` validates it with Zod at build time, so this can't silently ship broken.

## Before opening a PR

There's no automated test suite for the actual inference pipeline (it needs a GPU), so please verify your change manually:

```bash
npm run check   # eslint + tsc --noEmit
npm run build   # production build
```

If your change touches anything user-facing, run `npm run dev` and click through the actual flow in a browser — a passing build doesn't confirm the feature works. If it touches `backend/main.py`, test against a real Modal deployment before merging; a passing `git diff` doesn't confirm the endpoint still returns valid predictions.

Note: `genome-api.ts` currently has a backlog of pre-existing `@typescript-eslint/no-unsafe-*` warnings from untyped external API responses (UCSC/NCBI/ClinVar). You're not expected to clear those just because `npm run lint` prints them — fixing them properly is a good self-contained issue on its own. Just don't add new ones in code you're touching for other reasons.

## Commit messages

We don't enforce a strict format, but prefer short, imperative, scoped messages, e.g.:

```
fix: correct off-by-one in gene search result parsing
feat: add codon-level variant annotation
chore: bump next to 16.4
```

## Branches and PRs

- If you don't have push access to this repo, fork it and branch off `main` in your fork; open the PR against `chintondutta/nucleus:main`. You don't need to be added as a collaborator to contribute.
- Use a short descriptive branch name (e.g. `fix/gene-search-indexing`).
- Keep PRs focused — one logical change per PR is easier to review than a bundle of unrelated fixes.
- Describe *why* the change is needed, not just what changed, especially for anything touching the backend contract (`VariantRequest`) or environment variables.
- Link any related issue.
- `main` is protected: PRs need the "Lint & typecheck" check passing and an approving review from a code owner ([@chintondutta](https://github.com/chintondutta), see `.github/CODEOWNERS`) before they can merge. If your PR touches `backend/`, mention it explicitly — a backend change can't be verified by CI (see [Deployment](#deployment)), so it gets tested manually against the real Modal deployment before approval.

## Security

There is currently no authentication on either the frontend or the Modal analysis endpoint — anyone with the endpoint URL can trigger a billed GPU run. If you're adding a feature that makes secrets, internal URLs, or the analysis endpoint more discoverable (e.g. logging it, putting it in client-visible code beyond the existing `NEXT_PUBLIC_` var), flag that explicitly in your PR description.

For reporting an actual vulnerability rather than a regular bug, see [SECURITY.md](./SECURITY.md).

## Code style

- TypeScript throughout on the frontend; ESLint (flat config) + Prettier are configured at the repo root — run `npm run lint` and `npm run format:check` before pushing.
- Match the conventions already used in the file/module you're editing over introducing a new pattern.

## Questions

Open an issue if something in this guide is unclear or out of date — that's useful signal on its own.
