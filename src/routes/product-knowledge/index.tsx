import { createFileRoute, Link } from "@tanstack/react-router";
import { getProductKnowledge } from "@/lib/browse/server";
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

export const Route = createFileRoute("/product-knowledge/")({
  loader: () => getProductKnowledge(),
  component: ProductKnowledgePage,
  head: () => ({
    meta: [{ title: "Product Knowledge" }],
  }),
});

function formatStatus(value: string): string {
  return value.replaceAll("_", " ");
}

function ProductKnowledgePage() {
  const { assays } = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-medium">Product Knowledge</h1>
        <p className="text-muted-foreground">
          Accepted assays from the committed product-knowledge feed.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Assay</TableHead>
            <TableHead>Specimen</TableHead>
            <TableHead>Regulatory status</TableHead>
            <TableHead>TAT days</TableHead>
            <TableHead>Gene count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assays.map((assay) => (
            <TableRow key={assay.test_id}>
              <TableCell className="font-medium">
                <Link
                  to="/product-knowledge/$testId"
                  params={{ testId: assay.test_id }}
                  className="underline-offset-4 hover:underline"
                >
                  {assay.display_name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{assay.specimen}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{formatStatus(assay.regulatory_status)}</Badge>
              </TableCell>
              <TableCell>{unpublishedMetric(assay.tat_days)}</TableCell>
              <TableCell>{unpublishedMetric(assay.gene_count)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
