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
em pagamento-spei deve nao deve ter o banner abaixo do header.

e remova da pagina por favor a função:

¿Ya realizaste el pago?

Adjunta tu comprobante para agilizar la validación.

Adjuntar comprobante
    </div>
  );
}
