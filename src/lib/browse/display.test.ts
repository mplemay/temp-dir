import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { notesWithClinicianNames, unpublishedMetric } from "./display";

describe("notesWithClinicianNames", () => {
  it("attaches the clinician name when the NPI matches a provider", () => {
    const notes = [
      {
        note_id: "quinn-chen-tat",
        npi: "1600000004",
        note_date: "2026-09-12",
        channel: "in_person" as const,
        body: "Asked about liquid at progression.",
      },
    ];

    const result = notesWithClinicianNames(notes, [{ npi: "1600000004", full_name: "Quinn Chen" }]);

    expect(result).toEqual([
      {
        note_id: "quinn-chen-tat",
        npi: "1600000004",
        note_date: "2026-09-12",
        channel: "in_person",
        body: "Asked about liquid at progression.",
        clinician_name: "Quinn Chen",
      },
    ]);
  });

  it("keeps the note body when the NPI has no matching provider", () => {
    const notes = [
      {
        note_id: "unknown-npi-note",
        npi: "1699999999",
        note_date: "2026-09-12",
        channel: "call" as const,
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
  it("lists market intelligence providers as brief links and events in a table", () => {
    const source = readFileSync(
      new URL("../../routes/market-intelligence/index.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch("@/components/ui/card");
    expect(source).toMatch("/providers/$npi");
    expect(source).toMatch("/market-intelligence/$eventId");
    expect(source).toMatch("@/components/ui/table");
  });

  it("lists product knowledge assays in a table", () => {
    const source = readFileSync(
      new URL("../../routes/product-knowledge/index.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch("@/components/ui/card");
    expect(source).toMatch("/product-knowledge/$testId");
    expect(source).toMatch("unpublishedMetric");
  });

  it("lists CRM notes in a table with clinician name", () => {
    const source = readFileSync(new URL("../../routes/crm/index.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch("@/components/ui/card");
    expect(source).toMatch("clinician_name");
    expect(source).toMatch("/crm/$noteId");
    expect(source).toMatch("@/components/ui/table");
  });

  it("composes feed detail pages from table and badge primitives", () => {
    const assay = readFileSync(
      new URL("../../routes/product-knowledge/$testId.tsx", import.meta.url),
      "utf8",
    );
    const event = readFileSync(
      new URL("../../routes/market-intelligence/$eventId.tsx", import.meta.url),
      "utf8",
    );
    const note = readFileSync(new URL("../../routes/crm/$noteId.tsx", import.meta.url), "utf8");
    for (const source of [assay, event, note]) {
      expect(source).not.toMatch("@/components/ui/card");
      expect(source).toMatch("@/components/ui/badge");
      expect(source).toMatch("@/components/ui/table");
    }
  });
});
