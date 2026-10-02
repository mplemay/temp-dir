import { describe, expect, it } from "vite-plus/test";
import { eventRowSchema, providerRowSchema } from "./schema";

export const validProviderRow = {
  npi: "1000000001",
  full_name: "Avery Chen",
  specialty: "Hematology/Oncology",
  org_name: "Illinois Cancer Specialists",
  org_type: "independent_practice",
  health_system: "Independent",
  city: "Arlington Heights",
  state: "IL",
  primary_tumor_focus: "mixed",
  est_new_cancer_patients_annual: "320",
  est_advanced_solid_tumor_annual: "180",
  est_ngs_testing_rate: "0.55",
  incumbent_lab: "FMI",
  tempus_orders_t12m: "12",
  volume_basis: "practice_type_model",
  volume_confidence: "medium",
  reserved_for_crm: "true",
};

export const validEventRow = {
  event_id: "crc_xt_cdx",
  tumor_type: "CRC",
  event_date: "2024-04-26",
  headline: "xT CDx companion diagnostic claims for colorectal cancer",
  relevant_tests: "xT CDx",
  why_now: "FDA CDx indication, not only LDT profiling",
};

describe("providerRowSchema", () => {
  it("accepts a valid provider fixture row", () => {
    const result = providerRowSchema.safeParse(validProviderRow);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.npi).toBe("1000000001");
      expect(result.data.reserved_for_crm).toBe(true);
      expect(result.data.est_ngs_testing_rate).toBe(0.55);
    }
  });

  it("rejects an invalid NPI", () => {
    const result = providerRowSchema.safeParse({ ...validProviderRow, npi: "123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("npi");
    }
  });

  it("rejects a specialty outside the allow-list", () => {
    const result = providerRowSchema.safeParse({
      ...validProviderRow,
      specialty: "Dermatology",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("specialty");
    }
  });

  it("rejects a disallowed incumbent lab", () => {
    const result = providerRowSchema.safeParse({
      ...validProviderRow,
      incumbent_lab: "Quest",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("incumbent_lab");
    }
  });

  it("rejects unknown volume_confidence", () => {
    const result = providerRowSchema.safeParse({
      ...validProviderRow,
      volume_confidence: "certain",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("volume_confidence");
    }
  });

  it("rejects est_ngs_testing_rate outside 0 through 1", () => {
    const high = providerRowSchema.safeParse({
      ...validProviderRow,
      est_ngs_testing_rate: "1.2",
    });
    const low = providerRowSchema.safeParse({
      ...validProviderRow,
      est_ngs_testing_rate: "-0.1",
    });
    expect(high.success).toBe(false);
    expect(low.success).toBe(false);
  });
});

describe("eventRowSchema", () => {
  it("accepts a valid event fixture row", () => {
    const result = eventRowSchema.safeParse(validEventRow);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tumor_type).toBe("CRC");
    }
  });

  it("rejects mixed as an event tumor type", () => {
    const result = eventRowSchema.safeParse({ ...validEventRow, tumor_type: "mixed" });
    expect(result.success).toBe(false);
  });
});
