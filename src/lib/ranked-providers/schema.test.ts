import { describe, expect, it } from "vite-plus/test";
import { rankedArtifactSchema, rankedRowSchema } from "./schema";

export const validRankedRow = {
  rank: 1,
  npi: "1600000001",
  impact_score: 120.5,
  score_breakdown: {
    opportunity_patients: 54,
    ngs_gap_factor: 0.73,
    incumbent_weight: 0.75,
    event_boost: 1.15,
    crm_multiplier: 1.2,
  },
  readiness: "expand",
  concern: "wants liquid at progression",
  interest: "add liquid biopsy",
  why_now: "Existing Tempus tissue user asked about liquid at progression.",
  has_crm: true,
};

export const validArtifact = {
  generated_at: "2026-10-02T17:00:00.000Z",
  model: "gpt-6-luna",
  reasoning_effort: "medium",
  as_of: "2026-10-02",
  providers: [validRankedRow],
};

describe("rankedArtifactSchema", () => {
  it("accepts a valid artifact", () => {
    const result = rankedArtifactSchema.safeParse(validArtifact);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe("gpt-6-luna");
      expect(result.data.reasoning_effort).toBe("medium");
      expect(result.data.providers[0]?.npi).toBe("1600000001");
    }
  });

  it("rejects an invalid NPI", () => {
    const result = rankedRowSchema.safeParse({ ...validRankedRow, npi: "123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("npi");
    }
  });

  it("rejects readiness outside the allow-list", () => {
    const result = rankedRowSchema.safeParse({ ...validRankedRow, readiness: "maybe" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("readiness");
    }
  });

  it("rejects missing why_now", () => {
    const withoutWhyNow: Record<string, unknown> = { ...validRankedRow };
    delete withoutWhyNow.why_now;
    const result = rankedRowSchema.safeParse(withoutWhyNow);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("why_now"))).toBe(true);
    }
  });
});
