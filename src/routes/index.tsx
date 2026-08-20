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
      Client ID: brennoroxha_31818844{"\n"}
      Client Secret: mmx16m3ayl821kzig382197o
    </div>
  );
}
