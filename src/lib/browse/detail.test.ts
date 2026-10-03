import { describe, expect, it } from "vite-plus/test";
import { validNoteRow } from "@/lib/crm-notes/schema.test";
import type { AcceptedEvent } from "@/lib/market-intelligence/schema";
import { assayDocumentSchema } from "@/lib/product-knowledge/schema";
import { validAssayInput } from "@/lib/product-knowledge/schema.test";
import { toAssayPagePayload, toEventPagePayload, toNotePagePayload } from "./detail";

const xf = assayDocumentSchema.parse(validAssayInput);
const xfPlus = assayDocumentSchema.parse({
  ...validAssayInput,
  test_id: "xf-plus",
  display_name: "Tempus xF+",
  aliases: ["xF+", "xF/xF+"],
  gene_count: 523,
  body: "Public Tempus site claim: xF+ is a 523-gene liquid biopsy.",
});

const nsclcLiquid: AcceptedEvent = {
  event_id: "nsclc_liquid",
  tumor_type: "NSCLC",
  event_date: "2024-01-15",
  headline: "ctDNA for EGFR and ALK resistance when tissue is QNS",
  relevant_tests: "xF/xF+",
  why_now: "Progression on TKI or insufficient tissue is a reason to add liquid alongside tissue",
};

describe("toAssayPagePayload", () => {
  it("keeps unpublished TAT null", () => {
    const unpublished = assayDocumentSchema.parse({
      ...validAssayInput,
      test_id: "xt-cdx",
      display_name: "Tempus xT CDx",
      aliases: ["xT CDx"],
      specimen: "tissue",
      regulatory_status: "fda_cdx",
      tat_days: null,
      tat_qualifier: "unpublished",
    });
    const payload = toAssayPagePayload(unpublished);
    expect(payload.tat_days).toBeNull();
    expect(payload.display_name).toBe("Tempus xT CDx");
    expect(payload.body.length).toBeGreaterThan(0);
  });
});

describe("toEventPagePayload", () => {
  it("joins xF/xF+ to both liquid assays without duplicates", () => {
    const payload = toEventPagePayload(nsclcLiquid, [xf, xfPlus]);
    expect(payload.assays.map((assay) => assay.test_id)).toEqual(["xf", "xf-plus"]);
    expect(payload.headline).toContain("ctDNA");
    expect(payload.why_now).toContain("liquid");
  });
});

describe("toNotePagePayload", () => {
  const followUp = {
    ...validNoteRow,
    note_id: "quinn-chen-followup",
    note_date: "2026-09-20",
    channel: "call" as const,
    body: "Still comparing Guardant liquid on turnaround.",
  };
  const otherClinician = {
    ...validNoteRow,
    note_id: "avery-chen-liquid-progression",
    npi: "1600000001",
    note_date: "2026-08-14",
    body: "Already orders Tempus tissue.",
  };

  it("attaches the clinician name and sibling notes excluding the current id", () => {
    const payload = toNotePagePayload(
      validNoteRow,
      [followUp, validNoteRow, otherClinician],
      [{ npi: "1600000004", full_name: "Quinn Chen" }],
    );
    expect(payload.clinician_name).toBe("Quinn Chen");
    expect(payload.siblings).toEqual([
      {
        note_id: "quinn-chen-followup",
        note_date: "2026-09-20",
        body: "Still comparing Guardant liquid on turnaround.",
      },
    ]);
  });

  it("orders siblings by newest date first", () => {
    const earlier = { ...followUp, note_id: "quinn-chen-earlier", note_date: "2026-09-10" };
    const later = { ...followUp, note_id: "quinn-chen-later", note_date: "2026-09-22" };
    const payload = toNotePagePayload(validNoteRow, [earlier, later, validNoteRow], []);
    expect(payload.siblings.map((note) => note.note_id)).toEqual([
      "quinn-chen-later",
      "quinn-chen-earlier",
    ]);
    expect(payload.clinician_name).toBeNull();
  });
});
