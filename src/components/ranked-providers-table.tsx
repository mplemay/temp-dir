import { Link } from "@tanstack/react-router";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RankedListRow } from "@/lib/browse/payload";
import {
  ALL_FILTER,
  columnFilterValue,
  matchesProviderSearch,
  uniqueSortedValues,
} from "@/lib/browse/ranked-table";

const EMPTY_ROWS: RankedListRow[] = [];

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    equalsString: filterFn_equalsString,
  },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
});

const helper = createColumnHelper<typeof features, RankedListRow>();

const columns = helper.columns([
  helper.accessor("rank", {
    header: "Rank",
    enableColumnFilter: false,
    sortFn: "alphanumeric",
  }),
  helper.accessor("full_name", {
    header: "Name",
    enableColumnFilter: false,
    cell: (info) => (
      <Link
        to="/providers/$npi"
        params={{ npi: info.row.original.npi }}
        className="underline-offset-4 hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  helper.accessor("org_name", {
    header: "Organization",
    enableColumnFilter: false,
  }),
  helper.accessor("primary_tumor_focus", {
    header: "Tumor focus",
    filterFn: "equalsString",
  }),
  helper.accessor("incumbent_lab", {
    header: "Incumbent",
    filterFn: "equalsString",
    cell: (info) => <Badge variant="secondary">{info.getValue()}</Badge>,
  }),
  helper.accessor("readiness", {
    header: "Readiness",
    filterFn: "equalsString",
    cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
  }),
  helper.accessor("opportunity_patients", {
    header: "Opportunity patients",
    enableColumnFilter: false,
    sortFn: "alphanumeric",
  }),
  helper.accessor("why_now", {
    header: "Why now",
    enableColumnFilter: false,
    enableSorting: false,
    cell: (info) => (
      <span className="max-w-md text-muted-foreground whitespace-normal">{info.getValue()}</span>
    ),
  }),
]);

function FilterSelect({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string;
  options: string[];
  value: string;
  onValueChange: (next: string | null) => void;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label={label} className="w-44">
        <SelectValue placeholder={`All ${label}`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_FILTER}>{`All ${label}`}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RankedProvidersTable({ providers }: { providers: RankedListRow[] }) {
  const data = providers.length > 0 ? providers : EMPTY_ROWS;
  const table = useTable({
    features,
    columns,
    data,
    getRowId: (row) => row.npi,
    initialState: {
      sorting: [{ id: "rank", desc: false }],
    },
    globalFilterFn: (row, _columnId, filterValue) =>
      matchesProviderSearch(row.original, String(filterValue ?? "")),
    getColumnCanGlobalFilter: (column) => column.id === "full_name" || column.id === "org_name",
  });

  const tumorOptions = uniqueSortedValues(data, "primary_tumor_focus");
  const incumbentOptions = uniqueSortedValues(data, "incumbent_lab");
  const readinessOptions = uniqueSortedValues(data, "readiness");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Search providers"
          placeholder="Search name or organization"
          value={String(table.state.globalFilter ?? "")}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <FilterSelect
          label="tumor focus"
          options={tumorOptions}
          value={columnFilterValue(table.getColumn("primary_tumor_focus")?.getFilterValue())}
          onValueChange={(value) =>
            table
              .getColumn("primary_tumor_focus")
              ?.setFilterValue(value && value !== ALL_FILTER ? value : undefined)
          }
        />
        <FilterSelect
          label="incumbent"
          options={incumbentOptions}
          value={columnFilterValue(table.getColumn("incumbent_lab")?.getFilterValue())}
          onValueChange={(value) =>
            table
              .getColumn("incumbent_lab")
              ?.setFilterValue(value && value !== ALL_FILTER ? value : undefined)
          }
        />
        <FilterSelect
          label="readiness"
          options={readinessOptions}
          value={columnFilterValue(table.getColumn("readiness")?.getFilterValue())}
          onValueChange={(value) =>
            table
              .getColumn("readiness")
              ?.setFilterValue(value && value !== ALL_FILTER ? value : undefined)
          }
        />
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-medium"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                        {sorted === "asc" ? " ↑" : sorted === "desc" ? " ↓" : ""}
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={
                    cell.column.id === "why_now" ? "max-w-md whitespace-normal" : undefined
                  }
                >
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
