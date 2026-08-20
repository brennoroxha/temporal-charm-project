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
      dando erro para gerar o pagamento{"\n"}
      confira novamente toda a documentação{"\n"}
      XPag respondió con un formato inválido (HTTP 404). Verifica la URL de la API y la clave configurada.{"\n"}
      https://xpag.global/pt/docs/cash-in-spei
    </div>
  );
}
