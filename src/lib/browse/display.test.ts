import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { notesWithClinicianNames, unpublishedMetric } from "./display";

describe("notesWithClinicianNames", () => {
  it("attaches the clinician name when the NPI matches a provider", () => {
    const notes = [
      {
        npi: "1600000004",
        note_date: "2026-09-12",
        body: "Asked about liquid at progression.",
      },
    ];

    const result = notesWithClinicianNames(notes, [{ npi: "1600000004", full_name: "Quinn Chen" }]);

    expect(result).toEqual([
      {
        npi: "1600000004",
        note_date: "2026-09-12",
        body: "Asked about liquid at progression.",
        clinician_name: "Quinn Chen",
      },
    ]);
  });

  it("keeps the note body when the NPI has no matching provider", () => {
    const notes = [
      {
        npi: "1699999999",
        note_date: "2026-09-12",
        body: "Unknown NPI still has a body.",
      },
    ];

    const result = notesWithClinicianNames(notes, [{ npi: "1600000004", full_name: "Quinn Chen" }]);

    expect(result[0]?.body).toBe("Unknown NPI still has a body.");
    expect(result[0]?.clinician_name).toBeNull();
  });
});

describe("unpublishedMetric", () => {
  it("does not render a null TAT as a number", () => {
    expect(unpublishedMetric(null)).toBe("");
    expect(unpublishedMetric(6)).toBe("6");
  });
});

describe("browse page composition", () => {
  it("lists market intelligence events in a table without provider brief links", () => {
    const source = readFileSync(
      new URL("../../routes/market-intelligence.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch("@/components/ui/card");
    expect(source).not.toMatch("/providers/$npi");
    expect(source).toMatch("@/components/ui/table");
  });

  it("lists product knowledge assays in a table", () => {
    const source = readFileSync(
      new URL("../../routes/product-knowledge.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch("@/components/ui/card");
    expect(source).toMatch("unpublishedMetric");
  });

  it("lists CRM notes in a table with clinician name", () => {
    const source = readFileSync(new URL("../../routes/crm.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch("@/components/ui/card");
    expect(source).toMatch("clinician_name");
    expect(source).toMatch("@/components/ui/table");
  });
});
