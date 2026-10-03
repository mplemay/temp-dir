import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { toBriefPagePayload, toRankedListRow } from "./payload";

describe("toRankedListRow", () => {
  it("includes readiness on the list row", () => {
    const row = toRankedListRow({
      rank: 1,
      npi: "1600000001",
      full_name: "Avery Chen",
      org_name: "Northwestern Memorial Hospital",
      primary_tumor_focus: "NSCLC",
      incumbent_lab: "Tempus",
      readiness: "expand",
      opportunity_patients: 54,
      why_now: "Existing Tempus tissue user asked about liquid at progression.",
    });

    expect(row.readiness).toBe("expand");
    expect(row.npi).toBe("1600000001");
  });
});

describe("toBriefPagePayload", () => {
  it("includes ranked signals and leaves unpublished assay numbers null", () => {
    const payload = toBriefPagePayload({
      npi: "1600000004",
      full_name: "Quinn Chen",
      specialty: "Medical Oncology",
      org_name: "Rush University Medical Center",
      city: "Chicago",
      state: "IL",
      primary_tumor_focus: "NSCLC",
      incumbent_lab: "Guardant",
      rank: 3,
      opportunity_patients: 120,
      why_now: "Liquid at progression.",
      readiness: "switch",
      concern: "turnaround versus Guardant",
      interest: "thoracic liquid option",
      impact_score: 210.4,
      matched_events: [],
      crm_notes: [],
      assays: [
        { test_id: "xf-plus", display_name: "Tempus xF+", tat_days: null, gene_count: null },
      ],
      meeting_script: "Discuss liquid.",
      objection_response: "Six-day TAT.",
    });

    expect(payload.readiness).toBe("switch");
    expect(payload.concern).toBe("turnaround versus Guardant");
    expect(payload.interest).toBe("thoracic liquid option");
    expect(payload.impact_score).toBe(210.4);
    expect(payload.assays[0]?.test_id).toBe("xf-plus");
    expect(payload.assays[0]?.tat_days).toBeNull();
    expect(payload.assays[0]?.gene_count).toBeNull();
  });
});

describe("browse payload runtime isolation", () => {
  it("does not import openai", () => {
    const source = readFileSync(new URL("./payload.ts", import.meta.url), "utf8");
    const server = readFileSync(new URL("./server.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/openai/);
    expect(server).not.toMatch(/openai/);
  });
});
