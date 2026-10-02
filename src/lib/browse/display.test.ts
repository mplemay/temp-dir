import { describe, expect, it } from "vite-plus/test";
import { notesWithClinicianNames } from "./display";

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
