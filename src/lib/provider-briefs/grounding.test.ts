import { describe, expect, it } from "vite-plus/test";
import { assertGroundedCopy } from "../ranked-providers/grounding";

describe("assertGroundedCopy for briefs", () => {
  it("rejects an objection inventing a TAT number absent from the packet", () => {
    expect(() =>
      assertGroundedCopy(
        "We can beat Guardant with a 4-day turnaround.",
        { tat_days: [6], gene_count: [105] },
        "objection_response",
      ),
    ).toThrow(/turnaround-time/);
  });

  it("accepts an objection that cites a TAT present in the packet", () => {
    expect(() =>
      assertGroundedCopy(
        "Tempus xF results are typically expected in 6 days after specimen receipt.",
        { tat_days: [6], gene_count: [105] },
        "objection_response",
      ),
    ).not.toThrow();
  });
});
