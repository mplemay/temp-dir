import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import type { AcceptedProvider } from "../market-intelligence/schema";
import { loadRankedProviders, MissingFixtureError, RankCoverageError } from "./load";
import { validArtifact, validRankedRow } from "./schema.test";

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

function writeArtifact(data: unknown): string {
  const directory = mkdtempSync(join(tmpdir(), "ranked-providers-"));
  const path = join(directory, "list.json");
  writeFileSync(path, JSON.stringify(data));
  return path;
}

describe("loadRankedProviders", () => {
  it("loads inline valid JSON joined to accepted providers in rank order", () => {
    const second = {
      ...validRankedRow,
      rank: 2,
      npi: "1600000002",
      why_now: "HER2-low therapy decisions are a switch hook.",
    };
    const path = writeArtifact({
      ...validArtifact,
      providers: [second, validRankedRow],
    });
    const loaded = loadRankedProviders({
      artifactPath: path,
      providers: [provider(), provider({ npi: "1600000002", full_name: "Jordan Chen" })],
    });
    expect(loaded.providers.map((row) => row.npi)).toEqual(["1600000001", "1600000002"]);
    expect(loaded.providers[0]?.full_name).toBe("Avery Chen");
    expect(loaded.providers[0]?.org_name).toBe("Northwestern Memorial Hospital");
    expect(loaded.providers[0]?.opportunity_patients).toBe(54);
  });

  it("throws when the artifact path is missing", () => {
    expect(() =>
      loadRankedProviders({
        artifactPath: join(tmpdir(), "missing-ranked-list.json"),
        providers: [provider()],
      }),
    ).toThrow(MissingFixtureError);
  });

  it("throws when a ranked NPI is absent from accepted providers", () => {
    const path = writeArtifact(validArtifact);
    expect(() =>
      loadRankedProviders({
        artifactPath: path,
        providers: [provider({ npi: "1699999999" })],
      }),
    ).toThrow(RankCoverageError);
  });

  it("succeeds with OPENAI_API_KEY unset", () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const path = writeArtifact(validArtifact);
      const loaded = loadRankedProviders({
        artifactPath: path,
        providers: [provider()],
      });
      expect(loaded.providers).toHaveLength(1);
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
