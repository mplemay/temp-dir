import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import type { AcceptedProvider } from "../market-intelligence/schema";
import type { RankedProviderView } from "../ranked-providers/load";
import { validRankedRow } from "../ranked-providers/schema.test";
import { BriefCoverageError, loadProviderBriefs, MissingFixtureError } from "./load";
import { validBriefRow, validBriefsArtifact } from "./schema.test";

function provider(overrides: Partial<AcceptedProvider> = {}): AcceptedProvider {
  return {
    npi: "1600000001",
    full_name: "Avery Chen",
    specialty: "Medical Oncology",
    org_name: "Northwestern Memorial Hospital",
    org_type: "academic",
    health_system: "Northwestern Medicine",
    city: "Chicago",
    state: "IL",
    primary_tumor_focus: "NSCLC",
    est_new_cancer_patients_annual: 150,
    est_advanced_solid_tumor_annual: 83,
    est_ngs_testing_rate: 0.9,
    incumbent_lab: "Tempus",
    tempus_orders_t12m: 29,
    volume_basis: "practice_type_model",
    volume_confidence: "high",
    reserved_for_crm: true,
    tempus_share: 0.35,
    opportunity_patients: 54,
    matched_events: [],
    ...overrides,
  };
}

function ranked(overrides: Partial<RankedProviderView> = {}): RankedProviderView {
  const base = provider();
  return {
    ...validRankedRow,
    full_name: base.full_name,
    org_name: base.org_name,
    primary_tumor_focus: base.primary_tumor_focus,
    incumbent_lab: base.incumbent_lab,
    opportunity_patients: base.opportunity_patients,
    ...overrides,
  } as RankedProviderView;
}

function writeArtifact(data: unknown): string {
  const directory = mkdtempSync(join(tmpdir(), "provider-briefs-"));
  const path = join(directory, "briefs.json");
  writeFileSync(path, JSON.stringify(data));
  return path;
}

describe("loadProviderBriefs", () => {
  it("loads inline valid JSON joined to inline ranked providers", () => {
    const secondBrief = {
      ...validBriefRow,
      npi: "1600000002",
      meeting_script: "Pitch HER2-low therapy sequencing for this FMI account.",
      objection_response: "",
    };
    const path = writeArtifact({
      ...validBriefsArtifact,
      briefs: [secondBrief, { ...validBriefRow, npi: "1600000001", objection_response: "" }],
    });
    const loaded = loadProviderBriefs({
      artifactPath: path,
      ranked: [
        ranked(),
        ranked({
          rank: 2,
          npi: "1600000002",
          full_name: "Jordan Chen",
          has_crm: true,
        }),
      ],
      providers: [provider(), provider({ npi: "1600000002", full_name: "Jordan Chen" })],
      notes: [],
      assays: [],
    });
    expect(loaded.briefs.map((row) => row.npi)).toEqual(["1600000001", "1600000002"]);
    expect(loaded.briefs[0]?.full_name).toBe("Avery Chen");
    expect(loaded.briefs[0]?.specialty).toBe("Medical Oncology");
    expect(loaded.briefs[0]?.city).toBe("Chicago");
    expect(loaded.briefs[0]?.impact_score).toBe(120.5);
    expect(loaded.briefs[1]?.meeting_script).toMatch(/HER2-low/);
  });

  it("throws when the artifact path is missing", () => {
    expect(() =>
      loadProviderBriefs({
        artifactPath: join(tmpdir(), "missing-briefs.json"),
        ranked: [ranked()],
        providers: [provider()],
        notes: [],
        assays: [],
      }),
    ).toThrow(MissingFixtureError);
  });

  it("throws when a brief NPI is absent from the ranked list", () => {
    const path = writeArtifact(validBriefsArtifact);
    expect(() =>
      loadProviderBriefs({
        artifactPath: path,
        ranked: [ranked({ npi: "1600000001" })],
        providers: [provider()],
        notes: [],
        assays: [],
      }),
    ).toThrow(BriefCoverageError);
  });

  it("throws when a ranked NPI is missing from briefs", () => {
    const path = writeArtifact(validBriefsArtifact);
    expect(() =>
      loadProviderBriefs({
        artifactPath: path,
        ranked: [ranked({ npi: "1600000004" }), ranked({ npi: "1600000001", rank: 2 })],
        providers: [provider({ npi: "1600000004" }), provider()],
        notes: [],
        assays: [],
      }),
    ).toThrow(BriefCoverageError);
  });

  it("succeeds with OPENAI_API_KEY unset", () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const path = writeArtifact({
        ...validBriefsArtifact,
        briefs: [{ ...validBriefRow, npi: "1600000001", objection_response: "" }],
      });
      const loaded = loadProviderBriefs({
        artifactPath: path,
        ranked: [ranked()],
        providers: [provider()],
        notes: [],
        assays: [],
      });
      expect(loaded.briefs).toHaveLength(1);
    } finally {
      if (previous === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = previous;
      }
    }
  });
});

describe("load.ts runtime isolation", () => {
  it("does not import openai", async () => {
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync(new URL("./load.ts", import.meta.url), "utf8"),
    );
    expect(source).not.toMatch(/openai/);
  });
});
