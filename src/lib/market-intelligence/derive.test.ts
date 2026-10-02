import { describe, expect, it } from "vite-plus/test";
import { deriveOpportunity } from "./derive";

describe("deriveOpportunity", () => {
  it("computes 0.2 share and 160 opportunity from 40 orders and 200 eligible", () => {
    expect(
      deriveOpportunity({
        est_advanced_solid_tumor_annual: 200,
        tempus_orders_t12m: 40,
      }),
    ).toEqual({ tempus_share: 0.2, opportunity_patients: 160 });
  });

  it("returns zero share and opportunity when eligible volume is 0", () => {
    expect(
      deriveOpportunity({
        est_advanced_solid_tumor_annual: 0,
        tempus_orders_t12m: 12,
      }),
    ).toEqual({ tempus_share: 0, opportunity_patients: 0 });
  });
});
