import { env } from "~/env";

export interface GenomeAssemblyFromSearch {
  id: string;
  name: string;
  sourceName: string;
  active: boolean;
}

export interface ChromosomeFromSeach {
  name: string;
  size: number;
}

export interface GeneFromSearch {
  symbol: string;
  name: string;
  chrom: string;
  description: string;
  gene_id?: string;
}

export interface GeneDetailsFromSearch {
  genomicinfo?: {
    chrstart: number;
    chrstop: number;
    strand?: string;
  }[];
  summary?: string;
  organism?: {
    scientificname: string;
    commonname: string;
  };
}

export interface GeneBounds {
  min: number;
  max: number;
}

export interface ClinvarVariant {
  clinvar_id: string;
  title: string;
  variation_type: string;
  classification: string;
  gene_sort: string;
  chromosome: string;
  location: string;
  evo2Result?: {
    prediction: string;
    delta_score: number;
    classification_confidence: number;
  };
  isAnalyzing?: boolean;
  evo2Error?: string;
}

export interface AnalysisResult {
  position: number;
  reference: string;
  alternative: string;
  delta_score: number;
  prediction: string;
  classification_confidence: number;
}

// --- Raw external API response shapes (UCSC / NCBI / ClinicalTables) ---

interface UcscGenomesResponse {
  ucscGenomes?: Record<
    string,
    {
      organism?: string;
      description?: string;
      sourceName?: string;
      active?: boolean | number;
    }
  >;
}

interface UcscChromosomesResponse {
  chromosomes?: Record<string, number>;
}

interface UcscSequenceResponse {
  dna?: string;
  error?: string;
}

// ClinicalTables search API: [totalCount, codes[], fieldMap, displayRows[][]]
type ClinicalTablesSearchResponse = [
  number,
  string[],
  { GeneID?: string[] } | null,
  string[][],
];

interface NcbiGeneSummaryResponse {
  result?: Record<string, GeneDetailsFromSearch>;
}

interface NcbiEsearchResponse {
  esearchresult?: {
    idlist?: string[];
  };
}

interface ClinvarEsummaryVariant {
  title?: string;
  obj_type?: string;
  germline_classification?: { description?: string };
  gene_sort?: string;
  location_sort?: string;
}

interface ClinvarEsummaryResponse {
  result?: { uids?: string[] } & Record<string, ClinvarEsummaryVariant>;
}

export async function getAvailableGenomes() {
  const apiUrl = "https://api.genome.ucsc.edu/list/ucscGenomes";
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch genome list from UCSC API");
  }

  const genomeData = (await response.json()) as UcscGenomesResponse;
  if (!genomeData.ucscGenomes) {
    throw new Error("UCSC API error: missing ucscGenomes");
  }

  const genomes = genomeData.ucscGenomes;
  const structuredGenomes: Record<string, GenomeAssemblyFromSearch[]> = {};

  for (const genomeId in genomes) {
    const genomeInfo = genomes[genomeId];
    const organism = genomeInfo?.organism ?? "Other";

    structuredGenomes[organism] ??= [];
    structuredGenomes[organism].push({
      id: genomeId,
      name: genomeInfo?.description ?? genomeId,
      sourceName: genomeInfo?.sourceName ?? genomeId,
      active: !!genomeInfo?.active,
    });
  }

  return { genomes: structuredGenomes };
}

