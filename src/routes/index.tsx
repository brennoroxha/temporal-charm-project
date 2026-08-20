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
por favor , corrija o erro na hora de gerar o pagamento, esta dando erro de credenciais , Client ID e Client Secret
    </div>
  );
}
