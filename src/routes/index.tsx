import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Celimax - Produtos" },
      { property: "og:title", content: "Celimax - Produtos" },
      { name: "twitter:title", content: "Celimax - Produtos" },
    ],
  }),
  component: Index,
});

function Index() {
  return null;
}
