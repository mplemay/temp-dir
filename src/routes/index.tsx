import { createFileRoute } from "@tanstack/react-router";
import { RankedProvidersTable } from "@/components/ranked-providers-table";
import { getRankedProviders } from "@/lib/browse/server";

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
      <RankedProvidersTable providers={providers} />
    </div>
  );
}
