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
    <div className="p-4">
      vamos integrar o metodo de pagamento SPEI do mexico.
      <br /><br />
      Segue a documentação: https://xpag.global/pt/docs/cash-in-spei
    </div>
  );
}
