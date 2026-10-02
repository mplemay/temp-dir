import { createFileRoute } from "@tanstack/react-router";
import { getCrmNotes } from "@/lib/browse/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/crm")({
  loader: () => getCrmNotes(),
  component: CrmPage,
  head: () => ({
    meta: [{ title: "CRM" }],
  }),
});

function CrmPage() {
  const { notes } = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-medium">CRM</h1>
        <p className="text-muted-foreground">
          Prior interaction notes from the committed CRM feed.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {notes.map((note) => (
          <Card key={`${note.npi}-${note.note_date}-${note.body}`}>
            <CardHeader>
              <CardTitle>{note.clinician_name ?? note.npi}</CardTitle>
              <CardDescription>{note.note_date}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{note.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
