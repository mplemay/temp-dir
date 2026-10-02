import { createFileRoute } from "@tanstack/react-router";
import { getProductKnowledge } from "@/lib/browse/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/product-knowledge")({
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
      <div className="grid gap-4 md:grid-cols-2">
        {assays.map((assay) => (
          <Card key={assay.test_id}>
            <CardHeader>
              <CardTitle>{assay.display_name}</CardTitle>
              <CardDescription className="flex flex-wrap gap-2">
                <Badge variant="secondary">{assay.specimen}</Badge>
                <Badge variant="outline">{formatStatus(assay.regulatory_status)}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {assay.tat_days === null ? (
                <p className="text-muted-foreground">Turnaround unpublished</p>
              ) : (
                <p>Turnaround {assay.tat_days} days</p>
              )}
              {assay.gene_count === null ? (
                <p className="text-muted-foreground">Gene count unpublished</p>
              ) : (
                <p>Gene count {assay.gene_count}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
