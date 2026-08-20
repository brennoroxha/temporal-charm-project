import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oferta 25 Años" },
      { property: "og:title", content: "Oferta 25 Años" },
      { name: "twitter:title", content: "Oferta 25 Años" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
titulo das paginas mude para Oferta 25 Años
    </div>
  );
}
