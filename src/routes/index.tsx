import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const HandRacer = lazy(() => import("@/components/HandRacer"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Neon Hand Racer — Steer With Your Hand" },
      {
        name: "description",
        content:
          "An endless neon racing game steered entirely by your webcam hand movement. No keyboard, no downloads.",
      },
      { property: "og:title", content: "Neon Hand Racer — Steer With Your Hand" },
      {
        property: "og:description",
        content: "Endless webcam-controlled racing: move your hand left and right to dodge traffic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <ClientOnly fallback={<p className="text-center text-muted-foreground">Loading…</p>}>
        <Suspense fallback={<p className="text-center text-muted-foreground">Loading…</p>}>
          <HandRacer />
        </Suspense>
      </ClientOnly>
    </main>
  );
}
