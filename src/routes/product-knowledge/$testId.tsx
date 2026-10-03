import { createFileRoute, notFound } from "@tanstack/react-router";
import { getAssay } from "@/lib/browse/server";
import { unpublishedMetric } from "@/lib/browse/display";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/product-knowledge/$testId")({
  loader: async ({ params }) => {
    const assay = await getAssay({ data: { testId: params.testId } });
    if (!assay) {
      throw notFound();
    }
    return assay;
  },
  component: AssayPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.display_name} · Product Knowledge` : "Sales Copilot" },
    ],
  }),
});

function formatStatus(value: string): string {
  return value.replaceAll("_", " ");
}

function AssayPage() {
  const assay = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-medium">{assay.display_name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{assay.specimen}</Badge>
          <Badge variant="outline">{formatStatus(assay.regulatory_status)}</Badge>
        </div>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Aliases</dt>
        <dd>{assay.aliases.join(", ")}</dd>
        <dt className="text-muted-foreground">Source</dt>
        <dd>
          <a href={assay.source_url} className="underline-offset-4 hover:underline">
            {assay.source_url}
          </a>
        </dd>
        <dt className="text-muted-foreground">Retrieved</dt>
        <dd>{assay.retrieved_on}</dd>
      </dl>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>TAT days</TableHead>
            <TableHead>Gene count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{unpublishedMetric(assay.tat_days)}</TableCell>
            <TableCell>{unpublishedMetric(assay.gene_count)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className="whitespace-pre-wrap">{assay.body}</p>
    </div>
  );
}
