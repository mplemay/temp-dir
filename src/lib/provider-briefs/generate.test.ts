import { describe, expect, it } from "vite-plus/test";
import type { AcceptedNote } from "../crm-notes/schema";
import type { AcceptedProvider } from "../market-intelligence/schema";
import { assayDocumentSchema } from "../product-knowledge/schema";
import { validAssayInput } from "../product-knowledge/schema.test";
import type { RankedProviderView } from "../ranked-providers/load";
import { validRankedRow } from "../ranked-providers/schema.test";
import { generateBriefsArtifact, type StructuredParseClient } from "./generate";

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

const retainNote: AcceptedNote = {
  note_id: "avery-chen-liquid-progression",
  npi: "1600000001",
  note_date: "2026-08-14",
  channel: "in_person",
  body: "Already sends tissue to Tempus. Asked about adding liquid at progression.",
};

function fakeClient(
  overrides: Record<string, { meeting_script: string; objection_response: string }> = {},
): StructuredParseClient {
  return {
    async parseJson<T>({ schemaName, schema }: Parameters<StructuredParseClient["parseJson"]>[0]) {
      if (schemaName !== "provider_briefs") {
        throw new Error(`unexpected schema ${schemaName}`);
      }
      const defaults: Record<string, { meeting_script: string; objection_response: string }> = {
        "1600000001": {
          meeting_script:
            "Dr. Chen already uses Tempus tissue; the liquid-at-progression ask is the opening.",
          objection_response: "Keep the relationship by following through on pending cases.",
        },
        "1600000004": {
          meeting_script:
            "Dr. Chen wants a thoracic liquid option if we can speak to turnaround versus Guardant.",
          objection_response:
            "Tempus xF results are typically expected in 6 days after specimen receipt.",
        },
      };
      return schema.parse({
        briefs: Object.entries(defaults).map(([npi, value]) => ({
          npi,
          ...value,
          ...overrides[npi],
        })),
      }) as T;
    },
  };
}

describe("generateBriefsArtifact", () => {
  const quinn = ranked({
    rank: 1,
    npi: "1600000004",
    full_name: "Quinn Chen",
    incumbent_lab: "Guardant",
    concern: "Concerned about turnaround time versus Guardant liquid.",
    interest: "A thoracic liquid option if the turnaround-time concern can be addressed.",
    why_now: "Guardant incumbent plus a liquid-at-progression hook.",
    has_crm: true,
  });
  const avery = ranked({
    rank: 2,
    npi: "1600000001",
    concern: "",
    interest: "",
    has_crm: false,
  });
  const quinnProvider = provider({
    npi: "1600000004",
    full_name: "Quinn Chen",
    incumbent_lab: "Guardant",
  });

  it("produces one brief per ranked NPI", async () => {
    const artifact = await generateBriefsArtifact({
      ranked: [avery, quinn],
      providers: [provider(), quinnProvider],
      notes: [retainNote],
      assays: [assayDocumentSchema.parse(validAssayInput)],
      client: fakeClient(),
      now: new Date("2026-10-02T17:00:00.000Z"),
    });
    expect(artifact.model).toBe("gpt-6-luna");
    expect(artifact.reasoning_effort).toBe("medium");
    expect(artifact.briefs.map((row) => row.npi)).toEqual(["1600000004", "1600000001"]);
    expect(artifact.briefs.every((row) => row.meeting_script.trim().length > 0)).toBe(true);
  });

  it("forces empty objection when concern is empty even if the client returns copy", async () => {
    const artifact = await generateBriefsArtifact({
      ranked: [avery, quinn],
      providers: [provider(), quinnProvider],
      notes: [],
      assays: [assayDocumentSchema.parse(validAssayInput)],
      client: fakeClient(),
    });
    const averyBrief = artifact.briefs.find((row) => row.npi === "1600000001");
    expect(averyBrief?.objection_response).toBe("");
  });

  it("forces empty objection when ranked concern is a no-concern placeholder", async () => {
    const artifact = await generateBriefsArtifact({
      ranked: [
        ranked({
          ...avery,
          concern: "No lab preference or switching intent stated.",
        }),
        quinn,
      ],
      providers: [provider(), quinnProvider],
      notes: [],
      assays: [assayDocumentSchema.parse(validAssayInput)],
      client: fakeClient(),
    });
    const averyBrief = artifact.briefs.find((row) => row.npi === "1600000001");
    expect(averyBrief?.objection_response).toBe("");
  });

  it("aborts when concern is non-empty and the client returns an empty objection", async () => {
    await expect(
      generateBriefsArtifact({
        ranked: [avery, quinn],
        providers: [provider(), quinnProvider],
        notes: [],
        assays: [assayDocumentSchema.parse(validAssayInput)],
        client: fakeClient({
          "1600000004": {
            meeting_script: "Dr. Chen wants a thoracic liquid option versus Guardant.",
            objection_response: "",
          },
        }),
      }),
    ).rejects.toThrow(/omitted objection/);
  });

  it("aborts when copy invents a TAT not in the packet", async () => {
    await expect(
      generateBriefsArtifact({
        ranked: [avery, quinn],
        providers: [provider(), quinnProvider],
        notes: [],
        assays: [assayDocumentSchema.parse(validAssayInput)],
        client: fakeClient({
          "1600000004": {
            meeting_script: "Dr. Chen wants a thoracic liquid option versus Guardant.",
            objection_response: "We can beat Guardant with a 4-day turnaround.",
          },
        }),
      }),
    ).rejects.toThrow(/turnaround-time/);
  });

  it("accepts Quinn-style copy that cites a packet TAT", async () => {
    const artifact = await generateBriefsArtifact({
      ranked: [avery, quinn],
      providers: [provider(), quinnProvider],
      notes: [],
      assays: [assayDocumentSchema.parse(validAssayInput)],
      client: fakeClient(),
    });
    const quinnBrief = artifact.briefs.find((row) => row.npi === "1600000004");
    expect(quinnBrief?.objection_response).toMatch(/6 days/);
  });
});
