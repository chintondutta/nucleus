"use client";

import {
  ChevronRight,
  LayoutGrid,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";

import GeneViewer from "~/components/gene-viewer";
import { VisualizationPanel } from "~/components/visualization-panel";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import {
  type AnalysisResult,
  type ChromosomeFromSeach,
  type GeneFromSearch,
  type GenomeAssemblyFromSearch,
  getAvailableGenomes,
  getGenomeChromosomes,
  searchGenes,
} from "~/utils/genome-api";

type Mode = "browse" | "search";

export default function HomePage() {
  const [genomes, setGenomes] = useState<GenomeAssemblyFromSearch[]>([]);
  const [selectedGenome, setSelectedGenome] = useState<string>("hg38");

  const [chromosomes, setChromosomes] = useState<
    ChromosomeFromSeach[]
  >([]);

  const [selectedChromosome, setSelectedChromosome] =
    useState<string>("chr1");

  const [selectedGene, setSelectedGene] =
    useState<GeneFromSearch | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [searchResults, setSearchResults] =
    useState<GeneFromSearch[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("search");

  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResult | null>(null);

  const [hasSearched, setHasSearched] = useState(false);

  /* ============================================================
     LOAD GENOMES
  ============================================================ */

  useEffect(() => {
    const fetchGenomes = async () => {
      try {
        setIsLoading(true);

        const data = await getAvailableGenomes();

        if (data.genomes?.Human) {
          setGenomes(data.genomes.Human);
        }
      } catch {
        setError("Failed to load genome data");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchGenomes();
  }, []);

  /* ============================================================
     LOAD CHROMOSOMES
  ============================================================ */

  useEffect(() => {
    const fetchChromosomes = async () => {
      try {
        setIsLoading(true);

        const data = await getGenomeChromosomes(selectedGenome);

        setChromosomes(data.chromosomes);

        if (data.chromosomes.length > 0) {
          setSelectedChromosome(data.chromosomes[0]!.name);
        }
      } catch {
        setError("Failed to load chromosome data");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchChromosomes();
  }, [selectedGenome]);

  /* ============================================================
     GENE SEARCH
  ============================================================ */

  const performGeneSearch = async (
    query: string,
    genome: string,
    filterFn?: (gene: GeneFromSearch) => boolean,
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      const data = await searchGenes(query, genome);

      const results = filterFn
        ? data.results.filter(filterFn)
        : data.results;

      setSearchResults(results);
    } catch {
      setError("Failed to search genes");
    } finally {
      setIsLoading(false);
    }
  };

  /* ============================================================
     BROWSE CHROMOSOMES
  ============================================================ */

  useEffect(() => {
    if (!selectedChromosome || mode !== "browse") return;

    void performGeneSearch(
      selectedChromosome,
      selectedGenome,
      (gene: GeneFromSearch) =>
        gene.chrom === selectedChromosome,
    );
  }, [selectedChromosome, selectedGenome, mode]);

  /* ============================================================
     HANDLERS
  ============================================================ */

  const handleGenomeChange = (value: string) => {
    setSelectedGenome(value);
    setSearchResults([]);
    setSelectedGene(null);
    setHasSearched(false);
    setError(null);
  };

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;

    setSearchResults([]);
    setSelectedGene(null);
    setError(null);
    setHasSearched(false);

    setMode(newMode);

    if (newMode === "search") {
      setSearchQuery("");
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!searchQuery.trim()) return;

    void performGeneSearch(
      searchQuery,
      selectedGenome,
    );
  };

  const currentGenome = genomes.find(
    (genome) => genome.id === selectedGenome,
  );

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f1f5f2]">

      {/* LEFT VISUALIZATION PANEL */}
      <VisualizationPanel
        selectedGene={selectedGene}
        analysisResult={analysisResult}
      />

      {/* MAIN AREA */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">

        {/* NAVBAR */}
        <header className="shrink-0 border-b border-[#3c4f3d]/10 bg-white">
          <div className="flex w-full items-center px-6 py-4">

            <div className="flex items-center gap-3">

              <div className="relative">
                <h1 className="text-xl font-light tracking-wide text-[#3c4f3d]">
                  <span className="font-normal">
                    Nucleus
                  </span>
                </h1>

                <div className="absolute -bottom-1 left-0 h-[2px] w-12 bg-[#de8246]" />
              </div>

              <span className="text-sm font-light text-[#3c4f3d]/70">
                Variant Analysis
              </span>

            </div>

          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="w-full px-6 py-6">

          {selectedGene ? (

            <GeneViewer
              gene={selectedGene}
              genomeId={selectedGenome}
              onClose={() => {
                setSelectedGene(null);
                setAnalysisResult(null);
              }}
              onAnalysisComplete={setAnalysisResult}
            />

          ) : (

            <div className="space-y-4">

              {/* GENOME ASSEMBLY */}
              <Card className="overflow-hidden rounded-2xl border border-[#dce7df] bg-white py-0 shadow-[0_2px_10px_rgba(30,60,40,0.035)]">

                <CardHeader className="px-5 pb-2 pt-4">

                  <div className="flex items-center justify-between gap-4">

                    <div className="flex items-center gap-2.5">

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm">
                        🧬
                      </div>

                      <div>
                        <CardTitle className="text-sm font-medium text-[#18372a]">
                          Genome Assembly
                        </CardTitle>

                        <p className="mt-0.5 text-[11px] text-[#789083]">
                          Reference genome used for analysis
                        </p>
                      </div>

                    </div>

                    <div className="text-xs text-[#718278]">
                      Organism:{" "}
                      <span className="font-medium text-[#18372a]">
                        Human
                      </span>
                    </div>

                  </div>

                </CardHeader>

                <CardContent className="px-5 pb-4">

                  <Select
                    value={selectedGenome}
                    onValueChange={handleGenomeChange}
                    disabled={isLoading}
                  >

                    <SelectTrigger className="h-10 w-full rounded-lg border-[#d8e2dc] bg-[#fcfdfc] text-sm">

                      <SelectValue placeholder="Select genome assembly" />

                    </SelectTrigger>

                    <SelectContent>

                      {genomes.map((genome) => (

                        <SelectItem
                          key={genome.id}
                          value={genome.id}
                        >
                          {genome.id} - {genome.name}
                          {genome.active
                            ? " (active)"
                            : ""}
                        </SelectItem>

                      ))}

                    </SelectContent>

                  </Select>

                  {currentGenome && (

                    <div className="mt-2 flex items-center justify-between gap-3">

                      <p className="truncate text-[11px] text-[#789083]">
                        {currentGenome.sourceName}
                      </p>

                      {currentGenome.active && (

                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
                          Active
                        </span>

                      )}

                    </div>

                  )}

                </CardContent>

              </Card>


              {/* EXPLORE THE GENOME */}
              <Card className="overflow-hidden rounded-2xl border border-[#dce7df] bg-white p-0 shadow-[0_3px_14px_rgba(30,60,40,0.045)]">

                <div className="grid min-h-[265px] grid-cols-1 lg:grid-cols-[1fr_230px]">

                  {/* SEARCH CONTENT */}
                  <div className="min-w-0 p-5 md:p-6">

                    {/* HEADER */}
                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#0f3d2e]">
                        <Search className="h-[19px] w-[19px] stroke-[2.2]" />
                      </div>

                      <div>

                        <h2 className="text-lg font-semibold leading-tight text-[#15271f]">
                          Explore the Genome
                        </h2>

                        <p className="mt-1 max-w-[650px] text-xs leading-relaxed text-[#708078]">
                          Search for genes or browse chromosomes to find variants and analyze their potential impact.
                        </p>

                      </div>

                    </div>


                    {/* MODE BUTTONS */}
                    <div className="mt-4 flex gap-2">

                      <Button
                        type="button"
                        variant={
                          mode === "search"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          switchMode("search")
                        }
                        className={
                          mode === "search"
                            ? "h-9 cursor-pointer rounded-lg bg-[#193729] px-4 text-xs shadow-none hover:bg-[#193729]/90"
                            : "h-9 cursor-pointer rounded-lg border-[#d9e2dc] px-4 text-xs"
                        }
                      >
                        <Search className="mr-2 h-3.5 w-3.5" />
                        Search Genes
                      </Button>


                      <Button
                        type="button"
                        variant={
                          mode === "browse"
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          switchMode("browse")
                        }
                        className={
                          mode === "browse"
                            ? "h-9 cursor-pointer rounded-lg bg-[#193729] px-4 text-xs shadow-none hover:bg-[#193729]/90"
                            : "h-9 cursor-pointer rounded-lg border-[#d9e2dc] px-4 text-xs"
                        }
                      >
                        <LayoutGrid className="mr-2 h-3.5 w-3.5" />
                        Browse Chromosomes
                      </Button>

                    </div>


                    {/* SEARCH MODE */}
                    {mode === "search" ? (

                      <div className="mt-4">

                        <form
                          onSubmit={handleSearch}
                          className="flex w-full"
                        >

                          <Input
                            type="text"
                            placeholder="Enter gene symbol or name (e.g., BRCA1, TP53)"
                            value={searchQuery}
                            onChange={(e) =>
                              setSearchQuery(
                                e.target.value,
                              )
                            }
                            className="h-11 min-w-0 rounded-l-xl rounded-r-none border-[#d8e2dc] bg-white px-4 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-emerald-200"
                          />

                          <Button
                            type="submit"
                            disabled={
                              isLoading ||
                              !searchQuery.trim()
                            }
                            className="h-11 shrink-0 cursor-pointer rounded-l-none rounded-r-xl bg-[#0f3d2e] px-5 hover:bg-[#0f3d2e]/90"
                          >
                            <Search className="h-4 w-4" />
                            <span className="sr-only">
                              Search
                            </span>
                          </Button>

                        </form>


                        {/* POPULAR SEARCHES */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">

                          <span className="text-[#7a8981]">
                            Popular searches:
                          </span>

                          {[
                            "BRCA1",
                            "TP53",
                            "EGFR",
                            "APC",
                            "CFTR",
                          ].map((symbol) => (

                            <button
                              key={symbol}
                              type="button"
                              onClick={() => {
                                setSearchQuery(symbol);

                                void performGeneSearch(
                                  symbol,
                                  selectedGenome,
                                );
                              }}
                              className="cursor-pointer rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-800 transition hover:bg-emerald-100"
                            >
                              {symbol}
                            </button>

                          ))}

                        </div>

                      </div>

                    ) : (

                      /* BROWSE MODE */
                      <div className="mt-4 max-h-[105px] overflow-y-auto pr-1">

                        <div className="flex flex-wrap gap-2">

                          {chromosomes.map((chrom) => (

                            <Button
                              key={chrom.name}
                              type="button"
                              variant="outline"
                              size="sm"
                              className={`h-8 cursor-pointer rounded-lg border-[#d9e2dc] px-3 text-xs ${
                                selectedChromosome ===
                                chrom.name
                                  ? "bg-[#e8f1eb] text-[#244d39]"
                                  : ""
                              }`}
                              onClick={() =>
                                setSelectedChromosome(
                                  chrom.name,
                                )
                              }
                            >
                              {chrom.name}
                            </Button>

                          ))}

                        </div>

                      </div>

                    )}

                  </div>


                  {/* RIGHT VISUAL */}
                  <div className="relative hidden overflow-hidden bg-[#f5faf7] lg:flex">

                    <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-100/70" />
                    <div className="absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-emerald-50" />

                    <div className="relative z-10 m-auto w-[175px]">

                      <div className="mb-3 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[9px] font-semibold tracking-[0.18em] text-emerald-700">
                          GENOME SEARCH
                        </span>
                      </div>

                      <div className="relative rounded-2xl border border-emerald-100 bg-white p-3 shadow-[0_8px_25px_rgba(25,80,55,0.08)]">

                        <div className="grid grid-cols-6 gap-2">

                          {[
                            "A", "T", "G", "C", "A", "G",
                            "T", "G", "C", "A", "T", "C",
                            "C", "A", "G", "T", "G", "A",
                            "G", "T", "A", "C", "C", "T",
                            "A", "C", "G", "T", "G", "A",
                          ].map((base, index) => (

                            <div
                              key={index}
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-semibold ${
                                base === "A"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : base === "T"
                                    ? "bg-orange-50 text-orange-600"
                                    : base === "G"
                                      ? "bg-amber-50 text-amber-600"
                                      : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {base}
                            </div>

                          ))}

                        </div>

                        <div className="absolute -bottom-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#0f3d2e] text-white shadow-lg">
                          <Search className="h-4 w-4" />
                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </Card>


              {/* LOADING */}
              {isLoading && (

                <div className="flex justify-center py-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3c4f3d]/20 border-t-[#de8243]" />
                </div>

              )}


              {/* ERROR */}
              {error && (

                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>

              )}


              {/* RESULTS */}
              {searchResults.length > 0 &&
                !isLoading && (

                  <Card className="overflow-hidden rounded-2xl border border-[#dce7df] bg-white p-5 shadow-sm">

                    <div className="mb-3">

                      <h4 className="text-xs text-[#718078]">

                        {mode === "search" ? (

                          <>
                            Search Results:{" "}
                            <span className="font-medium text-[#244d39]">
                              {searchResults.length} genes
                            </span>
                          </>

                        ) : (

                          <>
                            Genes on{" "}
                            {selectedChromosome}:{" "}
                            <span className="font-medium text-[#244d39]">
                              {searchResults.length} found
                            </span>
                          </>

                        )}

                      </h4>

                    </div>


                    <div className="overflow-hidden rounded-lg border border-[#dce7df]">

                      <Table>

                        <TableHeader>

                          <TableRow className="bg-[#f3f7f4] hover:bg-[#f3f7f4]">

                            <TableHead className="text-xs font-medium text-[#62736a]">
                              Symbol
                            </TableHead>

                            <TableHead className="text-xs font-medium text-[#62736a]">
                              Name
                            </TableHead>

                            <TableHead className="text-xs font-medium text-[#62736a]">
                              Location
                            </TableHead>

                          </TableRow>

                        </TableHeader>


                        <TableBody>

                          {searchResults.map(
                            (gene, index) => (

                              <TableRow
                                key={`${gene.symbol}-${index}`}
                                className="cursor-pointer border-b border-[#e7eee9] hover:bg-[#f4f8f5]"
                                onClick={() =>
                                  setSelectedGene(
                                    gene,
                                  )
                                }
                              >

                                <TableCell className="py-2.5 font-medium text-[#244d39]">
                                  {gene.symbol}
                                </TableCell>

                                <TableCell className="py-2.5 text-sm text-[#506259]">
                                  {gene.name}
                                </TableCell>

                                <TableCell className="py-2.5 text-sm text-[#506259]">
                                  {gene.chrom}
                                </TableCell>

                              </TableRow>

                            ),
                          )}

                        </TableBody>

                      </Table>

                    </div>

                  </Card>

                )}


              {/* NO RESULTS */}
              {hasSearched &&
                !isLoading &&
                !error &&
                searchResults.length === 0 && (

                  <div className="rounded-xl border border-dashed border-[#d6e1da] bg-white p-7 text-center text-gray-400">

                    <Search className="mx-auto mb-2 h-6 w-6" />

                    <p className="text-sm">
                      No genes found for your search.
                    </p>

                  </div>

                )}


              {/* HOW NUCLEUS WORKS */}
              <Card className="overflow-hidden rounded-2xl border border-[#dce7df] bg-white p-5 shadow-[0_2px_10px_rgba(30,60,40,0.035)]">

                {/* HEADER */}
                <div className="mb-4 flex items-center gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-base">
                    🧪
                  </div>

                  <div>

                    <h3 className="text-sm font-semibold text-[#1d3027]">
                      How Nucleus Works
                    </h3>

                    <p className="mt-0.5 text-[11px] text-[#7a8981]">
                      From gene search to variant interpretation
                    </p>

                  </div>

                </div>


                {/* STEPS GRID */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">

                  {[
                    {
                      number: "01",
                      step: "Search Gene",
                      desc: "Find a gene or browse by chromosome.",
                    },
                    {
                      number: "02",
                      step: "Select Variant",
                      desc: "Choose a position and nucleotide change.",
                    },
                    {
                      number: "03",
                      step: "Analyze",
                      desc: "Nucleus evaluates the variant impact.",
                    },
                    {
                      number: "04",
                      step: "View Results",
                      desc: "Review prediction and confidence.",
                    },
                  ].map((item) => (

                    <div
                      key={item.number}
                      className="group rounded-xl border border-[#dce7df] bg-[#f8fbf9] p-3.5 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                    >

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-[10px] font-semibold tracking-[0.12em] text-emerald-700">
                          {item.number}
                        </span>

                        <ChevronRight className="h-3.5 w-3.5 text-[#3c4f3d]/20 transition group-hover:translate-x-0.5" />

                      </div>

                      <div className="text-sm font-semibold text-[#18372a]">
                        {item.step}
                      </div>

                      <div className="mt-1 text-[11px] leading-relaxed text-[#718078]">
                        {item.desc}
                      </div>

                    </div>

                  ))}

                </div>

              </Card>

            </div>

          )}

        </main>

      </div>

    </div>
  );
}