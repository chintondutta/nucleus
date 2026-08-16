# Nucleus

Nucleus is a variant-effect prediction tool. Describe a single nucleotide mutation in a human gene, and Nucleus predicts whether it's pathogenic or benign using the Evo2 genomic language model, running on an H100 GPU in the cloud — then cross-checks the call against ClinVar's own curated classification.

## Features

- **AI variant classification** — predicts pathogenicity (likely pathogenic / likely benign) of single nucleotide variants using the Evo2 model, with a confidence score derived from the reference/variant likelihood delta
- **ClinVar cross-validation** — compares Evo2's prediction directly against existing human-curated ClinVar classifications for known variants
- **Genome browsing** — select a genome assembly (e.g. hg38), browse chromosomes, or search for a gene by symbol or name (e.g. BRCA1)
- **Reference sequence viewer** — view a gene's full reference DNA sequence, color-coded by nucleotide
- **GPU-accelerated inference** — the Evo2 model runs on an H100 GPU via Modal, exposed as a FastAPI endpoint; the browser only ever sends a lightweight JSON request

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| UI | shadcn/ui, Tailwind CSS v4, Radix UI, Lucide React, Three.js (DNA helix visualization) |
| AI model | Evo2 ([ArcInstitute/evo2](https://github.com/ArcInstitute/evo2)), vendored under `backend/evo2` |
| Backend / inference | FastAPI on [Modal](https://modal.com/) (serverless H100 GPU) |
| Genome data | UCSC Genome Browser API, NCBI E-utilities, ClinicalTables, ClinVar |
| Deployment | Vercel (frontend), Modal (backend) |

## Project structure

```
src/
  app/            Next.js App Router pages ("/" is the analysis tool)
  components/     UI components (gene viewer, variant analysis, DNA helix, etc.)
  utils/          External API calls (genome-api.ts) and sequence coloring utilities
  lib/            Shared utilities
backend/
  main.py         FastAPI + Modal app (Evo2 inference)
  requirements.txt
  evo2/           Evo2 model source, vendored (not a git submodule)
```

The frontend never talks to the Evo2 model directly. `src/utils/genome-api.ts` sends a variant (genome, chromosome, position, alternative base) as JSON to the Modal-hosted `analyze_single_variant` endpoint; the backend fetches an 8,192bp reference window from the UCSC API, scores the reference and variant sequences with Evo2, and returns a prediction plus a confidence score. The `Evo2Model` Modal class keeps the model loaded across up to 3 parallel containers and scales down when idle.

There is currently no authentication — the app and the analysis endpoint are both open. See [SECURITY.md](./SECURITY.md) before deploying this anywhere beyond local/hackathon use.

## Getting started

### Prerequisites

- Node.js 20+
- Python 3.11+ (required by Evo2 — see `backend/evo2/setup.py`)
- A [Modal](https://modal.com/) account (serverless GPU platform) with a working token (`modal setup`)

### Setup

```bash
git clone https://github.com/chintondutta/nucleus.git
cd nucleus
npm install
cp .env.example .env.local   # then fill in the value below
npm run dev
```

The app will be available at `http://localhost:3000`.

### Backend

```bash
cd backend
pip install -r requirements.txt
modal setup           # one-time: authenticate the Modal CLI
modal deploy main.py  # deploys the Evo2Model.analyze_single_variant endpoint
```

`modal deploy` prints the endpoint URL — put it in `.env.local` (see below). A GPU deploy/redeploy is not free; see [CONTRIBUTING.md](./CONTRIBUTING.md#deployment) before redeploying casually.

### Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL` | URL of the deployed Modal `analyze_single_variant` endpoint (printed by `modal deploy`) |

See `.env.example` for the authoritative list — keep it in sync with `src/env.js` when adding new variables.

## Common scripts

```bash
npm run dev       # start the Next.js dev server (turbopack)
npm run build     # production build
npm run check     # eslint + tsc --noEmit
npm run lint      # eslint only
npm run format:write   # prettier --write across the repo
```

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for setup details, the deploy story, and PR expectations. Please also review our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](./SECURITY.md) for how to report a vulnerability, and for known scope caveats (no auth, public inference endpoint) before deploying this beyond local use.

## License

[MIT](./LICENSE.MD)
