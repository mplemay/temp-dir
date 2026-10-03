import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getMarketEvent } from "@/lib/browse/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/market-intelligence/$eventId")({
  loader: async ({ params }) => {
    const event = await getMarketEvent({ data: { eventId: params.eventId } });
    if (!event) {
      throw notFound();
    }
    return event;
  },
  component: MarketEventPage,
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.headline} · Market Intelligence` : "Sales Copilot" },
    ],
  }),
});

function MarketEventPage() {
  const event = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground">{event.event_date}</p>
        <h1 className="font-heading text-2xl font-medium">{event.headline}</h1>
        <Badge variant="secondary">{event.tumor_type}</Badge>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-medium">Why now</h2>
        <p>{event.why_now}</p>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-medium">Relevant tests</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {event.assays.map((assay) => (
              <TableRow key={assay.test_id}>
                <TableCell>
                  <Link
                    to="/product-knowledge/$testId"
                    params={{ testId: assay.test_id }}
                    className="underline-offset-4 hover:underline"
                  >
                    {assay.display_name}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