export async function getGenomeChromosomes(genomeId: string) {
  const apiUrl = `https://api.genome.ucsc.edu/list/chromosomes?genome=${genomeId}`;
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch chromosome list from UCSC API");
  }

  const chromosomeData = (await response.json()) as UcscChromosomesResponse;
  if (!chromosomeData.chromosomes) {
    throw new Error("UCSC API error: missing chromosomes");
  }

  const chromosomeSizes = chromosomeData.chromosomes;
  const chromosomes: ChromosomeFromSeach[] = [];
  for (const chromId in chromosomeSizes) {
    if (
      chromId.includes("_") ||
      chromId.includes("Un") ||
      chromId.includes("random")
    )
      continue;
    chromosomes.push({
      name: chromId,
      size: chromosomeSizes[chromId]!,
    });
  }

  // chr1, chr2, ... chrX, chrY
  chromosomes.sort((a, b) => {
    const anum = a.name.replace("chr", "");
    const bnum = b.name.replace("chr", "");
    const isNumA = /^\d+$/.test(anum);
    const isNumB = /^\d+$/.test(bnum);
    if (isNumA && isNumB) return Number(anum) - Number(bnum);
    if (isNumA) return -1;
    if (isNumB) return 1;
    return anum.localeCompare(bnum);
  });

  return { chromosomes };
}

export async function searchGenes(query: string, genome: string) {
  const url = "https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search";
  const params = new URLSearchParams({
    terms: query,
    maxList: "20",
    df: "chromosome,Symbol,description,map_location,type_of_gene",
    ef: "chromosome,Symbol,description,map_location,type_of_gene,GenomicInfo,GeneID",
  });
  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error("NCBI API Error");
  }

  const data = (await response.json()) as ClinicalTablesSearchResponse;
  const results: GeneFromSearch[] = [];

  const [totalCount, , fieldMap, displayRows] = data;

  if (totalCount > 0) {
    const geneIds = fieldMap?.GeneID ?? [];
    for (let i = 0; i < displayRows.length; ++i) {
      try {
        const display = displayRows[i]!;
        let chrom = display[0] ?? "";
        if (chrom && !chrom.startsWith("chr")) {
          chrom = `chr${chrom}`;
        }
        results.push({
          symbol: display[1] ?? "",
          name: display[2] ?? "",
          chrom,
          description: display[2] ?? "",
          gene_id: geneIds[i] ?? "",
        });
      } catch {
        continue;
      }
    }
  }

  // Prioritize an exact symbol match (e.g. searching "BRCA1" should surface
  // the BRCA1 gene itself, not just genes whose description mentions it).
  results.sort((a, b) => {
    const aExact = a.symbol.toLowerCase() === query.toLowerCase() ? 0 : 1;
    const bExact = b.symbol.toLowerCase() === query.toLowerCase() ? 0 : 1;
    return aExact - bExact;
  });

  return { query, genome, results: results.slice(0, 10) };
}

export async function fetchGeneDetails(geneId: string): Promise<{
  geneDetails: GeneDetailsFromSearch | null;
  geneBounds: GeneBounds | null;
  initialRange: { start: number; end: number } | null;
}> {
  try {
    const detailUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`;
    const detailsResponse = await fetch(detailUrl);

    if (!detailsResponse.ok) {
      console.error(
        `Failed to fetch gene details: ${detailsResponse.statusText}`,
      );
      return { geneDetails: null, geneBounds: null, initialRange: null };
    }

    const detailData = (await detailsResponse.json()) as NcbiGeneSummaryResponse;
    const detail = detailData.result?.[geneId];

    if (detail?.genomicinfo && detail.genomicinfo.length > 0) {
      const info = detail.genomicinfo[0]!;

      const minPos = Math.min(info.chrstart, info.chrstop);
      const maxPos = Math.max(info.chrstart, info.chrstop);
      const bounds = { min: minPos, max: maxPos };

      const geneSize = maxPos - minPos;
      const seqStart = minPos;
      const seqEnd = geneSize > 10000 ? minPos + 10000 : maxPos;
      const range = { start: seqStart, end: seqEnd };

      return { geneDetails: detail, geneBounds: bounds, initialRange: range };
    }

    return { geneDetails: null, geneBounds: null, initialRange: null };
  } catch {
    return { geneDetails: null, geneBounds: null, initialRange: null };
  }
}

export async function fetchGeneSequence(
  chrom: string,
  start: number,
  end: number,
  genomeId: string,
): Promise<{
  sequence: string;
  actualRange: { start: number; end: number };
  error?: string;
}> {
  try {
    const chromosome = chrom.startsWith("chr") ? chrom : `chr${chrom}`;

    const apiStart = start - 1;
    const apiEnd = end;

    const apiUrl = `https://api.genome.ucsc.edu/getData/sequence?genome=${genomeId};chrom=${chromosome};start=${apiStart};end=${apiEnd}`;
    const response = await fetch(apiUrl);
    const data = (await response.json()) as UcscSequenceResponse;

    const actualRange = { start, end };

    if (!data.dna) {
      return { sequence: "", actualRange, error: data.error ?? "Unknown error" };
    }

    const sequence = data.dna.toUpperCase();

    return { sequence, actualRange };
  } catch {
    return {
      sequence: "",
      actualRange: { start, end },
      error: "Internal error in fetch gene sequence",
    };
  }
}

