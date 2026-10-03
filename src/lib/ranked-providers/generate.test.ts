import { describe, expect, it } from "vite-plus/test";
import type { AcceptedNote } from "../crm-notes/schema";
import type { AcceptedProvider } from "../market-intelligence/schema";
import { assayDocumentSchema } from "../product-knowledge/schema";
import { validAssayInput } from "../product-knowledge/schema.test";
import { generateRankedArtifact, type StructuredParseClient } from "./generate";

function provider(overrides: Partial<AcceptedProvider> = {}): AcceptedProvider {
  return {
    npi: "1600000007",
    full_name: "Harper Chen",
    specialty: "Hematology/Oncology",
    org_name: "Ascension Saint Joseph",
    org_type: "community_hospital",
    health_system: "Ascension",
    city: "Chicago",
    state: "IL",
    primary_tumor_focus: "mixed",
    est_new_cancer_patients_annual: 328,
    est_advanced_solid_tumor_annual: 180,
    est_ngs_testing_rate: 0.56,
    incumbent_lab: "Tempus",
    tempus_orders_t12m: 63,
    volume_basis: "practice_type_model",
    volume_confidence: "high",
    reserved_for_crm: true,
    tempus_share: 0.35,
    opportunity_patients: 117,
    matched_events: [
      {
        event_id: "nsclc_liquid",
        tumor_type: "NSCLC",
        event_date: "2024-01-15",
        headline: "ctDNA for EGFR and ALK resistance when tissue is QNS",
        relevant_tests: "xF/xF+",
        why_now: "Progression on TKI or insufficient tissue",
      },
    ],
    ...overrides,
  };
}

const retainNote: AcceptedNote = {
  note_id: "harper-chen-ops",
  npi: "1600000007",
  note_date: "2026-09-22",
  channel: "in_person",
  body: "Already orders a lot of Tempus. Wanted operational follow-through rather than a new assay pitch.",
};

const switchNote: AcceptedNote = {
  note_id: "quinn-chen-tat",
  npi: "1600000004",
  note_date: "2026-09-04",
  channel: "in_person",
  body: "Concerned about turnaround time versus Guardant liquid. Interested in a thoracic liquid option.",
};

function fakeClient(): StructuredParseClient {
  return {
    async parseJson<T>({ schemaName, schema }: Parameters<StructuredParseClient["parseJson"]>[0]) {
      if (schemaName === "crm_signals") {
        return schema.parse({
          signals: [
            {
              npi: "1600000007",
              readiness: "retain",
              concern: "pending case follow-through",
              interest: "operations not a new assay",
            },
            {
              npi: "1600000004",
              readiness: "switch",
              concern: "turnaround time versus Guardant",
              interest: "thoracic liquid",
            },
          ],
        }) as T;
      }
      if (schemaName === "why_now") {
        return schema.parse({
          explanations: [
            {
              npi: "1600000007",
              why_now:
                "Keep the account healthy with operational follow-through, not a new assay pitch.",
            },
            {
              npi: "1600000004",
              why_now:
                "Guardant incumbent plus a liquid-at-progression hook makes this a why-now switch call.",
            },
          ],
        }) as T;
      }
      throw new Error(`unexpected schema ${schemaName}`);
    },
  };
}

describe("generateRankedArtifact", () => {
  it("scores then writes why-now without letting explain reorder ranks", async () => {
    const switchProvider = provider({
      npi: "1600000004",
      full_name: "Quinn Chen",
      incumbent_lab: "Guardant",
      opportunity_patients: 84,
      est_ngs_testing_rate: 0.84,
      primary_tumor_focus: "NSCLC",
    });
    const artifact = await generateRankedArtifact({
      providers: [provider(), switchProvider],
      notes: [retainNote, switchNote],
      assays: [assayDocumentSchema.parse(validAssayInput)],
      client: fakeClient(),
      now: new Date("2026-10-02T17:00:00.000Z"),
    });

    expect(artifact.model).toBe("gpt-6-luna");
    expect(artifact.reasoning_effort).toBe("medium");
    expect(artifact.providers.map((row) => row.npi)).toEqual(["1600000004", "1600000007"]);
    expect(artifact.providers[0]?.rank).toBe(1);
    expect(artifact.providers[0]?.why_now).toMatch(/Guardant/i);
    expect(artifact.providers[1]?.why_now).toMatch(/operational/i);
  });

  it("aborts without a partial artifact when extract fails", async () => {
    const client: StructuredParseClient = {
      async parseJson() {
        throw new Error("network down");
      },
    };
    await expect(
      generateRankedArtifact({
        providers: [provider()],
        notes: [retainNote],
        assays: [assayDocumentSchema.parse(validAssayInput)],
        client,
      }),
    ).rejects.toThrow("network down");
  });
});
