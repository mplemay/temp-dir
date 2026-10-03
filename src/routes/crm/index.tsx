import { createFileRoute, Link } from "@tanstack/react-router";
import { getCrmNotes } from "@/lib/browse/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/crm/")({
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Clinician</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notes.map((note) => (
            <TableRow key={note.note_id}>
              <TableCell>
                <Link
                  to="/crm/$noteId"
                  params={{ noteId: note.note_id }}
                  className="underline-offset-4 hover:underline"
                >
                  {note.note_date}
                </Link>
              </TableCell>
              <TableCell>{note.clinician_name ?? note.npi}</TableCell>
              <TableCell className="whitespace-normal">{note.body}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
