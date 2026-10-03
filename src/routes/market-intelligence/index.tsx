import { createFileRoute, Link } from "@tanstack/react-router";
import { getMarketIntelligence } from "@/lib/browse/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/market-intelligence/")({
  loader: () => getMarketIntelligence(),
  component: MarketIntelligencePage,
  head: () => ({
    meta: [{ title: "Market Intelligence" }],
  }),
});

function MarketIntelligencePage() {
  const { providers, events } = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-medium">Market Intelligence</h1>
        <p className="text-muted-foreground">
          Accepted providers and market events from the committed territory feed.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Tumor focus</TableHead>
            <TableHead>Incumbent</TableHead>
            <TableHead>Opportunity patients</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.npi}>
              <TableCell className="font-medium">
                <Link
                  to="/providers/$npi"
                  params={{ npi: provider.npi }}
                  className="underline-offset-4 hover:underline"
                >
                  {provider.full_name}
                </Link>
              </TableCell>
              <TableCell>{provider.org_name}</TableCell>
              <TableCell>{provider.primary_tumor_focus}</TableCell>
              <TableCell>
                <Badge variant="secondary">{provider.incumbent_lab}</Badge>
              </TableCell>
              <TableCell>{provider.opportunity_patients}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-medium">Market events</h2>
        <p className="text-muted-foreground">Why-now hooks by tumor type.</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Headline</TableHead>
              <TableHead>Tumor type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.event_id}>
                <TableCell className="whitespace-normal">
                  <Link
                    to="/market-intelligence/$eventId"
                    params={{ eventId: event.event_id }}
                    className="underline-offset-4 hover:underline"
                  >
                    {event.headline}
                  </Link>
                </TableCell>
                <TableCell>{event.tumor_type}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
