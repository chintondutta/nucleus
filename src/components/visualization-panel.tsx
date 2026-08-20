"use client";

import { DnaHelix } from "./dna-helix";
import type { AnalysisResult, GeneFromSearch } from "~/utils/genome-api";

const THRESHOLD = -0.0009178519;
const SCORE_RANGE = 0.003;

function IdleInfo() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Status
        </p>
        <p className="text-base font-medium text-white/80">Ready for Analysis</p>
        <p className="mt-1 text-xs leading-relaxed text-white/40">
          Search for a gene to begin predicting variant pathogenicity with Nucleus.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Nucleotide Key
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "A", bg: "bg-green-400", name: "Adenine" },
            { label: "T", bg: "bg-red-400", name: "Thymine" },
            { label: "G", bg: "bg-yellow-400", name: "Guanine" },
            { label: "C", bg: "bg-blue-400", name: "Cytosine" },
          ].map(({ label, bg, name }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div
                className={`${bg} flex h-8 w-8 items-center justify-center rounded-full`}
              >
                <span className="text-sm font-bold text-black">{label}</span>
              </div>
              <span className="text-[11px] text-white/35">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GeneInfo({ gene }: { gene: GeneFromSearch }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Selected Gene
        </p>
        <p className="text-3xl font-semibold text-[#de8246]">{gene.symbol}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55">
          {gene.name}
        </p>
        <div className="mt-3">
          <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/60">
            {gene.chrom}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Awaiting Variant
        </p>
        <div className="h-1.5 w-full rounded-full bg-white/10">
          <div className="h-1.5 w-1/3 animate-pulse rounded-full bg-[#de8246]/60" />
        </div>
        <p className="mt-2 text-xs text-white/35">
          Enter a position + nucleotide substitution and click Analyze.
        </p>
      </div>
    </div>
  );
}

function ResultInfo({ result }: { result: AnalysisResult }) {
  const isPathogenic = result.prediction.toLowerCase().includes("pathogenic");

  const clamped = Math.max(-SCORE_RANGE, Math.min(SCORE_RANGE, result.delta_score));
  const scorePct = ((clamped + SCORE_RANGE) / (2 * SCORE_RANGE)) * 100;
  const thresholdPct = ((THRESHOLD + SCORE_RANGE) / (2 * SCORE_RANGE)) * 100;

  return (
    <div className="space-y-3">
      {/* Prediction badge */}
      <div
        className={`rounded-xl border p-4 ${
          isPathogenic
            ? "border-red-500/30 bg-red-950/40"
            : "border-green-500/30 bg-green-950/40"
        }`}
      >
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Nucleus Prediction
        </p>
        <p
          className={`text-xl font-semibold ${isPathogenic ? "text-red-400" : "text-green-400"}`}
        >
          {result.prediction}
        </p>
        <p className="mt-1 font-mono text-xs text-white/40">
          {result.reference}&rarr;{result.alternative} &nbsp;·&nbsp;
          pos&nbsp;{result.position.toLocaleString()}
        </p>
      </div>

      {/* Delta score spectrum */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Delta Score
        </p>

        <div className="relative mb-7">
          <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500" />

          <div
            className="absolute top-0 h-3 w-px bg-white/70"
            style={{ left: `${thresholdPct}%` }}
          />
          <span
            className="absolute -bottom-5 -translate-x-1/2 text-[10px] text-white/35"
            style={{ left: `${thresholdPct}%` }}
          >
            threshold
          </span>

          <div
            className="absolute -top-0.5 h-4 w-2 -translate-x-1/2 rounded-sm bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)] transition-all duration-700"
            style={{ left: `${scorePct}%` }}
          />

          <span className="absolute -bottom-5 left-0 text-[10px] text-red-400">
            pathogenic
          </span>
          <span className="absolute -bottom-5 right-0 text-[10px] text-green-400">
            benign
          </span>
        </div>

        <p className="mt-1 text-xs text-white/50">
          Score&nbsp;
          <span className="font-mono text-white">{result.delta_score.toFixed(6)}</span>
        </p>
      </div>
    </div>
  );
}

export function VisualizationPanel({
  selectedGene,
  analysisResult,
}: {
  selectedGene: GeneFromSearch | null;
  analysisResult: AnalysisResult | null;
}) {
  return (
    <aside className="flex h-full w-[360px] flex-shrink-0 flex-col overflow-hidden bg-[#0c1a0d]">
      {/* Logo */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-light tracking-wide text-white">Nucleus</span>
        </div>
        <p className="mt-0.5 text-[11px] uppercase tracking-widest text-white/30">
          Variant Analysis Engine
        </p>
      </div>

      {/* DNA Helix */}
      <div className="relative min-h-[160px] flex-1">
        <DnaHelix />
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-10 bg-gradient-to-t from-[#0c1a0d] to-transparent" />
      </div>

      {/* Info cards — sized to their own content now, not stretched */}
      <div className="max-h-[60%] flex-shrink-0 overflow-y-auto px-5 pb-5">
        {analysisResult ? (
          <ResultInfo result={analysisResult} />
        ) : selectedGene ? (
          <GeneInfo gene={selectedGene} />
        ) : (
          <IdleInfo />
        )}
      </div>
    </aside>
  );
}
