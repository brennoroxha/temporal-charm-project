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
garanta que o sistema, reconehça o pagamento e retorna a m ensagem de pago para o checkout pagamento-spei em nossa pagina
    </div>
  );
}
