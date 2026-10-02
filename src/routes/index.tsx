import { Link, createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({ component: Home });

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
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-medium">Sales Copilot</h1>
        <p className="text-muted-foreground">
          Browse the committed Market Intelligence, Product Knowledge, and CRM feeds.
        </p>
      </div>
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
