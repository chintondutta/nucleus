# Security Policy

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, email **chintondutta.tech@gmail.com** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept code or requests are helpful)
- The affected component (frontend, or the Modal backend)

We'll acknowledge your report within **3 business days** and aim to provide an initial assessment — confirmation, severity, and expected timeline — within **7 business days**. We'll keep you updated as we work on a fix, and credit you in the fix's notes if you'd like (or keep you anonymous, your call).

## Scope

Nucleus currently has **no authentication** on the frontend or the backend analysis endpoint — this is a known, accepted state for local/hackathon use, not something you need to report. Reports are especially welcome for:

- Any way to make the Modal analysis endpoint execute arbitrary code, not just score a variant (e.g. injection through `variant_position`, `alternative`, `genome`, or `chromosome` in the `VariantRequest` body)
- Server-side request forgery via the genome-sequence fetch (`get_genome_sequence` in `backend/main.py`, which builds a UCSC API URL from request parameters)
- Exposure of secrets or credentials (Modal tokens, API keys) in the repo, build output, or client-visible code
- Anything that lets a request bypass or abuse the Modal deployment in a way that causes disproportionate GPU cost (beyond the already-known "no auth" cost-abuse risk)

Out of scope: the lack of authentication itself, and vulnerabilities in third-party dependencies (please report those upstream — see [CONTRIBUTING.md](./CONTRIBUTING.md) if you'd also like to help us update to a patched version).

## Supported versions

This is a hackathon project under active development rather than a versioned library — only the current `main` branch is supported. There are no older versions receiving security patches.

## Disclosure

We ask that you give us a reasonable amount of time to investigate and fix an issue before any public disclosure. We don't run a bug bounty program, but we take every report seriously and appreciate the effort.
