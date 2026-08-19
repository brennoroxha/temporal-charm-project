# Plan - Deactivate Legacy Gateway and Enable FreePay Only

The user wants to completely deactivate the "Legacy" gateway and leave only "FreePay" active. This involves database updates to ensure all orders (including those > R$ 400 and split orders) use FreePay, and code cleanup to remove Legacy-specific logic.

## Proposed Changes

### Database Updates
- Update `public.gateways` to set `legacy` as inactive and `freepay` as active.
- Update `public.settings` for `split_gateways` to disable splitting and set `last_gateway` to `freepay`.

### Code Cleanup
- **Checkout Page (`src/routes/checkout.tsx`)**:
    - Remove the logic that splits orders between Legacy and FreePay.
    - Remove the `createLegacyPixFn` server function import and usage.
    - Simplify `goPay` to only use `createFreepayPixFn`.
- **Legacy Functions (`src/lib/legacy.functions.ts`)**:
    - Keep for now (to avoid breaking admin if it still references it), but ensure it's not called during checkout.
- **Admin Dashboard (`src/routes/_authenticated/admin.tsx`)**:
    - Update the "Gateways" tab if necessary to reflect the permanent choice, though the DB update should suffice for visibility.

## Technical Details
- SQL migration to update the gateway states.
- Refactor `src/routes/checkout.tsx` to remove the complex gateway selection logic.
- Ensure Utmify and Facebook CAPI notifications still work (they are triggered by the FreePay webhook).

## Verification Plan
- Check `public.gateways` and `public.settings` after migration.
- Perform a test checkout (if possible in sandbox) or verify code paths to ensure `createFreepayPixFn` is the only one reached.
