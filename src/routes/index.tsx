import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Project ready</CardTitle>
          <CardDescription>
            Your TanStack Start app is set up. Add components and start building.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">The design system is ready for the next screen.</p>
          <Button type="button">Continue</Button>
        </CardContent>
      </Card>
    </main>
  );
}
