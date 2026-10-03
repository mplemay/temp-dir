import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { getProviderBrief } from "@/lib/browse/server";
import { unpublishedMetric } from "@/lib/browse/display";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/providers/$npi")({
  loader: async ({ params }) => {
    const brief = await getProviderBrief({ data: { npi: params.npi } });
    if (!brief) {
      throw notFound();
    }
    return brief;
  },
  component: ProviderBriefPage,
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.full_name} · Sales Copilot` : "Sales Copilot" }],
  }),
});

function ProviderBriefPage() {
  const brief = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground">Rank {brief.rank}</p>
        <h1 className="font-heading text-2xl font-medium">{brief.full_name}</h1>
        <p className="text-muted-foreground">
          {brief.org_name} · {brief.specialty} · {brief.city}, {brief.state}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{brief.incumbent_lab}</Badge>
          <Badge variant="outline">{brief.readiness}</Badge>
          <Badge variant="outline">{brief.primary_tumor_focus}</Badge>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-lg font-medium">Meeting script</h2>
            <p className="text-muted-foreground">30-second pitch for this visit.</p>
            <p>{brief.meeting_script}</p>
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-lg font-medium">Objection handler</h2>
            {brief.objection_response ? (
              <>
                <p className="text-muted-foreground">Drafted reply to a known concern.</p>
                <p>{brief.objection_response}</p>
              </>
            ) : (
              <p className="text-muted-foreground">
                No known concern was recorded for this provider.
              </p>
            )}
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-lg font-medium">Why now</h2>
            <p className="text-muted-foreground">{brief.why_now}</p>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Rank</dt>
            <dd>{brief.rank}</dd>
            <dt className="text-muted-foreground">Impact score</dt>
            <dd>{brief.impact_score}</dd>
            <dt className="text-muted-foreground">Opportunity patients</dt>
            <dd>{brief.opportunity_patients}</dd>
            {brief.interest ? (
              <>
                <dt className="text-muted-foreground">Interest</dt>
                <dd>{brief.interest}</dd>
              </>
            ) : null}
            {brief.concern ? (
              <>
                <dt className="text-muted-foreground">Concern</dt>
                <dd>{brief.concern}</dd>
              </>
            ) : null}
          </dl>
          {brief.matched_events.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">Matched events</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Headline</TableHead>
                    <TableHead>Tumor type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brief.matched_events.map((event) => (
                    <TableRow key={`${event.event_date}-${event.headline}`}>
                      <TableCell className="whitespace-normal">{event.headline}</TableCell>
                      <TableCell>{event.tumor_type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
          {brief.assays.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">Related assays</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assay</TableHead>
                    <TableHead>TAT days</TableHead>
                    <TableHead>Gene count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brief.assays.map((assay) => (
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
                      <TableCell>{unpublishedMetric(assay.tat_days)}</TableCell>
                      <TableCell>{unpublishedMetric(assay.gene_count)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </section>
      </div>
      {brief.crm_notes.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">CRM notes</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brief.crm_notes.map((note) => (
                <TableRow key={`${note.note_date}-${note.body}`}>
                  <TableCell>{note.note_date}</TableCell>
                  <TableCell className="whitespace-normal">{note.body}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      ) : null}
    </div>
  );
}
