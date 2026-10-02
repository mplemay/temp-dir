import { describe, expect, it } from "vite-plus/test";
import { loadMarketIntelligence, MissingFixtureError, parseMarketIntelligence } from "./load";

const providerHeader = [
  "npi",
  "full_name",
  "specialty",
  "org_name",
  "org_type",
  "health_system",
  "city",
  "state",
  "primary_tumor_focus",
  "est_new_cancer_patients_annual",
  "est_advanced_solid_tumor_annual",
  "est_ngs_testing_rate",
  "incumbent_lab",
  "tempus_orders_t12m",
  "volume_basis",
  "volume_confidence",
  "reserved_for_crm",
];

const eventHeader = [
  "event_id",
  "tumor_type",
  "event_date",
  "headline",
  "relevant_tests",
  "why_now",
];

function csv(header: string[], rows: string[][]): string {
  return [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

function providerRow(
  overrides: {
    npi?: string;
    full_name?: string;
    specialty?: string;
    tumor?: string;
    eligible?: string;
    orders?: string;
    rate?: string;
    incumbent?: string;
    extra?: string[];
  } = {},
): string[] {
  return [
    overrides.npi ?? "1000000001",
    overrides.full_name ?? "Avery Chen",
    overrides.specialty ?? "Hematology/Oncology",
    "Illinois Cancer Specialists",
    "independent_practice",
    "Independent",
    "Arlington Heights",
    "IL",
    overrides.tumor ?? "mixed",
    "320",
    overrides.eligible ?? "200",
    overrides.rate ?? "0.55",
    overrides.incumbent ?? "FMI",
    overrides.orders ?? "40",
    "practice_type_model",
    "medium",
    "false",
    ...(overrides.extra ?? []),
  ];
}

const nsclcEvent = [
  "nsclc_liquid",
  "NSCLC",
  "2024-01-15",
  "ctDNA for EGFR and ALK resistance when tissue is QNS",
  "xF/xF+",
  "Progression on TKI; liquid can catch unique actionable variants",
];

const crcEvent = [
  "crc_xt_cdx",
  "CRC",
  "2024-04-26",
  "xT CDx companion diagnostic claims for colorectal cancer",
  "xT CDx",
  "FDA CDx indication rather than LDT-only profiling",
];

describe("parseMarketIntelligence", () => {
  it("loads inline valid CSVs", () => {
    const result = parseMarketIntelligence(
      csv(providerHeader, [providerRow()]),
      csv(eventHeader, [nsclcEvent, crcEvent]),
    );
    expect(result.report.acceptedProviders).toBe(1);
    expect(result.report.acceptedEvents).toBe(2);
    expect(result.providers[0]?.tempus_share).toBe(0.2);
    expect(result.providers[0]?.opportunity_patients).toBe(160);
    expect(result.providers[0]?.matched_events).toHaveLength(2);
  });

  it("skips bad specialty and out-of-range rate while keeping valid rows", () => {
    const result = parseMarketIntelligence(
      csv(providerHeader, [
        providerRow({ npi: "1000000001" }),
        providerRow({ npi: "1000000002", specialty: "Dermatology" }),
        providerRow({ npi: "1000000003", rate: "1.4" }),
      ]),
      csv(eventHeader, [crcEvent]),
    );
    expect(result.report.acceptedProviders).toBe(1);
    expect(result.providers.map((row) => row.npi)).toEqual(["1000000001"]);
    expect(result.report.skipped.some((skip) => skip.reason.includes("specialty"))).toBe(true);
    expect(result.report.skipped.some((skip) => skip.reason.includes("est_ngs_testing_rate"))).toBe(
      true,
    );
  });

  it("skips a duplicate NPI after the first valid row", () => {
    const result = parseMarketIntelligence(
      csv(providerHeader, [
        providerRow({ npi: "1000000001", full_name: "First" }),
        providerRow({ npi: "1000000001", full_name: "Second" }),
      ]),
      csv(eventHeader, [crcEvent]),
    );
    expect(result.report.acceptedProviders).toBe(1);
    expect(result.providers[0]?.full_name).toBe("First");
    expect(result.report.skipped).toEqual([
      expect.objectContaining({ reason: "npi: duplicate", line: 3 }),
    ]);
  });

  it("matches NSCLC events only for NSCLC providers and all events for mixed", () => {
    const result = parseMarketIntelligence(
      csv(providerHeader, [
        providerRow({ npi: "1000000001", tumor: "NSCLC", full_name: "Lung Doc" }),
        providerRow({ npi: "1000000002", tumor: "mixed", full_name: "Generalist" }),
      ]),
      csv(eventHeader, [nsclcEvent, crcEvent]),
    );
    const nsclc = result.providers.find((row) => row.npi === "1000000001");
    const mixed = result.providers.find((row) => row.npi === "1000000002");
    expect(nsclc?.matched_events.map((event) => event.event_id)).toEqual(["nsclc_liquid"]);
    expect(mixed?.matched_events.map((event) => event.event_id)).toEqual([
      "nsclc_liquid",
      "crc_xt_cdx",
    ]);
  });

  it("ignores a rank column when computing share", () => {
    const result = parseMarketIntelligence(
      csv([...providerHeader, "rank"], [providerRow({ extra: ["1"] })]),
      csv(eventHeader, [crcEvent]),
    );
    expect(result.providers[0]?.tempus_share).toBe(0.2);
    expect(result.providers[0]?.opportunity_patients).toBe(160);
  });
});

describe("loadMarketIntelligence", () => {
  it("throws when a fixture path is missing", () => {
    expect(() =>
      loadMarketIntelligence({
        providers: "/tmp/market-intelligence-missing-providers.csv",
        events: "/tmp/market-intelligence-missing-events.csv",
      }),
    ).toThrow(MissingFixtureError);
  });
});
