# Plano de Implementação: Rastreamento UTMify + Meta (Pixel e CAPI)

Este plano detalha a implementação completa do fluxo de rastreamento, desde a captura de UTMs na landing page até a confirmação de pagamento via Conversions API, garantindo atribuição precisa e idempotência.

## Alterações Propostas

### 1. Infraestrutura e Banco de Dados
- Criar migração para adicionar campos de rastreamento na tabela `orders`:
  - `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
  - `gclid`, `fbclid`, `fbp`, `fbc`
  - `event_id` (para deduplicação Purchase)
  - `purchase_event_sent` (booleano para idempotência)

### 2. Captura Global e Scripts (Frontend)
- Atualizar `src/routes/__root.tsx` para incluir os scripts oficiais da UTMify e Meta Pixel no `<head>` de forma otimizada.
- Refinar `public/utmify-pixel.js` para garantir persistência robusta em `localStorage` e cookies (fbp/fbc).

### 3. Funil e Checkout
- **InitiateCheckout**: Disparar o evento no componente `CheckoutPage` (`src/routes/checkout.tsx`) com proteção contra re-renderizações usando `useEffect` e uma trava local/de sessão.
- **Persistência do Pedido**: Modificar `createFreepayPix` em `src/lib/freepay.functions.ts` para receber e salvar todos os dados de rastreamento (UTMs, GCLID, FBCLID, FBP, FBC, IP, UserAgent) no banco de dados.

### 4. Conversões e Webhooks (Backend)
- **Meta Conversions API (CAPI)**: Refinar `src/lib/facebook-capi.server.ts` para enviar o evento `Purchase` com todos os dados do usuário (hasheado) e `event_id` idêntico ao do navegador.
- **Idempotência**: Implementar trava no processamento do webhook (`src/routes/api/public/freepay-webhook.ts`) e na confirmação manual do admin (`src/lib/orders.functions.ts`) para que `Purchase` seja disparado exatamente uma vez por pedido pago.

### 5. Limpeza de Interface
- Remover o texto de teste "quantos usuarios chegaram até /loja" em `src/routes/index.tsx`, restaurando a lógica original de redirecionamento ou página em branco para cloaking.

## Detalhes Técnicos
- **Deduplicação**: Usar o `transaction_id` como `event_id` em ambos (Pixel e CAPI).
- **Segurança**: Chaves privadas (Meta Access Token, UTMify Token) mantidas exclusivamente no servidor.
- **Attestation**: O rastreamento de IP e User Agent será feito no servidor durante a criação do pedido e processamento do webhook para máxima precisão.

## Arquivos Afetados
- `src/routes/__root.tsx`: Scripts globais.
- `src/routes/checkout.tsx`: Evento InitiateCheckout e envio de metadados.
- `src/lib/freepay.functions.ts`: Salvamento de tracking no banco.
- `src/lib/orders.functions.ts`: Idempotência no admin.
- `src/routes/api/public/freepay-webhook.ts`: Lógica de disparo pós-pagamento.
- `src/lib/facebook-capi.server.ts`: Envio para Meta CAPI.
- `src/lib/utmify.server.ts`: Envio para UTMify Sale API.
- `src/routes/index.tsx`: Ajuste visual.
