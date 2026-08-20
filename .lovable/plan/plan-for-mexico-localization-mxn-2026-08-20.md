# Plan for Mexico Localization (MXN)

Adapt the project for the Mexican market, including language translation to Mexican Spanish, currency update to MXN, and adjustments to local formats.

## User Review Required

> [!IMPORTANT]
> The payment gateway (FreePay) currently uses BRL. I will update the frontend and server functions to use MXN, but you must ensure your FreePay account supports MXN transactions.

- Should we change the payment methods labels? (e.g., PIX is Brazilian; I will change it to 'Transferencia SPEI' or similar Mexican equivalent).
- Should I update the address fields to match Mexican standards (e.g., RFC instead of CPF, though I'll start with general labels)?

## Proposed Changes

### Localization & Currency
#### [Currency Logic]
- Rename `formatBRL` to `formatMXN` across the project.
- Update locale to `es-MX` and currency to `MXN`.
- Change all `R$` occurrences in `src/data/lojaProducts.ts` to `MX$`.

#### [Components & Routes]
- **`src/components/LojaHeader.tsx`**: Translate nav links (Categorias, Ofertas, etc.) and update geolocation default to "México".
- **`src/routes/loja.tsx`**: Translate UI labels (Resultados, Frete, Sem estoque).
- **`src/routes/produto.$slug.tsx`**: Translate shipping details, stock info, and review section. Update price formatting.
- **`src/routes/checkout.tsx`**: 
    - Translate steps (Identificación, Entrega, Pago).
    - Update document label from "CPF" to "CURP/RFC" (or generic "Documento").
    - Translate form labels and buttons.
- **`src/routes/pagamento.tsx`**:
    - Change PIX terminology to generic "Pago con Transferencia" or "Código de Pago".
    - Translate all instructions and status messages.
- **`src/routes/quiz.tsx`**: Translate all questions and options to Spanish.
- **`src/components/CartDrawer.tsx`**: Translate cart labels and total.

### Data Update
- **`src/data/lojaProducts.ts`**: Translate titles and ensure prices use MX$ symbol.
- **`src/data/lojaReviews.ts`**: Translate reviews to Spanish.

### Integration / Backend
- **`src/lib/freepay.functions.ts`**: Update currency to `MXN` in the payload sent to the gateway.
- **`src/lib/utmify.server.ts` & `src/lib/facebook-capi.server.ts`**: Update notification currency to `MXN`.

## Technical Details
- Use `toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })` for all price displays.
- Bulk find/replace for currency symbols.
- Systematic translation of string literals in TSX files.
