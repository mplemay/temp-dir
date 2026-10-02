import { describe, expect, it } from "vite-plus/test";
import { assayDocumentSchema } from "./schema";

export const validAssayInput = {
  test_id: "xf",
  display_name: "Tempus xF",
  aliases: ["xF", "xF/xF+"],
  specimen: "liquid",
  regulatory_status: "ldt",
  gene_count: 105,
  tat_days: 6,
  tat_qualifier: "typically_expected",
  source_url: "https://www.tempus.com/solutions/xf/",
  retrieved_on: "2026-10-02",
  body: "Public Tempus site claim: xF is a 105-gene liquid biopsy with results typically expected in about 6 days after specimen receipt.",
};

describe("assayDocumentSchema", () => {
  it("accepts a valid assay with tat_days 6", () => {
    const result = assayDocumentSchema.safeParse(validAssayInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tat_days).toBe(6);
      expect(result.data.gene_count).toBe(105);
    }
  });

  it("accepts omitted TAT as null with unpublished", () => {
    const { tat_days: _tatDays, ...rest } = validAssayInput;
    const result = assayDocumentSchema.safeParse({
      ...rest,
      tat_qualifier: "unpublished",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tat_days).toBeNull();
    }
  });

  it("rejects a negative gene_count", () => {
    const result = assayDocumentSchema.safeParse({
      ...validAssayInput,
      gene_count: -1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("gene_count");
    }
  });

  it("rejects an invalid regulatory_status", () => {
    const result = assayDocumentSchema.safeParse({
      ...validAssayInput,
      regulatory_status: "research_use",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("regulatory_status");
    }
  });

  it("rejects a missing source_url", () => {
    const { source_url: _sourceUrl, ...rest } = validAssayInput;
    const result = assayDocumentSchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("source_url");
    }
  });

  it("rejects a non-Tempus host", () => {
    const result = assayDocumentSchema.safeParse({
      ...validAssayInput,
      source_url: "https://example.com/xt",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("source_url");
    }
  });

  it("rejects tat_days set with unpublished", () => {
    const result = assayDocumentSchema.safeParse({
      ...validAssayInput,
      tat_days: 6,
      tat_qualifier: "unpublished",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("tat_qualifier");
    }
  });
});