export async function fetchClinvarVariants(
  chrom: string,
  geneBound: GeneBounds,
  genomeId: string,
): Promise<ClinvarVariant[]> {
  const chromFormatted = chrom.replace(/^chr/i, "");

  const minBound = Math.min(geneBound.min, geneBound.max);
  const maxBound = Math.max(geneBound.min, geneBound.max);

  const positionField = genomeId === "hg19" ? "chrpos37" : "chrpos38";
  const searchTerm = `${chromFormatted}[chromosome] AND ${minBound}:${maxBound}[${positionField}]`;

  const searchUrl =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
  const searchParams = new URLSearchParams({
    db: "clinvar",
    term: searchTerm,
    retmode: "json",
    retmax: "20",
  });

  const searchResponse = await fetch(`${searchUrl}?${searchParams.toString()}`);

  if (!searchResponse.ok) {
    throw new Error("ClinVar search failed: " + searchResponse.statusText);
  }

  const searchData = (await searchResponse.json()) as NcbiEsearchResponse;
  const idlist = searchData.esearchresult?.idlist ?? [];

  if (idlist.length === 0) {
    console.log("No ClinVar variants found");
    return [];
  }

  const summaryUrl =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
  const summaryParams = new URLSearchParams({
    db: "clinvar",
    id: idlist.join(","),
    retmode: "json",
  });

  const summaryResponse = await fetch(
    `${summaryUrl}?${summaryParams.toString()}`,
  );

  if (!summaryResponse.ok) {
    throw new Error(
      "Failed to fetch variant details: " + summaryResponse.statusText,
    );
  }

  const summaryData = (await summaryResponse.json()) as ClinvarEsummaryResponse;
  const variants: ClinvarVariant[] = [];

  const uids = summaryData.result?.uids ?? [];
  for (const id of uids) {
    const variant = summaryData.result?.[id];
    if (!variant) continue;

    variants.push({
      clinvar_id: id,
      title: variant.title ?? "Unknown",
      variation_type: (variant.obj_type ?? "Unknown")
        .split(" ")
        .map(
          (word: string) =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" "),
      classification: variant.germline_classification?.description ?? "Unknown",
      gene_sort: variant.gene_sort ?? "",
      chromosome: chromFormatted,
      location: variant.location_sort
        ? parseInt(variant.location_sort).toLocaleString()
        : "Unknown",
    });
  }

  return variants;
}

export async function analyzeVariantWithAPI({
  position,
  alternative,
  genomeId,
  chromosome,
}: {
  position: number;
  alternative: string;
  genomeId: string;
  chromosome: string;
}): Promise<AnalysisResult> {
  const url = env.NEXT_PUBLIC_ANALYZE_SINGLE_VARIANT_BASE_URL;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      variant_position: position,
      alternative: alternative,
      genome: genomeId,
      chromosome: chromosome,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error("Failed to analyze variant " + errorText);
  }

  return (await response.json()) as AnalysisResult;
}
