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
porque voce ta colocando o texto doque eu peço na home page?????????????????????????????????? nao pedi para por nad ana hoempage
    </div>
  );
}
