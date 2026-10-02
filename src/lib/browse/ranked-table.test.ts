import { describe, expect, it } from "vite-plus/test";
import { readFileSync } from "node:fs";
import type { RankedListRow } from "./payload";
import {
  ALL_FILTER,
  matchesExactFilter,
  matchesProviderSearch,
  uniqueSortedValues,
} from "./ranked-table";

const rows: RankedListRow[] = [
  {
    rank: 1,
    npi: "1600000001",
    full_name: "Avery Chen",
    org_name: "Northwestern Memorial Hospital",
    primary_tumor_focus: "NSCLC",
    incumbent_lab: "Tempus",
    readiness: "expand",
    opportunity_patients: 54,
    why_now: "Asked about liquid.",
  },
  {
    rank: 2,
    npi: "1600000004",
    full_name: "Quinn Chen",
    org_name: "Rush University Medical Center",
    primary_tumor_focus: "NSCLC",
    incumbent_lab: "Guardant",
    readiness: "switch",
    opportunity_patients: 120,
    why_now: "Liquid at progression.",
  },
];

describe("matchesProviderSearch", () => {
  it("matches a provider name", () => {
    expect(matchesProviderSearch(rows[1]!, "quinn")).toBe(true);
    expect(matchesProviderSearch(rows[1]!, "Avery")).toBe(false);
  });

  it("matches an organization name", () => {
    expect(matchesProviderSearch(rows[0]!, "northwestern")).toBe(true);
  });
});

describe("matchesExactFilter", () => {
  it("keeps matching incumbent rows and treats all as no filter", () => {
    expect(matchesExactFilter("Guardant", "Guardant")).toBe(true);
    expect(matchesExactFilter("Tempus", "Guardant")).toBe(false);
    expect(matchesExactFilter("Tempus", ALL_FILTER)).toBe(true);
    expect(matchesExactFilter("Tempus", undefined)).toBe(true);
  });
});

describe("uniqueSortedValues", () => {
  it("facets incumbent values from the payload", () => {
    expect(uniqueSortedValues(rows, "incumbent_lab")).toEqual(["Guardant", "Tempus"]);
  });
});

describe("ranked table runtime isolation", () => {
  it("does not import openai or node fs loaders from the table helper", () => {
    const source = readFileSync(new URL("./ranked-table.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/openai/);
    expect(source).not.toMatch(/node:fs/);
  });

  it("does not import openai or node fs loaders from the table component", () => {
    const source = readFileSync(
      new URL("../../components/ranked-providers-table.tsx", import.meta.url),
      "utf8",
    );
    expect(source).not.toMatch(/openai/);
    expect(source).not.toMatch(/node:fs/);
    expect(source).toMatch("@/components/ui/table");
    expect(source).toMatch("@/components/ui/badge");
    expect(source).toMatch("@/components/ui/input");
  });

  it("keeps home free of feed overview cards", () => {
    const source = readFileSync(new URL("../../routes/index.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/Market Intelligence/);
    expect(source).not.toMatch(/Product Knowledge/);
    expect(source).not.toMatch(/CRM/);
    expect(source).toMatch("RankedProvidersTable");
  });
});
