import { createFileRoute } from "@tanstack/react-router";
import { getMarketIntelligence } from "@/lib/browse/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/market-intelligence")({
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
              <TableCell className="font-medium">{provider.full_name}</TableCell>
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
      <Card>
        <CardHeader>
          <CardTitle>Market events</CardTitle>
          <CardDescription>Why-now hooks by tumor type.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {events.map((event) => (
            <div key={event.event_id} className="flex flex-col gap-1">
              <p className="font-medium">{event.headline}</p>
              <p className="text-muted-foreground">{event.tumor_type}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
