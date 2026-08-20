"use client";

import {
  type AnalysisResult,
  analyzeVariantWithAPI,
  type ClinvarVariant,
  type GeneBounds,
  type GeneFromSearch,
} from "~/utils/genome-api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  getClassificationColorClasses,
  getNucleotideColorClass,
} from "~/utils/coloring-utils";
import { Button } from "./ui/button";
import { Zap } from "lucide-react";

export interface VariantAnalysisHandle {
  focusAlternativeInput: () => void;
}

interface VariantAnalysisProps {
  gene: GeneFromSearch;
  genomeId: string;
  chromosome: string;
  clinvarVariants: Array<ClinvarVariant>;
  referenceSequence: string | null;
  sequencePosition: number | null;
  geneBounds: GeneBounds | null;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

const VariantAnalysis = forwardRef<VariantAnalysisHandle, VariantAnalysisProps>(
  (
    {
      gene,
      genomeId,
      chromosome,
      clinvarVariants = [],
      referenceSequence,
      sequencePosition,
      geneBounds,
      onAnalysisComplete,
    }: VariantAnalysisProps,
    ref,
  ) => {
    const [variantPosition, setVariantPosition] = useState<string>(
      geneBounds?.min?.toString() ?? "",
    );
    const [variantReference, setVariantReference] = useState("");
    const [variantAlternative, setVariantAlternative] = useState("");
    const [variantResult, setVariantResult] = useState<AnalysisResult | null>(
      null,
    );
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [variantError, setVariantError] = useState<string | null>(null);
    const alternativeInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focusAlternativeInput: () => {
        if (alternativeInputRef.current) {
          alternativeInputRef.current.focus();
        }
      },
    }));

    useEffect(() => {
      if (sequencePosition && referenceSequence) {
        setVariantPosition(String(sequencePosition));
        setVariantReference(referenceSequence);
      }
    }, [sequencePosition, referenceSequence]);

    const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setVariantPosition(e.target.value);
      setVariantReference("");
    };

    const handleVariantSubmit = async (pos: string, alt: string) => {
      const position = parseInt(pos);
      if (isNaN(position)) {
        setVariantError("Please enter a valid position number");
        return;
      }

      const validNucleotides = /^[ATGC]$/;
      if (!validNucleotides.test(alt)) {
        setVariantError("Nucleotides must be A, C, G or T");
        return;
      }

      setIsAnalyzing(true);
      setVariantError(null);

      try {
        const data = await analyzeVariantWithAPI({
          position,
          alternative: alt,
          genomeId,
          chromosome,
        });
        setVariantResult(data);
        onAnalysisComplete?.(data);
      } catch (err) {
        console.error(err);
        setVariantError("Failed to analyze variant");
      } finally {
        setIsAnalyzing(false);
      }
    };

    return (
      <Card className="gap-0 border-none bg-white py-0 shadow-sm">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="text-sm font-normal text-[#3c4f3d]/70">
            Variant Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="mb-4 text-xs text-[#3c4f3d]/80">
            Predict the impact of genetic variants using the Nucleus deep learning
            model.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs text-[#3c4f3d]/70">
                Position
              </label>
              <Input
                value={variantPosition}
                onChange={handlePositionChange}
                className="h-8 w-32 border-[#3c4f3d]/10 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#3c4f3d]/70">
                Alternative (variant)
              </label>
              <Input
                ref={alternativeInputRef}
                value={variantAlternative}
                onChange={(e) =>
                  setVariantAlternative(e.target.value.toUpperCase())
                }
                className="h-8 w-32 border-[#3c4f3d]/10 text-xs"
                placeholder="e.g., T"
                maxLength={1}
              />
            </div>
            {variantReference && (
              <div className="mb-2 flex items-center gap-2 text-xs text-[#3c4f3d]">
                <span>Substitution</span>
                <span
                  className={`font-medium ${getNucleotideColorClass(variantReference)}`}
                >
                  {variantReference}
                </span>
                <span>→</span>
                <span
                  className={`font-medium ${getNucleotideColorClass(variantAlternative)}`}
                >
                  {variantAlternative ? variantAlternative : "?"}
                </span>
              </div>
            )}
            <Button
              disabled={isAnalyzing || !variantPosition || !variantAlternative}
              className="h-8 cursor-pointer bg-[#3c4f3d] text-xs text-white hover:bg-[#3c4f3d]/90"
              onClick={() =>
                handleVariantSubmit(
                  variantPosition.replaceAll(",", ""),
                  variantAlternative,
                )
              }
            >
              {isAnalyzing ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent align-middle"></span>
                  Analyzing...
                </>
              ) : (
                "Analyze variant"
              )}
            </Button>
          </div>

          {variantPosition &&
            clinvarVariants
              .filter(
                (variant) =>
                  variant?.variation_type
                    ?.toLowerCase()
                    .includes("single nucleotide") &&
                  parseInt(variant?.location?.replaceAll(",", "")) ===
                    parseInt(variantPosition.replaceAll(",", "")),
              )
              .map((matchedVariant) => {
                const refAltMatch = /(\w)>(\w)/.exec(matchedVariant.title);

                let ref = null;
                let alt = null;
                if (refAltMatch?.length === 3) {
                  ref = refAltMatch[1];
                  alt = refAltMatch[2];
                }

                if (!ref || !alt) return null;

                return (
                  <div
                    key={matchedVariant.clinvar_id}
                    className="mt-4 rounded-md border border-[#3c4f3d]/10 bg-[#e9eeea]/30 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-medium text-[#3c4f3d]">
                        Known Variant Detected
                      </h4>
                      <span className="text-xs text-[#3c4f3d]/70">
                        Position: {matchedVariant.location}
                      </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="mb-1 text-xs font-medium text-[#3c4f3d]/70">
                          Variant Details
                        </div>
                        <div className="text-sm">{matchedVariant.title}</div>
                        <div className="mt-2 text-sm">
                          {gene?.symbol} {variantPosition}{" "}
                          <span className="font-mono">
                            <span className={getNucleotideColorClass(ref)}>
                              {ref}
                            </span>
                            <span>{">"}</span>
                            <span className={getNucleotideColorClass(alt)}>
                              {alt}
                            </span>
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-[#3c4f3d]/70">
                          ClinVar classification
                          <span
                            className={`ml-1 rounded-sm px-2 py-0.5 ${getClassificationColorClasses(matchedVariant.classification)}`}
                          >
                            {matchedVariant.classification || "Unknown"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <Button
                          disabled={isAnalyzing}
                          variant="outline"
                          size="sm"
                          className="h-7 cursor-pointer border-[#3c4f3d]/20 bg-[#e9eeea] text-xs text-[#3c4f3d] hover:bg-[#3c4f3d]/10"
                          onClick={() => {
                            setVariantAlternative(alt);
                            void handleVariantSubmit(
                              variantPosition.replaceAll(",", ""),
                              alt,
                            );
                          }}
                        >
                          {isAnalyzing ? (
                            <>
                              <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent align-middle"></span>
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Zap className="mr-1 inline-block h-3 w-3" />
                              Analyze this Variant
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })[0]}

          {variantError && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-600">
              {variantError}
            </div>
          )}

          {variantResult && (
  <div className="mt-6 rounded-xl border border-[#3c4f3d]/15 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center justify-between">
      <h4 className="text-base font-medium text-[#3c4f3d]">
        Analysis Result
      </h4>
      <span
        className={`inline-block rounded-lg px-3 py-1 text-xs font-medium ${getClassificationColorClasses(variantResult.prediction)}`}
      >
        {variantResult.prediction}
      </span>
    </div>

    <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
      {/* Left — variant + delta score */}
      <div className="flex-1 space-y-5">
        <div>
          <div className="text-xs font-medium tracking-wide text-[#3c4f3d]/60 uppercase">
            Variant
          </div>
          <div className="mt-1 text-lg font-semibold text-[#3c4f3d]">
            {gene?.symbol} {variantResult.position}{" "}
            <span className="font-mono text-base font-normal">
              {variantResult.reference}
              {">"}
              {variantResult.alternative}
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-[#3c4f3d]/5 p-4">
          <div className="text-xs font-medium tracking-wide text-[#3c4f3d]/60 uppercase">
            Delta likelihood score
          </div>
          <div className="mt-1 font-mono text-2xl font-semibold text-[#3c4f3d]">
            {variantResult.delta_score.toFixed(6)}
          </div>
          <div className="mt-1 text-xs text-[#3c4f3d]/60">
            Negative score indicates loss of function
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden h-32 w-px bg-[#3c4f3d]/10 sm:block" />

      {/* Right — bigger confidence donut */}
      <div className="flex flex-shrink-0 flex-col items-center gap-2">
        <div
          className="relative flex h-40 w-40 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${
              variantResult.prediction.toLowerCase().includes("pathogenic")
                ? "#dc2626"
                : "#16a34a"
            } ${
              Math.min(100, variantResult.classification_confidence * 100) * 3.6
            }deg, #e2e7e2 0deg)`,
          }}
        >
          <div className="absolute flex h-[116px] w-[116px] flex-col items-center justify-center rounded-full bg-white">
            <span className="text-3xl font-semibold text-[#3c4f3d]">
              {Math.round(
                Math.min(100, variantResult.classification_confidence * 100),
              )}
              %
            </span>
            <span className="mt-0.5 text-[11px] text-[#3c4f3d]/50">
              confidence
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
        </CardContent>
      </Card>
    );
  },
);

VariantAnalysis.displayName = "VariantAnalysis";

export default VariantAnalysis;