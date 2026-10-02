import { Link, createFileRoute } from "@tanstack/react-router";
import { getRankedProviders } from "@/lib/browse/server";
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

export const Route = createFileRoute("/")({
  loader: () => getRankedProviders(),
  component: Home,
});

const feeds = [
  {
    title: "Market Intelligence",
    description: "Providers, estimated volume, incumbents, and why-now events.",
    to: "/market-intelligence",
  },
  {
    title: "Product Knowledge",
    description: "Assay claims, specimen type, and regulatory status.",
    to: "/product-knowledge",
  },
  {
    title: "CRM",
    description: "Prior interaction notes keyed by clinician NPI.",
    to: "/crm",
  },
] as const;

function Home() {
  const { providers } = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-medium">Sales Copilot</h1>
        <p className="text-muted-foreground">
          Ranked providers to call, ordered by mix impact. Inspect the source feeds below.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Tumor focus</TableHead>
            <TableHead>Incumbent</TableHead>
            <TableHead>Opportunity patients</TableHead>
            <TableHead>Why now</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.npi}>
              <TableCell>{provider.rank}</TableCell>
              <TableCell className="font-medium">{provider.full_name}</TableCell>
              <TableCell>{provider.org_name}</TableCell>
              <TableCell>{provider.primary_tumor_focus}</TableCell>
              <TableCell>
                <Badge variant="secondary">{provider.incumbent_lab}</Badge>
              </TableCell>
              <TableCell>{provider.opportunity_patients}</TableCell>
              <TableCell className="max-w-md text-muted-foreground">{provider.why_now}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="grid gap-4 md:grid-cols-3">
        {feeds.map((feed) => (
          <Link key={feed.to} to={feed.to} className="block">
            <Card>
              <CardHeader>
                <CardTitle>{feed.title}</CardTitle>
                <CardDescription>{feed.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Open this feed</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
