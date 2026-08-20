import { describe, expect, it, vi, afterEach } from "vitest";
import { getGenomeChromosomes, searchGenes } from "./genome-api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getGenomeChromosomes", () => {
  it("filters unwanted chromosomes and sorts them correctly", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          chromosomes: {
            chrX: 156040895,
            chr2: 242193529,
            chr1: 248956422,
            chrY: 57227415,
            chr1_KI270706v1_random: 175055,
            chrUn_KI270742v1: 186739,
          },
        }),
      ),
    );

    const result = await getGenomeChromosomes("hg38");

    expect(result.chromosomes).toEqual([
      { name: "chr1", size: 248956422 },
      { name: "chr2", size: 242193529 },
      { name: "chrX", size: 156040895 },
      { name: "chrY", size: 57227415 },
    ]);
  });

  it("throws when the API response does not contain chromosomes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({})),
    );

    await expect(getGenomeChromosomes("hg38")).rejects.toThrow(
      "UCSC API error: missing chromosomes",
    );
  });
});

describe("searchGenes", () => {
  it("correctly parses gene search results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          2,
          ["123", "456"],
          {
            GeneID: ["672", "675"],
          },
          [
            ["17", "BRCA1", "BRCA1 DNA repair associated"],
            ["13", "BRCA2", "BRCA2 DNA repair associated"],
          ],
        ]),
      ),
    );

    const result = await searchGenes("BRCA", "hg38");

    expect(result.results).toEqual([
      {
        symbol: "BRCA1",
        name: "BRCA1 DNA repair associated",
        chrom: "chr17",
        description: "BRCA1 DNA repair associated",
        gene_id: "672",
      },
      {
        symbol: "BRCA2",
        name: "BRCA2 DNA repair associated",
        chrom: "chr13",
        description: "BRCA2 DNA repair associated",
        gene_id: "675",
      },
    ]);
  });

  it("prioritizes an exact symbol match", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          2,
          ["123", "456"],
          {
            GeneID: ["672", "675"],
          },
          [
            ["17", "BRCA2", "BRCA2 DNA repair associated"],
            ["17", "BRCA1", "BRCA1 DNA repair associated"],
          ],
        ]),
      ),
    );

    const result = await searchGenes("BRCA1", "hg38");

    expect(result.results[0]?.symbol).toBe("BRCA1");
  });

  it("returns an empty result when no genes are found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          0,
          [],
          null,
          [],
        ]),
      ),
    );

    const result = await searchGenes("XYZ", "hg38");

    expect(result.results).toEqual([]);
  });
});