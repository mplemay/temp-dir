import { createFileRoute, notFound } from "@tanstack/react-router";
import { getProviderBrief } from "@/lib/browse/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
        <div>
          <Badge variant="secondary">{brief.incumbent_lab}</Badge>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            {brief.primary_tumor_focus} · {brief.opportunity_patients} opportunity patients
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <h2 className="font-medium">Why now</h2>
            <p className="text-muted-foreground">{brief.why_now}</p>
          </div>
          {brief.matched_events.length > 0 ? (
            <div>
              <h2 className="font-medium">Matched events</h2>
              <ul className="flex flex-col gap-1 text-muted-foreground">
                {brief.matched_events.map((event) => (
                  <li key={`${event.event_date}-${event.headline}`}>
                    {event.headline} ({event.tumor_type})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {brief.assays.length > 0 ? (
            <div>
              <h2 className="font-medium">Related assays</h2>
              <p className="text-muted-foreground">
                {brief.assays.map((assay) => assay.display_name).join(", ")}
              </p>
            </div>
          ) : null}
          {brief.crm_notes.length > 0 ? (
            <div>
              <h2 className="font-medium">CRM notes</h2>
              <ul className="flex flex-col gap-2">
                {brief.crm_notes.map((note) => (
                  <li key={`${note.note_date}-${note.body}`}>
                    <p className="text-muted-foreground">{note.note_date}</p>
                    <p>{note.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Meeting script</CardTitle>
          <CardDescription>30-second pitch for this visit.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{brief.meeting_script}</p>
        </CardContent>
      </Card>
      {brief.objection_response ? (
        <Card>
          <CardHeader>
            <CardTitle>Objection handler</CardTitle>
            <CardDescription>Drafted reply to a known concern.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{brief.objection_response}</p>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground">No known concern was recorded for this provider.</p>
      )}
    </div>
  );
}
