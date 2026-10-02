import { describe, expect, it } from "vite-plus/test";
import { briefRowSchema, briefsArtifactSchema } from "./schema";

export const validBriefRow = {
  npi: "1600000004",
  meeting_script:
    "Dr. Chen, Guardant is in the seat today, and xF is a thoracic liquid option if we can speak to turnaround.",
  objection_response: "Tempus xF results are typically expected in 6 days after specimen receipt.",
};

export const validBriefsArtifact = {
  generated_at: "2026-10-02T17:00:00.000Z",
  model: "gpt-6-luna",
  reasoning_effort: "medium",
  as_of: "2026-10-02",
  briefs: [validBriefRow],
};

describe("briefsArtifactSchema", () => {
  it("accepts a valid artifact", () => {
    const result = briefsArtifactSchema.safeParse(validBriefsArtifact);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe("gpt-6-luna");
      expect(result.data.reasoning_effort).toBe("medium");
      expect(result.data.briefs[0]?.npi).toBe("1600000004");
    }
  });

  it("rejects an invalid NPI", () => {
    const result = briefRowSchema.safeParse({ ...validBriefRow, npi: "123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("npi");
    }
  });

  it("rejects a missing meeting_script", () => {
    const withoutScript: Record<string, unknown> = { ...validBriefRow };
    delete withoutScript.meeting_script;
    const result = briefRowSchema.safeParse(withoutScript);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("meeting_script"))).toBe(true);
    }
  });

  it("accepts an empty objection_response", () => {
    const result = briefRowSchema.safeParse({ ...validBriefRow, objection_response: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.objection_response).toBe("");
    }
  });
});
