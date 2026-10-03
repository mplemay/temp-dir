import { describe, expect, it } from "vite-plus/test";
import { noteRowSchema } from "./schema";

export const validNoteRow = {
  note_id: "quinn-chen-tat",
  npi: "1600000004",
  note_date: "2026-09-12",
  channel: "in_person" as const,
  body: "Dr. Quinn Chen is concerned about turnaround time versus Guardant liquid.",
};

describe("noteRowSchema", () => {
  it("accepts a valid note fixture row", () => {
    const result = noteRowSchema.safeParse(validNoteRow);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.note_id).toBe("quinn-chen-tat");
      expect(result.data.npi).toBe("1600000004");
      expect(result.data.note_date).toBe("2026-09-12");
      expect(result.data.channel).toBe("in_person");
      expect(result.data.body).toContain("turnaround time");
    }
  });

  it("rejects a missing note_id", () => {
    const { note_id: _noteId, ...withoutId } = validNoteRow;
    const result = noteRowSchema.safeParse(withoutId);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("note_id");
    }
  });

  it("rejects an empty note_id", () => {
    const result = noteRowSchema.safeParse({ ...validNoteRow, note_id: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("note_id");
    }
  });

  it("rejects an invalid channel", () => {
    const result = noteRowSchema.safeParse({ ...validNoteRow, channel: "sms" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("channel");
    }
  });

  it("rejects an invalid NPI", () => {
    const result = noteRowSchema.safeParse({ ...validNoteRow, npi: "123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("npi");
    }
  });

  it("rejects an empty body", () => {
    const empty = noteRowSchema.safeParse({ ...validNoteRow, body: "" });
    const whitespace = noteRowSchema.safeParse({ ...validNoteRow, body: "   " });
    expect(empty.success).toBe(false);
    expect(whitespace.success).toBe(false);
    if (!empty.success) {
      expect(empty.error.issues[0]?.path).toContain("body");
    }
  });

  it("rejects a note_date that is not YYYY-MM-DD", () => {
    const result = noteRowSchema.safeParse({ ...validNoteRow, note_date: "09/12/2026" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("note_date");
    }
  });
});
