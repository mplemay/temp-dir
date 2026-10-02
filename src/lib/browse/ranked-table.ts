import type { RankedListRow } from "./payload";

export const ALL_FILTER = "all";

export type RankedFilterColumn = "primary_tumor_focus" | "incumbent_lab" | "readiness";

export function matchesProviderSearch(
  row: Pick<RankedListRow, "full_name" | "org_name">,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return true;
  }
  return (
    row.full_name.toLowerCase().includes(needle) || row.org_name.toLowerCase().includes(needle)
  );
}

export function matchesExactFilter(value: string, filterValue: string | undefined): boolean {
  if (!filterValue || filterValue === ALL_FILTER) {
    return true;
  }
  return value === filterValue;
}

export function uniqueSortedValues(rows: RankedListRow[], key: RankedFilterColumn): string[] {
  return [...new Set(rows.map((row) => row[key]))].sort((left, right) => left.localeCompare(right));
}

export function columnFilterValue(value: unknown): string {
  if (typeof value !== "string" || value.length === 0) {
    return ALL_FILTER;
  }
  return value;
}
