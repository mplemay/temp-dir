import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCrmNote } from "@/lib/browse/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/crm/$noteId")({
  loader: async ({ params }) => {
    const note = await getCrmNote({ data: { noteId: params.noteId } });
    if (!note) {
      throw notFound();
    }
    return note;
  },
  component: CrmNotePage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.clinician_name ?? loaderData.npi} · CRM`
          : "Sales Copilot",
      },
    ],
  }),
});

function formatChannel(value: string): string {
  return value.replaceAll("_", " ");
}

function CrmNotePage() {
  const note = Route.useLoaderData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground">{note.note_date}</p>
        <h1 className="font-heading text-2xl font-medium">{note.clinician_name ?? note.npi}</h1>
        <Badge variant="secondary">{formatChannel(note.channel)}</Badge>
      </div>
      <p className="whitespace-pre-wrap">{note.body}</p>
      {note.siblings.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-medium">Other notes</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {note.siblings.map((sibling) => (
                <TableRow key={sibling.note_id}>
                  <TableCell>
                    <Link
                      to="/crm/$noteId"
                      params={{ noteId: sibling.note_id }}
                      className="underline-offset-4 hover:underline"
                    >
                      {sibling.note_date}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-normal">{sibling.body}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
