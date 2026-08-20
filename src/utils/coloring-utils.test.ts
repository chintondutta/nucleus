import { describe, expect, it } from "vitest";
import {
  getNucleotideColorClass,
  getClassificationColorClasses,
} from "./coloring-utils";

describe("getNucleotideColorClass", () => {
  it("returns the correct color for each nucleotide", () => {
    expect(getNucleotideColorClass("A")).toBe("text-red-600");
    expect(getNucleotideColorClass("T")).toBe("text-blue-600");
    expect(getNucleotideColorClass("G")).toBe("text-green-600");
    expect(getNucleotideColorClass("C")).toBe("text-amber-600");
  });

  it("handles lowercase nucleotides", () => {
    expect(getNucleotideColorClass("a")).toBe("text-red-600");
    expect(getNucleotideColorClass("t")).toBe("text-blue-600");
    expect(getNucleotideColorClass("g")).toBe("text-green-600");
    expect(getNucleotideColorClass("c")).toBe("text-amber-600");
  });

  it("returns gray for an unknown nucleotide", () => {
    expect(getNucleotideColorClass("X")).toBe("text-gray-500");
  });
});

describe("getClassificationColorClasses", () => {
  it("returns red for pathogenic classification", () => {
    expect(getClassificationColorClasses("Pathogenic")).toBe(
      "bg-red-100 text-red-800"
    );
  });

  it("returns green for benign classification", () => {
    expect(getClassificationColorClasses("Benign")).toBe(
      "bg-green-100 text-green-800"
    );
  });

  it("handles classifications regardless of capitalization", () => {
    expect(getClassificationColorClasses("PATHOGENIC")).toBe(
      "bg-red-100 text-red-800"
    );

    expect(getClassificationColorClasses("BENIGN")).toBe(
      "bg-green-100 text-green-800"
    );
  });

  it("returns yellow for an unknown classification", () => {
    expect(getClassificationColorClasses("Uncertain")).toBe(
      "bg-yellow-100 text-yellow-800"
    );
  });

  it("returns yellow when classification is empty", () => {
    expect(getClassificationColorClasses("")).toBe(
      "bg-yellow-100 text-yellow-800"
    );
  });
});