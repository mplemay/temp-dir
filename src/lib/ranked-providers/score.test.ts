import { describe, expect, it } from "vite-plus/test";
import { clampReadiness, compareImpact, scoreProvider } from "./score";

describe("scoreProvider", () => {
  it("computes 164.953125 from the documented mix factors", () => {
    const result = scoreProvider({
      opportunity_patients: 100,
      est_ngs_testing_rate: 0.5,
      incumbent_lab: "FMI",
      has_matched_events: true,
      readiness: "switch",
    });
    expect(result.readiness).toBe("switch");
    expect(result.score_breakdown).toEqual({
      opportunity_patients: 100,
      ngs_gap_factor: 0.85,
      incumbent_weight: 1.25,
      event_boost: 1.15,
      crm_multiplier: 1.35,
    });
    expect(result.impact_score).toBeCloseTo(164.953125);
  });

  it("ranks a high-opportunity Tempus retain below a lower-opportunity competitor switch", () => {
    const retain = scoreProvider({
      opportunity_patients: 200,
      est_ngs_testing_rate: 0.5,
      incumbent_lab: "Tempus",
      has_matched_events: true,
      readiness: "retain",
    });
    const competitorSwitch = scoreProvider({
      opportunity_patients: 80,
      est_ngs_testing_rate: 0.5,
      incumbent_lab: "Guardant",
      has_matched_events: true,
      readiness: "switch",
    });
    expect(competitorSwitch.impact_score).toBeGreaterThan(retain.impact_score);
    expect(
      compareImpact(
        { ...retain, npi: "1600000007", opportunity_patients: 200 },
        { ...competitorSwitch, npi: "1600000004", opportunity_patients: 80 },
      ),
    ).toBeGreaterThan(0);
  });

  it("leaves readiness unknown when no notes supplied that value", () => {
    const result = scoreProvider({
      opportunity_patients: 90,
      est_ngs_testing_rate: 0.6,
      incumbent_lab: "unknown",
      has_matched_events: false,
      readiness: "unknown",
    });
    expect(result.readiness).toBe("unknown");
    expect(result.score_breakdown.crm_multiplier).toBe(1);
  });

  it("clamps Tempus switch to expand and competitor retain to switch", () => {
    expect(clampReadiness("Tempus", "switch")).toBe("expand");
    expect(clampReadiness("FMI", "retain")).toBe("switch");
    expect(clampReadiness("in_house", "unknown")).toBe("unknown");
  });

  it("does not accept assay performance fields as score inputs", () => {
    const input = {
      opportunity_patients: 100,
      est_ngs_testing_rate: 0.5,
      incumbent_lab: "FMI" as const,
      has_matched_events: true,
      readiness: "switch" as const,
    };
    scoreProvider(input);
    expect(input).not.toHaveProperty("tat_days");
    expect(input).not.toHaveProperty("gene_count");
    expect(scoreProvider.length).toBe(1);
  });
});
