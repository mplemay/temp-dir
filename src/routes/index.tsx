import { Link, createFileRoute } from "@tanstack/react-router";
import { getRankedProviders } from "@/lib/browse/server";
import { Badge } from "@/components/ui/badge";
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

function Home() {
  const { providers } = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-medium">Sales Copilot</h1>
        <p className="text-muted-foreground">
          Ranked providers to call, ordered by mix impact. Open a name for the meeting brief.
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
              <TableCell className="max-w-md text-muted-foreground">{provider.why_now}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
