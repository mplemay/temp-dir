import { describe, expect, it } from "vite-plus/test";
import { assertGroundedWhyNow } from "./grounding";

describe("assertGroundedWhyNow", () => {
  it("accepts grounded copy when published TAT is in the packet", () => {
    expect(() =>
      assertGroundedWhyNow("xF results are typically expected in 6 days after receipt.", {
        tat_days: [6],
        gene_count: [105],
      }),
    ).not.toThrow();
  });

  it("rejects a numeric TAT that is not in the packet", () => {
    expect(() =>
      assertGroundedWhyNow("We can beat Guardant with a 4-day turnaround.", {
        tat_days: [6],
        gene_count: [105],
      }),
    ).toThrow(/turnaround-time/);
  });

  it("rejects a gene-count claim that is not in the packet", () => {
    expect(() =>
      assertGroundedWhyNow("Order the 500-gene panel for this CMO visit.", {
        tat_days: [6],
        gene_count: [105],
      }),
    ).toThrow(/gene-count/);
  });

  it("rejects an invented accuracy percent", () => {
    expect(() =>
      assertGroundedWhyNow("Cite 98% sensitivity versus the incumbent.", {
        tat_days: [],
        gene_count: [],
      }),
    ).toThrow(/accuracy/);
  });
});
