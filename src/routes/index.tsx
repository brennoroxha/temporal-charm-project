import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ofertas 25 Anos" },
      { property: "og:title", content: "Ofertas 25 Anos" },
      { name: "twitter:title", content: "Ofertas 25 Anos" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
em pago,  a logo do SPEI ta quebrada, coloque esta por favor: https://cdn.worldvectorlogo.com/logos/spei-1.svg
    </div>
  );
}
